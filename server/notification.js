
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({

    studentId: {
        type: String,
        required: true,
        trim: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    message: {
        type: String,
        required: true,
        trim: true
    },

    category: {
        type: String,
        enum: [
            "Assignment",
            "Attendance",
            "Event",
            "Announcement",
            "Result"
        ],
        required: true
    },

    read: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);
