const Like = require('../models/Like')
const Post = require('../models/Post')
const mongoose = require('mongoose')
const axios = require('axios')

exports.getLikesForPost = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
    return res.status(400).json({ error: 'Invalid post ID' })
  }
  try {
    const likes = await Like.find({ postId: req.params.postId })
    res.json(likes)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.toggleLike = async (req, res) => {
  try {
    const { postId } = req.body
    const userId = req.user.id
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Valid postId is required' })
    }

    const existing = await Like.findOne({ postId, userId })
    if (existing) {
      await Like.findByIdAndDelete(existing._id)
      return res.json({ liked: false })
    }

    const newLike = new Like({ postId, userId })
    await newLike.save()

    const post = await Post.findById(postId)
    if (post && post.userId.toString() !== userId) {
      axios
        .post(`${process.env.NOTIF_SERVICE_URL || 'http://localhost:5006'}/notifications`, {
          targetUserId: post.userId.toString(),
          userId: userId,
          postId: postId,
          type: 'like',
          message: `User ${userId} liked your post`,
        })
        .catch((err) => console.error('[notify] sendNotification error:', err.message))
    }

    res.json({ liked: true })
  } catch (err) {
    console.error('[likes] toggleLike error:', err.message)
    res.status(500).json({ error: err.message })
  }
}
