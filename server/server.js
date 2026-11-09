// ==========================================
// CAMPUS360 BACKEND SERVER
// ==========================================

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const Student = require("./student");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Attendance = require("./attendance");
const Assignment = require("./assignment");
const Submission = require("./submission");
const Notification = require("./notification");

// FILE UPLOAD CONFIGURATION

const uploadDirectory = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadDirectory);
    },

    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname).toLowerCase();

        const safeName =
            Date.now() + "-" +
            Math.random().toString(36).slice(2, 10) +
            extension;

        cb(null, safeName);
    }

});

const upload = multer({

    storage: storage,

    limits: {
        fileSize: 2 * 1024 * 1024
    },

    fileFilter: function (req, file, cb) {

        const allowedExtensions = [".pdf", ".doc", ".docx"];

        const extension = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.includes(extension)) {
            return cb(new Error("Only PDF, DOC and DOCX files are allowed!"));
        }

        cb(null, true);
    }

});

const app = express();
const PORT = 5000;


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());


// ==========================================
// MONGODB CONNECTION
// ==========================================

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully!");
    })
    .catch((error) => {
        console.log("MongoDB Connection Error:", error.message);
    });


// ==========================================
// STUDENT REGISTRATION API
// ==========================================

app.post("/api/register", async (req, res) => {

    try {

        const {
            name,
            studentId,
            email,
            department,
            password
        } = req.body;

        if (!name || !studentId || !email || !department || !password) {

            return res.status(400).json({
                message: "Please fill all required fields!"
            });

        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanStudentId = studentId.trim();

        const existingStudent = await Student.findOne({

            $or: [
                { email: cleanEmail },
                { studentId: cleanStudentId }
            ]

        });

        if (existingStudent) {

            return res.status(400).json({
                message: "Student already exists!"
            });

        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newStudent = new Student({

            name: name.trim(),
            studentId: cleanStudentId,
            email: cleanEmail,
            department: department.trim(),
            password: hashedPassword

        });

        await newStudent.save();

        return res.status(201).json({
            message: "Student Registered Successfully!"
        });

    } catch (error) {

        console.error("Registration Error:", error);

        return res.status(500).json({
            message: "Registration Failed!"
        });

    }

});


// ==========================================
// STUDENT LOGIN API
// ==========================================

app.post("/api/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                message: "Email and password are required!"
            });

        }

        const student = await Student.findOne({

            email: email.trim().toLowerCase()

        });

        if (!student) {

            return res.status(401).json({
                message: "Invalid email or password!"
            });

        }

        const isMatch = await bcrypt.compare(
            password,
            student.password
        );

        if (!isMatch) {

            return res.status(401).json({
                message: "Invalid email or password!"
            });

        }

        return res.status(200).json({

            message: "Login Successful!",

            student: {
                id: student._id,
                name: student.name,
                studentId: student.studentId,
                email: student.email,
                department: student.department
            }

        });

    } catch (error) {

        console.error("Login Error:", error);

        return res.status(500).json({
            message: "Login Failed!"
        });

    }

});


// ==========================================
// ADMIN - GET ALL STUDENTS
// ==========================================

app.get("/api/admin/students", async (req, res) => {

    try {

        const students = await Student.find()
            .select("-password")
            .sort({ createdAt: -1 });

        return res.status(200).json({

            message: "Students fetched successfully!",
            students: students

        });

    } catch (error) {

        console.error("Fetch Students Error:", error);

        return res.status(500).json({
            message: "Failed to fetch students!"
        });

    }

});


// ==========================================
// ADMIN - DELETE STUDENT
// ==========================================

app.delete("/api/admin/students/:studentId", async (req, res) => {

    try {

        const student = await Student.findOneAndDelete({

            studentId: req.params.studentId

        });

        if (!student) {

            return res.status(404).json({
                message: "Student not found!"
            });

        }

        return res.status(200).json({
            message: "Student deleted successfully!"
        });

    } catch (error) {

        console.error("Delete Student Error:", error);

        return res.status(500).json({
            message: "Failed to delete student!"
        });

    }

});


// ==========================================
// ADMIN - GET ALL ATTENDANCE
// ==========================================

