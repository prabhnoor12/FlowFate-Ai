// Slack Integration Utility
// Handles sending messages to Slack using a user's stored access token
import axios from 'axios';

/**
 * Send a message to a Slack channel or user
 * @param {string} accessToken - Slack OAuth access token
 * @param {string} channel - Channel ID or user ID
 * @param {string} text - Message text
 * @returns {Promise<object>} - Slack API response
 */

/**
 * Send a message to a Slack channel or user
 */
export async function sendSlackMessage({ accessToken, channel, text }) {
  const url = 'https://slack.com/api/chat.postMessage';
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  const data = { channel, text };
  const response = await axios.post(url, data, { headers });
  if (!response.data.ok) {
    throw new Error(response.data.error || 'Failed to send Slack message');
  }
  return response.data;
}

/**
 * Get Slack user info for the authenticated user
 */
export async function getSlackUserInfo(accessToken) {
  const url = 'https://slack.com/api/users.identity';
  const headers = { 'Authorization': `Bearer ${accessToken}` };
  const response = await axios.get(url, { headers });
  if (!response.data.ok) {
    throw new Error(response.data.error || 'Failed to get Slack user info');
  }
  return response.data.user;
}

/**
 * List all channels the user has access to
 */
export async function listSlackChannels(accessToken) {
  const url = 'https://slack.com/api/conversations.list';
  const headers = { 'Authorization': `Bearer ${accessToken}` };
  const response = await axios.get(url, { headers });
  if (!response.data.ok) {
    throw new Error(response.data.error || 'Failed to list Slack channels');
  }
  return response.data.channels;
}

/**
 * Send a message with blocks (rich formatting)
 */
export async function sendSlackBlockMessage({ accessToken, channel, blocks, text }) {
  const url = 'https://slack.com/api/chat.postMessage';
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  const data = { channel, text, blocks };
  const response = await axios.post(url, data, { headers });
  if (!response.data.ok) {
    throw new Error(response.data.error || 'Failed to send Slack block message');
  }
  return response.data;
}
