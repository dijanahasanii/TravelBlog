const express = require('express');
const router = express.Router();
const { signup, signin } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');
const User = require('../models/User');

// Register
router.post('/register', signup);

// Login
router.post('/login', signin);

// Protected profile route
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // exclude password
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
