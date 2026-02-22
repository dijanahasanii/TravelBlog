const express = require('express')
const router = express.Router()
const {
  createNotification,
  getUserNotifications,
} = require('../controllers/notificationController')

router.post('/', createNotification)
router.get('/:userId', getUserNotifications)
router.delete('/post/:postId', async (req, res) => {
  try {
    await require('../models/Notification').deleteMany({
      postId: req.params.postId,
    })
    res.json({ message: 'Notifications deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
