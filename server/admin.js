const mongoose = require("mongoose");
const adminSchema = new mongoose.Schema({
  name: { type: String, default: "CAMPUS360 Administrator", trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  avatar: { type: String, default: "" },
  resetCodeHash: { type: String, default: null },
  resetCodeExpires: { type: Date, default: null },
  tokenVersion: { type: Number, default: 0 },
  lastLoginAt: { type: Date, default: null },
  loginHistory: [{ at: Date, ip: String, userAgent: String }]
}, { timestamps: true });
module.exports = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
