const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'test') {
  // Mock Prisma client for tests
  prisma = {
    automation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // Add other models and their methods as needed
  };
} else {
  prisma = new PrismaClient();
}

module.exports = prisma;
