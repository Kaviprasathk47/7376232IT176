const Redis = require('ioredis');

// Ensure that we handle connections gracefully
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    maxRetriesPerRequest: null // Required by BullMQ
};

const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
    console.log('Redis Client Connected');
});

redisClient.on('error', (err) => {
    console.error(`Redis Connection Error: ${err.message}`);
});

module.exports = {
    redisClient,
    redisConfig
};
