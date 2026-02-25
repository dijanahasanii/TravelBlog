/**
 * NotifPopup — real-time in-app notification popup.
 * Listens globally for 'new-notification' socket events and shows
 * a beautiful slide-in card. No browser push required.
 */
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, X } from 'lucide-react'
import { getAvatarSrc, dicebearUrl } from '../utils/avatar'
import { USER_SERVICE } from '../constants/api'
import api from '../utils/api'

const TYPE_CONFIG = {
  like:    { icon: Heart,          color: 'var(--color-like)',    bg: 'var(--color-like-bg)',  label: 'liked your post' },
  comment: { icon: MessageCircle,  color: 'var(--brand-500)',     bg: 'var(--brand-50)',       label: 'commented on your post' },
  follow:  { icon: UserPlus,       color: '#7c3aed',              bg: '#f5f3ff',               label: 'started following you' },
}

const DARK_BG = {
  like:    'rgba(225,29,72,0.15)',
  comment: 'rgba(229,90,28,0.12)',
  follow:  'rgba(124,58,237,0.12)',
}

let popupId = 0

export default function NotifPopup() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [items,   setItems]   = useState([])   // [{ id, notif, actor, exiting }]
  const timers    = useRef({})

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.map((p) => p.id === id ? { ...p, exiting: true } : p))
    setTimeout(() => {
      setItems((prev) => prev.filter((p) => p.id !== id))
    }, 350)
    clearTimeout(timers.current[id])
  }, [])

  const addPopup = useCallback((notif, actor) => {
    const id = ++popupId
    setItems((prev) => [...prev.slice(-2), { id, notif, actor, exiting: false }])
    timers.current[id] = setTimeout(() => dismiss(id), 5000)
  }, [dismiss])

  useEffect(() => {
    const handler = async (e) => {
      const notif = e.detail
      // Don't show popup if already on the notifications page
      if (location.pathname === '/notifications') return

      let actor = null
      try {
        const res = await api.get(`${USER_SERVICE}/users/${notif.userId}`)
        if (res?.data) actor = res.data
      } catch (_) {}

      addPopup(notif, actor)
    }

    window.addEventListener('new-notification', handler)
    return () => window.removeEventListener('new-notification', handler)
  }, [addPopup, location.pathname])

  if (!items.length) return null

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      right: 16,
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxWidth: 340,
      width: 'calc(100vw - 32px)',
      pointerEvents: 'none',
    }}>
      {items.map(({ id, notif, actor, exiting }) => {
        const cfg     = TYPE_CONFIG[notif.type] || TYPE_CONFIG.comment
        const Icon    = cfg.icon
        const bgColor = isDark ? (DARK_BG[notif.type] || DARK_BG.comment) : cfg.bg
        const avatar  = actor ? getAvatarSrc(actor) : dicebearUrl('user')
        const name    = actor?.username || 'Someone'

        const handleClick = () => {
          dismiss(id)
          if (notif.type === 'follow' && actor?._id) {
            navigate(`/user/${actor._id}`)
          } else if (notif.postId) {
            navigate(`/posts/${notif.postId}`)
          } else {
            navigate('/notifications')
          }
        }

        return (
          <div
            key={id}
            style={{
              pointerEvents: 'auto',
              background: isDark ? 'var(--surface-card)' : 'white',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              cursor: 'pointer',
              animation: exiting
                ? 'notif-slide-out 0.35s var(--ease-in) forwards'
                : 'notif-slide-in 0.4s var(--ease-spring) forwards',
            }}
          >
            {/* Coloured top bar */}
            <div style={{
              height: 3,
              background: cfg.color,
              animation: exiting ? 'none' : 'notif-progress 5s linear forwards',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
              {/* Avatar with icon badge */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={avatar}
                  alt={name}
                  style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-subtle)' }}
                />
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 18, height: 18,
                  borderRadius: '50%',
                  background: bgColor,
                  border: '2px solid var(--surface-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={9} color={cfg.color} fill={notif.type === 'like' ? cfg.color : 'none'} strokeWidth={2.5} />
                </div>
              </div>

              {/* Text */}
              <div
                style={{ flex: 1, minWidth: 0 }}
                onClick={handleClick}
              >
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                  margin: 0,
                }}>
                  <strong>@{name}</strong>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>{cfg.label}</span>
                </p>
                {notif.type !== 'follow' && notif.postId && (
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    marginTop: 2,
                    margin: '2px 0 0',
                  }}>
                    Tap to view post
                  </p>
                )}
              </div>

              {/* Dismiss */}
              <button
                onClick={(e) => { e.stopPropagation(); dismiss(id) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 4, borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'color var(--duration-fast)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
