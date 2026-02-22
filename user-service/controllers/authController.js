const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

exports.register = async (req, res) => {
  const { fullName, email, password, username } = req.body

  if (!fullName || !email || !password || !username) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  const existing = await User.findOne({ username })
  if (existing) {
    return res.status(409).json({ error: 'Username already exists' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser = await User.create({
    fullName,
    email,
    username,
    password: hashedPassword,
  })

  const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  })

  res.status(201).json({
    token,
    user: {
      _id: newUser._id,
      username: newUser.username,
      fullName: newUser.fullName,
      email: newUser.email,
    },
  })
}

exports.login = async (req, res) => {
  const { username, password } = req.body

  const user = await User.findOne({ username })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Incorrect password' })

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })

  res.json({
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
    },
  })
}
