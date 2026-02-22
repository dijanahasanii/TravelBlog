const mongoose = require('mongoose')

// 10 MB expressed as number of UTF-16 chars (1 char ≈ 1 byte for base64/ASCII)
const MAX_MEDIA_CHARS = 10 * 1024 * 1024

const mediaValidator = {
  validator: (v) => !v || v.length <= MAX_MEDIA_CHARS,
  message: 'Media field exceeds 10 MB size limit.',
}

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    caption: {
      type: String,
      required: true,
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    },
    // Primary image URL / data URI. Not required for video-only posts.
    image: {
      type: String,
      default: '',
      validate: mediaValidator,
    },
    // Additional images (index 0 mirrors `image` for backward compat)
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.every((v) => !v || v.length <= MAX_MEDIA_CHARS),
        message: 'One or more images exceed the 10 MB size limit.',
      },
    },
    // Optional video (base64 or URL)
    video: {
      type: String,
      default: null,
      validate: mediaValidator,
    },
    location: {
      type: String,
      required: true,
    },
    likes: {
      type: [String],
      default: [],
    },
    comments: {
      type: [
        {
          userId: String,
          text: String,
          timestamp: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

postSchema.index({ createdAt: -1 })
postSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('Post', postSchema)
