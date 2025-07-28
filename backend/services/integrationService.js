// Retrieve a user's integration token for a specific team (multi-workspace)
async function getIntegrationTokenForTeam(userId, provider, teamId) {
  try {
    const record = await prisma.userIntegration.findUnique({
      where: { userId_provider_teamId: { userId: Number(userId), provider, teamId } },
    });
    if (!record) return null;
    return {
      accessToken: decryptToken(record.accessToken),
      refreshToken: record.refreshToken ? decryptToken(record.refreshToken) : undefined,
    };
  } catch (err) {
    throw new Error('Failed to get integration token for team: ' + err.message);
  }
}
// Generic Integration Service for all OAuth providers (Notion, Gmail, Google Drive, Calendar)
import prisma from '../prisma/client.js';
import { encryptToken, decryptToken } from '../utils/tokenCrypto.js';

// Store or update an integration token for a user
async function storeIntegrationToken(userId, provider, tokenData) {
  try {
    const encrypted = {
      accessToken: encryptToken(tokenData.accessToken),
      refreshToken: tokenData.refreshToken ? encryptToken(tokenData.refreshToken) : undefined,
      teamId: tokenData.teamId || undefined,
      teamName: tokenData.teamName || undefined,
    };
    await prisma.userIntegration.upsert({
      where: { userId_provider_teamId: { userId: Number(userId), provider, teamId: tokenData.teamId || null } },
      update: encrypted,
      create: {
        userId: Number(userId),
        provider,
        ...encrypted,
      },
    });
  } catch (err) {
    throw new Error('Failed to store integration token: ' + err.message);
  }
}

// Retrieve a user's integration token
async function getIntegrationToken(userId, provider) {
  try {
    const record = await prisma.userIntegration.findUnique({
      where: { userId_provider: { userId: Number(userId), provider } },
    });
    if (!record) return null;
    return {
      accessToken: decryptToken(record.accessToken),
      refreshToken: record.refreshToken ? decryptToken(record.refreshToken) : undefined,
    };
  } catch (err) {
    throw new Error('Failed to get integration token: ' + err.message);
  }
}

// Check if a user has connected a given integration
async function isIntegrationConnected(userId, provider) {
  try {
    const token = await getIntegrationToken(userId, provider);
    return !!(token && token.accessToken);
  } catch (err) {
    return false;
  }
}

// List all connected integrations for a user
async function listConnectedIntegrations(userId) {
  try {
    const records = await prisma.userIntegration.findMany({
      where: { userId: Number(userId) }
    });
    const integrations = {};
    for (const rec of records) {
      integrations[rec.provider] = !!(rec.accessToken);
    }
    return integrations;
  } catch (err) {
    throw new Error('Failed to list connected integrations: ' + err.message);
  }
}

// Refresh an integration token if expired (stub, expand per provider)
async function refreshIntegrationToken(provider, refreshToken) {
  // Implement provider-specific refresh logic here
  throw new Error('Token refresh not implemented for provider: ' + provider);
}

export {
  storeIntegrationToken,
  getIntegrationToken,
  getIntegrationTokenForTeam,
  refreshIntegrationToken,
  isIntegrationConnected,
  listConnectedIntegrations
};


