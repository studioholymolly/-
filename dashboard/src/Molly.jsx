import { useEffect, useRef, useState } from 'react'
import { useStore } from './useStore.js'
import { dday, today, addDays, moneySummary, backupStats } from './data.js'
import { aiEnabled, askMollyAI, aiErrorMessage } from './mollyAI.js'

/* ============================================================
   몰리 🐥 — 홀리몰리의 대화형 비서 (심심이)
   내 데이터를 알고 먼저 말을 걸고, 심심할 땐 수다도 떨어줍니다.
============================================================ */

const JOKES = [
  '포토그래퍼가 제일 싫어하는 계절은? 흔들리는 계절…📷',
  '보정 1시간이면 끝난다는 말, 촬영장에서 제일 큰 거짓말인 거 아시죠? 😌',
  '오늘의 명언: 백업은 두 번 해도 부족하다. — 몰리 (2026)',
  '렌즈 캡 끼고 촬영 시작한 적… 있으시죠? 저는 다 알아요. 🫢',
  '셀렉 500장 중에 고객사가 고르는 건 항상 501번째 컷이래요.',
  '조명이 안 예쁘면 반사판 탓, 반사판이 없으면… 제 탓 하세요. 몰리니까요.',
]
const CHEERS = [
  '오늘도 촬영하느라 고생 많았어요. 스튜디오는 {name}님 덕분에 굴러가요 🖤',
  '천천히 해도 괜찮아요. 마감은 몰리가 지켜보고 있으니까요!',
  '물 한 잔 마시고 하세요. 리터칭은 눈이 생명이에요 👀',
]

function pick(arr, seed) { return arr[seed % arr.length] }

// 데이터 기반 "먼저 말 걸기" — 우선순위 순
function proactive(s, user, isAdmin) {
  const t = today()
  const my = s.tasks.filter((x) => !x.done && x.owner === user.id)
  const over = my.filter((x) => x.due && x.due < t)
  const todayDue = my.filter((x) => x.due === t)
  const retouch = s.projects.filter((p) => !p.archived && (p.stage === 'retouch' || p.stage === 'revise') && p.owner === user.id)
  const bk = backupStats()
  const shootSoon = s.projects.filter((p) => !p.archived && p.owner === user.id && p.shootDate && p.shootDate >= t && p.shootDate <= addDays(t, 2))

  if (over.length) return `${user.name}님!! 마감 지난 업무가 ${over.length}건 있어요 😱 제일 급한 건 "${over[0].title}"이에요. 지금 바로 볼까요?`
  if (todayDue.length) return `오늘 마감 ${todayDue.length}건! "${todayDue[0].title}" 먼저 해치우는 거 어때요? 화이팅! 🔥`
  if (retouch.length) return `이제 보정해야 돼요! "${retouch[0].name}" 셀렉·리터칭이 기다리고 있어요 🎨`
  if (bk.missing.length) return `⛨ 백업 안 된 게 ${bk.missing.length}건 있어요. 백업은 사고 나기 전에… 아시죠? (${bk.missing[0]})`
  if (shootSoon.length) return `곧 촬영이에요! "${shootSoon[0].name}" ${dday(shootSoon[0].shootDate).label} — 장비 점검 잊지 마세요 📸`
  if (isAdmin) {
    const m = moneySummary()
    if (m.receivable > 0) return `대표님, 미수금 ₩${m.receivable.toLocaleString()} 남아있어요. 오늘 한 번 챙겨볼까요? 💸`
  }
  return `${user.name}님 안녕하세요! 오늘은 여유롭네요 ☀️ 심심하면 말 걸어주세요. "오늘 뭐해야 해?" 라든지, "농담"이라든지!`
}