app.get("/api/admin/attendance", async (req, res) => {

    try {

        const records = await Attendance.find()
            .sort({ date: -1 });

        return res.status(200).json({
            message: "Attendance fetched successfully!",
            attendance: records
        });

    } catch (error) {

        console.error("Fetch Attendance Error:", error);

        return res.status(500).json({
            message: "Failed to fetch attendance!"
        });

    }

});



 // ==========================================
 // ADMIN - MARK STUDENT ATTENDANCE
 // ==========================================

app.post("/api/admin/attendance", async (req, res) => {

    try {

        const { studentId, date, status } = req.body;

        if (!studentId || !date || !status) {

            return res.status(400).json({
                message: "Student ID, date and status are required!"
            });

        }

        if (!["Present", "Absent"].includes(status)) {

            return res.status(400).json({
                message: "Invalid attendance status!"
            });

        }

        const student = await Student.findOne({ studentId });

        if (!student) {

            return res.status(404).json({
                message: "Student not found!"
            });

        }

        // CHECK PREVIOUS ATTENDANCE
        const previousRecord = await Attendance.findOne({
            studentId,
            date
        });

        const record = await Attendance.findOneAndUpdate(
            { studentId, date },
            { studentId, date, status },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        // SEND NOTIFICATION ONLY FOR NEW OR CHANGED ATTENDANCE
        if (!previousRecord || previousRecord.status !== status) {

            try {

                await Notification.create({

                    studentId: student.studentId,

                    title: "Attendance Updated",

                    message:
                        `Your attendance for ${date} has been marked as ${status}.`,

                    category: "Attendance"

                });

            } catch (notificationError) {

                console.error(
                    "Attendance Notification Error:",
                    notificationError
                );

            }

        }

        return res.status(200).json({

            message: "Attendance saved successfully!",

            attendance: record

        });

    } catch (error) {

        console.error("Mark Attendance Error:", error);

        return res.status(500).json({

            message: "Failed to save attendance!"

        });

    }

});


// ===============================
// ADMIN - GET ALL ASSIGNMENTS
// ===============================

app.get("/api/admin/assignments", async (req, res) => {

    try {

        const assignments = await Assignment.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Assignments fetched successfully!",
            assignments
        });

    } catch (error) {

        console.error("Assignment Fetch Error:", error);

        res.status(500).json({
            message: "Failed to fetch assignments!"
        });

    }

});


// ===============================
// ADMIN - CREATE ASSIGNMENT
// ===============================

app.post("/api/admin/assignments", async (req, res) => {

    try {

        const {
            title,
            subject,
            description,
            dueDate,
            totalMarks
        } = req.body;

        if (!title || !subject || !description || !dueDate || !totalMarks) {

            return res.status(400).json({
                message: "Please provide all assignment details!"
            });

        }

        if (!Number.isFinite(Number(totalMarks)) || Number(totalMarks) < 1) {

            return res.status(400).json({
                message: "Total marks must be at least 1!"
            });

        }

        const assignment = new Assignment({

            title: title.trim(),
            subject: subject.trim(),
            description: description.trim(),
            dueDate,
            totalMarks: Number(totalMarks)

        });

        await assignment.save();

        // SEND NEW ASSIGNMENT NOTIFICATION TO ALL STUDENTS

        try {

            const students = await Student.find({}, "studentId");

            if (students.length > 0) {

                await Notification.insertMany(

                    students.map((student) => ({

                        studentId: student.studentId,
                        title: "New Assignment Available",
                        message: `${assignment.title} has been added. Due date: ${assignment.dueDate}.`,
                        category: "Assignment"

                    }))

                );

            }

        } catch (notificationError) {

            console.error(
                "New Assignment Notification Error:",
                notificationError
            );

        }

        res.status(201).json({
            message: "Assignment created successfully!",
            assignment
        });

    } catch (error) {

        console.error("Assignment Create Error:", error);

        res.status(500).json({
            message: "Failed to create assignment!"
        });

    }

});


// ===============================
// ADMIN - UPDATE ASSIGNMENT
// ===============================

