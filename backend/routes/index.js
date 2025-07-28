import integrationTodoistRoutes from './integrationTodoistRoutes.js';
import slackEventsRoutes from './slackEventsRoutes.js';
import slackScheduleRoutes from './slackScheduleRoutes.js';
import slackActionsRoutes from './slackActionsRoutes.js';
// Central route aggregator (ESM)

import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import taskRoutes from './taskRoutes.js';
import automationRoutes from './automationRoutes.js';
import openAIRoutes from './openAIRoutes.js';
import workflowRoutes from './workflowRoutes.js';
import nlTaskRoutes from './nlTaskRoutes.js';
import notionAuthRoutes from './notionAuthRoutes.js';
import notionActionsRoutes from './notionActionsRoutes.js';

import dashboardRoutes from './dashboardRoutes.js';
import notionRoutes from './notionRoutes.js';
import gmailRoutes from './gmailRoutes.js';
import calendarRoutes from './calendarRoutes.js';
import driveRoutes from './driveRoutes.js';
import reminderRoutes from './reminderRoutes.js';

const router = Router();

import clickupActionsRoutes from './clickupActionsRoutes.js';
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/automations', automationRoutes);


router.use('/openai', openAIRoutes);
router.use('/workflows', workflowRoutes);
router.use('/ai', nlTaskRoutes);
router.use('/dashboard', dashboardRoutes);

router.use('/gmail', gmailRoutes);
router.use('/notion', notionRoutes);
router.use('/calendar', calendarRoutes);
router.use('/drive', driveRoutes);
router.use('/reminders', reminderRoutes);
router.use('/slack', slackActionsRoutes);
router.use('/slack/events', slackEventsRoutes);
router.use('/slack/schedule', slackScheduleRoutes);

// Notion OAuth integration
router.use('/integrations/notion', notionAuthRoutes);
router.use('/integrations/todoist', integrationTodoistRoutes);
router.use('/notion/actions', notionActionsRoutes);
router.use('/integrations/clickup', clickupActionsRoutes);

export default router;