// 키워드 응답
function reply(text, s, user, isAdmin, seed) {
  const q = text.toLowerCase()
  const t = today()
  const my = s.tasks.filter((x) => !x.done && x.owner === user.id)

  // 프로젝트·고객사 이름이 들어있으면 → 그 건의 진행상황 요약
  const hit = s.projects.find((p) =>
    (p.name && q.includes(p.name.toLowerCase().slice(0, 4))) ||
    (p.client && p.client.length >= 2 && q.includes(p.client.toLowerCase())))
  if (hit && !/농담|심심/.test(q)) {
    const linked = s.tasks.filter((x) => x.project === hit.name)
    const doneN = linked.filter((x) => x.done).length
    const dd = hit.due ? dday(hit.due) : null
    const stageNames = { inquiry: '문의 접수', contract: '계약·준비', shoot: '촬영', retouch: '셀렉·리터칭', revise: '수정 중', delivered: '납품 완료', marketing: '마케팅 진행' }
    const parts = [`"${hit.name}" 현황이에요 📋`, `단계: ${stageNames[hit.stage] || hit.stage}`]
    if (hit.shootDate) parts.push(`촬영일 ${hit.shootDate}`)
    if (hit.due) parts.push(`납품 ${hit.due}${dd ? ` (${dd.label})` : ''}`)
    if (linked.length) parts.push(`업무 ${doneN}/${linked.length} 완료`)
    const next = linked.filter((x) => !x.done).sort((a, b) => String(a.due || '9999').localeCompare(String(b.due || '9999')))[0]
    if (next) parts.push(`다음 할 일: ${next.title}`)
    if (!hit.origBackup || !hit.editBackup) {
      if (['retouch', 'revise', 'delivered', 'marketing'].includes(hit.stage)) parts.push('⛨ 백업 미완료 주의!')
    }
    return parts.join('\n')
  }

  if (/오늘|할\s*일|뭐\s*해|뭐부터/.test(q)) {
    const list = my.filter((x) => !x.due || x.due <= addDays(t, 1)).slice(0, 3)
    if (!list.length) return '오늘 마감 업무는 없어요! 밀린 백업이나 레퍼런스 정리를 해두면 미래의 내가 고마워할 거예요 😎'
    return `오늘의 추천 순서예요:\n${list.map((x, i) => `${i + 1}. ${x.title}${x.due ? ` (${dday(x.due)?.label || x.due})` : ''}`).join('\n')}\n우선순위 높은 것부터 골라뒀어요!`
  }
  if (/보정|리터칭|셀렉/.test(q)) {
    const r = s.projects.filter((p) => !p.archived && (p.stage === 'retouch' || p.stage === 'revise'))
    return r.length ? `지금 보정 단계엔 ${r.length}건 있어요: ${r.map((x) => x.name).join(', ')}. 제일 마감 급한 것부터요!` : '보정 대기 중인 건 없어요! 깔끔합니다 ✨'
  }
  if (/백업/.test(q)) {
    const bk = backupStats()
    return bk.missing.length ? `백업 누락 ${bk.missing.length}건: ${bk.missing.slice(0, 3).join(', ')}. 프로젝트 카드 열어서 체크해주세요!` : '백업 완료율 100%! 오늘 밤은 발 뻗고 주무셔도 돼요 🛌'
  }
  if (/촬영|일정|스케줄/.test(q)) {
    const up = s.projects.filter((p) => !p.archived && p.shootDate && p.shootDate >= t).sort((a, b) => a.shootDate.localeCompare(b.shootDate)).slice(0, 3)
    return up.length ? `다가오는 촬영: ${up.map((x) => `${x.name} (${x.shootDate.slice(5).replace('-', '/')})`).join(', ')}` : '예정된 촬영이 없어요. 영업 콘텐츠 올릴 타이밍인가요? 📣'
  }
  if (/매출|정산|미수금|돈/.test(q)) {
    if (!isAdmin) return '금액 얘기는 제 입이 무거워요 🤐 매출·정산은 관리자님만 볼 수 있거든요.'
    const m = moneySummary()
    return `이번 상황이에요 — 입금 ₩${m.revenue.toLocaleString()}, 미수금 ₩${m.receivable.toLocaleString()}, 순이익 ₩${m.net.toLocaleString()}. 자세한 건 매출·정산에서!`
  }
  if (/심심|농담|웃긴|재밌/.test(q)) return pick(JOKES, seed)
  if (/힘들|피곤|지쳐|우울/.test(q)) return pick(CHEERS, seed).replace('{name}', user.name)
  if (/고마워|땡큐|최고/.test(q)) return '헤헤 뭘요 🐥 몰리는 언제나 여기 있어요!'
  if (/안녕|하이|헬로/.test(q)) return `${user.name}님 안녕하세요! 오늘 컨디션은 어때요?`
  if (/몰리|누구|정체/.test(q)) return '저는 몰리! 홀리몰리 스튜디오의 마스코트 비서예요. 마감 감시가 특기고, 취미는 백업 잔소리예요 🐥'
  return pick([
    '음… 그건 아직 못 배웠어요! "오늘 뭐해야 해?", "백업", "촬영 일정", "농담" 같은 건 잘해요 🐥',
    '갸우뚱… 다시 물어봐 주실래요? 아니면 "농담"이라고 해보세요, 자신 있어요!',
  ], seed)
}

