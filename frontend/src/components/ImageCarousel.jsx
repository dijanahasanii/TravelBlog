/**
 * ImageCarousel — swipeable/clickable multi-image carousel for posts
 *
 * Props:
 *   images  – string[] of image URLs (falls back to [image] if only one provided)
 *   alt     – alt text base
 *   onClick – optional: called when image is clicked (e.g., navigate to post detail)
 */
import React, { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ImageCarousel({ images = [], alt = 'Travel', onClick }) {
  const [idx, setIdx]    = useState(0)
  const touchStart       = useRef(null)

  if (!images.length) return null

  const prev = (e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length) }
  const next = (e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length) }

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX }
  const handleTouchEnd   = (e) => {
    if (touchStart.current === null) return
    const delta = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 40) {
      setIdx((i) => delta > 0 ? (i + 1) % images.length : (i - 1 + images.length) % images.length)
    }
    touchStart.current = null
  }

  const multi = images.length > 1

  return (
    <div
      style={{ position: 'relative', overflow: 'hidden', userSelect: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <img
        src={images[idx]}
        alt={`${alt} ${idx + 1}`}
        className="post-card-image"
        loading="lazy"
        style={{ display: 'block', cursor: onClick ? 'pointer' : 'default', transition: 'opacity 0.15s' }}
        onClick={onClick}
        onError={(e) => {
          e.target.onerror = null
          e.target.src = `https://picsum.photos/seed/${idx}/700/520`
        }}
      />

      {multi && (
        <>
          {/* Prev / Next */}
          <button
            onClick={prev}
            style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%',
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)', zIndex: 2,
            }}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={next}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%',
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)', zIndex: 2,
            }}
          >
            <ChevronRight size={15} />
          </button>

          {/* Dot indicators */}
          <div style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 4, zIndex: 2,
          }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i) }}
                style={{
                  width: i === idx ? 14 : 6, height: 6, borderRadius: 99, padding: 0, border: 'none',
                  background: i === idx ? 'white' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', transition: 'width 0.2s',
                }}
              />
            ))}
          </div>

          {/* Count badge */}
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.5)', color: 'white',
            padding: '2px 7px', borderRadius: 99,
            fontSize: 11, fontWeight: 600, backdropFilter: 'blur(4px)', zIndex: 2,
          }}>
            {idx + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  )
}
