require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch((e) => {
    console.error("Could not connect to MongoDB:", e.message);
    console.error("Set MONGO_URI in server/.env (local MongoDB or a free MongoDB Atlas cluster).");
    process.exit(1);
  });
