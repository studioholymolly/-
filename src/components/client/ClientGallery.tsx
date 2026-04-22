'use client'

import { useState, useEffect } from 'react'
import { Project, PhotoWithUrl, RetouchedPhotoWithUrl, AnnotationPin } from '@/lib/types'
import MasonryGallery from './MasonryGallery'
import BottomBar from './BottomBar'
import AnnotationModal from './AnnotationModal'
import LightboxModal from './LightboxModal'
import SubmitModal from './SubmitModal'
import RevisionForm from './RevisionForm'

interface Props {
  project: Project
  photos: PhotoWithUrl[]
  retouchedPhotos: RetouchedPhotoWithUrl[]
  shareToken: string
  initialSelectedIds?: string[]
  initialAnnotations?: Record<string, AnnotationPin[]>
  submissionCount?: number
}

export default function ClientGallery({
  project, photos, retouchedPhotos, shareToken,
  initialSelectedIds = [], initialAnnotations = {}, submissionCount = 0,
}: Props) {
  const [selections, setSelections] = useState<Set<string>>(new Set(initialSelectedIds))
  const [annotations, setAnnotations] = useState<Record<string, AnnotationPin[]>>(initialAnnotations)
  const [comments, setComments] = useState<Record<string, string>>({})
  // Lightbox ("크게 보기") state — main gallery + retouched tab
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [retouchedLightboxIndex, setRetouchedLightboxIndex] = useState<number | null>(null)
  // Annotation modal is a separate overlay, opened by its own button
  const [annotatingIndex, setAnnotatingIndex] = useState<number | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [activeTab, setActiveTab] = useState<'original' | 'retouched'>('original')

  function toggleSelection(photoId: string) {
    setSelections(prev => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else next.add(photoId)
      return next
    })
  }

  function saveAnnotations(photoId: string, pins: AnnotationPin[]) {
    setAnnotations(prev => ({ ...prev, [photoId]: pins }))
    setAnnotatingIndex(null)
  }

  function handleCommentChange(photoId: string, value: string) {
    setComments(prev => ({ ...prev, [photoId]: value }))
  }

  const totalPins = Object.values(annotations).reduce((s, pins) => s + pins.length, 0)

  // Draft: not yet opened for selecting
  if (project.status === 'draft') {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0c' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>아직 준비 중입니다</h2>
          <p style={{ fontSize: 13, color: '#6b6b80' }}>스튜디오에서 사진을 준비하고 있습니다. 잠시 후 다시 방문해 주세요.</p>
        </div>
      </div>
    )
  }

  // Completed
  if (project.status === 'completed') {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0c' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>작업이 완료되었습니다!</h2>
          <p style={{ fontSize: 14, color: '#6b6b80', marginBottom: 28, lineHeight: 1.7 }}>
            모든 보정이 완료되었습니다. 아래 구글 드라이브 링크에서 최종 결과물을 다운로드해 주세요.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            {project.drive_link_originals && (
              <a
                href={project.drive_link_originals}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                  color: '#fff', padding: '13px 26px',
                  borderRadius: 10, fontSize: 14, fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                📁 원본 다운로드
              </a>
            )}
            {project.drive_link && (
              <a
                href={project.drive_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                  color: '#fff', padding: '13px 26px',
                  borderRadius: 10, fontSize: 14, fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                📁 보정본 다운로드
              </a>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#8a8a95', marginTop: 20 }}>감사합니다 — 스튜디오 홀리몰리</p>
        </div>
      </div>
    )
  }

  // NOTE: `selection_done` intentionally falls through to the main gallery so the client can
  // review + re-submit. The "재제출 가능" banner is rendered inside the main return below.

  // NOTE: `studio_editing` also falls through to the main gallery so the client can still
  // review/adjust their submitted selection until retouched photos are released
  // (`client_reviewing`). A warning banner in the header informs them retouching is in progress.

  // Submitted success screen
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0c' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>셀렉이 완료되었습니다!</h2>
          <p style={{ fontSize: 14, color: '#6b6b80', lineHeight: 1.7 }}>
            선택한 사진과 메모를 스튜디오에 전달했습니다.<br/>
            보정이 완료되면 다시 이 페이지를 방문해 주세요.
          </p>
        </div>
      </div>
    )
  }

  // Client reviewing (retouched photos available)
  if (project.status === 'client_reviewing') {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', color: '#0a0a0c' }}>
        {/* Header */}
        <div style={{ padding: '32px 24px 20px', borderBottom: '1px solid #e0e0e5', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#6b6b80', textTransform: 'uppercase', marginBottom: 8 }}>스튜디오 홀리몰리</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{project.name}</h1>
          <p style={{ fontSize: 13, color: '#6b6b80' }}>{project.client_name}</p>
          <div style={{ marginTop: 12, display: 'inline-flex', background: 'rgba(22,163,74,0.08)', border: '1px solid #16a34a', borderRadius: 20, padding: '4px 14px' }}>
            <span style={{ fontSize: 12, color: '#15803d', fontWeight: 700 }}>✅ 보정 완료 — 확인해 주세요</span>
          </div>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0', borderBottom: '1px solid #e0e0e5', gap: 0 }}>
          {(['original', 'retouched'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '8px 24px', fontSize: 13, fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === t ? '#a78bfa' : '#6b6b80',
              borderBottom: activeTab === t ? '2px solid #7c3aed' : '2px solid transparent',
            }}>
              {t === 'original' ? `원본 (${photos.length})` : `보정본 (${retouchedPhotos.length})`}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 16px 40px', maxWidth: 1200, margin: '0 auto' }}>
          {activeTab === 'original' && (
            <ReviewGrid photos={photos} onOpen={(i) => setLightboxIndex(i)} />
          )}
          {activeTab === 'retouched' && (
            <div>
              <ReviewGrid photos={retouchedPhotos} onOpen={(i) => setRetouchedLightboxIndex(i)} />
              <div style={{ marginTop: 32 }}>
                {!project.revision_used && <RevisionForm shareToken={shareToken} />}
                {project.revision_used && (
                  <div style={{ textAlign: 'center', padding: 20, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10 }}>
                    <p style={{ fontSize: 13, color: '#fcd34d' }}>수정 요청을 이미 보내셨습니다. 스튜디오에서 확인 후 업데이트됩니다.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* View-only lightbox for original tab */}
        {lightboxIndex !== null && (
          <SimpleLightbox photos={photos} index={lightboxIndex} onChange={setLightboxIndex} onClose={() => setLightboxIndex(null)} />
        )}
        {/* View-only lightbox for retouched tab */}
        {retouchedLightboxIndex !== null && (
          <SimpleLightbox photos={retouchedPhotos} index={retouchedLightboxIndex} onChange={setRetouchedLightboxIndex} onClose={() => setRetouchedLightboxIndex(null)} />
        )}
      </div>
    )
  }

  // Main: selecting
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#0a0a0c' }}>
      {/* Header */}
      <div style={{ padding: '32px 24px 20px', borderBottom: '1px solid #e0e0e5', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#6b6b80', textTransform: 'uppercase', marginBottom: 8 }}>스튜디오 홀리몰리</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>{project.name}</h1>
        <p style={{ fontSize: 13, color: '#6b6b80', marginBottom: 12 }}>{project.client_name}</p>
        <div style={{ display: 'inline-flex', gap: 20, background: '#fafafa', border: '1px solid #e0e0e5', borderRadius: 12, padding: '10px 20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b6b80' }}>전체 <b style={{ color: '#0a0a0c' }}>{photos.length}장</b></span>
          <span style={{ fontSize: 12, color: '#6b6b80' }}>선택 <b style={{ color: '#22c55e' }}>{selections.size}장</b></span>
          {totalPins > 0 && <span style={{ fontSize: 12, color: '#6b6b80' }}>수정 메모 <b style={{ color: '#ef4444' }}>{totalPins}개</b></span>}
          {project.deadline && <span style={{ fontSize: 12, color: '#f59e0b' }}>마감 {new Date(project.deadline).toLocaleDateString('ko-KR')}</span>}
        </div>
        {project.custom_message && (
          <p style={{ maxWidth: 560, margin: '12px auto 0', fontSize: 13, color: '#6b6b80', lineHeight: 1.7 }}>{project.custom_message}</p>
        )}
        {project.status === 'selection_done' && (
          <div style={{
            display: 'inline-block', marginTop: 14,
            background: 'rgba(34,197,94,0.09)', border: '1px solid rgba(34,197,94,0.35)',
            borderRadius: 20, padding: '7px 16px',
            fontSize: 12, color: '#4ade80', fontWeight: 600,
          }}>
            ✓ 이미 제출된 셀렉입니다{submissionCount > 0 ? ` (${submissionCount}회 제출)` : ''} — 변경 후 다시 제출하실 수 있습니다
          </div>
        )}
        {project.status === 'studio_editing' && (
          <div style={{
            display: 'inline-block', marginTop: 14,
            background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.4)',
            borderRadius: 20, padding: '7px 16px',
            fontSize: 12, color: '#fbbf24', fontWeight: 600,
          }}>
            ⚠️ 스튜디오에서 보정 작업 중입니다 — 신중히 변경해 주세요. 변경 후 다시 제출하면 작업에 반영됩니다
          </div>
        )}
      </div>

      {/* Gallery */}
      <MasonryGallery
        photos={photos}
        selections={selections}
        annotations={annotations}
        comments={comments}
        onToggle={toggleSelection}
        onCommentChange={handleCommentChange}
        onOpenLightbox={(i) => setLightboxIndex(i)}
        onOpenAnnotate={(i) => setAnnotatingIndex(i)}
      />

      {/* Bottom bar */}
      <BottomBar
        totalCount={photos.length}
        selectedCount={selections.size}
        isResubmit={project.status === 'selection_done' || submissionCount > 0}
        onSubmit={() => setShowSubmitModal(true)}
      />

      {/* Lightbox (크게 보기) */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <LightboxModal
          photos={photos}
          index={lightboxIndex}
          isSelected={selections.has(photos[lightboxIndex].id)}
          onChangeIndex={setLightboxIndex}
          onToggleSelect={() => toggleSelection(photos[lightboxIndex].id)}
          onOpenAnnotate={() => { const i = lightboxIndex; setLightboxIndex(null); setAnnotatingIndex(i) }}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Annotation modal */}
      {annotatingIndex !== null && photos[annotatingIndex] && (
        <AnnotationModal
          photo={photos[annotatingIndex]}
          initialPins={annotations[photos[annotatingIndex].id] || []}
          onSave={(pins) => saveAnnotations(photos[annotatingIndex].id, pins)}
          onClose={() => setAnnotatingIndex(null)}
        />
      )}

      {/* Submit modal */}
      {showSubmitModal && (
        <SubmitModal
          photos={photos}
          selectedIds={selections}
          annotations={annotations}
          shareToken={shareToken}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => { setShowSubmitModal(false); setSubmitted(true) }}
        />
      )}
    </div>
  )
}

/** Uniform-grid review gallery used in the `client_reviewing` state (view-only, no select). */
function ReviewGrid({ photos, onOpen }: { photos: { id: string; signedUrl: string; filename: string }[]; onOpen: (i: number) => void }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: 10,
    }}>
      {photos.map((p, i) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onOpen(i)}
          style={{
            all: 'unset',
            aspectRatio: '1 / 1',
            borderRadius: 10, overflow: 'hidden',
            background: '#fafafa', border: '1px solid #e0e0e5',
            cursor: 'zoom-in', display: 'block',
          }}
          aria-label={`${i + 1}번 사진 자세히 보기`}
        >
          <img src={p.signedUrl} alt={p.filename} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </button>
      ))}
    </div>
  )
}

