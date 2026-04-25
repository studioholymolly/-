'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import UploadZone from './UploadZone'
import ShareLinkButton from './ShareLinkButton'
import PhotoLightbox from '@/components/PhotoLightbox'
import SelectionReviewLightbox from './SelectionReviewLightbox'
import { Project, PhotoWithUrl, RetouchedPhotoWithUrl, Selection, Annotation, RevisionRequest, RevisionSelection, RevisionAnnotation, Submission } from '@/lib/types'
import { updateProjectStatus, setDriveLinkRetouched, updateProject, deleteProject } from '@/lib/actions/projects'
import { deletePhoto } from '@/lib/actions/photos'
import { formatDateTime } from '@/lib/utils'

interface Props {
  project: Project
  photos: PhotoWithUrl[]
  retouchedPhotos: RetouchedPhotoWithUrl[]
  selections: Selection[]
  annotations: Annotation[]
  revisionRequest: RevisionRequest | null
  selectedPhotoIds: string[]
  submissions?: Submission[]
  revisionSelections?: RevisionSelection[]
  revisionAnnotations?: RevisionAnnotation[]
}

export default function ProjectTabs({ project, photos, retouchedPhotos, selections, annotations, revisionRequest, selectedPhotoIds, submissions = [], revisionSelections = [], revisionAnnotations = [] }: Props) {
  const hasRevisionData = revisionSelections.length > 0
  const [tab, setTab] = useState<'originals' | 'selections' | 'retouch' | 'revisions' | 'settings'>('originals')
  const [isPending, startTransition] = useTransition()
  const [driveLinkRetouchedInput, setDriveLinkRetouchedInput] = useState(project.drive_link || '')
  const [editSaved, setEditSaved] = useState(false)
  const [lightbox, setLightbox] = useState<{ photos: { signedUrl: string; filename: string }[]; index: number } | null>(null)
  const [selectionReviewIndex, setSelectionReviewIndex] = useState<number | null>(null)
  const [revisionReviewIndex, setRevisionReviewIndex] = useState<number | null>(null)
  const router = useRouter()

  function openLightbox(photos: { signedUrl: string; filename: string }[], index: number) {
    setLightbox({ photos, index })
  }

  function handleEditSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateProject(project.id, formData)
      if (res?.ok) {
        setEditSaved(true)
        setTimeout(() => setEditSaved(false), 2000)
        router.refresh()
      }
    })
  }

  function handleDelete() {
    const ok = window.confirm(`"${project.name}" 프로젝트를 삭제하시겠습니까?\n\n업로드된 사진, 셀렉 기록 등 모든 데이터가 영구 삭제됩니다.`)
    if (!ok) return
    const again = window.confirm('정말 삭제합니다. 되돌릴 수 없습니다. 계속하시겠습니까?')
    if (!again) return
    startTransition(async () => {
      await deleteProject(project.id)
    })
  }

  const selectedPhotos = photos.filter(p => selectedPhotoIds.includes(p.id))
  const annotationsByPhoto: Record<string, Annotation[]> = {}
  for (const ann of annotations) {
    if (!annotationsByPhoto[ann.photo_id]) annotationsByPhoto[ann.photo_id] = []
    annotationsByPhoto[ann.photo_id].push(ann)
  }
  const commentsByPhoto: Record<string, string> = {}
  for (const sel of selections) {
    if (sel.comment && sel.comment.trim()) commentsByPhoto[sel.photo_id] = sel.comment
  }
  const commentCount = Object.keys(commentsByPhoto).length

  // Revision-side lookup tables (for the '수정 요청' tab)
  const revisionSelectedIds = revisionSelections.map(r => r.retouched_photo_id)
  const revisedRetouchedPhotos = retouchedPhotos.filter(p => revisionSelectedIds.includes(p.id))
  const revAnnotationsByPhoto: Record<string, RevisionAnnotation[]> = {}
  for (const ann of revisionAnnotations) {
    if (!revAnnotationsByPhoto[ann.retouched_photo_id]) revAnnotationsByPhoto[ann.retouched_photo_id] = []
    revAnnotationsByPhoto[ann.retouched_photo_id].push(ann)
  }
  const revCommentsByPhoto: Record<string, string> = {}
  for (const rs of revisionSelections) {
    if (rs.comment && rs.comment.trim()) revCommentsByPhoto[rs.retouched_photo_id] = rs.comment
  }
  const revCommentCount = Object.keys(revCommentsByPhoto).length
  const revPinCount = revisionAnnotations.length

  const tabs = [
    { key: 'originals', label: `원본 사진 (${photos.length})` },
    { key: 'selections', label: `셀렉 결과 (${selectedPhotoIds.length})` },
    { key: 'retouch', label: `보정본 (${retouchedPhotos.length})` },
    { key: 'revisions', label: `수정 요청 (${revisionSelectedIds.length})` },
    { key: 'settings', label: '설정' },
  ]

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      await updateProjectStatus(project.id, newStatus)
      router.refresh()
    })
  }

  function handleDeleteRetouched(photoId: string, storagePath: string, filename: string) {
    const ok = window.confirm(`"${filename}" 보정본을 삭제할까요?\n\n이 작업은 되돌릴 수 없습니다.`)
    if (!ok) return
    startTransition(async () => {
      await deletePhoto(photoId, 'retouched', storagePath)
      router.refresh()
    })
  }

  function handleSaveRetouchedLink() {
    startTransition(async () => {
      await setDriveLinkRetouched(project.id, driveLinkRetouchedInput)
      router.refresh()
    })
  }

  return (
    <div>
      {/* Project status (항상 고정 표시 — 탭과 독립) */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 12, padding: '14px 18px', marginBottom: 18 }}>
        <h3 style={{ fontSize: 12, fontWeight: 800, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>프로젝트 상태 변경</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(['draft', 'selecting', 'selection_done', 'studio_editing', 'client_reviewing', 'completed'] as const).map(s => (
            <button key={s} onClick={() => handleStatusChange(s)} disabled={isPending || project.status === s} style={{
              padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              cursor: project.status === s ? 'default' : 'pointer',
              background: project.status === s ? 'var(--vio)' : 'var(--s2)',
              color: project.status === s ? '#fff' : 'var(--tx)',
              border: '1px solid var(--bd2)',
            }}>{({draft:'초안',selecting:'셀렉 중',selection_done:'셀렉 완료',studio_editing:'보정 중',client_reviewing:'수정 중',completed:'완료'} as const)[s]}</button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--bd)', marginBottom: 24, gap: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)} style={{
            padding: '10px 18px', fontSize: 13, fontWeight: 600,
            background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t.key ? 'var(--vio-l)' : 'var(--mu)',
            borderBottom: tab === t.key ? '2px solid var(--vio)' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab: Originals */}
      {tab === 'originals' && (
        <div>
          {project.status === 'draft' && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: 13, color: '#fcd34d' }}>
              💡 사진 업로드 후 &ldquo;셀렉 시작&rdquo; 버튼을 눌러 클라이언트에게 공유하세요
            </div>
          )}
          <UploadZone projectId={project.id} bucket="originals" onUploadComplete={() => router.refresh()} />
          {photos.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>업로드된 사진 {photos.length}장</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 8,
              }}>
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openLightbox(photos.map(x => ({ signedUrl: x.signedUrl, filename: x.filename })), i)}
                    style={{
                      all: 'unset',
                      position: 'relative',
                      aspectRatio: '1 / 1',
                      borderRadius: 8, overflow: 'hidden',
                      background: 'var(--s2)', border: '1px solid var(--bd)',
                      cursor: 'zoom-in', display: 'block',
                    }}
                  >
                    <Image src={p.signedUrl} alt={p.filename}
                      fill
                      sizes="(max-width: 600px) 50vw, (max-width: 1100px) 25vw, 180px"
                      style={{ objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {project.status === 'draft' && photos.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <ShareLinkButton projectId={project.id} projectName={project.name} token={project.share_token} clientEmail={project.client_email} clientName={project.client_name} />
              <button onClick={() => handleStatusChange('selecting')} disabled={isPending} style={{
                marginTop: 12, background: 'linear-gradient(135deg,#6d28d9,#7c3aed)',
                color: '#fff', border: 'none', padding: '11px 24px',
                borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>🚀 셀렉 시작 (클라이언트에게 공개)</button>
            </div>
          )}
          {project.status !== 'draft' && (
            <div style={{ marginTop: 16 }}>
              <ShareLinkButton projectId={project.id} projectName={project.name} token={project.share_token} clientEmail={project.client_email} clientName={project.client_name} />
            </div>
          )}
        </div>
      )}

      {/* Tab: Selections */}
      {tab === 'selections' && (
        <div>
          {/* Submission history */}
          {submissions.length > 0 && (
            <div style={{ marginBottom: 20, background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800 }}>📜 셀렉 제출 기록 ({submissions.length}회)</h3>
                <span style={{ fontSize: 11, color: 'var(--mu)' }}>가장 최신 제출 내역이 현재 셀렉 결과에 반영돼 있습니다</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {submissions.map((s, i) => {
                  const isLatest = i === 0
                  return (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 12px', borderRadius: 8,
                      background: isLatest ? 'rgba(34,197,94,0.07)' : 'var(--s2)',
                      border: `1px solid ${isLatest ? 'rgba(34,197,94,0.3)' : 'var(--bd)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          background: isLatest ? '#22c55e' : 'var(--s3)',
                          color: isLatest ? '#fff' : 'var(--mu)',
                          fontSize: 10, fontWeight: 800,
                          padding: '2px 8px', borderRadius: 10, minWidth: 40, textAlign: 'center',
                        }}>{isLatest ? '최신' : `${submissions.length - i}회차`}</span>
                        <span style={{ fontSize: 12, color: 'var(--tx)', fontWeight: 600 }}>
                          {formatDateTime(s.created_at)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--mu)' }}>
                        <span>선택 <b style={{ color: '#22c55e' }}>{s.selected_count}</b> / {s.total_count}장</span>
                        <span>메모 <b style={{ color: '#ef4444' }}>{s.pin_count}</b>개</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {selectedPhotoIds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--mu)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
              <p>아직 클라이언트가 셀렉하지 않았습니다</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 16 }}>
                클라이언트가 {selectedPhotoIds.length}장을 선택했습니다{commentCount > 0 ? ` · 코멘트 ${commentCount}개` : ''}. <span style={{ color: 'var(--mu)' }}>사진을 클릭하면 핀 위치와 메모를 크게 볼 수 있습니다.</span>
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 12,
              }}>
                {selectedPhotos.map((p, i) => {
                  const anns = annotationsByPhoto[p.id] || []
                  const hasComment = !!commentsByPhoto[p.id]
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectionReviewIndex(i)}
                      aria-label={`${p.filename} 크게 보기`}
                      style={{
                        all: 'unset',
                        display: 'block', position: 'relative',
                        aspectRatio: '3 / 4', overflow: 'hidden',
                        borderRadius: 10,
                        border: `2px solid ${anns.length > 0 ? 'rgba(239,68,68,0.5)' : hasComment ? 'rgba(59,130,246,0.5)' : 'var(--bd)'}`,
                        background: 'var(--s2)',
                        cursor: 'zoom-in',
                      }}
                    >
                      <Image src={p.signedUrl} alt={p.filename}
                        fill
                        sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 220px"
                        style={{ objectFit: 'cover' }} />
                      {anns.length > 0 && (
                        <div style={{
                          position: 'absolute', top: 8, left: 8,
                          background: 'var(--red)', color: '#fff',
                          fontSize: 10, fontWeight: 800,
                          padding: '3px 9px', borderRadius: 10,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                        }}>
                          📍 수정 요청 {anns.length}개
                        </div>
                      )}
                      {hasComment && (
                        <div style={{
                          position: 'absolute', top: 8, right: 8,
                          background: '#3b82f6', color: '#fff',
                          fontSize: 10, fontWeight: 800,
                          padding: '3px 9px', borderRadius: 10,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                        }}>
                          💬 코멘트
                        </div>
                      )}
                      <div style={{
                        position: 'absolute', bottom: 6, left: 10,
                        fontSize: 10, fontWeight: 700,
                        color: 'rgba(255,255,255,0.85)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                      }}>#{String(i + 1).padStart(3, '0')}</div>
                    </button>
                  )
                })}
              </div>
              {project.status === 'studio_editing' && (
                <button onClick={() => { setTab('retouch') }} style={{
                  marginTop: 20, background: 'var(--vio)', color: '#fff',
                  border: 'none', padding: '11px 24px', borderRadius: 8,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>→ 보정본 업로드하기</button>
              )}
            </div>
          )}
          {revisionRequest && (
            <div style={{ marginTop: 24, padding: 16, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>수정 요청 ({formatDateTime(revisionRequest.created_at)})</h4>
              <p style={{ fontSize: 13, color: 'var(--tx)' }}>{revisionRequest.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Retouch */}
      {tab === 'retouch' && (
        <div>
          <UploadZone projectId={project.id} bucket="retouched" onUploadComplete={() => router.refresh()} />
          {retouchedPhotos.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>보정본 {retouchedPhotos.length}장</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 8,
              }}>
                {retouchedPhotos.map((p, i) => (
                  <div key={p.id} style={{ position: 'relative', aspectRatio: '1 / 1' }}>
                    <button
                      type="button"
                      onClick={() => openLightbox(retouchedPhotos.map(x => ({ signedUrl: x.signedUrl, filename: x.filename })), i)}
                      style={{
                        all: 'unset',
                        position: 'absolute', inset: 0,
                        borderRadius: 8, overflow: 'hidden',
                        background: 'var(--s2)', border: '1px solid var(--bd)',
                        cursor: 'zoom-in', display: 'block',
                      }}
                    >
                      <Image src={p.signedUrl} alt={p.filename}
                        fill
                        sizes="(max-width: 600px) 50vw, (max-width: 1100px) 25vw, 180px"
                        style={{ objectFit: 'cover' }} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteRetouched(p.id, p.storage_path, p.filename) }}
                      disabled={isPending}
                      aria-label={`${p.filename} 삭제`}
                      title="삭제"
                      style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'rgba(239,68,68,0.92)', color: '#fff',
                        border: '1.5px solid rgba(255,255,255,0.9)',
                        fontSize: 14, fontWeight: 800, lineHeight: 1,
                        cursor: isPending ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>

              {project.status === 'studio_editing' && !project.revision_used && (
                <div style={{
                  marginTop: 18, padding: 16,
                  background: 'rgba(13,148,136,0.08)',
                  border: '1px solid rgba(13,148,136,0.35)',
                  borderRadius: 10,
                }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>📤 보정본이 준비되셨나요?</h4>
                  <p style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 12, lineHeight: 1.6 }}>
                    아래 버튼을 누르면 클라이언트가 <b>기존 공유 링크</b>에서 보정본을 확인할 수 있습니다. 수정 요청 1회까지 받을 수 있어요.
                  </p>
                  <button onClick={() => handleStatusChange('client_reviewing')} disabled={isPending} style={{
                    background: 'linear-gradient(135deg,#0d9488,#14b8a6)', color: '#fff',
                    border: 'none', padding: '11px 24px', borderRadius: 8,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}>📤 클라이언트에게 보정본 공개하기</button>
                </div>
              )}
              {(project.status === 'studio_editing' || project.status === 'client_reviewing') && project.revision_used && (
                <div style={{
                  marginTop: 18, padding: 16,
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.35)',
                  borderRadius: 10,
                }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>✨ 수정 작업을 마치셨나요?</h4>
                  <p style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 12, lineHeight: 1.6 }}>
                    수정된 최종 파일을 드라이브에 업로드하고 아래 링크란에 저장한 뒤, 이 버튼을 누르면 클라이언트가 다운로드 링크를 바로 받아볼 수 있어요. (수정 요청은 이미 1회 사용됨)
                  </p>
                  {!project.drive_link && (
                    <p style={{ fontSize: 12, color: '#d97706', marginBottom: 12, fontWeight: 600 }}>
                      ⚠️ 아래 드라이브 링크를 먼저 저장해 주세요
                    </p>
                  )}
                  <button
                    onClick={() => {
                      const ok = window.confirm('클라이언트에게 최종 파일을 전달하고 작업을 완료합니다. 계속하시겠습니까?')
                      if (ok) handleStatusChange('completed')
                    }}
                    disabled={isPending || !project.drive_link}
                    style={{
                      background: !project.drive_link ? '#9ca3af' : 'linear-gradient(135deg,#2563eb,#3b82f6)',
                      color: '#fff', border: 'none', padding: '11px 24px', borderRadius: 8,
                      fontSize: 14, fontWeight: 700,
                      cursor: (!project.drive_link || isPending) ? 'not-allowed' : 'pointer',
                    }}
                  >📤 수정 완료 — 클라이언트에게 전달</button>
                </div>
              )}
              {project.status === 'client_reviewing' && !project.revision_used && (
                <div style={{
                  marginTop: 18, padding: 14,
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.35)',
                  borderRadius: 10,
                  fontSize: 13, color: 'var(--tx)', lineHeight: 1.6,
                }}>
                  ✅ 클라이언트가 공유 링크에서 보정본을 확인할 수 있는 상태입니다. (수정 요청 1회 가능)
                </div>
              )}
              {project.status === 'completed' && (
                <div style={{
                  marginTop: 18, padding: 14,
                  background: 'rgba(22,163,74,0.1)',
                  border: '1px solid rgba(22,163,74,0.4)',
                  borderRadius: 10,
                  fontSize: 13, color: 'var(--tx)', lineHeight: 1.6,
                }}>
                  🎉 작업 완료 — 클라이언트가 공유 링크에서 드라이브 다운로드 버튼을 볼 수 있습니다.
                </div>
              )}
            </div>
          )}

          {/* Drive link (단일 — 원본/보정본을 같은 드라이브 폴더에 넣으세요) */}
          <div style={{ marginTop: 24, padding: 18, background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>🔗 구글 드라이브 다운로드 링크</h4>
            <p style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 14 }}>원본과 보정본을 모두 담은 드라이브 폴더 링크를 붙여넣으세요. 클라이언트에게 공개됩니다.</p>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={driveLinkRetouchedInput}
                onChange={e => setDriveLinkRetouchedInput(e.target.value)}
                placeholder="https://drive.google.com/..."
                style={{ flex: 1, background: 'var(--s3)', border: '1px solid var(--bd)', color: 'var(--tx)', padding: '9px 12px', borderRadius: 7, fontSize: 13, outline: 'none' }}
              />
              <button onClick={handleSaveRetouchedLink} disabled={isPending} style={{
                background: '#16a34a', color: '#fff', border: 'none',
                padding: '9px 18px', borderRadius: 7, fontSize: 13,
                fontWeight: 700, cursor: 'pointer',
              }}>저장</button>
            </div>
          </div>

          {/* 보정본 검토 단계에 맞는 카카오톡 메시지 템플릿 */}
          <div style={{ marginTop: 16 }}>
            <ShareLinkButton
              projectId={project.id}
              projectName={project.name}
              token={project.share_token}
              clientEmail={project.client_email}
              clientName={project.client_name}
              phase="reviewing"
            />
          </div>
        </div>
      )}

      {/* Tab: Revisions (수정 요청) — always present; empty state when client hasn't submitted yet */}
      {tab === 'revisions' && (
        <div>
          {hasRevisionData ? (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: '#ef4444', marginBottom: 4 }}>📝 클라이언트가 수정 요청을 보냈습니다</h3>
                <p style={{ fontSize: 12, color: 'var(--mu)', lineHeight: 1.6 }}>
                  보정본 <b>{revisionSelectedIds.length}장</b>{revPinCount > 0 ? `, 핀 메모 ${revPinCount}개` : ''}{revCommentCount > 0 ? `, 코멘트 ${revCommentCount}개` : ''}. 사진을 클릭하면 핀 위치와 메모, 코멘트를 크게 볼 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTab('retouch')}
                style={{
                  background: 'linear-gradient(135deg,#6d28d9,#7c3aed)', color: '#fff',
                  border: 'none', padding: '9px 18px', borderRadius: 8,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >📤 수정본 업로드하러 가기</button>
            </div>
          ) : (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--mu)', lineHeight: 1.6 }}>
                아직 클라이언트가 수정 요청을 제출하지 않았습니다. 클라이언트가 보정본을 검토하고 &ldquo;수정 있음&rdquo;을 선택해 사진을 전달하면 이 탭에 내용이 표시됩니다.
              </p>
            </div>
          )}

          {revisedRetouchedPhotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--mu)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
              <p>수정 요청된 보정본이 없습니다</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
            }}>
              {revisedRetouchedPhotos.map((p, i) => {
                const anns = revAnnotationsByPhoto[p.id] || []
                const hasComment = !!revCommentsByPhoto[p.id]
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setRevisionReviewIndex(i)}
                    aria-label={`${p.filename} 크게 보기`}
                    style={{
                      all: 'unset',
                      display: 'block', position: 'relative',
                      aspectRatio: '3 / 4', overflow: 'hidden',
                      borderRadius: 10,
                      border: `2px solid ${anns.length > 0 ? 'rgba(239,68,68,0.5)' : hasComment ? 'rgba(59,130,246,0.5)' : 'var(--bd)'}`,
                      background: 'var(--s2)',
                      cursor: 'zoom-in',
                    }}
                  >
                    <Image src={p.signedUrl} alt={p.filename}
                      fill
                      sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 220px"
                      style={{ objectFit: 'cover' }} />
                    {anns.length > 0 && (
                      <div style={{
                        position: 'absolute', top: 8, left: 8,
                        background: 'var(--red)', color: '#fff',
                        fontSize: 10, fontWeight: 800,
                        padding: '3px 9px', borderRadius: 10,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                      }}>
                        📍 수정 메모 {anns.length}개
                      </div>
                    )}
                    {hasComment && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: '#3b82f6', color: '#fff',
                        fontSize: 10, fontWeight: 800,
                        padding: '3px 9px', borderRadius: 10,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                      }}>
                        💬 코멘트
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', bottom: 6, left: 10,
                      fontSize: 10, fontWeight: 700,
                      color: 'rgba(255,255,255,0.85)',
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    }}>#{String(i + 1).padStart(3, '0')}</div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Settings */}
      {tab === 'settings' && (
        <div style={{ maxWidth: 500 }}>
          {/* Edit project info */}
          <form action={handleEditSubmit} style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 12, padding: 20, marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>프로젝트 정보 편집</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <EditField label="프로젝트명" name="name" defaultValue={project.name} required />
              <EditField label="클라이언트명" name="client_name" defaultValue={project.client_name} required />
              <EditField label="클라이언트 이메일" name="client_email" type="email" defaultValue={project.client_email} required />
              <EditField label="보정 시작일" name="retouching_start_date" type="date" defaultValue={project.retouching_start_date || ''} />
              <EditField label="보정 마감일" name="deadline" type="date" defaultValue={project.deadline || ''} />
              <EditField label="클라이언트 안내 메시지" name="custom_message" type="textarea" defaultValue={project.custom_message || ''} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <button type="submit" disabled={isPending} style={{
                background: 'linear-gradient(135deg,#6d28d9,#7c3aed)', color: '#fff',
                border: 'none', padding: '9px 20px', borderRadius: 7,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>{isPending ? '저장 중...' : '저장'}</button>
              {editSaved && <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>✓ 저장됨</span>}
            </div>
          </form>

          <div style={{ marginBottom: 20 }}>
            <ShareLinkButton projectId={project.id} projectName={project.name} token={project.share_token} clientEmail={project.client_email} clientName={project.client_name} />
          </div>

          {/* Danger zone */}
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: '#ef4444' }}>프로젝트 삭제</h3>
            <p style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 12 }}>삭제하면 업로드된 사진, 셀렉 기록, 보정본 등 이 프로젝트의 모든 데이터가 영구 삭제됩니다. 되돌릴 수 없습니다.</p>
            <button onClick={handleDelete} disabled={isPending} style={{
              background: '#ef4444', color: '#fff', border: 'none',
              padding: '9px 18px', borderRadius: 7, fontSize: 13,
              fontWeight: 700, cursor: 'pointer',
            }}>프로젝트 삭제</button>
          </div>
        </div>
      )}

      {/* Basic lightbox used by the originals / retouched grids */}
      <PhotoLightbox
        photos={lightbox?.photos ?? []}
        index={lightbox?.index ?? null}
        onClose={() => setLightbox(null)}
        onChange={(i) => setLightbox(lb => lb ? { ...lb, index: i } : lb)}
      />

      {/* Rich lightbox for the selections tab — shows pins + comments overlayed on full image */}
      {selectionReviewIndex !== null && (
        <SelectionReviewLightbox
          photos={selectedPhotos}
          annotationsByPhoto={annotationsByPhoto}
          commentsByPhoto={commentsByPhoto}
          index={selectionReviewIndex}
          onChange={setSelectionReviewIndex}
          onClose={() => setSelectionReviewIndex(null)}
        />
      )}

      {/* Revision lightbox — pins + comments on retouched photos that were flagged for revision */}
      {revisionReviewIndex !== null && (
        <SelectionReviewLightbox
          photos={revisedRetouchedPhotos}
          annotationsByPhoto={revAnnotationsByPhoto}
          commentsByPhoto={revCommentsByPhoto}
          index={revisionReviewIndex}
          onChange={setRevisionReviewIndex}
          onClose={() => setRevisionReviewIndex(null)}
        />
      )}
    </div>
  )
}

function EditField({ label, name, type = 'text', defaultValue = '', required = false }: {
  label: string; name: string; type?: string; defaultValue?: string; required?: boolean
}) {
  const baseStyle: React.CSSProperties = {
    background: 'var(--s2)', border: '1px solid var(--bd)',
    color: 'var(--tx)', padding: '9px 12px',
    borderRadius: 7, fontSize: 13, fontFamily: 'inherit',
    width: '100%', outline: 'none',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
      {type === 'textarea'
        ? <textarea name={name} defaultValue={defaultValue} rows={3} style={{ ...baseStyle, resize: 'vertical' }} />
        : <input name={name} type={type} defaultValue={defaultValue} required={required} style={baseStyle} />}
    </div>
  )
}
