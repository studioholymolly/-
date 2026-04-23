'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Project, PhotoWithUrl, RetouchedPhotoWithUrl, AnnotationPin } from '@/lib/types'
import { submitNoRevision } from '@/lib/actions/selections'
import { STUDIO_NAME } from '@/lib/brand'
import MasonryGallery from './MasonryGallery'
import BottomBar from './BottomBar'
import AnnotationModal from './AnnotationModal'
import LightboxModal from './LightboxModal'
import SubmitModal from './SubmitModal'
import RevisionSubmitModal from './RevisionSubmitModal'

interface Props {
  project: Project
  photos: PhotoWithUrl[]
  retouchedPhotos: RetouchedPhotoWithUrl[]
  shareToken: string
  initialSelectedIds?: string[]
  initialAnnotations?: Record<string, AnnotationPin[]>
  initialComments?: Record<string, string>
  initialRevisionSelectedIds?: string[]
  initialRevisionAnnotations?: Record<string, AnnotationPin[]>
  initialRevisionComments?: Record<string, string>
  submissionCount?: number
}

export default function ClientGallery({
  project, photos, retouchedPhotos, shareToken,
  initialSelectedIds = [], initialAnnotations = {}, initialComments = {},
  initialRevisionSelectedIds = [], initialRevisionAnnotations = {}, initialRevisionComments = {},
  submissionCount = 0,
}: Props) {
  const [selections, setSelections] = useState<Set<string>>(new Set(initialSelectedIds))
  const [annotations, setAnnotations] = useState<Record<string, AnnotationPin[]>>(initialAnnotations)
  const [comments, setComments] = useState<Record<string, string>>(initialComments)
  // Lightbox ("크게 보기") state — main gallery + retouched tab
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [retouchedLightboxIndex, setRetouchedLightboxIndex] = useState<number | null>(null)
  // Annotation modal is a separate overlay, opened by its own button
  const [annotatingIndex, setAnnotatingIndex] = useState<number | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submittedKind, setSubmittedKind] = useState<'selection' | 'revision' | null>(null)
  const [activeTab, setActiveTab] = useState<'original' | 'retouched'>('original')

  // Revision (보정본 검토) state — used when status === 'client_reviewing'
  const [revisionMode, setRevisionMode] = useState<'view' | 'editing'>('view')
  const [revSelections, setRevSelections] = useState<Set<string>>(new Set(initialRevisionSelectedIds))
  const [revAnnotations, setRevAnnotations] = useState<Record<string, AnnotationPin[]>>(initialRevisionAnnotations)
  const [revComments, setRevComments] = useState<Record<string, string>>(initialRevisionComments)
  const [revLightboxIndex, setRevLightboxIndex] = useState<number | null>(null)
  const [revAnnotatingIndex, setRevAnnotatingIndex] = useState<number | null>(null)
  const [showRevSubmitModal, setShowRevSubmitModal] = useState(false)
  const [showNoRevConfirm, setShowNoRevConfirm] = useState(false)
  const [showDriveLinkPopup, setShowDriveLinkPopup] = useState(false)
  const [showRevSubmittedPopup, setShowRevSubmittedPopup] = useState(false)
  const [noRevLoading, setNoRevLoading] = useState(false)
  const [noRevError, setNoRevError] = useState('')

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

  // ---- Revision-mode handlers ----
  function toggleRevSelection(photoId: string) {
    setRevSelections(prev => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else next.add(photoId)
      return next
    })
  }
  function saveRevAnnotations(photoId: string, pins: AnnotationPin[]) {
    setRevAnnotations(prev => ({ ...prev, [photoId]: pins }))
    setRevAnnotatingIndex(null)
    // Auto-select the photo if pins were added and it wasn't already selected
    if (pins.length > 0) {
      setRevSelections(prev => {
        if (prev.has(photoId)) return prev
        const next = new Set(prev)
        next.add(photoId)
        return next
      })
    }
  }
  function handleRevCommentChange(photoId: string, value: string) {
    setRevComments(prev => ({ ...prev, [photoId]: value }))
  }
  function selectAllRev() {
    setRevSelections(new Set(retouchedPhotos.map(p => p.id)))
  }
  function clearAllRev() {
    setRevSelections(new Set())
  }

  async function handleConfirmNoRevision() {
    setNoRevLoading(true)
    setNoRevError('')
    try {
      const result = await submitNoRevision(shareToken)
      if (result.error) {
        setNoRevError(result.error)
        setNoRevLoading(false)
      } else {
        setShowNoRevConfirm(false)
        setShowDriveLinkPopup(true)
        setNoRevLoading(false)
      }
    } catch {
      setNoRevError('오류가 발생했습니다. 다시 시도해 주세요.')
      setNoRevLoading(false)
    }
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
                📁 드라이브에서 다운로드
              </a>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#8a8a95', marginTop: 20 }}>감사합니다 — {STUDIO_NAME}</p>
        </div>
      </div>
    )
  }

  // NOTE: `selection_done` intentionally falls through to the main gallery so the client can
  // review + re-submit. The "재제출 가능" banner is rendered inside the main return below.

  // NOTE: `studio_editing` also falls through to the main gallery so the client can still
  // review/adjust their submitted selection until retouched photos are released
  // (`client_reviewing`). A warning banner in the header informs them retouching is in progress.

  // Submitted success screen — full-page takeover for initial selection only.
  // Revision submissions use a dismissable popup instead (see showRevSubmittedPopup).
  if (submittedKind === 'selection') {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0c' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>셀렉이 완료되었습니다!</h2>
          <p style={{ fontSize: 14, color: '#6b6b80', lineHeight: 1.7 }}>
            선택한 사진과 메모를 스튜디오에 전달했습니다.<br/>보정이 완료되면 다시 이 페이지를 방문해 주세요.
          </p>
        </div>
      </div>
    )
  }

  // Client reviewing — revision selection mode (수정 있음 → editing)
  if (project.status === 'client_reviewing' && revisionMode === 'editing' && !project.revision_used) {
    const totalRevPins = Object.values(revAnnotations).reduce((s, pins) => s + pins.length, 0)
    const allSelected = revSelections.size === retouchedPhotos.length && retouchedPhotos.length > 0
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', color: '#0a0a0c' }}>
        {/* Header */}
        <div style={{ padding: '32px 24px 20px', borderBottom: '1px solid #e0e0e5', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#6b6b80', textTransform: 'uppercase', marginBottom: 8 }}>{STUDIO_NAME}</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>수정이 필요한 사진 선택</h1>
          <p style={{ fontSize: 13, color: '#6b6b80', marginBottom: 12 }}>수정이 필요한 보정본을 선택하고, 원하는 수정 방향을 주석(핀)과 코멘트로 남겨주세요.</p>
          <div style={{ display: 'inline-flex', gap: 20, background: '#fafafa', border: '1px solid #e0e0e5', borderRadius: 12, padding: '10px 20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: '#6b6b80' }}>전체 <b style={{ color: '#0a0a0c' }}>{retouchedPhotos.length}장</b></span>
            <span style={{ fontSize: 12, color: '#6b6b80' }}>수정 요청 <b style={{ color: '#ef4444' }}>{revSelections.size}장</b></span>
            {totalRevPins > 0 && <span style={{ fontSize: 12, color: '#6b6b80' }}>핀 메모 <b style={{ color: '#ef4444' }}>{totalRevPins}개</b></span>}
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setRevisionMode('view')} style={{
              background: '#f3f3f5', border: '1px solid #e0e0e5', color: '#0a0a0c',
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>← 검토 화면으로</button>
            <button type="button" onClick={allSelected ? clearAllRev : selectAllRev} style={{
              background: allSelected ? '#f3f3f5' : 'linear-gradient(135deg,#dc2626,#ef4444)',
              border: allSelected ? '1px solid #e0e0e5' : 'none',
              color: allSelected ? '#0a0a0c' : '#fff',
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>{allSelected ? '전체 선택 해제' : '✓ 전체 선택'}</button>
          </div>
        </div>

        {/* Selection gallery on retouched photos (reuses MasonryGallery) */}
        <MasonryGallery
          photos={retouchedPhotos}
          selections={revSelections}
          annotations={revAnnotations}
          comments={revComments}
          onToggle={toggleRevSelection}
          onCommentChange={handleRevCommentChange}
          onOpenLightbox={(i) => setRevLightboxIndex(i)}
          onOpenAnnotate={(i) => setRevAnnotatingIndex(i)}
        />

        {/* Bottom submit bar */}
        <BottomBar
          totalCount={retouchedPhotos.length}
          selectedCount={revSelections.size}
          isResubmit={false}
          onSubmit={() => setShowRevSubmitModal(true)}
        />

        {/* Lightbox */}
        {revLightboxIndex !== null && retouchedPhotos[revLightboxIndex] && (
          <LightboxModal
            photos={retouchedPhotos}
            index={revLightboxIndex}
            isSelected={revSelections.has(retouchedPhotos[revLightboxIndex].id)}
            onChangeIndex={setRevLightboxIndex}
            onToggleSelect={() => toggleRevSelection(retouchedPhotos[revLightboxIndex].id)}
            onOpenAnnotate={() => { const i = revLightboxIndex; setRevLightboxIndex(null); setRevAnnotatingIndex(i) }}
            onClose={() => setRevLightboxIndex(null)}
          />
        )}

        {/* Annotation modal */}
        {revAnnotatingIndex !== null && retouchedPhotos[revAnnotatingIndex] && (
          <AnnotationModal
            photo={retouchedPhotos[revAnnotatingIndex]}
            initialPins={revAnnotations[retouchedPhotos[revAnnotatingIndex].id] || []}
            onSave={(pins) => saveRevAnnotations(retouchedPhotos[revAnnotatingIndex].id, pins)}
            onClose={() => setRevAnnotatingIndex(null)}
          />
        )}

        {/* Submit modal */}
        {showRevSubmitModal && (
          <RevisionSubmitModal
            photos={retouchedPhotos}
            selectedIds={revSelections}
            annotations={revAnnotations}
            comments={revComments}
            shareToken={shareToken}
            onClose={() => setShowRevSubmitModal(false)}
            onSuccess={() => {
              setShowRevSubmitModal(false)
              setRevisionMode('view')
              setShowRevSubmittedPopup(true)
            }}
          />
        )}
      </div>
    )
  }

  // Client reviewing (retouched photos available) — view mode with 수정 없음 / 수정 있음 buttons
  if (project.status === 'client_reviewing') {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', color: '#0a0a0c' }}>
        {/* Header */}
        <div style={{ padding: '32px 24px 20px', borderBottom: '1px solid #e0e0e5', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#6b6b80', textTransform: 'uppercase', marginBottom: 8 }}>{STUDIO_NAME}</div>
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
                {!project.revision_used ? (
                  <div style={{
                    background: '#fafafa', border: '1px solid #e0e0e5', borderRadius: 14,
                    padding: 24, maxWidth: 560, margin: '0 auto', textAlign: 'center',
                  }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>보정본 검토를 마쳐 주세요</h3>
                    <p style={{ fontSize: 13, color: '#6b6b80', marginBottom: 18, lineHeight: 1.7 }}>
                      모든 보정본이 마음에 드시면 &quot;수정 없음&quot;을, 수정이 필요한 사진이 있으면 &quot;수정 있음&quot;을 눌러 주세요.<br/>
                      <b style={{ color: '#ef4444' }}>수정 요청은 1회만 가능합니다.</b>
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setShowNoRevConfirm(true)}
                        style={{
                          background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff',
                          border: 'none', padding: '13px 26px', borderRadius: 10,
                          fontSize: 14, fontWeight: 700, cursor: 'pointer', minWidth: 160,
                        }}
                      >✅ 수정 없음 — 완료</button>
                      <button
                        type="button"
                        onClick={() => setRevisionMode('editing')}
                        style={{
                          background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff',
                          border: 'none', padding: '13px 26px', borderRadius: 10,
                          fontSize: 14, fontWeight: 700, cursor: 'pointer', minWidth: 160,
                        }}
                      >✏️ 수정 있음 — 선택</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 20, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10 }}>
                    <p style={{ fontSize: 13, color: '#d97706' }}>수정 요청을 이미 보내셨습니다. 스튜디오에서 확인 후 업데이트됩니다.</p>
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

        {/* "수정 없음" 확인 팝업 */}
        {showNoRevConfirm && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}>
            <div style={{
              background: '#ffffff', border: '1px solid #e0e0e5', borderRadius: 16,
              width: '100%', maxWidth: 420, padding: 24,
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>수정 없이 완료할까요?</h3>
              <p style={{ fontSize: 13, color: '#6b6b80', marginBottom: 18, lineHeight: 1.7 }}>
                확인을 누르면 작업이 완료되고, 최종 파일을 다운로드할 수 있는 드라이브 링크가 표시됩니다. 이후에는 수정 요청을 보낼 수 없습니다.
              </p>
              {noRevError && (
                <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 7, fontSize: 12, color: '#ef4444' }}>
                  {noRevError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowNoRevConfirm(false)} disabled={noRevLoading} style={{
                  flex: 1, padding: '11px', background: '#f3f3f5',
                  border: '1px solid #e0e0e5', color: '#0a0a0c',
                  borderRadius: 8, fontSize: 14, cursor: 'pointer',
                }}>취소</button>
                <button onClick={handleConfirmNoRevision} disabled={noRevLoading} style={{
                  flex: 2, padding: '11px',
                  background: noRevLoading ? '#9ca3af' : 'linear-gradient(135deg,#16a34a,#22c55e)',
                  border: 'none', color: '#fff',
                  borderRadius: 8, fontSize: 14, fontWeight: 700,
                  cursor: noRevLoading ? 'not-allowed' : 'pointer',
                }}>
                  {noRevLoading ? '처리 중...' : '확인 — 완료'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drive link popup — shown after 수정 없음 confirmation */}
        {showDriveLinkPopup && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
            zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}>
            <div style={{
              background: '#ffffff', border: '1px solid #e0e0e5', borderRadius: 16,
              width: '100%', maxWidth: 460, padding: 28, textAlign: 'center',
            }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>작업이 완료되었습니다!</h3>
              <p style={{ fontSize: 13, color: '#6b6b80', marginBottom: 22, lineHeight: 1.7 }}>
                아래 드라이브 링크에서 최종 파일을 다운로드해 주세요.
              </p>
              {project.drive_link ? (
                <a
                  href={project.drive_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                    color: '#fff', padding: '13px 26px',
                    borderRadius: 10, fontSize: 14, fontWeight: 700,
                    textDecoration: 'none', marginBottom: 16,
                  }}
                >📁 드라이브에서 다운로드</a>
              ) : (
                <p style={{ fontSize: 13, color: '#d97706', marginBottom: 16 }}>
                  다운로드 링크가 아직 준비되지 않았습니다. 스튜디오에서 곧 업로드해 드려요.
                </p>
              )}
              <br/>
              <button onClick={() => setShowDriveLinkPopup(false)} style={{
                background: '#f3f3f5', border: '1px solid #e0e0e5', color: '#0a0a0c',
                padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}>닫기</button>
            </div>
          </div>
        )}

        {/* Revision submission success popup */}
        {showRevSubmittedPopup && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 260, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}>
            <div style={{
              background: '#ffffff', border: '1px solid #e0e0e5', borderRadius: 16,
              width: '100%', maxWidth: 420, padding: 28, textAlign: 'center',
            }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>수정 요청 보내기 완료!</h3>
              <p style={{ fontSize: 13, color: '#6b6b80', marginBottom: 22, lineHeight: 1.7 }}>
                수정 요청한 내용을 스튜디오에 전달했습니다.<br/>수정이 완료되면 다시 연락드릴게요.
              </p>
              <button
                onClick={() => { setShowRevSubmittedPopup(false); window.location.reload() }}
                style={{
                  background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff',
                  border: 'none', padding: '11px 30px', borderRadius: 8,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >확인</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Main: selecting
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#0a0a0c' }}>
      {/* Header */}
      <div style={{ padding: '32px 24px 20px', borderBottom: '1px solid #e0e0e5', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#6b6b80', textTransform: 'uppercase', marginBottom: 8 }}>{STUDIO_NAME}</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>{project.name}</h1>
        <p style={{ fontSize: 13, color: '#6b6b80', marginBottom: 12 }}>{project.client_name}</p>
        <div style={{ display: 'inline-flex', gap: 20, background: '#fafafa', border: '1px solid #e0e0e5', borderRadius: 12, padding: '10px 20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b6b80' }}>전체 <b style={{ color: '#0a0a0c' }}>{photos.length}장</b></span>
          <span style={{ fontSize: 12, color: '#6b6b80' }}>선택 <b style={{ color: '#22c55e' }}>{selections.size}장</b></span>
          {totalPins > 0 && <span style={{ fontSize: 12, color: '#6b6b80' }}>수정 메모 <b style={{ color: '#ef4444' }}>{totalPins}개</b></span>}
          {project.deadline && <span style={{ fontSize: 12, color: '#f59e0b' }}>보정 마감 {new Date(project.deadline).toLocaleDateString('ko-KR')}</span>}
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
          comments={comments}
          shareToken={shareToken}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => { setShowSubmitModal(false); setSubmittedKind('selection') }}
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

/** Minimal view-only lightbox for the review step (with zoom controls). */
function SimpleLightbox({ photos, index, onChange, onClose }: {
  photos: { signedUrl: string; filename: string }[]
  index: number
  onChange: (i: number) => void
  onClose: () => void
}) {
  const photo = photos[index]
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const ZOOM_MIN = 1, ZOOM_MAX = 4, ZOOM_STEP = 0.5

  const reset = useCallback(() => { setZoom(1); setOffset({ x: 0, y: 0 }) }, [])
  const zoomIn = useCallback(() => setZoom(z => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2))), [])
  const zoomOut = useCallback(() => setZoom(z => {
    const n = Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2))
    if (n === 1) setOffset({ x: 0, y: 0 })
    return n
  }), [])

  useEffect(() => { reset() }, [photo?.signedUrl, reset])

  useClientLightboxKeys({
    onClose,
    onPrev: useCallback(() => { reset(); onChange((index - 1 + photos.length) % photos.length) }, [index, photos.length, onChange, reset]),
    onNext: useCallback(() => { reset(); onChange((index + 1) % photos.length) }, [index, photos.length, onChange, reset]),
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onReset: reset,
  })

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) return
    e.stopPropagation()
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
    <div
      onClick={(e) => { if (zoom === 1) onClose(); else e.stopPropagation() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.94)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: zoom === 1 ? 'zoom-out' : 'default',
      }}
    >
      <button onClick={e => { e.stopPropagation(); onClose() }} aria-label="닫기" style={{
        position: 'absolute', top: 20, right: 20,
        background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
        width: 42, height: 42, borderRadius: '50%', fontSize: 20, cursor: 'pointer', lineHeight: 1,
        zIndex: 3,
      }}>✕</button>
      <div style={{ position: 'absolute', top: 24, left: 24, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>{index + 1} / {photos.length}</div>

      {photos.length > 1 && (
        <button onClick={e => { e.stopPropagation(); reset(); onChange((index - 1 + photos.length) % photos.length) }} aria-label="이전" style={{
          position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
          width: 48, height: 48, borderRadius: '50%', fontSize: 22, cursor: 'pointer', lineHeight: 1,
          zIndex: 3,
        }}>‹</button>
      )}

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={e => {
          e.stopPropagation()
          if (zoom === 1 && !dragRef.current) zoomIn()
        }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          maxWidth: '92vw', maxHeight: '88vh', overflow: 'hidden',
          cursor: zoom > 1 ? (dragRef.current ? 'grabbing' : 'grab') : 'zoom-in',
          touchAction: zoom > 1 ? 'none' : 'auto',
        }}
      >
        <img
          src={photo.signedUrl}
          alt={photo.filename}
          draggable={false}
          style={{
            maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 6,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: dragRef.current ? 'none' : 'transform 0.15s ease-out',
            userSelect: 'none', willChange: 'transform',
          }}
        />
      </div>

      {photos.length > 1 && (
        <button onClick={e => { e.stopPropagation(); reset(); onChange((index + 1) % photos.length) }} aria-label="다음" style={{
          position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
          width: 48, height: 48, borderRadius: '50%', fontSize: 22, cursor: 'pointer', lineHeight: 1,
          zIndex: 3,
        }}>›</button>
      )}

      {/* Zoom controls */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 6, alignItems: 'center',
          background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '4px 6px',
          border: '1px solid rgba(255,255,255,0.18)',
          zIndex: 3,
        }}
      >
        <button onClick={zoomOut} disabled={!canZoomOut} aria-label="축소" title="축소 ( − )" style={{
          width: 34, height: 34, borderRadius: 7,
          background: canZoomOut ? 'rgba(255,255,255,0.12)' : 'transparent',
          border: 'none', color: canZoomOut ? '#fff' : '#6b6b80',
          cursor: canZoomOut ? 'pointer' : 'not-allowed',
          fontSize: 18, fontWeight: 700, lineHeight: 1,
        }}>−</button>
        <button onClick={reset} aria-label="원래 크기로" title="원래 크기 ( 0 )" style={{
          minWidth: 54, height: 34, padding: '0 8px', borderRadius: 7,
          background: 'transparent', border: 'none',
          color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
        }}>🔍 {Math.round(zoom * 100)}%</button>
        <button onClick={zoomIn} disabled={!canZoomIn} aria-label="확대" title="확대 ( + )" style={{
          width: 34, height: 34, borderRadius: 7,
          background: canZoomIn ? 'rgba(255,255,255,0.12)' : 'transparent',
          border: 'none', color: canZoomIn ? '#fff' : '#6b6b80',
          cursor: canZoomIn ? 'pointer' : 'not-allowed',
          fontSize: 18, fontWeight: 700, lineHeight: 1,
        }}>＋</button>
      </div>
    </div>
  )
}

function useClientLightboxKeys({ onClose, onPrev, onNext, onZoomIn, onZoomOut, onReset }: {
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onReset?: () => void
}) {
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev()
      else if (e.key === 'ArrowRight') onNext()
      else if ((e.key === '+' || e.key === '=') && onZoomIn) { e.preventDefault(); onZoomIn() }
      else if ((e.key === '-' || e.key === '_') && onZoomOut) { e.preventDefault(); onZoomOut() }
      else if (e.key === '0' && onReset) { e.preventDefault(); onReset() }
    }
    window.addEventListener('keydown', handle)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handle)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, onPrev, onNext, onZoomIn, onZoomOut, onReset])
}
