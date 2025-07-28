import axios from 'axios';

/**
 * Exchange ClickUp OAuth code for access token
 */
async function exchangeClickUpCodeForToken({ clientId, clientSecret, code, redirectUri }) {
  const url = 'https://api.clickup.com/api/v2/oauth/token';
  const response = await axios.post(url, {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });
  return response.data;
}

/**
 * Get ClickUp user info
 */
async function getClickUpUserInfo(accessToken) {
  const response = await axios.get('https://api.clickup.com/api/v2/user', {
    headers: { Authorization: accessToken },
  });
  return response.data;
}

/**
 * List ClickUp tasks in a list
 */
async function listClickUpTasks({ accessToken, listId }) {
  const response = await axios.get(`https://api.clickup.com/api/v2/list/${listId}/task`, {
    headers: { Authorization: accessToken },
  });
  return response.data.tasks;
}

/**
 * Create a ClickUp task
 */
async function createClickUpTask({ accessToken, listId, name, description, due_date }) {
  const response = await axios.post(
    `https://api.clickup.com/api/v2/list/${listId}/task`,
    { name, description, due_date },
    { headers: { Authorization: accessToken } }
  );
  return response.data;
}

/**
 * Complete a ClickUp task
 */
async function completeClickUpTask({ accessToken, taskId }) {
  const response = await axios.put(
    `https://api.clickup.com/api/v2/task/${taskId}`,
    { status: 'complete' },
    { headers: { Authorization: accessToken } }
  );
  return response.data;
}

/**
 * Delete a ClickUp task
 */
async function deleteClickUpTask({ accessToken, taskId }) {
  const response = await axios.delete(
    `https://api.clickup.com/api/v2/task/${taskId}`,
    { headers: { Authorization: accessToken } }
  );
  return response.data;
}

/**
 * Update a ClickUp task
 */
async function updateClickUpTask({ accessToken, taskId, updates }) {
  const response = await axios.put(
    `https://api.clickup.com/api/v2/task/${taskId}`,
    updates,
    { headers: { Authorization: accessToken } }
  );
  return response.data;
}

/**
 * List ClickUp spaces for a team
 */
async function listClickUpSpaces({ accessToken, teamId }) {
  const response = await axios.get(`https://api.clickup.com/api/v2/team/${teamId}/space`, {
    headers: { Authorization: accessToken },
  });
  return response.data.spaces;
}

/**
 * List ClickUp lists in a space
 */
async function listClickUpLists({ accessToken, spaceId }) {
  const response = await axios.get(`https://api.clickup.com/api/v2/space/${spaceId}/list`, {
    headers: { Authorization: accessToken },
  });
  return response.data.lists;
}

export {
  exchangeClickUpCodeForToken,
  getClickUpUserInfo,
  listClickUpTasks,
  createClickUpTask,
  completeClickUpTask,
  deleteClickUpTask,
  updateClickUpTask,
  listClickUpSpaces,
  listClickUpLists,
};
