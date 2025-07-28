/**
 * List all Todoist projects
 */
export async function listTodoistProjects(accessToken) {
  const url = 'https://api.todoist.com/rest/v2/projects';
  const headers = { 'Authorization': `Bearer ${accessToken}` };
  const response = await axios.get(url, { headers });
  return response.data;
}

/**
 * Complete a Todoist task
 */
export async function completeTodoistTask({ accessToken, taskId }) {
  const url = `https://api.todoist.com/rest/v2/tasks/${taskId}/close`;
  const headers = { 'Authorization': `Bearer ${accessToken}` };
  const response = await axios.post(url, {}, { headers });
  return response.data;
}

/**
 * Delete a Todoist task
 */
export async function deleteTodoistTask({ accessToken, taskId }) {
  const url = `https://api.todoist.com/rest/v2/tasks/${taskId}`;
  const headers = { 'Authorization': `Bearer ${accessToken}` };
  const response = await axios.delete(url, { headers });
  return response.data;
}

/**
 * Update a Todoist task (content, due date, etc.)
 */
export async function updateTodoistTask({ accessToken, taskId, updates }) {
  const url = `https://api.todoist.com/rest/v2/tasks/${taskId}`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  const response = await axios.post(url, updates, { headers });
  return response.data;
}
// Todoist Integration Utility
// Handles Todoist API actions using a user's stored access token
import axios from 'axios';

/**
 * Create a new Todoist task
 * @param {string} accessToken - Todoist OAuth access token
 * @param {string} content - Task content
 * @param {string} [projectId] - Optional project ID
 * @returns {Promise<object>} - Todoist API response
 */
export async function createTodoistTask({ accessToken, content, projectId }) {
  const url = 'https://api.todoist.com/rest/v2/tasks';
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  const data = { content };
  if (projectId) data.project_id = projectId;
  const response = await axios.post(url, data, { headers });
  return response.data;
}

/**
 * List all Todoist tasks
 */
export async function listTodoistTasks(accessToken) {
  const url = 'https://api.todoist.com/rest/v2/tasks';
  const headers = { 'Authorization': `Bearer ${accessToken}` };
  const response = await axios.get(url, { headers });
  return response.data;
}
