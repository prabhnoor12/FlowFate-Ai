const { AppError, catchAsync } = require('../utils/error_handling');
const sessionService = require('../services/session_service');

// Create a new session (login alternative, e.g. for refresh tokens)
exports.createSession = catchAsync(async (req, res, next) => {
	try {
		const { userId, userAgent } = req.body;
		const { session, sessionToken } = await sessionService.createSessionService({ userId, userAgent });
		res.status(201).json({ status: 'success', data: { session, sessionToken } });
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
});

// Validate a session (middleware or endpoint)
exports.validateSession = catchAsync(async (req, res, next) => {
	try {
		const { sessionToken } = req.body;
		const { session } = await sessionService.validateSessionService({ sessionToken });
		req.session = session;
		res.status(200).json({ status: 'success', data: { session } });
	} catch (err) {
		return next(new AppError(err.message, 401));
	}
});

// Revoke a session (logout)
exports.revokeSession = catchAsync(async (req, res, next) => {
	try {
		const { sessionId } = req.body;
		await sessionService.revokeSessionService({ sessionId });
		res.status(200).json({ status: 'success', message: 'Session revoked' });
	} catch (err) {
		return next(new AppError(err.message, 404));
	}
});

// List all sessions for a user (for account management)
exports.listSessions = catchAsync(async (req, res, next) => {
	try {
		const { userId } = req.body;
		const { sessions } = await sessionService.listSessionsService({ userId });
		res.status(200).json({ status: 'success', data: { sessions } });
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
});


// Revoke all sessions for a user (logout everywhere)
exports.revokeAllSessions = catchAsync(async (req, res, next) => {
	try {
		const { userId } = req.body;
		await sessionService.revokeAllSessionsService({ userId });
		res.status(200).json({ status: 'success', message: 'All sessions revoked' });
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
});

// Get current session info (by sessionToken)
exports.getCurrentSession = catchAsync(async (req, res, next) => {
	try {
		const { sessionToken } = req.body;
		const { session } = await sessionService.getCurrentSessionService({ sessionToken });
		res.status(200).json({ status: 'success', data: { session } });
	} catch (err) {
		return next(new AppError(err.message, 404));
	}
});

// Update session userAgent (e.g., on device change)
exports.updateSessionUserAgent = catchAsync(async (req, res, next) => {
	try {
		const { sessionId, userAgent } = req.body;
		const { session } = await sessionService.updateSessionUserAgentService({ sessionId, userAgent });
		res.status(200).json({ status: 'success', data: { session } });
	} catch (err) {
		return next(new AppError(err.message, 404));
	}
});
