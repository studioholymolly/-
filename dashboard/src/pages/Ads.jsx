import { useEffect, useMemo, useState } from 'react'
import { aiEnabled, aiComplete, aiErrorMessage } from '../mollyAI.js'

// 메타 광고 현황 — /api/meta 프록시를 통해 광고 계정·캠페인·지출을 조회 (전 팀원 공개)
// 데이터를 몰라도 읽히도록: 쉬운 말 KPI → 일별 그래프 → 릴스/게시글 비교 → 캠페인 효율 → 상세 표 → 용어 풀이
// 썸네일·릴스 구분은 광고 소재(creative)에서, 원화 표시는 환율 API에서

const MSG_ACTION = 'onsite_conversion.messaging_conversation_started_7d'

function actionCount(actions, type) {
  const a = (actions || []).find((x) => x.action_type === type)
  return a ? Number(a.value) : 0
}

// ---- 통화 표기 ----
const ZERO_DECIMAL = ['KRW', 'JPY', 'VND', 'CLP', 'ISK', 'TWD']
const SYMBOL = { USD: '$', KRW: '₩', EUR: '€', JPY: '¥', GBP: '£' }

function fmtMoney(v, cur = 'USD') {
  const n = Number(v || 0)
  const sym = SYMBOL[cur] || cur + ' '
  if (ZERO_DECIMAL.includes(cur)) return sym + Math.round(n).toLocaleString('ko-KR')
  const digits = n !== 0 && Math.abs(n) < 100 ? 2 : 0
  return sym + n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

// amount_spent·daily_budget은 최소 단위(센트)로 내려옴 — 통화별 환산
function minor(v, cur = 'USD') {
  return Number(v || 0) / (ZERO_DECIMAL.includes(cur) ? 1 : 100)
}

function fmtN(v) { return Number(v || 0).toLocaleString('ko-KR') }

// 부스트(게시물 홍보) 캠페인은 기간이 끝나도 effective_status가 ACTIVE로 남음 — 종료 시각까지 봐야 실제 진행 여부를 앎
function isRunning(c) {
  return c.effective_status === 'ACTIVE' && (!c.stop_time || new Date(c.stop_time) > new Date())
}

const TYPE_LABEL = { reel: '릴스·영상', post: '게시글' }
const TYPE_ICON = { reel: '🎬', post: '🖼' }

const CACHE_KEY = 'ads.cache.v3' // v3: 기간 필터(preset) + 게재 위치(placement) 포함
const PRESETS = ['last_7d', 'last_30d', 'last_90d']
const PRESET_LB = { last_7d: '최근 7일', last_30d: '최근 30일', last_90d: '최근 90일' }

function readCache(preset) {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY + '.' + preset) || 'null')
    if (c?.connected) return { ...c, loading: false }
  } catch {}
  return null
}

export default function Ads() {
  const [preset, setPresetRaw] = useState(() => {
    const p = localStorage.getItem('ads.preset')
    return PRESETS.includes(p) ? p : 'last_30d'
  })
  // 마지막 성공 데이터를 즉시 표시하고 뒤에서 최신으로 갱신 — 탭 진입이 항상 빠르게
  const [state, setState] = useState(() => readCache(preset) || { loading: true })

  function setPreset(p) {
    try { localStorage.setItem('ads.preset', p) } catch {}
    setPresetRaw(p)
  }

  useEffect(() => {
    let dead = false
    setState(readCache(preset) || { loading: true })
    async function load() {
      try {
        const j = await fetch('/api/meta?q=all&preset=' + preset).then((r) => r.json())
        if (dead) return
        if (!j.connected) setState({ loading: false, connected: false, reason: j.reason, message: j.message })
        else {
          const next = {
            loading: false, connected: true, account: j.account,
            campaigns: j.campaigns || [], daily: j.daily || [], summary: j.summary || null,
            placement: j.placement || [], ads: j.ads || [], krwRate: j.krw || null,
          }
          setState(next)
          try { localStorage.setItem(CACHE_KEY + '.' + preset, JSON.stringify(next)) } catch {}
        }
      } catch {
        // 캐시로 이미 그려진 상태면 유지, 아니면 실패 안내
        if (!dead) setState((s) => (s.connected ? s : { loading: false, connected: false, reason: 'fetch' }))
      }
    }
    load()
    return () => { dead = true }
  }, [preset])

  if (state.loading) return <div className="mut" style={{ padding: 24 }}>메타 광고 데이터를 불러오는 중…</div>
  if (!state.connected) return <SetupGuide reason={state.reason} message={state.message} />
  return <Connected {...state} preset={preset} setPreset={setPreset} />
}

