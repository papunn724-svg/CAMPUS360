// ==========================================
// CAMPUS360 BACKEND SERVER - SECURE VERSION
// ==========================================

require("dotenv").config();
console.log("RUNNING FILE:", __filename);
console.log("RUNNING DIRECTORY:", process.cwd());

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Admin = require("./admin");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Student = require("./student");
const Attendance = require("./attendance");
const Assignment = require("./assignment");
const Submission = require("./submission");
const Notification = require("./notification");
const { authenticateToken, requireAdmin } = require("./auth");

const app = express();
const PORT = process.env.PORT || 5000;
const uploadDirectory = path.join(__dirname, "uploads");

// ==========================================
// REQUIRED ENVIRONMENT VARIABLES
// ==========================================

if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from environment variables.");
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET is missing or too short.");
}

// ==========================================
// MIDDLEWARE
// ==========================================

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "100kb" }));

// ==========================================
// STUDENT AUTHENTICATION
// ==========================================

async function requireStudent(req, res, next) {
    try {
        if (!req.user || req.user.role !== "student" || !req.user.sub) {
            return res.status(403).json({
                message: "Student access required."
            });
        }

        const student = await Student.findById(req.user.sub)
            .select("-password");

        if (!student) {
            return res.status(401).json({
                message: "Student account not found."
            });
        }

        req.student = student;
        next();

    } catch (error) {
        console.error("Student authentication error:", error.message);

        return res.status(401).json({
            message: "Unable to verify student account."
        });
    }
}

// ==========================================
// FILE UPLOAD CONFIGURATION
// ==========================================

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        const safeName =
            `${Date.now()}-${require("crypto").randomBytes(8).toString("hex")}${extension}`;

        cb(null, safeName);
    }

});

const upload = multer({

    storage,

    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1
    },

    fileFilter: (req, file, cb) => {

        const allowed = new Set([".pdf", ".doc", ".docx"]);

        const extension = path.extname(file.originalname).toLowerCase();

        if (!allowed.has(extension)) {
            return cb(new Error("Only PDF, DOC and DOCX files are allowed."));
        }

        cb(null, true);
    }

});

// ==========================================
// HELPERS
// ==========================================

function isValidId(id) {
    return mongoose.isValidObjectId(id);
}

async function removeUploadedFile(filePath) {
    if (filePath && fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
    }
}

async function deleteSubmissionFile(submission) {

    if (submission.filePath) {

        const safePath = path.join(
            uploadDirectory,
            path.basename(submission.filePath)
        );

        await removeUploadedFile(safePath);
    }

    await Submission.findByIdAndDelete(submission._id);
}

// ==========================================
// STUDENT REGISTRATION
// ==========================================

