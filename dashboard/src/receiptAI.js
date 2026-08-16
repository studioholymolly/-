import { aiComplete } from './mollyAI.js'
import { today } from './data.js'

/* ============================================================
   영수증 사진 → 항목 자동 인식 (Claude 비전 + 구조화 출력)
   - 커스텀 > 연동의 AI 키를 그대로 사용 (몰리와 동일한 키·모델)
   - 사진 1장 = 항목 1줄. 읽지 못한 칸은 빈 값으로 두고 사람이 채운다.
============================================================ */

// 구조화 출력 스키마 — 모든 키가 required + additionalProperties:false 여야 한다
function receiptSchema(cats, pays) {
  return {
    type: 'object',
    properties: {
      date: { type: 'string', description: '결제 일자 YYYY-MM-DD. 안 보이면 빈 문자열.' },
      place: { type: 'string', description: '상호·사용처 (예: 이마트 성수점). 안 보이면 빈 문자열.' },
      name: { type: 'string', description: '구매 내용 요약. 품목이 여러 개면 대표 2~3개를 "·"로 묶는다. (예: 생화·유리볼)' },
      qty: { type: 'integer', description: '수량. 보통 1. 같은 품목이 여러 개면 그 개수.' },
      price: { type: 'integer', description: '결제 총액(원). 콤마·원 표기 없이 숫자만. 못 읽으면 0.' },
      cat: { type: 'string', enum: cats, description: '지출 구분' },
      pay: { type: 'string', enum: pays, description: '결제 수단. 카드사·승인 문구가 보이면 카드, 안 보이면 법인카드.' },
      note: { type: 'string', description: '비고 (예: 승인번호, 인원수). 없으면 빈 문자열.' },
      confident: { type: 'boolean', description: '금액과 상호를 확실히 읽었으면 true, 흐리거나 추측이면 false.' },
    },
    required: ['date', 'place', 'name', 'qty', 'price', 'cat', 'pay', 'note', 'confident'],
    additionalProperties: false,
  }
}

const SYSTEM = [
  '너는 촬영 스튜디오의 경리 담당이야. 영수증 사진 한 장을 보고 지출 내역서 한 줄을 만든다.',
  '규칙:',
  '- 사진에 실제로 적힌 내용만 쓴다. 안 보이는 값은 빈 문자열이나 0으로 두고, 절대 지어내지 않는다.',
  '- 금액은 부가세 포함 "결제 총액"(카드 승인금액·합계)을 쓴다. 공급가액·부가세 줄이 따로 있으면 합계를 쓴다.',
  '- 날짜는 YYYY-MM-DD로 바꾼다. 연도가 없으면 올해로 본다.',
  '- 내용(name)은 영수증 품목을 짧게 요약한다. 품목이 안 보이면 업종으로 유추하지 말고 빈 문자열.',
  '- 구분(cat)은 품목 기준으로 고른다. 식자재·꽃·과일은 원물·식자재, 그릇·소품·공구는 프롭·소품, 식당·카페는 식대, 주차·택시·주유는 교통·주차.',
].join('\n')

// dataURL → Claude 이미지 블록
function imageBlock(dataUrl) {
  const m = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl || '')
  if (!m) throw new Error('이미지 형식을 읽지 못했어요.')
  return { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } }
}

/* 영수증 사진 1장 → { date, place, name, qty, price, cat, pay, note, confident } */
export async function readReceiptPhoto(dataUrl, { cats, pays }) {
  const text = await aiComplete({
    system: SYSTEM,
    content: [
      imageBlock(dataUrl),
      { type: 'text', text: `이 영수증을 지출 내역서 한 줄로 정리해줘. 오늘은 ${today()}이야.` },
    ],
    maxTokens: 700,
    format: { type: 'json_schema', schema: receiptSchema(cats, pays) },
  })
  let d
  try {
    d = JSON.parse(text)
  } catch {
    throw new Error('AI 응답을 읽지 못했어요. 다시 시도해주세요.')
  }
  return {
    date: /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : '',
    place: (d.place || '').trim(),
    name: (d.name || '').trim(),
    qty: Math.max(1, Number(d.qty) || 1),
    price: Math.max(0, Math.round(Number(d.price) || 0)),
    cat: cats.includes(d.cat) ? d.cat : '기타',
    pay: pays.includes(d.pay) ? d.pay : '법인카드',
    note: (d.note || '').trim(),
    confident: !!d.confident,
  }
}
