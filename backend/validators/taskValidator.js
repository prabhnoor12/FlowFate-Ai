// Joi validation schema for task creation (production-ready)
import Joi from 'joi';

export const createTaskSchema = Joi.object({
  type: Joi.string().valid('ai', 'meeting', 'reminder', 'custom').required().messages({
    'string.base': 'Type must be a string',
    'any.only': 'Type must be one of ai, meeting, reminder, or custom',
    'any.required': 'Type is required'
  }),
  title: Joi.string().min(3).max(100).required().messages({
    'string.base': 'Title must be a string',
    'string.empty': 'Title is required',
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title must be at most 100 characters',
    'any.required': 'Title is required'
  }),
  description: Joi.string().max(1000).allow('').optional().messages({
    'string.base': 'Description must be a string',
    'string.max': 'Description must be at most 1000 characters'
  }),
  dueDate: Joi.date().iso().optional().messages({
    'date.base': 'Due date must be a valid date',
    'date.format': 'Due date must be in ISO format'
  }),
  aiSummary: Joi.string().max(1000).allow('').optional(),
  meetingDetails: Joi.object({
    location: Joi.string().max(200).optional(),
    attendees: Joi.array().items(Joi.string().email()).optional(),
    agenda: Joi.string().max(1000).optional()
  }).optional(),
  reminderDetails: Joi.object({
    remindAt: Joi.date().iso().required(),
    method: Joi.string().valid('email', 'sms', 'push').optional()
  }).optional(),
  customData: Joi.object().optional(),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'overdue').default('pending'),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  userId: Joi.number().integer().positive().optional(),
}).options({ abortEarly: false });
