let io;

module.exports = {
    init: (httpServer) => {
        const { Server } = require('socket.io');
        io = new Server(httpServer, {
            cors: {
                origin: '*', // In production, restrict this
                methods: ['GET', 'POST']
            }
        });

        io.on('connection', (socket) => {
            console.log(`Socket Connected: ${socket.id}`);

            // User joins a room specific to their studentId
            socket.on('join', (studentId) => {
                socket.join(`student_${studentId}`);
                console.log(`Socket ${socket.id} joined room student_${studentId}`);
            });

            socket.on('disconnect', () => {
                console.log(`Socket Disconnected: ${socket.id}`);
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
