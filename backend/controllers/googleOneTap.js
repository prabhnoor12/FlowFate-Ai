// Google One Tap/Sign-In controller
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
// Single source of truth: GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const oauthClient = new OAuth2Client();

export async function googleOneTap(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Missing Google ID token.' });
    }

    // Ensure configuration present
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Server misconfigured: GOOGLE_CLIENT_ID not set.' });
    }

    // Verify Google ID token using Google Auth Library (handles signature, expiry, issuer)
    const ticket = await oauthClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google ID token.' });
    }
    // Audience check (defense-in-depth)
    if (payload.aud !== GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: 'Invalid Google ID token (audience mismatch).' });
    }

    // Find or create user (prefer googleId matching; fallback to email)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: payload.sub || undefined },
          { email: payload.email || undefined }
        ]
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: payload.name || payload.email || 'Google User',
          email: payload.email,
          avatar: payload.picture || null,
          googleId: payload.sub || null,
        }
      });
    } else {
      // Backfill googleId/avatar/name if missing or outdated
      const updates = {};
      if (!user.googleId && payload.sub) updates.googleId = payload.sub;
      if (!user.avatar && payload.picture) updates.avatar = payload.picture;
      if (!user.name && payload.name) updates.name = payload.name;
      if (Object.keys(updates).length) {
        user = await prisma.user.update({ where: { id: user.id }, data: updates });
      }
    }

    // Issue JWT
    const appToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      status: 'success',
      token: appToken,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
    });
  } catch (err) {
    // Distinguish verification errors
    const message = (err && err.message) || 'Google authentication failed.';
    if (/invalid|expired|malformed|audience|issuer|signature/i.test(message)) {
      return res.status(401).json({ error: 'Invalid Google ID token.' });
    }
    console.error('Google One Tap error:', err);
    res.status(500).json({ error: 'Google authentication failed.' });
  }
}
