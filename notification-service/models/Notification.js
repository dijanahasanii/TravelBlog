const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },        // Who triggered the notification (actor)
  targetUserId: { type: String, required: true },  // Who receives the notification (recipient)
  postId: { type: String },                        // Which post triggered this
  type: { type: String, required: true },          // 'like' or 'comment'
  message: { type: String, required: true },       // Message text to display
  commentText: String,                              // Optional for comments
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
