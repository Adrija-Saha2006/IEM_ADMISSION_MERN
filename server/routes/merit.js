const express = require("express");
const Application = require("../models/Application");
const Merit = require("../models/Merit");
const { auth, admin } = require("../middleware/auth");

const router = express.Router();

async function getMerit() {
  let m = await Merit.findOne({ key: "main" });
  if (!m) m = await Merit.create({ key: "main" });
  return m;
}

// GET /api/merit   (any logged-in user can view the published list)
router.get("/", auth, async (req, res) => {
  const m = await getMerit();
  res.json({ merit: m });
});

// POST /api/merit/generate   (admin) -> ranks all "Selected" by score, publishes
router.post("/generate", auth, admin, async (req, res) => {
  const selected = await Application.find({ status: "Selected" }).sort({ "academic.percentage": -1 });
  const m = await getMerit();
  m.entries = selected.map((a, i) => ({
    rank: i + 1,
    application: a._id,
    name: a.name,
    course: a.course,
    score: a.academic.percentage || 0,
  }));
  m.published = true;
  m.publishDate = Date.now();
  await m.save();
  res.json({ merit: m });
});

// POST /api/merit/unpublish  (admin)
router.post("/unpublish", auth, admin, async (req, res) => {
  const m = await getMerit();
  m.published = false;
  await m.save();
  res.json({ merit: m });
});

module.exports = router;
