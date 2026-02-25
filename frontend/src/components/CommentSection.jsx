import React, { useEffect, useState } from 'react'
import { CONTENT_SERVICE } from '../constants/api'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'

const CommentSection = ({ postId, currentUserId }) => {
  const toast = useToast()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get(`${CONTENT_SERVICE}/comments/${postId}`)
        const data = Array.isArray(res?.data) ? res.data : []
        if (!cancelled) setComments(data)
      } catch (err) {
        if (!cancelled) toast?.error('Failed to load comments')
      }
    }
    load()
    return () => { cancelled = true }
  }, [postId, toast])

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await api.post(`${CONTENT_SERVICE}/comments`, {
        postId,
        text: newComment.trim(),
      })
      const created = res?.data?.comment || res?.data
      if (created) setComments((prev) => [...prev, created])
      setNewComment('')
    } catch (err) {
      toast?.error(err?.response?.data?.error || 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTimeAgo = (timestamp) => {
    const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="comment-section">
      <h4>Comments</h4>
      {comments.map((comment) => (
        <div key={comment._id} className="comment">
          <strong>
            {comment.user === currentUserId ? 'You' : comment.username}
          </strong>
          : {comment.text}
          <div className="comment-time">{formatTimeAgo(comment.createdAt)}</div>
        </div>
      ))}

      <form onSubmit={handleCommentSubmit}>
        <input
          disabled={submitting}
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button type="submit" disabled={submitting}>Post</button>
      </form>
    </div>
  )
}

export default CommentSection
