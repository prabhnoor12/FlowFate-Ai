const sessions = [
  {
    id: 1,
    name: 'Test Session 1',
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Test Session 2',
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const singleSession = sessions[0];

module.exports = {
  sessions,
  singleSession,
};
