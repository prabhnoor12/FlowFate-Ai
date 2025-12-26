const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getWorkflows(userId, { page = 1, pageSize = 10, search = '' }) {
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
	const [workflows, total] = await Promise.all([
		prisma.workflow.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(pageSize) }),
		prisma.workflow.count({ where }),
	]);
	return { workflows, total };
}

async function getWorkflowById(userId, id) {
	return await prisma.workflow.findFirst({ where: { id: Number(id), userId } });
}

async function createWorkflow(userId, data) {
	return await prisma.workflow.create({ data: { ...data, userId } });
}

async function updateWorkflow(userId, id, data) {
	return await prisma.workflow.update({ where: { id: Number(id), userId }, data });
}

async function patchWorkflow(userId, id, data) {
	return await prisma.workflow.update({ where: { id: Number(id), userId }, data });
}

async function deleteWorkflow(userId, id) {
	return await prisma.workflow.delete({ where: { id: Number(id), userId } });
}

async function duplicateWorkflow(userId, id) {
	const workflow = await prisma.workflow.findFirst({ where: { id: Number(id), userId } });
	if (!workflow) return null;
	return await prisma.workflow.create({
		data: {
			name: workflow.name + ' (Copy)',
			description: workflow.description,
			steps: workflow.steps,
			userId,
		},
	});
}

module.exports = {
	getWorkflows,
	getWorkflowById,
	createWorkflow,
	updateWorkflow,
	patchWorkflow,
	deleteWorkflow,
	duplicateWorkflow,
};