function Connected({ account, campaigns, daily, summary, placement, ads, krwRate, preset, setPreset }) {
  const period = PRESET_LB[preset] || '최근 30일'
  const acctCur = account.currency || 'USD'
  // 원화 전환 — 계정이 외화(USD 등)일 때만 토글 노출
  const [showKrw, setShowKrw] = useState(() => localStorage.getItem('ads.showKrw') === '1')
  const canKrw = acctCur !== 'KRW' && !!krwRate
  const useKrw = canKrw && showKrw
  const money = (v) => (useKrw ? fmtMoney(Number(v || 0) * krwRate, 'KRW') : fmtMoney(v, acctCur))
  function toggleKrw() {
    setShowKrw((v) => { localStorage.setItem('ads.showKrw', v ? '0' : '1'); return !v })
  }

  // 캠페인 → 소재(썸네일·릴스/게시글) 매핑
  const adMeta = useMemo(() => {
    const m = {}
    for (const a of ads || []) {
      const cid = a.campaign_id
      const cr = a.creative || {}
      if (!cid || m[cid]) continue
      const link = cr.instagram_permalink_url || ''
      // 인스타는 릴스도 /p/ 링크로 통일해 내려주므로 소재 타입(VIDEO)으로 구분
      m[cid] = {
        thumb: cr.thumbnail_url || '',
        link,
        type: link.includes('/reel/') || cr.object_type === 'VIDEO' ? 'reel' : 'post',
      }
    }
    return m
  }, [ads])
  const hasTypes = Object.keys(adMeta).length > 0

  // 진행 상태 · 릴스/게시글 필터 (비교·표에 적용)
  const [fstatus, setFstatus] = useState('all')
  const [ftype, setFtype] = useState('all')
  const byStatus = fstatus === 'all' ? campaigns : campaigns.filter((c) => (fstatus === 'on') === isRunning(c))
  const filtered = ftype === 'all' ? byStatus : byStatus.filter((c) => adMeta[c.id]?.type === ftype)

  // 선택 기간 합계 — summary가 정확(도달 중복 제거), 없으면 일별 합산으로 대체
  const spend30 = summary ? Number(summary.spend || 0) : daily.reduce((s, d) => s + Number(d.spend || 0), 0)
  const linkClicks30 = summary
    ? Number(summary.inline_link_clicks || 0)
    : daily.reduce((s, d) => s + Number(d.inline_link_clicks || 0), 0)
  const reach30 = summary ? Number(summary.reach || 0) : 0
  const impressions30 = summary ? Number(summary.impressions || 0) : daily.reduce((s, d) => s + Number(d.impressions || 0), 0)
  const frequency30 = summary ? Number(summary.frequency || 0) : 0
  const cpc30 = linkClicks30 > 0 ? spend30 / linkClicks30 : 0
  const ctr30 = impressions30 > 0 ? (linkClicks30 / impressions30) * 100 : 0
  const msg30 = summary
    ? actionCount(summary.actions, MSG_ACTION)
    : daily.reduce((s, d) => s + actionCount(d.actions, MSG_ACTION), 0)
  const active = campaigns.filter(isRunning).length

  return (
    <>
      <div className="notice" style={{ marginBottom: 16 }}>
        <span>⚑</span>
        <span><b>{account.name}</b> · 결제수단: {account.funding_source_details?.display_string || '미등록'} · 누적 지출 {money(minor(account.amount_spent, acctCur))} · 진행 중 캠페인 {active}개</span>
        <span className="sp" />
        {canKrw && (
          <button className="btn sm" onClick={toggleKrw} title={`환율 $1 = ₩${Math.round(krwRate).toLocaleString('ko-KR')} 기준`}>
            {useKrw ? '$ 달러로 보기' : '₩ 원화로 보기'}
          </button>
        )}
        <a className="btn sm" href="https://adsmanager.facebook.com" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>광고 관리자 ↗</a>
        <a className="btn sm" href="https://business.facebook.com/billing_hub/payment_activity" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>결제 내역 ↗</a>
      </div>

      {useKrw && (
        <div className="mut3" style={{ fontSize: 11, marginTop: -10, marginBottom: 12 }}>
          환율 $1 = ₩{Math.round(krwRate).toLocaleString('ko-KR')} (오늘 기준 자동 갱신) — 카드 실제 청구액과는 카드사 환율에 따라 다소 차이가 있을 수 있어요
        </div>
      )}

      {/* 연결은 됐지만 비어 있는 계정 — 환경변수가 다른 계정을 보고 있을 가능성 안내 */}
      {campaigns.length === 0 && Number(account.amount_spent || 0) === 0 && (
        <div className="notice" style={{ marginBottom: 16 }}>
          <span>ℹ️</span>
          <span>
            연결된 <b>{account.name}</b> 계정에는 아직 광고 데이터가 없어요.
            광고 관리자에서 보던 계정과 다르다면, Vercel → Settings → Environment Variables에서
            <code> META_AD_ACCOUNT_ID</code>를 그 계정 번호(광고 관리자 상단의 숫자, 예: 4926…)로 바꾸고 재배포하면 여기에 표시됩니다.
          </span>
        </div>
      )}

      {/* ---- 기간 필터 — 아래 모든 숫자가 이 기간 기준으로 한 번에 바뀜 ---- */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="mut3" style={{ fontSize: 11.5 }}>기간</span>
        {PRESETS.map((p) => (
          <button key={p} className="btn sm" onClick={() => setPreset(p)}
            style={preset === p ? { background: 'var(--fill-strong)', color: '#fff', borderColor: 'var(--fill-strong)' } : {}}>
            {PRESET_LB[p]}
          </button>
        ))}
      </div>

      {/* ---- 한눈에 보기 — 쉬운 말 KPI ---- */}
      <div className="grid" style={{ marginBottom: 14 }}>
        <Kpi cls="col3" label={`${period} 광고비`} value={money(spend30)} sub={`${period} 지출 합계`} />
        <Kpi cls="col3" label="광고를 본 사람" value={fmtN(reach30) + '명'} sub={reach30 ? `한 사람이 평균 ${frequency30.toFixed(1)}번 봄` : '집계 준비 중'} />
        <Kpi cls="col3" label="광고를 누른 횟수" value={fmtN(linkClicks30) + '회'} sub={`본 사람 100명 중 ${ctr30.toFixed(1)}명이 클릭`} />
        <Kpi cls="col3" label="클릭 1번당 비용" value={money(cpc30)} sub={msg30 > 0 ? `DM 문의 시작 ${msg30}건` : '낮을수록 효율이 좋아요'} />
      </div>

      {/* ---- 모듈 그리드 — 한 화면에서 그래프로 훑어보기 ---- */}
      <div className="grid" style={{ marginBottom: 18 }}>
        {/* 일별 그래프 */}
        <div className="card col6" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <b style={{ fontSize: 13.5 }}>날마다 얼마 쓰고, 얼마나 클릭됐나</b>
            <span className="mut3" style={{ fontSize: 11.5 }}>{period} · 막대 = 지출, 검은 선 = 링크 클릭</span>
          </div>
          <DailyChart daily={daily} money={money} />
        </div>

        {/* 게재 위치 — 릴스/피드/스토리 */}
        <PlacementCards placement={placement} money={money} />

        {/* 예산 배분 vs 클릭 성과 */}
        <BudgetVsClicks campaigns={campaigns} />

        {/* 릴스 vs 게시글 */}
        {hasTypes && <ReelVsPost campaigns={campaigns} adMeta={adMeta} money={money} />}
      </div>

      {/* ---- 진행 상태 · 유형 필터 (비교·표 공통) ---- */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['all', '전체'], ['on', '🟢 진행중'], ['off', '⏸ 쉬는 광고']].map(([v, label]) => {
          const cnt = v === 'all' ? campaigns.length : campaigns.filter((c) => (v === 'on') === isRunning(c)).length
          return (
            <button key={v} className="btn sm" onClick={() => setFstatus(v)}
              style={fstatus === v ? { background: 'var(--fill-strong)', color: '#fff', borderColor: 'var(--fill-strong)' } : {}}>
              {label} {cnt}
            </button>
          )
        })}
        {hasTypes && <span style={{ width: 1, height: 18, background: 'var(--line)', margin: '0 4px' }} />}
        {hasTypes && ['all', 'reel', 'post'].map((t) => {
          const cnt = t === 'all' ? byStatus.length : byStatus.filter((c) => adMeta[c.id]?.type === t).length
          return (
            <button key={t} className="btn sm" onClick={() => setFtype(t)}
              style={ftype === t ? { background: 'var(--fill-strong)', color: '#fff', borderColor: 'var(--fill-strong)' } : {}}>
              {t === 'all' ? '유형 전체' : `${TYPE_ICON[t]} ${TYPE_LABEL[t]}`} {cnt}
            </button>
          )
        })}
      </div>

      {/* ---- 캠페인 효율 비교 (선택 기간) ---- */}
      <CampaignCompare campaigns={filtered} adMeta={adMeta} money={money} />

      {/* ---- 역대 효율 랭킹 (전체 기간, 릴스/게시글 따로) ---- */}
      <AllTimeRanking campaigns={campaigns} adMeta={adMeta} money={money} />

      {/* ---- 몰리의 광고 피드백 — 실제 소재 이미지 + 성과 데이터 AI 분석 ---- */}
      <AiFeedback campaigns={campaigns} adMeta={adMeta} />

      {/* ---- 상세 표 ---- */}
      <div className="tbl-wrap" style={{ marginBottom: 18 }}>
        <table className="tb">
          <thead>
            <tr>
              <th>캠페인</th><th>상태</th>
              <th className="r" title="광고를 눌러 프로필·사이트로 이동한 횟수">링크 클릭</th>
              <th className="r" title="클릭 1번을 얻는 데 든 비용 — 낮을수록 좋음">클릭당 비용</th>
              <th className="r" title="광고를 본 사람 중 클릭한 비율 — 높을수록 좋음">클릭률</th>
              <th className="r" title="광고가 닿은 사람 수 (중복 제외)">도달</th>
              <th className="r">지출</th>
              <th className="r">예산</th>
            </tr>
          </thead>
          <tbody>
            {[...filtered]
              .sort((a, b) => Number(b.insights?.data?.[0]?.spend || 0) - Number(a.insights?.data?.[0]?.spend || 0))
              .map((c) => {
                const ins = c.insights?.data?.[0] || {}
                const lc = Number(ins.inline_link_clicks || ins.clicks || 0)
                const cpcUsd = Number(ins.cost_per_inline_link_click || ins.cpc || 0)
                const meta = adMeta[c.id]
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 650, maxWidth: 300 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Thumb meta={meta} size={30} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.name}>{c.name.replace(/^Instagram 게시물: /, '')}</span>
                      </span>
                    </td>
                    <td>{isRunning(c) ? '🟢 진행중' : c.effective_status === 'PAUSED' ? '⏸ 중지' : c.effective_status === 'ACTIVE' ? '✔ 종료' : c.effective_status}</td>
                    <td className="r num">{lc ? fmtN(lc) : '—'}</td>
                    <td className="r num">{cpcUsd ? money(cpcUsd) : '—'}</td>
                    <td className="r num">{ins.ctr ? Number(ins.ctr).toFixed(1) + '%' : '—'}</td>
                    <td className="r num">{ins.reach ? fmtN(ins.reach) : '—'}</td>
                    <td className="r num">{money(Number(ins.spend || 0))}</td>
                    <td className="r num">{c.daily_budget ? money(minor(c.daily_budget, acctCur)) + '/일' : c.lifetime_budget ? money(minor(c.lifetime_budget, acctCur)) : '—'}</td>
                  </tr>
                )
              })}
            {filtered.length === 0 && <tr><td colSpan={8} className="mut" style={{ textAlign: 'center', padding: 20 }}>{campaigns.length === 0 ? '아직 캠페인이 없습니다 — 광고 관리자에서 첫 캠페인을 만들어 보세요' : '이 유형의 캠페인이 없습니다'}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* ---- 용어 풀이 ---- */}
      <Glossary />
    </>
  )
}

