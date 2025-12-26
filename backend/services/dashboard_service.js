const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getDashboardSummary(userId) {
	const [automationCount, workflowCount, sessionCount, recentAutomations, recentWorkflows, recentSessions, allAutomations, allWorkflows] = await Promise.all([
		prisma.automation.count({ where: { userId } }),
		prisma.workflow.count({ where: { userId } }),
		prisma.session.count({ where: { userId } }),
		prisma.automation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
		prisma.workflow.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
		prisma.session.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
		prisma.automation.findMany({ where: { userId } }),
		prisma.workflow.findMany({ where: { userId } }),
	]);

	const allItems = [...allAutomations, ...allWorkflows];
	const dayCounts = allItems.reduce((acc, item) => {
		const day = item.createdAt.toISOString().slice(0, 10);
		acc[day] = (acc[day] || 0) + 1;
		return acc;
	}, {});
	let mostActiveDay = null;
	let maxCount = 0;
	for (const [day, count] of Object.entries(dayCounts)) {
		if (count > maxCount) {
			mostActiveDay = day;
			maxCount = count;
		}
	}

	let avgSteps = 0;
	if (allWorkflows.length > 0) {
		const totalSteps = allWorkflows.reduce((sum, w) => sum + (Array.isArray(w.steps) ? w.steps.length : 0), 0);
		avgSteps = totalSteps / allWorkflows.length;
	}

	return {
		stats: {
			automations: automationCount,
			workflows: workflowCount,
			sessions: sessionCount,
		},
		recent: {
			automations: recentAutomations,
			workflows: recentWorkflows,
			sessions: recentSessions,
		},
		analytics: {
			mostActiveDay,
			mostActiveDayCount: maxCount,
			avgWorkflowSteps: avgSteps,
		},
	};
}

async function getActivityTimeline(userId) {
	const since = new Date();
	since.setDate(since.getDate() - 30);
	const [automations, workflows, sessions] = await Promise.all([
		prisma.automation.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: 'desc' } }),
		prisma.workflow.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: 'desc' } }),
		prisma.session.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: 'desc' } }),
	]);
	const timeline = [...automations.map(a => ({ type: 'automation', ...a })),
		...workflows.map(w => ({ type: 'workflow', ...w })),
		...sessions.map(s => ({ type: 'session', ...s }))
	].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
	return { timeline };
}

async function getUsageBreakdown(userId) {
	const since = new Date();
	since.setDate(since.getDate() - 7);
	const automations = await prisma.automation.findMany({ where: { userId, createdAt: { gte: since } } });
	const workflows = await prisma.workflow.findMany({ where: { userId, createdAt: { gte: since } } });
	const groupByDay = (items) => {
		return items.reduce((acc, item) => {
			const day = item.createdAt.toISOString().slice(0, 10);
			acc[day] = (acc[day] || 0) + 1;
			return acc;
		}, {});
	};
	return {
		automations: groupByDay(automations),
		workflows: groupByDay(workflows),
	};
}

module.exports = {
	getDashboardSummary,
	getActivityTimeline,
	getUsageBreakdown,
};