app.post("/api/register", async (req, res) => {

    try {

        const {
            name,
            studentId,
            email,
            department,
            password
        } = req.body || {};

        if (![name, studentId, email, department, password].every(
            (value) => typeof value === "string" && value.trim()
        )) {

            return res.status(400).json({
                message: "Please fill all required fields!"
            });
        }

        if (password.length < 8 || password.length > 128) {

            return res.status(400).json({
                message: "Password must be 8 to 128 characters long."
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

            return res.status(409).json({
                message: "Student already exists!"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

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

        if (error.code === 11000) {

            return res.status(409).json({
                message: "Student already exists!"
            });
        }

        return res.status(500).json({
            message: "Registration Failed!"
        });
    }

});

// ==========================================
// STUDENT LOGIN
// ==========================================

app.post("/api/login", async (req, res) => {

    try {

        const { email, password } = req.body || {};

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {

            return res.status(400).json({
                message: "Email and password are required!"
            });
        }

        const student = await Student.findOne({
            email: email.trim().toLowerCase()
        });

        if (!student || !(await bcrypt.compare(password, student.password))) {

            return res.status(401).json({
                message: "Invalid email or password!"
            });
        }

        const token = jwt.sign(
            {
                sub: student._id.toString(),
                role: "student"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
                issuer: "campus360"
            }
        );

        return res.status(200).json({

            message: "Login Successful!",
            token,

            student: {
                id: student._id,
                name: student.name,
                studentId: student.studentId,
                email: student.email,
                department: student.department
            }

        });

    } catch (error) {

        console.error("Student Login Error:", error);

        return res.status(500).json({
            message: "Login Failed!"
        });
    }

});


// ==========================================
// ADMIN LOGIN
// ==========================================
console.log("ADMIN LOGIN ROUTE LOADED");

app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) return res.status(400).json({ message: "Email and password are required!" });
        if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH) return res.status(503).json({ message: "Admin login is not configured." });
        const cleanEmail = email.trim().toLowerCase();
        if (cleanEmail !== process.env.ADMIN_EMAIL.trim().toLowerCase()) return res.status(401).json({ message: "Invalid Admin Email or Password!" });
        let admin = await Admin.findOne({ email: cleanEmail });
        if (!admin) {
            const valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
            if (!valid) return res.status(401).json({ message: "Invalid Admin Email or Password!" });
            admin = await Admin.create({ email: cleanEmail, password: process.env.ADMIN_PASSWORD_HASH });
        } else if (!(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ message: "Invalid Admin Email or Password!" });
        }
        admin.lastLoginAt = new Date();
        admin.loginHistory.unshift({ at: new Date(), ip: req.ip, userAgent: req.get("user-agent") || "" });
        admin.loginHistory = admin.loginHistory.slice(0, 10);
        await admin.save();
        const token = jwt.sign({ sub: String(admin._id), role: "admin", ver: admin.tokenVersion }, process.env.JWT_SECRET, { expiresIn: "1d", issuer: "campus360" });
        return res.json({ message: "Admin Login Successful!", token });
    } catch (error) { console.error("Admin Login Error:", error); return res.status(500).json({ message: "Admin Login Failed!" }); }
});

// ADMIN PROFILE AND SECURITY
app.get("/api/admin/profile", authenticateToken, requireAdmin, async (req, res) => {
  const admin = await Admin.findById(req.adminId).select("-password -resetCodeHash -resetCodeExpires -tokenVersion -loginHistory");
  if (!admin) return res.status(404).json({ message: "Admin profile not found." });
  res.json({ admin });
});

app.put("/api/admin/profile", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, phone } = req.body || {};
    if (typeof name !== "string" || !name.trim() || name.trim().length > 80) return res.status(400).json({ message: "Enter a valid name (maximum 80 characters)." });
    if (phone !== undefined && (typeof phone !== "string" || phone.length > 25)) return res.status(400).json({ message: "Enter a valid phone number." });
    const admin = await Admin.findByIdAndUpdate(req.adminId, { $set: { name: name.trim(), phone: phone || "" } }, { new: true, runValidators: true }).select("-password -resetCodeHash -resetCodeExpires -tokenVersion -loginHistory");
    res.json({ message: "Profile updated successfully.", admin });
  } catch (error) { res.status(500).json({ message: "Could not update profile." }); }
});

app.get("/api/admin/security/activity", authenticateToken, requireAdmin, async (req, res) => {
  const admin = await Admin.findById(req.adminId).select("lastLoginAt loginHistory");
  res.json({ lastLoginAt: admin.lastLoginAt, loginHistory: admin.loginHistory });
});

app.post("/api/admin/change-password", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 10 || newPassword.length > 128) return res.status(400).json({ message: "New password must be 10–128 characters." });
    const admin = await Admin.findById(req.adminId);
    if (!(await bcrypt.compare(currentPassword, admin.password))) return res.status(401).json({ message: "Current password is incorrect." });
    admin.password = await bcrypt.hash(newPassword, 12); admin.tokenVersion += 1; admin.resetCodeHash = null; admin.resetCodeExpires = null; await admin.save();
    res.json({ message: "Password changed. Please log in again on all devices." });
  } catch (error) { res.status(500).json({ message: "Could not change password." }); }
});

