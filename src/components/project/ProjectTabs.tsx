'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import UploadZone from './UploadZone'
import ShareLinkButton from './ShareLinkButton'
import { Project, PhotoWithUrl, RetouchedPhotoWithUrl, Selection, Annotation, RevisionRequest } from '@/lib/types'
import { updateProjectStatus, setDriveLink } from '@/lib/actions/projects'
import { formatDateTime } from '@/lib/utils'

interface Props {
  project: Project
  photos: PhotoWithUrl[]
  retouchedPhotos: RetouchedPhotoWithUrl[]
  selections: Selection[]
  annotations: Annotation[]
  revisionRequest: RevisionRequest | null
  selectedPhotoIds: string[]
}

export default function ProjectTabs({ project, photos, retouchedPhotos, selections, annotations, revisionRequest, selectedPhotoIds }: Props) {
  const [tab, setTab] = useState<'originals' | 'selections' | 'retouch' | 'settings'>('originals')
  const [isPending, startTransition] = useTransition()
  const [driveLink, setDriveLinkState] = useState(project.drive_link || '')
  const router = useRouter()

  const selectedPhotos = photos.filter(p => selectedPhotoIds.includes(p.id))
  const annotationsByPhoto: Record<string, Annotation[]> = {}
  for (const ann of annotations) {
    if (!annotationsByPhoto[ann.photo_id]) annotationsByPhoto[ann.photo_id] = []
    annotationsByPhoto[ann.photo_id].push(ann)
  }

  const tabs = [
    { key: 'originals', label: `원본 사진 (${photos.length})` },
    { key: 'selections', label: `셀렉 결과 (${selectedPhotoIds.length})` },
    { key: 'retouch', label: `보정본 (${retouchedPhotos.length})` },
    { key: 'settings', label: '설정' },
  ]

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      await updateProjectStatus(project.id, newStatus)
      router.refresh()
    })
  }

  function handleSetDriveLink() {
    if (!driveLink) return
    startTransition(async () => {
      await setDriveLink(project.id, driveLink)
      router.refresh()
    })
  }

  return (
    <div>
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
              <div style={{ columns: 4, columnGap: 8 }}>
                {photos.map(p => (
                  <div key={p.id} style={{ breakInside: 'avoid', marginBottom: 8, borderRadius: 8, overflow: 'hidden', background: 'var(--s2)' }}>
                    <img src={p.signedUrl} alt={p.filename} style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {project.status === 'draft' && photos.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <ShareLinkButton token={project.share_token} clientEmail={project.client_email} />
              <button onClick={() => handleStatusChange('selecting')} disabled={isPending} style={{
                marginTop: 12, background: 'linear-gradient(135deg,#6d28d9,#7c3aed)',
                color: '#fff', border: 'none', padding: '11px 24px',
                borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>🚀 셀렉 시작 (클라이언트에게 공개)</button>
            </div>
          )}
          {project.status !== 'draft' && (
            <div style={{ marginTop: 16 }}>
              <ShareLinkButton token={project.share_token} clientEmail={project.client_email} />
            </div>
          )}
        </div>
      )}

      {/* Tab: Selections */}
      {tab === 'selections' && (
        <div>
          {selectedPhotoIds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--mu)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
              <p>아직 클라이언트가 셀렉하지 않았습니다</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 16 }}>클라이언트가 {selectedPhotoIds.length}장을 선택했습니다.</p>
              <div style={{ columns: 3, columnGap: 10 }}>
                {selectedPhotos.map(p => {
                  const anns = annotationsByPhoto[p.id] || []
                  return (
                    <div key={p.id} style={{
                      breakInside: 'avoid', marginBottom: 10,
                      background: 'var(--s1)', border: `1px solid ${anns.length > 0 ? 'rgba(239,68,68,0.4)' : 'var(--bd)'}`,
                      borderRadius: 10, overflow: 'hidden',
                    }}>
                      <div style={{ position: 'relative' }}>
                        <img src={p.signedUrl} alt={p.filename} style={{ width: '100%', height: 'auto', display: 'block' }} />
                        {anns.length > 0 && (
                          <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                            수정 요청 {anns.length}개
                          </div>
                        )}
                      </div>
                      {anns.length > 0 && (
                        <div style={{ padding: '10px 12px' }}>
                          {anns.sort((a, b) => a.pin_number - b.pin_number).map(ann => (
                            <div key={ann.id} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12 }}>
                              <span style={{ background: 'var(--red)', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{ann.pin_number}</span>
                              <span style={{ color: 'var(--tx)' }}>{ann.comment}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
              <div style={{ columns: 4, columnGap: 8 }}>
                {retouchedPhotos.map(p => (
                  <div key={p.id} style={{ breakInside: 'avoid', marginBottom: 8, borderRadius: 8, overflow: 'hidden' }}>
                    <img src={p.signedUrl} alt={p.filename} style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                ))}
              </div>

              {project.status === 'studio_editing' && (
                <button onClick={() => handleStatusChange('client_reviewing')} disabled={isPending} style={{
                  marginTop: 16, background: '#0d9488', color: '#fff',
                  border: 'none', padding: '11px 24px', borderRadius: 8,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>📤 클라이언트에게 보정본 공개</button>
              )}

              {(project.status === 'client_reviewing' || project.status === 'completed') && (
                <div style={{ marginTop: 20, padding: 16, background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🔗 구글 드라이브 링크 전달</h4>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={driveLink}
                      onChange={e => setDriveLinkState(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      style={{ flex: 1, background: 'var(--s3)', border: '1px solid var(--bd)', color: 'var(--tx)', padding: '9px 12px', borderRadius: 7, fontSize: 13, outline: 'none' }}
                    />
                    <button onClick={handleSetDriveLink} disabled={isPending || !driveLink} style={{
                      background: '#16a34a', color: '#fff', border: 'none',
                      padding: '9px 18px', borderRadius: 7, fontSize: 13,
                      fontWeight: 700, cursor: 'pointer',
                    }}>완료 처리</button>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--mu)', marginTop: 6 }}>링크를 입력하면 프로젝트가 완료 처리되고 클라이언트에게 드라이브 링크가 공개됩니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Settings */}
      {tab === 'settings' && (
        <div style={{ maxWidth: 500 }}>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 12, padding: 20, marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>프로젝트 상태 변경</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(['draft', 'selecting', 'studio_editing', 'client_reviewing', 'completed'] as const).map(s => (
                <button key={s} onClick={() => handleStatusChange(s)} disabled={isPending || project.status === s} style={{
                  padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  cursor: project.status === s ? 'default' : 'pointer',
                  background: project.status === s ? 'var(--vio)' : 'var(--s2)',
                  color: project.status === s ? '#fff' : 'var(--tx)',
                  border: '1px solid var(--bd2)',
                }}>{['초안', '셀렉 중', '보정 중', '검토 중', '완료'][['draft', 'selecting', 'studio_editing', 'client_reviewing', 'completed'].indexOf(s)]}</button>
              ))}
            </div>
          </div>
          <ShareLinkButton token={project.share_token} clientEmail={project.client_email} />
        </div>
      )}
    </div>
  )
}
