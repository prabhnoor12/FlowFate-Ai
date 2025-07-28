// backend/routes/workflowRoutes.js
import express from 'express';
import * as workflowController from '../controllers/workflowController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, workflowController.createWorkflow);
router.get('/', auth, workflowController.listWorkflows);
router.get('/:id', auth, workflowController.getWorkflowById);
router.put('/:id', auth, workflowController.updateWorkflow);
router.delete('/:id', auth, workflowController.deleteWorkflow);

export default router;
