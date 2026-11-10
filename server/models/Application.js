const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // Marksheet | ID Proof | Photo
    filename: String, // stored name on disk
    originalName: String,
    size: Number,
    mimetype: String,
    verified: { type: Boolean, default: false },
  },
  { _id: true }
);

const ApplicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: String,
    email: String,
    demo: { type: Boolean, default: false },
    personal: {
      dob: String,
      gender: String,
      category: String,
      address: String,
    },
    academic: {
      board: String,
      year: String,
      percentage: Number,
    },
    course: String, // CSE | IT | ECE | ME
    documents: [DocumentSchema],
    payment: {
      status: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
      amount: Number,
      method: String,
      txnId: String,
    },
    status: {
      type: String,
      enum: ["Draft", "Submitted", "Under Review", "Selected", "Rejected"],
      default: "Draft",
    },
    history: [{ s: String, t: Number }],
    reason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", ApplicationSchema);
