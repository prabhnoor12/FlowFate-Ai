// Slack Scheduled Message Worker
// Run this script periodically (e.g. with node-cron or as a background process)
import prisma from '../prisma/client.js';
import { getIntegrationToken } from '../services/integrationService.js';
import { sendSlackMessage } from '../integrations/slackIntegration.js';

async function processScheduledSlackMessages() {
  const now = new Date();
  // Find all unsent messages due to be sent
  const messages = await prisma.scheduledSlackMessage.findMany({
    where: {
      sent: false,
      sendAt: { lte: now },
    },
    include: { user: true },
  });

  for (const msg of messages) {
    try {
      // Get Slack token for the user and workspace (multi-workspace)
      const { getIntegrationTokenForTeam } = await import('../services/integrationService.js');
      const { accessToken } = await getIntegrationTokenForTeam(msg.userId, 'slack', msg.workspace);
      if (!accessToken) throw new Error('No Slack token for user/team');
      await sendSlackMessage({ accessToken, channel: msg.channel, text: msg.text });
      await prisma.scheduledSlackMessage.update({
        where: { id: msg.id },
        data: { sent: true },
      });
      console.log(`Sent scheduled Slack message (id=${msg.id})`);
    } catch (err) {
      console.error(`Failed to send scheduled Slack message (id=${msg.id}):`, err.message);
    }
  }
}

// Run once (for cron), or setInterval for polling
processScheduledSlackMessages().then(() => process.exit(0));
