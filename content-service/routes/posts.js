const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/auth')
const Post = require('../models/Post')
const Like = require('../models/Like')
const Comment = require('../models/Comment')
const axios = require('axios')
const {
  createPost,
  getAllPosts,
  updatePost,
} = require('../controllers/postController')

// Create a post
router.post('/', verifyToken, createPost)

// GET /posts/search?q=term  → search posts by caption or location
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q) return res.json([])
  try {
    const regex = new RegExp(q, 'i')
    const posts = await Post.find({
      $or: [{ caption: regex }, { location: regex }],
    })
      .sort({ createdAt: -1 })
      .limit(30)
    res.json(posts)
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message })
  }
})

// Get all posts
router.get('/', getAllPosts)

// Get posts by a specific user
router.get('/user/:userId', async (req, res) => {
  const mongoose = require('mongoose')
  if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
    return res.status(400).json({ message: 'Invalid user ID' })
  }
  try {
    const posts = await Post.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .allowDiskUse(true)
    res.json(posts)
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error fetching user posts', error: err.message })
  }
})

// Get a single post by ID
router.get('/:id', async (req, res) => {
  const mongoose = require('mongoose')
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: 'Post not found' })
  }
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })
    res.json(post)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching post', error: err.message })
  }
})

// Update a post
router.put('/:postId', verifyToken, updatePost)

// Delete a post
router.delete('/:id', verifyToken, async (req, res) => {
  const mongoose = require('mongoose')
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: 'Post not found' })
  }
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (post.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to delete this post',
        tokenUser: req.user.id,
        postOwner: post.userId,
      })
    }

    await post.deleteOne()

    // Cascade delete likes, comments, and notifications for this post
    await Promise.all([
      Like.deleteMany({ postId: req.params.id }),
      Comment.deleteMany({ postId: req.params.id }),
      axios
        .delete(`${process.env.NOTIF_SERVICE_URL || 'http://localhost:5006'}/notifications/post/${req.params.id}`)
        .catch((err) => console.error('[notify] delete notifications for post error:', err.message)),
    ])

    res.json({ message: 'Post deleted successfully' })
  } catch (err) {
    console.error('❌ Error in DELETE /posts/:id:', err.message)
    res
      .status(500)
      .json({ message: 'Failed to delete post', error: err.message })
  }
})

module.exports = router
