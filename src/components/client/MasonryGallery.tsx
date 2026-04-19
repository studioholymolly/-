'use client'

import { PhotoWithUrl, AnnotationPin } from '@/lib/types'

interface Props {
  photos: PhotoWithUrl[]
  selections: Set<string>
  annotations: Record<string, AnnotationPin[]>
  onToggle: (photoId: string) => void
  onAnnotate: (photo: PhotoWithUrl) => void
}

export default function MasonryGallery({ photos, selections, annotations, onToggle, onAnnotate }: Props) {
  return (
    <div style={{ padding: '20px 16px 140px', maxWidth: 1400, margin: '0 auto' }}>
      <style>{`
        .photo-col { columns: 4; column-gap: 10px; }
        @media(max-width:1100px) { .photo-col { columns: 3; } }
        @media(max-width:750px) { .photo-col { columns: 2; } }
        @media(max-width:420px) { .photo-col { columns: 1; } }
      `}</style>
      <div className="photo-col">
        {photos.map((photo, idx) => {
          const isSelected = selections.has(photo.id)
          const pins = annotations[photo.id] || []
          const hasAnnotations = pins.length > 0

          return (
            <div
              key={photo.id}
              style={{
                breakInside: 'avoid',
                marginBottom: 10,
                borderRadius: 12,
                overflow: 'visible',
                position: 'relative',
                background: '#111115',
                border: `2.5px solid ${isSelected ? '#22c55e' : hasAnnotations ? 'rgba(239,68,68,0.5)' : 'transparent'}`,
                transition: 'border-color 0.15s, transform 0.15s',
                transform: 'translateY(0)',
                cursor: 'pointer',
              }}
              onClick={() => onToggle(photo.id)}
            >
              <div style={{ borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                <img
                  src={photo.signedUrl}
                  alt={photo.filename}
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}>
                  {/* Checkmark circle */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: isSelected ? '#22c55e' : 'rgba(0,0,0,0.55)',
                    border: `2px solid ${isSelected ? '#22c55e' : 'rgba(255,255,255,0.5)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                  }}>
                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>✓</span>
                  </div>
                </div>
                {/* Selected badge */}
                {isSelected && (
                  <div style={{ position: 'absolute', top: 7, right: 7, background: '#22c55e', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 9 }}>
                    선택됨
                  </div>
                )}
                {/* Annotation badge */}
                {hasAnnotations && (
                  <div style={{ position: 'absolute', top: 7, left: 7, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 9 }}>
                    메모 {pins.length}
                  </div>
                )}
                {/* Photo number */}
                <div style={{ position: 'absolute', bottom: 7, left: 8, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                  #{idx + 1}
                </div>
              </div>

              {/* Annotate button */}
              <div style={{ padding: '6px 8px' }}>
                <button
                  onClick={e => { e.stopPropagation(); onAnnotate(photo) }}
                  style={{
                    width: '100%', padding: '5px 0',
                    background: hasAnnotations ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${hasAnnotations ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 6, color: hasAnnotations ? '#ef4444' : '#7070a0',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {hasAnnotations ? `📍 수정 메모 ${pins.length}개` : '📍 수정 메모 추가'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
