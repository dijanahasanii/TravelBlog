const Comment = require('../models/Comment')
const Post = require('../models/Post')
const mongoose = require('mongoose')
const axios = require('axios')

exports.getCommentsForPost = async (req, res) => {
  try {
    // Return all comments for a post (top-level + replies), sorted oldest first
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: 1 })
    res.json(comments)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.addComment = async (req, res) => {
  try {
    const { postId, text, parentId } = req.body
    const userId = req.user.id

    const newComment = new Comment({
      postId,
      userId,
      text,
      parentId: parentId || null,
    })
    await newComment.save()

    const post = await Post.findById(postId)
    if (post && post.userId.toString() !== userId) {
      axios.post('http://localhost:5006/notifications', {
        targetUserId: post.userId.toString(),
        userId,
        postId,
        type: 'comment',
        commentText: text,
        message: `User ${userId} commented: ${text}`,
      }).catch(() => {})
    }

    res.status(201).json({ message: 'Comment added', comment: newComment })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}

// Toggle like on a comment
exports.toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params
    const userId = new mongoose.Types.ObjectId(req.user.id)

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    const comment = await Comment.findById(commentId)
    if (!comment) return res.status(404).json({ error: 'Comment not found' })

    const idx = comment.likes.findIndex((id) => id.equals(userId))
    if (idx === -1) {
      comment.likes.push(userId)
    } else {
      comment.likes.splice(idx, 1)
    }
    await comment.save()

    res.json({ liked: idx === -1, likeCount: comment.likes.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
