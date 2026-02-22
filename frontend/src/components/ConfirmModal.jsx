/**
 * ConfirmModal — custom confirmation dialog, replaces window.confirm().
 *
 * Usage:
 *   const [confirm, setConfirm] = useState(null)
 *
 *   // trigger:
 *   setConfirm({ message: 'Delete this post?', onConfirm: () => doDelete() })
 *
 *   // render:
 *   <ConfirmModal config={confirm} onClose={() => setConfirm(null)} />
 */
import React, { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmModal({ config, onClose }) {
  useEffect(() => {
    if (!config) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [config, onClose])

  if (!config) return null

  const {
    title       = 'Are you sure?',
    message     = 'This action cannot be undone.',
    confirmText = 'Delete',
    cancelText  = 'Cancel',
    danger      = true,
    onConfirm,
  } = config

  const handleConfirm = () => {
    onClose()
    onConfirm?.()
  }

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 99000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="modal"
        style={{ maxWidth: 400, width: 'calc(100% - 32px)' }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <div style={{ padding: '28px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Icon + title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
              background: danger ? 'var(--color-error-bg)' : 'var(--color-warning-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: danger ? 'var(--color-error)' : 'var(--color-warning)',
            }}>
              <AlertTriangle size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h2
                id="confirm-title"
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--weight-bold)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  marginBottom: 4,
                }}
              >
                {title}
              </h2>
              <p
                id="confirm-message"
                style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}
              >
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: 2, flexShrink: 0,
                display: 'flex', alignItems: 'center',
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              className="btn btn-secondary"
              onClick={onClose}
              style={{ minWidth: 90 }}
            >
              {cancelText}
            </button>
            <button
              className="btn"
              onClick={handleConfirm}
              autoFocus
              style={{
                minWidth: 90,
                background: danger ? 'var(--color-error)' : 'var(--brand-500)',
                color: 'white',
                border: 'none',
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