app.put("/api/admin/assignments/:id", async (req, res) => {

    try {

        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid assignment ID!"
            });
        }

        const {
            title,
            subject,
            description,
            dueDate,
            totalMarks
        } = req.body;

        const assignment = await Assignment.findByIdAndUpdate(
            id,
            {
                title,
                subject,
                description,
                dueDate,
                totalMarks
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!assignment) {
            return res.status(404).json({
                message: "Assignment not found!"
            });
        }

        res.status(200).json({
            message: "Assignment updated successfully!",
            assignment
        });

    } catch (error) {

        console.error("Assignment Update Error:", error);

        res.status(500).json({
            message: "Failed to update assignment!"
        });

    }

});


// ===============================
// ADMIN - DELETE ASSIGNMENT
// ===============================

app.delete("/api/admin/assignments/:id", async (req, res) => {

    try {

        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid assignment ID!"
            });
        }

        const assignment = await Assignment.findByIdAndDelete(id);

        if (!assignment) {
            return res.status(404).json({
                message: "Assignment not found!"
            });
        }

        res.status(200).json({
            message: "Assignment deleted successfully!"
        });

    } catch (error) {

        console.error("Assignment Delete Error:", error);

        res.status(500).json({
            message: "Failed to delete assignment!"
        });

    }

});


// =====================================
// STUDENT - GET ALL ASSIGNMENTS
// =====================================

app.get("/api/student/assignments", async (req, res) => {

    try {

        const assignments = await Assignment.find()
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Assignments fetched successfully!",
            assignments
        });

    } catch (error) {

        console.error("Student Assignment Error:", error);

        return res.status(500).json({
            message: "Failed to fetch assignments!"
        });

    }

});


// =====================================
// STUDENT - GET MY SUBMISSIONS
// =====================================

app.get("/api/student/submissions/:studentId", async (req, res) => {

    try {

        const { studentId } = req.params;

        const submissions = await Submission.find({ studentId });

        return res.status(200).json({
            message: "Submissions fetched successfully!",
            submissions
        });

    } catch (error) {

        console.error("Submission Fetch Error:", error);

        return res.status(500).json({
            message: "Failed to fetch submissions!"
        });

    }

});


// =====================================
// STUDENT - MARK ASSIGNMENT SUBMITTED
// =====================================

app.post("/api/student/submissions", async (req, res) => {

    try {

        const { assignmentId, studentId } = req.body;

        if (!assignmentId || !studentId) {
            return res.status(400).json({
                message: "Assignment ID and Student ID are required!"
            });
        }

        if (!mongoose.isValidObjectId(assignmentId)) {
            return res.status(400).json({
                message: "Invalid assignment ID!"
            });
        }

        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({
                message: "Assignment not found!"
            });
        }

        const student = await Student.findOne({ studentId });

        if (!student) {
            return res.status(404).json({
                message: "Student not found!"
            });
        }

        const submission = await Submission.findOneAndUpdate(
            { assignmentId, studentId },
            {
                assignmentId,
                studentId,
                studentName: student.name,
                status: "Submitted",
                submittedAt: new Date()
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        return res.status(200).json({
            message: "Assignment submitted successfully!",
            submission
        });

    } catch (error) {

        console.error("Submission Save Error:", error);

        return res.status(500).json({
            message: "Failed to submit assignment!"
        });

    }

});


// =====================================
// STUDENT - UPLOAD ASSIGNMENT FILE
// =====================================

app.post(
    "/api/student/upload-assignment",
    upload.single("assignmentFile"),
    async (req, res) => {

        try {

            const { assignmentId, studentId } = req.body;

            if (!assignmentId || !studentId || !req.file) {
                return res.status(400).json({
                    message: "Assignment, student and file are required!"
                });
            }

            if (!mongoose.isValidObjectId(assignmentId)) {

                fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    message: "Invalid assignment ID!"
                });

            }

            const student = await Student.findOne({ studentId });

            if (!student) {

                fs.unlinkSync(req.file.path);

                return res.status(404).json({
                    message: "Student not found!"
                });

            }

            const assignment = await Assignment.findById(assignmentId);

            if (!assignment) {

                fs.unlinkSync(req.file.path);

                return res.status(404).json({
                    message: "Assignment not found!"
                });

            }

            const submission = await Submission.findOneAndUpdate(
                { assignmentId, studentId },
                {
                    assignmentId,
                    studentId,
                    studentName: student.name,
                    status: "Submitted",
                    submittedAt: new Date(),
                    fileName: req.file.originalname,
                    filePath: req.file.filename
                },
                {
                    new: true,
                    upsert: true,
                    runValidators: true
                }
            );

            return res.status(200).json({
                message: "Assignment file uploaded successfully!",
                submission
            });

        } catch (error) {

            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            console.error("File Upload Error:", error);

            return res.status(500).json({
                message: "Assignment upload failed!"
            });

        }

    }
);


