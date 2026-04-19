'use client'

import { useState, useRef } from 'react'
import { PhotoWithUrl, AnnotationPin } from '@/lib/types'

interface Props {
  photo: PhotoWithUrl
  initialPins: AnnotationPin[]
  onSave: (pins: AnnotationPin[]) => void
  onClose: () => void
}

export default function AnnotationModal({ photo, initialPins, onSave, onClose }: Props) {
  const [pins, setPins] = useState<AnnotationPin[]>(initialPins.map(p => ({ ...p })))
  const [pinMode, setPinMode] = useState(false)
  const [selectedPin, setSelectedPin] = useState<number | null>(null)
  const imgContainerRef = useRef<HTMLDivElement>(null)

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!pinMode) return
    const rect = imgContainerRef.current!.getBoundingClientRect()
    const x_pct = ((e.clientX - rect.left) / rect.width) * 100
    const y_pct = ((e.clientY - rect.top) / rect.height) * 100
    const pinNumber = pins.length + 1
    const newPin: AnnotationPin = { pin_number: pinNumber, x_pct, y_pct, comment: '' }
    setPins(prev => [...prev, newPin])
    setSelectedPin(pinNumber)
    setPinMode(false)
  }

  function updateComment(pinNumber: number, comment: string) {
    setPins(prev => prev.map(p => p.pin_number === pinNumber ? { ...p, comment } : p))
  }

  function removePin(pinNumber: number) {
    setPins(prev => {
      const filtered = prev.filter(p => p.pin_number !== pinNumber)
      // Renumber
      return filtered.map((p, i) => ({ ...p, pin_number: i + 1 }))
    })
    if (selectedPin === pinNumber) setSelectedPin(null)
  }

  function handleSave() {
    onSave(pins)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)',
      zIndex: 300, display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: '1px solid #28282e',
        background: '#111115', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7070a0', fontSize: 20, cursor: 'pointer' }}>←</button>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f4' }}>{photo.filename}</p>
            <p style={{ fontSize: 11, color: '#7070a0' }}>핀을 클릭해 수정 요청을 남겨보세요</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setPinMode(p => !p) }}
            style={{
              padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700,
              background: pinMode ? '#7c3aed' : '#18181e',
              color: pinMode ? '#fff' : '#a78bfa',
              border: '1px solid ' + (pinMode ? '#7c3aed' : '#38384a'),
              cursor: 'pointer',
            }}
          >
            {pinMode ? '📍 클릭해서 핀 추가 중...' : '+ 핀 추가'}
          </button>
          {pins.length > 0 && (
            <button onClick={() => { setPins([]); setSelectedPin(null) }} style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer' }}>
              전체 삭제
            </button>
          )}
          <button onClick={handleSave} style={{
            padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 700,
            background: 'linear-gradient(135deg,#6d28d9,#7c3aed)', color: '#fff',
            border: 'none', cursor: 'pointer',
          }}>저장</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Image area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: 20 }}>
          <div
            ref={imgContainerRef}
            onClick={handleImageClick}
            style={{
              position: 'relative',
              display: 'inline-block',
              cursor: pinMode ? 'crosshair' : 'default',
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          >
            <img
              src={photo.signedUrl}
              alt={photo.filename}
              style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 140px)', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }}
            />
            {/* SVG overlay for pins */}
            <svg
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {pins.map(pin => (
                <g key={pin.pin_number} transform={`translate(${pin.x_pct}, ${pin.y_pct})`}>
                  <circle cx="0" cy="0" r="3" fill={selectedPin === pin.pin_number ? '#f59e0b' : '#ef4444'} />
                </g>
              ))}
            </svg>
            {/* Pin number labels (absolute positioned) */}
            {pins.map(pin => (
              <div
                key={pin.pin_number}
                onClick={e => { e.stopPropagation(); setSelectedPin(pin.pin_number); setPinMode(false) }}
                style={{
                  position: 'absolute',
                  left: `${pin.x_pct}%`,
                  top: `${pin.y_pct}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 24, height: 24,
                  borderRadius: '50%',
                  background: selectedPin === pin.pin_number ? '#f59e0b' : '#ef4444',
                  color: '#fff',
                  fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  zIndex: 10,
                  pointerEvents: 'all',
                }}
              >
                {pin.pin_number}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel: pin comments */}
        <div style={{
          width: 300, background: '#111115', borderLeft: '1px solid #28282e',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #28282e', fontSize: 12, fontWeight: 700, color: '#7070a0' }}>
            수정 메모 ({pins.length}개)
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {pins.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#50505a' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
                <p style={{ fontSize: 12 }}>사진을 클릭해 핀을 추가하세요</p>
              </div>
            )}
            {pins.map(pin => (
              <div
                key={pin.pin_number}
                onClick={() => setSelectedPin(pin.pin_number)}
                style={{
                  marginBottom: 10, padding: 10,
                  background: selectedPin === pin.pin_number ? 'rgba(245,158,11,0.08)' : '#18181e',
                  border: `1px solid ${selectedPin === pin.pin_number ? 'rgba(245,158,11,0.3)' : '#28282e'}`,
                  borderRadius: 8, cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: '#ef4444', color: '#fff',
                      fontSize: 10, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{pin.pin_number}</div>
                    <span style={{ fontSize: 11, color: '#7070a0' }}>핀 {pin.pin_number}</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); removePin(pin.pin_number) }}
                    style={{ background: 'none', border: 'none', color: '#50505a', cursor: 'pointer', fontSize: 14 }}
                  >✕</button>
                </div>
                <textarea
                  value={pin.comment}
                  onClick={e => e.stopPropagation()}
                  onChange={e => updateComment(pin.pin_number, e.target.value)}
                  placeholder="수정 요청 내용을 입력하세요"
                  rows={2}
                  style={{
                    width: '100%', background: '#0a0a0c', border: '1px solid #28282e',
                    color: '#f0f0f4', padding: '6px 8px', borderRadius: 6,
                    fontSize: 12, resize: 'vertical', fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
