const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()
const connectDB = require('./db')

const locationRoutes = require('./routes/locations')

const app = express()
app.use(cors())
app.use(express.json())

// ✅ Connect to MongoDB
connectDB()

// Add this simple root route to confirm the service is running
app.get('/', (req, res) => {
  res.send('Location Service is running')
})

app.use('/', locationRoutes)

const PORT = process.env.PORT || 5003
app.listen(PORT, () =>
  console.log(`Location service running on http://localhost:${PORT}`)
)
