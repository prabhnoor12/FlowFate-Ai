// Handles meeting transcript jobs (ESM)
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
const prisma = new PrismaClient();

import { isIntegrationConnected, getIntegrationToken } from '../services/integrationService.js';
import { google } from 'googleapis';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

async function summarizeTranscript(transcript) {
  const prompt = `Summarize the following meeting transcript and extract action items:\n${transcript}`;
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 512,
    }),
  });
  if (!response.ok) throw new Error('OpenAI API error');
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Run the transcript job: find new transcripts, summarize, and notify (e.g., email)
 */
export async function runTranscriptJob() {
  try {
    // Find all transcripts not yet processed
    const transcripts = await prisma.transcript.findMany({ where: { processed: false } });
    let processedCount = 0;
    for (const t of transcripts) {
      // Summarize and extract action items
      const summary = await summarizeTranscript(t.text);
      // Save summary
      await prisma.transcript.update({
        where: { id: t.id },
        data: { summary, processed: true },
      });
      // Send summary via Gmail if connected
      const userId = t.userId;
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
            `To: ${t.email}`,
            'Content-Type: text/html; charset=utf-8',
            `Subject: Meeting Transcript Summary`,
            '',
            `<b>Summary:</b><br>${summary}`,
          ];
          const rawMessage = Buffer.from(messageParts.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
          await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: rawMessage },
          });
        } catch (err) {
          console.error(`Failed to send Gmail transcript for user ${userId}:`, err.message);
        }
      } else {
        console.log(`User ${userId} does not have Gmail connected. Skipping email.`);
      }
      processedCount++;
    }
    return { message: 'Transcript job executed', processedCount };
  } catch (error) {
    console.error('Transcript job error:', error);
    throw new Error('Failed to run transcript job');
  }
}
