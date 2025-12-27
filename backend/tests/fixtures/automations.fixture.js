```javascript
const automations = [
  {
    id: 1,
    name: 'Test Automation 1',
    description: 'This is the first test automation.',
    workflow: { nodes: [], edges: [] },
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: 'Test Automation 2',
    description: 'This is the second test automation.',
    workflow: { nodes: [{ id: 'a', type: 'input' }], edges: [] },
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const singleAutomation = automations[0];

module.exports = {
  automations,
  singleAutomation,
};
```