const workflows = [
  {
    id: 1,
    name: 'Test Workflow 1',
    steps: [{ id: 'step1', type: 'action' }],
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Test Workflow 2',
    steps: [{ id: 'step1', type: 'action' }, { id: 'step2', type: 'trigger' }],
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const singleWorkflow = workflows[0];

module.exports = {
  workflows,
  singleWorkflow,
};
