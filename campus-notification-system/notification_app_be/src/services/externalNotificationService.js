const axios = require('axios');
const redisClient = require('../config/redis');

class ExternalNotificationService {
    async fetchNotifications() {
        const cacheKey = 'notifications_api_cache';

        // 1. Try Redis Cache
        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error('Redis cache error:', error.message);
        }

        // 2. Fetch from External API
        try {
            const response = await axios.get(process.env.NOTIFICATION_API_URL, {
                headers: {
                    'Authorization': `Bearer ${process.env.NOTIFICATION_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });

            const transformed = this.transformData(response.data.notifications || []);

            // Cache for 5 minutes
            try {
                await redisClient.set(cacheKey, JSON.stringify(transformed), 'EX', 300);
            } catch (err) {
                console.error('Redis set error:', err.message);
            }

            return transformed;
        } catch (error) {
            console.error('External API fetch failed:', error.message);
            throw new Error('Failed to fetch notifications from external service');
        }
    }

    transformData(rawData) {
        return rawData.map(notif => ({
            id: notif.ID,
            type: notif.Type,
            message: notif.Message,
            timestamp: notif.Timestamp,
            priorityScore: this.calculatePriorityScore(notif.Type, notif.Timestamp),
            isRead: false
        }));
    }

    calculatePriorityScore(type, timestamp) {
        let weight = 0;
        if (type === 'Placement') weight = 3000000000000;
        else if (type === 'Result') weight = 2000000000000;
        else if (type === 'Event') weight = 1000000000000;
        
        return weight + new Date(timestamp).getTime();
    }
}

module.exports = new ExternalNotificationService();
