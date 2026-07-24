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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

  if (!process.env.META_ACCESS_TOKEN || !process.env.META_AD_ACCOUNT_ID) {
    return res.status(200).json({ connected: false, reason: 'env' })
  }

  const q = (req.query && req.query.q) || 'overview'
  // 기간 선택 — 광고 효율 페이지의 7/30/90일 필터용 (화이트리스트 외 값은 30일로)
  const PRESETS = ['last_7d', 'last_30d', 'last_90d']
  const preset = PRESETS.includes(req.query && req.query.preset) ? req.query.preset : 'last_30d'
  try {
    if (q === 'overview') {
      const a = await graph(act(), {
        fields: 'name,account_status,currency,amount_spent,balance,spend_cap,funding_source_details{display_string},min_daily_budget',
      })
      return res.status(200).json({ connected: true, account: a })
    }

    if (q === 'campaigns') {
      const c = await graph(`${act()}/campaigns`, {
        fields: `name,status,effective_status,objective,daily_budget,lifetime_budget,created_time,insights.date_preset(${preset}){spend,impressions,reach,frequency,clicks,ctr,cpc,inline_link_clicks,cost_per_inline_link_click,actions}`,
        limit: '100',
      })
      return res.status(200).json({ connected: true, campaigns: c.data || [] })
    }

    if (q === 'daily') {
      const d = await graph(`${act()}/insights`, {
        date_preset: preset,
        time_increment: '1',
        fields: 'spend,impressions,reach,clicks,inline_link_clicks,actions',
      })
      return res.status(200).json({ connected: true, daily: d.data || [] })
    }

    // 게재 위치별 성과 — 릴스/피드/스토리 중 어디서 효율이 나오는지
    if (q === 'placement') {
      const p = await graph(`${act()}/insights`, {
        date_preset: preset,
        breakdowns: 'publisher_platform,platform_position',
        fields: 'spend,impressions,clicks,inline_link_clicks',
      })
      return res.status(200).json({ connected: true, placement: p.data || [] })
    }

    // 광고 소재 — 캠페인별 썸네일·인스타 링크 (릴스/게시글 구분용)
    if (q === 'ads') {
      const a = await graph(`${act()}/ads`, {
        fields: 'campaign_id,creative.thumbnail_width(256).thumbnail_height(256){thumbnail_url,instagram_permalink_url,object_type}',
        limit: '200',
      })
      return res.status(200).json({ connected: true, ads: a.data || [] })
    }

    // USD→KRW 환율 (무료 API, 하루 1회 갱신이면 충분)
    if (q === 'fx') {
      res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400')
      const r = await fetch('https://open.er-api.com/v6/latest/USD')
      const j = await r.json()
      return res.status(200).json({ connected: true, krw: j?.rates?.KRW || null, updated: j?.time_last_update_utc || null })
    }

    // 최근 30일 전체 합계 — 도달(reach)은 일별 합산 시 중복이라 별도 조회가 정확함
    if (q === 'summary') {
      const s = await graph(`${act()}/insights`, {
        date_preset: preset,
        fields: 'spend,impressions,reach,frequency,clicks,ctr,cpc,inline_link_clicks,cost_per_inline_link_click,actions',
      })
      return res.status(200).json({ connected: true, summary: (s.data && s.data[0]) || null })
    }

    return res.status(400).json({ error: 'unknown q' })
  } catch (e) {
    return res.status(200).json({ connected: false, reason: 'api', message: String(e.message || e) })
  }
}
