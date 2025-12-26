const { PrismaClient } = require('@prisma/client');
const { AppError, catchAsync } = require('../utils/error_handling');
const { generateToken, verifyToken } = require('../utils/token');

const prisma = new PrismaClient();

// Create a new session (login alternative, e.g. for refresh tokens)
exports.createSession = catchAsync(async (req, res, next) => {
	const { userId, userAgent } = req.body;
	if (!userId || !userAgent) {
		return next(new AppError('userId and userAgent are required', 400));
	}
	const session = await prisma.session.create({
		data: {
			userId,
			userAgent,
			valid: true
		}
	});
	// Optionally, generate a session token (JWT or opaque)
	const sessionToken = generateToken({ sessionId: session.id, userId });
	res.status(201).json({ status: 'success', data: { session, sessionToken } });
});

// Validate a session (middleware or endpoint)
exports.validateSession = catchAsync(async (req, res, next) => {
	const { sessionToken } = req.body;
	if (!sessionToken) {
		return next(new AppError('Session token required', 400));
	}
	let payload;
	try {
		payload = verifyToken(sessionToken);
	} catch (err) {
		return next(new AppError('Invalid or expired session token', 401));
	}
	const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
	if (!session || !session.valid) {
		return next(new AppError('Session is invalid or revoked', 401));
	}
	req.session = session;
	res.status(200).json({ status: 'success', data: { session } });
});

// Revoke a session (logout)
exports.revokeSession = catchAsync(async (req, res, next) => {
	const { sessionId } = req.body;
	if (!sessionId) {
		return next(new AppError('Session ID required', 400));
	}
	const session = await prisma.session.findUnique({ where: { id: sessionId } });
	if (!session) {
		return next(new AppError('Session not found', 404));
	}
	await prisma.session.update({ where: { id: sessionId }, data: { valid: false } });
	res.status(200).json({ status: 'success', message: 'Session revoked' });
});

// List all sessions for a user (for account management)
exports.listSessions = catchAsync(async (req, res, next) => {
	const { userId } = req.body;
	if (!userId) {
		return next(new AppError('User ID required', 400));
	}
	const sessions = await prisma.session.findMany({ where: { userId } });
	res.status(200).json({ status: 'success', data: { sessions } });
});


// Revoke all sessions for a user (logout everywhere)
exports.revokeAllSessions = catchAsync(async (req, res, next) => {
	const { userId } = req.body;
	if (!userId) {
		return next(new AppError('User ID required', 400));
	}
	await prisma.session.updateMany({ where: { userId }, data: { valid: false } });
	res.status(200).json({ status: 'success', message: 'All sessions revoked' });
});

// Get current session info (by sessionToken)
exports.getCurrentSession = catchAsync(async (req, res, next) => {
	const { sessionToken } = req.body;
	if (!sessionToken) {
		return next(new AppError('Session token required', 400));
	}
	let payload;
	try {
		payload = verifyToken(sessionToken);
	} catch (err) {
		return next(new AppError('Invalid or expired session token', 401));
	}
	const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
	if (!session) {
		return next(new AppError('Session not found', 404));
	}
	res.status(200).json({ status: 'success', data: { session } });
});

// Update session userAgent (e.g., on device change)
exports.updateSessionUserAgent = catchAsync(async (req, res, next) => {
	const { sessionId, userAgent } = req.body;
	if (!sessionId || !userAgent) {
		return next(new AppError('Session ID and userAgent required', 400));
	}
	const session = await prisma.session.findUnique({ where: { id: sessionId } });
	if (!session) {
		return next(new AppError('Session not found', 404));
	}
	const updated = await prisma.session.update({ where: { id: sessionId }, data: { userAgent } });
	res.status(200).json({ status: 'success', data: { session: updated } });
});
