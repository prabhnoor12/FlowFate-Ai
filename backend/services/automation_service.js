const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAutomationById(userId, id) {
	return await prisma.automation.findFirst({ where: { id: Number(id), userId } });
}

async function duplicateAutomation(userId, id) {
	const automation = await prisma.automation.findFirst({ where: { id: Number(id), userId } });
	if (!automation) return null;
	return await prisma.automation.create({
		data: {
			name: automation.name + ' (Copy)',
			description: automation.description,
			workflow: automation.workflow,
			userId,
		},
	});
}

async function getAutomations(userId, { page = 1, pageSize = 10, search = '' }) {
	const skip = (Number(page) - 1) * Number(pageSize);
	const where = {
		userId,
		...(search && {
			OR: [
				{ name: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } },
			],
		}),
	};
	const [automations, total] = await Promise.all([
		prisma.automation.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(pageSize) }),
		prisma.automation.count({ where }),
	]);
	return { automations, total };
}

async function createAutomation(userId, data) {
	return await prisma.automation.create({ data: { ...data, userId } });
}

async function updateAutomation(userId, id, data) {
	return await prisma.automation.update({ where: { id: Number(id), userId }, data });
}

async function patchAutomation(userId, id, data) {
	return await prisma.automation.update({ where: { id: Number(id), userId }, data });
}

async function deleteAutomation(userId, id) {
	return await prisma.automation.delete({ where: { id: Number(id), userId } });
}

module.exports = {
	getAutomationById,
	duplicateAutomation,
	getAutomations,
	createAutomation,
	updateAutomation,
	patchAutomation,
	deleteAutomation,
};
