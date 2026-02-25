const express = require('express')
const router = express.Router()
const { getUserById, updateUser } = require('../controllers/userController')
const verifyToken = require('../middleware/authMiddleware')
const Follow = require('../models/Follow')
const Report = require('../models/Report')
const Block = require('../models/Block')
const User = require('../models/User')
const mongoose = require('mongoose')

// GET /users/search?q=term  → search users by username or fullName
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q) return res.json([])
  try {
    const regex = new RegExp(q, 'i')
    const users = await User.find({
      $or: [{ username: regex }, { fullName: regex }],
    })
      .select('-password')
      .limit(20)
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message })
  }
})

router.get('/:userId', getUserById)
router.patch('/:id', verifyToken, updateUser)

// ── Follow / Unfollow ──────────────────────────────────────────
// POST /users/:id/follow   → follow a user
router.post('/:id/follow', verifyToken, async (req, res) => {
  const followingId = req.params.id
  const followerId  = req.user.id

  if (followerId === followingId) {
    return res.status(400).json({ message: "You can't follow yourself" })
  }
  if (!mongoose.Types.ObjectId.isValid(followingId)) {
    return res.status(400).json({ message: 'Invalid user ID' })
  }

  try {
    await Follow.create({ followerId, followingId })
    res.status(201).json({ following: true })
  } catch (err) {
    // Duplicate key = already following
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Already following' })
    }
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// DELETE /users/:id/follow  → unfollow
router.delete('/:id/follow', verifyToken, async (req, res) => {
  const followingId = req.params.id
  const followerId  = req.user.id
  if (!mongoose.Types.ObjectId.isValid(followingId)) {
    return res.status(400).json({ message: 'Invalid user ID' })
  }
  try {
    await Follow.deleteOne({ followerId, followingId })
    res.json({ following: false })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// GET /users/:id/follow-stats  → counts + whether current user follows them
router.get('/:id/follow-stats', verifyToken, async (req, res) => {
  const userId     = req.params.id
  const currentId  = req.user.id

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.json({ followers: 0, following: 0, isFollowing: false })
  }

  try {
    const [followers, following, followDoc] = await Promise.all([
      Follow.countDocuments({ followingId: userId }),
      Follow.countDocuments({ followerId:  userId }),
      Follow.findOne({ followerId: currentId, followingId: userId }),
    ])
    res.json({ followers, following, isFollowing: !!followDoc })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// GET /users/:id/followers  → paginated list of users who follow :id
router.get('/:id/followers', verifyToken, async (req, res) => {
  const userId = req.params.id
  if (!mongoose.Types.ObjectId.isValid(userId)) return res.json([])
  try {
    const follows = await Follow.find({ followingId: userId })
      .select('followerId -_id')
      .lean()
    const ids = follows.map((f) => f.followerId)
    const users = await User.find({ _id: { $in: ids } })
      .select('-password')
      .lean()
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// GET /users/:id/following  → paginated list of users that :id follows
router.get('/:id/following', verifyToken, async (req, res) => {
  const userId = req.params.id
  if (!mongoose.Types.ObjectId.isValid(userId)) return res.json([])
  try {
    const follows = await Follow.find({ followerId: userId })
      .select('followingId -_id')
      .lean()
    const ids = follows.map((f) => f.followingId)
    const users = await User.find({ _id: { $in: ids } })
      .select('-password')
      .lean()
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// GET /users/:id/following-ids  → list of IDs this user follows (for feed filtering)
router.get('/:id/following-ids', verifyToken, async (req, res) => {
  const userId = req.params.id
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.json([])
  }
  try {
    const follows = await Follow.find({ followerId: userId }).select('followingId -_id')
    res.json(follows.map((f) => f.followingId.toString()))
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// ── Report a user ─────────────────────────────────────────────────────────────
router.post('/:id/report', verifyToken, async (req, res) => {
  const { reason, details } = req.body
  if (!reason) return res.status(400).json({ message: 'Reason is required' })
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid user ID' })
  }
  try {
    await Report.create({
      reporterId: req.user.id,
      targetId:   req.params.id,
      targetType: 'user',
      reason,
      details: details || '',
    })
    res.status(201).json({ message: 'Report submitted. Thank you.' })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You already reported this user.' })
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// ── Block / unblock a user ────────────────────────────────────────────────────
router.post('/:id/block', verifyToken, async (req, res) => {
  if (req.user.id === req.params.id) return res.status(400).json({ message: "You can't block yourself" })
  try {
    await Block.create({ blockerId: req.user.id, blockedId: req.params.id })
    // Also remove any follow relationship
    await Follow.deleteMany({
      $or: [
        { followerId: req.user.id, followingId: req.params.id },
        { followerId: req.params.id, followingId: req.user.id },
      ],
    })
    res.status(201).json({ message: 'User blocked' })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Already blocked' })
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

router.delete('/:id/block', verifyToken, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid user ID' })
  }
  try {
    await Block.deleteOne({ blockerId: req.user.id, blockedId: req.params.id })
    res.json({ message: 'User unblocked' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// GET /users/:id/block-status  → is the current user blocking them?
router.get('/:id/block-status', verifyToken, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.json({ isBlocked: false })
  }
  try {
    const block = await Block.findOne({ blockerId: req.user.id, blockedId: req.params.id })
    res.json({ isBlocked: !!block })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router
