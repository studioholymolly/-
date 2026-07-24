import { useState } from 'react'
import { getConfig, updateConfig, today, addDays } from './data.js'
import { Won } from './ui.jsx'

/* ============================================================
   리마인더 엔진 — 기존 데이터에서 "지금 할 일"을 자동 계산
   - 대부분은 처리하면 저절로 사라짐 (문의 답변, 입금 기록, 백업 체크…)
   - 리뷰 요청·재촬영 제안처럼 상태 변화가 없는 건 ✓ 완료로 지움 (팀 공유)
============================================================ */

// 완료 처리 저장소 — config에 팀 공유로 저장 (한 명이 처리하면 모두에게서 사라짐)
export function dismissReminder(key) {
  const cur = getConfig().remDone || {}
  updateConfig({ remDone: { ...cur, [key]: today() } })
}

const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000)

// s: store 상태 · isAdmin: 금액 리마인더 표시 여부
// 반환: [{key, sev(hi|md|lo), icon, title, sub, n?, amount?, go, doneable}] — 심각도순 정렬
export function buildReminders(s, isAdmin) {
  const t = today()
  const done = (getConfig().remDone || {})
  const out = []
  const live = (s.projects || []).filter((p) => !p.archived)

  // 1. 신규 문의 무응답 — 응답 속도가 성사율을 좌우 (가장 위)
  if (s.inquiryCount > 0) {
    const hrs = s.inquiryOldest ? Math.floor((Date.now() - new Date(s.inquiryOldest)) / 3600000) : null
    out.push({
      key: 'inq', sev: 'hi', icon: '✉',
      title: `신규 문의 ${s.inquiryCount}건 답변 대기`,
      sub: hrs != null ? (hrs < 1 ? '방금 접수 — 빠른 답변이 계약을 만듭니다' : `가장 오래된 건 ${hrs >= 48 ? Math.floor(hrs / 24) + '일' : hrs + '시간'}째 대기 중`) : '',
      n: s.inquiryCount, go: 'inquiries',
    })
  }

  // 2. 촬영 임박 + 계약금 미입금 (관리자)
  if (isAdmin) {
    live.filter((p) => p.shootDate && p.shootDate >= t && daysBetween(t, p.shootDate) <= 3).forEach((p) => {
      const deal = (s.deals || []).find((d) => d.project === p.name)
      if (deal && deal.status === '계약금대기' && !done['deposit:' + p.id]) {
        const dd = daysBetween(t, p.shootDate)
        out.push({
          key: 'deposit:' + p.id, sev: 'hi', icon: '₩',
          title: `계약금 미입금 — ${p.name}`,
          sub: `촬영 ${dd === 0 ? '오늘' : 'D-' + dd} · 입금 확인 후 진행하세요`,
          go: 'money', doneable: true,
        })
      }
    })
  }

  // 3. 백업 누락 (촬영 이후 단계인데 원본/보정본 백업 미체크)
  const noBk = live.filter((p) => ['retouch', 'revise', 'delivered', 'marketing'].includes(p.stage) && (!p.origBackup || !p.editBackup))
  if (noBk.length) {
    out.push({
      key: 'backup', sev: 'hi', icon: '⛨',
      title: `백업 누락 ${noBk.length}건`,
      sub: noBk.slice(0, 2).map((p) => p.name).join(' · ') + (noBk.length > 2 ? ` 외 ${noBk.length - 2}` : ''),
      n: noBk.length, go: 'projects',
    })
  }

  // 4. 미수 잔금 (관리자) — 납품일 +7일 지난 건이 있으면 심각도 상향
  if (isAdmin) {
    const owed = (s.deals || []).filter((d) => (d.balance || 0) > 0)
    if (owed.length) {
      const overdue = owed.filter((d) => {
        const pj = (s.projects || []).find((p) => p.name === d.project)
        const anchor = pj?.deliveredAt || pj?.due
        return anchor && t >= addDays(anchor, 7)
      })
      const sum = owed.reduce((a, d) => a + d.balance, 0)
      const names = (overdue.length ? overdue : owed).slice(0, 2).map((d) => d.client || d.project).join(' · ')
      out.push({
        key: 'balance', sev: overdue.length ? 'hi' : 'md', icon: '₩',
        title: overdue.length ? `잔금 리마인드 보낼 때 — ${names}` : `미수 잔금 ${owed.length}건`,
        sub: overdue.length ? `납품 1주 지남 · 미수 총 ${owed.length}건` : names,
        amount: sum, go: 'money',
      })
    }
    // 5. 세금계산서 미발행 (입금은 확인됨)
    const noTax = (s.deals || []).filter((d) => d.deposit > 0 && !d.taxInvoice)
    if (noTax.length) {
      out.push({
        key: 'notax', sev: 'md', icon: '🧾',
        title: `세금계산서 미발행 ${noTax.length}건`,
        sub: '입금 확인됨 — 완료 당일 발행이 원칙',
        n: noTax.length, go: 'money',
      })
    }
  }

  // 6. 납품 +14일 → 리뷰·소개 요청 (90일 지나면 자동 소멸)
  ;(s.projects || []).filter((p) => p.stage === 'delivered' || p.stage === 'marketing' || p.archived).forEach((p) => {
    const anchor = p.deliveredAt || p.due
    if (!anchor) return
    const d = daysBetween(anchor, t)
    if (d >= 14 && d <= 90 && !done['review:' + p.id]) {
      out.push({
        key: 'review:' + p.id, sev: 'md', icon: '★',
        title: `리뷰·소개 요청할 때 — ${p.client || p.name}`,
        sub: `납품 ${d}일 지남 · 만족했을 때가 골든타임`,
        go: 'studio', doneable: true,
      })
    }
    // 7. 납품 +9개월 → 재촬영 제안 (18개월 지나면 소멸)
    if (d >= 270 && d <= 540 && !done['rebook:' + p.id]) {
      out.push({
        key: 'rebook:' + p.id, sev: 'lo', icon: '↻',
        title: `재촬영 제안할 때 — ${p.client || p.name}`,
        sub: `마지막 촬영 ${Math.floor(d / 30)}개월 전 · 시즌 신상 촬영 제안`,
        go: 'clients', doneable: true,
      })
    }
  })

  // 8. 납품됐는데 마케팅 콘텐츠 없음
  const noContent = live.filter((p) => (p.stage === 'delivered' || p.stage === 'marketing') && !(s.contents || []).some((c) => c.project === p.name))
  if (noContent.length) {
    out.push({
      key: 'nocontent', sev: 'lo', icon: '▷',
      title: `마케팅 콘텐츠 미제작 ${noContent.length}건`,
      sub: noContent.slice(0, 2).map((p) => p.name).join(' · '),
      n: noContent.length, go: 'content',
    })
  }

  const ORD = { hi: 0, md: 1, lo: 2 }
  return out.sort((a, b) => ORD[a.sev] - ORD[b.sev])
}

