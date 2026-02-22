const mongoose = require('mongoose')

const pushSubSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: String,
    auth:   String,
  },
}, { timestamps: true })

pushSubSchema.index({ userId: 1, endpoint: 1 }, { unique: true })

module.exports = mongoose.model('PushSubscription', pushSubSchema)
