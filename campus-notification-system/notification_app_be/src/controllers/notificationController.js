const notificationService = require('../services/notificationService');
const { notificationQueue, addBulkNotifications } = require('../queues/notificationQueue');
const asyncWrapper = require('../utils/asyncWrapper');
const CustomError = require('../utils/customError');
const MinHeap = require('../utils/priorityQueue');

exports.createNotification = asyncWrapper(async (req, res, next) => {
    const { studentId, type, message } = req.body;
    
    // Add to queue for async processing
    await notificationQueue.add('send_notification', {
        studentId,
        type,
        message
    });

    res.status(202).json({
        success: true,
        message: 'Notification processing initiated'
    });
});

exports.notifyAll = asyncWrapper(async (req, res, next) => {
    const { studentIds, type, message } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return next(new CustomError('Please provide an array of studentIds', 400));
    }

    // Prepare jobs for bulk addition
    const jobs = studentIds.map(studentId => ({
        studentId,
        type,
        message
    }));

    await addBulkNotifications(jobs);

    res.status(202).json({
        success: true,
        message: `Initiated notifications for ${studentIds.length} students via queue`
    });
});

exports.getNotifications = asyncWrapper(async (req, res, next) => {
    const studentId = req.user.studentId;
    const { page = 1, limit = 20, type } = req.query;

    const result = await notificationService.getNotifications(studentId, { page, limit, type });

    res.status(200).json({
        success: true,
        ...result
    });
});

exports.getUnreadNotifications = asyncWrapper(async (req, res, next) => {
    const studentId = req.user.studentId;
    const notifications = await notificationService.getUnreadNotifications(studentId);

    res.status(200).json({
        success: true,
        count: notifications.length,
        notifications
    });
});

exports.markAsRead = asyncWrapper(async (req, res, next) => {
    const studentId = req.user.studentId;
    const notification = await notificationService.markAsRead(req.params.id, studentId);

    if (!notification) {
        return next(new CustomError('Notification not found', 404));
    }

    res.status(200).json({
        success: true,
        notification
    });
});

exports.getPriorityInbox = asyncWrapper(async (req, res, next) => {
    const studentId = req.user.studentId;
    
    // Get all unread notifications to calculate top 10
    const notifications = await notificationService.getUnreadNotifications(studentId);
    
    const minHeap = new MinHeap(10);
    
    notifications.forEach(notification => {
        minHeap.insert(notification);
    });

    const topPriority = minHeap.getTopK();

    res.status(200).json({
        success: true,
        count: topPriority.length,
        priorityInbox: topPriority
    });
});
