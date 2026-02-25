const Post = require('../models/Post')

// Create a new post (supports single `image`, multi-image `images[]`, or `video`)
exports.createPost = async (req, res) => {
  try {
    const { caption, image, images, video, location } = req.body
    const userId = req.user.id

    const imagesArray  = Array.isArray(images) && images.length > 0 ? images : image ? [image] : []
    const primaryImage = imagesArray[0] || ''
    const hasMedia     = primaryImage || video

    if (!caption || !hasMedia || !location) {
      return res.status(400).json({ message: 'Caption, media (photo or video), and location are required' })
    }

    const newPost = new Post({
      userId,
      caption,
      image:  primaryImage,
      images: imagesArray,
      video:  video || null,
      location,
    })

    await newPost.save()
    res.status(201).json({ message: 'Post created', post: newPost })
  } catch (err) {
    console.error('❌ Failed to create post:', err.message)
    res.status(500).json({ message: 'Failed to create post', error: err.message })
  }
}

// Update an existing post
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params
    const { caption, location } = req.body
    const mongoose = require('mongoose')
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const post = await Post.findById(postId)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    post.caption = caption.trim()
    post.location = location.trim()

    await post.save()
    res.json({ message: 'Post updated', post })
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Failed to update post', error: err.message })
  }
}

exports.getAllPosts = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(20, parseInt(req.query.limit) || 10)
    const skip  = (page - 1) * limit

    const [posts, total] = await Promise.all([
      Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit).allowDiskUse(true),
      Post.countDocuments(),
    ])

    res.status(200).json({
      posts,
      page,
      limit,
      total,
      hasMore: skip + posts.length < total,
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posts', error: err.message })
  }
}
