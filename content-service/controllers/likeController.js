const Like = require("../models/Like");
const Post = require("../models/Post");
const axios = require("axios");

exports.getLikesForPost = async (req, res) => {
  try {
    const likes = await Like.find({ postId: req.params.postId });
    res.json(likes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id;

    const existing = await Like.findOne({ postId, userId });
    if (existing) {
      await Like.findByIdAndDelete(existing._id);
      return res.json({ liked: false });
    }

    const newLike = new Like({ postId, userId });
    await newLike.save();

    const post = await Post.findById(postId);
    if (post && post.userId.toString() !== userId) {
      // Send notification with updated field names and message
      await axios.post("http://localhost:5006/notifications", {
        targetUserId: post.userId.toString(),
        userId: userId,
        postId: postId,
        type: "like",
        message: `User ${userId} liked your post`,
      });
    }

    res.json({ liked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
