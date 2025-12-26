const { PrismaClient } = require('@prisma/client');
const { AppError, catchAsync } = require('../utils/error_handling');
const Joi = require('joi');

const prisma = new PrismaClient();

const DEFAULT_SETTINGS = { theme: 'light', notifications: true, language: 'en' };

const settingsSchema = Joi.object({
	theme: Joi.string().valid('light', 'dark').optional(),
	notifications: Joi.boolean().optional(),
	language: Joi.string().min(2).max(8).optional()
});

// Get user settings, create defaults if not present
exports.getSettings = catchAsync(async (req, res, next) => {
	const userId = req.user.id;
	let settings = await prisma.settings.findUnique({ where: { userId } });
	if (!settings) {
		settings = await prisma.settings.create({ data: { ...DEFAULT_SETTINGS, userId } });
	}
	res.status(200).json({ status: 'success', data: { settings } });
});

// Update user settings with validation
exports.updateSettings = catchAsync(async (req, res, next) => {
	const userId = req.user.id;
	const { error, value } = settingsSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
	if (error) {
		return next(new AppError('Invalid settings: ' + error.details.map(d => d.message).join(', '), 400));
	}
	if (Object.keys(value).length === 0) {
		return next(new AppError('No valid fields to update', 400));
	}
	const settings = await prisma.settings.upsert({
		where: { userId },
		update: value,
		create: { userId, ...DEFAULT_SETTINGS, ...value }
	});
	res.status(200).json({ status: 'success', data: { settings } });
});

// Reset user settings to default
exports.resetSettings = catchAsync(async (req, res, next) => {
	const userId = req.user.id;
	const settings = await prisma.settings.upsert({
		where: { userId },
		update: DEFAULT_SETTINGS,
		create: { userId, ...DEFAULT_SETTINGS }
	});
	res.status(200).json({ status: 'success', data: { settings } });
});
