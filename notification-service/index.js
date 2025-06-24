const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const notificationRoutes = require('./routes/notificationRoutes');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5006;

app.use(cors());
app.use(express.json());

// Log every incoming request
app.use((req, res, next) => {
  console.log(`[Notification Service] ${req.method} ${req.url}`);
  next();
});

app.use('/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('🛎️ Notification Service is running!');
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected for Notification Service'))
  .catch((err) => console.log(err));

app.listen(PORT, () => {
  console.log(`✅ Notification service running at: http://localhost:${PORT}`);
});
