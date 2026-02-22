import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { USER_SERVICE } from '../constants/api'
import { Compass, Eye, EyeOff, ArrowLeft, Lock, User } from 'lucide-react'
import { useSocket } from '../context/SocketContext'

export default function SignIn() {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { connectSocket } = useSocket()

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${USER_SERVICE}/login`, formData)
      const { user, token } = response.data

      if (!token) {
        setError('Authentication failed. Please try again.')
        return
      }

      localStorage.setItem('currentUser', JSON.stringify(user))
      localStorage.setItem('currentUserId', user._id)
      localStorage.setItem('username', user.username)
      localStorage.setItem('token', token)
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken)
      }

      // Establish socket connection immediately after login
      connectSocket(user._id)

      navigate('/feed', { replace: true })
    } catch (err) {
      const data = err.response?.data
      setError(
        data?.error || data?.message || 'Invalid credentials. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-secondary)',
          }}
        >
          <ArrowLeft size={18} />
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
            }}
          >
            Back
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: 'var(--brand-500)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={18} color="white" />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 700,
              fontSize: 'var(--text-xl)',
              letterSpacing: '-0.02em',
            }}
          >
            Wandr
          </span>
        </div>

        <div style={{ width: 60 }} />
      </div>

      {/* Form area */}
      <div className="auth-panel">
        <div className="auth-card animate-fade-up">
          {/* Header */}
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                background: 'var(--brand-50)',
                border: '1px solid var(--brand-100)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: 'var(--brand-500)',
              }}
            >
              <Lock size={24} />
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-3xl)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                marginBottom: 8,
              }}
            >
              Welcome back
            </h1>
            <p
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
              }}
            >
              Sign in to continue your journey
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                background: 'var(--color-error-bg)',
                border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                marginBottom: 20,
                fontSize: 'var(--text-sm)',
                color: 'var(--color-error)',
                fontWeight: 'var(--weight-medium)',
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Username */}
            <div className="form-group">
              <label className="form-label">Username</label>
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
                  <User size={16} />
                </div>
                <input
                  className={`form-input${error ? ' has-error' : ''}`}
                  type="text"
                  name="username"
                  placeholder="your_username"
                  autoComplete="username"
                  autoFocus
                  onChange={handleChange}
                  value={formData.username}
                  required
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
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
                  <Lock size={16} />
                </div>
                <input
                  className={`form-input${error ? ' has-error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  onChange={handleChange}
                  value={formData.password}
                  required
                  style={{ paddingLeft: 38, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading || !formData.username || !formData.password}
              style={{ marginTop: 4, height: 48 }}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Forgot password */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textDecoration: 'underline', textUnderlineOffset: 2 }}
            >
              Forgot password?
            </Link>
          </div>

          {/* Divider */}
          <div className="divider" style={{ margin: '24px 0' }}>
            or
          </div>

          {/* Sign up link */}
          <p
            style={{
              textAlign: 'center',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{
                color: 'var(--brand-600)',
                fontWeight: 'var(--weight-semibold)',
                textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
