import React, { useEffect, useState } from 'react'
import api from '../utils/api'
import { NOTIF_SERVICE } from '../constants/api'

const Notifications = ({ token, currentUserId }) => {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!currentUserId) return
    const fetchData = async () => {
      try {
        const res = await api.get(`${NOTIF_SERVICE}/notifications/${currentUserId}`)
        const data = Array.isArray(res?.data) ? res.data : []
      } catch (err) {
        console.error('Error fetching notifications:', err)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [currentUserId])

  return (
    <div className="notifications">
      <h3>Notifications</h3>
      {notifications.map((n) => (
        <div key={n._id}>
          <p>
            <strong>{n.senderId?.fullName || 'Someone'}</strong>{' '}
            {n.type === 'like'
              ? 'liked'
              : n.type === 'comment'
                ? 'commented on'
                : 'followed'}{' '}
            your post
          </p>
        </div>
      ))}
    </div>
  )
}

export default Notifications
