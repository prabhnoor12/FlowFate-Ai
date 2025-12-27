const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const MemoryStore = require('express-rate-limit').MemoryStore;

// Custom store to ban IPs after repeated abuse
class BanStore extends MemoryStore {
	constructor() {
		super();
		this.banned = new Map();
	}
	incr(key, cb) {
		if (this.banned.has(key)) {
			cb(null, this.banned.get(key), new Date(Date.now() + 24 * 60 * 60 * 1000));
			return;
		}
		super.incr(key, (err, hits, resetTime) => {
			if (hits > 5) { // 5 strikes = ban
				this.banned.set(key, Infinity);
				cb(null, Infinity, new Date(Date.now() + 24 * 60 * 60 * 1000));
			} else {
				cb(err, hits, resetTime);
			}
		});
	}
	resetKey(key) {
		super.resetKey(key);
		this.banned.delete(key);
	}
}

// Strict rate limiter configuration
const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	max: 30, // Only 30 requests per window per IP
	message: {
		status: 'fail',
		message: 'Too many requests from this IP, please try again in 1 hour.'
	},
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => {
		// Use IP + user-agent for stricter uniqueness
		return ipKeyGenerator(req) + (req.headers['user-agent'] || '');
	},
	store: new BanStore(),
	handler: (req, res, next, options) => {
		res.status(options.statusCode).json(options.message);
	},
	skipSuccessfulRequests: false // Count all requests
});

module.exports = limiter;
