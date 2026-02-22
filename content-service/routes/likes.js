// routes/likes.js
const express = require('express')
const router = express.Router()
const { toggleLike, getLikesForPost } = require('../controllers/likeController')
const auth = require('../middleware/auth')

router.post('/', auth, toggleLike)
router.get('/:postId', getLikesForPost)

module.exports = router
