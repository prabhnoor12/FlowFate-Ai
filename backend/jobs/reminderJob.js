// Handles recurring jobs (e.g., reminders) (ESM)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { isIntegrationConnected, getIntegrationToken } from '../services/integrationService.js';
import { google } from 'googleapis';

/**
 * Run the reminder job: find due reminders and send notifications (e.g., email)
 */
export async function runReminderJob() {
  try {
    // Find all reminders due now or in the past and not yet sent
    const now = new Date();
    const reminders = await prisma.reminder.findMany({
      where: {
        dueAt: { lte: now },
        sent: false,
      },
    });
    let sentCount = 0;
    for (const reminder of reminders) {
      // Send email via Gmail if connected
      const userId = reminder.userId;
      const connected = await isIntegrationConnected(userId, 'gmail');
      if (connected) {
        try {
          const tokenData = await getIntegrationToken(userId, 'gmail');
          const oAuth2Client = new google.auth.OAuth2();
          oAuth2Client.setCredentials({
            access_token: tokenData.accessToken,
            refresh_token: tokenData.refreshToken
          });
          const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
          const messageParts = [
            `To: ${reminder.email}`,
            'Content-Type: text/html; charset=utf-8',
            `Subject: Reminder: ${reminder.title}`,
            '',
            reminder.body || 'You have a reminder due.',
          ];
          const rawMessage = Buffer.from(messageParts.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
          await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: rawMessage },
          });
        } catch (err) {
          console.error(`Failed to send Gmail reminder for user ${userId}:`, err.message);
        }
      } else {
        console.log(`User ${userId} does not have Gmail connected. Skipping email.`);
      }
      // Mark as sent
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { sent: true },
      });
      sentCount++;
    }
    return { message: `Reminder job executed`, sentCount };
  } catch (error) {
    console.error('Reminder job error:', error);
    throw new Error('Failed to run reminder job');
  }
}
