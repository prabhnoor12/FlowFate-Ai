const prisma = require('../prisma/db');
const { generateToken, verifyToken } = require('../utils/token');

async function createSessionService({ userId, userAgent }) {
	if (!userId || !userAgent) throw new Error('userId and userAgent are required');
	const session = await prisma.session.create({
		data: { userId, userAgent, valid: true }
	});
	const sessionToken = generateToken({ sessionId: session.id, userId });
	return { session, sessionToken };
}

async function validateSessionService({ sessionToken }) {
	if (!sessionToken) throw new Error('Session token required');
	let payload;
	try {
		payload = verifyToken(sessionToken);
	} catch {
		throw new Error('Invalid or expired session token');
	}
	const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
	if (!session || !session.valid) throw new Error('Session is invalid or revoked');
	return { session };
}

async function revokeSessionService({ sessionId }) {
	if (!sessionId) throw new Error('Session ID required');
	const session = await prisma.session.findUnique({ where: { id: sessionId } });
	if (!session) throw new Error('Session not found');
	await prisma.session.update({ where: { id: sessionId }, data: { valid: false } });
	return true;
}

async function listSessionsService({ userId }) {
	if (!userId) throw new Error('User ID required');
	const sessions = await prisma.session.findMany({ where: { userId } });
	return { sessions };
}

async function revokeAllSessionsService({ userId }) {
	if (!userId) throw new Error('User ID required');
	await prisma.session.updateMany({ where: { userId }, data: { valid: false } });
	return true;
}

async function getCurrentSessionService({ sessionToken }) {
	if (!sessionToken) throw new Error('Session token required');
	let payload;
	try {
		payload = verifyToken(sessionToken);
	} catch {
		throw new Error('Invalid or expired session token');
	}
	const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
	if (!session) throw new Error('Session not found');
	return { session };
}

async function updateSessionUserAgentService({ sessionId, userAgent }) {
	if (!sessionId || !userAgent) throw new Error('Session ID and userAgent required');
	const session = await prisma.session.findUnique({ where: { id: sessionId } });
	if (!session) throw new Error('Session not found');
	const updated = await prisma.session.update({ where: { id: sessionId }, data: { userAgent } });
	return { session: updated };
}

module.exports = {
	createSessionService,
	validateSessionService,
	revokeSessionService,
	listSessionsService,
	revokeAllSessionsService,
	getCurrentSessionService,
	updateSessionUserAgentService,
};
