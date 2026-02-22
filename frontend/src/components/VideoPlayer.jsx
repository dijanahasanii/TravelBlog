/**
 * VideoPlayer — inline HTML5 video with tap-to-play and mute toggle
 *
 * Props:
 *   src     – video URL, base64 data URI, or blob URL
 *   poster  – optional thumbnail image
 *   onClick – optional callback when tapped (e.g., navigate to detail)
 */
import React, { useRef, useState, useEffect } from 'react'
import { Play, Volume2, VolumeX } from 'lucide-react'

export default function VideoPlayer({ src, poster, onClick }) {
  const videoRef  = useRef(null)
  const blobRef   = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [muted,   setMuted]   = useState(true)
  const [blobUrl, setBlobUrl] = useState(null)
  const [error,   setError]   = useState(false)

  // Convert base64 data URIs to Blob URLs so the browser can stream them.
  // Regular https:// URLs are passed through as-is.
  useEffect(() => {
    if (!src) return
    setError(false)
    setPlaying(false)

    if (src.startsWith('data:video')) {
      fetch(src)
        .then((r) => r.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob)
          blobRef.current = url
          setBlobUrl(url)
        })
        .catch(() => setError(true))
    } else {
      setBlobUrl(src)
    }

    return () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current)
        blobRef.current = null
      }
    }
  }, [src])

  if (!src) return null
  if (error) return (
    <div style={{ background: '#111', color: '#aaa', textAlign: 'center', padding: '32px 16px', fontSize: 13 }}>
      Video unavailable
    </div>
  )

  const togglePlay = (e) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => {})
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  if (!blobUrl) return (
    <div style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
      <span className="spinner" style={{ width: 24, height: 24, borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'white' }} />
    </div>
  )

  return (
    <div
      style={{ position: 'relative', background: '#000', cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <video
        ref={videoRef}
        src={blobUrl}
        poster={poster}
        muted
        playsInline
        loop
        preload="metadata"
        style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setError(true)}
      />

      {/* Play/Pause overlay */}
      {!playing && (
        <button
          onClick={togglePlay}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
            width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)',
          }}
        >
          <Play size={22} fill="white" />
        </button>
      )}

      {/* Tap-to-pause when playing */}
      {playing && (
        <div
          onClick={togglePlay}
          style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
        />
      )}

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        style={{
          position: 'absolute', bottom: 10, right: 10,
          background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)', zIndex: 3,
        }}
      >
        {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>

      {/* Video badge */}
      <div style={{
        position: 'absolute', top: 8, left: 8,
        background: 'rgba(0,0,0,0.5)', color: 'white',
        padding: '2px 7px', borderRadius: 99, fontSize: 11, fontWeight: 600,
        backdropFilter: 'blur(4px)', zIndex: 3,
      }}>
        VIDEO
      </div>
    </div>
  )
}
