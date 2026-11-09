
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({

    studentId: {
        type: String,
        required: true,
        trim: true
    },

    studentName: {
        type: String,
        required: true,
        trim: true
    },

    date: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["Present", "Absent"],
        required: true
    }

}, {
    timestamps: true
});

// Prevent duplicate attendance for same student on same date
attendanceSchema.index(
    { studentId: 1, date: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "Attendance",
    attendanceSchema
);
