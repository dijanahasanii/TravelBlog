import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ArrowLeft, Compass } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  const token    = localStorage.getItem('token')

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-page)',
      padding: '32px 24px',
      textAlign: 'center',
      gap: 0,
    }}>
      {/* Big number */}
      <div style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 'clamp(80px, 20vw, 160px)',
        fontWeight: 700,
        color: 'var(--brand-500)',
        lineHeight: 1,
        letterSpacing: '-0.04em',
        opacity: 0.18,
        userSelect: 'none',
      }}>
        404
      </div>

      {/* Icon */}
      <div style={{
        width: 72, height: 72,
        borderRadius: 'var(--radius-full)',
        background: 'var(--brand-50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--brand-500)',
        marginTop: -32,
        marginBottom: 24,
        boxShadow: 'var(--shadow-md)',
      }}>
        <MapPin size={32} />
      </div>

      <h1 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 'var(--text-3xl)',
        fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '-0.03em',
        marginBottom: 10,
      }}>
        Lost on the map?
      </h1>

      <p style={{
        fontSize: 'var(--text-base)',
        color: 'var(--text-muted)',
        maxWidth: 320,
        lineHeight: 'var(--leading-relaxed)',
        marginBottom: 36,
      }}>
        This destination doesn't exist. Maybe it was deleted, or the link is wrong.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <ArrowLeft size={16} /> Go back
        </button>

        <button
          onClick={() => navigate(token ? '/feed' : '/')}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Compass size={16} /> {token ? 'Back to feed' : 'Go home'}
        </button>
      </div>
    </div>
  )
}
