const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SECRET = () => process.env.JWT_SECRET || "dev_secret_change_me";

function sign(user) {
  return jwt.sign({ id: user._id, role: user.role }, SECRET(), { expiresIn: "7d" });
}

async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const payload = jwt.verify(token, SECRET());
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: "Invalid session" });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function admin(req, res, next) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Admins only" });
  next();
}

module.exports = { auth, admin, sign };