app.post("/api/admin/forgot-password", async (req, res) => {
  const generic = { message: "If the admin email is registered, a recovery code will be sent shortly." };
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const admin = await Admin.findOne({ email });
    if (!admin) return res.json(generic);
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return res.status(503).json({ message: "Email recovery is not configured on the server yet." });
    const code = String(crypto.randomInt(100000, 1000000));
    admin.resetCodeHash = crypto.createHash("sha256").update(code).digest("hex");
    admin.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); await admin.save();
    const mail = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to: [admin.email], subject: "CAMPUS360 Admin Password Recovery", html: `<p>Your CAMPUS360 admin recovery code is:</p><h2>${code}</h2><p>It expires in 10 minutes. If you did not request this, ignore this email.</p>` }) });
    if (!mail.ok) { console.error("Resend delivery failed:", await mail.text()); admin.resetCodeHash = null; admin.resetCodeExpires = null; await admin.save(); return res.status(502).json({ message: "Recovery email could not be sent. Please try later." }); }
    return res.json(generic);
  } catch (error) { console.error("Forgot password error:", error.message); return res.status(500).json({ message: "Could not process password recovery." }); }
});

app.post("/api/admin/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    if (typeof email !== "string" || typeof code !== "string" || !/^\d{6}$/.test(code) || typeof newPassword !== "string" || newPassword.length < 10 || newPassword.length > 128) return res.status(400).json({ message: "Enter the email, 6-digit code and a 10–128 character password." });
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });
    const hash = crypto.createHash("sha256").update(code).digest("hex");
    if (!admin || !admin.resetCodeHash || admin.resetCodeExpires < new Date() || !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(admin.resetCodeHash))) return res.status(400).json({ message: "Invalid or expired recovery code." });
    admin.password = await bcrypt.hash(newPassword, 12); admin.resetCodeHash = null; admin.resetCodeExpires = null; admin.tokenVersion += 1; await admin.save();
    res.json({ message: "Password reset successfully. Please log in with your new password." });
  } catch (error) { res.status(500).json({ message: "Could not reset password." }); }
});

app.post("/api/admin/logout-all", authenticateToken, requireAdmin, async (req, res) => {
  await Admin.findByIdAndUpdate(req.adminId, { $inc: { tokenVersion: 1 } });
  res.json({ message: "All admin sessions have been logged out." });
});

// ==========================================
// ADMIN - STUDENTS
// ==========================================

app.get(
    "/api/admin/students",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

        try {

            const students = await Student.find()
                .select("-password")
                .sort({ createdAt: -1 });

            return res.status(200).json({
                message: "Students fetched successfully!",
                students
            });

        } catch (error) {

            console.error("Fetch Students Error:", error);

            return res.status(500).json({
                message: "Failed to fetch students!"
            });
        }
    }
);

app.delete(
    "/api/admin/students/:studentId",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

        try {

            const student = await Student.findOneAndDelete({
                studentId: req.params.studentId
            });

            if (!student) {

                return res.status(404).json({
                    message: "Student not found!"
                });
            }

            const submissions = await Submission.find({
                studentId: student.studentId
            });

            for (const submission of submissions) {
                await deleteSubmissionFile(submission);
            }

            await Notification.deleteMany({
                studentId: student.studentId
            });

            await Attendance.deleteMany({
                studentId: student.studentId
            });

            return res.status(200).json({
                message: "Student deleted successfully!"
            });

        } catch (error) {

            console.error("Delete Student Error:", error);

            return res.status(500).json({
                message: "Failed to delete student!"
            });
        }
    }
);

// ==========================================
// ADMIN - ATTENDANCE
// ==========================================

app.get(
    "/api/admin/attendance",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

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
    }
);

