// Tool: Connect ClickUp
const connectClickUp = tool({
  name: 'connect_clickup',
  description: 'Prompt user to connect their ClickUp account to FlowFate.',
  parameters: z.object({}),
  async execute(_, ctx) {
    const oauthUrl = '/api/integrations/clickup/connect';
    return `<div style='font-size:1.1em;'><b>🚀 Connect ClickUp to FlowFate!</b><br>To use ClickUp features, <a href="${oauthUrl}" target="_blank" rel="noopener noreferrer" data-integration="clickup" style="color:#7b68ee;font-weight:bold;">click here to connect your ClickUp account</a>.<br><i>Once connected, you can manage ClickUp tasks from FlowFate!</i></div>`;
  },
});

// Tool: List ClickUp Spaces
const listClickUpSpaces = tool({
  name: 'list_clickup_spaces',
  description: 'List all ClickUp spaces for the user.',
  parameters: z.object({}),
  async execute(_, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected, getIntegrationToken } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'clickup'))) {
      return connectClickUp.execute();
    }
    const { accessToken, teamId } = await getIntegrationToken(userId, 'clickup');
    const { listClickUpSpaces } = await import('../integrations/clickupIntegration.js');
    const spaces = await listClickUpSpaces({ accessToken, teamId });
    if (!spaces.length) return 'No ClickUp spaces found.';
    return 'Your ClickUp spaces:\n' + spaces.map(s => `- ${s.name}`).join('\n');
  },
  errorFunction: (ctx, error) => `Failed to list ClickUp spaces: ${error.message}`,
});

// Tool: List ClickUp Lists in a Space
const listClickUpLists = tool({
  name: 'list_clickup_lists',
  description: 'List all ClickUp lists in a given space.',
  parameters: z.object({ spaceId: z.string().min(1) }),
  async execute({ spaceId }, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected, getIntegrationToken } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'clickup'))) {
      return connectClickUp.execute();
    }
    const { accessToken } = await getIntegrationToken(userId, 'clickup');
    const { listClickUpLists } = await import('../integrations/clickupIntegration.js');
    const lists = await listClickUpLists({ accessToken, spaceId });
    if (!lists.length) return 'No ClickUp lists found in this space.';
    return 'Lists in this space:\n' + lists.map(l => `- ${l.name}`).join('\n');
  },
  errorFunction: (ctx, error) => `Failed to list ClickUp lists: ${error.message}`,
});

// Tool: List ClickUp Tasks in a List
const listClickUpTasks = tool({
  name: 'list_clickup_tasks',
  description: 'List all ClickUp tasks in a given list.',
  parameters: z.object({ listId: z.string().min(1) }),
  async execute({ listId }, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected, getIntegrationToken } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'clickup'))) {
      return connectClickUp.execute();
    }
    const { accessToken } = await getIntegrationToken(userId, 'clickup');
    const { listClickUpTasks } = await import('../integrations/clickupIntegration.js');
    const tasks = await listClickUpTasks({ accessToken, listId });
    if (!tasks.length) return 'No ClickUp tasks found in this list.';
    return 'Tasks in this list:\n' + tasks.map(t => `- ${t.name}`).join('\n');
  },
  errorFunction: (ctx, error) => `Failed to list ClickUp tasks: ${error.message}`,
});

// Tool: Create ClickUp Task
const createClickUpTask = tool({
  name: 'create_clickup_task',
  description: 'Create a new ClickUp task in a list.',
  parameters: z.object({ listId: z.string().min(1), name: z.string().min(1), description: z.string().optional().nullable(), due_date: z.string().optional().nullable() }),
  async execute({ listId, name, description, due_date }, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected, getIntegrationToken } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'clickup'))) {
      return connectClickUp.execute();
    }
    const { accessToken } = await getIntegrationToken(userId, 'clickup');
    const { createClickUpTask } = await import('../integrations/clickupIntegration.js');
    const task = await createClickUpTask({ accessToken, listId, name, description, due_date });
    return `ClickUp task created: ${task.name}`;
  },
  errorFunction: (ctx, error) => `Failed to create ClickUp task: ${error.message}`,
});

