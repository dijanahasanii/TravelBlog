const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')

// Change email
router.put('/email', auth, async (req, res) => {
  try {
    const { email } = req.body

    // Validate email
    if (!email.includes('@')) {
      return res.status(400).json({ message: 'Please enter a valid email' })
    }

    // In a real app, you would update the user's email in the database
    res.json({ message: 'Email updated successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Validate passwords
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Please fill out all password fields' })
    }

    // In a real app, you would:
    // 1. Verify current password
    // 2. Hash new password
    // 3. Update password in database

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, bio, location } = req.body

    // In a real app, you would update the user's profile in the database
    res.json({
      message: 'Profile updated successfully',
      user: {
        fullName,
        bio,
        location,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
