const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizeEmail(email) {
	return email.trim().toLowerCase();
}

function isStrongPassword(password) {
	return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
}

async function registerUser({ username, password, email, role }) {
	email = normalizeEmail(email);
	if (!isStrongPassword(password)) {
		throw new Error('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
	}
	const existingEmail = await prisma.user.findUnique({ where: { email } });
	if (existingEmail) {
		throw new Error('Email already registered');
	}
	const existingUsername = await prisma.user.findUnique({ where: { username } });
	if (existingUsername) {
		throw new Error('Username already taken');
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
	return user;
}

async function loginUser({ email, password }) {
	email = normalizeEmail(email);
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		throw new Error('Invalid credentials');
	}
	const valid = await bcrypt.compare(password, user.password);
	if (!valid) {
		throw new Error('Invalid credentials');
	}
	return user;
}

async function getUserProfile(userId) {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		throw new Error('User not found');
	}
	return user;
}

async function updateUserProfile(userId, { username, email }) {
	const updates = {};
	if (username) {
		const existingUsername = await prisma.user.findUnique({ where: { username } });
		if (existingUsername && existingUsername.id !== userId) {
			throw new Error('Username already taken');
		}
		updates.username = username;
	}
	if (email) {
		const normalizedEmail = normalizeEmail(email);
		const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
		if (existingEmail && existingEmail.id !== userId) {
			throw new Error('Email already registered');
		}
		updates.email = normalizedEmail;
	}
	if (Object.keys(updates).length === 0) {
		throw new Error('No valid fields to update');
	}
	const user = await prisma.user.update({
		where: { id: userId },
		data: updates
	});
	return user;
}

async function changeUserPassword(userId, oldPassword, newPassword) {
	if (!isStrongPassword(newPassword)) {
		throw new Error('New password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
	}
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		throw new Error('User not found');
	}
	const valid = await bcrypt.compare(oldPassword, user.password);
	if (!valid) {
		throw new Error('Old password is incorrect');
	}
	const hashedPassword = await bcrypt.hash(newPassword, 12);
	await prisma.user.update({
		where: { id: userId },
		data: { password: hashedPassword }
	});
	return true;
}

async function deleteUserAccount(userId) {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		throw new Error('User not found');
	}
	await prisma.user.delete({ where: { id: userId } });
	return true;
}

module.exports = {
	registerUser,
	loginUser,
	getUserProfile,
	updateUserProfile,
	changeUserPassword,
	deleteUserAccount,
	normalizeEmail,
	isStrongPassword
};
