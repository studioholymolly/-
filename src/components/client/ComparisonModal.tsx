'use client'

import { useEffect } from 'react'

type ComparePhoto = { id: string; signedUrl: string; filename: string }

export default function ComparisonModal({
  photos, onClose, onRemove,
}: {
  photos: ComparePhoto[]
  onClose: () => void
  onRemove: (photoId: string) => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  const cols = photos.length === 1 ? 1 : photos.length === 2 ? 2 : photos.length === 3 ? 3 : 2
  const rows = photos.length <= 3 ? 1 : 2

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
        zIndex: 230, display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', color: '#fff',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>
          🔀 사진 비교 ({photos.length}장)
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          aria-label="닫기"
          style={{
            background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
            width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer', lineHeight: 1,
          }}
        >✕</button>
      </div>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          flex: 1, display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: 8, padding: '0 16px 16px',
          minHeight: 0,
        }}
      >
        {photos.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'relative', minHeight: 0,
              background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <img
              src={p.signedUrl}
              alt={p.filename}
              draggable={false}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none' }}
            />
            <div style={{
              position: 'absolute', bottom: 6, left: 8,
              fontSize: 11, color: 'rgba(255,255,255,0.7)',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{p.filename}</div>
            <button
              onClick={() => onRemove(p.id)}
              aria-label="비교에서 제외"
              title="비교에서 제외"
              style={{
                position: 'absolute', top: 6, right: 6,
                background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff',
                width: 28, height: 28, borderRadius: '50%', fontSize: 14, cursor: 'pointer', lineHeight: 1,
              }}
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
