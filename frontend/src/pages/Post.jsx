import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { locations } from './dummyData'
import { useToast } from '../context/ToastContext'
import { uploadManyToCloudinary, uploadToCloudinary } from '../utils/cloudinary'
import { CONTENT_SERVICE } from '../constants/api'
import {
  ImagePlus,
  Video,
  MapPin,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  LocateFixed,
  Plus,
} from 'lucide-react'

const MAX_CAPTION   = 280
const MAX_IMAGES    = 5
const MAX_VIDEO_MB  = 50

const Post = () => {
  const navigate = useNavigate()
  const toast    = useToast()
  const token    = localStorage.getItem('token')

  // Media mode: 'images' | 'video'
  const [mediaMode,    setMediaMode]    = useState('images')
  const [images,       setImages]       = useState([])   // [{ preview }]
  const [activeIdx,    setActiveIdx]    = useState(0)
  const [video,        setVideo]        = useState(null) // { src, name }
  const [caption,      setCaption]      = useState('')
  const [location,     setLocation]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [dragOver,     setDragOver]     = useState(false)
  const [step,         setStep]         = useState(1)
  const [gpsLoading,   setGpsLoading]   = useState(false)
  const [locationMode, setLocationMode] = useState('select')

  const fileInputRef    = useRef(null)
  const addMoreInputRef = useRef(null)
  const videoInputRef   = useRef(null)

  // ── Image compression ────────────────────────────────────────────────────────
  const compressImage = (file) =>
    new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const MAX = 800
        let { width, height } = img
        if (width > height) {
          if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX }
        } else {
          if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
        URL.revokeObjectURL(url)
      }
      img.src = url
    })

  // ── Handle image file(s) ─────────────────────────────────────────────────────
  const handleImageFiles = useCallback(async (fileList) => {
    const validFiles = Array.from(fileList).filter(
      (f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024
    )
    if (!validFiles.length) {
      toast.error('Please select valid image files (JPG, PNG, WEBP, max 10 MB each).')
      return
    }
    const available = MAX_IMAGES - images.length
    if (available <= 0) { toast.error(`Maximum ${MAX_IMAGES} images allowed.`); return }
    const toProcess = validFiles.slice(0, available)
    const compressed = await Promise.all(toProcess.map(compressImage))
    const newEntries = compressed.map((preview) => ({ preview }))
    setImages((prev) => {
      const next = [...prev, ...newEntries]
      setActiveIdx(next.length - newEntries.length)
      return next
    })
    setMediaMode('images')
    setStep(2)
  }, [images, toast])

  // ── Handle video file ────────────────────────────────────────────────────────
  const handleVideoFile = useCallback((file) => {
    if (!file.type.startsWith('video/')) { toast.error('Please select a valid video file.'); return }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`Video must be smaller than ${MAX_VIDEO_MB} MB.`)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setVideo({ src: e.target.result, name: file.name })
      setImages([])
      setMediaMode('video')
      setStep(2)
    }
    reader.readAsDataURL(file)
  }, [toast])

  const handleFileInputChange = (e) => {
    const files = e.target.files
    if (!files?.length) return
    // Detect if it's a video based on which input triggered it
    if (e.target === videoInputRef.current) handleVideoFile(files[0])
    else handleImageFiles(files)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (!files?.length) return
    if (files[0].type.startsWith('video/')) handleVideoFile(files[0])
    else handleImageFiles(files)
  }

  const removeImage = (idx) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      if (next.length === 0) setStep(1)
      setActiveIdx((ai) => Math.min(ai, Math.max(0, next.length - 1)))
      return next
    })
  }

  const clearVideo = () => {
    setVideo(null)
    setStep(1)
  }

  // ── GPS ──────────────────────────────────────────────────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported.'); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const city    = data.address?.city || data.address?.town || data.address?.village || data.address?.county || ''
          const country = data.address?.country || ''
          const place   = city && country ? `${city}, ${country}` : data.display_name?.split(',').slice(0, 2).join(',').trim() || 'Unknown'
          setLocation(place)
          setLocationMode('text')
          toast.success(`📍 Located: ${place}`)
        } catch { toast.error('Could not determine location name') }
        finally { setGpsLoading(false) }
      },
      () => { toast.error('Location access denied'); setGpsLoading(false) },
      { timeout: 10000 }
    )
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    const hasMedia = mediaMode === 'video' ? !!video : images.length > 0
    if (!hasMedia)       { toast.error('Please add a photo or video.'); return }
    if (!caption.trim()) { toast.error('Please add a caption.'); return }
    if (!location)       { toast.error('Please pick a location.'); return }

    setLoading(true)
    try {
      const body = { caption: caption.trim(), location }

      if (mediaMode === 'video') {
        // Upload video to Cloudinary (or keep as base64 if not configured)
        body.video = await uploadToCloudinary(video.src, 'videos')
      } else {
        // Upload all images to Cloudinary in parallel
        const previews    = images.map((img) => img.preview)
        const uploadedUrls = await uploadManyToCloudinary(previews, 'posts')
        body.image  = uploadedUrls[0]
        body.images = uploadedUrls
      }

      const res = await fetch(`${CONTENT_SERVICE}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success('Post shared!')
        navigate('/feed')
      } else {
        const err = await res.json()
        toast.error('Failed to post: ' + (err.message || 'Unknown error'))
      }
    } catch { toast.error('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  const remaining = MAX_CAPTION - caption.length
  const hasMedia  = mediaMode === 'video' ? !!video : images.length > 0

  return (
    <div className="post-container">
      <div className="post-box">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 0', marginBottom: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}
            style={{ padding: '6px 8px', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', flex: 1 }}>
            New Post
          </h1>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[1, 2].map((n) => (
              <div key={n} style={{
                width: n === step ? 20 : 8, height: 8, borderRadius: 99,
                background: n === step ? 'var(--brand-500)' : n < step ? 'var(--brand-300)' : 'var(--neutral-200)',
                transition: 'all 0.3s var(--ease-out)',
              }} />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="post-form">
          {/* ── Step 1: Upload zone ── */}
          {step === 1 && (
            <>
              {/* Media type tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                {[
                  { mode: 'images', label: 'Photos', icon: <ImagePlus size={14} /> },
                  { mode: 'video',  label: 'Video',  icon: <Video size={14} /> },
                ].map(({ mode, label, icon }) => (
                  <button key={mode} type="button"
                    onClick={() => setMediaMode(mode)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px 0', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                      fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
                      fontFamily: 'var(--font-sans)',
                      background: mediaMode === mode ? 'var(--brand-500)' : 'var(--neutral-100)',
                      color:      mediaMode === mode ? 'white' : 'var(--text-secondary)',
                      transition: 'background 0.15s, color 0.15s',
                    }}>
                    {icon} {label}
                  </button>
                ))}
              </div>

              <div
                className={`upload-zone${dragOver ? ' drag-over' : ''}`}
                onClick={() => mediaMode === 'video' ? videoInputRef.current?.click() : fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                role="button" tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && (mediaMode === 'video' ? videoInputRef : fileInputRef).current?.click()}
              >
                <div className="upload-zone-icon">
                  {mediaMode === 'video' ? <Video size={26} /> : <ImagePlus size={26} />}
                </div>
                <div>
                  <p style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', fontSize: 'var(--text-base)', marginBottom: 4 }}>
                    {mediaMode === 'video' ? 'Drop your video here' : 'Drop your photos here'}
                  </p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    {mediaMode === 'video'
                      ? `MP4, MOV, WEBM · max ${MAX_VIDEO_MB} MB`
                      : `Up to ${MAX_IMAGES} photos · JPG, PNG, WEBP · max 10 MB each`}
                  </p>
                </div>
                <button type="button" className="btn btn-secondary btn-sm"
                  onClick={(e) => { e.stopPropagation(); (mediaMode === 'video' ? videoInputRef : fileInputRef).current?.click() }}
                  style={{ marginTop: 4 }}>
                  {mediaMode === 'video' ? 'Choose video' : 'Choose photos'}
                </button>
              </div>
            </>
          )}

          {/* Hidden file inputs */}
          <input ref={fileInputRef}    type="file" accept="image/*"  multiple onChange={handleFileInputChange} style={{ display: 'none' }} />
          <input ref={addMoreInputRef} type="file" accept="image/*"  multiple onChange={handleFileInputChange} style={{ display: 'none' }} />
          <input ref={videoInputRef}   type="file" accept="video/*"          onChange={handleFileInputChange} style={{ display: 'none' }} />

          {/* ── Step 2: Preview + Details ── */}
          {step === 2 && (
            <>
              {/* ── Video preview ── */}
              {mediaMode === 'video' && video && (
                <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000' }}>
                  <video
                    src={video.src}
                    controls
                    playsInline
                    style={{ width: '100%', maxHeight: 320, objectFit: 'contain', display: 'block' }}
                  />
                  <button type="button" onClick={clearVideo}
                    style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 'var(--radius-full)', background: 'rgba(0,0,0,0.55)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} />
                  </button>
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.55)', color: 'white', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 600 }}>
                    VIDEO
                  </div>
                </div>
              )}

              {/* ── Image carousel preview ── */}
              {mediaMode === 'images' && images.length > 0 && (
                <>
                  <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--neutral-100)' }}>
                    <img
                      src={images[activeIdx].preview}
                      alt={`Preview ${activeIdx + 1}`}
                      style={{ width: '100%', maxHeight: 340, objectFit: 'cover', display: 'block', transition: 'opacity 0.2s' }}
                    />
                    {images.length > 1 && (
                      <>
                        <button type="button" onClick={() => setActiveIdx((i) => (i - 1 + images.length) % images.length)}
                          style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: 'var(--radius-full)', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                          <ChevronLeft size={16} />
                        </button>
                        <button type="button" onClick={() => setActiveIdx((i) => (i + 1) % images.length)}
                          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: 'var(--radius-full)', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                          <ChevronRight size={16} />
                        </button>
                        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
                          {images.map((_, i) => (
                            <button key={i} type="button" onClick={() => setActiveIdx(i)}
                              style={{ width: i === activeIdx ? 16 : 6, height: 6, borderRadius: 99, background: i === activeIdx ? 'white' : 'rgba(255,255,255,0.55)', border: 'none', padding: 0, cursor: 'pointer', transition: 'width 0.2s' }} />
                          ))}
                        </div>
                      </>
                    )}
                    <button type="button" onClick={() => removeImage(activeIdx)}
                      style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 'var(--radius-full)', background: 'rgba(0,0,0,0.55)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                      <X size={14} />
                    </button>
                    <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.55)', color: 'white', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                      {activeIdx + 1} / {images.length}
                    </div>
                  </div>

                  {/* Thumbnail strip */}
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 0', scrollbarWidth: 'none' }}>
                    {images.map((img, i) => (
                      <button key={i} type="button" onClick={() => setActiveIdx(i)}
                        style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: i === activeIdx ? '2px solid var(--brand-500)' : '2px solid transparent', padding: 0, cursor: 'pointer', background: 'none', transition: 'border-color 0.15s' }}>
                        <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                    {images.length < MAX_IMAGES && (
                      <button type="button" onClick={() => addMoreInputRef.current?.click()}
                        style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 'var(--radius-sm)', border: '2px dashed var(--border-default)', background: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Caption */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={13} /> Caption
                </label>
                <textarea
                  className="form-input"
                  placeholder="Describe your adventure…"
                  value={caption}
                  maxLength={MAX_CAPTION}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical', minHeight: 80 }}
                />
                <div className="char-counter" style={{ color: remaining < 30 ? 'var(--color-warning)' : 'var(--text-muted)' }}>
                  {remaining} characters remaining
                </div>
              </div>

              {/* Location */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={13} /> Location</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['select', 'text'].map((mode) => (
                      <button key={mode} type="button"
                        onClick={() => { setLocationMode(mode); if (mode === 'select') setLocation('') }}
                        style={{
                          fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                          background: locationMode === mode ? 'var(--brand-500)' : 'var(--neutral-150)',
                          color: locationMode === mode ? 'white' : 'var(--text-secondary)',
                          border: 'none', borderRadius: 'var(--radius-full)', padding: '3px 10px', cursor: 'pointer',
                        }}>
                        {mode === 'select' ? 'Pick' : 'Type'}
                      </button>
                    ))}
                  </div>
                </label>

                {locationMode === 'select' ? (
                  <select className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} required>
                    <option value="">Select a destination…</option>
                    {locations.map((loc, idx) => <option key={idx} value={loc}>{loc}</option>)}
                  </select>
                ) : (
                  <input className="form-input" type="text" placeholder="City, Country…" value={location} onChange={(e) => setLocation(e.target.value)} required />
                )}

                <button type="button" onClick={detectLocation} disabled={gpsLoading}
                  style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1.5px dashed var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', cursor: gpsLoading ? 'wait' : 'pointer', width: '100%', justifyContent: 'center', fontFamily: 'var(--font-sans)', transition: 'border-color 0.2s, color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-400)'; e.currentTarget.style.color = 'var(--brand-600)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                  {gpsLoading
                    ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Detecting…</>
                    : <><LocateFixed size={14} /> Use my current location</>}
                </button>
              </div>

              {/* Submit */}
              <button type="submit" className="btn btn-primary btn-full"
                disabled={loading || !hasMedia || !caption.trim() || !location}
                style={{ height: 52, fontSize: 'var(--text-md)', marginTop: 4 }}>
                {loading
                  ? <><span className="spinner" /> Sharing…</>
                  : mediaMode === 'video'
                    ? 'Share Video'
                    : `Share Post${images.length > 1 ? ` (${images.length} photos)` : ''}`}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

export default Post