app.post(
    "/api/admin/attendance",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

        try {

            const { studentId, date, status } = req.body || {};

            if (
                !studentId ||
                !date ||
                !["Present", "Absent"].includes(status)
            ) {

                return res.status(400).json({
                    message: "Valid student ID, date and status are required!"
                });
            }

            const student = await Student.findOne({
                studentId: String(studentId).trim()
            });

            if (!student) {

                return res.status(404).json({
                    message: "Student not found!"
                });
            }

            const previousRecord = await Attendance.findOne({
                studentId: student.studentId,
                date
            });

            const record = await Attendance.findOneAndUpdate(
                {
                    studentId: student.studentId,
                    date
                },
                {
                    studentId: student.studentId,
                    studentName: student.name,
                    date,
                    status
                },
                {
                    new: true,
                    upsert: true,
                    runValidators: true
                }
            );

            if (!previousRecord || previousRecord.status !== status) {

                await Notification.create({
                    studentId: student.studentId,
                    title: "Attendance Updated",
                    message: `Your attendance for ${date} has been marked as ${status}.`,
                    category: "Attendance"
                });
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
    }
);

// ==========================================
// ADMIN - ASSIGNMENTS
// ==========================================

app.get(
    "/api/admin/assignments",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

        try {

            const assignments = await Assignment.find()
                .sort({ createdAt: -1 });

            return res.status(200).json({
                message: "Assignments fetched successfully!",
                assignments
            });

        } catch (error) {

            console.error("Assignment Fetch Error:", error);

            return res.status(500).json({
                message: "Failed to fetch assignments!"
            });
        }
    }
);

app.post(
    "/api/admin/assignments",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

        try {

            const {
                title,
                subject,
                description,
                dueDate,
                totalMarks
            } = req.body || {};

            if (
                ![title, subject, description, dueDate].every(
                    (value) => typeof value === "string" && value.trim()
                ) ||
                !Number.isFinite(Number(totalMarks)) ||
                Number(totalMarks) < 1
            ) {

                return res.status(400).json({
                    message: "Please provide valid assignment details!"
                });
            }

            const assignment = await Assignment.create({

                title: title.trim(),
                subject: subject.trim(),
                description: description.trim(),
                dueDate,
                totalMarks: Number(totalMarks)

            });

            try {

                const students = await Student.find({}, "studentId");

                if (students.length) {

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

            return res.status(201).json({
                message: "Assignment created successfully!",
                assignment
            });

        } catch (error) {

            console.error("Assignment Create Error:", error);

            return res.status(500).json({
                message: "Failed to create assignment!"
            });
        }
    }
);

app.put(
    "/api/admin/assignments/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

        try {

            const { id } = req.params;

            if (!isValidId(id)) {

                return res.status(400).json({
                    message: "Invalid assignment ID!"
                });
            }

            const allowed = [
                "title",
                "subject",
                "description",
                "dueDate",
                "totalMarks"
            ];

            const update = {};

            for (const key of allowed) {
                if (req.body && req.body[key] !== undefined) {
                    update[key] = req.body[key];
                }
            }

            if (update.totalMarks !== undefined) {

                update.totalMarks = Number(update.totalMarks);

                if (
                    !Number.isFinite(update.totalMarks) ||
                    update.totalMarks < 1
                ) {

                    return res.status(400).json({
                        message: "Total marks must be at least 1!"
                    });
                }
            }

            const assignment = await Assignment.findByIdAndUpdate(
                id,
                update,
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

            return res.status(200).json({
                message: "Assignment updated successfully!",
                assignment
            });

        } catch (error) {

            console.error("Assignment Update Error:", error);

            return res.status(500).json({
                message: "Failed to update assignment!"
            });
        }
    }
);

app.delete(
    "/api/admin/assignments/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

        try {

            if (!isValidId(req.params.id)) {

                return res.status(400).json({
                    message: "Invalid assignment ID!"
                });
            }

            const assignment = await Assignment.findByIdAndDelete(
                req.params.id
            );

            if (!assignment) {

                return res.status(404).json({
                    message: "Assignment not found!"
                });
            }

            await Submission.deleteMany({
                assignmentId: assignment._id
            });

            return res.status(200).json({
                message: "Assignment deleted successfully!"
            });

        } catch (error) {

            console.error("Assignment Delete Error:", error);

            return res.status(500).json({
                message: "Failed to delete assignment!"
            });
        }
    }
);