/** Minimal view-only lightbox for the review step. */
function SimpleLightbox({ photos, index, onChange, onClose }: {
  photos: { signedUrl: string; filename: string }[]
  index: number
  onChange: (i: number) => void
  onClose: () => void
}) {
  const photo = photos[index]

  // keyboard + body scroll lock
  useClientLightboxKeys({ onClose, onPrev: () => onChange((index - 1 + photos.length) % photos.length), onNext: () => onChange((index + 1) % photos.length) })

  if (!photo) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.94)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'zoom-out',
      }}
    >
      <button onClick={e => { e.stopPropagation(); onClose() }} aria-label="닫기" style={{
        position: 'absolute', top: 20, right: 20,
        background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
        width: 42, height: 42, borderRadius: '50%', fontSize: 20, cursor: 'pointer', lineHeight: 1,
      }}>✕</button>
      <div style={{ position: 'absolute', top: 24, left: 24, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>{index + 1} / {photos.length}</div>
      {photos.length > 1 && (
        <button onClick={e => { e.stopPropagation(); onChange((index - 1 + photos.length) % photos.length) }} aria-label="이전" style={{
          position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
          width: 48, height: 48, borderRadius: '50%', fontSize: 22, cursor: 'pointer', lineHeight: 1,
        }}>‹</button>
      )}
      <img src={photo.signedUrl} alt={photo.filename} onClick={e => e.stopPropagation()} style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', cursor: 'default', borderRadius: 6 }} />
      {photos.length > 1 && (
        <button onClick={e => { e.stopPropagation(); onChange((index + 1) % photos.length) }} aria-label="다음" style={{
          position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
          width: 48, height: 48, borderRadius: '50%', fontSize: 22, cursor: 'pointer', lineHeight: 1,
        }}>›</button>
      )}
    </div>
  )
}

function useClientLightboxKeys({ onClose, onPrev, onNext }: { onClose: () => void; onPrev: () => void; onNext: () => void }) {
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev()
      else if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handle)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handle)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, onPrev, onNext])
}
