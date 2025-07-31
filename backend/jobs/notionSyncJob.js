// Notion Sync Job: Polls Notion for changes and pushes local changes
import { pollNotionForChanges, pushLocalChangeToNotion, logSyncEvent, resolveSyncConflict } from '../services/notionService.js';
import axios from 'axios';
import logger from '../utils/logger.js';
import config from '../config/index.js';

// Fetch the list of Notion resources (pages/databases) each user has selected to sync
import { getUserSyncTargets } from '../services/userService.js';

// getUserSyncTargets should return an array of { userId, resourceId, resourceType, lastSync }


async function withRetry(fn, maxRetries, retryDelayMs) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) throw err;
      logger.warn(`[SyncJob] Retrying after error: ${err.message || err}`);
      await new Promise(res => setTimeout(res, retryDelayMs));
    }
  }
}

export async function runNotionSyncJob() {
  logger.info('[SyncJob] Starting Notion sync job');
  const syncTargets = await getUserSyncTargets();
  for (const target of syncTargets) {
    try {
      const { userId, resourceId, resourceType, lastSync } = target;
      // Fetch property mapping for this user/workspace/database (if any)
      let propertyMapping = {};
      try {
        const mappingRes = await axios.get('https://localhost:4000/api/notion-mapping/property-mapping', {
          params: { userId, workspaceId: target.workspaceId, databaseId: resourceId }
        });
        propertyMapping = mappingRes.data.mapping || {};
      } catch (err) {
        logger.warn('[SyncJob] No property mapping found or failed to fetch', { userId, resourceId });
      }

      // Fetch automations for this user/workspace
      let automations = [];
      try {
        const autoRes = await axios.get('https://localhost:4000/api/notion-mapping/automation', {
          params: { userId, workspaceId: target.workspaceId }
        });
        automations = autoRes.data.automations || [];
      } catch (err) {
        logger.warn('[SyncJob] No automations found or failed to fetch', { userId });
      }

      // Robust polling with pagination and retry
      let allChanges = [];
      let nextCursor = undefined;
      do {
        try {
          const { changes, nextCursor: newCursor } = await withRetry(
            () => pollNotionForChanges(userId, resourceId, resourceType, nextCursor, lastSync, config.notionSync.pageSize),
            config.notionSync.maxRetries,
            config.notionSync.retryDelayMs
          );
          allChanges = allChanges.concat(changes);
          nextCursor = newCursor;
        } catch (err) {
          // Handle Notion permission errors gracefully
          if (err.message && (err.message.includes('permission') || err.message.includes('unauthorized'))) {
            logger.warn(`[SyncJob] Skipping resource due to Notion permission error`, { userId, resourceId, error: err.message });
            break;
          } else {
            throw err;
          }
        }
      } while (nextCursor);

      if (allChanges.length > 0) {
        logger.info(`[SyncJob] Detected ${allChanges.length} changes in Notion`, { userId, resourceId });
        logSyncEvent(userId, 'notion_changes_detected', { resourceId, count: allChanges.length });
        for (const remoteObj of allChanges) {
          // TODO: Fetch localObj from your DB/storage by remoteObj.id
          const localObj = null; // Replace with actual fetch
          let resolved;
          if (localObj) {
            resolved = resolveSyncConflict(localObj, remoteObj);
            if (resolved === localObj) {
              logSyncEvent(userId, 'conflict_resolved', { resourceId, objectId: remoteObj.id, winner: 'local' });
              // Optionally push localObj to Notion
              // await pushLocalChangeToNotion(userId, { type: ..., action: 'update', data: ... });
            } else {
              logSyncEvent(userId, 'conflict_resolved', { resourceId, objectId: remoteObj.id, winner: 'remote' });
              // Optionally update local DB with remoteObj
            }
          } else {
            // No local version, treat as new/updated from Notion
            logSyncEvent(userId, 'notion_object_new_or_updated', { resourceId, objectId: remoteObj.id });
            // Optionally insert/update in local DB
          }

          // --- Apply property mapping here if needed ---
          // Example: const mappedObj = applyPropertyMapping(remoteObj, propertyMapping);

          // --- Check automations and trigger actions if needed ---
          // Example: for (const automation of automations) { if (automation.trigger matches remoteObj) { /* fire action */ } }
        }
      }
      // Example: Push local changes to Notion (implement actual local change fetch)
      // const localChanges = getLocalChangesSince(lastSync, resourceId);
      // for (const change of localChanges) {
      //   const result = await pushLocalChangeToNotion(userId, change);
      //   logSyncEvent(userId, 'local_change_pushed', { resourceId, change, result });
      // }
      // Update lastSync timestamp in DB/config
    } catch (err) {
      logger.error('[SyncJob] Error syncing Notion', { error: err.message, target });
    }
  }
  logger.info('[SyncJob] Notion sync job complete');
}

// To schedule: import and call runNotionSyncJob() in your scheduler (e.g., node-cron, agenda, etc.)
