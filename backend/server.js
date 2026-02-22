require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const mediaRoutes = require('./routes/media') // ⬅️ media route

const app = express()

// ✅ Middleware should come first
app.use(cors())
app.use(express.json())

// ✅ Serve static uploads
app.use('/uploads', express.static('uploads'))

// ✅ API routes
app.use('/api/media', mediaRoutes)
app.use('/api/auth', authRoutes)

// ✅ Mock feed
app.get('/api/feed', (req, res) => {
  res.json({ message: 'This would return feed data in a real app' })
})

app.get('/', (req, res) => {
  res.send('Backend is running...')
})

// ✅ DB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err))

// ✅ Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
)
