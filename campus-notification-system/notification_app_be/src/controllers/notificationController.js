const Notification = require('../models/Notification');
const externalNotificationService = require('../services/externalNotificationService');
const MinHeap = require('../utils/priorityQueue');
const socket = require('../sockets/socket');

exports.getNotifications = async (req, res) => {
    try {
        const { studentId } = req.user;
        const { type, page = 1, limit = 10 } = req.query;

        let query = { studentId };
        if (type) query.type = type;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Notification.countDocuments(query);

        res.status(200).json({ success: true, count: notifications.length, total, notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUnreadNotifications = async (req, res) => {
    try {
        const { studentId } = req.user;
        const notifications = await Notification.find({ studentId, isRead: false }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: notifications.length, notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOneAndUpdate(
            { _id: id, studentId: req.user.studentId },
            { isRead: true },
            { new: true }
        );

        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });

        res.status(200).json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPriorityInbox = async (req, res) => {
    try {
        // Fetch from external API directly for Stage 6 logic
        const notifications = await externalNotificationService.fetchNotifications();
        
        const minHeap = new MinHeap(10);
        notifications.forEach(n => minHeap.insert(n));

        res.status(200).json({
            success: true,
            priorityInbox: minHeap.getTopK()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin route to test realtime sockets
exports.createNotification = async (req, res) => {
    try {
        const { studentId, type, message } = req.body;
        const notification = await Notification.create({ studentId, type, message });

        // Push via Socket.IO
        socket.getIO().to(`student_${studentId}`).emit('new_notification', notification);

        res.status(201).json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
