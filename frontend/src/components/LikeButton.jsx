import React, { useState, useEffect } from 'react'
import { CONTENT_SERVICE } from '../constants/api'
import api from '../utils/api'
import { parseResponse } from '../utils/parseResponse'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import { useToast } from '../context/ToastContext'

const LikeButton = ({ postId, currentUserId }) => {
  const token = localStorage.getItem('token')
  const toast = useToast()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetchWithTimeout(`${CONTENT_SERVICE}/likes/${postId}`, { timeout: 8000 })
        const parsed = await parseResponse(res)
        if (!cancelled && parsed.ok && Array.isArray(parsed.data)) {
          const data = parsed.data
          setLikeCount(data.length)
          setLiked(data.some((like) => (like.userId || like.user)?.toString() === currentUserId))
        }
      } catch (err) {
        if (!cancelled) toast?.error(err.name === 'AbortError' ? 'Request timed out' : 'Failed to load likes')
      }
    }
    load()
    return () => { cancelled = true }
  }, [postId, currentUserId, toast])

  const handleLikeToggle = async () => {
    if (!token) return
    try {
      await api.post(`${CONTENT_SERVICE}/likes`, { postId })
      setLiked((prev) => !prev)
      setLikeCount((count) => (liked ? count - 1 : count + 1))
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Failed to update like')
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
