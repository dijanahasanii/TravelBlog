// content-service/index.js
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./db");
const cors = require("cors");
const postRoutes = require("./routes/posts");
const likeRoutes = require("./routes/likes");
const commentRoutes = require("./routes/comments");
const mediaRoutes = require("./routes/media");

dotenv.config();
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

app.use("/uploads", express.static("uploads"));

// Routes
app.use("/posts", postRoutes);
app.use("/likes", likeRoutes);
app.use("/comments", commentRoutes);
app.use("/media", mediaRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Content Service is running");
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
console.log(`🚀 Content service running on http://localhost:${PORT}`);
});
