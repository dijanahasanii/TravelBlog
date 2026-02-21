const Post = require("../models/Post");

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { caption, image, location } = req.body;
    const userId = req.user.id;

    if (!caption || !image || !location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    console.log("📨 Received post body:", {
      caption,
      imageLength: image?.length,
      location,
    });
    console.log("🔐 User from token:", userId);

    const newPost = new Post({
      userId,
      caption,
      image,
      location,
    });

    await newPost.save();
    console.log("✅ Post saved successfully");

    res.status(201).json({ message: "Post created", post: newPost });
  } catch (err) {
    console.error("❌ Failed to create post:", err.message);
    res.status(500).json({ message: "Failed to create post", error: err.message });
  }
};

// Update an existing post
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { caption, location } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    post.caption = caption.trim();
    post.location = location.trim();

    await post.save();
    res.json({ message: "Post updated", post });
  } catch (err) {
    res.status(500).json({ message: "Failed to update post", error: err.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).allowDiskUse(true);
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts", error: err.message });
  }
};
