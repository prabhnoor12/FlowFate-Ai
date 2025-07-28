// backend/routes/nlTaskRoutes.js
import express from 'express';
import { parseAndCreateFromNL } from '../controllers/nlTaskController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/parse-task', auth, parseAndCreateFromNL);

export default router;
