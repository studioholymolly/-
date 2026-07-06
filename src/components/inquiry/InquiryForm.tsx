'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { submitInquiry } from '@/lib/actions/inquiries'
import LogoSymbol from '@/components/brand/LogoSymbol'
import { STUDIO_SHORT_NAME } from '@/lib/brand'

const CONTACT_EMAIL = 'studio.holymolly@gmail.com'

const SHOOT_TYPES = ['뷰티', '제품', 'F&B', '의류', '인물', '영상', 'BX 디자인', '기타']
const BUDGETS = ['150~300만 원', '300~500만 원', '500~1,000만 원', '1,000만 원 이상', '아직 미정']

// 노션 빠른 입력 폼과 같은 방식: 필수 항목만 한 화면씩.
const STEPS = [
  { key: 'type', label: '작업 종류' },
  { key: 'project', label: '프로젝트' },
  { key: 'detail', label: '예산·참고 자료' },
  { key: 'contact', label: '연락처' },
  { key: 'message', label: '문의 내용' },
] as const

export default function InquiryForm() {
  const [step, setStep] = useState(0)
  const [shootType, setShootType] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function fieldsValid(names: string[]): boolean {
    const form = formRef.current
    if (!form) return false
    for (const name of names) {
      const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null
      if (el && 'reportValidity' in el && !el.reportValidity()) return false
    }
    return true
  }

  function next() {
    setError('')
    if (step === 0 && !shootType) {
      setError('작업 종류를 선택해 주세요.')
      return
    }
    if (step === 1 && !fieldsValid(['project_name'])) return
    if (step === 3 && !fieldsValid(['name', 'contact'])) return
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setError('')
    setStep(s => Math.max(s - 1, 0))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!fieldsValid(['message'])) return
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
        <LogoSymbol size={48} className="hm-success-symbol" />
        <h2 className="mark">
          감사합니다.
          <br />
          문의가 접수되었습니다.
        </h2>
        <p>
          보내주신 내용은 {STUDIO_SHORT_NAME}가 직접 확인하고,
          <br />
          <strong>24시간 안에</strong> 남겨주신 연락처로 답장드립니다.
        </p>
        <ul className="hm-next-steps">
          <li><span className="n hm-display">01</span>문의 내용 확인</li>
          <li><span className="n hm-display">02</span>24시간 내 답장 &amp; 상담</li>
          <li><span className="n hm-display">03</span>일정 조율 후 촬영 확정</li>
        </ul>
        <p style={{ fontSize: 13 }}>
          급하신가요?{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--hm-ink)', fontWeight: 700, textDecoration: 'underline' }}>
            {CONTACT_EMAIL}
          </a>
        </p>
        <Link href="/" className="hm-btn hm-btn-ghost" style={{ marginTop: 8 }}>
          ← 홈으로
        </Link>
      </div>
    )
  }

  const isLast = step === STEPS.length - 1

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      {/* step indicator */}
      <div className="hm-fsteps" aria-label={`단계 ${step + 1} / ${STEPS.length}`}>
        <span className="hm-fsteps-count hm-display">
          {String(step + 1).padStart(2, '0')} <span className="of">/ {String(STEPS.length).padStart(2, '0')}</span>
        </span>
        <span className="hm-fsteps-label">{STEPS[step].label}</span>
        <div className="hm-fsteps-bar" aria-hidden="true">
          <div className="fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      {/* 01 — 작업 종류 */}
      <div style={{ display: step === 0 ? 'block' : 'none' }}>
        <div className="hm-field">
          <span className="hm-label">어떤 작업인가요?</span>
          <div className="hm-intent-grid" role="radiogroup" aria-label="작업 종류">
            {SHOOT_TYPES.map(t => (
              <label
                key={t}
                className={`hm-intent${shootType === t ? ' is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="shoot_type_radio"
                  value={t}
                  checked={shootType === t}
                  onChange={() => { setShootType(t); setError('') }}
                />
                <div className="t">{t}</div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 02 — 프로젝트 */}
      <div style={{ display: step === 1 ? 'block' : 'none' }}>
        <div className="hm-field">
          <label className="hm-label" htmlFor="inq-project">프로젝트명 / 브랜드명</label>
          <input
            id="inq-project"
            name="project_name"
            className="hm-input"
            required={step === 1}
            maxLength={200}
            placeholder="예) 라라 코스메틱 신제품 화보"
          />
        </div>
        <div className="hm-field">
          <label className="hm-label" htmlFor="inq-date">
            희망 촬영일 <span className="opt">(선택)</span>
          </label>
          <input id="inq-date" name="preferred_date" type="date" className="hm-input" />
          <p className="hm-hint">아직 미정이라면 비워두셔도 돼요.</p>
        </div>
        <div className="hm-field">
          <label className="hm-label" htmlFor="inq-delivery">
            납품 희망일 <span className="opt">(선택)</span>
          </label>
          <input id="inq-delivery" name="delivery_date" type="date" className="hm-input" />
        </div>
      </div>

      {/* 03 — 예산·참고 자료 */}
      <div style={{ display: step === 2 ? 'block' : 'none' }}>
        <div className="hm-field">
          <label className="hm-label" htmlFor="inq-budget">
            예산 범위 <span className="opt">(선택)</span>
          </label>
          <div className="hm-select-wrap">
            <select id="inq-budget" name="budget" className="hm-select" defaultValue="">
              <option value="">선택 안 함</option>
              {BUDGETS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="hm-field">
          <label className="hm-label" htmlFor="inq-reference">
            기획안 · 참고 자료 <span className="opt">(선택)</span>
          </label>
          <input
            id="inq-reference"
            name="reference_url"
            className="hm-input"
            maxLength={500}
            placeholder="기획안·레퍼런스 링크 (구글 드라이브, 노션 등)"
            inputMode="url"
          />
          <p className="hm-hint">
            PDF·PPT 등 파일은 링크로 공유해 주세요. 이메일로 직접 보내주셔도 됩니다.
          </p>
        </div>
      </div>

      {/* 04 — 연락처 */}
      <div style={{ display: step === 3 ? 'block' : 'none' }}>
        <div className="hm-field">
          <label className="hm-label" htmlFor="inq-name">성함</label>
          <input
            id="inq-name"
            name="name"
            className="hm-input"
            required={step === 3}
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
            required={step === 3}
            maxLength={200}
            placeholder="이메일 또는 전화번호"
          />
          <p className="hm-hint">답장받기 편한 쪽 하나면 충분해요.</p>
        </div>
      </div>

      {/* 05 — 문의 내용 */}
      <div style={{ display: step === 4 ? 'block' : 'none' }}>
        <div className="hm-field">
          <label className="hm-label" htmlFor="inq-message">문의 내용</label>
          <textarea
            id="inq-message"
            name="message"
            className="hm-textarea"
            required={step === 4}
            maxLength={4000}
            placeholder="예) 신제품 런칭 화보와 상세페이지 컷을 준비하고 있어요. 9월 중 촬영 희망합니다."
          />
          <p className="hm-hint">떠오르는 대로 편하게 적어주세요. 형식은 없어요.</p>
        </div>
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

      <div className="hm-fsteps-nav">
        {step > 0 ? (
          <button type="button" className="hm-btn hm-btn-ghost" onClick={back}>
            ← 이전
          </button>
        ) : <span />}
        {isLast ? (
          <button type="submit" className="hm-btn hm-btn-primary" disabled={loading}>
            {loading ? '보내는 중…' : '문의 보내기 →'}
          </button>
        ) : (
          <button type="button" className="hm-btn hm-btn-primary" onClick={next}>
            다음 →
          </button>
        )}
      </div>
      <p className="hm-hint" style={{ textAlign: 'center', marginTop: 14 }}>
        보내주신 정보는 상담 목적으로만 사용해요.
      </p>
    </form>
  )
}
