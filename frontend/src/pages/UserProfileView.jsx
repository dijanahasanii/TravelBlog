import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formatTimeAgo } from '../utils/formatTime'
import { getAvatarSrc, getCurrentUserAvatar } from '../utils/avatar'
import { useToast } from '../context/ToastContext'
import CommentThread from '../components/CommentThread'
import ImageCarousel from '../components/ImageCarousel'
import VideoPlayer from '../components/VideoPlayer'
import FollowListModal from '../components/FollowListModal'
import { USER_SERVICE, CONTENT_SERVICE, NOTIF_SERVICE } from '../constants/api'
import api from '../utils/api'
import { parseResponse } from '../utils/parseResponse'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import {
  ArrowLeft, MapPin, Heart, MessageCircle, FileText,
  Grid3X3, UserPlus, UserMinus, Users, ChevronDown, ChevronUp,
  MoreVertical, Flag, ShieldOff, Shield,
} from 'lucide-react'

const REPORT_REASONS = [
  'Spam or fake account',
  'Harassment or bullying',
  'Hate speech',
  'Inappropriate content',
  'Impersonation',
  'Other',
]

const isRealId = (id) => /^[a-f\d]{24}$/i.test(id)

// ── Interactive post card (no edit/delete since it's someone else's profile) ──
function ProfilePostCard({ post, currentUserId, token, profileUser, navigate, toast }) {
  const [likes,        setLikes]        = useState(post.likes || [])
  const [comments,     setComments]     = useState(post.comments || [])
  const [showComments, setShowComments] = useState(false)

  const isLiked = likes.some(
    (l) => l?.userId?.toString() === currentUserId || l === currentUserId
  )
  const captionText = post.caption?.split('📍')[0]?.trim()

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
      await api.post(`${CONTENT_SERVICE}/likes`, { postId: post._id })
    } catch (_) {
      setLikes((prev) =>
        alreadyLiked
          ? [...prev, { userId: currentUserId }]
          : prev.filter((l) => l?.userId?.toString() !== currentUserId && l !== currentUserId)
      )
      toast?.error('Failed to update like')
    }
  }

  const handleAddComment = async (text, parentId = null) => {
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
    } catch (err) {
      toast?.error(err.response?.data?.error || 'Failed to post comment')
    }
  }

  return (
    <article className="post-card">
      {/* Header — shows the profile owner's info */}
      <div className="post-card-header">
        <img
          src={getAvatarSrc(profileUser)}
          alt={profileUser?.username}
          className="avatar avatar-md"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
            @{profileUser?.username || 'traveler'}
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
      </div>

      {/* Media */}
      {post.video
        ? <VideoPlayer src={post.video} onClick={() => navigate(`/posts/${post._id}`)} />
        : <ImageCarousel images={post.images?.length ? post.images : [post.image]} alt="Travel" onClick={() => navigate(`/posts/${post._id}`)} />
      }

      {/* Actions */}
      <div className="post-card-actions">
        <button
          className={`action-btn${isLiked ? ' liked' : ''}`}
          onClick={handleLike}
          aria-label={isLiked ? 'Unlike' : 'Like'}
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

// ── Main UserProfileView ─────────────────────────────────────────────────────
export default function UserProfileView() {
  const { userId }    = useParams()
  const navigate      = useNavigate()
  const toast         = useToast()
  const currentUserId = localStorage.getItem('currentUserId')
  const token         = localStorage.getItem('token')

  const isValidId = isRealId(userId)

  const [user,            setUser]            = useState(null)
  const [posts,           setPosts]           = useState([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState(null)
  const [stats,           setStats]           = useState({ followers: 0, following: 0, isFollowing: false })
  const [followBusy,      setFollowBusy]      = useState(false)
  const [menuOpen,        setMenuOpen]        = useState(false)
  const [isBlocked,       setIsBlocked]       = useState(false)
  const [blockBusy,       setBlockBusy]       = useState(false)
  const [showReport,      setShowReport]      = useState(false)
  const [reportReason,    setReportReason]    = useState('')
  const [reportDetails,   setReportDetails]   = useState('')
  const [reportSubmitting,setReportSubmitting]= useState(false)
  const [followModal,     setFollowModal]     = useState(null) // 'followers' | 'following' | null
  const menuRef = useRef(null)

  useEffect(() => {
    if (userId === currentUserId) navigate('/profile', { replace: true })
  }, [userId, currentUserId, navigate])

  const fetchData = useCallback(async () => {
    if (!isValidId) {
      setError('This is a sample post — the author does not have a real account.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [userParsed, postsParsed, statsParsed, blockParsed] = await Promise.all([
        fetchWithTimeout(`${USER_SERVICE}/users/${userId}`, { timeout: 10000 }).then(parseResponse),
        fetchWithTimeout(`${CONTENT_SERVICE}/posts/user/${userId}`, { timeout: 10000 }).then(parseResponse),
        fetchWithTimeout(`${USER_SERVICE}/users/${userId}/follow-stats`, { timeout: 8000, headers: { Authorization: `Bearer ${token}` } }).then(parseResponse),
        fetchWithTimeout(`${USER_SERVICE}/users/${userId}/block-status`, { timeout: 5000, headers: { Authorization: `Bearer ${token}` } }).then(parseResponse),
      ])

      if (!userParsed.ok || userParsed.data == null) throw new Error(userParsed.error || 'User not found')
      setUser(userParsed.data)
      if (statsParsed.ok && statsParsed.data) setStats(statsParsed.data)
      if (blockParsed.ok && blockParsed.data?.isBlocked != null) setIsBlocked(blockParsed.data.isBlocked)

      if (postsParsed.ok && Array.isArray(postsParsed.data)) {
        const postsData = postsParsed.data
        const enriched = await Promise.all(
          postsData.map(async (p) => {
            const [likesP, commentsP] = await Promise.all([
              fetchWithTimeout(`${CONTENT_SERVICE}/likes/${p._id}`, { timeout: 5000 }).then(parseResponse),
              fetchWithTimeout(`${CONTENT_SERVICE}/comments/${p._id}`, { timeout: 5000 }).then(parseResponse),
            ])
            return {
              ...p,
              likes: likesP.ok && Array.isArray(likesP.data) ? likesP.data : [],
              comments: commentsP.ok && Array.isArray(commentsP.data) ? commentsP.data : [],
            }
          })
        )
        enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setPosts(enriched)
      }
    } catch (err) {
      setError(err.name === 'AbortError' ? 'Request timed out' : (err.message || 'Failed to load profile'))
    } finally {
      setLoading(false)
    }
  }, [userId, isValidId, token])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleFollow = async () => {
    if (followBusy) return
    setFollowBusy(true)
    const isFollowing = stats.isFollowing
    try {
      if (isFollowing) {
        await api.delete(`${USER_SERVICE}/users/${userId}/follow`)
      } else {
        await api.post(`${USER_SERVICE}/users/${userId}/follow`)
        api.post(`${NOTIF_SERVICE}/notifications`, { userId: currentUserId, targetUserId: userId, type: 'follow' }).catch(() => {})
      }
      setStats((prev) => ({
        ...prev,
        isFollowing: !isFollowing,
        followers: prev.followers + (isFollowing ? -1 : 1),
      }))
      toast.success(isFollowing ? `Unfollowed @${user?.username}` : `Following @${user?.username}!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update follow')
    } finally {
      setFollowBusy(false)
    }
  }

  const handleBlock = async () => {
    if (blockBusy) return
    setBlockBusy(true)
    setMenuOpen(false)
    try {
      if (isBlocked) {
        await api.delete(`${USER_SERVICE}/users/${userId}/block`)
      } else {
        await api.post(`${USER_SERVICE}/users/${userId}/block`)
      }
      setIsBlocked((v) => !v)
      toast.success(isBlocked ? 'User unblocked' : 'User blocked')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Network error')
    } finally { setBlockBusy(false) }
  }

  const handleReport = async (e) => {
    e.preventDefault()
    if (!reportReason || reportSubmitting) return
    setReportSubmitting(true)
    try {
      await api.post(`${USER_SERVICE}/users/${userId}/report`, { reason: reportReason, details: reportDetails })
      toast.success('Report submitted. Thank you.')
      setShowReport(false)
      setReportReason('')
      setReportDetails('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit report')
    } finally { setReportSubmitting(false) }
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 12 }}>Loading profile…</p>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="loading-page" style={{ flexDirection: 'column', gap: 16, padding: '0 24px', textAlign: 'center' }}>
        <div className="empty-state-icon"><FileText size={28} /></div>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 280 }}>{error || 'User not found'}</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go back</button>
      </div>
    )
  }

  const displayName  = user.fullName || user.username
  const avatarSrc    = getAvatarSrc(user)
  const totalLikes   = posts.reduce((acc, p) => acc + (p.likes?.length || 0), 0)
  const uniquePlaces = [...new Set(posts.map((p) => p.location).filter(Boolean))].length

  return (
    <div className="page" style={{ background: 'var(--surface-page)' }}>
      {/* Cover + avatar */}
      <div style={{ position: 'relative', marginBottom: 60 }}>
        <div style={{ height: 160, background: 'linear-gradient(135deg, var(--brand-700) 0%, var(--brand-400) 60%, var(--brand-200) 100%)', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <button
            onClick={() => navigate(-1)}
            style={{ position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: 'var(--radius-full)', background: 'rgba(0,0,0,0.35)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          >
            <ArrowLeft size={18} />
          </button>

          {/* 3-dot menu */}
          <div ref={menuRef} style={{ position: 'absolute', top: 16, right: 16 }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', background: 'rgba(0,0,0,0.35)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
            >
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', minWidth: 160, zIndex: 200, animation: 'fade-in 0.15s ease' }}>
                <button
                  onClick={() => { setMenuOpen(false); setShowReport(true) }}
                  style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-warning)', fontFamily: 'var(--font-sans)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-warning-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Flag size={14} /> Report user
                </button>
                <button
                  onClick={handleBlock}
                  disabled={blockBusy}
                  style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-error)', fontFamily: 'var(--font-sans)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-error-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  {isBlocked ? <><Shield size={14} /> Unblock user</> : <><ShieldOff size={14} /> Block user</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Avatar only — button moves to the info section below */}
        <div style={{ position: 'absolute', bottom: -48, left: 'var(--content-padding)' }}>
          <div style={{ width: 88, height: 88, borderRadius: 'var(--radius-full)', border: '3px solid var(--neutral-0)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', background: 'var(--neutral-100)' }}>
            <img src={avatarSrc} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </div>

      <div className="page-content" style={{ paddingTop: 'var(--space-3)' }}>
        {/* User info + prominent follow button */}
        <div style={{ marginBottom: 20 }}>
          {/* Name + Follow/Unfollow row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 2 }}>
                {displayName}
              </h1>
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', marginBottom: 0 }}>@{user.username}</p>
            </div>

            {/* Prominent Follow / Unfollow button */}
            <button
              onClick={handleFollow}
              disabled={followBusy}
              style={{
                flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '10px 22px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-bold)',
                fontFamily: 'var(--font-sans)',
                cursor: followBusy ? 'wait' : 'pointer',
                transition: 'all var(--duration-fast)',
                border: stats.isFollowing ? '2px solid var(--border-default)' : '2px solid var(--brand-500)',
                background: stats.isFollowing ? 'transparent' : 'var(--brand-500)',
                color: stats.isFollowing ? 'var(--text-primary)' : 'white',
                boxShadow: stats.isFollowing ? 'none' : '0 2px 10px rgba(234,88,12,0.3)',
                opacity: followBusy ? 0.7 : 1,
                marginTop: 8,
              }}
            >
              {followBusy
                ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                : stats.isFollowing
                  ? <><UserMinus size={15} /> Unfollow</>
                  : <><UserPlus size={15} /> Follow</>
              }
            </button>
          </div>

          {/* Bio */}
          {user.bio && <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 8, marginTop: 8 }}>{user.bio}</p>}

          {/* Meta chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
            {user.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                <MapPin size={13} />{user.location}
              </div>
            )}
            {totalLikes > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                <Heart size={13} />{totalLikes} {totalLikes === 1 ? 'like' : 'likes'} received
              </div>
            )}
            {uniquePlaces > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                <MapPin size={13} strokeWidth={1.5} />{uniquePlaces} places
              </div>
            )}
          </div>

          {/* "Following" badge */}
          {stats.isFollowing && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', marginTop: 10, background: 'var(--brand-50)', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--brand-600)', border: '1px solid var(--brand-100)' }}>
              <Users size={11} /> Following
            </div>
          )}
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
            { value: posts.length,    label: 'Posts',     onClick: null },
            { value: stats.followers, label: 'Followers', onClick: () => setFollowModal('followers') },
            { value: stats.following, label: 'Following', onClick: () => setFollowModal('following') },
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

        {/* Posts heading */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Grid3X3 size={16} color="var(--text-muted)" />
          <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', fontSize: 'var(--text-base)' }}>
            Posts by @{user.username}
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={28} /></div>
            <h3>No posts yet</h3>
            <p>@{user.username} hasn't shared any adventures yet.</p>
          </div>
        ) : (
          posts.map((post) => (
            <ProfilePostCard
              key={post._id}
              post={post}
              currentUserId={currentUserId}
              token={token}
              profileUser={user}
              navigate={navigate}
              toast={toast}
            />
          ))
        )}
      </div>

      {/* Report modal */}
      {showReport && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'var(--surface-overlay)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 var(--nav-height)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowReport(false) }}
        >
          <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', width: '100%', maxWidth: 'var(--content-max-width)', padding: '24px var(--content-padding)', boxShadow: 'var(--shadow-xl)', animation: 'slide-up 0.25s var(--ease-out)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Flag size={16} color="var(--color-warning)" />
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Report @{user?.username}</h2>
            </div>
            <form onSubmit={handleReport} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Reason</label>
                <select className="form-input" value={reportReason} onChange={(e) => setReportReason(e.target.value)} required>
                  <option value="">Select a reason…</option>
                  {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Details (optional)</label>
                <textarea className="form-input" placeholder="Anything else we should know?" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary btn-full" onClick={() => setShowReport(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full" disabled={!reportReason || reportSubmitting}>
                  {reportSubmitting ? <><span className="spinner" /> Submitting…</> : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {followModal && (
        <FollowListModal
          type={followModal}
          userId={userId}
          onClose={() => setFollowModal(null)}
          onSelect={(selectedUser) => {
            setFollowModal(null)
            const targetId = selectedUser._id?.toString()
            const currentUserId = localStorage.getItem('currentUserId')
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