// =====================================
// ADMIN - GET ALL STUDENT SUBMISSIONS
// =====================================

app.get("/api/admin/submissions", async (req, res) => {

    try {

        const submissions = await Submission.find()
            .populate("assignmentId", "title subject dueDate totalMarks")
            .sort({ submittedAt: -1 });

        return res.status(200).json({
            message: "Student submissions fetched successfully!",
            submissions
        });

    } catch (error) {

        console.error("Admin Submission Error:", error);

        return res.status(500).json({
            message: "Failed to fetch student submissions!"
        });

    }

});


// =====================================
// ADMIN - VIEW / DOWNLOAD SUBMISSION FILE
// =====================================

app.get("/api/admin/submissions/:id/file", async (req, res) => {

    try {

        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid submission ID!"
            });
        }

        const submission = await Submission.findById(id);

        if (!submission || !submission.filePath) {
            return res.status(404).json({
                message: "Submission file not found!"
            });
        }

        const filePath = path.join(
            uploadDirectory,
            path.basename(submission.filePath)
        );

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: "Uploaded file not found!"
            });
        }

        return res.download(
            filePath,
            submission.fileName || "assignment-file"
        );

    } catch (error) {

        console.error("File Download Error:", error);

        return res.status(500).json({
            message: "Unable to access submission file!"
        });

    }

});


// =====================================
// ADMIN - GRADE STUDENT ASSIGNMENT
// =====================================

app.put("/api/admin/submissions/:id/grade", async (req, res) => {

    try {

        const { id } = req.params;
        const { obtainedMarks, feedback } = req.body;

        // VALIDATE SUBMISSION ID
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid submission ID!"
            });
        }

        // VALIDATE MARKS
        if (
            obtainedMarks === undefined ||
            obtainedMarks === null ||
            obtainedMarks === "" ||
            !Number.isFinite(Number(obtainedMarks)) ||
            Number(obtainedMarks) < 0
        ) {
            return res.status(400).json({
                message: "Please enter valid obtained marks!"
            });
        }

        // FIND SUBMISSION
        const submission = await Submission.findById(id)
            .populate("assignmentId", "title totalMarks");

        if (!submission) {
            return res.status(404).json({
                message: "Submission not found!"
            });
        }

        // CHECK MAXIMUM MARKS
        if (Number(obtainedMarks) > submission.assignmentId.totalMarks) {
            return res.status(400).json({
                message: "Obtained marks cannot exceed total marks!"
            });
        }

        // CHECK PREVIOUS RESULT STATUS
        const wasAlreadyChecked = submission.status === "Checked";

        // SAVE GRADING DETAILS
        submission.obtainedMarks = Number(obtainedMarks);
        submission.feedback = String(feedback || "").trim();
        submission.status = "Checked";
        submission.checkedAt = new Date();

        await submission.save();

        // SEND RESULT NOTIFICATION TO STUDENT
        try {

            const resultTitle = wasAlreadyChecked
                ? "Assignment Result Updated"
                : "Assignment Result Published";

            const resultMessage =
                `${submission.assignmentId.title} has been checked. ` +
                `Your marks: ${submission.obtainedMarks}/${submission.assignmentId.totalMarks}.` +
                (submission.feedback
                    ? ` Feedback: ${submission.feedback}`
                    : "");

            await Notification.create({

                studentId: submission.studentId,
                title: resultTitle,
                message: resultMessage,
                category: "Result"

            });

        } catch (notificationError) {

            console.error(
                "Result Notification Error:",
                notificationError
            );

        }

        return res.status(200).json({
            message: "Assignment graded successfully!",
            submission
        });

    } catch (error) {

        console.error("Assignment Grading Error:", error);

        return res.status(500).json({
            message: "Failed to grade assignment!"
        });

    }

});


