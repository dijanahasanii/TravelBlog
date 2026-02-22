const express    = require('express')
const http       = require('http')
const { Server } = require('socket.io')
const mongoose   = require('mongoose')
const cors       = require('cors')
const rateLimit  = require('express-rate-limit')
const helmet     = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const webPush    = require('web-push')
const dotenv     = require('dotenv')
dotenv.config()

// ── VAPID setup ───────────────────────────────────────────────────────────────
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || 'BH0RjhWx-wImvCTAXnCJ3VnXCB1DJ5h4IFwFIMHWPusB6DzM4BPiqDRAFgZKeexzjdij98IHzBCeowNXxjgHog8'
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'eW36tbRtj_mVUm8nYDCelMtvipsxNpQtrOlh9s41ZE0'

webPush.setVapidDetails(
  'mailto:wandr@example.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE
)

const app    = express()
const server = http.createServer(app)

const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } })
app.set('io', io)

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '4kb' }))
app.use(mongoSanitize())

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
}))

app.use((req, res, next) => {
  console.log(`[Notification Service] ${req.method} ${req.url}`)
  next()
})

// ── Notification routes ───────────────────────────────────────────────────────
const notificationRoutes = require('./routes/notificationRoutes')
app.use('/notifications', notificationRoutes)

// ── Push-subscription routes ──────────────────────────────────────────────────
const PushSubscription = require('./models/PushSubscription')

// Return public VAPID key so the frontend can subscribe
app.get('/push/vapid-public-key', (req, res) => {
  res.json({ key: VAPID_PUBLIC })
})

// Save a new push subscription for a user
app.post('/push/subscribe', async (req, res) => {
  try {
    const { userId, subscription } = req.body
    if (!userId || !subscription?.endpoint) {
      return res.status(400).json({ error: 'userId and subscription required' })
    }
    await PushSubscription.findOneAndUpdate(
      { userId, endpoint: subscription.endpoint },
      { userId, endpoint: subscription.endpoint, keys: subscription.keys },
      { upsert: true, new: true }
    )
    res.json({ message: 'Subscribed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Remove a push subscription
app.delete('/push/unsubscribe', async (req, res) => {
  try {
    const { userId, endpoint } = req.body
    await PushSubscription.deleteOne({ userId, endpoint })
    res.json({ message: 'Unsubscribed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/', (req, res) => res.send('🛎️ Notification Service is running!'))

// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId
  if (userId) {
    socket.join(userId)
    console.log(`[Socket] User ${userId} connected (${socket.id})`)
  }
  socket.on('disconnect', () => {
    console.log(`[Socket] ${socket.id} disconnected`)
  })
})

// 404 — unknown routes return JSON instead of HTML
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// ── DB + server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5006

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected for Notification Service'))
  .catch((err) => console.log(err))

server.listen(PORT, () =>
  console.log(`✅ Notification service + Socket.io running at: http://localhost:${PORT}`)
)
