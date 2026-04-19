'use client'

import { useState } from 'react'
import { Project, PhotoWithUrl, RetouchedPhotoWithUrl, AnnotationPin } from '@/lib/types'
import MasonryGallery from './MasonryGallery'
import BottomBar from './BottomBar'
import AnnotationModal from './AnnotationModal'
import SubmitModal from './SubmitModal'
import RevisionForm from './RevisionForm'

interface Props {
  project: Project
  photos: PhotoWithUrl[]
  retouchedPhotos: RetouchedPhotoWithUrl[]
  shareToken: string
}

export default function ClientGallery({ project, photos, retouchedPhotos, shareToken }: Props) {
  const [selections, setSelections] = useState<Set<string>>(new Set())
  const [annotations, setAnnotations] = useState<Record<string, AnnotationPin[]>>({})
  const [annotatingPhoto, setAnnotatingPhoto] = useState<PhotoWithUrl | null>(null)
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

  function openAnnotation(photo: PhotoWithUrl) {
    setAnnotatingPhoto(photo)
  }

  function saveAnnotations(photoId: string, pins: AnnotationPin[]) {
    setAnnotations(prev => ({ ...prev, [photoId]: pins }))
    setAnnotatingPhoto(null)
  }

  const totalPins = Object.values(annotations).reduce((s, pins) => s + pins.length, 0)

  // Draft: not yet opened for selecting
  if (project.status === 'draft') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0f0f4' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>아직 준비 중입니다</h2>
          <p style={{ fontSize: 13, color: '#7070a0' }}>스튜디오에서 사진을 준비하고 있습니다. 잠시 후 다시 방문해 주세요.</p>
        </div>
      </div>
    )
  }

  // Completed
  if (project.status === 'completed') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0f0f4' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>작업이 완료되었습니다!</h2>
          <p style={{ fontSize: 14, color: '#7070a0', marginBottom: 28, lineHeight: 1.7 }}>
            모든 보정이 완료되었습니다. 아래 구글 드라이브 링크에서 최종 결과물을 다운로드해 주세요.
          </p>
          {project.drive_link && (
            <a
              href={project.drive_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                color: '#fff', padding: '14px 28px',
                borderRadius: 10, fontSize: 15, fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              📁 구글 드라이브에서 다운로드
            </a>
          )}
          <p style={{ fontSize: 12, color: '#50505a', marginTop: 20 }}>감사합니다 — 스튜디오 홀리몰리</p>
        </div>
      </div>
    )
  }

  // Studio editing (waiting for retouch)
  if (project.status === 'studio_editing') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0f0f4' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>보정 작업 중입니다</h2>
          <p style={{ fontSize: 13, color: '#7070a0', lineHeight: 1.7 }}>셀렉이 완료되었습니다.<br/>스튜디오에서 보정 작업을 진행 중입니다. 완료되면 알려드리겠습니다.</p>
        </div>
      </div>
    )
  }

  // Submitted success screen
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0f0f4' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>셀렉이 완료되었습니다!</h2>
          <p style={{ fontSize: 14, color: '#7070a0', lineHeight: 1.7 }}>
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
      <div style={{ minHeight: '100vh', background: '#0a0a0c', color: '#f0f0f4' }}>
        {/* Header */}
        <div style={{ padding: '32px 24px 20px', borderBottom: '1px solid #28282e', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#7070a0', textTransform: 'uppercase', marginBottom: 8 }}>스튜디오 홀리몰리</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{project.name}</h1>
          <p style={{ fontSize: 13, color: '#7070a0' }}>{project.client_name}</p>
          <div style={{ marginTop: 12, display: 'inline-flex', background: 'rgba(20,83,45,0.4)', border: '1px solid #16a34a', borderRadius: 20, padding: '4px 14px' }}>
            <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 700 }}>✅ 보정 완료 — 확인해 주세요</span>
          </div>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0', borderBottom: '1px solid #28282e', gap: 0 }}>
          {(['original', 'retouched'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '8px 24px', fontSize: 13, fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === t ? '#a78bfa' : '#7070a0',
              borderBottom: activeTab === t ? '2px solid #7c3aed' : '2px solid transparent',
            }}>
              {t === 'original' ? `원본 (${photos.length})` : `보정본 (${retouchedPhotos.length})`}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 16px 40px', maxWidth: 1200, margin: '0 auto' }}>
          {activeTab === 'original' && (
            <div style={{ columns: 4, columnGap: 10 }}>
              {photos.map(p => (
                <div key={p.id} style={{ breakInside: 'avoid', marginBottom: 10, borderRadius: 10, overflow: 'hidden' }}>
                  <img src={p.signedUrl} alt={p.filename} style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
              ))}
            </div>
          )}
          {activeTab === 'retouched' && (
            <div>
              <div style={{ columns: 4, columnGap: 10, marginBottom: 32 }}>
                {retouchedPhotos.map(p => (
                  <div key={p.id} style={{ breakInside: 'avoid', marginBottom: 10, borderRadius: 10, overflow: 'hidden' }}>
                    <img src={p.signedUrl} alt={p.filename} style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                ))}
              </div>
              {!project.revision_used && (
                <RevisionForm shareToken={shareToken} />
              )}
              {project.revision_used && (
                <div style={{ textAlign: 'center', padding: 20, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10 }}>
                  <p style={{ fontSize: 13, color: '#fcd34d' }}>수정 요청을 이미 보내셨습니다. 스튜디오에서 확인 후 업데이트됩니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Main: selecting
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', color: '#f0f0f4' }}>
      {/* Header */}
      <div style={{ padding: '32px 24px 20px', borderBottom: '1px solid #28282e', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#7070a0', textTransform: 'uppercase', marginBottom: 8 }}>스튜디오 홀리몰리</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>{project.name}</h1>
        <p style={{ fontSize: 13, color: '#7070a0', marginBottom: 12 }}>{project.client_name}</p>
        <div style={{ display: 'inline-flex', gap: 20, background: '#111115', border: '1px solid #28282e', borderRadius: 12, padding: '10px 20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: '#7070a0' }}>전체 <b style={{ color: '#f0f0f4' }}>{photos.length}장</b></span>
          <span style={{ fontSize: 12, color: '#7070a0' }}>선택 <b style={{ color: '#22c55e' }}>{selections.size}장</b></span>
          {totalPins > 0 && <span style={{ fontSize: 12, color: '#7070a0' }}>수정 메모 <b style={{ color: '#ef4444' }}>{totalPins}개</b></span>}
          {project.deadline && <span style={{ fontSize: 12, color: '#f59e0b' }}>마감 {new Date(project.deadline).toLocaleDateString('ko-KR')}</span>}
        </div>
        {project.custom_message && (
          <p style={{ maxWidth: 560, margin: '12px auto 0', fontSize: 13, color: '#7070a0', lineHeight: 1.7 }}>{project.custom_message}</p>
        )}
      </div>

      {/* Gallery */}
      <MasonryGallery
        photos={photos}
        selections={selections}
        annotations={annotations}
        onToggle={toggleSelection}
        onAnnotate={openAnnotation}
      />

      {/* Bottom bar */}
      <BottomBar
        totalCount={photos.length}
        selectedCount={selections.size}
        onSubmit={() => setShowSubmitModal(true)}
      />

      {/* Annotation modal */}
      {annotatingPhoto && (
        <AnnotationModal
          photo={annotatingPhoto}
          initialPins={annotations[annotatingPhoto.id] || []}
          onSave={(pins) => saveAnnotations(annotatingPhoto.id, pins)}
          onClose={() => setAnnotatingPhoto(null)}
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
