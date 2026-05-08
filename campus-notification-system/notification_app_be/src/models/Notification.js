const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    studentId: Number,

    type: {
        type: String,
        enum: ['Placement', 'Result', 'Event']
    },

    message: String,

    isRead: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
