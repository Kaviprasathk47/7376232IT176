require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const socket = require('./sockets/socket');

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);
socket.init(server); // Initialize Socket.IO

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
