import { Queue, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import { createNotionPage, updateNotionPage, appendNotionBlock } from '../utils/notionActions.js';
import { redis } from '../config/redis.js';

import { isIntegrationConnected, getIntegrationToken } from '../services/integrationService.js';
import { google } from 'googleapis';

const aiTaskQueue = new Queue('ai-tasks', { connection: redis });
const prisma = new PrismaClient();

async function processTask(job) {
  const { id, type, input } = job.data;
  try {
    // Example: summarize task
    if (type === 'summarize') {
      const prompt = `Summarize this: ${input.text}`;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 256,
        }),
      });
      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content || '';
      await prisma.task.update({
        where: { id },
        data: { output: { summary }, status: 'completed' },
      });
    }
    // Notion: create page
    if (type === 'notion_create_page') {
      const { userId, parentId, title, content } = input;
      try {
        const page = await createNotionPage(userId, parentId, title, content, { taskId: id });
        await prisma.task.update({
          where: { id },
          data: { output: { page }, status: 'completed' },
        });
      } catch (err) {
        if (err.code === 'NOTION_OAUTH_REQUIRED' || /notion.*integration.*not found/i.test(err.message)) {
          // Use the Notion OAuth URL from .env
          const notionOauthUrl = process.env.NOTION_OAUTH_URL || '/integrations/notion/auth';
          await prisma.task.update({
            where: { id },
            data: {
              status: 'action_required',
              output: {
                action: 'notion_oauth',
                message: `<a href="${notionOauthUrl}" target="_blank" rel="noopener noreferrer">Connect your Notion account</a> to enable Notion features.`,
                oauthUrl: notionOauthUrl
              }
            }
          });
        } else {
          await prisma.task.update({
            where: { id },
            data: { status: 'failed', output: { error: err.message } },
          });
        }
      }
      return;
    }
    // Notion: update page
    if (type === 'notion_update_page') {
      const { userId, pageId, properties } = input;
      try {
        const page = await updateNotionPage(userId, pageId, properties, { taskId: id });
        await prisma.task.update({
          where: { id },
          data: { output: { page }, status: 'completed' },
        });
      } catch (err) {
        if (err.code === 'NOTION_OAUTH_REQUIRED' || /notion.*integration.*not found/i.test(err.message)) {
          const notionOauthUrl = process.env.NOTION_OAUTH_URL || '/integrations/notion/auth';
          await prisma.task.update({
            where: { id },
            data: {
              status: 'action_required',
              output: {
                action: 'notion_oauth',
                message: `To get started with Notion, please connect your Notion account via OAuth. Here’s the link to do that: <a href="${notionOauthUrl}" target="_blank" rel="noopener noreferrer">Connect to Notion</a>. Once connected, let me know what you'd like to do!`,
                oauthUrl: notionOauthUrl
              }
            }
          });
        } else {
          await prisma.task.update({
            where: { id },
            data: { status: 'failed', output: { error: err.message } },
          });
        }
      }
      return;
    }
    // Notion: append block
    if (type === 'notion_append_block') {
      const { userId, blockId, content } = input;
      try {
        const block = await appendNotionBlock(userId, blockId, content, { taskId: id });
        await prisma.task.update({
          where: { id },
          data: { output: { block }, status: 'completed' },
        });
      } catch (err) {
        if (err.code === 'NOTION_OAUTH_REQUIRED' || /notion.*integration.*not found/i.test(err.message)) {
          const notionOauthUrl = process.env.NOTION_OAUTH_URL || '/integrations/notion/auth';
          await prisma.task.update({
            where: { id },
            data: {
              status: 'action_required',
              output: {
                action: 'notion_oauth',
                message: `To get started with Notion, please connect your Notion account via OAuth. Here’s the link to do that: <a href="${notionOauthUrl}" target="_blank" rel="noopener noreferrer">Connect to Notion</a>. Once connected, let me know what you'd like to do!`,
                oauthUrl: notionOauthUrl
              }
            }
          });
        } else {
          await prisma.task.update({
            where: { id },
            data: { status: 'failed', output: { error: err.message } },
          });
        }
      }
      return;
    }
    // Notion: prompt user to connect Notion (OAuth)
    if (type === 'notion_oauth_prompt') {
      // Mark the task as requiring user action
      const notionOauthUrl = process.env.NOTION_OAUTH_URL || '/integrations/notion/auth';
      await prisma.task.update({
        where: { id },
        data: {
          status: 'action_required',
          output: {
            action: 'notion_oauth',
            message: `To get started with Notion, please connect your Notion account via OAuth. Here’s the link to do that: <a href="${notionOauthUrl}" target="_blank" rel="noopener noreferrer">Connect to Notion</a>. Once connected, let me know what you'd like to do!`,
            oauthUrl: notionOauthUrl
          }
        }
      });
      return;
    }
    // Add more task types as needed
    // Gmail: send email
    if (type === 'gmail_send_email') {
      const { userId, to, subject, body } = input;
      // Check if Gmail is connected
      const connected = await isIntegrationConnected(userId, 'gmail');
      if (!connected) {
        const gmailOauthUrl = '/api/integrations/gmail/connect';
        await prisma.task.update({
          where: { id },
          data: {
            status: 'action_required',
            output: {
              action: 'gmail_oauth',
              message: `<a href="${gmailOauthUrl}" target="_blank" rel="noopener noreferrer">Connect your Gmail account</a> to enable Gmail features.`,
              oauthUrl: gmailOauthUrl
            }
          }
        });
        return;
      }
      // Get Gmail API client
      const tokenData = await getIntegrationToken(userId, 'gmail');
      const oAuth2Client = new google.auth.OAuth2();
      oAuth2Client.setCredentials({
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken
      });
      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
      // Construct raw email
      const messageParts = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        `Subject: ${subject}`,
        '',
        body,
      ];
      const rawMessage = Buffer.from(messageParts.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
      try {
        const response = await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: rawMessage },
        });
        await prisma.task.update({
          where: { id },
          data: { output: { emailId: response.data.id, status: 'sent' }, status: 'completed' },
        });
      } catch (err) {
        await prisma.task.update({
          where: { id },
          data: { status: 'failed', output: { error: err.message } },
        });
      }
      return;
    }
  } catch (error) {
    await prisma.task.update({
      where: { id },
      data: { status: 'failed', output: { error: error.message } },
    });
  }
}

new Worker('ai-tasks', processTask, { connection: redis });
export { aiTaskQueue };
