// Joi validation schema for user creation (production-ready)
import Joi from 'joi';

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must be at most 100 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.base': 'Email must be a string',
    'string.email': 'Email must be a valid email address',
    'string.empty': 'Email is required',
    'any.required': 'Email is required'
  }),
  profilePictureUrl: Joi.string().uri().optional().messages({
    'string.uri': 'Profile picture must be a valid URL'
  }),
  role: Joi.string().valid('user', 'admin', 'manager').default('user'),
  status: Joi.string().valid('active', 'inactive', 'pending').default('active'),
  preferences: Joi.object().optional(),
  password: Joi.string().min(8).max(128).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}:;<>.,?]).+$')).required().messages({
    'string.base': 'Password must be a string',
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters',
    'string.max': 'Password must be at most 128 characters',
    'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
    'any.required': 'Password is required'
  }),
}).options({ abortEarly: false });
