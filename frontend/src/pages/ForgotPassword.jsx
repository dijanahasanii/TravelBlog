import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Compass, ArrowLeft, Mail, User, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { USER_SERVICE } from '../constants/api'

export default function ForgotPassword() {
  const navigate = useNavigate()

  // step: 'verify' → 'reset' → 'done'
  const [step,         setStep]         = useState('verify')
  const [username,     setUsername]     = useState('')
  const [email,        setEmail]        = useState('')
  const [newPassword,  setNewPassword]  = useState('')
  const [confirmPass,  setConfirmPass]  = useState('')
  const [showPass,     setShowPass]     = useState(false)
  const [resetToken,   setResetToken]   = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${USER_SERVICE}/verify-identity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Could not verify identity'); return }
      setResetToken(data.resetToken)
      setStep('reset')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPass) { setError("Passwords don't match"); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${USER_SERVICE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Reset failed'); return }
      setStep('done')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--brand-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Compass size={20} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>wandr</span>
          </div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', marginBottom: 4 }}>
            {step === 'verify' ? 'Reset your password' : step === 'reset' ? 'Choose a new password' : 'Password updated!'}
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            {step === 'verify' ? 'Enter your username and email to verify your identity.' :
             step === 'reset' ? 'Pick a strong new password for your account.' :
             'You can now sign in with your new password.'}
          </p>
        </div>

        {/* Step: verify */}
        {step === 'verify' && (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={13} /> Username
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="your_username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError('') }}
                autoComplete="username"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={13} /> Email address
              </label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                autoComplete="email"
                required
              />
            </div>
            {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)', margin: 0 }}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ height: 48 }}>
              {loading ? <><span className="spinner" /> Verifying…</> : 'Verify Identity'}
            </button>
          </form>
        )}

        {/* Step: reset */}
        {step === 'reset' && (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={13} /> New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError('') }}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={13} /> Confirm Password
              </label>
              <input
                className="form-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Repeat your new password"
                value={confirmPass}
                onChange={(e) => { setConfirmPass(e.target.value); setError('') }}
                required
              />
            </div>
            {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)', margin: 0 }}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ height: 48 }}>
              {loading ? <><span className="spinner" /> Updating…</> : 'Update Password'}
            </button>
          </form>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-full)', background: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={32} color="var(--color-success)" />
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Your password has been changed. Sign in with your new credentials.
            </p>
            <button className="btn btn-primary btn-full" onClick={() => navigate('/signin')} style={{ height: 48 }}>
              Go to Sign In
            </button>
          </div>
        )}

        {/* Back link */}
        {step !== 'done' && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/signin" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              <ArrowLeft size={13} /> Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
