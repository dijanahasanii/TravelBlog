// content-service/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected (content-service)");
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
