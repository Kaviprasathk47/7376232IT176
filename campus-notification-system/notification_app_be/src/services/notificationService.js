const Notification = require('../models/Notification');
const redisCache = require('../cache/redisCache');

class NotificationService {
    async createNotification(data) {
        const notification = await Notification.create(data);
        
        // Invalidate cache for this user
        await redisCache.invalidatePattern(`notifications:${data.studentId}:*`);
        
        return notification;
    }

    async getNotifications(studentId, { page = 1, limit = 20, type }) {
        const cacheKey = `notifications:${studentId}:page:${page}:limit:${limit}:type:${type || 'all'}`;
        const cachedData = await redisCache.get(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        const query = { studentId };
        if (type) query.type = type;

        const skip = (page - 1) * limit;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean for faster execution since we don't need Mongoose docs

        const total = await Notification.countDocuments(query);

        const result = {
            notifications,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        };

        // Cache for 5 minutes
        await redisCache.set(cacheKey, result, 300);

        return result;
    }

    async getUnreadNotifications(studentId) {
        // Leveraging the compound index: { studentId: 1, isRead: 1, createdAt: -1 }
        return await Notification.find({ studentId, isRead: false })
            .sort({ createdAt: -1 })
            .lean();
    }

    async markAsRead(notificationId, studentId) {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, studentId },
            { isRead: true },
            { new: true }
        );

        if (notification) {
            await redisCache.invalidatePattern(`notifications:${studentId}:*`);
        }

        return notification;
    }
}

module.exports = new NotificationService();