// ---- 썸네일 (없으면 유형 아이콘) ----
function Thumb({ meta, size = 28 }) {
  const [err, setErr] = useState(false)
  const box = { width: size, height: size, borderRadius: 6, flex: 'none', border: '1px solid var(--line)', background: 'var(--g1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, overflow: 'hidden' }
  if (!meta?.thumb || err) return <span style={box}>{meta ? TYPE_ICON[meta.type] : '🖼'}</span>
  const img = <img src={meta.thumb} alt="" loading="lazy" onError={() => setErr(true)} style={{ ...box, objectFit: 'cover', display: 'block' }} />
  return meta.link ? <a href={meta.link} target="_blank" rel="noreferrer" title="인스타그램에서 게시물 보기" style={{ display: 'flex', flex: 'none' }}>{img}</a> : img
}

// ---- 게재 위치 — 릴스/피드/스토리 중 어디에 돈이 쓰이고, 어디서 클릭이 나오나 ----
const PLAT_LB = { instagram: '인스타', facebook: '페북', audience_network: 'AN', messenger: '메신저' }
const POS_LB = {
  feed: '피드', instagram_stories: '스토리', instagram_reels: '릴스', instagram_explore: '탐색',
  instagram_explore_home: '탐색 홈', instagram_search: '검색', instagram_profile_feed: '프로필 피드',
  instagram_profile_reels: '프로필 릴스', facebook_reels: '릴스', facebook_stories: '스토리',
  video_feeds: '동영상 피드', instream_video: '인스트림', marketplace: '마켓', right_hand_column: '우측 칼럼',
  search: '검색', an_classic: '클래식', rewarded_video: '리워드', unknown: '기타',
}

function PlaceBar({ label, share, text, strong }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: 8, alignItems: 'center', marginBottom: 6 }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={label}>{label}</div>
      <div style={{ background: 'var(--g1)', borderRadius: 4, height: 16, position: 'relative' }}>
        <div style={{ width: Math.max(2, share) + '%', height: '100%', borderRadius: 4, background: strong ? 'var(--fill-strong)' : 'var(--g4)' }} />
        <span className="num" style={{ position: 'absolute', left: 6, top: 0, lineHeight: '16px', fontSize: 10, fontWeight: 700, color: strong && share > 30 ? '#fff' : 'var(--ink-2)' }}>{text}</span>
      </div>
    </div>
  )
}

