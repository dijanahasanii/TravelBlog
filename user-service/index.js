const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
require('dotenv').config()

const User = require('./models/User')
const userRoutes = require('./routes/userRoutes')

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(mongoSanitize())

// Strict limit for auth endpoints (login, register, password reset)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
})

// General limit for everything else
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
})

app.use('/login',            authLimiter)
app.use('/register',         authLimiter)
app.use('/verify-identity',  authLimiter)
app.use('/reset-password',   authLimiter)
app.use('/refresh',          authLimiter)
app.use(generalLimiter)

// ✅ Optional welcome route
app.get('/', (req, res) => {
  res.send('User Service is running')
})

// Mount user routes
app.use('/users', userRoutes)

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection failed:', err))

// ── Token helpers ──
function signAccess(id)   { return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' }) }
function signRefresh(id)  { return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', { expiresIn: '30d' }) }

// ── REFRESH TOKEN ──
app.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token' })
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh')
    const user = await User.findById(payload.id).select('-password')
    if (!user) return res.status(401).json({ message: 'User not found' })
    const newAccessToken  = signAccess(user._id)
    const newRefreshToken = signRefresh(user._id)
    res.json({ token: newAccessToken, refreshToken: newRefreshToken })
  } catch {
    res.status(401).json({ message: 'Invalid or expired refresh token. Please sign in again.' })
  }
})

// ✅ REGISTER
app.post('/register', async (req, res) => {
  try {
    const { username, password, fullName, email } = req.body

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ message: 'All fields are required.' })
    }

    const existingUsername = await User.findOne({ username })
    if (existingUsername) {
      return res.status(409).json({ message: 'Username already taken', field: 'username' })
    }

    const existingEmail = await User.findOne({ email })
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with that email already exists', field: 'email' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
      username,
      password: hashedPassword,
      fullName,
      email,
    })

    await user.save()

    const token        = signAccess(user._id)
    const refreshToken = signRefresh(user._id)

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar || null,
      },
      token,
      refreshToken,
    })
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0]
      const msg = field === 'email'
        ? 'An account with that email already exists'
        : `That ${field} is already taken`
      return res.status(409).json({ message: msg, field })
    }

    res.status(500).json({
      message: 'Registration failed',
      error: err.message,
    })
  }
})

// ✅ LOGIN
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    const user = await User.findOne({ username })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' })

    const token        = signAccess(user._id)
    const refreshToken = signRefresh(user._id)

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        location: user.location,
        avatar: user.avatar,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── FORGOT PASSWORD (no email — verify username + email, then set new password) ──
// Step 1: verify identity
app.post('/verify-identity', async (req, res) => {
  try {
    const { username, email } = req.body
    if (!username || !email) return res.status(400).json({ message: 'Username and email are required' })

    const user = await User.findOne({ username, email })
    if (!user) return res.status(404).json({ message: 'No account found with that username and email' })

    // Return a one-time token scoped only for password reset (short-lived)
    const resetToken = jwt.sign({ id: user._id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' })
    res.json({ resetToken })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Step 2: set new password using reset token
app.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body
    if (!resetToken || !newPassword) return res.status(400).json({ message: 'Token and new password are required' })
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })

    let payload
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET)
    } catch {
      return res.status(401).json({ message: 'Reset link expired or invalid. Please start over.' })
    }

    if (payload.purpose !== 'reset') return res.status(401).json({ message: 'Invalid token purpose' })

    const hashed = await bcrypt.hash(newPassword, 10)
    await User.findByIdAndUpdate(payload.id, { password: hashed })
    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// 404 — unknown routes return JSON instead of HTML
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

const PORT = process.env.PORT || 5004
app.listen(PORT, () => {
  console.log(`🚀 user-service running on http://localhost:${PORT}`)
})
