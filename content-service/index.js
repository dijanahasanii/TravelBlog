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
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.error('❌ content-service: FRONTEND_URL is required in production (CORS). Set it in .env')
  process.exit(1)
}
const app = express()

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
  credentials: true,
}))
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

app.get('/', (req, res) => res.send('Content Service is running'))

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'content-service' })
})

// 404 — unknown routes return JSON instead of HTML
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Start server only after MongoDB is ready
const PORT = process.env.PORT || 5002
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Content service running on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('❌ content-service: startup failed:', err.message)
    process.exit(1)
  })