function PlacementCards({ placement, money }) {
  const agg = {}
  for (const r of placement || []) {
    const lb = ((PLAT_LB[r.publisher_platform] || r.publisher_platform || '') + ' ' + (POS_LB[r.platform_position] || r.platform_position || '')).trim() || '기타'
    const a = agg[lb] || (agg[lb] = { spend: 0, impr: 0, link: 0 })
    a.spend += Number(r.spend || 0)
    a.impr += Number(r.impressions || 0)
    a.link += Number(r.inline_link_clicks || 0)
  }
  let rows = Object.entries(agg).map(([label, a]) => ({ label, ...a })).sort((a, b) => b.spend - a.spend)
  if (rows.length === 0) return null
  if (rows.length > 6) {
    const rest = rows.slice(5)
    rows = rows.slice(0, 5)
    rows.push({
      label: `기타 ${rest.length}곳`,
      spend: rest.reduce((s, x) => s + x.spend, 0),
      impr: rest.reduce((s, x) => s + x.impr, 0),
      link: rest.reduce((s, x) => s + x.link, 0),
    })
  }
  const maxSpend = Math.max(...rows.map((r) => r.spend), 0.01)
  // 클릭률은 노출이 너무 적으면 왜곡 — 100회 이상만
  const ctrRows = rows.filter((r) => r.impr >= 100)
    .map((r) => ({ label: r.label, ctr: (r.link / r.impr) * 100 }))
    .sort((a, b) => b.ctr - a.ctr)
  const maxCtr = Math.max(...ctrRows.map((r) => r.ctr), 0.01)

  return (
    <>
      <div className="card col3" style={{ padding: 16 }}>
        <div style={{ marginBottom: 10 }}>
          <b style={{ fontSize: 13.5 }}>게재 위치별 지출</b>
          <span className="mut3" style={{ fontSize: 11, display: 'block' }}>릴스·피드·스토리 중 어디에 돈이 쓰였나</span>
        </div>
        {rows.map((r) => (
          <PlaceBar key={r.label} label={r.label} share={(r.spend / maxSpend) * 100} text={money(r.spend)} />
        ))}
      </div>
      <div className="card col3" style={{ padding: 16 }}>
        <div style={{ marginBottom: 10 }}>
          <b style={{ fontSize: 13.5 }}>게재 위치별 클릭률</b>
          <span className="mut3" style={{ fontSize: 11, display: 'block' }}>어디서 클릭이 나왔나 — 높을수록 좋음</span>
        </div>
        {ctrRows.map((r) => (
          <PlaceBar key={r.label} label={r.label} share={(r.ctr / maxCtr) * 100} text={r.ctr.toFixed(2) + '%'} strong />
        ))}
        {ctrRows.length === 0 && <div className="mut3" style={{ fontSize: 12 }}>집계할 노출이 아직 부족해요</div>}
      </div>
    </>
  )
}

