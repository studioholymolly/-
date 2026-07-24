// Meta Marketing API 프록시 — 토큰은 서버(Vercel 환경변수)에만 보관, 브라우저에 노출되지 않음
// 필요 환경변수: META_ACCESS_TOKEN (시스템 사용자 토큰), META_AD_ACCOUNT_ID (예: act_1234567890)
const V = 'v23.0'

async function graph(path, params = {}) {
  const token = process.env.META_ACCESS_TOKEN
  const qs = new URLSearchParams({ ...params, access_token: token }).toString()
  const r = await fetch(`https://graph.facebook.com/${V}/${path}?${qs}`)
  const j = await r.json()
  if (j.error) throw new Error(j.error.message || 'Meta API error')
  return j
}

function act() {
  const id = process.env.META_AD_ACCOUNT_ID || ''
  return id.startsWith('act_') ? id : 'act_' + id
}

// 목록이 limit을 넘으면 다음 페이지까지 따라가서 전부 수집 (역대 랭킹은 전체가 필요)
async function graphAll(path, params = {}, maxPages = 5) {
  let j = await graph(path, params)
  const data = j.data || []
  let next = j.paging?.next
  for (let i = 1; i < maxPages && next; i++) {
    const r = await fetch(next) // next URL에 토큰 포함되어 내려옴
    j = await r.json()
    if (j.error) break
    data.push(...(j.data || []))
    next = j.paging?.next
  }
  return { data }
}

// 기간 프리셋 — 광고 탭의 7/30/90일 필터 (화이트리스트 외 값은 30일)
const PRESETS = ['last_7d', 'last_30d', 'last_90d']

const F = {
  overview: 'name,account_status,currency,amount_spent,balance,spend_cap,funding_source_details{display_string},min_daily_budget',
  // insights = 선택 기간, insights_max = 전체 기간 (역대 효율 랭킹용)
  campaigns: (preset) => `name,status,effective_status,objective,daily_budget,lifetime_budget,created_time,stop_time,insights.date_preset(${preset}){spend,impressions,reach,frequency,clicks,ctr,cpc,inline_link_clicks,cost_per_inline_link_click,actions},insights.date_preset(maximum).as(insights_max){spend,impressions,reach,clicks,ctr,cpc,inline_link_clicks,cost_per_inline_link_click}`,
  insights: 'spend,impressions,reach,frequency,clicks,ctr,cpc,inline_link_clicks,cost_per_inline_link_click,actions',
  daily: 'spend,impressions,reach,clicks,inline_link_clicks,actions',
  placement: 'spend,impressions,clicks,inline_link_clicks',
  ads: 'campaign_id,creative.thumbnail_width(256).thumbnail_height(256){thumbnail_url,instagram_permalink_url,object_type}',
}

async function fetchFx() {
  const r = await fetch('https://open.er-api.com/v6/latest/USD')
  const j = await r.json()
  return j?.rates?.KRW || null
}

export default async function handler(req, res) {
  // CDN 5분 캐시 + 하루 동안 stale 즉시 응답(백그라운드 갱신) — 탭 진입이 항상 빠르게
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')

  if (!process.env.META_ACCESS_TOKEN || !process.env.META_AD_ACCOUNT_ID) {
    return res.status(200).json({ connected: false, reason: 'env' })
  }

  const q = (req.query && req.query.q) || 'overview'
  const preset = PRESETS.includes(req.query && req.query.preset) ? req.query.preset : 'last_30d'
  try {
    // 통합 조회 — 프론트가 요청 1번으로 전부 받아감 (함수 1번 실행, 메타 API는 서버에서 병렬)
    if (q === 'all') {
      const [account, cp, dl, sm, pl, ad, krw] = await Promise.all([
        graph(act(), { fields: F.overview }), // 이것만 실패하면 연결 안 된 것으로 처리 (outer catch)
        graphAll(`${act()}/campaigns`, { fields: F.campaigns(preset), limit: '100' }).catch(() => null),
        graph(`${act()}/insights`, { date_preset: preset, time_increment: '1', fields: F.daily }).catch(() => null),
        graph(`${act()}/insights`, { date_preset: preset, fields: F.insights }).catch(() => null),
        // 게재 위치별 성과 — 릴스/피드/스토리 중 어디서 효율이 나오는지
        graph(`${act()}/insights`, { date_preset: preset, breakdowns: 'publisher_platform,platform_position', fields: F.placement }).catch(() => null),
        graphAll(`${act()}/ads`, { fields: F.ads, limit: '50' }, 10).catch(() => null),
        fetchFx().catch(() => null),
      ])
      return res.status(200).json({
        connected: true, account, preset,
        campaigns: cp?.data || [], daily: dl?.data || [],
        summary: (sm?.data && sm.data[0]) || null, placement: pl?.data || [],
        ads: ad?.data || [], krw,
      })
    }

    if (q === 'overview') {
      const a = await graph(act(), { fields: F.overview })
      return res.status(200).json({ connected: true, account: a })
    }

    if (q === 'campaigns') {
      const c = await graphAll(`${act()}/campaigns`, { fields: F.campaigns(preset), limit: '100' })
      return res.status(200).json({ connected: true, campaigns: c.data || [] })
    }

    if (q === 'daily') {
      const d = await graph(`${act()}/insights`, {
        date_preset: preset,
        time_increment: '1',
        fields: F.daily,
      })
      return res.status(200).json({ connected: true, daily: d.data || [] })
    }

    // 게재 위치별 성과 단독 조회
    if (q === 'placement') {
      const p = await graph(`${act()}/insights`, {
        date_preset: preset,
        breakdowns: 'publisher_platform,platform_position',
        fields: F.placement,
      })
      return res.status(200).json({ connected: true, placement: p.data || [] })
    }

    // 광고 소재 — 캠페인별 썸네일·인스타 링크 (릴스/게시글 구분용)
    if (q === 'ads') {
      const a = await graphAll(`${act()}/ads`, { fields: F.ads, limit: '50' }, 10)
      return res.status(200).json({ connected: true, ads: a.data || [] })
    }

    // 소재 썸네일 프록시 — 브라우저 CORS·서명 URL 문제 없이 이미지를 받아 AI 분석에 첨부하기 위함
    // 페이스북 CDN 호스트만 허용 (오픈 프록시 방지)
    if (q === 'img') {
      const u = (req.query && req.query.u) || ''
      let host = ''
      try { host = new URL(u).hostname } catch {}
      if (!/(^|\.)(fbcdn\.net|fbsbx\.com|facebook\.com)$/.test(host)) {
        return res.status(400).json({ error: 'bad host' })
      }
      const r = await fetch(u)
      if (!r.ok) return res.status(404).json({ error: 'fetch failed' })
      const buf = Buffer.from(await r.arrayBuffer())
      res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg')
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400')
      return res.status(200).send(buf)
    }

    // USD→KRW 환율 (무료 API, 하루 1회 갱신이면 충분)
    if (q === 'fx') {
      res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400')
      const krw = await fetchFx()
      return res.status(200).json({ connected: true, krw })
    }

    // 선택 기간 전체 합계 — 도달(reach)은 일별 합산 시 중복이라 별도 조회가 정확함
    if (q === 'summary') {
      const s = await graph(`${act()}/insights`, {
        date_preset: preset,
        fields: F.insights,
      })
      return res.status(200).json({ connected: true, summary: (s.data && s.data[0]) || null })
    }

    return res.status(400).json({ error: 'unknown q' })
  } catch (e) {
    return res.status(200).json({ connected: false, reason: 'api', message: String(e.message || e) })
  }
}
