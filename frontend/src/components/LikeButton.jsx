import React, { useState, useEffect } from 'react'
import { CONTENT_SERVICE } from '../constants/api'

const LikeButton = ({ postId, currentUserId }) => {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`${CONTENT_SERVICE}/likes/${postId}`)
        const data = await res.json()
        if (!cancelled) {
          setLikeCount(data.length)
          setLiked(data.some((like) => like.user === currentUserId))
        }
      } catch (err) {
        if (!cancelled) console.error('❌ Error loading likes:', err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [postId, currentUserId])

  const handleLikeToggle = async () => {
    try {
      const res = await fetch(`${CONTENT_SERVICE}/likes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, userId: currentUserId }),
      })

      if (res.ok) {
        setLiked((prev) => !prev)
        setLikeCount((count) => (liked ? count - 1 : count + 1))
      } else {
        console.error('❌ Failed to toggle like')
      }
    } catch (err) {
      console.error('❌ Error toggling like:', err)
    }
  }

  return (
    <div className="like-button">
      <button onClick={handleLikeToggle}>
        {liked ? '❤️ Unlike' : '🤍 Like'} ({likeCount})
      </button>
    </div>
  )
}

export default LikeButton
