import React, { useEffect, useState } from 'react'
import { CONTENT_SERVICE } from '../constants/api'

const CommentSection = ({ postId, currentUserId }) => {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`${CONTENT_SERVICE}/comments/${postId}`)
        const data = await res.json()
        if (!cancelled) setComments(data)
      } catch (err) {
        if (!cancelled) console.error('❌ Failed to load comments:', err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [postId])

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      const res = await fetch(`${CONTENT_SERVICE}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          userId: currentUserId,
          text: newComment.trim(),
        }),
      })

      if (res.ok) {
        const created = await res.json()
        setComments((prev) => [...prev, created])
        setNewComment('')
      } else {
        console.error('❌ Failed to post comment')
      }
    } catch (err) {
      console.error('❌ Error posting comment:', err)
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
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button type="submit">Post</button>
      </form>
    </div>
  )
}

export default CommentSection
