const Notification = require('../models/Notification');

exports.createNotification = async (req, res) => {
  try {
    const { userId, targetUserId, type, commentText } = req.body;

    // Build message server-side if not provided
    let message = req.body.message;
    if (!message) {
      if (type === 'like') {
        message = `${userId} liked your post`;
      } else if (type === 'comment') {
        message = commentText
          ? `${userId} commented: ${commentText}`
          : `${userId} commented on your post`;
      } else {
        message = 'You have a new notification';
      }
    }

    const notification = new Notification({
      userId,
      targetUserId,
      type,
      commentText,
      message,
    });

    const saved = await notification.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Fetch notifications where targetUserId equals requested user
    const notifications = await Notification.find({ targetUserId: userId }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