// ==========================================
// STUDENT - ASSIGNMENTS
// ==========================================

app.get(
    "/api/student/attendance",
    authenticateToken,
    requireStudent,
    async (req, res) => {
        try {
            const attendance = await Attendance.find({
                studentId: req.student.studentId
            }).sort({ date: -1 });

            return res.status(200).json({
                message: "Attendance fetched successfully!",
                attendance
            });
        } catch (error) {
            console.error("Student Attendance Error:", error);
            return res.status(500).json({
                message: "Failed to fetch attendance!"
            });
        }
    }
);

app.get(
    "/api/student/assignments",
    authenticateToken,
    requireStudent,
    async (req, res) => {

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
    }
);

// ==========================================
// STUDENT - SUBMISSIONS
// ==========================================

app.get(
    "/api/student/submissions/:studentId",
    authenticateToken,
    requireStudent,
    async (req, res) => {

        try {

            const submissions = await Submission.find({
                studentId: req.student.studentId
            })
                .populate(
                    "assignmentId",
                    "title subject dueDate totalMarks"
                )
                .sort({ submittedAt: -1 });

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
    }
);

app.post(
    "/api/student/submissions",
    authenticateToken,
    requireStudent,
    async (req, res) => {

        try {

            const { assignmentId } = req.body || {};

            if (!assignmentId || !isValidId(assignmentId)) {

                return res.status(400).json({
                    message: "Valid assignment ID is required!"
                });
            }

            const assignment = await Assignment.findById(assignmentId);

            if (!assignment) {

                return res.status(404).json({
                    message: "Assignment not found!"
                });
            }

            const studentId = req.student.studentId;

            const submission = await Submission.findOneAndUpdate(
                {
                    assignmentId,
                    studentId
                },
                {
                    assignmentId,
                    studentId,
                    studentName: req.student.name,
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
    }
);

// ==========================================
// STUDENT - UPLOAD ASSIGNMENT
// ==========================================

app.post(
    "/api/student/upload-assignment",
    authenticateToken,
    requireStudent,
    upload.single("assignmentFile"),
    async (req, res) => {

        try {

            const { assignmentId } = req.body || {};

            if (!assignmentId || !isValidId(assignmentId) || !req.file) {

                if (req.file) {
                    await removeUploadedFile(req.file.path);
                }

                return res.status(400).json({
                    message: "Valid assignment and file are required!"
                });
            }

            const assignment = await Assignment.findById(assignmentId);

            if (!assignment) {

                await removeUploadedFile(req.file.path);

                return res.status(404).json({
                    message: "Assignment not found!"
                });
            }

            const studentId = req.student.studentId;

            const submission = await Submission.findOneAndUpdate(
                {
                    assignmentId,
                    studentId
                },
                {
                    assignmentId,
                    studentId,
                    studentName: req.student.name,
                    status: "Submitted",
                    submittedAt: new Date(),
                    fileName: path.basename(req.file.originalname),
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

            if (req.file) {
                await removeUploadedFile(req.file.path);
            }

            console.error("File Upload Error:", error);

            return res.status(500).json({
                message: "Assignment upload failed!"
            });
        }
    }
);

// ==========================================
// ADMIN - SUBMISSIONS
// ==========================================

app.get(
    "/api/admin/submissions",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

        try {

            const submissions = await Submission.find()
                .populate(
                    "assignmentId",
                    "title subject dueDate totalMarks"
                )
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
    }
);

// ==========================================
// ADMIN - DOWNLOAD SUBMISSION FILE
// ==========================================

app.get(
    "/api/admin/submissions/:id/file",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

        try {

            if (!isValidId(req.params.id)) {

                return res.status(400).json({
                    message: "Invalid submission ID!"
                });
            }

            const submission = await Submission.findById(
                req.params.id
            );

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
                path.basename(
                    submission.fileName || "assignment-file"
                )
            );

        } catch (error) {

            console.error("File Download Error:", error);

            return res.status(500).json({
                message: "Unable to access submission file!"
            });
        }
    }
);

// ==========================================
// ADMIN - GRADE SUBMISSION
// ==========================================

app.put(
    "/api/admin/submissions/:id/grade",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

        try {

            const { id } = req.params;
            const { obtainedMarks, feedback } = req.body || {};

            if (!isValidId(id)) {

                return res.status(400).json({
                    message: "Invalid submission ID!"
                });
            }

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

            const submission = await Submission.findById(id)
                .populate("assignmentId", "title totalMarks");

            if (!submission || !submission.assignmentId) {

                return res.status(404).json({
                    message: "Submission or assignment not found!"
                });
            }

            if (
                Number(obtainedMarks) >
                submission.assignmentId.totalMarks
            ) {

                return res.status(400).json({
                    message: "Obtained marks cannot exceed total marks!"
                });
            }

            const wasAlreadyChecked = submission.status === "Checked";

            submission.obtainedMarks = Number(obtainedMarks);

            submission.feedback = String(feedback || "")
                .trim()
                .slice(0, 2000);

            submission.status = "Checked";
            submission.checkedAt = new Date();

            await submission.save();

            try {

                await Notification.create({

                    studentId: submission.studentId,

                    title: wasAlreadyChecked
                        ? "Assignment Result Updated"
                        : "Assignment Result Published",

                    message:
                        `${submission.assignmentId.title} has been checked. Your marks: ${submission.obtainedMarks}/${submission.assignmentId.totalMarks}.` +
                        (submission.feedback
                            ? ` Feedback: ${submission.feedback}`
                            : ""),

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
    }
);

// ==========================================
// ADMIN - DELETE SUBMISSION
// ==========================================

app.delete(
    "/api/admin/submissions/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

        try {

            if (!isValidId(req.params.id)) {

                return res.status(400).json({
                    message: "Invalid submission ID!"
                });
            }

            const submission = await Submission.findById(
                req.params.id
            );

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
    }
);

// ==========================================
// STUDENT - DELETE OWN SUBMISSION
// ==========================================

app.delete(
    "/api/student/submissions/:submissionId/:studentId",
    authenticateToken,
    requireStudent,
    async (req, res) => {

        try {

            const { submissionId } = req.params;

            if (!isValidId(submissionId)) {

                return res.status(400).json({
                    message: "Invalid submission ID!"
                });
            }

            const submission = await Submission.findOne({

                _id: submissionId,
                studentId: req.student.studentId

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

// ==========================================
// ADMIN - NOTIFICATIONS
// ==========================================

app.get(
    "/api/admin/notifications",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const notifications = await Notification.find()
                .sort({ createdAt: -1 })
                .limit(300);
            return res.status(200).json({ notifications });
        } catch (error) {
            console.error("Admin Notification Fetch Error:", error);
            return res.status(500).json({ message: "Failed to load notifications." });
        }
    }
);

app.post(
    "/api/admin/notifications",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const { title, message, category = "Announcement" } = req.body || {};
            const allowedCategories = ["Assignment", "Attendance", "Event", "Announcement", "Result"];

            if (
                typeof title !== "string" || !title.trim() ||
                typeof message !== "string" || !message.trim() ||
                !allowedCategories.includes(category)
            ) {
                return res.status(400).json({ message: "Enter a title, message, and valid category." });
            }

            const students = await Student.find().select("studentId");
            if (!students.length) {
                return res.status(404).json({ message: "No registered students to notify." });
            }

            const docs = students.map(student => ({
                studentId: student.studentId,
                title: title.trim(),
                message: message.trim(),
                category
            }));

            await Notification.insertMany(docs);
            return res.status(201).json({
                message: `Notification sent to ${docs.length} student(s).`,
                sentCount: docs.length
            });
        } catch (error) {
            console.error("Admin Notification Create Error:", error);
            return res.status(500).json({ message: "Failed to send notification." });
        }
    }
);

app.delete(
    "/api/admin/notifications/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            if (!isValidId(req.params.id)) {
                return res.status(400).json({ message: "Invalid notification ID." });
            }
            const deleted = await Notification.findByIdAndDelete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ message: "Notification not found." });
            }
            return res.status(200).json({ message: "Notification deleted." });
        } catch (error) {
            console.error("Admin Notification Delete Error:", error);
            return res.status(500).json({ message: "Failed to delete notification." });
        }
    }
);

// ==========================================
// STUDENT - NOTIFICATIONS
// ==========================================

// GET NOTIFICATIONS

app.get(
    "/api/student/notifications/:studentId",
    authenticateToken,
    requireStudent,
    async (req, res) => {

        try {

            const notifications = await Notification.find({
                studentId: req.student.studentId
            }).sort({ createdAt: -1 });

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
    }
);

// MARK ONE NOTIFICATION AS READ

app.put(
    "/api/student/notifications/:id/read/:studentId",
    authenticateToken,
    requireStudent,
    async (req, res) => {

        try {

            if (!isValidId(req.params.id)) {

                return res.status(400).json({
                    message: "Invalid notification ID!"
                });
            }

            const notification = await Notification.findOneAndUpdate(
                {
                    _id: req.params.id,
                    studentId: req.student.studentId
                },
                {
                    read: true
                },
                {
                    new: true
                }
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
    }
);

// MARK ALL NOTIFICATIONS AS READ

app.put(
    "/api/student/notifications/read-all/:studentId",
    authenticateToken,
    requireStudent,
    async (req, res) => {

        try {

            await Notification.updateMany(
                {
                    studentId: req.student.studentId,
                    read: false
                },
                {
                    read: true
                }
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
    }
);

// DELETE ONE NOTIFICATION

app.delete(
    "/api/student/notifications/:id/:studentId",
    authenticateToken,
    requireStudent,
    async (req, res) => {

        try {

            if (!isValidId(req.params.id)) {

                return res.status(400).json({
                    message: "Invalid notification ID!"
                });
            }

            const notification = await Notification.findOneAndDelete({

                _id: req.params.id,
                studentId: req.student.studentId

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
    }
);

// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {

    res.send("Welcome to CAMPUS360 Backend Server!");

});

// ==========================================
// ERROR HANDLING
// ==========================================

app.use((error, req, res, next) => {

    console.error("Request Error:", error.message);

    if (error instanceof multer.MulterError) {

        return res.status(400).json({
            message: "File upload error. Maximum file size is 2MB."
        });
    }

    if (error.message && error.message.includes("Only PDF")) {

        return res.status(400).json({
            message: error.message
        });
    }

    if (error.message === "Origin not allowed by CORS") {

        return res.status(403).json({
            message: "Request origin is not allowed."
        });
    }

    return res.status(500).json({
        message: "Something went wrong."
    });
});

// ==========================================
// SERVER START
// ==========================================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "CAMPUS360 API",
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
});

async function startServer() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("CAMPUS360 MongoDB connected.");
        // Seed the first admin from hosting environment variables, without exposing credentials.
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
            await Admin.updateOne(
                { email: process.env.ADMIN_EMAIL.trim().toLowerCase() },
                { $setOnInsert: { email: process.env.ADMIN_EMAIL.trim().toLowerCase(), password: process.env.ADMIN_PASSWORD_HASH, name: "CAMPUS360 Administrator" } },
                { upsert: true }
            );
        }

        app.listen(PORT, () => {
            console.log("------------------------------------");
            console.log("CAMPUS360 Backend Server Started!");
            console.log(`Server listening on port ${PORT}`);
            console.log("------------------------------------");
        });
    } catch (error) {
        console.error("CAMPUS360 startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
