// User routes (ESM)
import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  listUsers,
  searchUsers,
  updateUserProfilePicture,
  setUserPreferences
} from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';

const router = Router();


// Authenticated user profile
router.get('/me', auth, getProfile);
router.put('/me', auth, updateProfile);

// (Optional: keep admin/user management routes)
router.get('/', auth, listUsers);
router.get('/search', auth, searchUsers);
router.get('/:id', auth, getUser);
router.post('/', auth, createUser);
router.put('/:id', auth, updateUser);
router.delete('/:id', auth, deleteUser);
router.patch('/:id/profile-picture', auth, updateUserProfilePicture);
router.patch('/:id/preferences', auth, setUserPreferences);

export default router;
