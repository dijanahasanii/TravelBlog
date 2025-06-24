const Comment = require("../models/Comment");
const Post = require("../models/Post");
const axios = require("axios");

exports.addComment = async (req, res) => {
  try {
    const { postId, text } = req.body;
    const userId = req.user.id;

    const newComment = new Comment({ postId, userId, text });
    await newComment.save();

    const post = await Post.findById(postId);
    if (post && post.userId.toString() !== userId) {
      await axios.post("http://notification-service:5006/notifications", {
        targetUserId: post.userId.toString(),  // recipient
        userId: userId,                        // actor
        type: "comment",
        commentText: text,
        message: `User ${userId} commented: ${text}`,
      });
    }

    res.status(201).json({ message: "Comment added", comment: newComment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
