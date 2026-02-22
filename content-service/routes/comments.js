const express = require('express')
const router = express.Router()
const {
  addComment,
  getCommentsForPost,
  toggleCommentLike,
} = require('../controllers/commentController')
const auth = require('../middleware/auth')

router.post('/',                      auth, addComment)
router.get('/:postId',                      getCommentsForPost)
router.post('/:commentId/like',       auth, toggleCommentLike)

module.exports = router
