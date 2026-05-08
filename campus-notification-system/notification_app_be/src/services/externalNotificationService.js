const axios = require('axios');
const redisClient = require('../config/redis');

const API_URL = process.env.NOTIFICATION_API_URL;
const API_TOKEN = process.env.NOTIFICATION_API_TOKEN;
const TIMEOUT = parseInt(process.env.NOTIFICATION_API_TIMEOUT, 10) || 5000;

class ExternalNotificationService {
    constructor() {
        this.cacheKey = 'external_notifications_cache';
    }

    /**
     * Fetch raw notifications with exponential backoff retry.
     */
    async fetchWithRetry(retries = 3, backoff = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await axios.get(API_URL, {
                    headers: {
                        'Authorization': `Bearer ${API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: TIMEOUT
                });
                
                return response.data;
            } catch (error) {
                if (error.response) {
                    // API returned an error response (4xx, 5xx)
                    const status = error.response.status;
                    console.error(`API Error [${status}]: ${error.response.statusText}`);
                    
                    if (status === 401 || status === 403 || status === 404) {
                        // Don't retry auth/not-found errors
                        throw new Error(`Critical API Error: ${status}`);
                    }
                    if (status === 429) {
                        console.warn('Rate limited. Backing off...');
                        // Use header Retry-After if available, else exponential backoff
                        const retryAfter = error.response.headers['retry-after'];
                        await this.sleep(retryAfter ? parseInt(retryAfter) * 1000 : backoff);
                        continue;
                    }
                } else if (error.request) {
                    console.error('API Request failed (Timeout or Network Issue)', error.message);
                } else {
                    console.error('API Setup Error', error.message);
                }

                if (i === retries - 1) {
                    throw new Error(`Failed to fetch notifications after ${retries} attempts.`);
                }

                console.warn(`Retrying in ${backoff}ms...`);
                await this.sleep(backoff);
                backoff *= 2; // Exponential backoff
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    calculatePriorityScore(type, timestamp) {
        let weight = 0;
        switch (type) {
            case 'Placement': weight = 3000000000000; break;
            case 'Result': weight = 2000000000000; break;
            case 'Event': weight = 1000000000000; break;
        }
        return weight + new Date(timestamp).getTime();
    }

    transformNotification(notif) {
        return {
            id: notif.ID,
            type: notif.Type,
            message: notif.Message,
            timestamp: notif.Timestamp,
            priorityScore: this.calculatePriorityScore(notif.Type, notif.Timestamp),
            isRead: false
        };
    }

    /**
     * Stale-while-revalidate strategy using Redis.
     */
    async getNotifications() {
        try {
            const cachedData = await redisClient.get(this.cacheKey);
            
            if (cachedData) {
                const { data, timestamp } = JSON.parse(cachedData);
                const isStale = (Date.now() - timestamp) > 60000; // 1 minute stale threshold

                if (isStale) {
                    console.log('Cache is stale. Returning stale data and triggering background refresh...');
                    this.refreshCacheBackground();
                } else {
                    console.log('Returning fresh data from cache.');
                }
                
                return data;
            }

            console.log('Cache miss. Fetching from API synchronously...');
            const freshData = await this.fetchAndCache();
            return freshData;

        } catch (error) {
            console.error('Error in getNotifications, using fallback:', error.message);
            // Fallback: If redis fails, try API directly
            return await this.fetchAndCache();
        }
    }

    async fetchAndCache() {
        const rawData = await this.fetchWithRetry();
        if (!rawData || !rawData.notifications) {
            throw new Error('Malformed API response');
        }

        const transformedData = rawData.notifications.map(n => this.transformNotification(n));

        try {
            await redisClient.set(this.cacheKey, JSON.stringify({
                data: transformedData,
                timestamp: Date.now()
            }), 'EX', 3600); // 1 hour hard expiration
        } catch (err) {
            console.error('Failed to update Redis cache:', err.message);
        }

        return transformedData;
    }

    refreshCacheBackground() {
        // Fire and forget
        this.fetchAndCache().catch(err => {
            console.error('Background refresh failed:', err.message);
        });
    }
}

module.exports = new ExternalNotificationService();
