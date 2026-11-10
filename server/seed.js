// Seeds the database with an admin account + a few sample applicants
// so the dashboard and admin side have content to demo.
// Run:  npm run seed
require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const Application = require("./models/Application");
const Merit = require("./models/Merit");

const FEE = 500;

async function run() {
  await connectDB();
  await Promise.all([User.deleteMany({}), Application.deleteMany({}), Merit.deleteMany({})]);

  const adminHash = await bcrypt.hash("admin123", 10);
  await User.create({ name: "Admission Officer", email: "admin@iem.edu", passwordHash: adminHash, role: "admin", verified: true });

  const demoHash = await bcrypt.hash("demo123", 10);
  const samples = [
    ["Ananya Ghosh", "ananya@example.com", "CSE", 92, "Selected"],
    ["Rohan Mehta", "rohan@example.com", "IT", 84, "Under Review"],
    ["Ishita Roy", "ishita@example.com", "ECE", 77, "Submitted"],
  ];

  for (const [name, email, course, marks, status] of samples) {
    const u = await User.create({ name, email, passwordHash: demoHash, role: "student", verified: true, demo: true });
    const history = [{ s: "Submitted", t: Date.now() - 6 * 864e5 }];
    if (status === "Under Review") history.push({ s: "Under Review", t: Date.now() - 3 * 864e5 });
    if (status === "Selected") {
      history.push({ s: "Under Review", t: Date.now() - 3 * 864e5 });
      history.push({ s: "Selected", t: Date.now() - 1 * 864e5 });
    }
    await Application.create({
      student: u._id,
      name,
      email,
      demo: true,
      personal: { dob: "2006-05-14", gender: "—", category: "General", address: "Kolkata, West Bengal" },
      academic: { board: "CBSE", year: "2024", percentage: marks },
      course,
      documents: ["Marksheet", "ID Proof", "Photo"].map((t) => ({
        type: t,
        filename: "sample.pdf",
        originalName: t.toLowerCase().replace(" ", "_") + ".pdf",
        size: 200000,
        mimetype: "application/pdf",
        verified: status !== "Submitted",
      })),
      payment: { status: "Paid", amount: FEE, method: "UPI", txnId: "TXN" + Math.floor(70000 + Math.random() * 9999) },
      status,
      history,
    });
  }

  console.log("Seeded: admin@iem.edu / admin123  +  3 sample applicants (password demo123).");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
