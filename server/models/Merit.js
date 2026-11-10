const mongoose = require("mongoose");

// A single merit-list document (key: "main").
const MeritSchema = new mongoose.Schema({
  key: { type: String, default: "main", unique: true },
  published: { type: Boolean, default: false },
  publishDate: Number,
  criteria: { type: String, default: "Aggregate percentage (descending)" },
  entries: [
    {
      rank: Number,
      application: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
      name: String,
      course: String,
      score: Number,
    },
  ],
});

module.exports = mongoose.model("Merit", MeritSchema);
