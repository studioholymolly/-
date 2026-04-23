'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { PhotoWithUrl, RetouchedPhotoWithUrl } from '@/lib/types'

interface Props {
  photos: Array<PhotoWithUrl | RetouchedPhotoWithUrl>
  index: number
  isSelected: boolean
  onChangeIndex: (i: number) => void
  onToggleSelect: () => void
  onOpenAnnotate: () => void
  onClose: () => void
}

const ZOOM_MIN = 1
const ZOOM_MAX = 4
const ZOOM_STEP = 0.5

export default function LightboxModal({
  photos, index, isSelected,
  onChangeIndex, onToggleSelect, onOpenAnnotate, onClose,
}: Props) {
  const photo = photos[index]

  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)

  function resetZoom() { setZoom(1); setOffset({ x: 0, y: 0 }) }

  const prev = useCallback(() => { resetZoom(); onChangeIndex((index - 1 + photos.length) % photos.length) }, [index, photos.length, onChangeIndex])
  const next = useCallback(() => { resetZoom(); onChangeIndex((index + 1) % photos.length) }, [index, photos.length, onChangeIndex])

  function zoomIn() { setZoom(z => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2))) }
  function zoomOut() {
    setZoom(z => {
      const n = Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2))
      if (n === 1) setOffset({ x: 0, y: 0 })
      return n
    })
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === ' ') { e.preventDefault(); onToggleSelect() }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn() }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomOut() }
      else if (e.key === '0') { e.preventDefault(); resetZoom() }
    }
    window.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [prev, next, onClose, onToggleSelect])

  // Reset zoom whenever photo changes
  useEffect(() => { resetZoom() }, [photo?.id])

  // Pan (drag) when zoomed in
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y }
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setOffset({ x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy })
  }
  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null
    ;(e.currentTarget as HTMLDivElement).releasePointerCapture?.(e.pointerId)
  }

  if (!photo) return null

  const canZoomIn = zoom < ZOOM_MAX
  const canZoomOut = zoom > ZOOM_MIN

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
          zIndex: 3,
        }}>‹</button>
      )}

      {/* Image area — supports click-to-zoom, drag-to-pan when zoomed in */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          maxWidth: '90vw', maxHeight: '78vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          cursor: zoom > 1 ? (dragRef.current ? 'grabbing' : 'grab') : 'zoom-in',
          touchAction: zoom > 1 ? 'none' : 'auto',
        }}
        onClick={(e) => {
          // Click to zoom when not already zoomed (and not dragging)
          if (zoom === 1 && !dragRef.current) {
            e.stopPropagation()
            zoomIn()
          }
        }}
      >
        <img
          src={photo.signedUrl}
          alt={photo.filename}
          draggable={false}
          style={{
            maxWidth: '90vw', maxHeight: '78vh', objectFit: 'contain', borderRadius: 8,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: dragRef.current ? 'none' : 'transform 0.15s ease-out',
            userSelect: 'none',
            willChange: 'transform',
          }}
        />
      </div>

      {/* Next */}
      {photos.length > 1 && (
        <button onClick={next} aria-label="다음" style={{
          position: 'absolute', top: '50%', right: 14, transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.6)', border: '1px solid #c4c4cc', color: '#0a0a0c',
          padding: '12px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 22, lineHeight: 1,
          zIndex: 3,
        }}>›</button>
      )}

      {/* Zoom controls */}
      <div style={{
        display: 'flex', gap: 6, marginTop: 16, alignItems: 'center',
        background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '4px 6px',
        border: '1px solid rgba(255,255,255,0.15)',
      }}>
        <button
          onClick={zoomOut}
          disabled={!canZoomOut}
          aria-label="축소"
          title="축소 ( − )"
          style={{
            width: 34, height: 34, borderRadius: 7,
            background: canZoomOut ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: 'none', color: canZoomOut ? '#fff' : '#6b6b80',
            cursor: canZoomOut ? 'pointer' : 'not-allowed',
            fontSize: 18, fontWeight: 700, lineHeight: 1,
          }}
        >−</button>
        <button
          onClick={resetZoom}
          aria-label="원래 크기로"
          title="원래 크기 ( 0 )"
          style={{
            minWidth: 54, height: 34, padding: '0 8px', borderRadius: 7,
            background: 'transparent', border: 'none',
            color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}
        >🔍 {Math.round(zoom * 100)}%</button>
        <button
          onClick={zoomIn}
          disabled={!canZoomIn}
          aria-label="확대"
          title="확대 ( + )"
          style={{
            width: 34, height: 34, borderRadius: 7,
            background: canZoomIn ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: 'none', color: canZoomIn ? '#fff' : '#6b6b80',
            cursor: canZoomIn ? 'pointer' : 'not-allowed',
            fontSize: 18, fontWeight: 700, lineHeight: 1,
          }}
        >＋</button>
      </div>

      {/* Action controls */}
      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
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
