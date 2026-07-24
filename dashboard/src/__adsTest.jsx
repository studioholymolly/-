// Ads 페이지 시각 검증용 목데이터 하네스 — /__ads_test.html 에서만 사용 (배포 번들에 포함되지 않음)
import { createRoot } from 'react-dom/client'
import Ads from './pages/Ads.jsx'
import './styles.css'

const DAYS = 30
const today = new Date('2026-07-12')
const daily = Array.from({ length: DAYS }, (_, i) => {
  const d = new Date(today); d.setDate(d.getDate() - (DAYS - 1 - i))
  const date = d.toISOString().slice(0, 10)
  const spend = (3 + Math.sin(i / 3) * 2 + (i % 7 === 5 ? 4 : 0) + Math.random() * 2).toFixed(2)
  const clicks = Math.round(Number(spend) * (6 + Math.random() * 5))
  return {
    date_start: date, date_stop: date, spend,
    impressions: String(clicks * 20), reach: String(clicks * 15),
    clicks: String(clicks + 3), inline_link_clicks: String(clicks),
    actions: i % 6 === 0 ? [{ action_type: 'onsite_conversion.messaging_conversation_started_7d', value: '1' }] : [],
  }
})

const mkCampaign = (id, name, status, spend, clicks, reach, budget, running = false) => ({
  id, name, status, effective_status: status, objective: 'OUTCOME_TRAFFIC',
  daily_budget: budget,
  // 부스트 캠페인은 종료돼도 ACTIVE로 남음 — stop_time으로 진행 여부 구분
  stop_time: running ? '2099-01-01T00:00:00+0900' : '2026-07-01T00:00:00+0900',
  insights_max: { data: [{
    spend: (spend * 4).toFixed(2), impressions: String(Math.round((clicks * 4) / 0.05)),
    reach: String(reach * 4), clicks: String(clicks * 4 + 16),
    ctr: '4.10', cpc: (spend / clicks).toFixed(2),
    inline_link_clicks: String(clicks * 4), cost_per_inline_link_click: (spend / clicks).toFixed(2),
  }] },
  insights: { data: [{
    spend: String(spend), impressions: String(Math.round(clicks / 0.05)),
    reach: String(reach), frequency: '1.21', clicks: String(clicks + 4),
    ctr: (clicks / (clicks / 0.05) * 100).toFixed(2), cpc: (spend / clicks).toFixed(2),
    inline_link_clicks: String(clicks), cost_per_inline_link_click: (spend / clicks).toFixed(2),
    actions: [],
  }] },
})

const campaigns = [
  mkCampaign('1', 'Instagram 게시물: Traces of an Italian Journey 〰️...', 'ACTIVE', 12.28, 156, 1981, '1500', true),
  mkCampaign('2', 'Instagram 게시물: For @ontm.official...', 'ACTIVE', 12.5, 63, 1316, '1500'),
  mkCampaign('3', 'Instagram 게시물: For @kurved.kr...', 'PAUSED', 9.84, 48, 926, '1000'),
  mkCampaign('4', 'Instagram 게시물: For @athanbe_official...', 'ACTIVE', 14.88, 137, 2093, '1500'),
  mkCampaign('5', 'Instagram 게시물: For. @anillo_official ❤️...', 'ACTIVE', 14.91, 284, 3633, '1500', true),
  mkCampaign('6', 'Instagram 게시물: For @melixirskincare...', 'ACTIVE', 14.93, 92, 1282, '1500'),
  mkCampaign('7', 'Instagram 게시물: 🔥 핫하다 핫해! 우지커피 신메뉴 촬영...', 'ACTIVE', 14.87, 294, 3813, '1500'),
]

const sumN = (k) => daily.reduce((s, d) => s + Number(d[k] || 0), 0)
const summary = {
  spend: sumN('spend').toFixed(2), impressions: String(sumN('impressions')),
  reach: String(Math.round(sumN('reach') * 0.7)), frequency: '2.58',
  clicks: String(sumN('clicks')), inline_link_clicks: String(sumN('inline_link_clicks')),
  ctr: '5.09', cpc: (sumN('spend') / sumN('inline_link_clicks')).toFixed(2),
  actions: [{ action_type: 'onsite_conversion.messaging_conversation_started_7d', value: '5' }],
}

// 썸네일 목업 — 회색조 data URI (캠페인 id별 명도 차이)
const thumb = (i) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="hsl(0,0%,${40 + i * 7}%)"/><text x="32" y="38" font-size="20" text-anchor="middle" fill="#fff">${i}</text></svg>`)

const ads = campaigns.map((c, i) => ({
  id: 'ad' + c.id,
  campaign_id: c.id,
  creative: {
    thumbnail_url: i === 2 ? '' : thumb(i + 1), // 3번째는 썸네일 없음(폴백 아이콘 확인)
    instagram_permalink_url: i % 2 === 0 ? `https://www.instagram.com/reel/AB${i}/` : `https://www.instagram.com/p/CD${i}/`,
    object_type: i % 2 === 0 ? 'VIDEO' : 'SHARE',
  },
}))

const account = {
  name: '홀리몰리 광고 계정', currency: 'USD', amount_spent: '193512',
  funding_source_details: { display_string: 'Visa ····1234' },
}

// 게재 위치 목데이터 — 릴스/피드/스토리 효율 카드 확인용
const placement = [
  ['instagram', 'instagram_reels', 18.4, 40200, 610],
  ['instagram', 'feed', 11.2, 26800, 260],
  ['instagram', 'instagram_stories', 4.9, 12100, 95],
  ['instagram', 'instagram_explore', 2.1, 6200, 31],
  ['facebook', 'feed', 1.8, 5100, 14],
  ['facebook', 'facebook_reels', 1.1, 3600, 9],
  ['audience_network', 'an_classic', 0.4, 1900, 2],
].map(([pp, pos, spend, impr, link]) => ({
  publisher_platform: pp, platform_position: pos,
  spend: String(spend), impressions: String(impr),
  clicks: String(link + 4), inline_link_clicks: String(link),
}))

const RESP = {
  all: { connected: true, account, campaigns, daily, summary, placement, ads, krw: 1384.5 },
  overview: { connected: true, account },
  campaigns: { connected: true, campaigns },
  daily: { connected: true, daily },
  summary: { connected: true, summary },
  ads: { connected: true, ads },
  fx: { connected: true, krw: 1384.5 },
}

const realFetch = window.fetch.bind(window)
window.fetch = (url, opts) => {
  const m = String(url).match(/^\/api\/meta\?q=(\w+)/)
  if (m) return Promise.resolve({ json: () => Promise.resolve(RESP[m[1]] || {}) })
  return realFetch(url, opts)
}

createRoot(document.getElementById('root')).render(<Ads />)
