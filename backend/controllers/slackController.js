
import { tool } from '@openai/agents';
import { z } from 'zod';

// Tool: Connect Slack (shows OAuth link if not connected)
export const connectSlack = tool({
  name: 'connect_slack',
  description: 'Prompt the user to connect Slack if not already connected. Use for any Slack-related intent if not connected.',
  parameters: z.object({}),
  async execute(_, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected } = await import('../services/integrationService.js');
    // Build the full Slack OAuth URL using env vars
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.SLACK_REDIRECT_URI);
    const scopes = [
      'chat:write',
      'channels:read',
      'users:read',
      'channels:join',
      'groups:read',
      'im:write',
      'mpim:write'
    ].join(',');
    const oauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}`;
    if (!userId || !(await isIntegrationConnected(userId, 'slack'))) {
      return `<div style='font-size:1.1em;'><b>🚀 Connect Slack to FlowFate!</b><br>To unlock powerful Slack automations, <a href="${oauthUrl}" target="_blank" rel="noopener noreferrer" data-integration="slack" style="color:#4ea8de;font-weight:bold;">click here to connect your Slack account</a>.<br><i>Once connected, you can send messages, automate channels, and more—right from FlowFate!</i></div>`;
    }
    // If already connected, show a branded confirmation message
    return `<div style='font-size:1.1em;'><b>✅ Slack is already connected!</b><br>Your Slack account is linked to FlowFate.<br><i>You can now send messages, automate channels, and more—right from FlowFate!</i></div>`;
  },
  errorFunction: (ctx, error) => `Failed to check Slack connection: ${error.message}`,
});

// Tool: Send Slack Message (production-ready)
export const sendSlackMessage = tool({
  name: 'send_slack_message',
  description: 'Send a message to a Slack channel or user. Only available if Slack is connected.',
  parameters: z.object({
    channel: z.string().min(1),
    message: z.string().min(1),
  }),
  async execute({ channel, message }, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected, getIntegrationToken } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'slack'))) {
      const oauthUrl = '/api/integration/slack/connect';
      return `To use Slack features, please <a href="${oauthUrl}" target="_blank" rel="noopener noreferrer" data-integration="slack">connect your Slack account</a>. Once connected, you can use Slack actions here!`;
    }
    // Send message to Slack using stored token
    const { accessToken } = await getIntegrationToken(userId, 'slack');
    if (!accessToken) {
      return `Slack account not connected. Please <a href="/api/integration/slack/connect" target="_blank" rel="noopener noreferrer" data-integration="slack">connect your Slack account</a> first.`;
    }
    const { sendSlackMessage } = await import('../integrations/slackIntegration.js');
    await sendSlackMessage({ accessToken, channel, text: message });
    return `Slack message sent to ${channel}.`;
  },
  errorFunction: (ctx, error) => `Failed to send Slack message: ${error.message}`,
});
