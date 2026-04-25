'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'studio-app:guide-hidden-until'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function shouldShowHelpGuide() {
  if (typeof window === 'undefined') return false
  const hiddenUntil = window.localStorage.getItem(STORAGE_KEY)
  if (!hiddenUntil) return true
  return hiddenUntil < todayKey()
}

export default function HelpGuideModal({ onClose }: { onClose: () => void }) {
  const [hideToday, setHideToday] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  })

  function handleClose() {
    if (hideToday) window.localStorage.setItem(STORAGE_KEY, todayKey())
    onClose()
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        zIndex: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fafafa', border: '1px solid #e0e0e5', borderRadius: 16,
          width: '100%', maxWidth: 560, maxHeight: '85vh', overflow: 'auto',
          padding: '24px 24px 18px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>리뷰 시스템 사용 가이드 👋</h2>
          <p style={{ fontSize: 12, color: '#6b6b80' }}>편하고 정확한 리뷰를 위한 조작법을 알려드립니다.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <Tip n="1" color="#ef4444" title="1단계 · 찜하기 (♥)" body="우측 상단 ♡ 버튼이나 라이트박스에서 F 키로 마음에 드는 사진을 모두 찜하세요. 상단 [♥ 찜한 컷] 탭에서 모아볼 수 있어요." />
          <Tip n="2" color="#22c55e" title="2단계 · 최종 선택 (Space)" body="찜한 사진 중에서 ✓ 버튼이나 스페이스바로 최종본을 결정하세요." />
          <Tip n="3" color="#a855f7" title="보기 필터 & 검색" body="상단 탭으로 찜한 컷·선택된 컷만 모아 보거나, 파일명 검색으로 빠르게 찾을 수 있어요." />
          <Tip n="4" color="#dc2626" title="수정 요청 (📍 PIN)" body="사진을 클릭하면 PIN 모드로 수정 위치를 표시하고 메모를 남길 수 있어요." />
          <Tip n="5" color="#3b82f6" title="전체 메모 + 코멘트" body="상단 전체 메모에 프로젝트 전반 의견을, 선택 카드에는 사진별 코멘트를 남길 수 있어요." />
          <Tip n="6" color="#0ea5e9" title="다운로드 & 단축키" body="라이트박스 ⬇로 원본 저장 · 📦로 ZIP 일괄 받기. 라이트박스 단축키: ← → 이동 · + − 줌 · 0 원래 크기 · Space 선택 · F 찜하기 · Esc 닫기" />
        </div>

        <div style={{
          marginTop: 18, padding: '12px 14px',
          background: '#f3f3f5', borderRadius: 10, fontSize: 12, color: '#6b6b80', lineHeight: 1.7,
        }}>
          준비가 되면 마음에 드는 사진을 선택하고, 수정이 필요하면 핀과 코멘트를 남긴 뒤 하단의 <b style={{ color: '#0a0a0c' }}>리뷰 제출</b> 버튼을 눌러주세요.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, gap: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b6b80', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={hideToday}
              onChange={e => setHideToday(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            오늘 하루 보지 않기
          </label>
          <button
            onClick={handleClose}
            style={{
              background: '#0a0a0c', color: '#fff', border: 'none',
              padding: '10px 22px', borderRadius: 8,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >닫기 (Close)</button>
        </div>
      </div>
    </div>
  )
}

function Tip({ n, color, title, body }: { n: string; color: string; title: string; body: string }) {
  return (
    <div style={{
      background: '#ffffff', border: '1px solid #e0e0e5', borderRadius: 12,
      padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <div style={{
        flexShrink: 0,
        width: 24, height: 24, borderRadius: '50%',
        background: color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800,
      }}>{n}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 3 }}>{title}</div>
        <p style={{ fontSize: 12, color: '#6b6b80', lineHeight: 1.55 }}>{body}</p>
      </div>
    </div>
  )
}
