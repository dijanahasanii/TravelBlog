import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { USER_SERVICE, CONTENT_SERVICE } from '../constants/api'
import api from '../utils/api'
import { dummyUsers, dummyPosts } from './dummyData'
import EditPostModal from '../components/EditPostModal'
import ConfirmModal from '../components/ConfirmModal'
import CommentThread from '../components/CommentThread'
import ImageCarousel from '../components/ImageCarousel'
import VideoPlayer from '../components/VideoPlayer'
import { formatTimeAgo } from '../utils/formatTime'
import { getAvatarSrc, dicebearUrl, getCurrentUserAvatar } from '../utils/avatar'
import { parseResponse } from '../utils/parseResponse'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import { useToast } from '../context/ToastContext'
import {
  Heart,
  MessageCircle,
  MapPin,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Globe,
  Compass,
  Users,
  Bookmark,
  Share2,
} from 'lucide-react'

// ── Bookmark helpers (localStorage; not synced to backend) ──
const BOOKMARKS_KEY = 'wandr_bookmarks'
function getBookmarks() {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY)) || [] } catch { return [] }
}
function toggleBookmark(postId) {
  const saved = getBookmarks()
  const idx = saved.indexOf(postId)
  if (idx === -1) { saved.push(postId); localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(saved)); return true }
  saved.splice(idx, 1); localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(saved)); return false
}
function isBookmarked(postId) { return getBookmarks().includes(postId) }

// ── Dummy post likes (localStorage; dummy posts don't exist in DB so we persist client-side) ──
const DUMMY_LIKES_KEY = 'wandr_dummy_likes'
function getDummyLikesByUser() {
  try { return JSON.parse(localStorage.getItem(DUMMY_LIKES_KEY)) || {} } catch { return {} }
}
function getDummyLikesForUser(userId) {
  return getDummyLikesByUser()[userId] || []
}
function toggleDummyLike(userId, postId) {
  const byUser = getDummyLikesByUser()
  const arr = byUser[userId] || []
  const idx = arr.indexOf(postId)
  if (idx === -1) arr.push(postId)
  else arr.splice(idx, 1)
  byUser[userId] = arr
  localStorage.setItem(DUMMY_LIKES_KEY, JSON.stringify(byUser))
  return idx === -1
}

// ── Skeleton card ──
function SkeletonCard() {
  return (
    <div className="post-card">
      <div className="post-card-header">
        <div
          className="skeleton avatar-md"
          style={{ borderRadius: 'var(--radius-full)' }}
        />
        <div
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          <div
            className="skeleton"
            style={{ height: 14, width: '40%', borderRadius: 6 }}
          />
          <div
            className="skeleton"
            style={{ height: 11, width: '25%', borderRadius: 6 }}
          />
        </div>
      </div>
      <div className="skeleton" style={{ width: '100%', height: 260 }} />
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          className="skeleton"
          style={{ height: 13, width: '80%', borderRadius: 6 }}
        />
        <div
          className="skeleton"
          style={{ height: 13, width: '55%', borderRadius: 6 }}
        />
      </div>
    </div>
  )
}

