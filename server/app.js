const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors()); // allow the React dev server (and any origin) to call the API
app.use(express.json());

// serve uploaded documents
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// health check
app.get("/api/health", (req, res) => res.json({ ok: true, service: "IEM Admission API" }));

// routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/applications", require("./routes/applications"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/merit", require("./routes/merit"));

// multer / generic error handler
app.use((err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "File exceeds the 5 MB limit" });
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

module.exports = app;
