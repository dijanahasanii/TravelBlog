// content-service/index.js
const express = require('express')
const dotenv = require('dotenv')
const connectDB = require('./db')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const postRoutes = require('./routes/posts')
const likeRoutes = require('./routes/likes')
const commentRoutes = require('./routes/comments')
const mediaRoutes = require('./routes/media')

dotenv.config()
const app = express()

// Connect to MongoDB
connectDB()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(mongoSanitize())

// Rate limiting — generous for reads, tighter for writes
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
}))

app.use('/uploads', express.static('uploads'))

// Routes
app.use('/posts', postRoutes)
app.use('/likes', likeRoutes)
app.use('/comments', commentRoutes)
app.use('/media', mediaRoutes)

// Health check
app.get('/', (req, res) => {
  res.send('Content Service is running')
})

// 404 — unknown routes return JSON instead of HTML
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

const PORT = process.env.PORT || 5002
app.listen(PORT, () => {
  console.log(`🚀 Content service running on http://localhost:${PORT}`)
})
