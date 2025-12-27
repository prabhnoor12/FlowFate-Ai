const prisma = require('../prisma/db');
const { Configuration, OpenAIApi } = require('openai');
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

function previewPromptService({ prompt, input = '', context = '' }) {
	if (!prompt) throw new Error('Prompt is required for preview');
	let result = prompt;
	if (input) result = result.replace(/\{\{input\}\}/g, input);
	if (context) result = result.replace(/\{\{context\}\}/g, context);
	return { preview: result };
}

async function runAutomationService(userId, automationId, { input, stream = false }, res = null) {
	const automation = await prisma.automation.findFirst({ where: { id: Number(automationId), userId } });
	if (!automation) throw new Error('Automation not found');
	const { prompt, ...options } = automation.workflow;
	if (!prompt) throw new Error('No prompt found in automation workflow');
	let finalPrompt = prompt;
	if (input) finalPrompt = prompt.replace(/\{\{input\}\}/g, input);
	if (stream && res) {
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.flushHeaders();
		const completion = await openai.createChatCompletion({
			model: options.model || 'gpt-3.5-turbo',
			messages: [{ role: 'user', content: finalPrompt }],
			stream: true,
			...options,
		}, { responseType: 'stream' });
		completion.data.on('data', chunk => res.write(chunk));
		completion.data.on('end', () => res.end());
		completion.data.on('error', () => res.end());
		return null;
	}
	const response = await openai.createChatCompletion({
		model: options.model || 'gpt-3.5-turbo',
		messages: [{ role: 'user', content: finalPrompt }],
		...options,
	});
	return { result: response.data.choices[0].message.content };
}

async function runWorkflowService(userId, workflowId, { input }) {
	const workflow = await prisma.workflow.findFirst({ where: { id: Number(workflowId), userId } });
	if (!workflow) throw new Error('Workflow not found');
	let context = input || '';
	const results = [];
	let i = 0;
	while (i < workflow.steps.length) {
		const step = workflow.steps[i];
		if (step.parallel) {
			const parallelSteps = [];
			let j = i;
			while (j < workflow.steps.length && workflow.steps[j].parallel) {
				parallelSteps.push({ ...workflow.steps[j], index: j });
				j++;
			}
			const parallelResults = await Promise.all(parallelSteps.map(async (pstep) => {
				let stepPrompt = pstep.prompt;
				if (context) stepPrompt = stepPrompt.replace(/\{\{context\}\}/g, context);
				let retries = 0;
				let result = null;
				let errorMsg = null;
				while (retries < 2) {
					try {
						const response = await openai.createChatCompletion({
							model: pstep.model || 'gpt-3.5-turbo',
							messages: [{ role: 'user', content: stepPrompt }],
							...pstep,
						});
						result = response.data.choices[0].message.content;
						break;
					} catch (stepErr) {
						errorMsg = stepErr.message;
						retries++;
					}
				}
				return result ? { result } : { error: errorMsg };
			}));
			results.push(...parallelResults);
			const firstResult = parallelResults.find(r => r.result);
			if (firstResult) context = firstResult.result;
			i = j;
		} else {
			if (!step.prompt) {
				results.push({ error: 'No prompt in step' });
				i++;
				continue;
			}
			let stepPrompt = step.prompt;
			if (context) stepPrompt = stepPrompt.replace(/\{\{context\}\}/g, context);
			let retries = 0;
			let result = null;
			let errorMsg = null;
			while (retries < 2) {
				try {
					const response = await openai.createChatCompletion({
						model: step.model || 'gpt-3.5-turbo',
						messages: [{ role: 'user', content: stepPrompt }],
						...step,
					});
					result = response.data.choices[0].message.content;
					break;
				} catch (stepErr) {
					errorMsg = stepErr.message;
					retries++;
				}
			}
			if (result) {
				results.push({ result });
				context = result;
			} else {
				results.push({ error: errorMsg });
			}
			i++;
		}
	}
	return { results };
}

module.exports = {
	previewPromptService,
	runAutomationService,
	runWorkflowService,
};
