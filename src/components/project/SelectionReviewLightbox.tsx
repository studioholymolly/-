'use client'

import { useEffect, useCallback } from 'react'
import { PhotoWithUrl, Annotation } from '@/lib/types'

interface Props {
  photos: PhotoWithUrl[]
  annotationsByPhoto: Record<string, Annotation[]>
  commentsByPhoto: Record<string, string>
  index: number
  onChange: (i: number) => void
  onClose: () => void
}

/**
 * Read-only lightbox for the studio side to review a selected photo
 * at full resolution with the client's pins + comments overlaid accurately.
 */
export default function SelectionReviewLightbox({
  photos, annotationsByPhoto, commentsByPhoto, index, onChange, onClose,
}: Props) {
  const photo = photos[index]
  const anns = photo ? (annotationsByPhoto[photo.id] || []) : []
  const sortedAnns = [...anns].sort((a, b) => a.pin_number - b.pin_number)
  const photoComment = photo ? (commentsByPhoto[photo.id] || '').trim() : ''

  const prev = useCallback(() => onChange((index - 1 + photos.length) % photos.length), [index, photos.length, onChange])
  const next = useCallback(() => onChange((index + 1) % photos.length), [index, photos.length, onChange])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [prev, next, onClose])

  if (!photo) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)',
      zIndex: 300, display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: '1px solid #c4c4cc',
        background: '#fafafa', flexShrink: 0,
      }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {photo.filename}
          </h3>
          <p style={{ fontSize: 11, color: '#6b6b80', marginTop: 2 }}>
            {index + 1} / {photos.length} · 클라이언트가 남긴 수정 메모 {anns.length}개
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: '1px solid #c4c4cc', color: '#6b6b80',
          padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
        }}>닫기</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Prev */}
        {photos.length > 1 && (
          <button onClick={prev} aria-label="이전" style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 20,
            background: 'rgba(0,0,0,0.55)', border: '1px solid #c4c4cc', color: '#fff',
            width: 46, height: 46, borderRadius: '50%', fontSize: 22, cursor: 'pointer', lineHeight: 1,
          }}>‹</button>
        )}
        {/* Next — positioned to the left of the right panel */}
        {photos.length > 1 && (
          <button onClick={next} aria-label="다음" style={{
            position: 'absolute', right: 334, top: '50%', transform: 'translateY(-50%)', zIndex: 20,
            background: 'rgba(0,0,0,0.55)', border: '1px solid #c4c4cc', color: '#fff',
            width: 46, height: 46, borderRadius: '50%', fontSize: 22, cursor: 'pointer', lineHeight: 1,
          }}>›</button>
        )}

        {/* Image area */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'auto', padding: 20, background: '#000',
        }}>
          <div style={{
            position: 'relative', display: 'inline-block',
            maxWidth: '100%', maxHeight: 'calc(100vh - 100px)',
          }}>
            <img
              src={photo.signedUrl}
              alt={photo.filename}
              style={{
                display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 100px)',
                objectFit: 'contain', userSelect: 'none',
              }}
            />
            {/* Pin overlays — client's x_pct / y_pct are relative to the displayed image area
                (which matches this inline-block wrapper), so positioning is accurate. */}
            {sortedAnns.map(ann => (
              <div key={ann.id} style={{
                position: 'absolute',
                left: `${ann.x_pct}%`, top: `${ann.y_pct}%`,
                transform: 'translate(-50%, -50%)',
                width: 30, height: 30, borderRadius: '50%',
                background: '#ef4444', color: '#fff',
                border: '3px solid rgba(255,255,255,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900,
                boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
                pointerEvents: 'none',
              }}>{ann.pin_number}</div>
            ))}
          </div>
        </div>

        {/* Right panel: read-only comment list */}
        <div style={{
          width: 320, background: '#fafafa', borderLeft: '1px solid #c4c4cc',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e0e0e5' }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0a0a0c' }}>📝 수정 요청 목록 ({anns.length}개)</h4>
            <p style={{ fontSize: 11, color: '#6b6b80', marginTop: 3 }}>클라이언트가 남긴 내용입니다</p>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {photoComment && (
              <div style={{
                marginBottom: 14, padding: 12,
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.35)',
                borderRadius: 8,
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  💬 전체 코멘트
                </div>
                <div style={{
                  fontSize: 12.5, color: '#0a0a0c', lineHeight: 1.55,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {photoComment}
                </div>
              </div>
            )}
            {sortedAnns.length === 0 && !photoComment && (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#8a8a95', fontSize: 12, lineHeight: 1.7 }}>
                수정 요청이 없습니다
              </div>
            )}
            {sortedAnns.length === 0 && photoComment && (
              <div style={{ fontSize: 11, color: '#8a8a95', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
                핀으로 표시된 수정 요청은 없습니다
              </div>
            )}
            {sortedAnns.map(ann => (
              <div key={ann.id} style={{
                marginBottom: 10, padding: 10,
                background: '#f3f3f5', border: '1px solid #e0e0e5',
                borderRadius: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#ef4444', color: '#fff',
                    fontSize: 11, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{ann.pin_number}</div>
                  <span style={{ fontSize: 11, color: '#6b6b80' }}>
                    위치 {ann.x_pct.toFixed(1)}%, {ann.y_pct.toFixed(1)}%
                  </span>
                </div>
                <div style={{
                  fontSize: 12.5, color: '#0a0a0c', lineHeight: 1.55,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  padding: '6px 2px',
                }}>
                  {ann.comment?.trim() || <span style={{ color: '#8a8a95', fontStyle: 'italic' }}>(메모 내용 없음)</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
