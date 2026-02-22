/**
 * CommentThread — reusable threaded comment list + input
 *
 * Props:
 *   comments      – array of comment objects (all levels, flat — we nest client-side)
 *   onAdd(text, parentId) – called when a new comment/reply is submitted
 *   currentUserId
 *   token
 *   navigate
 *   avatarSrc     – current user's avatar URL
 */
import React, { useState } from 'react'
import { Heart, Reply, Send } from 'lucide-react'
import { formatTimeAgo } from '../utils/formatTime'
import { CONTENT_SERVICE } from '../constants/api'
import { dicebearUrl, getCurrentUserAvatar } from '../utils/avatar'

const isRealId = (id) => /^[a-f\d]{24}$/i.test(id)

// Build a nested tree: top-level comments with .replies[]
function buildTree(flat) {
  const map = {}
  const roots = []
  flat.forEach((c) => { map[c._id] = { ...c, replies: [] } })
  flat.forEach((c) => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].replies.push(map[c._id])
    } else {
      roots.push(map[c._id])
    }
  })
  return roots
}

// Single comment row (used for both top-level and replies)
function CommentRow({ comment, currentUserId, token, navigate, onReplyClick, depth = 0 }) {
  const isOwn  = comment.userId?.toString() === currentUserId
  const name   = isOwn
    ? localStorage.getItem('username') || 'You'
    : comment.username || 'traveler'
  const cid    = comment.userId?.toString()
  const canNav = isRealId(cid)

  const [likes,     setLikes]     = useState(
    Array.isArray(comment.likes) ? comment.likes : []
  )

  const isLiked = likes.some(
    (id) => id?.toString() === currentUserId || id === currentUserId
  )

  const handleLike = async () => {
    if (!isRealId(comment._id)) return
    const alreadyLiked = likes.some(
      (id) => id?.toString() === currentUserId || id === currentUserId
    )

    // Optimistic update
    setLikes((prev) =>
      alreadyLiked
        ? prev.filter((id) => id?.toString() !== currentUserId && id !== currentUserId)
        : [...prev, currentUserId]
    )

    try {
      const res = await fetch(
        `${CONTENT_SERVICE}/comments/${comment._id}/like`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error()
    } catch (_) {
      // Roll back
      setLikes((prev) =>
        alreadyLiked
          ? [...prev, currentUserId]
          : prev.filter((id) => id?.toString() !== currentUserId && id !== currentUserId)
      )
    }
  }

  const goToProfile = () => {
    if (!canNav) return
    isOwn ? navigate('/profile') : navigate(`/user/${cid}`)
  }

  return (
    <div style={{ marginLeft: depth > 0 ? 32 : 0 }}>
      <div className="comment-item" style={{ alignItems: 'flex-start' }}>
        {/* Avatar */}
        <button
          onClick={goToProfile}
          style={{ background: 'none', border: 'none', padding: 0, cursor: canNav ? 'pointer' : 'default', flexShrink: 0, marginTop: 2 }}
        >
          <img
            src={isOwn ? getCurrentUserAvatar() : dicebearUrl(name)}
            alt={name}
            className="avatar avatar-sm"
          />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Bubble */}
          <div className="comment-bubble">
            <button
              onClick={goToProfile}
              style={{ background: 'none', border: 'none', padding: 0, cursor: canNav ? 'pointer' : 'default', fontFamily: 'var(--font-sans)' }}
            >
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                @{name}
              </span>
            </button>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginLeft: 6 }}>
              {comment.text}
            </span>
          </div>

          {/* Meta row: time · like · reply */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, paddingLeft: 2 }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {formatTimeAgo(comment.createdAt || comment.timestamp)}
            </span>

            {/* Like comment */}
            <button
              onClick={handleLike}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 3,
                fontSize: 'var(--text-xs)',
                color: isLiked ? 'var(--color-like)' : 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
                fontWeight: isLiked ? 'var(--weight-semibold)' : 'var(--weight-regular)',
                padding: 0,
                transition: 'color 0.15s',
              }}
            >
              <Heart
                size={11}
                fill={isLiked ? 'currentColor' : 'none'}
                strokeWidth={isLiked ? 0 : 2}
              />
              {likes.length > 0 && <span>{likes.length}</span>}
              {!isLiked && <span>Like</span>}
            </button>

            {/* Reply (only on top-level comments) */}
            {depth === 0 && (
              <button
                onClick={() => onReplyClick(comment._id, name)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 3,
                  fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)', padding: 0,
                  transition: 'color 0.15s',
                }}
              >
                <Reply size={11} />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies?.map((reply) => (
        <CommentRow
          key={reply._id}
          comment={reply}
          currentUserId={currentUserId}
          token={token}
          navigate={navigate}
          onReplyClick={onReplyClick}
          depth={1}
        />
      ))}
    </div>
  )
}

// ── Main exported component ───────────────────────────────────────────────────
export default function CommentThread({ comments, onAdd, currentUserId, token, navigate, avatarSrc }) {
  const [text,        setText]        = useState('')
  const [replyTo,     setReplyTo]     = useState(null)  // { id, username }
  const [submitting,  setSubmitting]  = useState(false)

  const tree = buildTree(comments || [])

  const handleReplyClick = (parentId, username) => {
    setReplyTo({ id: parentId, username })
    setText(`@${username} `)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    await onAdd(trimmed, replyTo?.id || null)
    setText('')
    setReplyTo(null)
    setSubmitting(false)
  }

  return (
    <div className="post-card-footer" style={{ animation: 'fade-in 0.2s ease' }}>
      {/* Comment list */}
      {tree.length > 0 && (
        <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tree.map((c) => (
            <CommentRow
              key={c._id}
              comment={c}
              currentUserId={currentUserId}
              token={token}
              navigate={navigate}
              onReplyClick={handleReplyClick}
              depth={0}
            />
          ))}
        </div>
      )}

      {/* Reply banner */}
      {replyTo && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 8px', marginBottom: 6,
          background: 'var(--brand-50)', borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-xs)', color: 'var(--brand-600)',
          fontWeight: 'var(--weight-medium)',
        }}>
          <span><Reply size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />Replying to @{replyTo.username}</span>
          <button onClick={() => { setReplyTo(null); setText('') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: 0 }}>
            ×
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
        <div className="comment-input-row">
          <img src={avatarSrc || getCurrentUserAvatar()} alt="You" className="avatar avatar-sm" />
          <input
            className="comment-input"
            type="text"
            placeholder={replyTo ? `Reply to @${replyTo.username}…` : 'Add a comment…'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="comment-submit" disabled={!text.trim() || submitting}>
            {submitting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={14} />}
          </button>
        </div>
      </form>
    </div>
  )
}
