import express from 'express';
import {
  exchangeClickUpCodeForToken,
  getClickUpUserInfo,
  listClickUpTasks,
  createClickUpTask,
  completeClickUpTask,
  deleteClickUpTask,
  updateClickUpTask,
  listClickUpSpaces,
  listClickUpLists,
} from '../integrations/clickupIntegration.js';
import { storeIntegrationToken, getIntegrationToken, isIntegrationConnected } from '../services/integrationService.js';

const router = express.Router();

// 1. ClickUp OAuth: Redirect user to ClickUp
router.get('/connect', (req, res) => {
  const clientId = process.env.CLICKUP_CLIENT_ID;
  const redirectUri = process.env.ClICKUP_REDIRECT_URI || process.env.CLICKUP_REDIRECT_URI;
  const url = `https://app.clickup.com/api?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(url);
});

// 2. ClickUp OAuth callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.CLICKUP_CLIENT_ID;
  const clientSecret = process.env.CLICKUP_SECRET_ID;
  const redirectUri = process.env.ClICKUP_REDIRECT_URI || process.env.CLICKUP_REDIRECT_URI;
  try {
    const tokenData = await exchangeClickUpCodeForToken({ clientId, clientSecret, code, redirectUri });
    const userInfo = await getClickUpUserInfo(tokenData.access_token);
    // Store token for user
    await storeIntegrationToken(req.user.id, 'clickup', {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      userId: userInfo.user.id,
      teamId: userInfo.user.teams[0]?.id,
    });
    res.send('ClickUp connected! You can close this window.');
  } catch (err) {
    res.status(400).send('ClickUp OAuth failed: ' + err.message);
  }
});

// 3. List ClickUp spaces
router.get('/spaces', async (req, res) => {
  try {
    const { accessToken, teamId } = await getIntegrationToken(req.user.id, 'clickup');
    const spaces = await listClickUpSpaces({ accessToken, teamId });
    res.json(spaces);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. List ClickUp lists in a space
router.get('/lists/:spaceId', async (req, res) => {
  try {
    const { accessToken } = await getIntegrationToken(req.user.id, 'clickup');
    const lists = await listClickUpLists({ accessToken, spaceId: req.params.spaceId });
    res.json(lists);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. List ClickUp tasks in a list
router.get('/tasks/:listId', async (req, res) => {
  try {
    const { accessToken } = await getIntegrationToken(req.user.id, 'clickup');
    const tasks = await listClickUpTasks({ accessToken, listId: req.params.listId });
    res.json(tasks);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Create ClickUp task
router.post('/tasks/:listId', async (req, res) => {
  try {
    const { accessToken } = await getIntegrationToken(req.user.id, 'clickup');
    const { name, description, due_date } = req.body;
    const task = await createClickUpTask({ accessToken, listId: req.params.listId, name, description, due_date });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 7. Complete ClickUp task
router.post('/tasks/:taskId/complete', async (req, res) => {
  try {
    const { accessToken } = await getIntegrationToken(req.user.id, 'clickup');
    const task = await completeClickUpTask({ accessToken, taskId: req.params.taskId });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 8. Delete ClickUp task
router.delete('/tasks/:taskId', async (req, res) => {
  try {
    const { accessToken } = await getIntegrationToken(req.user.id, 'clickup');
    const result = await deleteClickUpTask({ accessToken, taskId: req.params.taskId });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 9. Update ClickUp task
router.put('/tasks/:taskId', async (req, res) => {
  try {
    const { accessToken } = await getIntegrationToken(req.user.id, 'clickup');
    const updates = req.body;
    const task = await updateClickUpTask({ accessToken, taskId: req.params.taskId, updates });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
