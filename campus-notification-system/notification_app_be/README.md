# Notification App Backend

The core Node.js/Express.js backend for the Campus Notification System.

## Stack
- Node.js & Express.js
- MongoDB & Mongoose
- Redis (Caching & Queueing via BullMQ)
- Socket.IO
- JWT & bcrypt

## Installation

```bash
npm install
```

## Running the App

```bash
# Development
npm run dev

# Production
npm start
```

## API Overview
All endpoints are prefixed with `/api`.

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Authenticate a user
- `GET /notifications` - Get paginated notifications
- `POST /notifications` - Create a notification (Admin/HR)
- `POST /notifications/notify-all` - Queue bulk notifications
- `GET /notifications/priority-inbox` - Get top 10 notifications
