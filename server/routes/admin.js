const express = require("express");
const Application = require("../models/Application");
const { auth, admin } = require("../middleware/auth");

const router = express.Router();
router.use(auth, admin);

// Allowed status transitions
const NEXT = {
  Submitted: ["Under Review"],
  "Under Review": ["Selected", "Rejected"],
};

// GET /api/admin/applications  (all non-draft, highest marks first)
router.get("/applications", async (req, res) => {
  const apps = await Application.find({ status: { $ne: "Draft" } }).sort({ "academic.percentage": -1 });
  res.json({ applications: apps });
});

// GET /api/admin/applications/:id
router.get("/applications/:id", async (req, res) => {
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ error: "Not found" });
  res.json({ application: app });
});

// PATCH /api/admin/applications/:id/documents/:docId/verify
router.patch("/applications/:id/documents/:docId/verify", async (req, res) => {
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ error: "Not found" });
  const doc = app.documents.id(req.params.docId);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  doc.verified = true;
  await app.save();
  res.json({ application: app });
});

// PATCH /api/admin/applications/:id/status  { status, reason }
router.patch("/applications/:id/status", async (req, res) => {
  const { status, reason } = req.body;
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ error: "Not found" });
  const allowed = NEXT[app.status] || [];
  if (!allowed.includes(status))
    return res.status(400).json({ error: `Cannot move from "${app.status}" to "${status}"` });
  if (status === "Selected" && !(app.documents || []).every((d) => d.verified))
    return res.status(400).json({ error: "Verify all documents before selecting" });
  app.status = status;
  if (status === "Rejected") app.reason = reason || "Not selected in this round";
  app.history = app.history || [];
  app.history.push({ s: status, t: Date.now() });
  await app.save();
  res.json({ application: app });
});

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  const subs = await Application.find({ status: { $ne: "Draft" } });
  const count = (s) => subs.filter((a) => a.status === s).length;
  res.json({
    total: subs.length,
    submitted: count("Submitted"),
    underReview: count("Under Review"),
    selected: count("Selected"),
    rejected: count("Rejected"),
    paid: subs.filter((a) => a.payment && a.payment.status === "Paid").length,
    byCourse: ["CSE", "IT", "ECE", "ME"].map((c) => ({ course: c, n: subs.filter((a) => a.course === c).length })),
  });
});

module.exports = router;
