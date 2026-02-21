const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const Post = require("../models/Post");
const Like = require("../models/Like");
const Comment = require("../models/Comment");
const axios = require("axios");
const { createPost, getAllPosts, updatePost } = require("../controllers/postController");

// Create a post
router.post("/", verifyToken, createPost);

// Get all posts
router.get("/", getAllPosts);

// Get posts by a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId }).sort({ createdAt: -1 }).allowDiskUse(true);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user posts", error: err.message });
  }
});

// Get a single post by ID
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Error fetching post", error: err.message });
  }
});

// Update a post
router.put("/:postId", verifyToken, updatePost);

// Delete a post
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    console.log("🔑 Decoded userId from token:", req.user.id);
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    console.log("📌 Found post, owned by:", post.userId.toString());

    if (post.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: "Not authorized to delete this post",
        tokenUser: req.user.id,
        postOwner: post.userId,
      });
    }

    await post.deleteOne();

    // Cascade delete likes, comments, and notifications for this post
    await Promise.all([
      Like.deleteMany({ postId: req.params.id }),
      Comment.deleteMany({ postId: req.params.id }),
      axios.delete(`http://localhost:5006/notifications/post/${req.params.id}`).catch(() => {}),
    ]);

    console.log("✅ Post and related data deleted");
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("❌ Error in DELETE /posts/:id:", err.message);
    res.status(500).json({ message: "Failed to delete post", error: err.message });
  }
});


module.exports = router;
