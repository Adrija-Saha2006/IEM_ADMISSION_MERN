const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { auth, sign } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register  { name, email, phone, password }
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email and password are required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: "An account with that email already exists" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, passwordHash, role: "student", verified: true });
    return res.json({ token: sign(user), user: user.toSafe() });
  } catch (e) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login  { email, password, role? }
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(401).json({ error: "No account with that email" });
    const ok = await bcrypt.compare(password || "", user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Incorrect password" });
    if (role && user.role !== role)
      return res.status(403).json({ error: "This account is registered as " + (user.role === "admin" ? "Admission Officer" : "Applicant") });
    return res.json({ token: sign(user), user: user.toSafe() });
  } catch (e) {
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/auth/me
router.get("/me", auth, (req, res) => res.json({ user: req.user.toSafe() }));

module.exports = router;
