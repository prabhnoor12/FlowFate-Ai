const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/token');
const { AppError, catchAsync } = require('../utils/error_handling');
// Replace with your actual User model import
// const User = require('../models/User');

// Dummy in-memory user store for demonstration (replace with DB in production)
const users = [];

// In-memory login attempt tracker (for demo; use Redis or DB in production)
const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

function normalizeEmail(email) {
	return email.trim().toLowerCase();
}

function isStrongPassword(password) {
	// At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
	return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
}

// Register a new user
exports.register = catchAsync(async (req, res, next) => {
	let { username, password, email, role } = req.body;
	if (!username || !password || !email) {
		return next(new AppError('Username, email, and password are required', 400));
	}
	email = normalizeEmail(email);
	if (!isStrongPassword(password)) {
		return next(new AppError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.', 400));
	}
	const existingEmail = users.find(u => u.email === email);
	if (existingEmail) {
		return next(new AppError('Email already registered', 409));
	}
	const existingUsername = users.find(u => u.username === username);
	if (existingUsername) {
		return next(new AppError('Username already taken', 409));
	}
	const hashedPassword = await bcrypt.hash(password, 12);
	const user = { id: users.length + 1, username, email, password: hashedPassword, role: role || 'user' };
	users.push(user);
	const token = generateToken({ id: user.id, email: user.email, role: user.role });
	// Set token in HTTP-only cookie for extra security
	res.cookie('token', token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
	});
	res.status(201).json({
		status: 'success',
		data: { user: { id: user.id, username: user.username, email: user.email, role: user.role }, token }
	});
});

// Login user
exports.login = catchAsync(async (req, res, next) => {
	let { email, password } = req.body;
	if (!email || !password) {
		return next(new AppError('Email and password are required', 400));
	}
	email = normalizeEmail(email);
	// Throttle login attempts
	const now = Date.now();
	if (!loginAttempts[email]) loginAttempts[email] = [];
	loginAttempts[email] = loginAttempts[email].filter(ts => now - ts < ATTEMPT_WINDOW);
	if (loginAttempts[email].length >= MAX_ATTEMPTS) {
		return next(new AppError('Too many failed login attempts. Please try again later.', 429));
	}
	const user = users.find(u => u.email === email);
	if (!user) {
		loginAttempts[email].push(now);
		return next(new AppError('Invalid credentials', 401));
	}
	const valid = await bcrypt.compare(password, user.password);
	if (!valid) {
		loginAttempts[email].push(now);
		return next(new AppError('Invalid credentials', 401));
	}
	loginAttempts[email] = []; // Reset on successful login
	const token = generateToken({ id: user.id, email: user.email, role: user.role });
	// Set token in HTTP-only cookie for extra security
	res.cookie('token', token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
	});
	res.status(200).json({
		status: 'success',
		data: { user: { id: user.id, username: user.username, email: user.email, role: user.role }, token }
	});
});

// Example protected route
exports.profile = catchAsync(async (req, res, next) => {
	// req.user is set by auth middleware
	const user = users.find(u => u.id === req.user.id);
	if (!user) {
		return next(new AppError('User not found', 404));
	}
	res.status(200).json({
		status: 'success',
		data: { user: { id: user.id, username: user.username, email: user.email, role: user.role } }
	});
});
