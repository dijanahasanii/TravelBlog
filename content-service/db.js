// content-service/db.js
const mongoose = require('mongoose')

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ content-service: MONGO_URI is not set. Add it to content-service/.env')
    process.exit(1)
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    console.log('✅ MongoDB connected (content-service)')
  } catch (err) {
    console.error('❌ DB connection error:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
