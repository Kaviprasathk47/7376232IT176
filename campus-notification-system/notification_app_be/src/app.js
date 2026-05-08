const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { apiLimiter } = require('./middleware/rateLimiter');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

// Rate Limiting
app.use('/api', apiLimiter);

// Body Parser
app.use(express.json());

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.use(loggerMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling Middleware (should be last)
app.use(errorHandler);

module.exports = app;
