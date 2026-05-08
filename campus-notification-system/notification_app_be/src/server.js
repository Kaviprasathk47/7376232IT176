require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const socketServer = require('./sockets/socketServer');
const initWorker = require('./workers/notificationWorker');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

const server = http.createServer(app);

// Initialize Socket.io
socketServer.init(server);

// Initialize Queue Worker
initWorker();

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
