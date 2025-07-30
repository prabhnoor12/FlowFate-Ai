// Auth routes (ESM)
import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import passport from 'passport';

const router = Router();


// Register
router.post('/register', register);
// Signup (alias for register)
router.post('/signup', register);
// Login
router.post('/login', login);

// Google OAuth2.0
// Step 1: Redirect to Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

// Step 2: Google callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // On success, send a message to the opener window and close popup
    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: 'google_signup_success', user: ${JSON.stringify(req.user)} }, '*');
          window.close();
        } else {
          window.location = '/dashboard.html';
        }
      </script>
    `);
  }
);

export default router;
