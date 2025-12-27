const { PrismaClient } = require('@prisma/client');
const sinon = require('sinon');

let prisma;

if (process.env.NODE_ENV === 'test') {
  // Mock Prisma client for tests
  prisma = {
    user: {
      findUnique: sinon.stub(),
      create: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub(),
    },
    automation: {
      findFirst: sinon.stub(),
      findMany: sinon.stub(),
      create: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub(),
      count: sinon.stub(),
    },
    // Add other models here as needed
  };
} else {
  // Real Prisma client for development/production
  prisma = new PrismaClient();
}

module.exports = prisma;
