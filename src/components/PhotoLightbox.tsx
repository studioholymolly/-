'use client'

import { useEffect, useCallback } from 'react'

interface LightboxPhoto {
  signedUrl: string
  filename: string
}

interface Props {
  photos: LightboxPhoto[]
  index: number | null
  onClose: () => void
  onChange: (nextIndex: number) => void
}

export default function PhotoLightbox({ photos, index, onClose, onChange }: Props) {
  const prev = useCallback(() => {
    if (index === null) return
    onChange((index - 1 + photos.length) % photos.length)
  }, [index, photos.length, onChange])

  const next = useCallback(() => {
    if (index === null) return
    onChange((index + 1) % photos.length)
  }, [index, photos.length, onChange])

  useEffect(() => {
    if (index === null) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handleKey)
    // Prevent body scroll while open
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [index, onClose, prev, next])

  if (index === null) return null
  const photo = photos[index]
  if (!photo) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'zoom-out',
      }}
    >
      {/* Close button */}
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        aria-label="닫기"
        style={{
          position: 'absolute', top: 20, right: 20,
          background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
          width: 42, height: 42, borderRadius: '50%',
          fontSize: 20, cursor: 'pointer', lineHeight: 1,
        }}
      >✕</button>

      {/* Counter */}
      <div style={{
        position: 'absolute', top: 24, left: 24,
        color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600,
      }}>{index + 1} / {photos.length}</div>

      {/* Prev */}
      {photos.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); prev() }}
          aria-label="이전"
          style={{
            position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
            width: 48, height: 48, borderRadius: '50%',
            fontSize: 22, cursor: 'pointer', lineHeight: 1,
          }}
        >‹</button>
      )}

      {/* Image */}
      <img
        src={photo.signedUrl}
        alt={photo.filename}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '92vw', maxHeight: '88vh',
          objectFit: 'contain', cursor: 'default',
          borderRadius: 6,
        }}
      />

      {/* Next */}
      {photos.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); next() }}
          aria-label="다음"
          style={{
            position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
            width: 48, height: 48, borderRadius: '50%',
            fontSize: 22, cursor: 'pointer', lineHeight: 1,
          }}
        >›</button>
      )}

      {/* Filename */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.6)', fontSize: 12,
        background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: 20,
        maxWidth: '80vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{photo.filename}</div>
    </div>
  )
}