// ---- 예산 배분 vs 클릭 성과 — 돈 쓰는 곳에서 클릭이 나오나 ----
function BudgetVsClicks({ campaigns }) {
  const rows = campaigns
    .map((c) => {
      const ins = c.insights?.data?.[0] || {}
      return {
        id: c.id,
        name: c.name.replace(/^Instagram 게시물: /, ''),
        spend: Number(ins.spend || 0),
        clicks: Number(ins.inline_link_clicks || ins.clicks || 0),
      }
    })
    .filter((r) => r.spend > 0 || r.clicks > 0)
    .sort((a, b) => b.spend - a.spend)
  if (rows.length < 2) return null

  let top = rows.slice(0, 6)
  const rest = rows.slice(6)
  if (rest.length) top.push({ id: '_rest', name: `기타 ${rest.length}개`, spend: rest.reduce((s, x) => s + x.spend, 0), clicks: rest.reduce((s, x) => s + x.clicks, 0) })
  const totS = rows.reduce((s, x) => s + x.spend, 0) || 1
  const totC = rows.reduce((s, x) => s + x.clicks, 0) || 1

  return (
    <div className="card col6" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <b style={{ fontSize: 13.5 }}>예산 배분 vs 클릭 성과</b>
        <span className="mut3" style={{ fontSize: 11.5 }}>회색 = 지출 비중, 검정 = 클릭 비중 — 검정이 더 길면 돈값을 하는 광고</span>
      </div>
      {top.map((r) => {
        const ps = (r.spend / totS) * 100
        const pc = (r.clicks / totC) * 100
        const good = pc - ps > 3
        return (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 150px) 1fr auto', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.name}>{r.name}</div>
            <div>
              <div style={{ background: 'var(--g1)', borderRadius: 3, height: 7, marginBottom: 3 }}>
                <div style={{ width: Math.max(1, ps) + '%', height: '100%', borderRadius: 3, background: 'var(--g4)' }} />
              </div>
              <div style={{ background: 'var(--g1)', borderRadius: 3, height: 7 }}>
                <div style={{ width: Math.max(1, pc) + '%', height: '100%', borderRadius: 3, background: 'var(--fill-strong)' }} />
              </div>
            </div>
            <span className="num" style={{ fontSize: 11, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
              {ps.toFixed(0)}% → {pc.toFixed(0)}%{good && <b title="지출 비중보다 클릭 비중이 커요 — 효율이 좋은 광고"> ↑</b>}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---- 릴스 vs 게시글 비교 카드 ----
function ReelVsPost({ campaigns, adMeta, money }) {
  const agg = { reel: { n: 0, spend: 0, clicks: 0 }, post: { n: 0, spend: 0, clicks: 0 } }
  for (const c of campaigns) {
    const t = adMeta[c.id]?.type
    if (!t) continue
    const ins = c.insights?.data?.[0] || {}
    agg[t].n += 1
    agg[t].spend += Number(ins.spend || 0)
    agg[t].clicks += Number(ins.inline_link_clicks || ins.clicks || 0)
  }
  const total = agg.reel.clicks + agg.post.clicks
  if (agg.reel.n + agg.post.n === 0 || total === 0) return null

  return (
    <div className="card col6" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <b style={{ fontSize: 13.5 }}>릴스 vs 게시글, 뭐가 더 잘 되나</b>
        <span className="mut3" style={{ fontSize: 11.5 }}>선택 기간 성과 · 막대 = 전체 클릭에서 차지하는 비중</span>
      </div>
      {['reel', 'post'].map((t) => {
        const a = agg[t]
        const share = total > 0 ? (a.clicks / total) * 100 : 0
        const cpc = a.clicks > 0 ? a.spend / a.clicks : 0
        return (
          <div key={t} style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 10, alignItems: 'center', marginBottom: t === 'reel' ? 10 : 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>{TYPE_ICON[t]} {TYPE_LABEL[t]} <span className="mut3" style={{ fontWeight: 500 }}>{a.n}개</span></div>
            <div style={{ background: 'var(--g1)', borderRadius: 4, height: 20, position: 'relative' }}>
              <div style={{ width: Math.max(2, share) + '%', height: '100%', borderRadius: 4, background: t === 'reel' ? 'var(--fill-strong)' : 'var(--g4)' }} />
              <span className="num" style={{ position: 'absolute', left: 6, top: 0, lineHeight: '20px', fontSize: 10.5, fontWeight: 700, color: t === 'reel' ? '#fff' : 'var(--ink-2)' }}>
                클릭 {fmtN(a.clicks)}회 ({share.toFixed(0)}%)
              </span>
            </div>
            <span className="num mut" style={{ fontSize: 11.5 }}>지출 {money(a.spend)} · 클릭당 {a.clicks ? money(cpc) : '—'}</span>
          </div>
        )
      })}
    </div>
  )
}

// ---- 일별 지출(막대) + 링크 클릭(선) SVG 차트 ----
function DailyChart({ daily, money }) {
  if (!daily || daily.length === 0) return <div className="mut3" style={{ padding: 20 }}>기간 내 지출 데이터가 없습니다</div>

  const W = 720, H = 150, PAD_B = 22, PAD_T = 14
  const n = daily.length
  const gap = 3
  const bw = (W - gap * (n - 1)) / n
  const maxSpend = Math.max(...daily.map((d) => Number(d.spend || 0)), 0.01)
  const maxClicks = Math.max(...daily.map((d) => Number(d.inline_link_clicks || d.clicks || 0)), 1)
  const chartH = H - PAD_B - PAD_T

  const x = (i) => i * (bw + gap)
  const yS = (v) => PAD_T + chartH - (v / maxSpend) * chartH
  const yC = (v) => PAD_T + chartH - (v / maxClicks) * chartH

  const pts = daily.map((d, i) => `${x(i) + bw / 2},${yC(Number(d.inline_link_clicks || d.clicks || 0))}`).join(' ')
  const labelEvery = Math.max(1, Math.ceil(n / 6))
  const md = (s) => (s || '').slice(5).replace('-', '/')

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 460, display: 'block' }}>
        {/* 기준선 */}
        <line x1="0" y1={PAD_T + chartH} x2={W} y2={PAD_T + chartH} stroke="var(--line)" strokeWidth="1" />
        <text x="0" y={PAD_T - 4} fontSize="9.5" fill="var(--ink-3)">최고 지출일 {money(maxSpend)}</text>
        {/* 지출 막대 */}
        {daily.map((d, i) => {
          const v = Number(d.spend || 0)
          const clicks = Number(d.inline_link_clicks || d.clicks || 0)
          return (
            <g key={i}>
              <rect x={x(i)} y={yS(v)} width={bw} height={Math.max(2, PAD_T + chartH - yS(v))} rx="1.5" fill="var(--g4)">
                <title>{`${d.date_start} · 지출 ${money(v)} · 링크 클릭 ${clicks}회`}</title>
              </rect>
              {i % labelEvery === 0 && (
                <text x={x(i) + bw / 2} y={H - 6} fontSize="9.5" fill="var(--ink-3)" textAnchor="middle">{md(d.date_start)}</text>
              )}
            </g>
          )
        })}
        {/* 클릭 꺾은선 */}
        <polyline points={pts} fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        {daily.map((d, i) => (
          <circle key={'c' + i} cx={x(i) + bw / 2} cy={yC(Number(d.inline_link_clicks || d.clicks || 0))} r="2" fill="var(--ink)">
            <title>{`${d.date_start} · 링크 클릭 ${Number(d.inline_link_clicks || d.clicks || 0)}회`}</title>
          </circle>
        ))}
      </svg>
    </div>
  )
}

// ---- 캠페인 효율 비교 — 막대 길이 = 클릭 수, 배지 = 클릭당 비용 평가 ----
function CampaignCompare({ campaigns, adMeta, money }) {
  const rows = campaigns
    .map((c) => {
      const ins = c.insights?.data?.[0] || {}
      const clicks = Number(ins.inline_link_clicks || ins.clicks || 0)
      const spend = Number(ins.spend || 0)
      const cpc = Number(ins.cost_per_inline_link_click || ins.cpc || 0) || (clicks > 0 ? spend / clicks : 0)
      return { id: c.id, name: c.name, running: isRunning(c), clicks, spend, cpc, meta: adMeta[c.id] }
    })
    .filter((r) => r.clicks > 0 || r.spend > 0)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 12)

  if (rows.length === 0) return null

  const maxClicks = Math.max(...rows.map((r) => r.clicks), 1)
  const withCpc = rows.filter((r) => r.cpc > 0)
  const avgCpc = withCpc.length ? withCpc.reduce((s, r) => s + r.cpc, 0) / withCpc.length : 0

  function grade(r) {
    if (!r.cpc || !avgCpc) return null
    if (r.cpc <= avgCpc * 0.85) return { t: '효율 좋음', fill: true }
    if (r.cpc >= avgCpc * 1.25) return { t: '개선 필요', fill: false, dim: true }
    return { t: '보통', fill: false }
  }

  return (
    <div className="card" style={{ marginBottom: 18, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <b style={{ fontSize: 13.5 }}>어떤 광고가 잘 됐나</b>
        <span className="mut3" style={{ fontSize: 11.5 }}>막대 = 링크 클릭 수 · 배지 = 클릭당 비용을 전체 평균({money(avgCpc)})과 비교한 평가 · 상위 {rows.length}개</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {rows.map((r) => {
          const g = grade(r)
          return (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 250px) 1fr auto', gap: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: r.running ? 1 : 0.55 }}>
                <Thumb meta={r.meta} />
                <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.name}>
                  {!r.running && '⏸ '}{r.name.replace(/^Instagram 게시물: /, '')}
                </span>
              </div>
              <div style={{ background: 'var(--g1)', borderRadius: 4, height: 18, position: 'relative' }} title={`링크 클릭 ${fmtN(r.clicks)}회 · 지출 ${money(r.spend)} · 클릭당 ${money(r.cpc)}`}>
                <div style={{ width: Math.max(2, (r.clicks / maxClicks) * 100) + '%', height: '100%', borderRadius: 4, background: g?.fill ? 'var(--fill-strong)' : 'var(--g4)' }} />
                <span className="num" style={{ position: 'absolute', left: 6, top: 0, lineHeight: '18px', fontSize: 10.5, fontWeight: 700, color: g?.fill ? '#fff' : 'var(--ink-2)' }}>
                  {fmtN(r.clicks)}회
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                <span className="num mut" style={{ fontSize: 11.5, minWidth: 52, textAlign: 'right' }}>{r.cpc ? money(r.cpc) + '/클릭' : '—'}</span>
                {g && (
                  <span className="pill" style={g.fill
                    ? { background: 'var(--fill-strong)', color: '#fff', borderColor: 'var(--fill-strong)' }
                    : g.dim ? { color: 'var(--ink-3)', borderStyle: 'dashed' } : {}}>
                    {g.t}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- 역대 효율 랭킹 — 전체 기간(insights_max) 기준, 릴스/게시글 각각 클릭당 비용 낮은 순 ----
const MEDAL = ['🥇', '🥈', '🥉']

function AllTimeRanking({ campaigns, adMeta, money }) {
  const groups = { reel: [], post: [] }
  for (const c of campaigns) {
    const ins = c.insights_max?.data?.[0] || {}
    const clicks = Number(ins.inline_link_clicks || ins.clicks || 0)
    const spend = Number(ins.spend || 0)
    if (clicks <= 0 && spend <= 0) continue // 집행 이력이 없는 캠페인 제외
    const t = adMeta[c.id]?.type
    if (!t) continue
    const cpc = Number(ins.cost_per_inline_link_click || ins.cpc || 0) || (clicks > 0 ? spend / clicks : 0)
    groups[t].push({
      id: c.id, name: c.name, running: isRunning(c),
      clicks, spend, cpc, ctr: Number(ins.ctr || 0), meta: adMeta[c.id],
    })
  }
  // 클릭이 있으면 클릭당 비용 낮은 순, 클릭 0(지출만 있음)은 맨 뒤
  for (const t of ['reel', 'post']) groups[t].sort((a, b) => (a.clicks ? a.cpc : Infinity) - (b.clicks ? b.cpc : Infinity))
  if (groups.reel.length + groups.post.length === 0) return null

  return (
    <div className="card" style={{ marginBottom: 18, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <b style={{ fontSize: 13.5 }}>역대 효율 랭킹</b>
        <span className="mut3" style={{ fontSize: 11.5 }}>지금까지 집행한 모든 광고 · 클릭당 비용이 낮은 순 = 같은 돈으로 더 많은 클릭</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px 24px' }}>
        {['reel', 'post'].map((t) => (
          <div key={t}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
              {TYPE_ICON[t]} {TYPE_LABEL[t]} <span className="mut3" style={{ fontWeight: 500 }}>{groups[t].length}개</span>
            </div>
            {groups[t].length === 0 && <div className="mut3" style={{ fontSize: 12, padding: '8px 0' }}>집행한 {TYPE_LABEL[t]} 광고가 없어요</div>}
            {groups[t].slice(0, 10).map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
                <span className="num" style={{ width: 24, textAlign: 'center', fontSize: i < 3 ? 14 : 11.5, fontWeight: 700, color: 'var(--ink-3)', flex: 'none' }}>
                  {MEDAL[i] || i + 1}
                </span>
                <Thumb meta={r.meta} size={26} />
                <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, opacity: r.running ? 1 : 0.6 }} title={r.name}>
                  {r.name.replace(/^Instagram 게시물: /, '')}
                </span>
                <span style={{ textAlign: 'right', flex: 'none' }}>
                  <b className="num" style={{ fontSize: 12 }}>{r.clicks ? money(r.cpc) + '/클릭' : '클릭 없음'}</b>
                  <span className="num mut3" style={{ display: 'block', fontSize: 10.5 }}>클릭 {fmtN(r.clicks)} · 지출 {money(r.spend)}</span>
                </span>
              </div>
            ))}
            {groups[t].length > 10 && <div className="mut3" style={{ fontSize: 11, marginTop: 6 }}>외 {groups[t].length - 10}개는 상세 표에서 확인</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- 몰리의 광고 피드백 — 소재 이미지(썸네일)를 실제로 보고 성과와 연결해 분석, 주 1회 자동 갱신 ----
const FEEDBACK_KEY = 'ads.aiFeedback.v1'
const WEEK_MS = 7 * 24 * 3600 * 1000

// 썸네일 → base64 이미지 블록 — fbcdn 서명 URL은 Anthropic이 직접 못 가져오므로(400 오류) 우리 서버 프록시로 받아서 데이터로 첨부
async function thumbBlock(url) {
  const r = await fetch('/api/meta?q=img&u=' + encodeURIComponent(url))
  if (!r.ok) throw new Error('thumb fetch failed')
  const blob = await r.blob()
  const dataUrl = await new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = reject
    fr.readAsDataURL(blob)
  })
  const [head, data] = String(dataUrl).split(',')
  const media = (head.match(/data:(.*?);/) || [])[1] || 'image/jpeg'
  return { type: 'image', source: { type: 'base64', media_type: media, data } }
}

function AiFeedback({ campaigns, adMeta }) {
  const [report, setReport] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || 'null') } catch { return null }
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const enabled = aiEnabled()

  // 분석 대상 — 전체 기간 성과가 있고 소재 이미지가 있는 캠페인
  const rows = useMemo(() => {
    const out = []
    for (const c of campaigns) {
      const ins = c.insights_max?.data?.[0] || {}
      const clicks = Number(ins.inline_link_clicks || ins.clicks || 0)
      const spend = Number(ins.spend || 0)
      const m = adMeta[c.id]
      if (spend < 1 || clicks === 0 || !m?.type) continue
      out.push({
        type: m.type,
        caption: c.name.replace(/^Instagram 게시물: /, '').replace(/\s+/g, ' ').slice(0, 100),
        clicks, spend: +spend.toFixed(2),
        cpc: +(Number(ins.cost_per_inline_link_click || ins.cpc) || spend / clicks).toFixed(3),
        ctr: +Number(ins.ctr || 0).toFixed(2), reach: Number(ins.reach || 0),
        thumb: m.thumb,
      })
    }
    return out
  }, [campaigns, adMeta])

  async function generate() {
    if (busy) return
    setBusy(true); setErr('')
    try {
      // 유형별 효율 상위 3 + 하위 3
      const pick = []
      for (const t of ['reel', 'post']) {
        const g = rows.filter((r) => r.type === t).sort((a, b) => a.cpc - b.cpc)
        pick.push(...g.slice(0, 3).map((r) => ({ ...r, group: '효율 상위' })))
        if (g.length > 3) pick.push(...g.slice(-3).map((r) => ({ ...r, group: '효율 하위' })))
      }
      const uniq = [...new Map(pick.map((r) => [r.caption + r.cpc, r])).values()]
      const blocks = [{
        type: 'text',
        text: [
          '아래는 우리 스튜디오의 인스타그램 광고 성과 데이터야. 릴스/게시글별 효율 상위·하위 광고를 뽑았고, 각 광고의 실제 소재 이미지를 첨부했어.',
          '전체 현황: ' + JSON.stringify({ 분석대상: rows.length, 릴스: rows.filter((r) => r.type === 'reel').length, 게시글: rows.filter((r) => r.type === 'post').length }),
          '개별 데이터 (cpc=클릭당 비용 USD·낮을수록 좋음, ctr=클릭률%):',
          JSON.stringify(uniq.map(({ thumb, ...r }) => r)),
        ].join('\n'),
      }]
      let n = 0
      for (const r of uniq) {
        if (!r.thumb || n >= 10) continue
        try {
          const img = await thumbBlock(r.thumb) // 실패한 이미지는 건너뛰고 계속 (URL 만료 등)
          n++
          blocks.push({ type: 'text', text: `[이미지 ${n}] ${r.group} · ${r.type === 'reel' ? '릴스' : '게시글'} · "${r.caption.slice(0, 40)}" · 클릭당 $${r.cpc}` })
          blocks.push(img)
        } catch {}
      }
      const text = await aiComplete({
        system: [
          '너는 "몰리"(🐥) — 제품·화보 촬영 스튜디오 홀리몰리의 광고 크리에이티브 분석가야. 광고의 목적은 잠재 고객(브랜드 담당자)이 광고를 눌러 인스타 프로필로 오게 하는 것.',
          '첨부된 실제 광고 이미지와 성과 수치를 근거로 분석해. 반드시 이미지에서 직접 본 것(구도, 색감, 피사체, 밝기, 텍스트 유무, 첫인상)을 언급할 것.',
          '형식 (마크다운, 한국어, 전체 900자 이내):',
          '## 잘된 광고, 왜 잘됐나 — 이미지에서 관찰한 공통점 2~3개, 각 근거에 어떤 광고인지 명시',
          '## 아쉬운 광고, 왜 아쉬웠나 — 마찬가지로 구체적으로',
          '## 다음 광고는 이렇게 — 실행 가능한 제안 3개 (번호 목록, 각 1~2문장)',
          '주의: 릴스는 썸네일 한 장만 볼 수 있으니 영상 내용은 추측 금지. 데이터에 없는 것은 지어내지 말 것. 말투는 밝고 다정하게, 핵심은 또렷하게.',
        ].join('\n'),
        content: blocks,
        maxTokens: 1300,
      })
      const next = { text, at: Date.now() }
      setReport(next)
      try { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(next)) } catch {}
    } catch (e) {
      console.error('ads feedback:', e)
      const detail = e?.message ? String(e.message).slice(0, 160) : ''
      setErr(aiErrorMessage(e) + (detail ? `\n(상세: ${detail})` : ''))
    } finally {
      setBusy(false)
    }
  }

  // 주 1회 자동 갱신 — 탭에 들어왔을 때 리포트가 없거나 7일 지났으면 새로 분석
  useEffect(() => {
    if (enabled && rows.length >= 4 && !busy && (!report || Date.now() - report.at > WEEK_MS)) generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, rows.length])

  if (!enabled) {
    return (
      <div className="card" style={{ marginBottom: 18, padding: 16 }}>
        <b style={{ fontSize: 13.5 }}>🐥 몰리의 광고 피드백</b>
        <div className="mut" style={{ fontSize: 12.5, marginTop: 6 }}>
          커스텀 → 연동에서 Claude API 키를 넣으면, 몰리가 실제 광고 이미지를 보고 "왜 잘됐는지 · 다음엔 뭘 바꿔야 하는지"를 매주 분석해줘요.
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ marginBottom: 18, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <b style={{ fontSize: 13.5 }}>🐥 몰리의 광고 피드백</b>
        <span className="mut3" style={{ fontSize: 11.5 }}>실제 광고 이미지 + 전체 기간 성과 분석 · 주 1회 자동 갱신</span>
        <span className="sp" />
        {report && <span className="mut3 num" style={{ fontSize: 11 }}>{new Date(report.at).toLocaleDateString('ko-KR')} 분석</span>}
        <button className="btn sm" onClick={generate} disabled={busy}>{busy ? '분석 중…' : '다시 분석'}</button>
      </div>
      {err && <div style={{ fontSize: 12.5, color: '#c0392b', whiteSpace: 'pre-line' }}>{err}</div>}
      {busy && !report && <div className="mut" style={{ fontSize: 12.5 }}>몰리가 광고 이미지를 하나하나 살펴보고 있어요… (30초 정도 걸려요)</div>}
      {report && <Md text={report.text} />}
    </div>
  )
}

// 초간단 마크다운 렌더 — ## 제목 · 목록 · **강조** 만 지원
function Md({ text }) {
  const bold = (s) => s.split(/\*\*(.+?)\*\*/g).map((p, i) => (i % 2 ? <b key={i}>{p}</b> : p))
  return (
    <div style={{ fontSize: 12.5, lineHeight: 1.7 }}>
      {text.split('\n').map((ln, i) => {
        if (ln.startsWith('## ')) return <div key={i} style={{ fontWeight: 700, fontSize: 13, marginTop: i ? 10 : 0 }}>{bold(ln.slice(3))}</div>
        if (/^[-•*] /.test(ln)) return <div key={i} style={{ paddingLeft: 14 }}>· {bold(ln.slice(2))}</div>
        if (/^\d+\. /.test(ln)) return <div key={i} style={{ paddingLeft: 14 }}>{bold(ln)}</div>
        if (!ln.trim()) return null
        return <div key={i}>{bold(ln)}</div>
      })}
    </div>
  )
}

const TERMS = [
  ['도달', '광고가 닿은 사람 수. 같은 사람이 여러 번 봐도 1명으로 셉니다.'],
  ['노출', '광고가 화면에 뜬 총 횟수. 한 사람이 3번 보면 3회.'],
  ['빈도', '한 사람이 광고를 평균 몇 번 봤는지. 노출 ÷ 도달.'],
  ['링크 클릭', '광고를 눌러 프로필이나 사이트로 실제 이동한 횟수.'],
  ['클릭률 (CTR)', '광고를 본 것 중 클릭으로 이어진 비율. 1~2%면 준수, 3% 이상이면 아주 좋음.'],
  ['클릭당 비용 (CPC)', '클릭 1번을 얻는 데 쓴 돈. 낮을수록 같은 돈으로 더 많은 사람을 데려온 것.'],
]

function Glossary() {
  return (
    <div className="card" style={{ padding: 16 }}>
      <b style={{ fontSize: 13.5, display: 'block', marginBottom: 10 }}>용어, 어렵지 않아요</b>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px 18px' }}>
        {TERMS.map(([t, d]) => (
          <div key={t} style={{ fontSize: 12.5, lineHeight: 1.55 }}>
            <b>{t}</b> <span className="mut">— {d}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Kpi({ cls, label, value, sub }) {
  return (
    <div className={'tile ' + cls}>
      <div className="tile-h"><span className="ic">⚑</span><span className="t">{label}</span></div>
      <div className="kfig num" style={{ fontSize: 22 }}>{value}</div>
      <div className="ksub">{sub}</div>
    </div>
  )
}

function SetupGuide({ reason, message }) {
  return (
    <>
      <div className="notice" style={{ marginBottom: 16 }}>
        <span>🔌</span>
        <span><b>메타 광고 계정이 아직 연결되지 않았습니다.</b> 아래 순서대로 한 번만 세팅하면 이 화면에서 지출·성과·결제를 계속 볼 수 있어요.</span>
        {reason === 'api' && <span className="mut3" style={{ fontSize: 11 }}>(API 오류: {message})</span>}
      </div>

      <div className="grid">
        <Step n="1" t="비즈니스 포트폴리오 만들기" cls="col6">
          <a href="https://business.facebook.com" target="_blank" rel="noreferrer">business.facebook.com</a>에서 비즈니스 계정을 만들고
          인스타그램(@studio_holymolly)과 페이스북 페이지를 연결합니다.
        </Step>
        <Step n="2" t="광고 계정 + 결제수단 등록" cls="col6">
          비즈니스 설정 → 광고 계정 → 새로 만들기. 이어서 <b>결제 설정에서 카드를 직접 등록</b>하세요.
          (보안상 카드 등록은 본인이 해야 하는 단계입니다 — PC 웹에서 결제해야 애플 수수료 30%가 안 붙어요.)
        </Step>
        <Step n="3" t="시스템 사용자 토큰 발급" cls="col6">
          비즈니스 설정 → 사용자 → 시스템 사용자 → 만들기 → <b>토큰 생성</b>에서
          <code> ads_read</code> 권한으로 토큰을 발급하고, 자산 할당에서 광고 계정을 연결합니다.
        </Step>
        <Step n="4" t="Vercel 환경변수 입력" cls="col6">
          Vercel 프로젝트 → Settings → Environment Variables에
          <code> META_ACCESS_TOKEN</code>(토큰), <code> META_AD_ACCOUNT_ID</code>(광고 계정 ID, 예: act_123…)를 직접 붙여넣고
          재배포(Redeploy)하면 끝. 토큰은 비밀번호와 같아서 본인이 직접 입력하는 게 안전합니다.
        </Step>
      </div>
    </>
  )
}

function Step({ n, t, cls, children }) {
  return (
    <div className={'card ' + cls} style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}><span className="num" style={{ opacity: 0.5, marginRight: 6 }}>{n}</span>{t}</div>
      <div className="mut" style={{ fontSize: 12.5, lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}
