const { Worker } = require('bullmq');
const { QUEUE_NAMES } = require('../constants');
const { redisConfig } = require('../config/redis');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const socketServer = require('../sockets/socketServer');

const initWorker = () => {
    const worker = new Worker(
        QUEUE_NAMES.NOTIFICATION,
        async (job) => {
            const { studentId, type, message, email } = job.data;

            // 1. Save to DB
            const notification = await notificationService.createNotification({
                studentId,
                type,
                message
            });

            // 2. Push to App (Real-time) via Socket.IO
            try {
                const io = socketServer.getIO();
                io.to(`student_${studentId}`).emit('new_notification', notification);
            } catch (err) {
                console.error(`Socket push failed for job ${job.id}: ${err.message}`);
                // Non-fatal, proceed to email
            }

            // 3. Send Email
            if (email) {
                await emailService.sendEmail({
                    to: email,
                    subject: `New Campus Notification: ${type}`,
                    text: message,
                    html: `<p><strong>${type}</strong>: ${message}</p>`
                });
            }

            return notification;
        },
        {
            connection: redisConfig,
            concurrency: 50 // Process 50 jobs concurrently
        }
    );

    worker.on('completed', (job) => {
        console.log(`Job ${job.id} has completed!`);
    });

    worker.on('failed', (job, err) => {
        console.error(`Job ${job.id} has failed with ${err.message}`);
    });

    return worker;
};

module.exports = initWorker;