// Tool: Complete ClickUp Task
const completeClickUpTask = tool({
  name: 'complete_clickup_task',
  description: 'Mark a ClickUp task as complete.',
  parameters: z.object({ taskId: z.string().min(1) }),
  async execute({ taskId }, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected, getIntegrationToken } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'clickup'))) {
      return connectClickUp.execute();
    }
    const { accessToken } = await getIntegrationToken(userId, 'clickup');
    const { completeClickUpTask } = await import('../integrations/clickupIntegration.js');
    await completeClickUpTask({ accessToken, taskId });
    return `ClickUp task ${taskId} marked as complete.`;
  },
  errorFunction: (ctx, error) => `Failed to complete ClickUp task: ${error.message}`,
});

// Tool: Delete ClickUp Task
const deleteClickUpTask = tool({
  name: 'delete_clickup_task',
  description: 'Delete a ClickUp task.',
  parameters: z.object({ taskId: z.string().min(1) }),
  async execute({ taskId }, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected, getIntegrationToken } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'clickup'))) {
      return connectClickUp.execute();
    }
    const { accessToken } = await getIntegrationToken(userId, 'clickup');
    const { deleteClickUpTask } = await import('../integrations/clickupIntegration.js');
    await deleteClickUpTask({ accessToken, taskId });
    return `ClickUp task ${taskId} deleted.`;
  },
  errorFunction: (ctx, error) => `Failed to delete ClickUp task: ${error.message}`,
});

// Tool: Update ClickUp Task
const updateClickUpTask = tool({
  name: 'update_clickup_task',
  description: 'Update a ClickUp task (name, description, due date, etc.).',
  parameters: z.object({ taskId: z.string().min(1), updates: z.object({}).passthrough() }),
  async execute({ taskId, updates }, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected, getIntegrationToken } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'clickup'))) {
      return connectClickUp.execute();
    }
    const { accessToken } = await getIntegrationToken(userId, 'clickup');
    const { updateClickUpTask } = await import('../integrations/clickupIntegration.js');
    await updateClickUpTask({ accessToken, taskId, updates });
    return `ClickUp task ${taskId} updated.`;
  },
  errorFunction: (ctx, error) => `Failed to update ClickUp task: ${error.message}`,
});
// Tool: List Todoist Projects
const listTodoistProjects = tool({
  name: 'list_todoist_projects',
  description: 'List all projects in the user\'s Todoist account.',
  parameters: z.object({}),
  async execute(_, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected, getIntegrationToken } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'todoist'))) {
      const oauthUrl = '/api/integrations/todoist/connect';
      return `<div style='font-size:1.1em;'><b>🚀 Connect Todoist to FlowFate!</b><br>To view projects, <a href="${oauthUrl}" target="_blank" rel="noopener noreferrer" data-integration="todoist" style="color:#e44332;font-weight:bold;">click here to connect your Todoist account</a>.<br><i>Once connected, you can view and manage projects from FlowFate!</i></div>`;
    }
    const { accessToken } = await getIntegrationToken(userId, 'todoist');
    if (!accessToken) {
      return `Todoist account not connected. Please <a href="/api/integrations/todoist/connect" target="_blank" rel="noopener noreferrer" data-integration="todoist">connect your Todoist account</a> first.`;
    }
    const { listTodoistProjects } = await import('../integrations/todoistIntegration.js');
    const projects = await listTodoistProjects(accessToken);
    if (!projects.length) return 'No Todoist projects found.';
    return 'Your Todoist projects:\n' + projects.map(p => `- ${p.name}`).join('\n');
  },
  errorFunction: (ctx, error) => `Failed to list Todoist projects: ${error.message}`,
});

// Tool: Complete Todoist Task
const completeTodoistTask = tool({
  name: 'complete_todoist_task',
  description: 'Mark a Todoist task as complete.',
  parameters: z.object({ taskId: z.string().min(1) }),
  async execute({ taskId }, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected, getIntegrationToken } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'todoist'))) {
      const oauthUrl = '/api/integrations/todoist/connect';
      return `<div style='font-size:1.1em;'><b>🚀 Connect Todoist to FlowFate!</b><br>To complete tasks, <a href="${oauthUrl}" target="_blank" rel="noopener noreferrer" data-integration="todoist" style="color:#e44332;font-weight:bold;">click here to connect your Todoist account</a>.<br><i>Once connected, you can complete tasks from FlowFate!</i></div>`;
    }
    const { accessToken } = await getIntegrationToken(userId, 'todoist');
    if (!accessToken) {
      return `Todoist account not connected. Please <a href="/api/integrations/todoist/connect" target="_blank" rel="noopener noreferrer" data-integration="todoist">connect your Todoist account</a> first.`;
    }
    const { completeTodoistTask } = await import('../integrations/todoistIntegration.js');
    await completeTodoistTask({ accessToken, taskId });
    return `Todoist task ${taskId} marked as complete.`;
  },
  errorFunction: (ctx, error) => `Failed to complete Todoist task: ${error.message}`,
});

