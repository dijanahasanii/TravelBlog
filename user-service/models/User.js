const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    bio: { type: String },
    location: { type: String },
    avatar: { type: String, default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)
