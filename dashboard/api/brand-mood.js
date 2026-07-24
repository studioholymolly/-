// 브랜드 소개서 → 무드 분석 (기획안 도우미 /planner)
// Claude API로 소개서(PDF·이미지)를 읽고 촬영 톤&무드 요약 + 키워드를 뽑는다.
// 필요 환경변수: ANTHROPIC_API_KEY — 없으면 GET이 enabled:false를 돌려주고 프론트에서 업로드 UI를 숨긴다.

const SYSTEM = `당신은 제품 촬영 스튜디오의 아트 디렉터입니다.
브랜드 소개서를 보고, 촬영 기획안의 TONE & MOOD 페이지에 넣을 브랜드 무드 분석을 작성합니다.
반드시 아래 형식의 JSON만 출력하세요. 다른 텍스트·마크다운 금지.
{"summary":"브랜드의 분위기·타깃·비주얼 톤을 촬영 관점에서 2~3문장으로 (한국어, 존댓말 없이 '~합니다'체 대신 '~한 브랜드' 서술형)","keywords":["짧은","한국어","무드","키워드","3~5개"]}`

export default async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=300')
    return res.status(200).json({ enabled: !!key })
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })
  if (!key) return res.status(200).json({ error: 'not_configured' })

  const { kind, media_type, data, brand } = req.body || {}
  if (!data || !media_type) return res.status(400).json({ error: 'bad_request' })
  const source = { type: 'base64', media_type, data }
  const block = kind === 'pdf' ? { type: 'document', source } : { type: 'image', source }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 600,
        system: SYSTEM,
        messages: [{
          role: 'user',
          content: [block, { type: 'text', text: `브랜드명: ${brand || '(미입력)'}\n이 브랜드 소개서를 분석해 JSON으로 답하세요.` }],
        }],
      }),
    })
    const j = await r.json()
    if (!r.ok) throw new Error(j.error?.message || 'api error')
    const text = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('')
    const m = text.match(/\{[\s\S]*\}/)
    const out = JSON.parse(m ? m[0] : text)
    if (!out.summary) throw new Error('no summary')
    return res.status(200).json({
      summary: String(out.summary),
      keywords: Array.isArray(out.keywords) ? out.keywords.map(String).slice(0, 5) : [],
    })
  } catch (e) {
    return res.status(200).json({ error: 'analyze_failed' })
  }
}
