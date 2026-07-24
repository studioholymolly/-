// 새 촬영 문의 슬랙 알림 — 공개 폼 제출 직후 브라우저가 호출
// 웹훅 URL은 서버(Vercel 환경변수)에만 보관: SLACK_WEBHOOK_URL (https://hooks.slack.com/...)
// 미설정 시 조용히 넘어감 — 접수 자체는 이미 Supabase에 저장되어 있어 알림만 분리
const CUT = (s, n) => String(s || '').slice(0, n)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const url = process.env.SLACK_WEBHOOK_URL || ''
  if (!url.startsWith('https://hooks.slack.com/')) {
    return res.status(200).json({ sent: false, reason: 'env' })
  }

  const d = (req.body && req.body.data) || {}
  if (!d.brand && !d.manager && !d.contact) {
    return res.status(400).json({ error: 'empty inquiry' })
  }

  const lines = [
    '📩 *새 촬영 문의가 도착했습니다!*',
    `• 브랜드: *${CUT(d.brand, 60) || '-'}*`,
    `• 담당자: ${CUT(d.manager, 40) || '-'} (${CUT(d.contact, 60) || '-'}${d.contactPref ? ` · ${CUT(d.contactPref, 20)} 선호` : ''})`,
    `• 촬영 유형: ${CUT(d.shootType, 40) || '-'}${d.items ? ` · ${CUT(d.items, 80)}` : ''}`,
    `• 목적: ${CUT((d.purposes || []).join(', '), 80) || '-'}`,
    `• 희망 촬영일: ${CUT(d.shootDate, 12) || '협의'} / 결과물 필요일: ${CUT(d.dueDate, 12) || '협의'}`,
    d.planStatus ? `• 기획안: ${CUT(d.planStatus, 20)}` : '',
    d.concept ? `• 컨셉: ${CUT(d.concept, 120)}` : '',
    d.fileCount ? `• 첨부 시도 ${Number(d.fileCount) || 0}개` : '',
    '→ 대시보드 [촬영 문의] 메뉴에서 확인 (예산은 관리자만 표시)',
  ].filter(Boolean)

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: lines.join('\n') }),
    })
    return res.status(200).json({ sent: r.ok })
  } catch (e) {
    return res.status(200).json({ sent: false, reason: 'slack error' })
  }
}
