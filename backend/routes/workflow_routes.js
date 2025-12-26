const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflow_controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// List workflows (with pagination/search)
router.get('/', workflowController.getWorkflows);
// Get single workflow
router.get('/:id', workflowController.getWorkflowById);
// Create workflow
router.post('/', workflowController.createWorkflow);
// Update workflow (PUT = full)
router.put('/:id', workflowController.updateWorkflow);
// Partial update (PATCH)
router.patch('/:id', workflowController.patchWorkflow);
// Delete workflow
router.delete('/:id', workflowController.deleteWorkflow);
// Duplicate workflow
router.post('/:id/duplicate', workflowController.duplicateWorkflow);

module.exports = router;
