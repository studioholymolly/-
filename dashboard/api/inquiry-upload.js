// 문의 첨부파일 서명 업로드 URL 발급 — supabase/functions/inquiry-upload-url의 Vercel 이식판
// (Supabase Edge Function 미배포 상태라 Vercel 서버 함수로 대체. Turnstile 대신
//  "실존하는 신규 문의 + 1시간 이내 + 파일 수·용량 제한"으로 남용을 제한한다)
// 필요 환경변수: SUPABASE_SERVICE_ROLE_KEY — 미설정 시 업로드는 닫힘(fail-closed)
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nzutcgwrknvgogsuphpr.supabase.co'
const MAX_FILES = 3
const MAX_SIZE = 20 * 1024 * 1024 // 개당 20MB
const MAX_TOTAL = 50 * 1024 * 1024 // 총 50MB
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png', 'image/jpeg', 'image/webp',
])
const EXT_MIME = {
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    return res.status(503).json({ error: '파일 업로드가 아직 활성화되지 않았습니다. 레퍼런스는 링크로 첨부해 주세요.' })
  }

  try {
    const { inquiryId, files } = req.body || {}
    if (!inquiryId || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: '잘못된 요청입니다.' })
    }

    const admin = createClient(SUPABASE_URL, key)

    // 문의 존재 + 신규 상태 + 최근 1시간 내 접수 + 기존 파일 수 확인
    const { data: inq, error: inqErr } = await admin
      .from('inquiries').select('id, data, created_at, status').eq('id', inquiryId).maybeSingle()
    if (inqErr || !inq) return res.status(404).json({ error: '문의를 찾을 수 없습니다.' })
    if (inq.status !== 'new') return res.status(403).json({ error: '이미 처리된 문의입니다.' })
    if (Date.now() - new Date(inq.created_at).getTime() > 3600_000) {
      return res.status(403).json({ error: '업로드 가능 시간이 지났습니다.' })
    }
    const existing = inq.data?.files || []
    if (existing.length + files.length > MAX_FILES) {
      return res.status(400).json({ error: `파일은 최대 ${MAX_FILES}개까지 첨부할 수 있습니다.` })
    }

    // 크기·형식 검증 (일부 브라우저는 ppt/pptx에 빈 MIME을 주므로 확장자로 보정)
    let total = 0
    const mimes = []
    for (const f of files) {
      if (!f?.name || typeof f.size !== 'number') return res.status(400).json({ error: '파일 정보가 올바르지 않습니다.' })
      if (f.size > MAX_SIZE) return res.status(400).json({ error: `"${f.name}" — 파일당 20MB까지 첨부할 수 있습니다.` })
      const ext = String(f.name).split('.').pop()?.toLowerCase() || ''
      const mime = (f.type && f.type !== 'application/octet-stream') ? f.type : (EXT_MIME[ext] || '')
      if (!ALLOWED_MIME.has(mime)) return res.status(400).json({ error: `"${f.name}" — PDF, PPT, 이미지 파일만 첨부할 수 있습니다.` })
      mimes.push(mime)
      total += f.size
    }
    if (total > MAX_TOTAL) return res.status(400).json({ error: '전체 첨부 용량은 50MB까지입니다.' })

    // 랜덤 폴더 경로로 signed upload URL 발급 (경로 추측·덮어쓰기 차단)
    const results = []
    const paths = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      // 스토리지 키는 ASCII만 허용 — 한글 등은 경로에서 제거하고 원본 이름은 name으로 보존
      const rawExt = String(f.name).split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || ''
      const base = String(f.name).replace(/\.[^.]*$/, '').replace(/[^A-Za-z0-9._-]/g, '_')
        .replace(/_+/g, '_').replace(/^_+|_+$/g, '').slice(-60) || 'file'
      const safe = base + (rawExt ? '.' + rawExt : '')
      const path = `${crypto.randomUUID()}/${safe}`
      const { data, error } = await admin.storage.from('inquiry-files').createSignedUploadUrl(path)
      if (error) return res.status(500).json({ error: '업로드 URL 발급에 실패했습니다.' })
      results.push({ path, token: data.token, name: f.name, contentType: mimes[i] })
      paths.push({ path, name: f.name })
    }

    // 발급 경로를 문의 행에 기록 (대시보드 다운로드 · 파기 시 참조)
    const nextData = { ...inq.data, files: [...existing, ...paths] }
    await admin.from('inquiries').update({ data: nextData }).eq('id', inquiryId)

    return res.status(200).json({ uploads: results })
  } catch (e) {
    console.error('inquiry-upload error', e)
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}
