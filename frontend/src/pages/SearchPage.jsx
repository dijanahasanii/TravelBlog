import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAvatarSrc, dicebearUrl, getCurrentUserAvatar } from '../utils/avatar'
import { formatTimeAgo } from '../utils/formatTime'
import CommentThread from '../components/CommentThread'
import ImageCarousel from '../components/ImageCarousel'
import VideoPlayer from '../components/VideoPlayer'
import { USER_SERVICE, CONTENT_SERVICE } from '../constants/api'
import api from '../utils/api'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import { parseResponse } from '../utils/parseResponse'
import { useToast } from '../context/ToastContext'
import {
  Search, X, Users, FileText, MapPin,
  Heart, MessageCircle, ChevronDown, ChevronUp,
} from 'lucide-react'

const isRealId = (id) => /^[a-f\d]{24}$/i.test(id)

// ── Mini interactive post card used only in search results ──────────────────
function SearchPostCard({ post, currentUserId, token, userCache, navigate, toast }) {
  const [likes,          setLikes]          = useState(post.likes || [])
  const [comments,       setComments]       = useState(post.comments || [])
  const [showComments,   setShowComments]   = useState(false)

  const isLiked = likes.some(
    (l) => l?.userId?.toString() === currentUserId || l === currentUserId
  )

  const author = userCache[post.userId?.toString()] || null
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
      await api.post(`${CONTENT_SERVICE}/likes`, { postId: post._id })
    } catch (_) {
      toast?.error('Failed to update like')
      // Roll back
      setLikes((prev) =>
        alreadyLiked
          ? [...prev, { userId: currentUserId }]
          : prev.filter((l) => l?.userId?.toString() !== currentUserId && l !== currentUserId)
      )
    }
  }

  const handleAddComment = async (text, parentId = null) => {
    if (!isRealId(post._id)) return
    try {
      const res = await api.post(`${CONTENT_SERVICE}/comments`, { postId: post._id, text, parentId })
      const data = res.data
      const username = localStorage.getItem('username')
      const entry = data?.comment || {
        _id: Date.now().toString(),
        userId: currentUserId,
        text,
        parentId,
        likes: [],
        username,
        createdAt: new Date().toISOString(),
      }
      setComments((prev) => [...prev, entry])
    } catch (err) { toast?.error(err?.response?.data?.error || 'Failed to post comment') }
  }

  const goToAuthor = () => {
    if (!isRealId(post.userId?.toString())) return
    post.userId?.toString() === currentUserId ? navigate('/profile') : navigate(`/user/${post.userId}`)
  }

  return (
    <article className="post-card">
      {/* Header */}
      <div className="post-card-header">
        <button onClick={goToAuthor} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: isRealId(post.userId?.toString()) ? 'pointer' : 'default', padding: 0, flex: 1, minWidth: 0, textAlign: 'left' }}>
          <img
            src={getAvatarSrc(author || { username: author?.username })}
            alt={author?.username || 'traveler'}
            className="avatar avatar-md"
            onError={(e) => { e.target.src = dicebearUrl(author?.username || 'user') }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
              {post.userId?.toString() === currentUserId ? 'You' : `@${author?.username || 'traveler'}`}
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

      {/* Media */}
      {post.video
        ? <VideoPlayer src={post.video} onClick={isRealId(post._id) ? () => navigate(`/posts/${post._id}`) : undefined} />
        : <ImageCarousel images={post.images?.length ? post.images : [post.image]} alt="Travel post" onClick={isRealId(post._id) ? () => navigate(`/posts/${post._id}`) : undefined} />
      }

      {/* Actions */}
      <div className="post-card-actions">
        <button
          className={`action-btn${isLiked ? ' liked' : ''}`}
          onClick={handleLike}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={isLiked ? 0 : 2} />
          <span>{likes.length}</span>
        </button>

        <button className="action-btn" onClick={() => setShowComments((v) => !v)}>
          <MessageCircle size={18} />
          <span>{comments.length}</span>
        </button>

        <button
          className="action-btn"
          onClick={() => setShowComments((v) => !v)}
          style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', padding: '4px 8px' }}
        >
          {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showComments ? 'Hide' : 'View'} comments
        </button>
      </div>

      {/* Caption */}
      {captionText && (
        <div className="post-card-body" style={{ paddingTop: 0 }}>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)', margin: 0 }}>
            {captionText}
          </p>
        </div>
      )}

      {/* Comments */}
      {showComments && (
        <CommentThread
          comments={comments}
          onAdd={handleAddComment}
          currentUserId={currentUserId}
          token={token}
          navigate={navigate}
          avatarSrc={getCurrentUserAvatar()}
        />
      )}

    </article>
  )
}

