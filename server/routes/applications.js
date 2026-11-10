const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Application = require("../models/Application");
const { auth } = require("../middleware/auth");

const router = express.Router();
const FEE = 500;
const REQUIRED_DOCS = ["Marksheet", "ID Proof", "Photo"];

// ---- file upload setup (stores into /uploads) ----
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1e6) + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB

function isComplete(a) {
  return a && a.personal && a.personal.dob && a.academic && a.academic.percentage && a.course;
}
function docsOk(a) {
  const types = (a.documents || []).map((d) => d.type);
  return REQUIRED_DOCS.every((t) => types.includes(t));
}

// GET /api/applications/me  -> the logged-in student's application (or null)
router.get("/me", auth, async (req, res) => {
  const app = await Application.findOne({ student: req.user._id });
  res.json({ application: app });
});

// POST /api/applications  -> create or update the draft (personal/academic/course)
router.post("/", auth, async (req, res) => {
  const { personal, academic, course } = req.body;
  let app = await Application.findOne({ student: req.user._id });
  if (app && app.status !== "Draft") return res.status(400).json({ error: "Application already submitted" });
  if (!app) {
    app = new Application({ student: req.user._id, name: req.user.name, email: req.user.email, payment: { status: "Unpaid" } });
  }
  if (personal) app.personal = personal;
  if (academic) app.academic = academic;
  if (typeof course === "string") app.course = course;
  await app.save();
  res.json({ application: app });
});

// POST /api/applications/documents  (multipart: file, type)
router.post("/documents", auth, upload.single("file"), async (req, res) => {
  const type = req.body.type;
  if (!REQUIRED_DOCS.includes(type)) return res.status(400).json({ error: "Invalid document type" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  let app = await Application.findOne({ student: req.user._id });
  if (!app) app = new Application({ student: req.user._id, name: req.user.name, email: req.user.email, payment: { status: "Unpaid" } });
  if (app.status !== "Draft") return res.status(400).json({ error: "Application already submitted" });
  app.documents = (app.documents || []).filter((d) => d.type !== type); // one per type
  app.documents.push({
    type,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    verified: false,
  });
  await app.save();
  res.json({ application: app });
});

// DELETE /api/applications/documents/:docId
router.delete("/documents/:docId", auth, async (req, res) => {
  const app = await Application.findOne({ student: req.user._id });
  if (!app || app.status !== "Draft") return res.status(400).json({ error: "Cannot edit documents" });
  app.documents = (app.documents || []).filter((d) => String(d._id) !== req.params.docId);
  await app.save();
  res.json({ application: app });
});

// POST /api/applications/pay   { method }
router.post("/pay", auth, async (req, res) => {
  const app = await Application.findOne({ student: req.user._id });
  if (!app) return res.status(404).json({ error: "No application" });
  if (!isComplete(app)) return res.status(400).json({ error: "Complete your application details first" });
  app.payment = { status: "Paid", amount: FEE, method: req.body.method || "UPI", txnId: "TXN" + Math.floor(10000 + Math.random() * 89999) };
  await app.save();
  res.json({ application: app });
});

// POST /api/applications/submit
router.post("/submit", auth, async (req, res) => {
  const app = await Application.findOne({ student: req.user._id });
  if (!app) return res.status(404).json({ error: "No application" });
  if (!isComplete(app)) return res.status(400).json({ error: "Complete your application details first" });
  if (!docsOk(app)) return res.status(400).json({ error: "Upload all required documents first" });
  if (!(app.payment && app.payment.status === "Paid")) return res.status(400).json({ error: "Pay the application fee first" });
  app.status = "Submitted";
  app.history = [{ s: "Submitted", t: Date.now() }];
  await app.save();
  res.json({ application: app });
});

module.exports = router;
