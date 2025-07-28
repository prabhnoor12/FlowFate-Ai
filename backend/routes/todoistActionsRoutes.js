import express from 'express';
import { getIntegrationToken } from '../services/integrationService.js';
import {
  createTodoistTask,
  listTodoistTasks,
  listTodoistProjects,
  completeTodoistTask,
  deleteTodoistTask,
  updateTodoistTask
} from '../integrations/todoistIntegration.js';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// POST /api/todoist/create-task
router.post('/create-task', requireAuth, async (req, res) => {
  try {
    const { content, projectId } = req.body;
    if (!content) return res.status(400).json({ error: 'Missing content' });
    const { accessToken } = await getIntegrationToken(req.user.id, 'todoist');
    if (!accessToken) return res.status(400).json({ error: 'Todoist not connected' });
    const result = await createTodoistTask({ accessToken, content, projectId });
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/todoist/tasks
router.get('/tasks', requireAuth, async (req, res) => {
  try {
    const { accessToken } = await getIntegrationToken(req.user.id, 'todoist');
    if (!accessToken) return res.status(400).json({ error: 'Todoist not connected' });
    const tasks = await listTodoistTasks(accessToken);
    res.json({ ok: true, tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/todoist/projects
router.get('/projects', requireAuth, async (req, res) => {
  try {
    const { accessToken } = await getIntegrationToken(req.user.id, 'todoist');
    if (!accessToken) return res.status(400).json({ error: 'Todoist not connected' });
    const projects = await listTodoistProjects(accessToken);
    res.json({ ok: true, projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/todoist/complete-task
router.post('/complete-task', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ error: 'Missing taskId' });
    const { accessToken } = await getIntegrationToken(req.user.id, 'todoist');
    if (!accessToken) return res.status(400).json({ error: 'Todoist not connected' });
    await completeTodoistTask({ accessToken, taskId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/todoist/delete-task
router.delete('/delete-task', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ error: 'Missing taskId' });
    const { accessToken } = await getIntegrationToken(req.user.id, 'todoist');
    if (!accessToken) return res.status(400).json({ error: 'Todoist not connected' });
    await deleteTodoistTask({ accessToken, taskId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/todoist/update-task
router.patch('/update-task', requireAuth, async (req, res) => {
  try {
    const { taskId, updates } = req.body;
    if (!taskId || !updates) return res.status(400).json({ error: 'Missing taskId or updates' });
    const { accessToken } = await getIntegrationToken(req.user.id, 'todoist');
    if (!accessToken) return res.status(400).json({ error: 'Todoist not connected' });
    await updateTodoistTask({ accessToken, taskId, updates });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
