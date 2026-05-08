const express = require('express');
const {
    createNotification,
    notifyAll,
    getNotifications,
    getUnreadNotifications,
    markAsRead,
    getPriorityInbox
} = require('../controllers/notificationController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

// All notification routes are protected
router.use(protect);

router.get('/', getNotifications);
router.get('/unread', getUnreadNotifications);
router.get('/priority-inbox', getPriorityInbox);
router.put('/:id/read', markAsRead);

// Only Admin or HR can create notifications or notify all
router.post('/', authorize(ROLES.ADMIN, ROLES.HR), createNotification);
router.post('/notify-all', authorize(ROLES.ADMIN, ROLES.HR), notifyAll);

module.exports = router;
