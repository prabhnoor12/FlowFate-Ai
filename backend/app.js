const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('./middleware/cors');
const rateLimiter = require('./middleware/rateLimiter');
const { errorHandler, setupGlobalErrorHandlers } = require('./utils/error_handling');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/auth_routes');
const sessionRoutes = require('./routes/session_routes');
const automationRoutes = require('./routes/automation_routes');
const workflowRoutes = require('./routes/workflow_routes');
const openaiRoutes = require('./routes/openai_routes');
const dashboardRoutes = require('./routes/dashboard_routes');
const settingsRoutes = require('./routes/settings_routes');

// Setup global error handlers for uncaught exceptions/rejections
setupGlobalErrorHandlers();

const app = express();

// Middleware
app.use(helmet());
app.use(cors);
app.use(rateLimiter);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev', { stream: logger.stream }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/openai', openaiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
	res.json({ status: 'ok', time: new Date().toISOString() });
});

// 404 handler
app.use((req, res, next) => {
	res.status(404).json({ status: 'fail', message: 'Not Found' });
});

// Error handler
app.use(errorHandler);

// Start server if run directly
if (require.main === module) {
	const PORT = process.env.PORT || 4000;
	app.listen(PORT, () => {
		logger.info(`Server running on port ${PORT}`);
	});
}

module.exports = app;