// ── Post card component ──
function PostCard({
  post,
  currentUserId,
  token,
  userCache,
  onLike,
  onAddComment,
  onEdit,
  onDelete,
  onToggleComments,
  commentsVisible,
}) {
  const user = getUserById(post.userId, userCache)
  const isOwner =
    post.userId === currentUserId || post.userId?.toString() === currentUserId
  const isLiked =
    Array.isArray(post.likes) &&
    post.likes.some(
      (l) =>
        l?.userId?.toString() === currentUserId ||
        l?.toString() === currentUserId ||
        l === currentUserId
    )

  const navigate = useNavigate()
  const toast = useToast()
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [bookmarked,  setBookmarked]  = useState(() => isBookmarked(post._id))
  const menuRef  = useRef(null)

  const handleBookmark = () => {
    const nowSaved = toggleBookmark(post._id)
    setBookmarked(nowSaved)
    toast.success(nowSaved ? 'Post saved!' : 'Removed from saved')
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${post._id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    } catch {
      toast.error('Could not copy link')
    }
  }

  const isRealUserId = isRealId(post.userId)
  const goToProfile = () => {
    if (isOwner) {
      navigate('/profile')
    } else if (post.userId && isRealUserId) {
      navigate(`/user/${post.userId}`)
    }
  }

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const captionText = post.caption?.split('📍')[0]?.trim() || ''
  const showComments = commentsVisible[post._id]

  return (
    <article className="post-card">
      {/* Header */}
      <div className="post-card-header">
        <button
          onClick={goToProfile}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: 'none',
            cursor: (isOwner || isRealUserId) ? 'pointer' : 'default',
            padding: 0, flex: 1, minWidth: 0, textAlign: 'left',
          }}
        >
          <img
            src={getAvatarSrc(user)}
            alt={user?.username}
            className="avatar avatar-md"
            onError={(e) => { e.target.src = dicebearUrl(user?.username || 'user') }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 'var(--weight-semibold)',
                fontSize: 'var(--text-base)',
                color: 'var(--text-primary)',
              }}
            >
              {isOwner ? 'You' : `@${user?.username || 'traveler'}`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {formatTimeAgo(post.createdAt)}
              </span>
              {post.location && (
                <>
                  <span style={{ color: 'var(--neutral-300)', fontSize: 10 }}>·</span>
                  <span className="location-pill">
                    <MapPin size={10} />
                    {post.location}
                  </span>
                </>
              )}
            </div>
          </div>
        </button>

        {/* Owner actions menu */}
        {isOwner && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                width: 32,
                height: 32,
                padding: 0,
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-muted)',
              }}
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: 140,
                  overflow: 'hidden',
                  zIndex: 100,
                  animation: 'fade-in 0.15s ease',
                }}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onEdit(post)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-medium)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--neutral-50)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'none')
                  }
                >
                  <Pencil size={14} />
                  Edit post
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete(post._id)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-medium)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'var(--color-error)',
                    fontFamily: 'var(--font-sans)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--color-error-bg)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'none')
                  }
                >
                  <Trash2 size={14} />
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Media — video or image carousel */}
      {post.video
        ? <VideoPlayer src={post.video} onClick={isRealId(post._id) ? () => navigate(`/posts/${post._id}`) : undefined} />
        : <ImageCarousel images={post.images?.length ? post.images : [post.image]} alt="Travel post" onClick={isRealId(post._id) ? () => navigate(`/posts/${post._id}`) : undefined} />
      }

      {/* Actions row */}
      <div className="post-card-actions">
        <button
          className={`action-btn${isLiked ? ' liked' : ''}`}
          onClick={() => onLike(post._id)}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart
            size={18}
            fill={isLiked ? 'currentColor' : 'none'}
            strokeWidth={isLiked ? 0 : 2}
            style={{ transition: 'transform 0.2s var(--ease-spring)' }}
          />
          <span>{post.likes?.length ?? 0}</span>
        </button>

        <button
          className="action-btn"
          onClick={() => onToggleComments(post._id)}
        >
          <MessageCircle size={18} />
          <span>{post.comments?.length ?? 0}</span>
        </button>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <button
            className="action-btn"
            onClick={handleShare}
            aria-label="Share post"
            title="Copy link"
          >
            <Share2 size={16} />
          </button>
          <button
            className={`action-btn${bookmarked ? ' liked' : ''}`}
            onClick={handleBookmark}
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
            title={bookmarked ? 'Saved' : 'Save post'}
            style={bookmarked ? { color: 'var(--brand-500)' } : {}}
          >
            <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} strokeWidth={bookmarked ? 0 : 2} />
          </button>
          <button
            className="action-btn"
            onClick={() => onToggleComments(post._id)}
            style={{ fontSize: 'var(--text-xs)', padding: '4px 8px' }}
          >
            {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showComments ? 'Hide' : 'View'} comments
          </button>
        </div>
      </div>

      {/* Caption */}
      {captionText && (
        <div className="post-card-body" style={{ paddingTop: 0 }}>
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
              lineHeight: 'var(--leading-relaxed)',
              margin: 0,
            }}
          >
            {captionText}
          </p>
        </div>
      )}

      {/* Comments section */}
      {showComments && (
        <CommentThread
          comments={post.comments || []}
          onAdd={(text, parentId) => onAddComment(post._id, text, parentId)}
          currentUserId={currentUserId}
          token={token}
          navigate={navigate}
          avatarSrc={getCurrentUserAvatar()}
        />
      )}
    </article>
  )
}

// ── Helpers ──
const isRealId = (id) => /^[a-f\d]{24}$/i.test(id)

function getUserById(id, userCache) {
  if (!id) return { username: 'traveler' }
  if (userCache?.[id]) return userCache[id]
  return dummyUsers.find((u) => u._id === id) || { username: 'traveler' }
}

const PAGE_LIMIT = 8

