'use client'

import { useState } from 'react'
import Link from 'next/link'
import { submitInquiry } from '@/lib/actions/inquiries'
import { STUDIO_SHORT_NAME } from '@/lib/brand'

const CONTACT_EMAIL = 'studio.holymolly@gmail.com'

const SHOOT_TYPES = [
  { value: '프로필·증명', icon: '📸', label: '프로필·증명' },
  { value: '브랜드·룩북', icon: '🧥', label: '브랜드·룩북' },
  { value: '제품', icon: '🫙', label: '제품' },
  { value: '스냅·행사', icon: '🎉', label: '스냅·행사' },
  { value: '기타', icon: '💬', label: '기타' },
]

const BUDGETS = ['아직 미정', '~30만 원', '30~70만 원', '70~150만 원', '150만 원 이상']

export default function InquiryForm() {
  const [shootType, setShootType] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!shootType) {
      setError('촬영 종류를 먼저 선택해 주세요.')
      return
    }
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('shoot_type', shootType)
    const result = await submitInquiry(formData)
    if ('error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="hm-success">
        <div className="mark">🎉</div>
        <h2>홀리몰리! 문의가 접수됐어요</h2>
        <p>
          보내주신 내용은 {STUDIO_SHORT_NAME}가 직접 확인해요.
          <br />
          <strong>24시간 안에</strong> 남겨주신 연락처로 답장드릴게요.
        </p>
        <ul className="hm-next-steps">
          <li><span className="n">1</span>문의 내용 확인</li>
          <li><span className="n">2</span>24시간 내 답장 &amp; 상담</li>
          <li><span className="n">3</span>일정 조율 후 촬영 확정</li>
        </ul>
        <p style={{ fontSize: 13 }}>
          급하신가요? <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--hm-vio)', fontWeight: 700 }}>{CONTACT_EMAIL}</a>
        </p>
        <Link href="/" className="hm-btn hm-btn-ghost" style={{ marginTop: 8 }}>
          ← 홈으로
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="hm-field">
        <span className="hm-label">어떤 촬영인가요?</span>
        <div className="hm-intent-grid" role="radiogroup" aria-label="촬영 종류">
          {SHOOT_TYPES.map(t => (
            <label
              key={t.value}
              className={`hm-intent${shootType === t.value ? ' is-selected' : ''}`}
            >
              <input
                type="radio"
                name="shoot_type_radio"
                value={t.value}
                checked={shootType === t.value}
                onChange={() => setShootType(t.value)}
              />
              <div className="ic" aria-hidden="true">{t.icon}</div>
              <div className="t">{t.label}</div>
            </label>
          ))}
        </div>
      </div>

      <div className="hm-field">
        <label className="hm-label" htmlFor="inq-name">성함</label>
        <input
          id="inq-name"
          name="name"
          className="hm-input"
          required
          maxLength={100}
          placeholder="홍길동"
          autoComplete="name"
        />
      </div>

      <div className="hm-field">
        <label className="hm-label" htmlFor="inq-contact">연락처</label>
        <input
          id="inq-contact"
          name="contact"
          className="hm-input"
          required
          maxLength={200}
          placeholder="이메일 또는 전화번호"
        />
        <p className="hm-hint">답장받기 편한 쪽 하나면 충분해요.</p>
      </div>

      <div className="hm-field">
        <label className="hm-label" htmlFor="inq-date">
          희망 촬영일 <span className="opt">(선택)</span>
        </label>
        <input id="inq-date" name="preferred_date" type="date" className="hm-input" />
        <p className="hm-hint">아직 미정이라면 비워두셔도 돼요.</p>
      </div>

      <div className="hm-field">
        <label className="hm-label" htmlFor="inq-budget">
          예산 범위 <span className="opt">(선택)</span>
        </label>
        <select id="inq-budget" name="budget" className="hm-select" defaultValue="">
          <option value="">선택 안 함</option>
          {BUDGETS.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="hm-field">
        <label className="hm-label" htmlFor="inq-message">문의 내용</label>
        <textarea
          id="inq-message"
          name="message"
          className="hm-textarea"
          required
          maxLength={4000}
          placeholder="예) 5월 중 브랜드 룩북 촬영을 계획하고 있어요. 컷 수는 20컷 정도, 스튜디오 촬영 희망합니다."
        />
        <p className="hm-hint">떠오르는 대로 편하게 적어주세요. 형식은 없어요.</p>
      </div>

      {/* Honeypot — hidden from humans, filled by bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
      />

      {error && <div className="hm-error" role="alert">{error}</div>}

      <button type="submit" className="hm-btn hm-btn-primary" disabled={loading} style={{ width: '100%' }}>
        {loading ? '보내는 중…' : '문의 보내기 →'}
      </button>
      <p className="hm-hint" style={{ textAlign: 'center', marginTop: 12 }}>
        보내주신 정보는 상담 목적으로만 사용해요.
      </p>
    </form>
  )
}
