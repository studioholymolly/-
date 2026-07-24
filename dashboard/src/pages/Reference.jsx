/* ============================================================
   촬영 레퍼런스 파인더 (/reference) — 로그인 없이 접근하는 공개 페이지
   - 키워드 칩(제품·컨셉·색상·연출 요소)을 눌러 조합하면
     핀터레스트 검색 링크를 만들어 새 탭으로 열어줌
   - 핀터레스트는 검색결과 임베드/API 공개를 막아두어(승인제)
     검색 URL(pinterest.com/search/pins/?q=)로 연결하는 방식이 표준
   - 영문 검색이 레퍼런스 양·질 모두 좋아 기본값, 한글 토글 제공
   - 키워드 그룹·추천 조합은 inquirySite(폼 콘텐츠 편집기 [레퍼런스] 탭)에서 관리
   - Inquiry/Planner처럼 대시보드 코드와 완전 격리 (공용 CSS 클래스만 사용)
============================================================ */
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase.js'
import { DEFAULT_SITE, mergeSite } from '../inquirySite.js'

/* 편집기에서 새로 만든 그룹은 key가 없을 수 있어 title을 식별자로 쓴다 */
const gid = (g) => g.key || g.title

// ?embed=1 — 홈페이지 iframe 임베드 모드 (Inquiry/Planner와 동일한 규칙)
const EMBED = new URLSearchParams(window.location.search).get('embed') === '1'
const inquiryUrl = () => '/inquiry' + (EMBED ? '?embed=1' : '')

const BASE_TERM = { en: 'product photography', kr: '제품 촬영' }

/* 최근 검색 — localStorage에 최대 6개 저장 */
const RECENT_KEY = 'hm_ref_recent'
const loadRecent = () => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

