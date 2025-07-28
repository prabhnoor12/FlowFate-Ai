import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { createNotionPage } from '../backend/integrations/notionIntegration.js';

// Example automation: when X happens, do Y in Notion
async function automationTrigger(event, notionToken) {
  if (event.type === 'task_completed') {
    return await createNotionPage({
      token: notionToken,
      title: `Task Complete: ${event.taskTitle}`,
      content: `Task ${event.taskTitle} was completed at ${event.completedAt}`
    });
  }
  if (event.type === 'task_overdue') {
    return await createNotionPage({
      token: notionToken,
      title: `Task Overdue: ${event.taskTitle}`,
      content: `Task ${event.taskTitle} is overdue since ${event.dueDate}`
    });
  }
  if (event.type === 'meeting_scheduled') {
    return await createNotionPage({
      token: notionToken,
      title: `Meeting Scheduled: ${event.meetingTitle}`,
      content: `Meeting with ${event.attendees.join(', ')} at ${event.time}`
    });
  }
  if (event.type === 'error') {
    return await createNotionPage({
      token: notionToken,
      title: `Automation Error: ${event.errorType}`,
      content: `Error details: ${event.errorMessage}`,
    });
  }
  return null;
}

describe('Notion automation: when X happens do Y (integration)', () => {
  it('should log a new project onboarding in Notion with details and tags', async () => {
    const customProperties = {
      Tags: {
        multi_select: [
          { name: 'Project' },
          { name: 'Onboarding' }
        ]
      },
      Status: {
        select: { name: 'Started' }
      },
      Priority: {
        select: { name: 'Medium' }
      }
    };
    const blocks = [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Welcome to the Project!' } }]
        }
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: 'This page tracks onboarding progress for the new project.' } }]
        }
      }
    ];
    const result = await createNotionPage({
      token: notionToken,
      title: 'Onboard Project X',
      customProperties,
      blocks
    });
    expect(result).toBeTruthy();
    expect(result.properties.Tags.multi_select.some(t => t.name === 'Project')).toBe(true);
    expect(result.properties.Status.select.name).toBe('Started');
  });

  it('should escalate an urgent overdue task in Notion with high priority and checklist', async () => {
    const customProperties = {
      Tags: {
        multi_select: [
          { name: 'Task' },
          { name: 'Urgent' }
        ]
      },
      Status: {
        select: { name: 'Overdue' }
      },
      Priority: {
        select: { name: 'High' }
      }
    };
    const blocks = [
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [{ type: 'text', text: { content: 'Contact assignee' } }],
          checked: false
        }
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [{ type: 'text', text: { content: 'Notify manager' } }],
          checked: false
        }
      }
    ];
    const result = await createNotionPage({
      token: notionToken,
      title: 'Escalate: Pay Vendor Invoice',
      customProperties,
      blocks
    });
    expect(result).toBeTruthy();
    expect(result.properties.Priority.select.name).toBe('High');
    expect(result.properties.Status.select.name).toBe('Overdue');
  }, 20000);

  it('should log a recurring meeting with attendees and agenda in Notion', async () => {
    const customProperties = {
      Tags: {
        multi_select: [
          { name: 'Meeting' },
          { name: 'Recurring' }
        ]
      },
      Status: {
        select: { name: 'Scheduled' }
      },
      Priority: {
        select: { name: 'Low' }
      }
    };
    const blocks = [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Weekly Sync Agenda' } }]
        }
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: 'Project updates' } }]
        }
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: 'Blockers' } }]
        }
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: 'Next steps' } }]
        }
      }
    ];
    const result = await createNotionPage({
      token: notionToken,
      title: 'Weekly Team Sync',
      customProperties,
      blocks
    });
    expect(result).toBeTruthy();
    expect(result.properties.Tags.multi_select.some(t => t.name === 'Meeting')).toBe(true);
    expect(result.properties.Status.select.name).toBe('Scheduled');
  }, 20000);
  it('should create a Notion page with custom properties (tags, status, priority)', async () => {
    const customProperties = {
      Tags: {
        multi_select: [
          { name: 'Automation' },
          { name: 'Test' }
        ]
      },
      Status: {
        select: { name: 'In Progress' }
      },
      Priority: {
        select: { name: 'High' }
      }
    };
    const result = await createNotionPage({
      token: notionToken,
      title: 'Custom Properties Test',
      customProperties
    });
    expect(result).toBeTruthy();
    expect(result.properties.Tags.multi_select.some(t => t.name === 'Automation')).toBe(true);
    expect(result.properties.Status.select.name).toBe('In Progress');
    expect(result.properties.Priority.select.name).toBe('High');
  });

  it('should create a Notion page with rich content blocks (heading, to-do, bulleted list)', async () => {
    const blocks = [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Section Title' } }]
        }
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [{ type: 'text', text: { content: 'Check Notion API' } }],
          checked: false
        }
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: 'First bullet' } }]
        }
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: 'Second bullet' } }]
        }
      }
    ];
    const result = await createNotionPage({
      token: notionToken,
      title: 'Rich Content Test',
      blocks
    });
    expect(result).toBeTruthy();
    expect(result.id).toBeTruthy();
    // Optionally, fetch page content to verify blocks (Notion API limitation: blocks are not returned in page object)
  }, 20000);
  const notionToken = process.env.NOTION_TEST_TOKEN;

  if (!notionToken) {
    console.warn('NOTION_TEST_TOKEN not set. Skipping Notion integration tests.');
    return;
  }

  it('should create a Notion page when a task is completed', async () => {
    const event = {
      type: 'task_completed',
      taskTitle: 'Write tests',
      completedAt: '2025-07-27T15:45:00Z'
    };
    const result = await automationTrigger(event, notionToken);
    expect(result).toBeTruthy();
    expect(result.id).toBeTruthy();
    expect(result.properties.Name.title[0].plain_text).toBe('Task Complete: Write tests');
    // Optionally, check created time or other metadata
  });

  it('should create a Notion page when a task is overdue', async () => {
    const event = {
      type: 'task_overdue',
      taskTitle: 'Pay bills',
      dueDate: '2025-07-25T12:00:00Z'
    };
    const result = await automationTrigger(event, notionToken);
    expect(result).toBeTruthy();
    expect(result.id).toBeTruthy();
    expect(result.properties.Name.title[0].plain_text).toBe('Task Overdue: Pay bills');
  });

  it('should create a Notion page when a meeting is scheduled', async () => {
    const event = {
      type: 'meeting_scheduled',
      meetingTitle: 'Project Sync',
      attendees: ['alice@example.com', 'bob@example.com'],
      time: '2025-07-28T09:00:00Z'
    };
    const result = await automationTrigger(event, notionToken);
    expect(result).toBeTruthy();
    expect(result.id).toBeTruthy();
    expect(result.properties.Name.title[0].plain_text).toBe('Meeting Scheduled: Project Sync');
  });

  it('should create a Notion page when an error occurs', async () => {
    const event = {
      type: 'error',
      errorType: 'NotionAPI',
      errorMessage: 'Invalid token'
    };
    const result = await automationTrigger(event, notionToken);
    expect(result).toBeTruthy();
    expect(result.id).toBeTruthy();
    expect(result.properties.Name.title[0].plain_text).toBe('Automation Error: NotionAPI');
  });

  it('should do nothing for unrelated events', async () => {
    const event = { type: 'other_event' };
    const result = await automationTrigger(event, notionToken);
    expect(result).toBeNull();
  });
});
