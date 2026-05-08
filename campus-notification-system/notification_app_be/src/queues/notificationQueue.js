const { Queue } = require('bullmq');
const { QUEUE_NAMES } = require('../constants');
const { redisConfig } = require('../config/redis');

// Create the notification queue
const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 3, // Retry failed jobs
        backoff: {
            type: 'exponential',
            delay: 1000 // 1s, 2s, 4s...
        },
        removeOnComplete: true, // Keep redis clean
        removeOnFail: false // Keep failed jobs for dead letter queue inspection
    }
});

// Helper to add bulk jobs efficiently
const addBulkNotifications = async (jobs) => {
    // BullMQ bulk addition for performance
    return await notificationQueue.addBulk(jobs.map(job => ({
        name: 'send_notification',
        data: job
    })));
};

module.exports = {
    notificationQueue,
    addBulkNotifications
};
