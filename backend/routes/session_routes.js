const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session_controller');
const { authenticate } = require('../middleware/auth');

// Create a new session (login alternative)
router.post('/', sessionController.createSession);
// Validate a session
router.post('/validate', sessionController.validateSession);
// Revoke a session (logout)
router.post('/revoke', sessionController.revokeSession);
// List all sessions for a user
router.post('/list', sessionController.listSessions);
// Revoke all sessions for a user
router.post('/revoke-all', sessionController.revokeAllSessions);
// Get current session info
router.post('/current', sessionController.getCurrentSession);
// Update session userAgent
router.post('/update-user-agent', sessionController.updateSessionUserAgent);

module.exports = router;
