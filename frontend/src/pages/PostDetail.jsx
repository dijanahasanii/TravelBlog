import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formatTimeAgo } from '../utils/formatTime'
import { getAvatarSrc, getCurrentUserAvatar } from '../utils/avatar'
import { useToast } from '../context/ToastContext'
import CommentThread from '../components/CommentThread'
import ImageCarousel from '../components/ImageCarousel'
import VideoPlayer from '../components/VideoPlayer'
import ConfirmModal from '../components/ConfirmModal'
import { USER_SERVICE, CONTENT_SERVICE } from '../constants/api'
import api from '../utils/api'
import { parseResponse } from '../utils/parseResponse'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import {
  ArrowLeft, Heart, MessageCircle, MapPin, MoreHorizontal, Pencil, Trash2,
} from 'lucide-react'

const isRealId = (id) => /^[a-f\d]{24}$/i.test(id)

export default function PostDetail() {
  const { postId }    = useParams()
  const navigate      = useNavigate()
  const toast         = useToast()
  const currentUserId = localStorage.getItem('currentUserId')
  const username      = localStorage.getItem('username')
  const token         = localStorage.getItem('token')

  const [post,       setPost]       = useState(null)
  const [author,     setAuthor]     = useState(null)
  const [likes,      setLikes]      = useState([])
  const [comments,   setComments]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [submitting,   setSubmitting]   = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [menuOpen,   setMenuOpen]   = useState(false)

  const isLiked  = likes.some((l) => l?.userId?.toString() === currentUserId || l === currentUserId)
  const isOwner  = post?.userId?.toString() === currentUserId

  const fetchData = useCallback(async () => {
    if (!isRealId(postId)) {
      setError('Post not found.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [postParsed, likesParsed, commentsParsed] = await Promise.all([
        fetchWithTimeout(`${CONTENT_SERVICE}/posts/${postId}`, { timeout: 10000 }).then(parseResponse),
        fetchWithTimeout(`${CONTENT_SERVICE}/likes/${postId}`, { timeout: 8000 }).then(parseResponse),
        fetchWithTimeout(`${CONTENT_SERVICE}/comments/${postId}`, { timeout: 8000 }).then(parseResponse),
      ])

      if (!postParsed.ok || postParsed.data == null) throw new Error(postParsed.error || 'Post not found')
      const postData = postParsed.data
      setPost(postData)
      setLikes(likesParsed.ok && Array.isArray(likesParsed.data) ? likesParsed.data : [])
      const commentsRes = commentsParsed.ok && Array.isArray(commentsParsed.data) ? commentsParsed.data : []

      const enriched = await Promise.all(
        commentsRes.map(async (c) => {
          if (c.userId?.toString() === currentUserId) return { ...c, username }
          if (!isRealId(c.userId?.toString())) return c
          try {
            const r = await fetchWithTimeout(`${USER_SERVICE}/users/${c.userId}`, { timeout: 5000 }).then(parseResponse)
            if (r.ok && r.data) {
              const u = r.data
              return { ...c, username: u.username, authorAvatar: getAvatarSrc(u) }
            }
          } catch (_) {}
          return c
        })
      )
      setComments(enriched)

      if (isRealId(postData.userId?.toString())) {
        const userParsed = await fetchWithTimeout(`${USER_SERVICE}/users/${postData.userId}`, { timeout: 5000 }).then(parseResponse)
        if (userParsed.ok && userParsed.data) setAuthor(userParsed.data)
      }
    } catch (err) {
      setError(err.name === 'AbortError' ? 'Request timed out' : (err.message || 'Failed to load post'))
    } finally {
      setLoading(false)
    }
  }, [postId, currentUserId, username])

  useEffect(() => { fetchData() }, [fetchData])

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuOpen && !e.target.closest('.post-detail-menu')) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleLike = async () => {
    const alreadyLiked = likes.some(
      (l) => l?.userId?.toString() === currentUserId || l?.toString() === currentUserId || l === currentUserId
    )

    // Optimistic update
    setLikes((prev) =>
      alreadyLiked
        ? prev.filter((l) => l?.userId?.toString() !== currentUserId && l !== currentUserId)
        : [...prev, { userId: currentUserId }]
    )

    try {
      await api.post(`${CONTENT_SERVICE}/likes`, { postId })
    } catch {
      setLikes((prev) =>
        alreadyLiked
          ? [...prev, { userId: currentUserId }]
          : prev.filter((l) => l?.userId?.toString() !== currentUserId && l !== currentUserId)
      )
      toast.error('Failed to update like')
    }
  }

  const handleComment = async (text, parentId = null) => {
    if (!text?.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await api.post(`${CONTENT_SERVICE}/comments`, { postId, text: text.trim(), parentId })
      const data = res.data
      const entry = data?.comment || {
        _id: Date.now().toString(),
        userId: currentUserId,
        text: text.trim(),
        parentId,
        likes: [],
        username,
        createdAt: new Date().toISOString(),
      }
      setComments((prev) => [...prev, { ...entry, username }])
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post comment')
    } finally { setSubmitting(false) }
  }

  const handleDelete = () => {
    setConfirmModal({
      title: 'Delete post?',
      message: 'This action cannot be undone. The post and all its likes and comments will be permanently removed.',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await api.delete(`${CONTENT_SERVICE}/posts/${postId}`)
          toast.success('Post deleted')
          navigate(-1)
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to delete post')
        }
      },
    })
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="loading-page" style={{ flexDirection: 'column', gap: 16 }}>
        <p style={{ color: 'var(--text-secondary)' }}>{error || 'Post not found'}</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go back</button>
      </div>
    )
  }

  const captionText = post.caption?.split('📍')[0]?.trim()

  return (
    <div className="page" style={{ background: 'var(--surface-page)', paddingBottom: 80 }}>
      {/* Sticky top bar */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'var(--surface-nav)', backdropFilter: 'blur(16px) saturate(180%)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '12px var(--content-padding)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(-1)}
          style={{ padding: '6px 8px', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0, flex: 1 }}>
          Post
        </h1>
        {isOwner && (
          <div style={{ position: 'relative' }} className="post-detail-menu">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setMenuOpen((v) => !v)}
              style={{ borderRadius: 'var(--radius-full)', padding: '6px 8px' }}
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div
                style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                  minWidth: 150, overflow: 'hidden', zIndex: 200, animation: 'fade-in 0.15s ease',
                }}
              >
                <button
                  onClick={() => { setMenuOpen(false); navigate(`/edit-post/${postId}`) }}
                  style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--neutral-50)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Pencil size={14} /> Edit post
                </button>
                <button
                  onClick={() => { setMenuOpen(false); handleDelete() }}
                  style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-error)', fontFamily: 'var(--font-sans)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-error-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Trash2 size={14} /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Author row */}
      <div style={{ padding: '16px var(--content-padding)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => isOwner ? navigate('/profile') : isRealId(post.userId?.toString()) && navigate(`/user/${post.userId}`)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <img
            src={getAvatarSrc(author || { username: author?.username })}
            alt={author?.username}
            className="avatar avatar-md"
          />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
              {isOwner ? 'You' : `@${author?.username || 'traveler'}`}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {formatTimeAgo(post.createdAt)}
              {post.location && <span> · <MapPin size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {post.location}</span>}
            </div>
          </div>
        </button>
      </div>

      {/* Full media */}
      {post.video
        ? <VideoPlayer src={post.video} />
        : <ImageCarousel images={post.images?.length ? post.images : [post.image]} alt="Travel" />
      }

      {/* Like + comment counts */}
      <div style={{ padding: '12px var(--content-padding)', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--border-subtle)' }}>
        <button
          className={`action-btn${isLiked ? ' liked' : ''}`}
          onClick={handleLike}
          style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={isLiked ? 0 : 2} />
          {likes.length} {likes.length === 1 ? 'like' : 'likes'}
        </button>
        <button
          className="action-btn"
          style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', cursor: 'default' }}
        >
          <MessageCircle size={20} />
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </button>
      </div>

      {/* Caption */}
      {captionText && (
        <div style={{ padding: '14px var(--content-padding)', borderBottom: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)', margin: 0 }}>
            <span style={{ fontWeight: 'var(--weight-semibold)' }}>@{author?.username || 'traveler'} </span>
            {captionText}
          </p>
        </div>
      )}

      {/* Location pill */}
      {post.location && (
        <div style={{ padding: '10px var(--content-padding)', borderBottom: '1px solid var(--border-subtle)' }}>
          <span className="location-pill" style={{ fontSize: 'var(--text-sm)' }}>
            <MapPin size={12} /> {post.location}
          </span>
        </div>
      )}

      {/* Comments */}
      <div style={{ padding: '16px var(--content-padding)' }}>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          {comments.length === 0 ? 'No comments yet — be the first!' : `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`}
        </p>
        <CommentThread
          comments={comments}
          onAdd={handleComment}
          currentUserId={currentUserId}
          token={token}
          navigate={navigate}
          avatarSrc={getCurrentUserAvatar()}
        />
      </div>

      <ConfirmModal config={confirmModal} onClose={() => setConfirmModal(null)} />
    </div>
  )
}
