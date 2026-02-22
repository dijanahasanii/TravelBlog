import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { USER_SERVICE } from '../constants/api'
import {
  Compass,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  User,
  UserCircle,
  CheckCircle,
} from 'lucide-react'

const FIELDS = [
  {
    name: 'fullName',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Jane Doe',
    icon: <UserCircle size={16} />,
    autocomplete: 'name',
  },
  {
    name: 'username',
    label: 'Username',
    type: 'text',
    placeholder: 'jane_doe',
    icon: <User size={16} />,
    autocomplete: 'username',
  },
  {
    name: 'email',
    label: 'Email address',
    type: 'email',
    placeholder: 'jane@email.com',
    icon: <Mail size={16} />,
    autocomplete: 'email',
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Min. 8 characters',
    autocomplete: 'new-password',
  },
  {
    name: 'confirmPassword',
    label: 'Confirm password',
    type: 'password',
    placeholder: 'Repeat password',
    autocomplete: 'new-password',
  },
]

export default function SignUp() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [error, setError] = useState('')
  const [conflictField, setConflictField] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
    if (conflictField) setConflictField('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match. Please check and try again.")
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await axios.post(`${USER_SERVICE}/register`, {
        username: formData.username.trim(),
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        password: formData.password,
      })
      setSuccess(true)
      setTimeout(() => navigate('/signin'), 2000)
    } catch (err) {
      const data = err.response?.data
      setError(data?.message || data?.error || 'Something went wrong. Please try again.')
      if (data?.field) setConflictField(data.field)
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = (() => {
    const p = formData.password
    if (!p) return null
    if (p.length < 6)
      return { level: 1, label: 'Too short', color: 'var(--color-error)' }
    if (p.length < 10)
      return { level: 2, label: 'Fair', color: 'var(--color-warning)' }
    return { level: 3, label: 'Strong', color: 'var(--color-success)' }
  })()

  if (success) {
    return (
      <div className="auth-layout">
        <div className="auth-panel">
          <div
            className="auth-card animate-fade-up"
            style={{ textAlign: 'center', padding: 48 }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                background: 'var(--color-success-bg)',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                color: 'var(--color-success)',
              }}
            >
              <CheckCircle size={36} />
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-2xl)',
                fontWeight: 700,
                marginBottom: 12,
                color: 'var(--text-primary)',
              }}
            >
              Account created!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              Welcome to Wandr,{' '}
              <strong>{formData.fullName || formData.username}</strong>!
            </p>
            <p
              style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}
            >
              Redirecting you to sign in…
            </p>
          </div>
        </div>
      </div>
    )
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
      <div className="auth-panel" style={{ padding: '32px 24px' }}>
        <div className="auth-card animate-fade-up">
          {/* Header */}
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
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
              Create your account
            </h1>
            <p
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
              }}
            >
              Start sharing your adventures today
            </p>
          </div>

          {/* Error banner — only show for non-field errors */}
          {error && !conflictField && (
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

          {/* Conflict banner with sign-in nudge */}
          {error && conflictField && (
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
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <span>{error}</span>
              <Link
                to="/signin"
                style={{
                  color: 'var(--brand-600)',
                  fontWeight: 'var(--weight-semibold)',
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                  fontSize: 'var(--text-xs)',
                }}
              >
                Already have an account? Sign in instead →
              </Link>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {FIELDS.map((field) => {
              const isPassField = field.name === 'password'
              const isConfField = field.name === 'confirmPassword'
              const showToggle = isPassField || isConfField
              const currentShow = isPassField
                ? showPass
                : isConfField
                  ? showConf
                  : false
              const toggle = isPassField
                ? () => setShowPass((v) => !v)
                : isConfField
                  ? () => setShowConf((v) => !v)
                  : null

              return (
                <div className="form-group" key={field.name}>
                  <label className="form-label">{field.label}</label>
                  <div style={{ position: 'relative' }}>
                    {field.icon && (
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
                        {field.icon}
                      </div>
                    )}
                    <input
                      className={`form-input${conflictField === field.name ? ' has-error' : ''}`}
                      type={
                        showToggle
                          ? currentShow
                            ? 'text'
                            : 'password'
                          : field.type
                      }
                      name={field.name}
                      placeholder={field.placeholder}
                      autoComplete={field.autocomplete}
                      autoFocus={field.name === 'fullName'}
                      onChange={handleChange}
                      value={formData[field.name]}
                      required
                      style={{
                        paddingLeft: field.icon ? 38 : undefined,
                        paddingRight: showToggle ? 44 : undefined,
                      }}
                    />
                    {showToggle && (
                      <button
                        type="button"
                        onClick={toggle}
                        tabIndex={-1}
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
                      >
                        {currentShow ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>

                  {/* Conflict field error */}
                  {conflictField === field.name && (
                    <span className="field-error" style={{ marginTop: 4 }}>
                      {error}
                    </span>
                  )}

                  {/* Password strength indicator */}
                  {isPassField && passwordStrength && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            style={{
                              flex: 1,
                              height: 3,
                              borderRadius: 99,
                              background:
                                level <= passwordStrength.level
                                  ? passwordStrength.color
                                  : 'var(--neutral-200)',
                              transition: 'background 0.3s',
                            }}
                          />
                        ))}
                      </div>
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: passwordStrength.color,
                          fontWeight: 'var(--weight-medium)',
                        }}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: 8, height: 48 }}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="divider" style={{ margin: '24px 0' }}>
            or
          </div>

          <p
            style={{
              textAlign: 'center',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            Already have an account?{' '}
            <Link
              to="/signin"
              style={{
                color: 'var(--brand-600)',
                fontWeight: 'var(--weight-semibold)',
                textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
