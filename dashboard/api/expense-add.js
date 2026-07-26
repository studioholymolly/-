// 지출 등록 API — Claude(에이전트)가 영수증 캡처를 보고 지출을 자동 등록하는 전용 엔드포인트
// 인증: EXPENSE_API_TOKEN (Vercel 환경변수) — 미설정 시 닫힘(fail-closed)
// 필요 환경변수: EXPENSE_API_TOKEN, SUPABASE_SERVICE_ROLE_KEY
// GET도 허용하는 이유: 에이전트 실행 환경의 프록시가 외부 POST를 막는 경우
// Vercel MCP의 fetch(GET 전용)로 호출할 수 있게 하기 위한 폴백이다.
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'node:crypto'

const SUPABASE_URL = 'https://nzutcgwrknvgogsuphpr.supabase.co'
const CATS = new Set(['고정비', '변동비'])
const MAX_AMOUNT = 100_000_000_000 // 1천억 — 오타 방지 상한

function tokenOk(req) {
  const expected = process.env.EXPENSE_API_TOKEN
  if (!expected) return false
  const got = String(req.headers['x-expense-token'] || req.query?.token || '')
  const a = Buffer.from(got)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// 한국 시간 기준 YYYY-MM (서버는 UTC — 자정 무렵 하루/한 달 밀림 방지)
function currentMonthKST() {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 7)
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'POST 또는 GET만 지원합니다.' })
  }
  if (!process.env.EXPENSE_API_TOKEN || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: '지출 등록 API가 아직 활성화되지 않았습니다. (환경변수 미설정)' })
  }
  if (!tokenOk(req)) return res.status(401).json({ error: '인증 실패' })

  const src = req.method === 'POST' ? (req.body || {}) : (req.query || {})
  const name = String(src.name || '').trim()
  const amount = Number(src.amount)
  const cat = String(src.cat || '변동비')
  const month = String(src.month || currentMonthKST())
  const memo = String(src.memo || '').trim()

  if (!name || name.length > 100) return res.status(400).json({ error: '항목명(name)이 없거나 너무 깁니다.' })
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return res.status(400).json({ error: '금액(amount)이 올바르지 않습니다.' })
  }
  if (!CATS.has(cat)) return res.status(400).json({ error: 'cat은 고정비/변동비만 가능합니다.' })
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return res.status(400).json({ error: 'month는 YYYY-MM 형식입니다.' })

  try {
    const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    // id는 앱과 같은 포맷 + api 표식 (Money 화면·실시간 구독에 그대로 반영됨)
    const id = 'id' + Date.now().toString(36) + '_api' + Math.random().toString(36).slice(2, 6)
    const item = { id, name, cat, amount: Math.round(amount), month, createdBy: 'api', ...(memo ? { memo } : {}) }
    const { error } = await admin.from('expenses').insert({ id, data: item })
    if (error) return res.status(500).json({ error: '저장 실패: ' + error.message })
    return res.status(200).json({ ok: true, expense: item })
  } catch (e) {
    console.error('expense-add error', e)
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}
