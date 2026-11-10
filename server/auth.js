const jwt = require("jsonwebtoken");
const Admin = require("./admin");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ message: "Access denied. Please login first." });
  jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token." });
    req.user = user; next();
  });
};

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin" || !req.user.sub) return res.status(403).json({ message: "Admin access required." });
    const admin = await Admin.findById(req.user.sub).select("tokenVersion");
    if (!admin || Number(req.user.ver || 0) !== admin.tokenVersion) return res.status(401).json({ message: "Admin session expired. Please login again." });
    req.adminId = admin._id; next();
  } catch (error) { return res.status(401).json({ message: "Unable to verify admin session." }); }
};
module.exports = { authenticateToken, requireAdmin };