// ── Main Search Page ─────────────────────────────────────────────────────────
export default function SearchPage() {
  const navigate    = useNavigate()
  const toast       = useToast()
  const inputRef    = useRef(null)
  const debounceRef = useRef(null)

  const currentUserId = localStorage.getItem('currentUserId')
  const token         = localStorage.getItem('token')

  const [query,    setQuery]    = useState('')
  const [tab,      setTab]      = useState('users')
  const [users,    setUsers]    = useState([])
  const [posts,    setPosts]    = useState([])
  const [userCache,setUserCache]= useState({})
  const [loading,  setLoading]  = useState(false)
  const [searched, setSearched] = useState(false)

  // Prefetch author info for post results so avatars/names show correctly
  const prefetchAuthors = useCallback(async (postList) => {
    const ids = [...new Set(postList.map((p) => p.userId?.toString()).filter((id) => id && isRealId(id)))]
    if (!ids.length) return
    const fetched = {}
    await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await api.get(`${USER_SERVICE}/users/${id}`)
          if (res?.data) fetched[id] = res.data
        } catch (_) {}
      })
    )
    setUserCache((prev) => ({ ...prev, ...fetched }))
  }, [])

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setUsers([]); setPosts([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    try {
      const [uRes, pRes] = await Promise.all([
        fetchWithTimeout(`${USER_SERVICE}/users/search?q=${encodeURIComponent(q)}`, { timeout: 8000 }).then(parseResponse),
        fetchWithTimeout(`${CONTENT_SERVICE}/posts/search?q=${encodeURIComponent(q)}`, { timeout: 8000 }).then(parseResponse),
      ])
      const uData = uRes.ok && Array.isArray(uRes.data) ? uRes.data : []
      const pRaw  = pRes.ok && Array.isArray(pRes.data) ? pRes.data : []
      setUsers(uData)
      const enriched = await Promise.all(
        pRaw.map(async (p) => {
          const [likesRes, commentsRes] = await Promise.all([
            api.get(`${CONTENT_SERVICE}/likes/${p._id}`).then((r) => Array.isArray(r?.data) ? r.data : []).catch(() => []),
            api.get(`${CONTENT_SERVICE}/comments/${p._id}`).then((r) => Array.isArray(r?.data) ? r.data : []).catch(() => []),
          ])
          return { ...p, likes: likesRes, comments: commentsRes }
        })
      )
      setPosts(enriched)
      prefetchAuthors(enriched)
    } catch (err) {
      toast.error(err?.name === 'AbortError' ? 'Request timed out' : 'Search failed')
      setUsers([]); setPosts([])
    } finally {
      setLoading(false)
    }
  }, [prefetchAuthors, toast])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 350)
  }

  const clearSearch = () => {
    setQuery(''); setUsers([]); setPosts([]); setSearched(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    inputRef.current?.focus()
    return () => clearTimeout(debounceRef.current)
  }, [])

  const tabUsers   = users.filter((u) => u._id !== currentUserId)
  const resultCount = tab === 'users' ? tabUsers.length : posts.length

  return (
    <div className="page" style={{ background: 'var(--surface-page)' }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'var(--surface-nav)', backdropFilter: 'blur(16px) saturate(180%)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ padding: '12px var(--content-padding)' }}>
          <div className="filter-bar">
            <Search size={16} className="search-icon" />
            <input
              ref={inputRef}
              className="filter-input"
              type="text"
              placeholder="Search people or posts…"
              value={query}
              onChange={handleChange}
              autoComplete="off"
            />
            {query && (
              <button
                onClick={clearSearch}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {searched && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)' }}>
            {[
              ['users', <Users size={13} key="u" />,    `People (${tabUsers.length})`],
              ['posts', <FileText size={13} key="p" />, `Posts (${posts.length})`],
            ].map(([key, icon, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  flex: 1, padding: '10px 16px', border: 'none', background: 'none',
                  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  color: tab === key ? 'var(--brand-500)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  borderBottom: tab === key ? '2px solid var(--brand-500)' : '2px solid transparent',
                  transition: 'all var(--duration-fast)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {icon}{label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="page-content">
        {/* Idle */}
        {!searched && !loading && (
          <div className="empty-state" style={{ marginTop: 48 }}>
            <div className="empty-state-icon"><Search size={28} /></div>
            <h3>Find people & places</h3>
            <p>Search for travelers by username, or find posts by caption and destination.</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 48 }}>
            <div className="spinner spinner-dark" style={{ width: 28, height: 28, borderWidth: 3 }} />
          </div>
        )}

        {/* No results */}
        {searched && !loading && resultCount === 0 && (
          <div className="empty-state" style={{ marginTop: 32 }}>
            <div className="empty-state-icon"><Search size={28} /></div>
            <h3>No {tab === 'users' ? 'people' : 'posts'} found</h3>
            <p>Try a different search term.</p>
          </div>
        )}

        {/* People results */}
        {searched && !loading && tab === 'users' && tabUsers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tabUsers.map((u) => (
              <button
                key={u._id}
                onClick={() => isRealId(u._id) && navigate(u._id === currentUserId ? '/profile' : `/user/${u._id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px var(--content-padding)',
                  background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                  borderRadius: 'var(--radius-md)', transition: 'background var(--duration-fast)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--neutral-50)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <img src={getAvatarSrc(u)} alt={u.username} className="avatar avatar-md" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.fullName || u.username}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    @{u.username}
                    {u.location && <span> · <MapPin size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {u.location}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Posts results — full interactive cards */}
        {searched && !loading && tab === 'posts' && posts.length > 0 && (
          <div>
            {posts.map((p) => (
              <SearchPostCard
                key={p._id}
                toast={toast}
                post={p}
                currentUserId={currentUserId}
                token={token}
                userCache={userCache}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
