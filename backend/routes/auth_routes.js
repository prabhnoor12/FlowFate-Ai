const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth_controller');
const { authenticate } = require('../middleware/auth');

// Register
router.post('/register', authController.register);
// Login
router.post('/login', authController.login);

// Protected routes
router.get('/profile', authenticate, authController.profile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.delete('/delete-account', authenticate, authController.deleteAccount);

module.exports = router;
