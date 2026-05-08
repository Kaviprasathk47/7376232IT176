const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    studentId: {
        type: Number,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['Placement', 'Result', 'Event'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Stage 3 Requirement: Compound Index for fast unread fetching
notificationSchema.index({ studentId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
