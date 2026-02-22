import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import EditPostModal from '../components/EditPostModal'
import FollowListModal from '../components/FollowListModal'
import ConfirmModal from '../components/ConfirmModal'
import CommentThread from '../components/CommentThread'
import ImageCarousel from '../components/ImageCarousel'
import VideoPlayer from '../components/VideoPlayer'
import { USER_SERVICE, CONTENT_SERVICE } from '../constants/api'
import { locations } from './dummyData'
import { formatTimeAgo } from '../utils/formatTime'
import { getAvatarSrc, dicebearUrl } from '../utils/avatar'
import { useToast } from '../context/ToastContext'
import { useTheme } from '../context/ThemeContext'
import {
  MapPin,
  Heart,
  MessageCircle,
  Pencil,
  Trash2,
  LogOut,
  FileText,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Bookmark,
  MoreHorizontal,
  Moon,
  Sun,
} from 'lucide-react'

// ── Bookmark helpers (mirrors Feed.jsx) ──
const BOOKMARKS_KEY = 'wandr_bookmarks'
function getBookmarkIds() {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY)) || [] } catch { return [] }
}
function removeBookmark(postId) {
  const saved = getBookmarkIds().filter((id) => id !== postId)
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(saved))
}

export default function Profile() {
  const navigate = useNavigate()
  const toast = useToast()
  const { isDark, toggle: toggleTheme } = useTheme()
  const currentUserId = localStorage.getItem('currentUserId')
  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username')

  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 })
  const [commentsVisible, setCommentsVisible] = useState({})
  const [editingPost, setEditingPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [likedPosts, setLikedPosts] = useState(new Set())
  const [menuOpen, setMenuOpen] = useState(null)
  const [activeTab, setActiveTab] = useState('posts') // 'posts' | 'saved'
  const [savedPosts, setSavedPosts] = useState([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [followModal, setFollowModal] = useState(null) // 'followers' | 'following' | null
  const [confirmModal, setConfirmModal] = useState(null)

  const fetchData = useCallback(async () => {
    if (!currentUserId) {
      navigate('/')
      return
    }
    setLoading(true)
    try {
      const [userRes, postsRes, statsRes] = await Promise.all([
        axios.get(`${USER_SERVICE}/users/${currentUserId}`),
        axios.get(`${CONTENT_SERVICE}/posts/user/${currentUserId}`),
        fetch(`${USER_SERVICE}/users/${currentUserId}/follow-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.ok ? r.json() : { followers: 0, following: 0 }),
      ])
      setFollowStats({ followers: statsRes.followers || 0, following: statsRes.following || 0 })
      setUser(userRes.data)

      const enriched = await Promise.all(
        postsRes.data.map(async (p) => {
          const [likesRes, commentsRes] = await Promise.all([
            fetch(`${CONTENT_SERVICE}/likes/${p._id}`).then((r) =>
              r.ok ? r.json() : []
            ),
            fetch(`${CONTENT_SERVICE}/comments/${p._id}`).then((r) =>
              r.ok ? r.json() : []
            ),
          ])
          const commentsWithNames = await Promise.all(
            commentsRes.map(async (c) => {
              if (c.userId?.toString() === currentUserId) {
                return { ...c, username }
              }
              try {
                const r = await fetch(`${USER_SERVICE}/users/${c.userId}`)
                if (r.ok) {
                  const u = await r.json()
                  return { ...c, username: u.username }
                }
              } catch (_) {}
              return c
            })
          )
          return { ...p, likes: likesRes, comments: commentsWithNames }
        })
      )
      setPosts(enriched)

      const liked = new Set(
        enriched
          .filter(
            (p) =>
              Array.isArray(p.likes) &&
              p.likes.some(
                (l) =>
                  l?.userId?.toString() === currentUserId || l === currentUserId
              )
          )
          .map((p) => p._id)
      )
      setLikedPosts(liked)
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }, [currentUserId, navigate, username, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchDataRef = React.useRef(fetchData)
  fetchDataRef.current = fetchData
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'postsUpdatedAt') fetchDataRef.current()
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const handleLike = async (postId) => {
    const alreadyLiked = (posts.find((p) => p._id === postId)?.likes || []).some(
      (l) => l?.userId?.toString() === currentUserId || l?.toString() === currentUserId || l === currentUserId
    )

    // Optimistic update
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
    setLikedPosts((prev) => {
      const s = new Set(prev)
      alreadyLiked ? s.delete(postId) : s.add(postId)
      return s
    })

    try {
      const res = await fetch(`${CONTENT_SERVICE}/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Roll back on failure
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
      setLikedPosts((prev) => {
        const s = new Set(prev)
        alreadyLiked ? s.add(postId) : s.delete(postId)
        return s
      })
      toast.error('Failed to update like')
    }
  }

  const handleComment = async (postId, text, parentId = null) => {
    if (!text?.trim()) return
    try {
      const res = await fetch(`${CONTENT_SERVICE}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, text: text.trim(), parentId }),
      })
      const data = await res.json()
      const entry = data.comment || {
        _id: Date.now().toString(),
        userId: currentUserId,
        text: text.trim(),
        parentId,
        likes: [],
        username,
        createdAt: new Date().toISOString(),
      }
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, comments: [...(p.comments || []), entry] } : p
        )
      )
    } catch {
      toast.error('Failed to post comment')
    }
  }

  const handleDelete = (postId) => {
    setConfirmModal({
      title: 'Delete post?',
      message: 'This action cannot be undone. The post and all its likes and comments will be permanently removed.',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          const res = await fetch(`${CONTENT_SERVICE}/posts/${postId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            setPosts((prev) => prev.filter((p) => p._id !== postId))
            localStorage.setItem('postsUpdatedAt', Date.now().toString())
            toast.success('Post deleted')
          } else {
            toast.error('Failed to delete post')
          }
        } catch {
          toast.error('Network error')
        }
      },
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('currentUserId')
    localStorage.removeItem('username')
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  const toggleComments = (postId) =>
    setCommentsVisible((prev) => ({ ...prev, [postId]: !prev[postId] }))

  const fetchSavedPosts = useCallback(async () => {
    const ids = getBookmarkIds()
    if (ids.length === 0) { setSavedPosts([]); return }
    setSavedLoading(true)
    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          const [postRes, likesRes, commentsRes] = await Promise.all([
            fetch(`${CONTENT_SERVICE}/posts/${id}`).then((r) => r.ok ? r.json() : null),
            fetch(`${CONTENT_SERVICE}/likes/${id}`).then((r) => r.ok ? r.json() : []),
            fetch(`${CONTENT_SERVICE}/comments/${id}`).then((r) => r.ok ? r.json() : []),
          ])
          if (!postRes) return null
          return { ...postRes, likes: likesRes, comments: commentsRes }
        })
      )
      setSavedPosts(results.filter(Boolean))
    } catch (err) {
      console.error('Failed to load saved posts:', err)
    } finally {
      setSavedLoading(false)
    }
  }, [])

  const handleUnsave = (postId) => {
    removeBookmark(postId)
    setSavedPosts((prev) => prev.filter((p) => p._id !== postId))
    toast.success('Removed from saved')
  }

  const totalLikes = posts.reduce((acc, p) => acc + (p.likes?.length || 0), 0)

  if (loading) {
    return (
      <div className="loading-page">
        <div
          className="spinner spinner-dark"
          style={{ width: 32, height: 32, borderWidth: 3 }}
        />
        <p style={{ fontSize: 'var(--text-sm)' }}>Loading profile…</p>
      </div>
    )
  }

  const displayName = user?.fullName || username || 'Explorer'
  const avatarUrl = getAvatarSrc(user || { username })

  return (
    <div className="page" style={{ background: 'var(--surface-page)' }}>
      {/* Cover + avatar header */}
      <div style={{ position: 'relative', marginBottom: 60 }}>
        {/* Cover image */}
        <div
          style={{
            height: 160,
            background:
              'linear-gradient(135deg, var(--brand-700) 0%, var(--brand-400) 60%, var(--brand-200) 100%)',
            position: 'relative',
          }}
        >
          {/* Pattern overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        {/* Avatar + top actions */}
        <div
          style={{
            position: 'absolute',
            bottom: -48,
            left: 'var(--content-padding)',
            right: 'var(--content-padding)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 'var(--radius-full)',
              border: '3px solid var(--neutral-0)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              background: 'var(--neutral-100)',
            }}
          >
            <img
              src={avatarUrl}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, paddingBottom: 4, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/edit-profile')}
              style={{ gap: 6 }}
            >
              <Pencil size={13} />
              Edit Profile
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ gap: 6, color: 'var(--text-secondary)' }}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              {isDark ? 'Light' : 'Dark'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              style={{ color: 'var(--color-error)', gap: 6 }}
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="page-content" style={{ paddingTop: 'var(--space-3)' }}>
        {/* User info */}
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: 2,
            }}
          >
            {displayName}
          </h1>
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            @{user?.username || username}
          </p>

          {user?.bio && (
            <p
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
                marginBottom: 8,
              }}
            >
              {user.bio}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {user?.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                <MapPin size={13} />
                {user.location}
              </div>
            )}
            {totalLikes > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                <Heart size={13} />
                {totalLikes} {totalLikes === 1 ? 'like' : 'likes'} received
              </div>
            )}
            {[...new Set(posts.map((p) => p.location).filter(Boolean))].length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                <MapPin size={13} strokeWidth={1.5} />
                {[...new Set(posts.map((p) => p.location).filter(Boolean))].length} places
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          marginBottom: 24,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 20,
        }}>
          {[
            { value: posts.length,           label: 'Posts',     onClick: null },
            { value: followStats.followers,  label: 'Followers', onClick: () => setFollowModal('followers') },
            { value: followStats.following,  label: 'Following', onClick: () => setFollowModal('following') },
          ].map(({ value, label, onClick }, i) => (
            <button
              key={label}
              onClick={onClick || undefined}
              disabled={!onClick}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                background: 'none',
                border: 'none',
                borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                cursor: onClick ? 'pointer' : 'default',
                padding: '4px 0',
                borderRadius: 'var(--radius-sm)',
                transition: 'background var(--duration-fast)',
              }}
              onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = 'var(--neutral-100)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
            >
              <span style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
              }}>{value}</span>
              <span style={{
                fontSize: 'var(--text-xs)',
                color: onClick ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontWeight: 'var(--weight-medium)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1.5px solid var(--border-subtle)' }}>
          {[
            { key: 'posts',  label: 'Posts',  icon: <Grid3X3 size={14} /> },
            { key: 'saved',  label: 'Saved',  icon: <Bookmark size={14} /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key)
                if (key === 'saved') fetchSavedPosts()
              }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 0', border: 'none', background: 'none',
                fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)',
                fontWeight: activeTab === key ? 'var(--weight-semibold)' : 'var(--weight-regular)',
                color: activeTab === key ? 'var(--brand-600)' : 'var(--text-muted)',
                borderBottom: activeTab === key ? '2px solid var(--brand-500)' : '2px solid transparent',
                marginBottom: -1.5, cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ── Posts tab ── */}
        {activeTab === 'posts' && posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={28} />
            </div>
            <h3>No posts yet</h3>
            <p>Share your first travel adventure with the community.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/post')}
            >
              Create first post
            </button>
          </div>
        ) : activeTab === 'posts' ? (
          posts.map((post) => {
            const isLiked = likedPosts.has(post._id)
            const showComments = commentsVisible[post._id]
            const captionText = post.caption?.split('📍')[0]?.trim()

            return (
              <article className="post-card" key={post._id}>
                {/* Media — tap to open detail */}
                <div style={{ position: 'relative' }}>
                  {post.video
                    ? <VideoPlayer src={post.video} onClick={() => navigate(`/posts/${post._id}`)} />
                    : <ImageCarousel images={post.images?.length ? post.images : [post.image]} alt="Travel" onClick={() => navigate(`/posts/${post._id}`)} />
                  }
                  {/* Owner menu */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() =>
                          setMenuOpen((p) => (p === post._id ? null : post._id))
                        }
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(0,0,0,0.45)',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {menuOpen === post._id && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            right: 0,
                            background: 'var(--surface-card)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg)',
                            overflow: 'hidden',
                            zIndex: 100,
                            minWidth: 140,
                            animation: 'fade-in 0.15s ease',
                          }}
                        >
                          <button
                            onClick={() => {
                              setMenuOpen(null)
                              setEditingPost(post)
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
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                'var(--neutral-50)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = 'none')
                            }
                          >
                            <Pencil size={13} /> Edit post
                          </button>
                          <button
                            onClick={() => {
                              setMenuOpen(null)
                              handleDelete(post._id)
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
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                'var(--color-error-bg)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = 'none')
                            }
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="post-card-body">
                  {/* Meta row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: captionText ? 8 : 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {formatTimeAgo(post.createdAt)}
                    </span>
                    {post.location && (
                      <>
                        <span style={{ color: 'var(--neutral-300)' }}>·</span>
                        <span className="location-pill">
                          <MapPin size={10} />
                          {post.location}
                        </span>
                      </>
                    )}
                  </div>
                  {captionText && (
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
                  )}
                </div>

                {/* Actions */}
                <div className="post-card-actions">
                  <button
                    className={`action-btn${isLiked ? ' liked' : ''}`}
                    onClick={() => handleLike(post._id)}
                  >
                    <Heart
                      size={18}
                      fill={isLiked ? 'currentColor' : 'none'}
                      strokeWidth={isLiked ? 0 : 2}
                    />
                    {post.likes?.length ?? 0}
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => toggleComments(post._id)}
                  >
                    <MessageCircle size={18} />
                    {post.comments?.length ?? 0}
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => toggleComments(post._id)}
                    style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)' }}
                  >
                    {showComments ? (
                      <ChevronUp size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                    {showComments ? 'Hide' : 'View'} comments
                  </button>
                </div>

                {/* Comments */}
                {showComments && (
                  <CommentThread
                    comments={post.comments || []}
                    onAdd={(text, parentId) => handleComment(post._id, text, parentId)}
                    currentUserId={currentUserId}
                    token={token}
                    navigate={navigate}
                    avatarSrc={avatarUrl}
                  />
                )}
              </article>
            )
          })
        ) : null}

        {/* ── Saved tab ── */}
        {activeTab === 'saved' && (
          savedLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <div className="spinner spinner-dark" style={{ width: 28, height: 28, borderWidth: 3 }} />
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Bookmark size={28} /></div>
              <h3>No saved posts</h3>
              <p>Tap the bookmark icon on any post to save it here.</p>
            </div>
          ) : (
            savedPosts.map((post) => {
              const isLiked = Array.isArray(post.likes) && post.likes.some(
                (l) => l?.userId?.toString() === currentUserId || l === currentUserId
              )
              const showComments = commentsVisible[post._id]
              const captionText = post.caption?.split('📍')[0]?.trim()
              return (
                <article className="post-card" key={post._id}>
                  {post.video
                    ? <VideoPlayer src={post.video} onClick={() => navigate(`/posts/${post._id}`)} />
                    : <ImageCarousel images={post.images?.length ? post.images : [post.image]} alt="Travel" onClick={() => navigate(`/posts/${post._id}`)} />
                  }
                  <div className="post-card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: captionText ? 8 : 0 }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{formatTimeAgo(post.createdAt)}</span>
                      {post.location && (
                        <>
                          <span style={{ color: 'var(--neutral-300)' }}>·</span>
                          <span className="location-pill"><MapPin size={10} />{post.location}</span>
                        </>
                      )}
                    </div>
                    {captionText && (
                      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)', margin: 0 }}>{captionText}</p>
                    )}
                  </div>
                  <div className="post-card-actions">
                    <button
                      className={`action-btn${isLiked ? ' liked' : ''}`}
                      onClick={() => handleLike(post._id)}
                    >
                      <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={isLiked ? 0 : 2} />
                      {post.likes?.length ?? 0}
                    </button>
                    <button className="action-btn" onClick={() => toggleComments(post._id)}>
                      <MessageCircle size={18} />
                      {post.comments?.length ?? 0}
                    </button>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        className="action-btn liked"
                        onClick={() => handleUnsave(post._id)}
                        title="Remove from saved"
                        style={{ color: 'var(--brand-500)' }}
                      >
                        <Bookmark size={16} fill="currentColor" strokeWidth={0} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => toggleComments(post._id)}
                        style={{ fontSize: 'var(--text-xs)' }}
                      >
                        {showComments ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {showComments ? 'Hide' : 'View'} comments
                      </button>
                    </div>
                  </div>
                  {showComments && (
                    <CommentThread
                      comments={post.comments || []}
                      onAdd={(text, parentId) => handleComment(post._id, text, parentId)}
                      currentUserId={currentUserId}
                      token={token}
                      navigate={navigate}
                      avatarSrc={avatarUrl}
                    />
                  )}
                </article>
              )
            })
          )
        )}
      </div>

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          allLocations={locations}
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

      {followModal && (
        <FollowListModal
          type={followModal}
          userId={currentUserId}
          onClose={() => setFollowModal(null)}
          onSelect={(user) => {
            setFollowModal(null)
            const targetId = user._id?.toString()
            setTimeout(() => {
              if (targetId === currentUserId?.toString()) {
                navigate('/profile')
              } else {
                navigate(`/user/${targetId}`)
              }
            }, 0)
          }}
        />
      )}
    </div>
  )
}
