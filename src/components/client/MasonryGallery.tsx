'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { PhotoWithUrl, RetouchedPhotoWithUrl, AnnotationPin } from '@/lib/types'

interface Props {
  photos: Array<PhotoWithUrl | RetouchedPhotoWithUrl>
  selections: Set<string>
  annotations: Record<string, AnnotationPin[]>
  comments: Record<string, string>
  onToggle: (photoId: string) => void
  onCommentChange: (photoId: string, value: string) => void
  onOpenLightbox: (index: number) => void
  onOpenAnnotate: (index: number) => void
  viewOnly?: boolean
  favorites?: Set<string>
  onToggleFavorite?: (photoId: string) => void
}

export default function MasonryGallery({
  photos, selections, annotations, comments,
  onToggle, onCommentChange, onOpenLightbox, onOpenAnnotate,
  viewOnly = false,
  favorites,
  onToggleFavorite,
}: Props) {
  return (
    <div style={{ padding: '20px 16px 140px', maxWidth: 1500, margin: '0 auto' }}>
      <style>{`
        .photo-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 1100px) { .photo-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 750px)  { .photo-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 450px)  { .photo-grid { grid-template-columns: 1fr; } }

        .pc {
          border-radius: 12px; overflow: hidden;
          background: #fafafa; border: 2.5px solid transparent;
          transition: border-color .15s, transform .25s ease, box-shadow .25s ease;
          position: relative;
          display: flex; flex-direction: column;
        }
        .pc:hover { box-shadow: 0 10px 30px rgba(0,0,0,.4); }
        .pc.sel { border-color: #22c55e; }
        .pc.has-ann { outline: 2px solid rgba(239,68,68,.4); outline-offset: 1px; }

        /* IMAGE WRAPPER — uniform aspect ratio so every thumbnail is the exact same size */
        .pc-img-wrap {
          position: relative;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          cursor: zoom-in;
        }
        .pc-img-wrap img {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
          transform: scale(1.0);
          transition: transform .35s ease;
          will-change: transform;
          pointer-events: none;
          user-select: none;
        }
        /* Zoom the image slightly on hover so the pan/drag effect has headroom */
        .pc-img-wrap:hover img { transform: scale(1.12); }

        /* Overlay used for: click → lightbox, hover darkening */
        .ov {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0);
          transition: background .2s;
          display: flex; align-items: center; justify-content: center;
          cursor: zoom-in;
        }
        .pc-img-wrap:hover .ov { background: rgba(0,0,0,.22); }

        /* Check circle — its own clickable button for toggling selection */
        .cc {
          width: 42px; height: 42px; border-radius: 50%;
          background: rgba(0,0,0,.55); border: 2px solid rgba(255,255,255,.6);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: all .2s; backdrop-filter: blur(4px);
          color: #fff; font-weight: 900; font-size: 18px;
          cursor: pointer;
          position: relative; z-index: 3;
        }
        .pc-img-wrap:hover .cc, .pc.sel .cc { opacity: 1; }
        .pc.sel .cc { background: #22c55e; border-color: #22c55e; }

        .sb {
          position: absolute; top: 8px; right: 8px; z-index: 2;
          background: #22c55e; color: #fff;
          font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: 10px;
          opacity: 0; transform: scale(.8); transition: all .15s;
          pointer-events: none;
        }
        .pc.sel .sb { opacity: 1; transform: scale(1); }

        .pn {
          position: absolute; bottom: 8px; left: 10px; z-index: 2;
          font-size: 10px; font-weight: 700;
          color: rgba(255,255,255,.7); text-shadow: 0 1px 2px rgba(0,0,0,.8);
          pointer-events: none;
        }

        .ann-badge {
          position: absolute; top: 8px; left: 8px; z-index: 2;
          background: #ef4444; color: #fff;
          font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: 10px;
          pointer-events: none;
        }

        .heart {
          position: absolute; top: 8px; right: 8px; z-index: 3;
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(0,0,0,0.45);
          border: none; color: rgba(255,255,255,0.85);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; line-height: 1; cursor: pointer;
          backdrop-filter: blur(4px);
          opacity: 0.55; transition: opacity .15s, transform .15s, background .15s, color .15s;
        }
        .pc:hover .heart { opacity: 1; }
        .heart:hover { transform: scale(1.1); }
        .heart.on {
          background: rgba(239,68,68,0.95); color: #fff; opacity: 1;
        }

        .pc-btns { display: flex; border-top: 1px solid #e0e0e5; flex-shrink: 0; }
        .pc-btn {
          flex: 1; background: none; border: none; color: #6b6b80;
          padding: 10px 6px; font-size: 11.5px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 4px;
          transition: all .15s;
        }
        .pc-btn:hover { background: #f3f3f5; color: #0a0a0c; }
        .pc-btn.ann-on { color: #ef4444; }
        .pc-btn + .pc-btn { border-left: 1px solid #e0e0e5; }

        .cmtbox {
          display: none;
          padding: 10px; background: #f3f3f5; border-top: 1px solid #e0e0e5;
        }
        .pc.sel .cmtbox { display: block; }
        .cmtbox textarea {
          width: 100%; background: #ebebef; border: 1px solid #c4c4cc;
          color: #0a0a0c; border-radius: 6px; padding: 8px 10px;
          font-size: 12px; font-family: inherit; resize: vertical; min-height: 56px;
          outline: none; line-height: 1.5;
        }
        .cmtbox textarea:focus { border-color: #22c55e; }
        .cmtbox textarea::placeholder { color: #8a8a95; }
      `}</style>
      <div className="photo-grid">
        {photos.map((photo, idx) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            idx={idx}
            isSelected={selections.has(photo.id)}
            isFavorited={favorites?.has(photo.id) ?? false}
            pins={annotations[photo.id] || []}
            comment={comments[photo.id] || ''}
            onToggle={() => onToggle(photo.id)}
            onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(photo.id) : undefined}
            onCommentChange={(v) => onCommentChange(photo.id, v)}
            onOpenLightbox={() => onOpenLightbox(idx)}
            onOpenAnnotate={() => onOpenAnnotate(idx)}
            viewOnly={viewOnly}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Photo card:
 *  - Uniform aspect ratio thumbnail (3:4 portrait), same size for every photo.
 *  - The image is scaled up slightly on hover, and the INNER image pans toward the cursor
 *    so moving/dragging the mouse over the card produces a "follow the cursor" effect.
 *  - Click anywhere on the image itself → lightbox (크게 보기).
 *  - Click the check circle (✓) → toggle selection. (stopPropagation so it doesn't open lightbox.)
 */
function PhotoCard({
  photo, idx, isSelected, isFavorited, pins, comment,
  onToggle, onToggleFavorite, onCommentChange, onOpenLightbox, onOpenAnnotate,
  viewOnly,
}: {
  photo: PhotoWithUrl | RetouchedPhotoWithUrl
  idx: number
  isSelected: boolean
  isFavorited: boolean
  pins: AnnotationPin[]
  comment: string
  onToggle: () => void
  onToggleFavorite?: () => void
  onCommentChange: (v: string) => void
  onOpenLightbox: () => void
  onOpenAnnotate: () => void
  viewOnly: boolean
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const hasAnnotations = pins.length > 0

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const img = imgRef.current
    if (!img) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    // Normalized cursor position inside the wrapper, centered (-0.5..0.5)
    const nx = (e.clientX - rect.left) / rect.width - 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5
    // The image is scaled to 1.12x, so it overflows by ~6% on each side → we have ~6% of
    // range to drag it. Translate inversely so the photo moves toward the cursor.
    const tx = (-nx * 22).toFixed(2)
    const ty = (-ny * 22).toFixed(2)
    img.style.transform = `scale(1.12) translate(${tx}px, ${ty}px)`
  }

  function handleLeave() {
    const img = imgRef.current
    if (!img) return
    img.style.transform = ''
  }

  return (
    <div className={`pc${isSelected ? ' sel' : ''}${hasAnnotations ? ' has-ann' : ''}`}>
      <div className="pc-img-wrap" onMouseMove={handleMove} onMouseLeave={handleLeave}>
        <Image
          ref={imgRef}
          src={photo.signedUrl}
          alt={photo.filename}
          fill
          sizes="(max-width: 450px) 100vw, (max-width: 750px) 50vw, (max-width: 1100px) 33vw, 25vw"
          style={{ objectFit: 'cover' }}
        />
        {/* Overlay: clicking anywhere on the image opens the lightbox */}
        <div className="ov" onClick={onOpenLightbox} role="button" aria-label={`${idx + 1}번 사진 크게 보기`}>
          {!viewOnly && (
            <button
              type="button"
              className="cc"
              onClick={e => { e.stopPropagation(); onToggle() }}
              aria-label={isSelected ? '선택 해제' : '선택'}
            >✓</button>
          )}
        </div>
        {!viewOnly && <div className="sb">✓ 선택</div>}
        {hasAnnotations && <div className="ann-badge">📍 {pins.length}개</div>}
        {!viewOnly && onToggleFavorite && (
          <button
            type="button"
            className={`heart${isFavorited ? ' on' : ''}`}
            onClick={e => { e.stopPropagation(); onToggleFavorite() }}
            aria-label={isFavorited ? '찜 해제' : '찜하기'}
            title={isFavorited ? '찜 해제 (F)' : '찜하기 (F)'}
          >
            {isFavorited ? '♥' : '♡'}
          </button>
        )}
        <div className="pn">#{String(idx + 1).padStart(3, '0')}</div>
      </div>
      <div className="pc-btns">
        <button type="button" className="pc-btn" onClick={onOpenLightbox}>
          🔍 크게 보기
        </button>
        {!viewOnly && (
          <button type="button" className={`pc-btn${hasAnnotations ? ' ann-on' : ''}`} onClick={onOpenAnnotate}>
            📍 {hasAnnotations ? '주석 수정' : '주석 추가'}
          </button>
        )}
      </div>
      {!viewOnly && (
        <div className="cmtbox">
          <textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="전체 코멘트 (선택 이유, 보정 방향 등)..."
            rows={2}
          />
        </div>
      )}
    </div>
  )
}
