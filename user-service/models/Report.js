const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema(
  {
    reporterId:  { type: String, required: true },
    targetId:    { type: String, required: true }, // reported user or post ID
    targetType:  { type: String, enum: ['user', 'post'], default: 'user' },
    reason:      { type: String, required: true },
    details:     { type: String, default: '' },
  },
  { timestamps: true }
)

reportSchema.index({ reporterId: 1, targetId: 1, targetType: 1 }, { unique: true })

module.exports = mongoose.model('Report', reportSchema)
