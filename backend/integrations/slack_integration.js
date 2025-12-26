// Slack Integration for Automation and Workflows
// This module provides functions to interact with Slack API for sending messages and automating workflows.
// Dependencies: @slack/web-api (install with `npm install @slack/web-api`)

const { WebClient } = require('@slack/web-api');
const logger = require('../utils/logger');

// Initialize Slack client with bot token
if (!process.env.SLACK_BOT_TOKEN) {
  logger && logger.error
    ? logger.error('SLACK_BOT_TOKEN is not set in environment variables.')
    : console.error('SLACK_BOT_TOKEN is not set in environment variables.');
}
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// Send a message to a Slack channel
async function sendMessage(channel, text, blocks = undefined) {
  try {
    const payload = {
      channel,
      text,
    };
    if (blocks) payload.blocks = blocks;
    return await slack.chat.postMessage(payload);
  } catch (error) {
    logger && logger.error
      ? logger.error(`Failed to send Slack message: ${error.message}`)
      : console.error(`Failed to send Slack message: ${error.message}`);
    throw error;
  }
}

// Get user info by user ID
async function getUserInfo(userId) {
  try {
    return await slack.users.info({ user: userId });
  } catch (error) {
    logger && logger.error
      ? logger.error(`Failed to get Slack user info: ${error.message}`)
      : console.error(`Failed to get Slack user info: ${error.message}`);
    throw error;
  }
}

// List all channels in the workspace
async function listChannels() {
  try {
    const res = await slack.conversations.list();
    return res.channels || [];
  } catch (error) {
    logger && logger.error
      ? logger.error(`Failed to list Slack channels: ${error.message}`)
      : console.error(`Failed to list Slack channels: ${error.message}`);
    throw error;
  }
}

// Utility: Invite a user to a channel
async function inviteUserToChannel(channel, user) {
  try {
    return await slack.conversations.invite({ channel, users: user });
  } catch (error) {
    logger && logger.error
      ? logger.error(`Failed to invite user to Slack channel: ${error.message}`)
      : console.error(`Failed to invite user to Slack channel: ${error.message}`);
    throw error;
  }
}

module.exports = {
  sendMessage,
  getUserInfo,
  listChannels,
  inviteUserToChannel,
};
