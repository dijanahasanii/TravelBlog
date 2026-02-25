import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatTimeAgo } from '../utils/formatTime'
import { getAvatarSrc, dicebearUrl } from '../utils/avatar'
import { useSocket } from '../context/SocketContext'
import { Heart, MessageCircle, UserPlus, Bell, RefreshCw, Inbox } from 'lucide-react'
import { USER_SERVICE, NOTIF_SERVICE } from '../constants/api'
import api from '../utils/api'
import { parseResponse } from '../utils/parseResponse'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import { useToast } from '../context/ToastContext'

const isRealId = (id) => /^[a-f\d]{24}$/i.test(id)

export default function Notifications() {
  const toast = useToast()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const currentUserId = localStorage.getItem('currentUserId')
  const { clearUnread } = useSocket() || {}

  // Clear badge when this page is open
  useEffect(() => {
    if (clearUnread) clearUnread()
  }, [clearUnread])

  // Listen for real-time notifications pushed via Socket.io
  useEffect(() => {
    const handler = async (e) => {
      const notif = e.detail
      try {
        const res = await api.get(`${USER_SERVICE}/users/${notif.userId}`)
        if (res?.data) {
          const user = res.data
          const action =
            notif.type === 'like'   ? 'liked your post' :
            notif.type === 'follow' ? 'started following you' :
            'commented on your post'
          notif.actorName   = user.username
          notif.actorAvatar = getAvatarSrc(user)
          notif.message     = `@${user.username} ${action}`
        }
      } catch (_) {}
      setNotifications((prev) => [notif, ...prev])
    }
    window.addEventListener('new-notification', handler)
    return () => window.removeEventListener('new-notification', handler)
  }, [])

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (!currentUserId) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await fetchWithTimeout(`${NOTIF_SERVICE}/notifications/${currentUserId}`, { timeout: 10000 })
      const parsed = await parseResponse(res)
      const raw = parsed.ok && Array.isArray(parsed.data) ? parsed.data : []
      const enriched = await Promise.all(
        raw.map(async (n) => {
          try {
            const userRes = await api.get(`${USER_SERVICE}/users/${n.userId}`)
            if (userRes?.data) {
              const user = userRes.data
                const action =
                  n.type === 'like'    ? 'liked your post' :
                  n.type === 'follow'  ? 'started following you' :
                  'commented on your post'
                return {
                  ...n,
                  actorName: user.username,
                  actorAvatar: getAvatarSrc(user),
                  message: `@${user.username} ${action}`,
                }
              }
            } catch (_) {}
            return n
          })
        )
      enriched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      setNotifications(enriched)
    } catch (err) {
      toast.error(err?.name === 'AbortError' ? 'Request timed out' : 'Failed to load notifications')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentUserId, toast])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const likeCount    = notifications.filter((n) => n.type === 'like').length
  const commentCount = notifications.filter((n) => n.type === 'comment').length
  const followCount  = notifications.filter((n) => n.type === 'follow').length

  return (
    <div className="page">
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--surface-nav)',
          backdropFilter: 'blur(16px) saturate(180%)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '16px var(--content-padding)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--content-max-width)',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: 'var(--brand-50)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-500)',
              }}
            >
              <Bell size={18} />
            </div>
            <div>
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
                Notifications
              </h1>
              {notifications.length > 0 && !loading && (
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    margin: 0,
                  }}
                >
                  {notifications.length} total
                </p>
              )}
            </div>
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
            style={{ gap: 6, color: 'var(--text-secondary)' }}
          >
            <RefreshCw
              size={15}
              style={{
                animation: refreshing ? 'spin 0.65s linear infinite' : 'none',
              }}
            />
            Refresh
          </button>
        </div>
      </header>

      <main className="page-content">
        {/* Summary chips — only when loaded */}
        {!loading && notifications.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: 'var(--color-like-bg)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-like)',
              }}
            >
              <Heart size={13} fill="currentColor" />
              {likeCount} like{likeCount !== 1 ? 's' : ''}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: 'var(--brand-50)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--brand-600)',
              }}
            >
              <MessageCircle size={13} />
              {commentCount} comment{commentCount !== 1 ? 's' : ''}
            </div>
            {followCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  background: 'var(--neutral-100)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--text-secondary)',
                }}
              >
                <UserPlus size={13} />
                {followCount} new follower{followCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* States */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: 16,
                  background: 'var(--surface-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  alignItems: 'center',
                }}
              >
                <div
                  className="skeleton"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-full)',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    className="skeleton"
                    style={{ height: 13, width: '65%', borderRadius: 6 }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: 11, width: '35%', borderRadius: 6 }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Inbox size={28} />
            </div>
            <h3>All caught up!</h3>
            <p>
              When someone likes, comments, or follows you, you'll see it here.
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((n, idx) => (
              <NotifItem key={n._id || idx} notif={n} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function NotifItem({ notif }) {
  const navigate  = useNavigate()
  const isLike    = notif.type === 'like'
  const isComment = notif.type === 'comment'
  const isFollow  = notif.type === 'follow'

  const iconClass  = isLike ? 'like' : isFollow ? 'follow' : 'comment'
  const actorId    = notif.userId?.toString()
  const canClick   = isRealId(actorId)
  const goToActor  = () => { if (canClick) navigate(`/user/${actorId}`) }

  return (
    <div className="notif-item">
      {/* Icon */}
      <div className={`notif-icon notif-icon-${iconClass}`}>
        {isLike   ? <Heart size={16} fill="currentColor" /> :
         isFollow ? <UserPlus size={16} /> :
                   <MessageCircle size={16} />}
      </div>

      {/* Avatar + text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}
        >
          {/* Clickable avatar */}
          <button
            onClick={goToActor}
            style={{ background: 'none', border: 'none', padding: 0, cursor: canClick ? 'pointer' : 'default', flexShrink: 0 }}
          >
            <img
              src={notif.actorAvatar || dicebearUrl(notif.actorName || 'user')}
              alt={notif.actorName}
              className="avatar avatar-sm"
            />
          </button>

          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.4,
              flex: 1,
            }}
          >
            {/* Clickable username */}
            <button
              onClick={goToActor}
              style={{ background: 'none', border: 'none', padding: 0, cursor: canClick ? 'pointer' : 'default', fontFamily: 'var(--font-sans)', display: 'inline' }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>
                @{notif.actorName || 'Someone'}
              </strong>
            </button>
            {' '}
            {isLike ? 'liked your post' : isFollow ? 'started following you' : 'commented on your post'}
          </p>
        </div>

        {/* Comment preview */}
        {isComment && notif.commentText && (
          <div
            style={{
              background: 'var(--neutral-50)',
              borderLeft: '3px solid var(--brand-300)',
              padding: '6px 10px',
              borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              marginBottom: 4,
              marginLeft: 40,
            }}
          >
            "{notif.commentText}"
          </div>
        )}

        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            margin: 0,
            marginLeft: 40,
          }}
        >
          {formatTimeAgo(notif.createdAt)}
        </p>
      </div>

      {/* Type badge */}
      <div
        style={{
          flexShrink: 0,
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-semibold)',
          background: isLike   ? 'var(--color-like-bg)' :
                      isFollow ? 'var(--neutral-100)'    :
                                 'var(--brand-50)',
          color:      isLike   ? 'var(--color-like)'  :
                      isFollow ? 'var(--text-secondary)' :
                                 'var(--brand-600)',
        }}
      >
        {isLike ? 'Like' : isFollow ? 'Follow' : 'Comment'}
      </div>
    </div>
  )
}