export default function ReferencePage() {
  const [site, setSite] = useState(DEFAULT_SITE)
  const [sel, setSel] = useState({}) // { 'product:앰플': item, ... }
  const [lang, setLang] = useState('en') // 'en' | 'kr'
  const [extra, setExtra] = useState('') // 자유 키워드
  const [copied, setCopied] = useState(false)
  const [recent, setRecent] = useState(loadRecent)

  // 키워드 그룹·추천 조합 — 대시보드 [레퍼런스] 탭에서 편집된 값 (없으면 기본값)
  const R = site.reference || DEFAULT_SITE.reference
  const cats = R.cats || []
  const [cat, setCat] = useState(cats[0]?.key || '')
  // 그룹의 cat이 없으면 공통, 있으면 공백 구분 목록에 현재 탭이 포함될 때만 표시
  const groups = useMemo(
    () => R.groups.filter(g => !cats.length || !g.cat || g.cat.split(/\s+/).includes(cat)),
    [R.groups, cats.length, cat]
  )
  // 카테고리를 바꾸면 이전 탭에서 고른(이제 안 보이는) 칩은 해제
  const switchCat = (key) => { setCat(key); setSel({}) }

  useEffect(() => {
    supabase.from('inquiry_site').select('data').eq('id', 'main').maybeSingle()
      .then(({ data }) => { if (data?.data) setSite(mergeSite(data.data)) })
      .catch(() => {})
  }, [])
  useEffect(() => { document.title = `${site.studio.name} · 촬영 레퍼런스 파인더` }, [site.studio.name])

  const toggle = (gKey, item) => {
    const id = gKey + ':' + item.ko
    setSel(s => {
      const next = { ...s }
      if (next[id]) delete next[id]
      else next[id] = item
      return next
    })
  }
  // 추천 조합 — picks는 칩 라벨(ko) 목록. 어느 그룹이든 라벨이 일치하는 칩을 켠다
  const applyPreset = p => {
    const next = {}
    p.picks.forEach(pick => {
      const ko = Array.isArray(pick) ? pick[1] : pick // 구버전 [그룹key, 라벨] 저장분 호환
      for (const g of groups) {
        const item = g.items.find(i => i.ko === ko)
        if (item) { next[gid(g) + ':' + item.ko] = item; break }
      }
    })
    setSel(next)
  }

  // 클릭 순서와 무관하게 제품→컨셉→색상→연출→기법 순으로 정렬 (자연스러운 검색어)
  const picked = useMemo(
    () => groups.flatMap(g => g.items.filter(item => sel[gid(g) + ':' + item.ko])),
    [sel, groups]
  )
  const query = useMemo(() => {
    const terms = picked.map(i => i[lang])
    if (extra.trim()) terms.push(extra.trim())
    if (!terms.length) return ''
    // 카테고리별 기본 검색어 (예: 뷰티→cosmetics product photography, F&B→food photography)
    const base = cats.find(c => c.key === cat)?.base
    terms.push((base && base[lang]) || BASE_TERM[lang])
    // 겹치는 단어 제거 — 예: '청량(fresh water)'+'물 스플래시(water splash)'의 water 중복
    const seen = new Set()
    return terms.join(' ').split(/\s+/)
      .filter(w => { const k = w.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
      .join(' ')
  }, [picked, lang, extra, cats, cat])

  const pinUrl = query && 'https://www.pinterest.com/search/pins/?q=' + encodeURIComponent(query) + '&rs=typed'
  const googleUrl = query && 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(query)
  const behanceUrl = query && 'https://www.behance.net/search/projects?search=' + encodeURIComponent(query)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { window.prompt('링크를 복사하세요', pinUrl) }
  }

  // 핀터레스트로 나갈 때 이 조합을 최근 검색으로 저장 (기기별 localStorage)
  const saveRecent = () => {
    if (!picked.length && !extra.trim()) return
    const entry = {
      label: picked.map(i => i.ko).slice(0, 3).join(' + ') + (picked.length > 3 ? ' 외' : '') + (extra.trim() ? ' +α' : ''),
      ids: Object.keys(sel), extra: extra.trim(), lang, cat,
    }
    const next = [entry, ...recent.filter(r => r.label !== entry.label)].slice(0, 6)
    setRecent(next)
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch (_) {}
  }
  const applyRecent = r => {
    if (r.cat && cats.some(c => c.key === r.cat)) setCat(r.cat) // 저장 당시 카테고리로 복귀
    const next = {}
    r.ids.forEach(id => {
      const [gKey, ko] = id.split(':')
      const g = R.groups.find(g => gid(g) === gKey)
      const item = g && g.items.find(i => i.ko === ko)
      if (item) next[id] = item
    })
    setSel(next); setExtra(r.extra || ''); setLang(r.lang || 'en')
  }

  return (
    <div className="inq-bg">
      <style>{RF_CSS}</style>
      <div className="inq-wrap rf-wrap">
        <div className="inq-sub-h">
          <button className="btn sm" onClick={() => (window.location.href = inquiryUrl())}>← 문의 페이지</button>
          <h2>📌 촬영 레퍼런스 파인더</h2>
        </div>
        <div className="mut3 rf-lead">{R.lead}</div>

        {cats.length > 0 && (
          <div className="rf-cats">
            {cats.map(c => (
              <button key={c.key} className={'rf-cat' + (cat === c.key ? ' on' : '')} onClick={() => switchCat(c.key)}>
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="rf-presets">
          {(R.presets || []).filter(p => !p.cat || p.cat === cat).map(p => (
            <button key={p.name} className="btn sm" onClick={() => applyPreset(p)}>✨ {p.name}</button>
          ))}
        </div>
        {recent.length > 0 && (
          <div className="rf-presets rf-recent">
            <span className="mut3">최근</span>
            {recent.map(r => (
              <button key={r.label} className="btn sm ghost" onClick={() => applyRecent(r)}>🕘 {r.label}</button>
            ))}
          </div>
        )}

        {groups.map(g => (
          <div key={gid(g)} className="card rf-group">
            <div className="rf-group-h">
              <b>{g.title}</b>
              <span className="mut3">{g.hint}</span>
            </div>
            <div className="rf-chips">
              {g.items.map(item => {
                const on = !!sel[gid(g) + ':' + item.ko]
                return (
                  <button key={item.ko} className={'rf-chip' + (on ? ' on' : '')} onClick={() => toggle(gid(g), item)} aria-pressed={on}>
                    {item.dot && <i className="rf-dot" style={{ background: item.dot }} />}
                    {item.ko}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <div className="card rf-group">
          <div className="rf-group-h"><b>직접 추가</b><span className="mut3">원하는 키워드가 없다면</span></div>
          <input className="rf-input" value={extra} onChange={e => setExtra(e.target.value)}
            placeholder="예: 캡슐, 마블, 네온 조명 …" />
        </div>

        <div className="card rf-result">
          <div className="rf-lang">
            <span className="mut3">검색 언어</span>
            <button className={'rf-chip sm' + (lang === 'en' ? ' on' : '')} onClick={() => setLang('en')}>영문 (추천)</button>
            <button className={'rf-chip sm' + (lang === 'kr' ? ' on' : '')} onClick={() => setLang('kr')}>한글</button>
          </div>
          {query ? (
            <>
              <div className="rf-q">"{query}"</div>
              <a className="btn primary rf-go" href={pinUrl} target="_blank" rel="noreferrer" onClick={saveRecent}>📌 핀터레스트에서 레퍼런스 보기</a>
              <div className="rf-sub-links">
                <button className="btn sm" onClick={copyLink}>{copied ? '✓ 복사됨' : '🔗 링크 복사'}</button>
                <a className="btn sm" href={googleUrl} target="_blank" rel="noreferrer">구글 이미지</a>
                <a className="btn sm" href={behanceUrl} target="_blank" rel="noreferrer">비핸스</a>
              </div>
              {picked.length > 0 && (
                <button className="btn ghost sm rf-clear" onClick={() => { setSel({}); setExtra('') }}>↺ 전체 해제</button>
              )}
            </>
          ) : (
            <div className="mut3 rf-empty">위에서 키워드를 골라주세요 — 조합한 검색어가 여기 표시돼요.</div>
          )}
        </div>

        <div className="inq-foot mut3">© {site.studio.name}</div>
      </div>
    </div>
  )
}

const RF_CSS = `
.rf-wrap{max-width:640px}
.rf-lead{margin:-6px 0 14px;font-size:13px;line-height:1.5}
.rf-cats{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:2px}
.rf-cat{flex:none;padding:9px 15px;border-radius:12px;border:1px solid var(--line);background:var(--panel);
  font-size:13.5px;font-weight:650;cursor:pointer;transition:all .12s}
.rf-cat:hover{background:var(--panel-2)}
.rf-cat.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.rf-presets{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.rf-recent{margin-top:-6px;align-items:center;font-size:12px}
.rf-recent .btn{text-overflow:ellipsis;overflow:hidden;white-space:nowrap;max-width:100%}
.rf-group{padding:14px 16px;margin-bottom:12px}
.rf-group-h{display:flex;align-items:baseline;gap:8px;margin-bottom:10px;font-size:14px}
.rf-group-h .mut3{font-size:12px}
.rf-chips{display:flex;flex-wrap:wrap;gap:7px}
.rf-chip{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:999px;
  border:1px solid var(--line);background:var(--panel);font-size:13px;cursor:pointer;transition:all .12s}
.rf-chip:hover{background:var(--panel-2)}
.rf-chip.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.rf-chip.sm{padding:5px 10px;font-size:12px}
.rf-dot{width:11px;height:11px;border-radius:50%;border:1px solid rgba(0,0,0,.18);flex:none}
.rf-input{width:100%;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);font-size:13px}
.rf-result{padding:16px;margin-top:4px;text-align:center}
.rf-lang{display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:12px;font-size:12px}
.rf-q{font-size:13px;font-weight:600;margin-bottom:12px;word-break:keep-all;line-height:1.5}
.rf-go{display:block;width:100%;padding:12px;font-size:15px;text-align:center;text-decoration:none;border-radius:12px;box-sizing:border-box}
.rf-sub-links{display:flex;justify-content:center;gap:6px;margin-top:10px}
.rf-sub-links .btn{text-decoration:none}
.rf-clear{margin-top:10px}
.rf-empty{padding:10px 0;font-size:13px}
`
