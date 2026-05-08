const { redisClient } = require('../config/redis');

class RedisCache {
    async get(key) {
        try {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Redis Get Error: ${error.message}`);
            return null; // Return null on cache failure to fallback to DB
        }
    }

    async set(key, value, ttlSeconds = 3600) {
        try {
            await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch (error) {
            console.error(`Redis Set Error: ${error.message}`);
        }
    }

    async del(key) {
        try {
            await redisClient.del(key);
        } catch (error) {
            console.error(`Redis Del Error: ${error.message}`);
        }
    }

    async invalidatePattern(pattern) {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        } catch (error) {
            console.error(`Redis Invalidate Pattern Error: ${error.message}`);
        }
    }
}

module.exports = new RedisCache();
