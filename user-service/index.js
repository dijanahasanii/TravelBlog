const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const User = require("./models/User");
const userRoutes = require("./routes/userRoutes");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Optional welcome route
app.get("/", (req, res) => {
  res.send("User Service is running");
});

// Mount user routes
app.use("/users", userRoutes);

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// ✅ REGISTER
app.post("/register", async (req, res) => {
  try {
    const { username, password, fullName, email } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashedPassword,
      fullName,
      email,
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        message: `The ${field} "${err.keyValue[field]}" is already taken.`,
      });
    }

    res.status(500).json({
      message: "Registration failed",
      error: err.message,
    });
  }
});

// ✅ LOGIN
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        location: user.location,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`🚀 user-service running on http://localhost:${PORT}`);
});
