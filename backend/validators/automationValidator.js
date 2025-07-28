// Joi validation schema for automation creation (production-ready)
import Joi from 'joi';

export const createAutomationSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 3 characters',
    'string.max': 'Name must be at most 100 characters',
    'any.required': 'Name is required'
  }),
  trigger: Joi.string().min(3).max(50).required().messages({
    'string.base': 'Trigger must be a string',
    'string.empty': 'Trigger is required',
    'string.min': 'Trigger must be at least 3 characters',
    'string.max': 'Trigger must be at most 50 characters',
    'any.required': 'Trigger is required'
  }),
  action: Joi.string().min(3).max(50).required().messages({
    'string.base': 'Action must be a string',
    'string.empty': 'Action is required',
    'string.min': 'Action must be at least 3 characters',
    'string.max': 'Action must be at most 50 characters',
    'any.required': 'Action is required'
  }),
  conditions: Joi.array().items(
    Joi.object({
      field: Joi.string().required(),
      operator: Joi.string().valid('equals', 'not_equals', 'contains', 'greater_than', 'less_than').required(),
      value: Joi.any().required()
    })
  ).max(10),
  enabled: Joi.boolean().default(true),
  schedule: Joi.object({
    type: Joi.string().valid('once', 'recurring').required(),
    time: Joi.date().iso().required(),
    interval: Joi.string().valid('daily', 'weekly', 'monthly').optional()
  }).optional(),
  description: Joi.string().max(500).allow('').optional(),
}).options({ abortEarly: false });
