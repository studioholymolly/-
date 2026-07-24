// ============================================================
// notify-inquiry — 새 문의 접수 알림 (Database Webhook 트리거)
//
// 설정: Supabase 대시보드 → Database → Webhooks → Create
//   - Table: inquiries, Events: INSERT
//   - Type: Supabase Edge Function → notify-inquiry
// 시크릿 (Edge Functions → Secrets):
//   - SLACK_WEBHOOK_URL  (1순위 알림 — 필수 권장)
//   - RESEND_API_KEY     (2순위 이메일 — 선택)
//   - NOTIFY_EMAIL       (수신 이메일, 기본 studio.holymolly@gmail.com)
// 실패해도 접수 자체는 이미 DB에 저장되어 있음 (알림만 분리)
// ============================================================
import { createClient } from 'npm:@supabase/supabase-js@2'

const SLACK_URL = Deno.env.get('SLACK_WEBHOOK_URL') || ''
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') || ''
const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL') || 'studio.holymolly@gmail.com'
const SPIKE_LIMIT = 20 // 최근 1시간 접수가 이 건수를 넘으면 스팸 의심 경고

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    if (payload.type !== 'INSERT' || payload.table !== 'inquiries') {
      return new Response('ignored', { status: 200 })
    }
    const d = payload.record?.data || {}

    // 스팸 급증 감지 (service role — RLS 우회)
    let spikeWarning = ''
    try {
      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      const oneHourAgo = new Date(Date.now() - 3600_000).toISOString()
      const { count } = await admin
        .from('inquiries')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo)
      if ((count || 0) > SPIKE_LIMIT) {
        spikeWarning = `\n⚠️ 최근 1시간 문의 ${count}건 — 스팸 가능성을 확인하세요.`
      }
    } catch (_) { /* 감지 실패는 무시 */ }

    const lines = [
      `📩 *새 촬영 문의가 도착했습니다!*`,
      `• 브랜드: *${d.brand || '-'}*`,
      `• 담당자: ${d.manager || '-'} (${d.contact || '-'}${d.contactPref ? ` · ${d.contactPref} 선호` : ''})`,
      `• 촬영 유형: ${d.shootType || '-'}${d.items ? ` · ${d.items}` : ''}`,
      `• 목적: ${(d.purposes || []).join(', ') || '-'}`,
      `• 희망 촬영일: ${d.shootDate || '협의'} / 결과물 필요일: ${d.dueDate || '협의'}`,
      d.concept ? `• 컨셉: ${String(d.concept).slice(0, 120)}` : '',
      (d.refUrls || []).length ? `• 레퍼런스: ${(d.refUrls || []).join(' , ')}` : '',
      (d.files || []).length ? `• 첨부파일 ${(d.files || []).length}개` : '',
      `→ 대시보드 [문의] 메뉴에서 확인 (예산은 관리자만 표시)${spikeWarning}`,
    ].filter(Boolean)
    const text = lines.join('\n')

    const jobs: Promise<unknown>[] = []

    if (SLACK_URL.startsWith('https://hooks.slack.com/')) {
      jobs.push(fetch(SLACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }))
    }

    if (RESEND_KEY) {
      jobs.push(fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from: 'onboarding@resend.dev', // 커스텀 도메인 확보 시 교체
          to: [NOTIFY_EMAIL],
          subject: `📩 새 촬영 문의 — ${d.brand || '브랜드 미상'}`,
          text: text.replace(/\*/g, ''),
        }),
      }))
    }

    await Promise.allSettled(jobs)
    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error('notify-inquiry error', e)
    return new Response('error', { status: 500 })
  }
})
