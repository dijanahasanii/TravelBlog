import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { USER_SERVICE } from '../constants/api'

export default function ChangePassword() {
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState({ current: false, new: false })
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (newPass !== confirm) {
      toast.error("New passwords don't match.")
      return
    }
    if (newPass.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    if (!current) {
      toast.error('Please enter your current password.')
      return
    }

    const userId = localStorage.getItem('currentUserId')
    setLoading(true)
    try {
      await api.patch(`${USER_SERVICE}/users/${userId}`, {
        currentPassword: current,
        newPassword: newPass,
      })
      setSuccess(true)
      toast.success('Password changed!')
      setTimeout(() => navigate('/profile'), 2000)
    } catch (err) {
      const msg = err.response?.data?.message
      toast.error(msg || 'Failed to change password.')
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
                background: success
                  ? 'var(--color-success-bg)'
                  : 'var(--brand-50)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: success ? 'var(--color-success)' : 'var(--brand-500)',
                border: `1px solid ${success ? 'rgba(22,163,74,0.2)' : 'var(--brand-100)'}`,
              }}
            >
              {success ? <CheckCircle2 size={24} /> : <Lock size={24} />}
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
              {success ? 'Password Changed!' : 'Change Password'}
            </h1>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              {success
                ? 'Redirecting to your profile…'
                : 'Enter your current password and choose a new one.'}
            </p>
          </div>

          {!success && (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* Current password */}
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPass.current ? 'text' : 'password'}
                    placeholder="Your current password"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    required
                    autoFocus
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPass((p) => ({ ...p, current: !p.current }))
                    }
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    {showPass.current ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPass.new ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => ({ ...p, new: !p.new }))}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  className={`form-input${confirm && confirm !== newPass ? ' has-error' : ''}`}
                  type="password"
                  placeholder="Repeat new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
                {confirm && confirm !== newPass && (
                  <span className="field-error">Passwords don't match</span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={
                  loading || !current || !newPass || newPass !== confirm
                }
                style={{ height: 48, marginTop: 4 }}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Changing…
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
