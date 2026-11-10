const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    verified: { type: Boolean, default: true },
    demo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hide sensitive fields when converting to JSON.
UserSchema.methods.toSafe = function () {
  return { id: this._id, name: this.name, email: this.email, phone: this.phone, role: this.role, verified: this.verified };
};

module.exports = mongoose.model("User", UserSchema);
