// backend/routes/dashboardRoutes.js
import express from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/dashboard
router.get('/', auth, getDashboard);

export default router;
