import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAvatarSrc, dicebearUrl, getCurrentUserAvatar } from '../utils/avatar'
import { formatTimeAgo } from '../utils/formatTime'
import { USER_SERVICE, CONTENT_SERVICE, NOTIF_SERVICE } from '../constants/api'
import {
  Compass, TrendingUp, Users, MapPin,
  Heart, MessageCircle, Send, ChevronDown, ChevronUp,
  UserPlus, UserMinus, Flame,
} from 'lucide-react'

const isRealId = (id) => /^[a-f\d]{24}$/i.test(id)

// ── Trending post card (interactive) ─────────────────────────────────────────
function TrendingPostCard({ post, currentUserId, token, author, navigate }) {
  const [likes,        setLikes]        = useState(post.likes || [])
  const [comments,     setComments]     = useState(post.comments || [])
  const [showComments, setShowComments] = useState(false)
  const [newComment,   setNewComment]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  const isLiked     = likes.some((l) => l?.userId?.toString() === currentUserId || l === currentUserId)
  const captionText = post.caption?.split('📍')[0]?.trim()

  const handleLike = async () => {
    if (!isRealId(post._id)) return
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
      const res = await fetch(`${CONTENT_SERVICE}/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId: post._id }),
      })
      if (!res.ok) throw new Error()
    } catch (_) {
      // Roll back
      setLikes((prev) =>
        alreadyLiked
          ? [...prev, { userId: currentUserId }]
          : prev.filter((l) => l?.userId?.toString() !== currentUserId && l !== currentUserId)
      )
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    const text = newComment.trim()
    if (!text || submitting) return
    setSubmitting(true)
    try {
      const res  = await fetch(`${CONTENT_SERVICE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId: post._id, text }),
      })
      const data = await res.json()
      setComments((prev) => [
        ...prev,
        data.comment || { userId: currentUserId, text, username: localStorage.getItem('username'), createdAt: new Date().toISOString() },
      ])
      setNewComment('')
    } catch (_) {}
    finally { setSubmitting(false) }
  }

  const goToAuthor = () => {
    if (!author) return
    author._id === currentUserId ? navigate('/profile') : navigate(`/user/${author._id}`)
  }

  return (
    <article className="post-card">
      {/* Trending badge */}
      <div style={{ padding: '8px 16px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Flame size={13} color="var(--brand-500)" />
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--brand-500)' }}>
          Trending · {likes.length} likes
        </span>
      </div>

      {/* Author */}
      <div className="post-card-header">
        <button
          onClick={goToAuthor}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: author ? 'pointer' : 'default', padding: 0, flex: 1, minWidth: 0, textAlign: 'left' }}
        >
          <img
            src={getAvatarSrc(author || {})}
            alt={author?.username || 'traveler'}
            className="avatar avatar-md"
            onError={(e) => { e.target.src = dicebearUrl(author?.username || 'user') }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
              {author?._id === currentUserId ? 'You' : `@${author?.username || 'traveler'}`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{formatTimeAgo(post.createdAt)}</span>
              {post.location && (
                <>
                  <span style={{ color: 'var(--neutral-300)', fontSize: 10 }}>·</span>
                  <span className="location-pill"><MapPin size={10} />{post.location}</span>
                </>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Image */}
      <div style={{ cursor: 'pointer' }} onClick={() => isRealId(post._id) && navigate(`/posts/${post._id}`)}>
        <img
          src={post.image}
          alt="Travel"
          className="post-card-image"
          loading="lazy"
          onError={(e) => { e.target.onerror = null; e.target.src = `https://picsum.photos/seed/${post._id}/700/520` }}
        />
      </div>

      {/* Actions */}
      <div className="post-card-actions">
        <button className={`action-btn${isLiked ? ' liked' : ''}`} onClick={handleLike}>
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={isLiked ? 0 : 2} />
          <span>{likes.length}</span>
        </button>
        <button className="action-btn" onClick={() => setShowComments((v) => !v)}>
          <MessageCircle size={18} /><span>{comments.length}</span>
        </button>
        <button className="action-btn" onClick={() => setShowComments((v) => !v)} style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', padding: '4px 8px' }}>
          {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showComments ? 'Hide' : 'View'} comments
        </button>
      </div>

      {captionText && (
        <div className="post-card-body" style={{ paddingTop: 0 }}>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)', margin: 0 }}>{captionText}</p>
        </div>
      )}

      {showComments && (
        <div className="post-card-footer" style={{ animation: 'fade-in 0.2s ease' }}>
          {comments.length > 0 && (
            <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {comments.map((c, i) => {
                const isOwn = c.userId?.toString() === currentUserId
                const name  = isOwn ? localStorage.getItem('username') || 'You' : c.username || 'traveler'
                const cid   = c.userId?.toString()
                return (
                  <div key={i} className="comment-item">
                    <button onClick={() => isRealId(cid) && (isOwn ? navigate('/profile') : navigate(`/user/${cid}`))}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: isRealId(cid) ? 'pointer' : 'default', flexShrink: 0, marginTop: 2 }}>
                      <img src={isOwn ? getCurrentUserAvatar() : dicebearUrl(name)} alt={name} className="avatar avatar-sm" />
                    </button>
                    <div className="comment-bubble">
                      <button onClick={() => isRealId(cid) && (isOwn ? navigate('/profile') : navigate(`/user/${cid}`))}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: isRealId(cid) ? 'pointer' : 'default', fontFamily: 'var(--font-sans)' }}>
                        <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>@{name}</span>
                      </button>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginLeft: 6 }}>{c.text}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <form onSubmit={handleComment} style={{ display: 'contents' }}>
            <div className="comment-input-row">
              <img src={getCurrentUserAvatar()} alt="You" className="avatar avatar-sm" />
              <input className="comment-input" type="text" placeholder="Add a comment…" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
              <button type="submit" className="comment-submit" disabled={!newComment.trim() || submitting}>
                {submitting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={14} />}
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  )
}

// ── Suggested user row ────────────────────────────────────────────────────────
function SuggestedUser({ user, currentUserId, token, navigate }) {
  const [following, setFollowing] = useState(false)
  const [busy,      setBusy]      = useState(false)

  const handleFollow = async () => {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`${USER_SERVICE}/users/${user._id}/follow`, {
        method: following ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setFollowing((v) => !v)
        if (!following) {
          fetch(`${NOTIF_SERVICE}/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, targetUserId: user._id, type: 'follow' }),
          }).catch(() => {})
        }
      }
    } catch (_) {}
    finally { setBusy(false) }
  }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px var(--content-padding)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <button
        onClick={() => navigate(user._id === currentUserId ? '/profile' : `/user/${user._id}`)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', flex: 1, minWidth: 0, textAlign: 'left', padding: 0 }}
      >
        <img src={getAvatarSrc(user)} alt={user.username} className="avatar avatar-md" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.fullName || user.username}
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>@{user.username}</div>
        </div>
      </button>
      {user._id !== currentUserId && (
        <button
          className={`btn btn-sm ${following ? 'btn-secondary' : 'btn-primary'}`}
          onClick={handleFollow}
          disabled={busy}
          style={{ flexShrink: 0, gap: 4, minWidth: 90 }}
        >
          {busy ? <span className="spinner" /> : following ? <><UserMinus size={13} /> Unfollow</> : <><UserPlus size={13} /> Follow</>}
        </button>
      )}
    </div>
  )
}

// ── Main Explore Page ─────────────────────────────────────────────────────────
export default function Explore() {
  const navigate      = useNavigate()
  const currentUserId = localStorage.getItem('currentUserId')
  const token         = localStorage.getItem('token')

  const [trending,   setTrending]   = useState([])
  const [suggested,  setSuggested]  = useState([])
  const [authorMap,  setAuthorMap]  = useState({})
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('trending') // 'trending' | 'people'

  const fetchExplore = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch recent posts (first 2 pages), sort by like count client-side
      const [p1, p2, usersRes] = await Promise.all([
        fetch(`${CONTENT_SERVICE}/posts?page=1&limit=20`).then((r) => r.ok ? r.json() : { posts: [] }),
        fetch(`${CONTENT_SERVICE}/posts?page=2&limit=20`).then((r) => r.ok ? r.json() : { posts: [] }),
        fetch(`${USER_SERVICE}/users/search?q=`).then((r) => r.ok ? r.json() : []),
      ])

      const rawPosts = [
        ...(Array.isArray(p1) ? p1 : p1.posts || []),
        ...(Array.isArray(p2) ? p2 : p2.posts || []),
      ]

      // Enrich with likes/comments
      const enriched = await Promise.all(
        rawPosts.map(async (p) => {
          const [likesRes, commentsRes] = await Promise.all([
            fetch(`${CONTENT_SERVICE}/likes/${p._id}`).then((r) => r.ok ? r.json() : []),
            fetch(`${CONTENT_SERVICE}/comments/${p._id}`).then((r) => r.ok ? r.json() : []),
          ])
          return { ...p, likes: likesRes, comments: commentsRes }
        })
      )

      // Sort by likes desc, take top 10
      const sorted = enriched
        .filter((p) => isRealId(p._id))
        .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
        .slice(0, 10)

      setTrending(sorted)

      // Prefetch authors
      const authorIds = [...new Set(sorted.map((p) => p.userId?.toString()).filter((id) => isRealId(id)))]
      const aMap = {}
      await Promise.all(
        authorIds.map(async (id) => {
          try {
            const r = await fetch(`${USER_SERVICE}/users/${id}`)
            if (r.ok) aMap[id] = await r.json()
          } catch (_) {}
        })
      )
      setAuthorMap(aMap)

      // Suggested: real users, exclude self, shuffle, take top 8
      const allUsers   = Array.isArray(usersRes) ? usersRes : []
      const others     = allUsers.filter((u) => u._id !== currentUserId && isRealId(u._id))
      const shuffled   = others.sort(() => Math.random() - 0.5).slice(0, 8)
      setSuggested(shuffled)
    } catch (err) {
      console.error('Explore fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [currentUserId])

  useEffect(() => { fetchExplore() }, [fetchExplore])

  return (
    <div className="page" style={{ background: 'var(--surface-page)' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--surface-nav)', backdropFilter: 'blur(16px) saturate(180%)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ padding: '14px var(--content-padding) 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Compass size={20} color="var(--brand-500)" />
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Explore
          </h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginTop: 10 }}>
          {[
            { key: 'trending', label: 'Trending',  icon: <TrendingUp size={14} /> },
            { key: 'people',   label: 'People',    icon: <Users size={14} /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 0', border: 'none', background: 'none',
                fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)',
                fontWeight: activeTab === key ? 'var(--weight-semibold)' : 'var(--weight-regular)',
                color: activeTab === key ? 'var(--brand-600)' : 'var(--text-muted)',
                borderBottom: activeTab === key ? '2px solid var(--brand-500)' : '2px solid transparent',
                marginBottom: -1, cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {icon}{label}
            </button>
          ))}
        </div>
      </header>

      <main className="page-content" style={{ paddingTop: 'var(--space-4)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : activeTab === 'trending' ? (
          trending.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><TrendingUp size={28} /></div>
              <h3>Nothing trending yet</h3>
              <p>Be the first to share a travel adventure!</p>
            </div>
          ) : (
            trending.map((post) => (
              <TrendingPostCard
                key={post._id}
                post={post}
                currentUserId={currentUserId}
                token={token}
                author={authorMap[post.userId?.toString()] || null}
                navigate={navigate}
              />
            ))
          )
        ) : (
          suggested.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={28} /></div>
              <h3>No suggestions yet</h3>
              <p>As more people join, you'll see suggested travellers here.</p>
            </div>
          ) : (
            <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', margin: '0 0 16px' }}>
              <div style={{ padding: '14px var(--content-padding) 10px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={15} color="var(--text-muted)" />
                <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>Suggested Travellers</span>
              </div>
              {suggested.map((user) => (
                <SuggestedUser
                  key={user._id}
                  user={user}
                  currentUserId={currentUserId}
                  token={token}
                  navigate={navigate}
                />
              ))}
            </div>
          )
        )}
      </main>
    </div>
  )
}
