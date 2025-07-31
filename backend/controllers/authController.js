// Google One Tap/Sign-In
export { googleOneTap } from './googleOneTap.js';
// Handles user authentication (register & login)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';


// Helper: validate email format
function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

// Register a new user
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    let errors = [];
    if (!name) errors.push('Name is required.');
    if (!email) errors.push('Email is required.');
    if (!password) errors.push('Password is required.');
    if (email && !isValidEmail(email)) errors.push('Invalid email format.');
    if (password && password.length < 8) errors.push('Password must be at least 8 characters.');
    if (errors.length) {
      return res.status(400).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: { message: 'Validation failed.', details: errors }
      });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: { message: 'User already exists.' }
      });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: { message: 'Registration failed. Please try again.', details: error.message }
    });
  }
}


// Login
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    let errors = [];
    if (!email) errors.push('Email is required.');
    if (!password) errors.push('Password is required.');
    if (email && !isValidEmail(email)) errors.push('Invalid email format.');
    if (errors.length) {
      return res.status(400).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: { message: 'Validation failed.', details: errors }
      });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: { message: 'Invalid credentials.' }
      });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: { message: 'Invalid credentials.' }
      });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: { message: 'Login failed. Please try again.', details: error.message }
    });
  }
}
