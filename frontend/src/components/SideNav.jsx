import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Compass, PlusSquare, Bell, User, Map, Search } from 'lucide-react'
import { useSocket } from '../context/SocketContext'

const NAV_ITEMS = [
  { path: '/feed',          label: 'Home',    icon: Home      },
  { path: '/explore',       label: 'Explore', icon: Compass   },
  { path: '/search',        label: 'Search',  icon: Search    },
  { path: '/map',           label: 'Map',     icon: Map       },
  { path: '/notifications', label: 'Alerts',  icon: Bell, isBell: true },
  { path: '/profile',       label: 'Profile', icon: User      },
]

export default function SideNav() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { unreadCount, clearUnread } = useSocket() || {}

  return (
    <aside className="side-nav" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <button
        className="side-nav-logo"
        onClick={() => navigate('/feed')}
        aria-label="Go to feed"
      >
        <span className="side-nav-logo-icon">✦</span>
        <span className="side-nav-logo-text">wandr</span>
      </button>

      {/* Nav links */}
      <nav className="side-nav-links">
        {NAV_ITEMS.map(({ path, label, icon: Icon, isBell }) => {
          const isActive = location.pathname === path
          return (
            <button
              key={path}
              className={`side-nav-item${isActive ? ' active' : ''}`}
              onClick={() => {
                if (isBell && clearUnread) clearUnread()
                navigate(path)
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="side-nav-item-icon" style={{ position: 'relative' }}>
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                {isBell && unreadCount > 0 && (
                  <span className="side-nav-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              <span className="side-nav-item-label">{label}</span>
            </button>
          )
        })}
      </nav>

      {/* New Post CTA */}
      <button
        className="side-nav-post-btn"
        onClick={() => navigate('/post')}
      >
        <PlusSquare size={18} />
        New Post
      </button>
    </aside>
  )
}
