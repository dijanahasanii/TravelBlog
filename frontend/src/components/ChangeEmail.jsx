import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { USER_SERVICE } from '../constants/api'

export default function ChangeEmail() {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address.')
      return
    }

    const userId = localStorage.getItem('currentUserId')
    setLoading(true)
    try {
      await api.patch(`${USER_SERVICE}/users/${userId}`, { email })
      setSuccess(true)
      toast.success('Email updated successfully!')
      setTimeout(() => navigate('/profile'), 2000)
    } catch (err) {
      const msg = err.response?.data?.message
      toast.error(msg || 'Failed to update email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--surface-page)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px var(--content-padding)',
      }}
    >
      <div style={{ maxWidth: 440, width: '100%' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/profile')}
          style={{
            marginBottom: 24,
            gap: 6,
            color: 'var(--text-secondary)',
            padding: '6px 10px',
          }}
        >
          <ArrowLeft size={16} />
          Back to Profile
        </button>

        <div
          style={{
            background: 'var(--surface-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
            padding: '32px 28px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                width: 52,
                height: 52,
                background: 'var(--brand-50)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--brand-500)',
                border: '1px solid var(--brand-100)',
              }}
            >
              {success ? <CheckCircle2 size={24} /> : <Mail size={24} />}
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-2xl)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: 6,
              }}
            >
              {success ? 'Email Updated!' : 'Change Email'}
            </h1>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              {success
                ? 'Redirecting you back to your profile…'
                : 'Enter your new email address below.'}
            </p>
          </div>

          {!success && (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div className="form-group">
                <label className="form-label">New Email Address</label>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 13,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none',
                    }}
                  >
                    <Mail size={16} />
                  </div>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="new@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading || !email}
                style={{ height: 48 }}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Updating…
                  </>
                ) : (
                  'Update Email'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
