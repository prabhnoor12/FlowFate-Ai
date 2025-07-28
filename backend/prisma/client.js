// backend/prisma/client.js
// Prisma client singleton for ESM import compatibility
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export default prisma;
