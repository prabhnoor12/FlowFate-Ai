const cors = require('cors');

// Define allowed origins (can be set via env or config)
const whitelist = [
	process.env.CLIENT_URL || 'http://localhost:5173',
	'http://localhost:3000',
	'http://127.0.0.1:5173',
	'http://127.0.0.1:3000'
];

const corsOptions = {
	origin: function (origin, callback) {
		// Allow requests with no origin (like mobile apps, curl, etc.)
		if (!origin) return callback(null, true);
		if (whitelist.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	},
	credentials: true, // Allow cookies and credentials
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
	optionsSuccessStatus: 204
};

module.exports = cors(corsOptions);