/* ---- 리마인더 목록 (홈 위젯 · 주간 리뷰 공용) ---- */
export function ReminderList({ items, go, limit = 6, onChange }) {
  const [more, setMore] = useState(false)
  const shown = limit > 0 && !more ? items.slice(0, limit) : items
  return (
    <div className="alist">
      {items.length === 0 && (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 12.5 }}>모두 처리됐습니다 ✓</div>
      )}
      {shown.map((r) => (
        <div key={r.key} className={'arow rem-' + r.sev} onClick={() => go && go(r.go)} style={{ cursor: go ? 'pointer' : 'default' }}>
          <span className="stripe" />
          <span className="rem-ic">{r.icon}</span>
          <span className="tx">{r.title}<small>{r.sub}</small></span>
          {r.amount != null && <span className="c"><Won v={r.amount} /></span>}
          {r.doneable && (
            <button className="btn ghost sm" title="처리 완료 — 팀 전체에서 사라집니다"
              onClick={(e) => { e.stopPropagation(); dismissReminder(r.key); onChange && onChange() }}>✓</button>
          )}
        </div>
      ))}
      {limit > 0 && items.length > limit && !more && (
        <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); setMore(true) }} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
          +{items.length - limit}개 더 보기
        </button>
      )}
    </div>
  )
}