// ── Main Feed ──
const Feed = () => {
  const currentUserId = localStorage.getItem('currentUserId')
  const token = localStorage.getItem('token')
  const toast = useToast()

  const [posts,          setPosts]          = useState([])
  const [userCache,      setUserCache]      = useState({})
  const [followingIds,   setFollowingIds]   = useState([])
  const [commentsVisible,setCommentsVisible]= useState({})
  const [editingPost,    setEditingPost]    = useState(null)
  const [confirmModal,   setConfirmModal]   = useState(null)
  const [locationFilter, setLocationFilter] = useState('')
  const [loading,        setLoading]        = useState(true)
  const [loadingMore,    setLoadingMore]    = useState(false)
  const [activeTab,      setActiveTab]      = useState('all')
  const sentinelRef    = useRef(null)
  const pageRef        = useRef(1)
  const hasMoreRef     = useRef(true)
  const loadingMoreRef = useRef(false)
  const lastLoadRef    = useRef(0)
  const commentingPostIdsRef = useRef(new Set())

  // Stable helper — never changes, safe to call from anywhere
  const enrichPosts = useRef(async (rawPosts) => {
    return Promise.all(rawPosts.map(async (p) => {
      const [likesP, commentsP] = await Promise.all([
        fetchWithTimeout(`${CONTENT_SERVICE}/likes/${p._id}`, { timeout: 8000 }).then(parseResponse),
        fetchWithTimeout(`${CONTENT_SERVICE}/comments/${p._id}`, { timeout: 8000 }).then(parseResponse),
      ])
      const likesRes = likesP.ok && Array.isArray(likesP.data) ? likesP.data : []
      const commentsRes = commentsP.ok && Array.isArray(commentsP.data) ? commentsP.data : []
      return { ...p, createdAt: p.createdAt || new Date().toISOString(), likes: likesRes, comments: commentsRes }
    }))
  }).current

  const prefetchUsers = useRef(async (newPosts) => {
    const authorIds    = newPosts.map((p) => p.userId?.toString())
    const commenterIds = newPosts.flatMap((p) => (p.comments || []).map((c) => c.userId?.toString()))
    const allIds = [...new Set([...authorIds, ...commenterIds].filter(
      (id) => id && !dummyUsers.find((u) => u._id === id)
    ))]
    if (!allIds.length) return
    const fetched = {}
    await Promise.all(allIds.map(async (id) => {
      try {
        const res = await fetchWithTimeout(`${USER_SERVICE}/users/${id}`, { timeout: 5000 }).then(parseResponse)
        if (res.ok && res.data) fetched[id] = res.data
      } catch (_) {}
    }))
    if (Object.keys(fetched).length) setUserCache((prev) => ({ ...prev, ...fetched }))
  }).current

  const loadMore = useRef(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return
    const now = Date.now()
    if (now - lastLoadRef.current < 1500) return
    lastLoadRef.current = now
    loadingMoreRef.current = true
    setLoadingMore(true)
    const nextPage = pageRef.current + 1
    try {
      const res = await fetchWithTimeout(`${CONTENT_SERVICE}/posts?page=${nextPage}&limit=${PAGE_LIMIT}`, { timeout: 10000 })
      const parsed = await parseResponse(res)
      if (parsed.ok && parsed.data != null) {
        const data = parsed.data
        const raw  = Array.isArray(data) ? data : data.posts || []
        const more = Array.isArray(data) ? false : (data.hasMore || false)
        const enriched = await enrichPosts(raw)
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id))
          const fresh = enriched.filter((p) => !existingIds.has(p._id))
          return [...prev, ...fresh]
        })
        prefetchUsers(enriched)
        pageRef.current    = nextPage
        hasMoreRef.current = more
      }
    } catch (err) {
      toast.error(err?.name === 'AbortError' ? "Request timed out." : "Couldn't load more posts.")
    }
    loadingMoreRef.current = false
    setLoadingMore(false)
  }).current

  // Initial load — runs exactly once on mount
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      pageRef.current    = 1
      hasMoreRef.current = true

      try {
        const res = await api.get(`${USER_SERVICE}/users/${currentUserId}/following-ids`)
        if (!cancelled) setFollowingIds(res.data)
      } catch (_) {
        if (!cancelled) toast.error("Couldn't load your follow list.")
      }

      const myDummyLikes = currentUserId ? getDummyLikesForUser(currentUserId) : []
      const dummyWithDates = dummyPosts.map((p) => {
        const baseLikes = p.likes || []
        const withMine = myDummyLikes.includes(p._id)
          ? [...baseLikes.filter((l) => l !== currentUserId && l?.userId?.toString() !== currentUserId), { userId: currentUserId }]
          : baseLikes
        return { ...p, likes: withMine, comments: p.comments || [] }
      })

      let realPosts = []
      let backendHasMore = false
      try {
        const res = await fetchWithTimeout(`${CONTENT_SERVICE}/posts?page=1&limit=${PAGE_LIMIT}`, { timeout: 10000 })
        const parsed = await parseResponse(res)
        if (parsed.ok && parsed.data != null) {
          const data = parsed.data
          const raw  = Array.isArray(data) ? data : data.posts || []
          backendHasMore = Array.isArray(data) ? false : (data.hasMore || false)
          realPosts = await enrichPosts(raw)
        }
      } catch (err) {
        if (!cancelled) toast.error(err?.name === 'AbortError' ? "Request timed out." : "Couldn't load posts. Showing sample posts.")
      }

      if (cancelled) return

      const combined = [...realPosts, ...dummyWithDates]
      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      const safePosts = combined.filter((p) => p.userId)
      setPosts(safePosts)
      prefetchUsers(safePosts)
      hasMoreRef.current = backendHasMore
      setLoading(false)
    }

    run()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    let observer = null
    const timer = setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return
          loadMore()
        },
        { rootMargin: '200px', threshold: 0 }
      )
      observer.observe(el)
    }, 800)
    return () => {
      clearTimeout(timer)
      if (observer) observer.disconnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLikeToggle = async (postId) => {
    const isDummy = postId.length < 10
    if (isDummy) {
      const nowLiked = toggleDummyLike(currentUserId || '', postId)
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id !== postId) return p
          return {
            ...p,
            likes: nowLiked
              ? [...(p.likes || []).filter((l) => l?.userId?.toString() !== currentUserId && l !== currentUserId), { userId: currentUserId }]
              : (p.likes || []).filter((l) => l?.userId?.toString() !== currentUserId && l !== currentUserId),
          }
        })
      )
      return
    }

    // Optimistic update — flip immediately, reconcile after server responds
    const alreadyLiked = (posts.find((p) => p._id === postId)?.likes || []).some(
      (l) => l?.userId?.toString() === currentUserId || l?.toString() === currentUserId || l === currentUserId
    )
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              likes: alreadyLiked
                ? p.likes.filter((l) => l?.userId?.toString() !== currentUserId && l !== currentUserId)
                : [...p.likes, { userId: currentUserId }],
            }
          : p
      )
    )

    try {
      const res = await api.post(`${CONTENT_SERVICE}/likes`, { postId })
      const data = res.data
      const liked = data?.liked
      // Reconcile with server truth only if it differs from our optimistic guess
      if (liked === alreadyLiked) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? {
                  ...p,
                  likes: liked
                    ? [...p.likes.filter((l) => l?.userId?.toString() !== currentUserId && l !== currentUserId), { userId: currentUserId }]
                    : p.likes.filter((l) => l?.userId?.toString() !== currentUserId && l !== currentUserId),
                }
              : p
          )
        )
      }
    } catch (err) {
      // Roll back optimistic update on network or 4xx/5xx failure
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                likes: alreadyLiked
                  ? [...p.likes, { userId: currentUserId }]
                  : p.likes.filter((l) => l?.userId?.toString() !== currentUserId && l !== currentUserId),
              }
            : p
        )
      )
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to update like'
      toast.error(msg)
    }
  }

  const handleAddComment = async (postId, text, parentId = null) => {
    if (!text?.trim()) return
    if (commentingPostIdsRef.current.has(postId)) return
    commentingPostIdsRef.current.add(postId)
    try {
      const res = await api.post(`${CONTENT_SERVICE}/comments`, { postId, text: text.trim(), parentId })
      const data = res.data
      const entry = data?.comment || {
        _id: Date.now().toString(),
        userId: currentUserId,
        text: text.trim(),
        parentId,
        likes: [],
        createdAt: new Date().toISOString(),
      }
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, comments: [...(p.comments || []), entry] } : p
        )
      )
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to post comment'
      toast.error(msg)
    } finally {
      commentingPostIdsRef.current.delete(postId)
    }
  }

  const handleDelete = (postId) => {
    setConfirmModal({
      title: 'Delete post?',
      message: 'This action cannot be undone. The post and all its likes and comments will be permanently removed.',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await api.delete(`${CONTENT_SERVICE}/posts/${postId}`)
          setPosts((prev) => prev.filter((p) => p._id !== postId))
          toast.success('Post deleted')
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to delete post')
        }
      },
    })
  }

  const toggleComments = (postId) =>
    setCommentsVisible((prev) => ({ ...prev, [postId]: !prev[postId] }))

  // Build locations list only from posts that have a location
  const allLocations = Array.from(
    new Set([
      ...dummyPosts.map((p) => p.location?.trim()).filter(Boolean),
      ...posts.map((p) => p.location?.trim()).filter(Boolean),
    ])
  ).sort()

  // Filter logic
  const myPosts = posts.filter(
    (p) => p.userId === currentUserId || p.userId?.toString() === currentUserId
  )
  const followingPosts = posts.filter(
    (p) => followingIds.includes(p.userId?.toString())
  )
  const basePosts =
    activeTab === 'mine'      ? myPosts :
    activeTab === 'following' ? followingPosts :
    posts
  const filteredPosts = basePosts.filter((p) =>
    locationFilter.trim() === ''
      ? true
      : p.location?.toLowerCase().includes(locationFilter.toLowerCase())
  )

  return (
    <div className="page">
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--surface-page)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--content-max-width)',
            margin: '0 auto',
            padding: '12px var(--content-padding)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flex: 1,
              minWidth: 0,
            }}
          >
            <Compass size={22} color="var(--brand-500)" />
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Wandr
            </h1>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              background: 'var(--neutral-100)',
              borderRadius: 'var(--radius-full)',
              padding: 3,
            }}
          >
            {[
              ['all',       <Globe size={13} key="g" />,   'Feed'],
              ['following', <Users size={13} key="u" />,   'Following'],
              ['mine',      null,                           'Mine'],
            ].map(([tab, icon, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background:
                    activeTab === tab ? 'var(--neutral-0)' : 'transparent',
                  color:
                    activeTab === tab
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: activeTab === tab ? 'var(--shadow-xs)' : 'none',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter bar */}
        <div
          style={{
            maxWidth: 'var(--content-max-width)',
            margin: '0 auto',
            padding: '0 var(--content-padding) 12px',
          }}
        >
          <div className="filter-bar">
            <Search size={16} className="search-icon" />
            <input
              className="filter-input"
              type="text"
              placeholder="Filter by destination…"
              list="locations-list"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              autoComplete="off"
            />
            {locationFilter && (
              <button
                onClick={() => setLocationFilter('')}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ✕
              </button>
            )}
          </div>
          <datalist id="locations-list">
            {allLocations.map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>
      </header>

      {/* Content */}
      <main className="page-content" style={{ paddingTop: 'var(--space-5)' }}>
        {loading ? (
          <div>
            {[1, 2, 3].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <MapPin size={28} />
            </div>
            <h3>
              {locationFilter
                ? `No posts from "${locationFilter}"`
                : 'No posts yet'}
            </h3>
            <p>
              {locationFilter
                ? 'Try a different destination or clear the filter.'
                : activeTab === 'mine'
                  ? "You haven't posted anything yet. Share your first adventure!"
                  : activeTab === 'following'
                    ? "You're not following anyone yet. Visit a profile and hit Follow!"
                    : 'Be the first to share a travel story!'}
            </p>
            {locationFilter && (
              <button
                className="btn btn-secondary"
                onClick={() => setLocationFilter('')}
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={currentUserId}
              token={token}
              userCache={userCache}
              onLike={handleLikeToggle}
              onAddComment={handleAddComment}
              onEdit={setEditingPost}
              onDelete={handleDelete}
              onToggleComments={toggleComments}
              commentsVisible={commentsVisible}
            />
          ))
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} style={{ height: 1 }} />

        {loadingMore && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0 32px' }}>
            <div className="spinner spinner-dark" style={{ width: 24, height: 24, borderWidth: 3 }} />
          </div>
        )}

        {!loading && !loadingMore && !hasMoreRef.current && posts.length > 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: '16px 0 32px' }}>
            You've seen all posts ✦
          </p>
        )}
      </main>

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          allLocations={allLocations}
          onSave={(updatedPost) => {
            setPosts((prev) =>
              prev.map((p) =>
                p._id === updatedPost._id ? { ...p, ...updatedPost } : p
              )
            )
            setEditingPost(null)
            toast.success('Post updated')
          }}
        />
      )}

      <ConfirmModal config={confirmModal} onClose={() => setConfirmModal(null)} />
    </div>
  )
}

export default Feed
