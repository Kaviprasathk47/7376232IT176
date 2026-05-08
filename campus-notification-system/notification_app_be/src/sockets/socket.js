let io;

module.exports = {
    init: (server) => {
        const { Server } = require('socket.io');
        io = new Server(server, {
            cors: { origin: '*' }
        });

        io.on('connection', (socket) => {
            console.log('Client connected to Socket.IO');

            socket.on('joinRoom', (studentId) => {
                socket.join(`student_${studentId}`);
                console.log(`Student ${studentId} joined their room`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected');
            });
        });
        return io;
    },
    getIO: () => {
        if (!io) throw new Error('Socket.io not initialized');
        return io;
    }
};
