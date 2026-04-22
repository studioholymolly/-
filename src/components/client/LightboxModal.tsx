'use client'

import { useEffect, useCallback } from 'react'
import { PhotoWithUrl } from '@/lib/types'

interface Props {
  photos: PhotoWithUrl[]
  index: number
  isSelected: boolean
  onChangeIndex: (i: number) => void
  onToggleSelect: () => void
  onOpenAnnotate: () => void
  onClose: () => void
}

export default function LightboxModal({
  photos, index, isSelected,
  onChangeIndex, onToggleSelect, onOpenAnnotate, onClose,
}: Props) {
  const photo = photos[index]

  const prev = useCallback(() => onChangeIndex((index - 1 + photos.length) % photos.length), [index, photos.length, onChangeIndex])
  const next = useCallback(() => onChangeIndex((index + 1) % photos.length), [index, photos.length, onChangeIndex])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === ' ') { e.preventDefault(); onToggleSelect() }
    }
    window.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [prev, next, onClose, onToggleSelect])

  if (!photo) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
      zIndex: 200, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      {/* Close */}
      <button onClick={onClose} aria-label="닫기" style={{
        position: 'absolute', top: 16, right: 20,
        background: 'none', border: 'none', color: '#6b6b80',
        fontSize: 26, cursor: 'pointer', lineHeight: 1,
      }}>✕</button>

      {/* Prev */}
      {photos.length > 1 && (
        <button onClick={prev} aria-label="이전" style={{
          position: 'absolute', top: '50%', left: 14, transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.6)', border: '1px solid #c4c4cc', color: '#0a0a0c',
          padding: '12px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 22, lineHeight: 1,
        }}>‹</button>
      )}

      <img
        src={photo.signedUrl}
        alt={photo.filename}
        style={{ maxWidth: '90vw', maxHeight: '78vh', objectFit: 'contain', borderRadius: 8 }}
      />

      {/* Next */}
      {photos.length > 1 && (
        <button onClick={next} aria-label="다음" style={{
          position: 'absolute', top: '50%', right: 14, transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.6)', border: '1px solid #c4c4cc', color: '#0a0a0c',
          padding: '12px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 22, lineHeight: 1,
        }}>›</button>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={onToggleSelect}
          style={{
            background: isSelected ? 'rgba(7,26,15,0.9)' : '#f3f3f5',
            border: `1px solid ${isSelected ? '#22c55e' : '#c4c4cc'}`,
            color: isSelected ? '#22c55e' : '#0a0a0c',
            padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 700,
          }}
        >
          {isSelected ? '✓ 선택됨 (해제)' : '☐ 선택'}
        </button>
        <button onClick={onOpenAnnotate} style={{
          background: '#f3f3f5', border: '1px solid #c4c4cc', color: '#0a0a0c',
          padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
        }}>📍 주석 추가</button>
        <button onClick={onClose} style={{
          background: '#f3f3f5', border: '1px solid #c4c4cc', color: '#0a0a0c',
          padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
        }}>닫기</button>
      </div>

      <div style={{ color: '#6b6b80', fontSize: 12, marginTop: 10 }}>
        {String(index + 1).padStart(3, '0')} · {index + 1}/{photos.length}
      </div>
    </div>
  )
}
