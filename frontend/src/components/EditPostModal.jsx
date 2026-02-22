import React, { useEffect, useState, useRef } from 'react'
import { X, MapPin, FileText, Save } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { CONTENT_SERVICE } from '../constants/api'

export default function EditPostModal({ post, onClose, onSave, allLocations }) {
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const overlayRef = useRef(null)

  useEffect(() => {
    const baseCaption = post.caption?.split('📍')[0]?.trim() || ''
    setCaption(baseCaption)
    setLocation(post.location || '')

    // Prevent body scroll while modal open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [post])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSave = async () => {
    if (!caption.trim()) {
      toast.error('Caption cannot be empty.')
      return
    }
    if (!location) {
      toast.error('Please select a location.')
      return
    }

    setSaving(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${CONTENT_SERVICE}/posts/${post._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caption: caption.trim(), location }),
      })
      const data = await res.json()
      if (res.ok) {
        onSave(data.post || data)
      } else {
        toast.error('Failed to update: ' + (data.message || 'Unknown error'))
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Edit Post"
    >
      <div className="modal">
        {/* Drag handle (mobile) */}
        <div className="modal-handle" />

        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Edit Post</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Post image preview */}
        {post.image && (
          <div
            style={{
              margin: '0 0 0',
              maxHeight: 200,
              overflow: 'hidden',
            }}
          >
            <img
              src={post.image}
              alt="Post"
              style={{
                width: '100%',
                height: 180,
                objectFit: 'cover',
                display: 'block',
              }}
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Body */}
        <div className="modal-body">
          {/* Caption */}
          <div className="form-group">
            <label
              className="form-label"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <FileText size={13} />
              Caption
            </label>
            <textarea
              className="form-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              placeholder="Describe your adventure…"
              autoFocus
              style={{ resize: 'vertical', minHeight: 80 }}
            />
            <div className="char-counter">
              {280 - caption.length} characters remaining
            </div>
          </div>

          {/* Location */}
          <div className="form-group">
            <label
              className="form-label"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <MapPin size={13} />
              Location
            </label>
            <select
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">Select destination…</option>
              {allLocations.map((loc, i) => (
                <option key={i} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn btn-secondary btn-full"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary btn-full"
            onClick={handleSave}
            disabled={saving || !caption.trim() || !location}
          >
            {saving ? (
              <>
                <span className="spinner" />
                Saving…
              </>
            ) : (
              <>
                <Save size={15} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
