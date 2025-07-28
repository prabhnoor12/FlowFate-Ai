// Update a user by ID (admin or self)
export async function updateUser(req, res, next) {
  const requestId = req.headers['x-request-id'] || null;
  try {
    const { id } = req.params;
    if (!id) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'User ID is required' }
      }, 400);
    }
    const data = req.body;
    // Optionally validate data here
    const user = await userService.updateUser(id, data);
    const { passwordHash, ...safeUser } = user;
    sendResponse(res, {
      status: 'success',
      requestId,
      data: safeUser
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
}

import * as userService from '../services/userService.js';
import logger from '../utils/logger.js';
import sendResponse from '../utils/responseUtil.js';
import { createUserSchema } from '../validators/userValidator.js';

// Get a user by ID
export async function getUser(req, res, next) {
  const requestId = req.headers['x-request-id'] || null;
  try {
    const { id } = req.params;
    if (!id) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'User ID is required' }
      }, 400);
    }
    const user = await userService.getUserById(id);
    if (!user) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'User not found' }
      }, 404);
    }
    const { passwordHash, ...safeUser } = user;
    logger.info(`[UserActivity] getUser: userId=${id}, requestId=${requestId}`);
    sendResponse(res, {
      status: 'success',
      requestId,
      data: safeUser
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
}

// Get current user's profile
export async function getProfile(req, res, next) {
  const requestId = req.headers['x-request-id'] || null;
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Unauthorized' }
      }, 401);
    }
    const user = await userService.getUserById(userId);
    if (!user) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'User not found' }
      }, 404);
    }
    const { passwordHash, ...safeUser } = user;
    sendResponse(res, {
      status: 'success',
      requestId,
      data: safeUser
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
}


// Update current user's profile
export async function updateProfile(req, res, next) {
  const requestId = req.headers['x-request-id'] || null;
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Unauthorized' }
      }, 401);
    }
    const data = req.body;
    // Optionally validate data here
    const user = await userService.updateUser(userId, data);
    const { passwordHash, ...safeUser } = user;
    sendResponse(res, {
      status: 'success',
      requestId,
      data: safeUser
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
}

// Create a new user
export async function createUser(req, res, next) {
  const requestId = req.headers['x-request-id'] || null;
  try {
    const { error: validationError, value } = createUserSchema.validate(req.body);
    if (validationError) {
      logger.warn('Validation failed', validationError.details);
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Validation failed', details: validationError.details.map(d => d.message) }
      }, 400);
    }
    const user = await userService.createUser(value);
    sendResponse(res, {
      status: 'success',
      requestId,
      data: user
    }, 201);
  } catch (error) {
    logger.error(error);
    next(error);
  }
}
// Delete a user
export async function deleteUser(req, res, next) {
  const requestId = req.headers['x-request-id'] || null;
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    sendResponse(res, {
      status: 'success',
      requestId,
      data: { message: 'User deleted.' }
    }, 200);
  } catch (error) {
    logger.error(error);
    next(error);
  }
}

// List all users
export async function listUsers(req, res, next) {
  const requestId = req.headers['x-request-id'] || null;
  try {
    let { page = 1, pageSize = 20, search, status } = req.query;
    page = parseInt(page);
    pageSize = parseInt(pageSize);
    const result = await userService.getAllUsers({ page, pageSize, search, status });
    sendResponse(res, {
      status: 'success',
      requestId,
      data: result.users,
      meta: result.meta
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
}

// Search users by name or email
export async function searchUsers(req, res, next) {
  const requestId = req.headers['x-request-id'] || null;
  try {
    const { q, page = 1, pageSize = 20 } = req.query;
    if (!q) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Query parameter q is required' }
      }, 400);
    }
    const result = await userService.getAllUsers({ page: parseInt(page), pageSize: parseInt(pageSize), search: q });
    sendResponse(res, {
      status: 'success',
      requestId,
      data: result.users,
      meta: result.meta
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
}

// Update user profile picture
export async function updateUserProfilePicture(req, res, next) {
  const requestId = req.headers['x-request-id'] || null;
  try {
    const { id } = req.params;
    const { profilePictureUrl } = req.body;
    if (!profilePictureUrl) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'profilePictureUrl is required' }
      }, 400);
    }
    const user = await userService.updateUser(id, { profilePictureUrl });
    sendResponse(res, {
      status: 'success',
      requestId,
      data: user
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
}

// Set user preferences
export async function setUserPreferences(req, res, next) {
  const requestId = req.headers['x-request-id'] || null;
  try {
    const { id } = req.params;
    const { preferences } = req.body;
    if (!preferences) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'preferences is required' }
      }, 400);
    }
    const user = await userService.updateUserPreferences(id, preferences);
    sendResponse(res, {
      status: 'success',
      requestId,
      data: user
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
}
