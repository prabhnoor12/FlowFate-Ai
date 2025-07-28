# FlowFate AI

FlowFate AI is a backend service for personal workflow automation, integrating Notion, Gmail, Google Drive, Calendar, and AI-powered features. Built with Node.js, Express, and Prisma ORM, it provides secure, scalable APIs and background job processing.

## Features
- Notion, Gmail, Google Drive, and Calendar integrations (OAuth2)
- AI-powered automation (OpenAI agents)
- Secure token encryption (AES-256-GCM)
- Background jobs (BullMQ)
- Robust input validation (Joi, Zod)
- Logging (Winston, daily rotation)
- RESTful API routes for workflow management

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL (or compatible database)
- Redis (for BullMQ jobs)

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file in the root directory with the following keys:
```
ENCRYPTION_KEY=your-32-byte-hex-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=your-google-redirect-uri
DATABASE_URL=your-database-url
REDIS_URL=your-redis-url
GMAIL_USER=your-gmail-address
```

### Database Setup
Run Prisma migrations:
```bash
npx prisma migrate deploy
```

### Development
```bash
npm run dev
```

### Production
```bash
npm run start
```

## API Overview
- `/auth` - User authentication
- `/integration` - Connect and manage integrations
- `/notion` - Notion actions and automation
- `/gmail` - Gmail actions
- `/drive` - Google Drive actions
- `/calendar` - Google Calendar actions

## Security
- All tokens are encrypted before storage
- Input validation on all endpoints
- Use HTTPS in production

## Logging & Monitoring
- Winston logger with daily rotation
- API request logging (Morgan)

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
ISC
