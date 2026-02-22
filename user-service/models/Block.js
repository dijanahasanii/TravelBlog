const mongoose = require('mongoose')

const blockSchema = new mongoose.Schema(
  {
    blockerId:  { type: String, required: true },
    blockedId:  { type: String, required: true },
  },
  { timestamps: true }
)

blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true })

module.exports = mongoose.model('Block', blockSchema)
