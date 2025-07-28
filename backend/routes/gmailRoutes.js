import { Router } from 'express';
import { getGmailApiClient } from '../integrations/gmailIntegration.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// List user's Gmail messages
router.get('/messages', auth, async (req, res) => {
  try {
    const gmail = await getGmailApiClient(req.user.id);
    const messages = await gmail.users.messages.list({ userId: 'me', maxResults: 10 });
    res.json(messages.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send email via Gmail
router.post('/send', auth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing to, subject, or body' });
    }
    const gmail = await getGmailApiClient(req.user.id);
    // Construct raw email
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      `Subject: ${subject}`,
      '',
      body,
    ];
    const rawMessage = Buffer.from(messageParts.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });
    res.json({ id: response.data.id, status: 'sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
