const express = require('express');
const router = express.Router();
const {
  createNotification,
  getUserNotifications,
} = require('../controllers/notificationController');

router.post('/', createNotification);
router.get('/:userId', getUserNotifications);

module.exports = router;