export default function Molly({ user, isAdmin }) {
  const s = useStore()
  const [msgs, setMsgs] = useState(() => [{ who: 'molly', text: proactive(s, user, isAdmin) }])
  const [input, setInput] = useState('')
  const [seed, setSeed] = useState(1)
  const [thinking, setThinking] = useState(false)
  const boxRef = useRef(null)
  const ai = aiEnabled()

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
  }, [msgs, thinking])

  async function ask(text) {
    setSeed((x) => x + 1)
    const history = msgs
    setMsgs((m) => [...m, { who: 'me', text }])

    if (ai) {
      // AI 모드 — 대시보드 전체 데이터(역할 필터)를 알고 대답
      setThinking(true)
      try {
        const answer = await askMollyAI({ user, isAdmin, msgs: history, question: text })
        setMsgs((m) => [...m, { who: 'molly', text: answer || '…음? 다시 물어봐 주실래요?' }])
      } catch (err) {
        // AI 실패 시 기본 모드로라도 대답
        const fallback = reply(text, s, user, isAdmin, seed)
        setMsgs((m) => [...m, { who: 'molly', text: aiErrorMessage(err) + '\n\n(기본 모드 답변) ' + fallback }])
      } finally {
        setThinking(false)
      }
    } else {
      setTimeout(() => {
        setMsgs((m) => [...m, { who: 'molly', text: reply(text, s, user, isAdmin, seed) }])
      }, 350)
    }
  }

  function send(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || thinking) return
    setInput('')
    ask(text)
  }

  const quicks = ai
    ? ['오늘 뭐해야 해?', '이번 주 촬영 브리핑해줘', isAdmin ? '이번 달 손익 어때?' : '백업 상태는?', '농담 해줘']
    : ['오늘 뭐해야 해?', '백업 상태는?', '촬영 일정', '농담 해줘']

  return (
    <div className="molly">
      <div className="molly-head">
        <span className="molly-face">🐥</span>
        <div><b>몰리 {ai && <span className="ai-badge">AI</span>}</b>
          <small>{ai ? '대시보드 전체를 알고 있어요 · ' : '홀리몰리 비서 · '}{user.name}님 전담</small></div>
        <span className="sp" />
        <span className="molly-dot" title="온라인" />
      </div>
      <div className="molly-box" ref={boxRef}>
        {msgs.map((m, i) => (
          <div key={i} className={'mmsg from-' + m.who}>
            {m.who !== 'me' && <span className="mface">🐥</span>}
            <span className="mbubble">{m.text}</span>
          </div>
        ))}
        {thinking && (
          <div className="mmsg from-molly">
            <span className="mface">🐥</span>
            <span className="mbubble mthinking">생각 중<i>.</i><i>.</i><i>.</i></span>
          </div>
        )}
      </div>
      <form className="molly-in" onSubmit={send}>
        <input value={input} disabled={thinking}
          placeholder={ai ? '뭐든 물어보세요 — "무신사 어디까지 됐어?"' : '말 걸어보세요 — "오늘 뭐해야 해?" "농담"'}
          onChange={(e) => setInput(e.target.value)} />
        <button className="btn primary sm" type="submit" disabled={thinking}>전송</button>
      </form>
      <div className="molly-quick">
        {quicks.map((qq) => (
          <button key={qq} type="button" className="btn ghost sm" disabled={thinking} onClick={() => ask(qq)}>{qq}</button>
        ))}
      </div>
    </div>
  )
}
