// Main entry point for FlowMate AI backend (ESM)
// Start Notion sync scheduler (runs in background)
import './jobs/notionSyncScheduler.js';
import express from 'express';
import requestLogger from './middleware/requestLogger.js';
import rateLimiter from './middleware/rateLimiter.js';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';


import session from 'express-session';
import { RedisStore } from 'connect-redis';
import Redis from 'ioredis';


import apiRoutes from './routes/index.js';
import { auth } from './middleware/auth.js';
import errorHandler from './middleware/errorHandler.js';


dotenv.config();



import path from 'path';
import https from 'https';
import fs from 'fs';



const app = express();
// CORS must be first, before any other middleware
app.use(cors({
  origin: 'https://flowfate-ai-1.onrender.com',
  credentials: true // if you use cookies/auth
}));
app.use(requestLogger);
app.use(rateLimiter);
// Redis session store (production-ready)
const redisClient = new Redis(process.env.REDIS_URL);
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'your_secret',
  resave: false,
  saveUninitialized: false,
}));

const PORT = process.env.PORT || 4000;

// Serve static files from the frontend folder
app.use(express.static(path.join(process.cwd(), 'frontend')));

// Redirect / to /login.html
app.get('/', (req, res) => {
  res.redirect('/login.html');
});
app.use(morgan('dev'));
app.use(express.json());



// Central API route aggregator
app.use('/api', apiRoutes);

// Public health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Error handler (should be last)
app.use(errorHandler);

// Use HTTPS in development, HTTP in production (Render provides HTTPS at the load balancer)
if (process.env.NODE_ENV === 'production') {
  app.listen(PORT, () => {
    console.log(`FlowMate AI backend running on https://localhost:${PORT}`);
  });
} else {
  const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH || './certs/key.pem'),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH || './certs/cert.pem')
  };
  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`FlowMate AI backend running securely on https://localhost:${PORT}`);
  });
}