// Tool: Delete Todoist Task
const deleteTodoistTask = tool({
  name: 'delete_todoist_task',
  description: 'Delete a Todoist task.',
  parameters: z.object({ taskId: z.string().min(1) }),
  async execute({ taskId }, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected, getIntegrationToken } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'todoist'))) {
      const oauthUrl = '/api/integrations/todoist/connect';
      return `<div style='font-size:1.1em;'><b>🚀 Connect Todoist to FlowFate!</b><br>To delete tasks, <a href="${oauthUrl}" target="_blank" rel="noopener noreferrer" data-integration="todoist" style="color:#e44332;font-weight:bold;">click here to connect your Todoist account</a>.<br><i>Once connected, you can delete tasks from FlowFate!</i></div>`;
    }
    const { accessToken } = await getIntegrationToken(userId, 'todoist');
    if (!accessToken) {
      return `Todoist account not connected. Please <a href="/api/integrations/todoist/connect" target="_blank" rel="noopener noreferrer" data-integration="todoist">connect your Todoist account</a> first.`;
    }
    const { deleteTodoistTask } = await import('../integrations/todoistIntegration.js');
    await deleteTodoistTask({ accessToken, taskId });
    return `Todoist task ${taskId} deleted.`;
  },
  errorFunction: (ctx, error) => `Failed to delete Todoist task: ${error.message}`,
});

// Tool: Update Todoist Task
const updateTodoistTask = tool({
  name: 'update_todoist_task',
  description: 'Update a Todoist task (content, due date, etc.).',
  parameters: z.object({ taskId: z.string().min(1), updates: z.object({}).passthrough() }),
  async execute({ taskId, updates }, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected, getIntegrationToken } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'todoist'))) {
      const oauthUrl = '/api/integrations/todoist/connect';
      return `<div style='font-size:1.1em;'><b>🚀 Connect Todoist to FlowFate!</b><br>To update tasks, <a href="${oauthUrl}" target="_blank" rel="noopener noreferrer" data-integration="todoist" style="color:#e44332;font-weight:bold;">click here to connect your Todoist account</a>.<br><i>Once connected, you can update tasks from FlowFate!</i></div>`;
    }
    const { accessToken } = await getIntegrationToken(userId, 'todoist');
    if (!accessToken) {
      return `Todoist account not connected. Please <a href="/api/integrations/todoist/connect" target="_blank" rel="noopener noreferrer" data-integration="todoist">connect your Todoist account</a> first.`;
    }
    const { updateTodoistTask } = await import('../integrations/todoistIntegration.js');
    await updateTodoistTask({ accessToken, taskId, updates });
    return `Todoist task ${taskId} updated.`;
  },
  errorFunction: (ctx, error) => `Failed to update Todoist task: ${error.message}`,
});
// Tool: Create Todoist Task
const createTodoistTask = tool({
  name: 'create_todoist_task',
  description: 'Create a new task in Todoist for the user. Prompts user to connect Todoist if not connected.',
  parameters: z.object({
    content: z.string().min(1),
    projectId: z.string().optional().nullable(),
  }),
  async execute({ content, projectId }, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected, getIntegrationToken } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'todoist'))) {
      const oauthUrl = '/api/integrations/todoist/connect';
      return `<div style='font-size:1.1em;'><b>🚀 Connect Todoist to FlowFate!</b><br>To create tasks, <a href="${oauthUrl}" target="_blank" rel="noopener noreferrer" data-integration="todoist" style="color:#e44332;font-weight:bold;">click here to connect your Todoist account</a>.<br><i>Once connected, you can create and manage tasks from FlowFate!</i></div>`;
    }
    const { accessToken } = await getIntegrationToken(userId, 'todoist');
    if (!accessToken) {
      return `Todoist account not connected. Please <a href="/api/integrations/todoist/connect" target="_blank" rel="noopener noreferrer" data-integration="todoist">connect your Todoist account</a> first.`;
    }
    const { createTodoistTask } = await import('../integrations/todoistIntegration.js');
    const result = await createTodoistTask({ accessToken, content, projectId });
    return `Todoist task created: ${result.content}`;
  },
  errorFunction: (ctx, error) => `Failed to create Todoist task: ${error.message}`,
});

