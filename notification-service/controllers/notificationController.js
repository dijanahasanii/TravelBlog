const Notification     = require('../models/Notification')
const PushSubscription = require('../models/PushSubscription')
const webPush          = require('web-push')

exports.createNotification = async (req, res) => {
  try {
    const { userId, targetUserId, postId, type, commentText } = req.body

    if (userId === targetUserId) {
      return res.status(200).json({ message: 'Self-notification skipped' })
    }

    let message = req.body.message
    if (!message) {
      if (type === 'like')         message = `Someone liked your post`
      else if (type === 'comment') message = commentText ? `Someone commented: ${commentText}` : `Someone commented on your post`
      else if (type === 'follow')  message = `Someone started following you`
      else                         message = 'You have a new notification'
    }

    const notification = new Notification({ userId, targetUserId, postId, type, commentText, message })
    const saved = await notification.save()

    // ── Socket.io — real-time in-app ──
    const io = req.app.get('io')
    if (io && targetUserId) {
      io.to(targetUserId).emit('notification', saved)
    }

    // ── Web Push — browser push notification ──
    const subs = await PushSubscription.find({ userId: targetUserId }).lean()
    const icon  = '/logo192.png'
    const badge = '/favicon.ico'
    const typeLabel = type === 'like' ? '❤️' : type === 'comment' ? '💬' : type === 'follow' ? '👤' : '🔔'

    const payload = JSON.stringify({
      title: `Wandr ${typeLabel}`,
      body:  message,
      icon,
      badge,
      data:  { postId, type, url: postId ? `/posts/${postId}` : '/notifications' },
    })

    await Promise.all(
      subs.map((sub) =>
        webPush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        ).catch(async (err) => {
          // Subscription expired or invalid — remove it
          if (err.statusCode === 404 || err.statusCode === 410) {
            await PushSubscription.deleteOne({ endpoint: sub.endpoint })
          }
        })
      )
    )

    res.status(201).json(saved)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      targetUserId: req.params.userId,
    }).sort({ createdAt: -1 })
    res.status(200).json(notifications)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
