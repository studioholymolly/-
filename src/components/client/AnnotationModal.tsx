'use client'

import { useState, useRef, useEffect } from 'react'
import { PhotoWithUrl, AnnotationPin } from '@/lib/types'

interface Props {
  photo: PhotoWithUrl
  initialPins: AnnotationPin[]
  onSave: (pins: AnnotationPin[]) => void
  onClose: () => void
}

export default function AnnotationModal({ photo, initialPins, onSave, onClose }: Props) {
  const [pins, setPins] = useState<AnnotationPin[]>(initialPins.map(p => ({ ...p })))
  const [selectedPin, setSelectedPin] = useState<number | null>(null)
  const imgContainerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Esc to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = imgContainerRef.current!.getBoundingClientRect()
    const x_pct = +(((e.clientX - rect.left) / rect.width) * 100).toFixed(2)
    const y_pct = +(((e.clientY - rect.top) / rect.height) * 100).toFixed(2)
    const pinNumber = pins.length + 1
    const newPin: AnnotationPin = { pin_number: pinNumber, x_pct, y_pct, comment: '' }
    setPins(prev => [...prev, newPin])
    setSelectedPin(pinNumber)
    // Scroll the new item into view in the right panel
    setTimeout(() => {
      const item = document.getElementById(`ami-${pinNumber}`)
      if (item) item.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 50)
  }

  function updateComment(pinNumber: number, comment: string) {
    setPins(prev => prev.map(p => p.pin_number === pinNumber ? { ...p, comment } : p))
  }

  function removePin(pinNumber: number) {
    setPins(prev => {
      const filtered = prev.filter(p => p.pin_number !== pinNumber)
      return filtered.map((p, i) => ({ ...p, pin_number: i + 1 }))
    })
    if (selectedPin === pinNumber) setSelectedPin(null)
  }

  function clearAll() {
    if (!pins.length) return
    if (!window.confirm('모든 핀을 삭제하시겠습니까?')) return
    setPins([])
    setSelectedPin(null)
  }

  function focusPin(pinNumber: number) {
    setSelectedPin(pinNumber)
    const item = document.getElementById(`ami-${pinNumber}`)
    if (item) {
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      item.querySelector('textarea')?.focus()
    }
  }

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
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0c' }}>
            📍 주석 추가 — {photo.filename}
          </h3>
          <p style={{ fontSize: 12, color: '#6b6b80', marginTop: 2 }}>
            사진을 클릭하면 번호 핀이 생성됩니다. 각 핀에 수정 요청을 입력하세요.
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: '1px solid #c4c4cc', color: '#6b6b80',
          padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
        }}>닫기</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Photo area */}
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'crosshair',
        }}>
          <div
            ref={imgContainerRef}
            onClick={handleImageClick}
            style={{
              position: 'relative',
              display: 'inline-block',
              cursor: 'crosshair',
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 100px)',
            }}
          >
            <img
              src={photo.signedUrl}
              alt={photo.filename}
              style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 100px)', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }}
            />
            {pins.map(pin => (
              <div
                key={pin.pin_number}
                onClick={e => { e.stopPropagation(); focusPin(pin.pin_number) }}
                style={{
                  position: 'absolute',
                  left: `${pin.x_pct}%`,
                  top: `${pin.y_pct}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 30, height: 30,
                  borderRadius: '50%',
                  background: selectedPin === pin.pin_number ? '#f59e0b' : '#ef4444',
                  border: '3px solid rgba(255,255,255,0.9)',
                  color: '#fff', fontSize: 12, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
                  zIndex: 10,
                }}
              >
                {pin.pin_number}
              </div>
            ))}
          </div>
          {/* Bottom hint */}
          <div style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.75)', color: '#fff',
            fontSize: 12, padding: '7px 16px', borderRadius: 20,
            pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            📌 수정이 필요한 부분을 클릭하세요
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          width: 320, background: '#fafafa', borderLeft: '1px solid #c4c4cc',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e0e0e5' }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0a0a0c' }}>📝 수정 요청 목록</h4>
            <p style={{ fontSize: 11, color: '#6b6b80', marginTop: 3 }}>핀을 클릭하면 해당 항목으로 이동</p>
          </div>
          <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {pins.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#8a8a95', fontSize: 12, lineHeight: 1.7 }}>
                아직 핀이 없습니다<br />사진을 클릭해서 추가하세요
              </div>
            )}
            {pins.map(pin => (
              <div
                key={pin.pin_number}
                id={`ami-${pin.pin_number}`}
                onClick={() => setSelectedPin(pin.pin_number)}
                style={{
                  marginBottom: 10, padding: 10,
                  background: selectedPin === pin.pin_number ? 'rgba(245,158,11,0.08)' : '#f3f3f5',
                  border: `1px solid ${selectedPin === pin.pin_number ? 'rgba(245,158,11,0.3)' : '#e0e0e5'}`,
                  borderRadius: 8, cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#ef4444', color: '#fff',
                    fontSize: 11, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{pin.pin_number}</div>
                  <span style={{ fontSize: 11, color: '#6b6b80', flex: 1, textAlign: 'center' }}>
                    위치: {pin.x_pct}%, {pin.y_pct}%
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); removePin(pin.pin_number) }}
                    style={{ background: 'none', border: 'none', color: '#8a8a95', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}
                    aria-label="핀 삭제"
                  >✕</button>
                </div>
                <textarea
                  value={pin.comment}
                  onClick={e => e.stopPropagation()}
                  onChange={e => updateComment(pin.pin_number, e.target.value)}
                  placeholder="예: 이 부분을 밝게, 배경 흰색으로, 잡티 제거..."
                  rows={2}
                  style={{
                    width: '100%', background: '#ebebef', border: '1px solid #c4c4cc',
                    color: '#0a0a0c', padding: '7px 9px', borderRadius: 5,
                    fontSize: 12, resize: 'none', fontFamily: 'inherit',
                    outline: 'none', lineHeight: 1.5, height: 58,
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#ef4444')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#c4c4cc')}
                />
              </div>
            ))}
          </div>
          {/* Footer */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid #c4c4cc', flexShrink: 0, display: 'flex', gap: 8 }}>
            <button onClick={() => onSave(pins)} style={{
              flex: 1, background: 'linear-gradient(135deg,#b91c1c,#ef4444)',
              border: 'none', color: '#fff',
              padding: 10, borderRadius: 8,
              cursor: 'pointer', fontSize: 13, fontWeight: 800,
            }}>저장하기</button>
            <button onClick={clearAll} style={{
              background: 'none', border: '1px solid #e0e0e5', color: '#8a8a95',
              padding: 10, borderRadius: 8, cursor: 'pointer', fontSize: 11,
            }}>모두 삭제</button>
            <button onClick={onClose} style={{
              background: '#f3f3f5', border: '1px solid #e0e0e5', color: '#6b6b80',
              padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            }}>취소</button>
          </div>
        </div>
      </div>
    </div>
  )
}
