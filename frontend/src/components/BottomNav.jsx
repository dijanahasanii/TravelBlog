import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Compass, PlusSquare, Bell, User, Map } from 'lucide-react'
import { useSocket } from '../context/SocketContext'

const NAV_ITEMS = [
  { path: '/feed',          label: 'Home',    icon: Home,      isPost: false, isBell: false },
  { path: '/explore',       label: 'Explore', icon: Compass,   isPost: false, isBell: false },
  { path: '/post',          label: 'Post',    icon: PlusSquare,isPost: true,  isBell: false },
  { path: '/map',           label: 'Map',     icon: Map,       isPost: false, isBell: false },
  { path: '/notifications', label: 'Alerts',  icon: Bell,      isPost: false, isBell: true  },
  { path: '/profile',       label: 'Me',      icon: User,      isPost: false, isBell: false },
]

export default function BottomNav() {
  const location             = useLocation()
  const navigate             = useNavigate()
  const { unreadCount, clearUnread } = useSocket() || {}

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {NAV_ITEMS.map(({ path, label, icon: Icon, isPost, isBell }) => {
        const isActive = location.pathname === path

        return (
          <button
            key={path}
            className={`nav-btn${isPost ? ' nav-btn-post' : ''}${isActive ? ' active' : ''}`}
            onClick={() => {
              if (isBell && clearUnread) clearUnread()
              navigate(path)
            }}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="nav-icon-wrap" style={{ position: 'relative' }}>
              <Icon
                size={isPost ? 22 : 20}
                strokeWidth={isActive && !isPost ? 2.2 : 1.8}
              />
              {/* Unread badge on bell */}
              {isBell && unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -6,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-error)',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    lineHeight: 1,
                    border: '2px solid var(--surface-nav)',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
