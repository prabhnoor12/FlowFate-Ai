const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/token');
const { AppError, catchAsync } = require('../utils/error_handling');

const prisma = new PrismaClient();

function normalizeEmail(email) {
	return email.trim().toLowerCase();
}

function isStrongPassword(password) {
	// At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
	return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
}

// Register a new user (production-ready with Prisma)
exports.register = catchAsync(async (req, res, next) => {
	let { username, password, email, role } = req.body;
	if (!username || !password || !email) {
		return next(new AppError('Username, email, and password are required', 400));
	}
	email = normalizeEmail(email);
	if (!isStrongPassword(password)) {
		return next(new AppError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.', 400));
	}
	const existingEmail = await prisma.user.findUnique({ where: { email } });
	if (existingEmail) {
		return next(new AppError('Email already registered', 409));
	}
	const existingUsername = await prisma.user.findUnique({ where: { username } });
	if (existingUsername) {
		return next(new AppError('Username already taken', 409));
	}
	const hashedPassword = await bcrypt.hash(password, 12);
	const user = await prisma.user.create({
		data: {
			username,
			email,
			password: hashedPassword,
			role: role || 'user'
		}
	});
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

// Login user (production-ready with Prisma)
exports.login = catchAsync(async (req, res, next) => {
	let { email, password } = req.body;
	if (!email || !password) {
		return next(new AppError('Email and password are required', 400));
	}
	email = normalizeEmail(email);
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		return next(new AppError('Invalid credentials', 401));
	}
	const valid = await bcrypt.compare(password, user.password);
	if (!valid) {
		return next(new AppError('Invalid credentials', 401));
	}
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

// Example protected route (production-ready with Prisma)
exports.profile = catchAsync(async (req, res, next) => {
	// req.user is set by auth middleware
	const user = await prisma.user.findUnique({ where: { id: req.user.id } });
	if (!user) {
		return next(new AppError('User not found', 404));
	}
	res.status(200).json({
		status: 'success',
		data: { user: { id: user.id, username: user.username, email: user.email, role: user.role } }
	});
});


// Update user profile (username, email)
exports.updateProfile = catchAsync(async (req, res, next) => {
	const { username, email } = req.body;
	const updates = {};
	if (username) {
		const existingUsername = await prisma.user.findUnique({ where: { username } });
		if (existingUsername && existingUsername.id !== req.user.id) {
			return next(new AppError('Username already taken', 409));
		}
		updates.username = username;
	}
	if (email) {
		const normalizedEmail = normalizeEmail(email);
		const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
		if (existingEmail && existingEmail.id !== req.user.id) {
			return next(new AppError('Email already registered', 409));
		}
		updates.email = normalizedEmail;
	}
	if (Object.keys(updates).length === 0) {
		return next(new AppError('No valid fields to update', 400));
	}
	const user = await prisma.user.update({
		where: { id: req.user.id },
		data: updates
	});
	res.status(200).json({
		status: 'success',
		data: { user: { id: user.id, username: user.username, email: user.email, role: user.role } }
	});
});

// Change password
exports.changePassword = catchAsync(async (req, res, next) => {
	const { oldPassword, newPassword } = req.body;
	if (!oldPassword || !newPassword) {
		return next(new AppError('Old and new password are required', 400));
	}
	if (!isStrongPassword(newPassword)) {
		return next(new AppError('New password must be at least 8 characters and include uppercase, lowercase, number, and special character.', 400));
	}
	const user = await prisma.user.findUnique({ where: { id: req.user.id } });
	if (!user) {
		return next(new AppError('User not found', 404));
	}
	const valid = await bcrypt.compare(oldPassword, user.password);
	if (!valid) {
		return next(new AppError('Old password is incorrect', 401));
	}
	const hashedPassword = await bcrypt.hash(newPassword, 12);
	await prisma.user.update({
		where: { id: req.user.id },
		data: { password: hashedPassword }
	});
	res.status(200).json({ status: 'success', message: 'Password changed successfully' });
});

// Delete account
exports.deleteAccount = catchAsync(async (req, res, next) => {
	const user = await prisma.user.findUnique({ where: { id: req.user.id } });
	if (!user) {
		return next(new AppError('User not found', 404));
	}
	await prisma.user.delete({ where: { id: req.user.id } });
	res.clearCookie('token');
	res.status(204).json({ status: 'success', message: 'Account deleted' });
});
