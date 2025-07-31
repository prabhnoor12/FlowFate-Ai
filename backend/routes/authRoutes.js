// Auth routes (ESM)
import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
// ...existing code...

const router = Router();


// Register
router.post('/register', register);
// Signup (alias for register)
router.post('/signup', register);
// Login
router.post('/login', login);


// Google One Tap/Sign-In: verify ID token from frontend
import { googleOneTap } from '../controllers/authController.js';
router.post('/google', googleOneTap);

export default router;
