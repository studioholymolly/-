// ============================================================
// inquiry-upload-url — 문의 첨부파일 서명 업로드 URL 발급
//
// 익명 방문자는 스토리지에 직접 접근할 수 없다 (버킷에 anon 정책 없음).
// 이 함수가 Turnstile 검증 후 단기 signed upload URL을 발급하고,
// 발급한 경로를 inquiries.data.files[]에 기록한다 (다운로드·파기에 사용).
//
// 시크릿: TURNSTILE_SECRET_KEY (미설정 시 검증 생략 — 배포 전 설정 권장)
// ============================================================
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const MAX_FILES = 3
const MAX_SIZE = 20 * 1024 * 1024 // 개당 20MB
const MAX_TOTAL = 50 * 1024 * 1024 // 총 50MB
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png', 'image/jpeg', 'image/webp',
])

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const { inquiryId, files, turnstileToken } = await req.json()
    if (!inquiryId || !Array.isArray(files) || files.length === 0) {
      return json({ error: '잘못된 요청입니다.' }, 400)
    }

    // 1) Turnstile 검증 (비용 폭탄 방어의 핵심 게이트)
    // 시크릿 미설정 시 업로드 자체를 닫는다(fail-closed) — 링크 첨부는 항상 가능
    const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
    if (!secret) {
      return json({ error: '파일 업로드가 아직 활성화되지 않았습니다. 레퍼런스는 링크로 첨부해 주세요.' }, 503)
    }
    const vr = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: turnstileToken || '' }),
    }).then((r) => r.json())
    if (!vr.success) return json({ error: '보안 확인에 실패했습니다. 보안 체크를 다시 완료해 주세요.' }, 403)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 2) 문의 존재 + 최근 1시간 내 접수 + 기존 파일 수 확인
    const { data: inq, error: inqErr } = await admin
      .from('inquiries').select('id, data, created_at, status').eq('id', inquiryId).maybeSingle()
    if (inqErr || !inq) return json({ error: '문의를 찾을 수 없습니다.' }, 404)
    if (inq.status !== 'new') return json({ error: '이미 처리된 문의입니다.' }, 403)
    if (Date.now() - new Date(inq.created_at).getTime() > 3600_000) {
      return json({ error: '업로드 가능 시간이 지났습니다.' }, 403)
    }
    const existing: string[] = inq.data?.files || []
    if (existing.length + files.length > MAX_FILES) {
      return json({ error: `파일은 최대 ${MAX_FILES}개까지 첨부할 수 있습니다.` }, 400)
    }

    // 3) 크기·형식 검증 (일부 브라우저는 ppt/pptx에 빈 MIME을 주므로 확장자로 보정)
    const EXT_MIME: Record<string, string> = {
      pdf: 'application/pdf',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
    }
    let total = 0
    const mimes: string[] = []
    for (const f of files) {
      if (!f?.name || typeof f.size !== 'number') return json({ error: '파일 정보가 올바르지 않습니다.' }, 400)
      if (f.size > MAX_SIZE) return json({ error: `"${f.name}" — 파일당 20MB까지 첨부할 수 있습니다.` }, 400)
      const ext = String(f.name).split('.').pop()?.toLowerCase() || ''
      const mime = (f.type && f.type !== 'application/octet-stream') ? f.type : (EXT_MIME[ext] || '')
      if (!ALLOWED_MIME.has(mime)) return json({ error: `"${f.name}" — PDF, PPT, 이미지 파일만 첨부할 수 있습니다.` }, 400)
      mimes.push(mime)
      total += f.size
    }
    if (total > MAX_TOTAL) return json({ error: '전체 첨부 용량은 50MB까지입니다.' }, 400)

    // 4) 랜덤 폴더 경로로 signed upload URL 발급 (경로 추측·덮어쓰기 차단)
    const results = []
    const paths: { path: string; name: string }[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const safe = String(f.name).normalize('NFC').replace(/[^\w가-힣.\- ]/g, '').slice(-80) || 'file'
      const path = `${crypto.randomUUID()}/${safe}`
      const { data, error } = await admin.storage.from('inquiry-files').createSignedUploadUrl(path)
      if (error) return json({ error: '업로드 URL 발급에 실패했습니다.' }, 500)
      results.push({ path, token: data.token, name: f.name, contentType: mimes[i] })
      paths.push({ path, name: f.name })
    }

    // 5) 발급 경로를 문의 행에 기록 (대시보드 다운로드 · 파기 시 참조)
    const nextData = { ...inq.data, files: [...existing, ...paths] }
    await admin.from('inquiries').update({ data: nextData }).eq('id', inquiryId)

    return json({ uploads: results })
  } catch (e) {
    console.error('inquiry-upload-url error', e)
    return json({ error: '서버 오류가 발생했습니다.' }, 500)
  }
})
