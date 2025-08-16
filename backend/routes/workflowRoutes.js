
import express from 'express';
import {
	createWorkflow,
	listWorkflows,
	getWorkflowById,
	updateWorkflow,
	deleteWorkflow,
	executeWorkflow,
	getWorkflowStatus
} from '../controllers/workflowController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, createWorkflow);
router.get('/', auth, listWorkflows);
router.get('/:id', auth, getWorkflowById);
router.put('/:id', auth, updateWorkflow);
router.delete('/:id', auth, deleteWorkflow);
router.post('/:id/execute', auth, executeWorkflow);
router.get('/:id/status', auth, getWorkflowStatus);

export default router;
