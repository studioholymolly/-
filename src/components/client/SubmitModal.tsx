'use client'

import { useState } from 'react'
import { submitSelections } from '@/lib/actions/selections'
import { PhotoWithUrl, AnnotationPin } from '@/lib/types'

interface Props {
  photos: PhotoWithUrl[]
  selectedIds: Set<string>
  annotations: Record<string, AnnotationPin[]>
  shareToken: string
  onClose: () => void
  onSuccess: () => void
}

export default function SubmitModal({ photos, selectedIds, annotations, shareToken, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedPhotos = photos.filter(p => selectedIds.has(p.id))
  const totalPins = Object.values(annotations).reduce((s, pins) => s + pins.length, 0)

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const result = await submitSelections(shareToken, Array.from(selectedIds), annotations)
      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        onSuccess()
      }
    } catch {
      setError('오류가 발생했습니다. 다시 시도해 주세요.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#111115', border: '1px solid #28282e',
        borderRadius: 16, width: '100%', maxWidth: 520,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 20px 0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>셀렉을 완료할까요?</h2>
          <p style={{ fontSize: 13, color: '#7070a0', marginBottom: 16 }}>
            선택한 {selectedPhotos.length}장{totalPins > 0 ? `과 수정 메모 ${totalPins}개` : ''}를 스튜디오에 전달합니다.
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, background: '#18181e', border: '1px solid #28282e', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>{selectedPhotos.length}</div>
              <div style={{ fontSize: 11, color: '#7070a0' }}>선택된 사진</div>
            </div>
            <div style={{ flex: 1, background: '#18181e', border: '1px solid #28282e', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>{totalPins}</div>
              <div style={{ fontSize: 11, color: '#7070a0' }}>수정 메모</div>
            </div>
          </div>
        </div>

        {/* Selected photo thumbnails */}
        <div style={{ overflow: 'auto', padding: '0 20px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 6 }}>
            {selectedPhotos.map(p => {
              const pins = annotations[p.id] || []
              return (
                <div key={p.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 6, overflow: 'hidden', border: '1px solid #28282e' }}>
                  <img src={p.signedUrl} alt={p.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {pins.length > 0 && (
                    <div style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 6 }}>
                      {pins.length}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {error && (
          <div style={{ margin: '0 20px', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 7, fontSize: 12, color: '#ef4444' }}>
            {error}
          </div>
        )}

        <div style={{ padding: 20, display: 'flex', gap: 10 }}>
          <button onClick={onClose} disabled={loading} style={{
            flex: 1, padding: '11px', background: '#18181e',
            border: '1px solid #28282e', color: '#f0f0f4',
            borderRadius: 8, fontSize: 14, cursor: 'pointer',
          }}>취소</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 2, padding: '11px',
            background: loading ? '#374151' : 'linear-gradient(135deg,#16a34a,#22c55e)',
            border: 'none', color: '#fff',
            borderRadius: 8, fontSize: 14, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? '전송 중...' : '셀렉 완료 전송'}
          </button>
        </div>
      </div>
    </div>
  )
}
