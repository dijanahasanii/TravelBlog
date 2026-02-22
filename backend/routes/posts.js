const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')

// Get feed posts
router.get('/feed', auth, async (req, res) => {
  try {
    // In a real app, you would fetch posts from your database
    // This is a mock response
    const mockPosts = Array(10)
      .fill()
      .map((_, i) => ({
        id: i,
        username: `user${i}`,
        imageUrl: `https://picsum.photos/500/300?random=${i}`,
        caption: `This is a sample post ${i}`,
        location: `Location ${i}`,
        likes: Math.floor(Math.random() * 100),
        comments: Array(3)
          .fill()
          .map((_, j) => ({
            username: `commenter${j}`,
            text: `This is comment ${j}`,
            time: `${j + 1} hours ago`,
          })),
        time: `${i + 1} hours ago`,
      }))

    res.json(mockPosts)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Create a new post
router.post('/', auth, async (req, res) => {
  try {
    const { imageUrl, caption, location } = req.body

    // In a real app, you would save the post to the database
    // Here we're just returning a mock response
    const newPost = {
      id: Date.now(),
      username: req.user.username,
      imageUrl,
      caption,
      location,
      likes: 0,
      comments: [],
      time: 'Just now',
    }

    res.status(201).json(newPost)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
