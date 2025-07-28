// Returns an array of { userId, resourceId, resourceType, lastSync }
// In production, fetch this from your DB based on user selections
export async function getUserSyncTargets() {
  // TODO: Replace with real DB query for user-selected Notion resources
  return [
    // Example:
    // { userId: 'user1', resourceId: 'dbid1', resourceType: 'database', lastSync: '2025-07-01T00:00:00Z' }
  ];
}
// User service for business logic (ESM)
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import { createUserSchema } from '../validators/userValidator.js';
const prisma = new PrismaClient();

// Get all users with pagination and filtering
export async function getAllUsers({ page = 1, pageSize = 20, search, status } = {}) {
  try {
    const skip = (page - 1) * pageSize;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    });
    const total = await prisma.user.count({ where });
    logger.info(`[UserService] getAllUsers: search=${search}, status=${status}, page=${page}`);
    return { users, meta: { count: users.length, page, pageSize, totalPages: Math.ceil(total / pageSize), total } };
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to fetch users');
  }
}

// Get a user by ID
export async function getUserById({ id }) {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    logger.info(`[UserService] getUserById: id=${id}`);
    return user;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to fetch user');
  }
}

// Create a new user with validation
export async function createUser({ name, email, profilePictureUrl, preferences }) {
  try {
    const { error: validationError } = createUserSchema.validate({ name, email });
    if (validationError) {
      logger.warn(`[UserService] Validation failed: ${validationError.details.map(d => d.message).join(', ')}`);
      throw new Error('Validation failed: ' + validationError.details.map(d => d.message).join(', '));
    }
    const user = await prisma.user.create({
      data: { name, email, profilePictureUrl, preferences },
    });
    logger.info(`[UserService] createUser: email=${email}`);
    return user;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to create user');
  }
}

// Update a user
export async function updateUser(id, data) {
  try {
    const user = await prisma.user.update({ where: { id: Number(id) }, data });
    logger.info(`[UserService] updateUser: id=${id}`);
    return user;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to update user');
  }
}

// Delete a user
export async function deleteUser(id) {
  try {
    const user = await prisma.user.delete({ where: { id: Number(id) } });
    logger.info(`[UserService] deleteUser: id=${id}`);
    return user;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to delete user');
  }
}

// Business logic: set user status
export async function setUserStatus(id, status) {
  try {
    const user = await prisma.user.update({ where: { id: Number(id) }, data: { status } });
    logger.info(`[UserService] setUserStatus: id=${id}, status=${status}`);
    return user;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to set user status');
  }
}

// Business logic: update user preferences
export async function updateUserPreferences(id, preferences) {
  try {
    const user = await prisma.user.update({ where: { id: Number(id) }, data: { preferences } });
    logger.info(`[UserService] updateUserPreferences: id=${id}`);
    return user;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to update user preferences');
  }
}

// Business logic: deactivate user
export async function deactivateUser(id) {
  try {
    const user = await prisma.user.update({ where: { id: Number(id) }, data: { status: 'inactive' } });
    logger.info(`[UserService] deactivateUser: id=${id}`);
    return user;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to deactivate user');
  }
}

// Business logic: reactivate user
export async function reactivateUser(id) {
  try {
    const user = await prisma.user.update({ where: { id: Number(id) }, data: { status: 'active' } });
    logger.info(`[UserService] reactivateUser: id=${id}`);
    return user;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to reactivate user');
  }
}

// Business logic: check if user is admin
export async function isUserAdmin(id) {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    logger.info(`[UserService] isUserAdmin: id=${id}`);
    return user?.role === 'admin';
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to check admin status');
  }
}

// Business logic: bulk update user status
export async function bulkUpdateUserStatus(ids, status) {
  try {
    const result = await prisma.user.updateMany({ where: { id: { in: ids.map(Number) } }, data: { status } });
    logger.info(`[UserService] bulkUpdateUserStatus: ids=${ids}, status=${status}`);
    return result;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to bulk update user status');
  }
}

// Business logic: get users by preference
export async function getUsersByPreference(key, value) {
  try {
    const users = await prisma.user.findMany({ where: { preferences: { path: [key], equals: value } } });
    logger.info(`[UserService] getUsersByPreference: key=${key}, value=${value}`);
    return users;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to get users by preference');
  }
}

// Business logic: assign role to user
export async function assignUserRole(id, role) {
  try {
    const user = await prisma.user.update({ where: { id: Number(id) }, data: { role } });
    logger.info(`[UserService] assignUserRole: id=${id}, role=${role}`);
    return user;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to assign user role');
  }
}
