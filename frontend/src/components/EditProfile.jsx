import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '../context/ToastContext'
import { uploadToCloudinary } from '../utils/cloudinary'
import { USER_SERVICE } from '../constants/api'
import {
  ArrowLeft, User, Mail, Phone, FileText, MapPin,
  Lock, Eye, EyeOff, Save, Camera, Trash2, Upload,
} from 'lucide-react'

const FIELDS = [
  { name: 'fullName', label: 'Full Name',  type: 'text',     placeholder: 'Jane Doe',      icon: User,     required: true  },
  { name: 'email',    label: 'Email',       type: 'email',    placeholder: 'jane@email.com', icon: Mail,     required: true  },
  { name: 'phone',    label: 'Phone',       type: 'tel',      placeholder: '+1 555 0100',    icon: Phone,    required: false },
  { name: 'bio',      label: 'Bio',         type: 'textarea', placeholder: 'Tell your story…',icon: FileText, required: false },
  { name: 'location', label: 'Home Base',   type: 'text',     placeholder: 'New York, USA',  icon: MapPin,   required: false },
]

// Compress image to max 256×256, JPEG 0.85
function compressAvatar(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 256
      let { width, height } = img
      if (width > height) {
        if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX }
      } else {
        if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

function dicebearUrl(username) {
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${username || 'user'}`
}

export default function EditProfile() {
  const navigate  = useNavigate()
  const toast     = useToast()
  const fileRef   = useRef(null)
  const userId    = localStorage.getItem('currentUserId')
  const username  = localStorage.getItem('username')

  const [formData,     setFormData]     = useState({ fullName: '', email: '', phone: '', bio: '', location: '' })
  const [password,     setPassword]     = useState({ current: '', new: '', confirm: '' })
  const [showCurrent,  setShowCurrent]  = useState(false)
  const [showNew,      setShowNew]      = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [section,      setSection]      = useState('info')

  // Avatar state
  const [savedAvatar,   setSavedAvatar]   = useState(null)  // what's stored in DB
  const [previewAvatar, setPreviewAvatar] = useState(null)  // local preview (before save)
  const [avatarChanged, setAvatarChanged] = useState(false) // dirty flag
  const [avatarLoading, setAvatarLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${USER_SERVICE}/users/${userId}`)
        const d   = res.data
        setFormData({
          fullName: d.fullName || '',
          email:    d.email    || '',
          phone:    d.phone    || '',
          bio:      d.bio      || '',
          location: d.location || '',
        })
        if (d.avatar) {
          setSavedAvatar(d.avatar)
          setPreviewAvatar(d.avatar)
        }
      } catch {
        toast.error('Failed to load profile data')
      } finally {
        setFetchLoading(false)
      }
    }
    load()
  }, [userId, toast])

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))

  // ── Avatar handlers ──────────────────────────────────────────
  const handleAvatarFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }
    setAvatarLoading(true)
    try {
      // Compress locally first, then upload to Cloudinary (or keep base64)
      const compressed = await compressAvatar(file)
      const url = await uploadToCloudinary(compressed, 'avatars')
      setPreviewAvatar(url)
      setAvatarChanged(true)
    } catch {
      toast.error('Failed to process image.')
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleAvatarDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleAvatarFile(file)
  }

  const handleRemoveAvatar = () => {
    setPreviewAvatar(null)
    setAvatarChanged(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  const saveAvatarToServer = async (avatarData) => {
    await axios.patch(
      `${USER_SERVICE}/users/${userId}`,
      { avatar: avatarData },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    )
    // Persist in localStorage so it shows immediately everywhere
    const stored = JSON.parse(localStorage.getItem('currentUser') || '{}')
    localStorage.setItem('currentUser', JSON.stringify({ ...stored, avatar: avatarData }))
    setSavedAvatar(avatarData)
    setAvatarChanged(false)
  }

  // ── Profile info submit ──────────────────────────────────────
  const handleInfoSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // If avatar changed, include it in the same PATCH
      const payload = { ...formData }
      if (avatarChanged) payload.avatar = previewAvatar ?? null

      await axios.patch(`${USER_SERVICE}/users/${userId}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })

      if (avatarChanged) {
        const stored = JSON.parse(localStorage.getItem('currentUser') || '{}')
        localStorage.setItem('currentUser', JSON.stringify({ ...stored, avatar: previewAvatar ?? null }))
        setSavedAvatar(previewAvatar)
        setAvatarChanged(false)
      }

      toast.success('Profile updated!')
      navigate('/profile')
    } catch (err) {
      const msg = err.response?.data?.message
      if (err.response?.status === 413) {
        toast.error('Avatar image is too large. Please choose a smaller photo.')
      } else {
        toast.error(msg || 'Failed to update profile')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Password submit ──────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (password.new !== password.confirm) { toast.error("New passwords don't match."); return }
    if (password.new.length < 6)           { toast.error('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      await axios.patch(
        `${USER_SERVICE}/users/${userId}`,
        { currentPassword: password.current, newPassword: password.new },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      toast.success('Password changed!')
      setPassword({ current: '', new: '', confirm: '' })
      navigate('/profile')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    )
  }

  const displayAvatar = previewAvatar || dicebearUrl(username)
  const isDicebear    = !previewAvatar

  return (
    <div className="edit-profile-container">
      {/* Top bar */}
      <div style={{ maxWidth: 520, width: '100%', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/profile')}
          style={{ padding: '6px 8px', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', flex: 1, margin: 0 }}>
          Edit Profile
        </h1>
      </div>

      <div style={{ maxWidth: 520, width: '100%', background: 'var(--surface-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>

        {/* ── Avatar section ── */}
        <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Profile Photo
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Avatar preview */}
            <div
              style={{ position: 'relative', flexShrink: 0 }}
              onDrop={handleAvatarDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  border: avatarChanged ? '3px solid var(--brand-400)' : '3px solid var(--border-subtle)',
                  transition: 'border-color 0.2s',
                  boxShadow: 'var(--shadow-sm)',
                  background: 'var(--neutral-100)',
                }}
              >
                {avatarLoading ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner spinner-dark" style={{ width: 24, height: 24 }} />
                  </div>
                ) : (
                  <img
                    src={displayAvatar}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>

              {/* Change badge */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--brand-500)',
                  border: '2.5px solid white',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--brand-600)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--brand-500)'}
              >
                <Camera size={13} />
              </button>
            </div>

            {/* Upload controls */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)', color: 'var(--text-primary)', marginBottom: 4 }}>
                {formData.fullName || username}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 12 }}>
                @{username}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileRef.current?.click()}
                  style={{ gap: 6 }}
                >
                  <Upload size={13} />
                  {savedAvatar || previewAvatar ? 'Change photo' : 'Upload photo'}
                </button>

                {previewAvatar && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleRemoveAvatar}
                    style={{ gap: 6, color: 'var(--color-error)' }}
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                )}
              </div>

              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 8 }}>
                JPG, PNG or WEBP · Max 2 MB · Auto-cropped to square
                {isDicebear && ' · Currently using auto-generated avatar'}
              </p>

              {avatarChanged && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--brand-600)', fontWeight: 'var(--weight-semibold)', marginTop: 4 }}>
                  ● Unsaved — click "Save Changes" below to apply
                </p>
              )}
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleAvatarFile(e.target.files[0])}
          />
        </div>

        {/* ── Tab switcher ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)' }}>
          {[['info', 'Profile Info'], ['password', 'Change Password']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              style={{
                flex: 1, padding: '12px 16px', border: 'none', background: 'none',
                fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
                color: section === key ? 'var(--brand-500)' : 'var(--text-muted)', cursor: 'pointer',
                borderBottom: section === key ? '2px solid var(--brand-500)' : '2px solid transparent',
                transition: 'all var(--duration-fast)', letterSpacing: '0.01em',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Profile info form ── */}
        {section === 'info' && (
          <form onSubmit={handleInfoSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FIELDS.map(({ name, label, type, placeholder, icon: Icon, required }) => (
              <div key={name} className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={13} />
                  {label}
                </label>
                {type === 'textarea' ? (
                  <textarea
                    className="form-input"
                    name={name}
                    placeholder={placeholder}
                    value={formData[name]}
                    onChange={handleChange}
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                ) : (
                  <input
                    className="form-input"
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={formData[name]}
                    onChange={handleChange}
                    required={required}
                  />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/profile')} style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
                {loading ? <><span className="spinner" /> Saving…</> : <><Save size={15} /> Save Changes</>}
              </button>
            </div>
          </form>
        )}

        {/* ── Password form ── */}
        {section === 'password' && (
          <form onSubmit={handlePasswordSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={13} /> Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Your current password"
                  value={password.current}
                  onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowCurrent((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={13} /> New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password.new}
                  onChange={(e) => setPassword((p) => ({ ...p, new: e.target.value }))}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowNew((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={13} /> Confirm New Password
              </label>
              <input
                className={`form-input${password.confirm && password.confirm !== password.new ? ' has-error' : ''}`}
                type="password"
                placeholder="Repeat new password"
                value={password.confirm}
                onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
                required
              />
              {password.confirm && password.confirm !== password.new && (
                <span className="field-error">Passwords don't match</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSection('info')} style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !password.current || !password.new || password.new !== password.confirm}
                style={{ flex: 2 }}
              >
                {loading ? <><span className="spinner" /> Saving…</> : <><Save size={15} /> Change Password</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
