import React, { useEffect, useState, useCallback } from 'react'
import { X, Search, UserPlus, UserMinus } from 'lucide-react'
import { getAvatarSrc } from '../utils/avatar'
import { USER_SERVICE, NOTIF_SERVICE } from '../constants/api'

/**
 * FollowListModal
 * Props:
 *   type       – 'followers' | 'following'
 *   userId     – whose list to fetch
 *   onClose    – close handler
 *   onSelect   – called with the user object when a row is clicked
 */
export default function FollowListModal({ type, userId, onClose, onSelect }) {
  const token         = localStorage.getItem('token')
  const currentUserId = localStorage.getItem('currentUserId')

  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')

  // Track follow state for each user in the list
  const [followingSet, setFollowingSet] = useState(new Set())
  const [busySet,      setBusySet]      = useState(new Set())

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${USER_SERVICE}/users/${userId}/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)

        // Also fetch who the current user is following so we can pre-fill state
        const meFollowingRes = await fetch(
          `${USER_SERVICE}/users/${currentUserId}/following`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (meFollowingRes.ok) {
          const meFollowing = await meFollowingRes.json()
          const ids = new Set(meFollowing.map((u) => u._id?.toString()))
          setFollowingSet(ids)
        }
      }
    } catch (_) {}
    finally { setLoading(false) }
  }, [userId, type, token, currentUserId])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const goToProfile = (user) => {
    onSelect(user)
  }

  const handleFollowToggle = async (e, targetUser) => {
    e.stopPropagation() // Don't navigate to their profile
    const targetId  = targetUser._id?.toString()
    if (busySet.has(targetId)) return

    setBusySet((prev) => new Set([...prev, targetId]))
    const wasFollowing = followingSet.has(targetId)

    // Optimistic
    setFollowingSet((prev) => {
      const next = new Set(prev)
      wasFollowing ? next.delete(targetId) : next.add(targetId)
      return next
    })

    try {
      const res = await fetch(`${USER_SERVICE}/users/${targetId}/follow`, {
        method: wasFollowing ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()

      // Send follow notification
      if (!wasFollowing) {
        fetch(`${NOTIF_SERVICE}/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, targetUserId: targetId, type: 'follow' }),
        }).catch(() => {})
      }
    } catch {
      // Roll back
      setFollowingSet((prev) => {
        const next = new Set(prev)
        wasFollowing ? next.add(targetId) : next.delete(targetId)
        return next
      })
    } finally {
      setBusySet((prev) => {
        const next = new Set(prev)
        next.delete(targetId)
        return next
      })
    }
  }

  const filtered = users.filter((u) => {
    const q = filter.toLowerCase()
    return (
      u.username?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q)
    )
  })

  const title = type === 'followers' ? 'Followers' : 'Following'

  return (
    <div
      className="modal-overlay"
      onClick={handleBackdrop}
      style={{ zIndex: 9500 }}
    >
      <div className="modal" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Search filter */}
        {users.length > 5 && (
          <div style={{ padding: '10px 20px 0' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}…`}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px 8px 34px',
                  border: '1.5px solid var(--border-default)',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--neutral-50)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <span className="spinner spinner-dark" style={{ width: 24, height: 24, borderWidth: 3 }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 16px', fontSize: 'var(--text-sm)' }}>
              {filter ? 'No results match your search.' : type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </div>
          ) : (
            filtered.map((user) => {
              const uid        = user._id?.toString()
              const isMe       = uid === currentUserId
              const isFollowed = followingSet.has(uid)
              const isBusy     = busySet.has(uid)

              return (
                <div
                  key={user._id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Clickable left section (avatar + name) */}
                  <button
                    onClick={() => goToProfile(user)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      flex: 1, minWidth: 0,
                      border: 'none', background: 'none', cursor: 'pointer',
                      textAlign: 'left', padding: 0,
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <img
                      src={getAvatarSrc(user)}
                      alt={user.username}
                      style={{
                        width: 44, height: 44, borderRadius: '50%',
                        objectFit: 'cover', flexShrink: 0,
                        border: '2px solid var(--border-subtle)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 'var(--weight-semibold)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {user.fullName || user.username}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        @{user.username}
                      </div>
                      {user.bio && (
                        <div style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-secondary)',
                          marginTop: 2,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {user.bio}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Follow / Unfollow button — hidden for self */}
                  {!isMe && (
                    <button
                      onClick={(e) => handleFollowToggle(e, user)}
                      disabled={isBusy}
                      style={{
                        flexShrink: 0,
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--weight-semibold)',
                        fontFamily: 'var(--font-sans)',
                        cursor: isBusy ? 'wait' : 'pointer',
                        transition: 'all var(--duration-fast)',
                        border: isFollowed
                          ? '1.5px solid var(--border-default)'
                          : '1.5px solid var(--brand-500)',
                        background: isFollowed ? 'transparent' : 'var(--brand-500)',
                        color: isFollowed ? 'var(--text-primary)' : 'white',
                        opacity: isBusy ? 0.6 : 1,
                        minWidth: 88,
                        justifyContent: 'center',
                      }}
                    >
                      {isBusy ? (
                        <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                      ) : isFollowed ? (
                        <><UserMinus size={12} /> Unfollow</>
                      ) : (
                        <><UserPlus size={12} /> Follow</>
                      )}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Count footer */}
        {!loading && users.length > 0 && (
          <div style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}>
            {users.length} {users.length === 1 ? 'person' : 'people'}
          </div>
        )}
      </div>
    </div>
  )
}