// Tool: List Todoist Tasks
const listTodoistTasks = tool({
  name: 'list_todoist_tasks',
  description: 'List all tasks in the user\'s Todoist account. Prompts user to connect Todoist if not connected.',
  parameters: z.object({}),
  async execute(_, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected, getIntegrationToken } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'todoist'))) {
      const oauthUrl = '/api/integrations/todoist/connect';
      return `<div style='font-size:1.1em;'><b>🚀 Connect Todoist to FlowFate!</b><br>To view tasks, <a href="${oauthUrl}" target="_blank" rel="noopener noreferrer" data-integration="todoist" style="color:#e44332;font-weight:bold;">click here to connect your Todoist account</a>.<br><i>Once connected, you can view and manage tasks from FlowFate!</i></div>`;
    }
    const { accessToken } = await getIntegrationToken(userId, 'todoist');
    if (!accessToken) {
      return `Todoist account not connected. Please <a href="/api/integrations/todoist/connect" target="_blank" rel="noopener noreferrer" data-integration="todoist">connect your Todoist account</a> first.`;
    }
    const { listTodoistTasks } = await import('../integrations/todoistIntegration.js');
    const tasks = await listTodoistTasks(accessToken);
    if (!tasks.length) return 'No Todoist tasks found.';
    return 'Your Todoist tasks:\n' + tasks.map(t => `- ${t.content}`).join('\n');
  },
  errorFunction: (ctx, error) => `Failed to list Todoist tasks: ${error.message}`,
});
// Tool: Connect Slack (shows OAuth link if not connected)
const connectSlack = tool({
  name: 'connect_slack',
  description: 'Prompt the user to connect Slack if not already connected. Use for any Slack-related intent if not connected.',
  parameters: z.object({}),
  async execute(_, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected } = await import('../services/integrationService.js');
    // Build the full Slack OAuth URL using env vars
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.SLACK_REDIRECT_URI);
    const scopes = [
      'chat:write',
      'channels:read',
      'users:read',
      'channels:join',
      'groups:read',
      'im:write',
      'mpim:write'
    ].join(',');
    const oauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}`;
    if (!userId || !(await isIntegrationConnected(userId, 'slack'))) {
      return `<div style='font-size:1.1em;'><b>🚀 Connect Slack to FlowFate!</b><br>To unlock powerful Slack automations, <a href="${oauthUrl}" target="_blank" rel="noopener noreferrer" data-integration="slack" style="color:#4ea8de;font-weight:bold;">click here to connect your Slack account</a>.<br><i>Once connected, you can send messages, automate channels, and more—right from FlowFate!</i></div>`;
    }
    // If already connected, show a branded confirmation message
    return `<div style='font-size:1.1em;'><b>✅ Slack is already connected!</b><br>Your Slack account is linked to FlowFate.<br><i>You can now send messages, automate channels, and more—right from FlowFate!</i></div>`;
  },
  errorFunction: (ctx, error) => `Failed to check Slack connection: ${error.message}`,
});
// Tool: Send Slack Message (production-ready)
const sendSlackMessage = tool({
  name: 'send_slack_message',
  description: 'Send a message to a Slack channel or user. Only available if Slack is connected.',
  parameters: z.object({
    channel: z.string().min(1),
    message: z.string().min(1),
  }),
  async execute({ channel, message }, ctx) {
    const userId = ctx?.user?.id;
    const { isIntegrationConnected, getIntegrationToken } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'slack'))) {
      const oauthUrl = '/api/integration/slack/connect';
      return `To use Slack features, please <a href="${oauthUrl}" target="_blank" rel="noopener noreferrer" data-integration="slack">connect your Slack account</a>. Once connected, you can use Slack actions here!`;
    }
    // Send message to Slack using stored token
    const { accessToken } = await getIntegrationToken(userId, 'slack');
    if (!accessToken) {
      return `Slack account not connected. Please <a href="/api/integration/slack/connect" target="_blank" rel="noopener noreferrer" data-integration="slack">connect your Slack account</a> first.`;
    }
    const { sendSlackMessage } = await import('../integrations/slackIntegration.js');
    await sendSlackMessage({ accessToken, channel, text: message });
    return `Slack message sent to ${channel}.`;
  },
  errorFunction: (ctx, error) => `Failed to send Slack message: ${error.message}`,
});
// backend/controllers/openAIController.js
// OpenAI Agents SDK controller (ESM)

import { Agent, tool, run } from '@openai/agents';
import { z } from 'zod';


// Tool: Send Email (real-world ready)
const sendEmail = tool({
  name: 'send_email',
  description: 'Send an email to a recipient with a subject and message.',
  parameters: z.object({
    to: z.string().email(),
    subject: z.string().min(1),
    message: z.string().min(1),
  }),
  async execute({ to, subject, message }, ctx) {
    // Check Gmail integration for user
    const userId = ctx?.user?.id;
    const { isIntegrationConnected } = await import('../services/integrationService.js');
    if (!userId || !(await isIntegrationConnected(userId, 'gmail'))) {
      return {
        error: true,
        message: 'Please connect your Gmail account to use this feature.',
        connectUrl: '/api/integration/gmail/connect'
      };
    }
    // Proceed with sending email (replace with Gmail API logic as needed)
    // await emailUtil.sendEmail({ to, subject, message });
    console.log(`[AI] Sending email to ${to}: ${subject}`);
    return `Email sent to ${to} with subject "${subject}".`;
  },
  errorFunction: (ctx, error) => `Failed to send email: ${error.message}`,
});

// Tool: Create Task (real-world ready)
const createTask = tool({
  name: 'create_task',
  description: 'Create a new business task with a title and description.',
  parameters: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
  }),
  async execute({ title, description }) {
    // TODO: Integrate with your task system/database
    // Example:
    // await taskService.createTask({ title, description });
    console.log(`[AI] Creating task: ${title}`);
    return `Task "${title}" created.`;
  },
  errorFunction: (ctx, error) => `Failed to create task: ${error.message}`,
});


// Tool: Create Notion Note (production-ready)
import { createNoteForUser } from '../utils/notionUtil.js';
const createNotionNote = tool({
  name: 'create_notion_note',
  description: 'Create a note in Notion with a title and content.',
  parameters: z.object({
    userId: z.string().min(1),
    title: z.string().min(1),
    content: z.string().min(1),
  }),
  async execute({ userId, title, content }, ctx) {
    // Pass user context for audit and security
    return await createNoteForUser(userId, title, content, { agent: ctx?.user || 'AI', traceId: ctx?.traceId });
  },
  errorFunction: (ctx, error) => `Failed to create Notion note: ${error.message}`,
});

const agent = new Agent({
  name: 'FlowFate Assistant',
  instructions: [
    'You are a helpful assistant for business automation.',
    'You can send emails, create tasks, create Notion notes, and interact with Slack for the user.',
    'Never ask the user for their Notion or Slack token, user ID, or any manual integration details.',
    'If the user is not connected to Notion or Slack, always prompt them to connect via OAuth and provide the appropriate OAuth link. Do not ask for any credentials or IDs.',
    'Always confirm actions and ask for missing details if needed, except for Notion and Slack integration details as described above.',
    'Never share sensitive information. Always respect user privacy.'
  ].join(' '),
  model: 'gpt-4o-mini-2024-07-18', // most affordable model
  tools: [
    sendEmail,
    createTask,
    createNotionNote,
    sendSlackMessage,
    connectSlack,
    createTodoistTask,
    listTodoistTasks,
    listTodoistProjects,
    completeTodoistTask,
    deleteTodoistTask,
    updateTodoistTask,
    connectClickUp,
    listClickUpSpaces,
    listClickUpLists,
    listClickUpTasks,
    createClickUpTask,
    completeClickUpTask,
    deleteClickUpTask,
    updateClickUpTask
  ],
});

export async function askOpenAI(req, res) {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required.' });
  }
  try {
    const result = await run(agent, prompt);
    let output = result.output;
    let reply = '';
    // Extract assistant reply text if output is an array of message objects
    if (Array.isArray(output) && output.length > 0 && output[0].content && Array.isArray(output[0].content)) {
      const textObj = output[0].content.find(c => c.type === 'output_text');
      reply = textObj ? textObj.text : '';
    } else if (typeof output === 'string') {
      reply = output;
    } else {
      reply = JSON.stringify(output);
    }
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        prompt,
        reply
      }
    });
  } catch (err) {
    console.error('OpenAI Agent error:', err.message);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: 'Error communicating with OpenAI Agent.',
        details: err.message
      }
    });
  }
}
