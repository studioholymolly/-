/* ============================================================
   문의 정보 공용 조각 — 문의함 상세 + 전환된 프로젝트 상세에서 함께 사용
   - 폼 필드(d = inquiry.data)를 섹션별로 정리해서 보여준다
   - 컷수·촬영일 등 핵심은 상단 요약 칩으로 강조
============================================================ */
import { inquiryFileUrl } from './data.js'

async function openInqFile(path) {
  const url = await inquiryFileUrl(path)
  if (url) window.open(url, '_blank')
  else alert('파일 링크 생성에 실패했습니다.')
}

// "슬리피솔 플러스 1종 x 10-13컷 내외" → "10-13컷"
export function cutCount(items) {
  const m = String(items || '').match(/\d+(?:\s*[-~]\s*\d+)?\s*컷/)
  return m ? m[0].replace(/\s+/g, '') : ''
}

// 기획안 상태를 사람이 바로 이해할 수 있는 문장으로
export function planLabel(d) {
  const n = (d.files || []).length
  if (d.planStatus === '기획안 있음') return `기획안 파일 첨부됨${n ? ` (${n}개)` : ''}`
  if (d.planStatus === '가이드 작성') return '기획안 파일 없음 — 아래 가이드 문항으로 대신 작성'
  if (d.planStatus === '상담하며 결정') return '기획안 없음 — 상담하며 결정 원함'
  return d.planStatus || ''
}

/* ---- 상단 요약 칩 — 한눈에 보이는 핵심 (유형·컷수·일정·기획안) ---- */
export function InquirySummary({ d }) {
  const cuts = cutCount(d.items)
  const chips = [
    d.shootType && ['📷', d.shootType],
    cuts && ['🎞', cuts + ' 내외'],
    d.shootDate && ['📅', `촬영 희망 ${d.shootDate.slice(5).replace('-', '/')}`],
    d.dueDate && ['📦', `납품 ${d.dueDate.slice(5).replace('-', '/')}`],
    d.planStatus && ['📋', d.planStatus === '기획안 있음' ? '기획안 있음' : d.planStatus === '가이드 작성' ? '기획안 대신 가이드 작성' : d.planStatus],
  ].filter(Boolean)
  if (!chips.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {chips.map(([ic, label], i) => (
        <span key={i} className="pill line" style={{ fontSize: 12, fontWeight: 650 }}>{ic} {label}</span>
      ))}
    </div>
  )
}

function Row({ k, v, pre }) {
  if (!v) return null
  return (
    <div style={{ display: 'flex', gap: 10, padding: '5px 0' }}>
      <span className="mut3" style={{ width: 92, flex: 'none', fontSize: 12, paddingTop: 1 }}>{k}</span>
      <span style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: pre ? 'pre-wrap' : 'normal', wordBreak: 'break-word', flex: 1, minWidth: 0 }}>{v}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--panel-2)', border: '1px solid var(--line-2)', borderRadius: 10, padding: '9px 14px' }}>
      <div className="mut3" style={{ fontSize: 11, fontWeight: 700, marginBottom: 3, letterSpacing: 0.2 }}>{title}</div>
      {children}
    </div>
  )
}

function FileButtons({ files }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
      {files.map((file, i) => (
        <button key={i} type="button" className="btn sm" style={{ justifyContent: 'flex-start' }} onClick={() => openInqFile(file.path)}>
          📎 {file.name || file.path}
        </button>
      ))}
    </div>
  )
}

/* ---- 문의 본문 — 섹션별 정리 (budget을 넘기면 일정·예산 섹션에 표시) ---- */
export function InquiryInfo({ d, budget }) {
  const cuts = cutCount(d.items)
  const files = d.files || []
  const refUrls = d.refUrls || []
  const planFiles = d.planStatus === '기획안 있음' ? files : []
  const etcFiles = d.planStatus === '기획안 있음' ? [] : files

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Section title="담당자">
        <Row k="브랜드" v={d.brand} />
        <Row k="담당자" v={d.manager} />
        <Row k="연락처" v={d.contact ? `${d.contact}${d.contactPref ? ` · ${d.contactPref} 선호` : ''}` : ''} />
      </Section>

      <Section title="촬영 내용">
        <Row k="촬영 유형" v={d.shootType} />
        <Row k="영상" v={[d.videoLen, d.videoEdit].filter(Boolean).join(' · ')} />
        <Row k="품목·분량" v={d.items && (
          <>
            {d.items} {cuts && <span className="pill solid" style={{ fontSize: 11, marginLeft: 4 }}>{cuts}</span>}
          </>
        )} />
        <Row k="목적·사용처" v={(d.purposes || []).join(', ')} />
        <Row k="컨셉" v={d.concept} pre />
      </Section>

      {(d.planStatus || d.plan) && (
        <Section title="기획안">
          <Row k="상태" v={planLabel(d)} />
          {d.plan && (
            <>
              <Row k="브랜드 소개" v={d.plan.intro} pre />
              <Row k="필수 컷" v={d.plan.shots} pre />
              <Row k="사용처·규격" v={(d.plan.formats || []).join(', ')} />
              <Row k="준비물·모델" v={d.plan.props} pre />
            </>
          )}
          {planFiles.length > 0 && <FileButtons files={planFiles} />}
        </Section>
      )}

      <Section title="일정·예산">
        <Row k="희망 촬영일" v={d.shootDate} />
        <Row k="결과물 필요일" v={d.dueDate} />
        {budget != null && <Row k="예산" v={budget} />}
      </Section>

      {(refUrls.length > 0 || etcFiles.length > 0) && (
        <Section title="레퍼런스·첨부">
          {refUrls.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 0' }}>
              {refUrls.map((u, i) => (
                <a key={i} href={u} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 600, wordBreak: 'break-all' }}>
                  🔗 {u.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              ))}
            </div>
          )}
          {etcFiles.length > 0 && <FileButtons files={etcFiles} />}
        </Section>
      )}

      {d.etc && (
        <Section title="기타 문의">
          <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', padding: '4px 0' }}>{d.etc}</div>
        </Section>
      )}

      {d.planner && (
        <Section title="접수 경로">
          <div style={{ fontSize: 13, padding: '4px 0' }}>📝 기획안 도우미(/planner)를 거쳐 접수된 문의입니다.</div>
        </Section>
      )}

      {/* 캐치올 — 폼에 필드가 새로 생겨도 여기 자동 표시 (원본 row에 있는데 화면에 없는 정보 방지) */}
      <UnknownFields d={d} />
    </div>
  )
}

// 위 섹션들이 이미 표시하는 키 — 이 목록에 없는 키가 row에 있으면 아래에 원본 그대로 노출
const KNOWN_KEYS = new Set([
  'at', 'id', 'brand', 'manager', 'contact', 'contactPref', 'shootType',
  'videoLen', 'videoEdit', 'items', 'purposes', 'concept', 'planStatus', 'plan',
  'shootDate', 'dueDate', 'refUrls', 'files', 'etc', 'submittedAt', 'planner', 'hp',
])

function UnknownFields({ d }) {
  const extras = Object.entries(d || {}).filter(([k, v]) => {
    if (KNOWN_KEYS.has(k)) return false
    if (v == null || v === '' || v === false) return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  })
  if (!extras.length) return null
  const show = (v) => typeof v === 'string' ? v
    : Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(', ')
    : typeof v === 'object' ? JSON.stringify(v, null, 1)
    : String(v)
  return (
    <Section title="기타 데이터 (폼 추가 항목)">
      {extras.map(([k, v]) => <Row key={k} k={k} v={show(v)} pre />)}
    </Section>
  )
}
