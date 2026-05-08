const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    getNotifications,
    getUnreadNotifications,
    markAsRead,
    getPriorityInbox,
    createNotification
} = require('../controllers/notificationController');

const router = express.Router();

router.use(protect); // Secure all notification routes

router.get('/', getNotifications);
router.get('/unread', getUnreadNotifications);
router.get('/priority-inbox', getPriorityInbox);
router.put('/:id/read', markAsRead);

// For testing purposes during assessment
router.post('/', createNotification);

module.exports = router;
