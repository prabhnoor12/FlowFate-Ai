const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automation_controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// List automations (with pagination/search)
router.get('/', automationController.getAutomations);
// Get single automation
router.get('/:id', automationController.getAutomationById);
// Create automation
router.post('/', automationController.createAutomation);
// Update automation (PUT = full)
router.put('/:id', automationController.updateAutomation);
// Partial update (PATCH)
router.patch('/:id', automationController.patchAutomation);
// Delete automation
router.delete('/:id', automationController.deleteAutomation);
// Duplicate automation
router.post('/:id/duplicate', automationController.duplicateAutomation);

module.exports = router;
