import { Router } from 'express';
import { getDriveApiClient } from '../integrations/driveIntegration.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// List user's Drive files
router.get('/files', auth, async (req, res) => {
  try {
    const drive = await getDriveApiClient(req.user.id);
    const files = await drive.files.list({ pageSize: 10 });
    res.json({ files: files.data.files || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