// =====================================
// DELETE SUBMISSION FILE HELPER
// =====================================

async function deleteSubmissionFile(submission) {

    if (submission.filePath) {

        const filePath = path.join(
            uploadDirectory,
            path.basename(submission.filePath)
        );

        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }

    }

    await Submission.findByIdAndDelete(submission._id);

}


// =====================================
// STUDENT - DELETE OWN SUBMISSION
// =====================================

app.delete(
    "/api/student/submissions/:submissionId/:studentId",
    async (req, res) => {

        try {

            const { submissionId, studentId } = req.params;

            if (!mongoose.isValidObjectId(submissionId)) {
                return res.status(400).json({
                    message: "Invalid submission ID!"
                });
            }

            const submission = await Submission.findOne({
                _id: submissionId,
                studentId: studentId
            });

            if (!submission) {
                return res.status(404).json({
                    message: "Your submission was not found!"
                });
            }

            await deleteSubmissionFile(submission);

            return res.status(200).json({
                message: "Your submission deleted successfully!"
            });

        } catch (error) {

            console.error("Student Delete Error:", error);

            return res.status(500).json({
                message: "Failed to delete your submission!"
            });

        }

    }
);


// =====================================
// ADMIN - DELETE ANY STUDENT SUBMISSION
// =====================================

app.delete("/api/admin/submissions/:id", async (req, res) => {

    try {

        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid submission ID!"
            });
        }

        const submission = await Submission.findById(id);

        if (!submission) {
            return res.status(404).json({
                message: "Submission not found!"
            });
        }

        await deleteSubmissionFile(submission);

        return res.status(200).json({
            message: "Student submission deleted successfully!"
        });

    } catch (error) {

        console.error("Admin Delete Error:", error);

        return res.status(500).json({
            message: "Failed to delete submission!"
        });

    }

});


// ===============================
// STUDENT NOTIFICATION APIs
// ===============================

// GET: FETCH STUDENT NOTIFICATIONS

app.get("/api/student/notifications/:studentId", async (req, res) => {

    try {

        const { studentId } = req.params;

        const notifications = await Notification.find({ studentId })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Notifications fetched successfully!",
            notifications
        });

    } catch (error) {

        console.error("Notification Fetch Error:", error);

        return res.status(500).json({
            message: "Failed to fetch notifications!"
        });

    }

});


// PUT: MARK ONE NOTIFICATION AS READ

app.put("/api/student/notifications/:id/read/:studentId", async (req, res) => {

    try {

        const { id, studentId } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, studentId },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found!"
            });
        }

        return res.status(200).json({
            message: "Notification marked as read!",
            notification
        });

    } catch (error) {

        console.error("Mark Read Error:", error);

        return res.status(500).json({
            message: "Failed to update notification!"
        });

    }

});


// PUT: MARK ALL NOTIFICATIONS AS READ

app.put("/api/student/notifications/read-all/:studentId", async (req, res) => {

    try {

        const { studentId } = req.params;

        await Notification.updateMany(
            { studentId, read: false },
            { read: true }
        );

        return res.status(200).json({
            message: "All notifications marked as read!"
        });

    } catch (error) {

        console.error("Mark All Read Error:", error);

        return res.status(500).json({
            message: "Failed to update notifications!"
        });

    }

});


// DELETE: DELETE ONE STUDENT NOTIFICATION

app.delete("/api/student/notifications/:id/:studentId", async (req, res) => {

    try {

        const { id, studentId } = req.params;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            studentId
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found!"
            });
        }

        return res.status(200).json({
            message: "Notification deleted successfully!"
        });

    } catch (error) {

        console.error("Delete Notification Error:", error);

        return res.status(500).json({
            message: "Failed to delete notification!"
        });

    }

});


// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {

    res.send("Welcome to CAMPUS360 Backend Server!");

});


// ==========================================
// SERVER START
// ==========================================

app.listen(PORT, () => {

    console.log("------------------------------------");
    console.log("CAMPUS360 Backend Server Started!");
    console.log(`Server URL: http://localhost:${PORT}`);
    console.log("------------------------------------");

});