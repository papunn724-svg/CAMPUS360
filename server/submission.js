
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({

    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
        required: true
    },

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

    status: {
        type: String,
        enum: ["Pending", "Submitted", "Checked"],
        default: "Pending"
    },

    submittedAt: {
        type: Date,
        default: null
    },

    fileName: {
        type: String,
        default: null
    },

    filePath: {
        type: String,
        default: null
    },

    obtainedMarks: {
        type: Number,
        default: null,
        min: 0
    },

    feedback: {
        type: String,
        default: "",
        trim: true
    },

    checkedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

submissionSchema.index(
    { assignmentId: 1, studentId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
