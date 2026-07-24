/* ============================================================
   문의 폼 콘텐츠 편집기 (관리자 전용)
   - 공개 페이지(/inquiry)의 모든 콘텐츠를 편집·추가·삭제·순서 변경
   - 저장 → Supabase inquiry_site (익명 방문자에게 즉시 반영)
   - 이미지: URL 직접 입력 또는 업로드(기존 files 공개 버킷 재사용)
============================================================ */
import { useEffect, useState } from 'react'
import { DEFAULT_SITE, mergeSite } from '../inquirySite.js'
import { fetchInquirySite, saveInquirySite, uploadFile } from '../data.js'

export default function InquiryEditor({ actor, onClose }) {
  const [site, setSite] = useState(null)
  const [tab, setTab] = useState('studio')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [restoreArm, setRestoreArm] = useState(false)

  useEffect(() => {
    fetchInquirySite().then((saved) => setSite(mergeSite(saved)))
  }, [])

  if (site === null) {
    return <div className="ed-wrap"><div className="mut3" style={{ padding: 30 }}>콘텐츠를 불러오는 중…</div></div>
  }

  const patch = (key, value) => setSite((s) => ({ ...s, [key]: value }))
  const patchObj = (key, field, value) => setSite((s) => ({ ...s, [key]: { ...s[key], [field]: value } }))
  // 폼 질문 항목(form.fields.*) 부분 수정
  const patchField = (fk, p) =>
    setSite((s) => ({ ...s, form: { ...s.form, fields: { ...s.form.fields, [fk]: { ...s.form.fields[fk], ...p } } } }))
  // 랜딩 상단 고정 버튼(landingFixed.*) 부분 수정
  const patchLF = (k, p) =>
    setSite((s) => ({ ...s, landingFixed: { ...s.landingFixed, [k]: { ...s.landingFixed[k], ...p } } }))

  async function save() {
    setSaving(true); setMsg('')
    const err = await saveInquirySite(site, actor)
    setSaving(false)
    setMsg(err ? '저장 실패: ' + err : '저장되었습니다 — 폼에 바로 반영됩니다 ✓')
    if (!err) setTimeout(() => setMsg(''), 2500)
  }

  // 편집 내용을 코드 기본값으로 전체 교체 — 실수로 옛 버전을 저장했을 때의 복구 수단.
  // 두 번 눌러야 실행되고, [저장]을 눌러야 실제 반영된다.
  function restoreDefaults() {
    if (!restoreArm) {
      setRestoreArm(true)
      setMsg('한 번 더 누르면 모든 탭이 기본값으로 바뀝니다 (저장 전까지 반영 안 됨)')
      setTimeout(() => setRestoreArm(false), 5000)
      return
    }
    setSite(JSON.parse(JSON.stringify(DEFAULT_SITE)))
    setRestoreArm(false)
    setMsg('기본값을 불러왔어요 — [저장]을 눌러야 공개 페이지에 반영됩니다')
  }

  const TABS = [
    { id: 'studio', label: '기본 정보' },
    { id: 'landing', label: '랜딩 버튼' },
    { id: 'about', label: '스튜디오 소개' },
    { id: 'process', label: '진행 과정' },
    { id: 'pricing', label: '견적·옵션' },
    { id: 'info', label: 'FAQ' },
    { id: 'form', label: '폼 질문·선택지' },
    { id: 'planner', label: '기획안 도우미' },
    { id: 'reference', label: '레퍼런스 파인더' },
  ]

  return (
    <div className="ed-wrap">
      <div className="ph">
        <h3>폼 콘텐츠 편집</h3>
        <span className="mut3" style={{ fontSize: 12 }}>저장하면 /inquiry 공개 페이지에 바로 반영됩니다</span>
        <span className="sp" />
        {msg && <span className="mut" style={{ fontSize: 12.5, fontWeight: 650 }}>{msg}</span>}
        <a className="btn sm" href="/inquiry" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>↗ 미리보기</a>
        <button className="btn sm" onClick={restoreDefaults}>{restoreArm ? '⚠ 정말 복원할까요?' : '↺ 기본값 복원'}</button>
        <button className="btn sm" onClick={onClose}>← 문의 목록</button>
        <button className="btn primary sm" disabled={saving} onClick={save}>{saving ? '저장 중…' : '저장'}</button>
      </div>

      <div className="ed-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={'inq-chip' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="card ed-body">
        {tab === 'studio' && (
          <>
            <Txt label="스튜디오 이름" v={site.studio.name} on={(v) => patchObj('studio', 'name', v)} />
            <Area label="태그라인 (랜딩 상단 소개)" v={site.studio.tagline} on={(v) => patchObj('studio', 'tagline', v)} rows={2} />
            <Txt label="답변 약속 문구" v={site.studio.replyPromise} on={(v) => patchObj('studio', 'replyPromise', v)} />
            <Txt label="각 탭 하단 공통 버튼 문구 (문의 폼으로 이동)" v={site.studio.ctaLabel} on={(v) => patchObj('studio', 'ctaLabel', v)} />
            <div className="ed-sep" />
            <Txt label="카카오 채널 URL" v={site.contact.kakaoUrl} on={(v) => patchObj('contact', 'kakaoUrl', v)} />
            <Txt label="카카오 채팅 URL" v={site.contact.kakaoChatUrl} on={(v) => patchObj('contact', 'kakaoChatUrl', v)} />
            <Txt label="전화번호" v={site.contact.phone} on={(v) => patchObj('contact', 'phone', v)} />
            <Txt label="이메일" v={site.contact.email} on={(v) => patchObj('contact', 'email', v)} />
            <Txt label="웹사이트 (포트폴리오)" v={site.contact.website} on={(v) => patchObj('contact', 'website', v)} />
            <Txt label="위치 (연락처 카드에 표시)" v={site.contact.location} on={(v) => patchObj('contact', 'location', v)} />

            <div className="ed-sep" />
            <label style={{ fontWeight: 750, fontSize: 13 }}>스튜디오 위치 · 오시는 길</label>
            <div className="ed-row2">
              <Txt label="주소" v={site.place.address} on={(v) => patchObj('place', 'address', v)} />
              <Txt label="상세 주소 (건물·층·호수)" v={site.place.addressDetail} on={(v) => patchObj('place', 'addressDetail', v)} />
            </div>
            <Txt label="네이버 지도 URL (지도에서 스튜디오 검색 → 공유 링크 복사)" v={site.place.naverMapUrl} on={(v) => patchObj('place', 'naverMapUrl', v)} />
            <StrListEditor label="오시는 길 안내 (주차·대중교통 등)" items={site.place.notes}
              onChange={(v) => patchObj('place', 'notes', v)} />

            <div className="ed-sep" />
            <label style={{ fontWeight: 750, fontSize: 13 }}>촬영 스케줄</label>
            <p className="mut3" style={{ fontSize: 11.5, margin: '2px 0 8px' }}>
              * 구글 캘린더 임베드 URL이 있으면 그 달력이 그대로 보입니다. 비워두면 프로젝트 <b>촬영일이 있는 날짜만</b> ●로
              표시하는 자체 달력으로 대체돼요 (프로젝트명·고객명 비공개).
            </p>
            <Txt label="구글 캘린더 임베드 URL (구글 캘린더 → 설정 → 맞춤설정 → 소스 코드의 src)"
              v={site.schedule.embedUrl} on={(v) => patchObj('schedule', 'embedUrl', v)} />
            <Area label="달력 하단 안내 문구" v={site.schedule.note} rows={2} on={(v) => patchObj('schedule', 'note', v)} />
          </>
        )}

        {tab === 'landing' && (
          <>
            <label style={{ fontWeight: 750, fontSize: 13 }}>상단 고정 버튼 3개</label>
            <p className="mut3" style={{ fontSize: 11.5, margin: '2px 0 8px' }}>
              * 문의 등록 버튼은 항상 표시되고(문구만 편집), 도우미·레퍼런스는 표시를 끌 수 있어요.
            </p>
            {[
              ['inquiry', '① 촬영 문의 등록 (항상 표시 · 설명 비우면 답변 약속 문구)', true],
              ['planner', '② 촬영 기획안 도우미 (/planner)', false],
              ['reference', '③ 촬영 레퍼런스 모아보기 (/reference)', false],
            ].map(([k, title, fixed]) => {
              const b = site.landingFixed[k]
              return (
                <div key={k} className="ed-item" style={!fixed && b.on === false ? { opacity: .55 } : undefined}>
                  <div className="ed-item-bar">
                    <span className="mut3" style={{ fontSize: 11, fontWeight: 700 }}>{title}</span>
                    <span className="sp" />
                    {fixed
                      ? <span className="mut3" style={{ fontSize: 11 }}>항상 표시</span>
                      : (
                        <label style={{ fontSize: 11.5, fontWeight: 650, display: 'inline-flex', gap: 5, alignItems: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" checked={b.on !== false} onChange={(e) => patchLF(k, { on: e.target.checked })} />
                          랜딩에 표시
                        </label>
                      )}
                  </div>
                  <div className="ed-row2">
                    <Txt label="아이콘 (이모지 1개)" v={b.ic} on={(v) => patchLF(k, { ic: v })} />
                    <Txt label="버튼 제목" v={b.title} on={(v) => patchLF(k, { title: v })} />
                  </div>
                  <Txt label="버튼 설명" v={b.desc} on={(v) => patchLF(k, { desc: v })} />
                </div>
              )
            })}
            <div className="ed-sep" />
            <label style={{ fontWeight: 750, fontSize: 13 }}>아래 버튼들</label>
            <p className="mut3" style={{ fontSize: 11.5, margin: '2px 0 10px' }}>
              * ↑↓로 순서를 바꾸고, 추가·삭제할 수 있습니다.
            </p>
            <ListEditor
              items={site.landing}
              onChange={(v) => patch('landing', v)}
              blank={{ view: 'info', ic: '◈', title: '', desc: '', href: '' }}
              render={(it, up) => (
                <>
                  <div className="ed-row2">
                    <Txt label="아이콘 (이모지·글자 1개)" v={it.ic} on={(v) => up({ ic: v })} />
                    <Sel label="연결 대상" v={it.view} on={(v) => up({ view: v })}
                      options={[
                        ['about', '스튜디오 소개'], ['process', '진행 과정'], ['pricing', '견적·옵션'], ['info', 'FAQ'],
                        ['schedule', '촬영 스케줄'], ['location', '스튜디오 위치'], ['form', '문의 폼 열기'],
                        ['kakao', '카카오톡 채널 (기본 정보의 URL)'], ['website', '포트폴리오 (기본 정보의 URL)'],
                        ['link', '외부 링크 (URL 직접 입력)'],
                      ]} />
                  </div>
                  {it.view === 'link' && (
                    <Txt label="링크 URL (https://…)" v={it.href} on={(v) => up({ href: v })} />
                  )}
                  <Txt label="버튼 제목" v={it.title} on={(v) => up({ title: v })} />
                  <Txt label="버튼 설명" v={it.desc} on={(v) => up({ desc: v })} />
                </>
              )}
            />
          </>
        )}

        {tab === 'about' && (
          <>
            <StrListEditor label="소개 문단" items={site.about.paragraphs} area
              onChange={(v) => patchObj('about', 'paragraphs', v)} />
            <div className="ed-sep" />
            <StrListEditor label="주요 업무" items={site.about.services}
              onChange={(v) => patchObj('about', 'services', v)} />
            <div className="ed-sep" />
            <Txt label="함께한 브랜드 (한 줄)" v={site.about.clients} on={(v) => patchObj('about', 'clients', v)} />
          </>
        )}

        {tab === 'process' && (
          <ListEditor
            items={site.processSteps}
            onChange={(v) => patch('processSteps', v)}
            blank={{ tag: '촬영 전', title: '', desc: '', img: '' }}
            render={(it, up) => (
              <>
                <div className="ed-row2">
                  <Txt label="구분 태그 (촬영 전 / 촬영 후)" v={it.tag} on={(v) => up({ tag: v })} />
                  <Txt label="단계 제목" v={it.title} on={(v) => up({ title: v })} />
                </div>
                <Area label="설명" v={it.desc} on={(v) => up({ desc: v })} rows={2} />
                <ImgField v={it.img} on={(v) => up({ img: v })} />
              </>
            )}
          />
        )}

        {tab === 'pricing' && (
          <>
            <ListEditor
              items={site.pricingItems}
              onChange={(v) => patch('pricingItems', v)}
              blank={{ title: '', desc: '', price: '상담 후 안내', img: '' }}
              render={(it, up) => (
                <>
                  <div className="ed-row2">
                    <Txt label="항목명" v={it.title} on={(v) => up({ title: v })} />
                    <Txt label="가격 표시" v={it.price} on={(v) => up({ price: v })} />
                  </div>
                  <Area label="설명" v={it.desc} on={(v) => up({ desc: v })} rows={2} />
                  <ImgField v={it.img} on={(v) => up({ img: v })} />
                </>
              )}
            />
            <div className="ed-sep" />
            <StrListEditor label="견적 참고사항 (하단 안내)" items={site.pricingNotes}
              onChange={(v) => patch('pricingNotes', v)} />
          </>
        )}

        {tab === 'info' && (
          <ListEditor
            items={site.infoItems}
            onChange={(v) => patch('infoItems', v)}
            blank={{ q: '', a: '' }}
            render={(it, up) => (
              <>
                <Txt label="질문" v={it.q} on={(v) => up({ q: v })} />
                <Area label="답변" v={it.a} on={(v) => up({ a: v })} rows={2} />
              </>
            )}
          />
        )}

        {tab === 'form' && (
          <>
            <p className="mut3" style={{ fontSize: 11.5, margin: '0 0 10px' }}>
              * 각 질문의 <b>문구·입력 예시</b>를 고치고, <b>표시</b>를 끄면 폼에서 사라집니다 (필수 검증도 함께 해제).
              연락처와 개인정보 동의는 회신·법적 필수라 끌 수 없어요.
            </p>

            <StepLabel n={1} t="기본 정보" />
            <FieldEd title="브랜드명" f={site.form.fields.brand} on={(p) => patchField('brand', p)} ph />
            <FieldEd title="담당자 성함" f={site.form.fields.manager} on={(p) => patchField('manager', p)} ph />
            <FieldEd title="연락처" f={site.form.fields.contact} on={(p) => patchField('contact', p)} ph fixed />
            <FieldEd title="편한 회신 방법" f={site.form.fields.contactPref} on={(p) => patchField('contactPref', p)}>
              <StrListEditor label="회신 방법 선택지" items={site.form.contactPrefs}
                onChange={(v) => patchObj('form', 'contactPrefs', v)} />
            </FieldEd>

            <StepLabel n={2} t="촬영 내용" />
            <FieldEd title="촬영 유형" f={site.form.fields.shootType} on={(p) => patchField('shootType', p)}>
              <StrListEditor label="촬영 유형 선택지" items={site.form.shootTypes}
                onChange={(v) => patchObj('form', 'shootTypes', v)} />
              <p className="mut3" style={{ fontSize: 11.5, margin: '4px 0 0' }}>* '영상' 항목이 있으면 선택 시 아래 분량·편집 질문이 자동으로 나타납니다.</p>
            </FieldEd>
            <FieldEd title="영상 분량 ('영상' 선택 시)" f={site.form.fields.videoLen} on={(p) => patchField('videoLen', p)} ph />
            <FieldEd title="편집 포함 여부 ('영상' 선택 시)" f={site.form.fields.videoEdit} on={(p) => patchField('videoEdit', p)}>
              <StrListEditor label="편집 여부 선택지" items={site.form.videoEditOptions}
                onChange={(v) => patchObj('form', 'videoEditOptions', v)} />
            </FieldEd>
            <FieldEd title="촬영 품목 · 수량" f={site.form.fields.items} on={(p) => patchField('items', p)} ph />
            <FieldEd title="촬영 목적 · 사용처" f={site.form.fields.purposes} on={(p) => patchField('purposes', p)}>
              <StrListEditor label="촬영 목적 선택지" items={site.form.purposes}
                onChange={(v) => patchObj('form', 'purposes', v)} />
            </FieldEd>
            <FieldEd title="촬영 내용 · 컨셉" f={site.form.fields.concept} on={(p) => patchField('concept', p)} ph />

            <StepLabel n={3} t="기획안" />
            <FieldEd title="기획안 준비 질문" f={site.form.fields.planStatus} on={(p) => patchField('planStatus', p)} />

            {/* 기획안 단계 — 분기 동작(첨부/가이드/안내)은 고정, 문구·선택지만 편집 */}
            <label style={{ fontWeight: 750, fontSize: 13 }}>기획안 단계 · 분기 문구</label>
            <p className="mut3" style={{ fontSize: 11.5, margin: '2px 0 8px' }}>
              * 각 선택지의 동작(①파일 첨부 ②가이드 폼 ③안내 문구)은 고정이고, 보이는 문구만 바뀝니다.
            </p>
            {[
              ['have', '① 기획안 있음 (파일 첨부로 연결)'],
              ['guide', '② 처음 (간단 가이드로 연결)'],
              ['later', '③ 상담하며 결정 (안내 문구 표시)'],
            ].map(([k, title]) => (
              <div key={k} className="ed-item">
                <div className="ed-item-bar"><span className="mut3" style={{ fontSize: 11, fontWeight: 700 }}>{title}</span></div>
                <div className="ed-row2">
                  <Txt label="선택지 문구" v={site.form.planTexts[k].label}
                    on={(v) => patchObj('form', 'planTexts', { ...site.form.planTexts, [k]: { ...site.form.planTexts[k], label: v } })} />
                  <Txt label="보조 설명" v={site.form.planTexts[k].desc}
                    on={(v) => patchObj('form', 'planTexts', { ...site.form.planTexts, [k]: { ...site.form.planTexts[k], desc: v } })} />
                </div>
              </div>
            ))}
            <Area label="가이드 안내 문구 (② 선택 시 상단 박스)" v={site.form.planTexts.guideIntro} rows={2}
              on={(v) => patchObj('form', 'planTexts', { ...site.form.planTexts, guideIntro: v })} />
            <Area label="상담 안내 문구 (③ 선택 시 표시)" v={site.form.planTexts.laterNote} rows={2}
              on={(v) => patchObj('form', 'planTexts', { ...site.form.planTexts, laterNote: v })} />
            <div className="ed-sep" />
            <StrListEditor label="기획안 가이드 · 사용처·규격 선택지" items={site.form.planFormats}
              onChange={(v) => patchObj('form', 'planFormats', v)} />

            <StepLabel n={4} t="일정 · 예산" />
            <FieldEd title="희망 촬영일" f={site.form.fields.shootDate} on={(p) => patchField('shootDate', p)} />
            <FieldEd title="결과물 필요일 (마감일)" f={site.form.fields.dueDate} on={(p) => patchField('dueDate', p)} />
            <FieldEd title="예산 범위" f={site.form.fields.budget} on={(p) => patchField('budget', p)}>
              <StrListEditor label="예산 범위 선택지" items={site.form.budgetRanges}
                onChange={(v) => patchObj('form', 'budgetRanges', v)} />
              <Txt label="'가장 많이 선택' 배지가 붙는 선택지 (위 목록과 똑같이 입력 · 비우면 배지 없음)"
                v={site.form.budgetPopular} on={(v) => patchObj('form', 'budgetPopular', v)} />
            </FieldEd>

            <StepLabel n={5} t="자료 · 동의" />
            <FieldEd title="레퍼런스 · 참고 링크" f={site.form.fields.refUrls} on={(p) => patchField('refUrls', p)} />
            <FieldEd title="그 외 문의사항" f={site.form.fields.etc} on={(p) => patchField('etc', p)} ph />
            <Area label="개인정보 고지 문구 (동의 체크박스는 항상 표시)" v={site.form.privacyNotice} on={(v) => patchObj('form', 'privacyNotice', v)} rows={3} />

            <div className="ed-sep" />
            <label style={{ fontWeight: 750, fontSize: 13 }}>단계 이름 (진행 표시줄)</label>
            <div className="ed-row2">
              {site.form.stepTitles.map((t, i) => (
                <Txt key={i} label={`${i + 1}단계`} v={t}
                  on={(v) => patchObj('form', 'stepTitles', site.form.stepTitles.map((x, j) => (j === i ? v : x)))} />
              ))}
            </div>
          </>
        )}

        {tab === 'planner' && (
          <>
            <p className="mut3" style={{ fontSize: 11.5, margin: '0 0 10px' }}>
              * 촬영 기획안 도우미(/planner)의 선택지입니다. 촬영 유형·예산은 [폼 질문·선택지] 탭의 값을 함께 씁니다.
            </p>
            <StrListEditor label="업종 선택지" items={site.planner.industries}
              onChange={(v) => patchObj('planner', 'industries', v)} />
            <div className="ed-sep" />
            <StrListEditor label="결과물 사용처 선택지" items={site.planner.purposes}
              onChange={(v) => patchObj('planner', 'purposes', v)} />
            <p className="mut3" style={{ fontSize: 11.5, margin: '4px 0 0' }}>
              * '상세페이지'·'릴스·숏츠'·'메뉴판·인쇄물' 항목이 있으면 선택 시 전용 추가 컷이 자동 제안됩니다.
            </p>
            <div className="ed-sep" />
            <StrListEditor label="모델 필요 여부 선택지" items={site.planner.modelOptions}
              onChange={(v) => patchObj('planner', 'modelOptions', v)} />
            <div className="ed-sep" />
            <label style={{ fontWeight: 750, fontSize: 13 }}>무드 카드</label>
            <p className="mut3" style={{ fontSize: 11.5, margin: '2px 0 8px' }}>
              * 고객이 고르는 무드입니다. 컬러 3개는 [밝은 배경지 톤 · 중간 톤 · 포인트] 순서로, 컷별 배경지 색 제안에 쓰여요.
            </p>
            <ListEditor
              items={site.planner.moods}
              onChange={(v) => patchObj('planner', 'moods', v)}
              blank={{ key: '', name: '', keywords: [], colors: ['#FFFFFF', '#DDDDDD', '#333333'], desc: '' }}
              render={(it, up) => (
                <>
                  <div className="ed-row2">
                    <Txt label="무드 이름" v={it.name} on={(v) => up({ name: v })} />
                    <Txt label="키워드 (쉼표로 구분 · 카드에 #태그로 표시)" v={(it.keywords || []).join(', ')}
                      on={(v) => up({ keywords: v.split(',').map((s) => s.trim()).filter(Boolean) })} />
                  </div>
                  <div className="ed-field">
                    <label>컬러 3개 (밝은 배경지 톤 · 중간 톤 · 포인트)</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[0, 1, 2].map((ci) => (
                        <input key={ci} type="color" value={(it.colors || [])[ci] || '#FFFFFF'}
                          style={{ width: 44, height: 32, padding: 2, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--panel)' }}
                          onChange={(e) => {
                            const colors = [...(it.colors || ['#FFFFFF', '#DDDDDD', '#333333'])]
                            colors[ci] = e.target.value
                            up({ colors })
                          }} />
                      ))}
                    </div>
                  </div>
                  <Area label="설명 (기획안 톤&무드 페이지에 그대로 들어가요)" v={it.desc} on={(v) => up({ desc: v })} rows={2} />
                </>
              )}
            />
          </>
        )}

        {tab === 'reference' && (
          <>
            <p className="mut3" style={{ fontSize: 11.5, margin: '0 0 10px' }}>
              * 촬영 레퍼런스 파인더(/reference)의 키워드입니다.
            </p>
            <Area label="상단 안내 문구" v={site.reference.lead} on={(v) => patchObj('reference', 'lead', v)} rows={2} />
            <div className="ed-sep" />
            <label style={{ fontWeight: 750, fontSize: 13 }}>키워드 그룹</label>
            <p className="mut3" style={{ fontSize: 11.5, margin: '2px 0 8px' }}>
              * 키워드는 한 줄에 하나씩 — <b>칩 라벨 | 영문 검색어 | 한글 검색어 | #색상코드(선택)</b> 형식이에요.
              검색어를 비우면 라벨이 그대로 검색어로 쓰입니다.
            </p>
            <ListEditor
              items={site.reference.groups}
              onChange={(v) => patchObj('reference', 'groups', v)}
              blank={{ key: '', title: '', hint: '', cat: '', items: [] }}
              render={(it, up) => (
                <>
                  <div className="ed-row2">
                    <Txt label="그룹 이름" v={it.title} on={(v) => up({ title: v })} />
                    <Txt label="안내 문구" v={it.hint} on={(v) => up({ hint: v })} />
                  </div>
                  <Txt label="카테고리 (beauty·fnb·life·video 중, 공백으로 여러 개 — 비우면 모든 탭 공통)"
                    v={it.cat || ''} on={(v) => up({ cat: v.trim() })} />
                  <KeywordLines items={it.items || []} onChange={(v) => up({ items: v })} />
                </>
              )}
            />
            <div className="ed-sep" />
            <label style={{ fontWeight: 750, fontSize: 13 }}>추천 조합 (상단 ✨ 버튼)</label>
            <p className="mut3" style={{ fontSize: 11.5, margin: '2px 0 8px' }}>
              * 키워드는 위 그룹들의 <b>칩 라벨</b>을 쉼표로 나열하세요. 없는 라벨은 자동으로 건너뜁니다.
            </p>
            <ListEditor
              items={site.reference.presets}
              onChange={(v) => patchObj('reference', 'presets', v)}
              blank={{ name: '', cat: '', picks: [] }}
              render={(it, up) => (
                <>
                  <div className="ed-row2">
                    <Txt label="조합 이름" v={it.name} on={(v) => up({ name: v })} />
                    <Txt label="카테고리 (beauty·fnb·life·video — 비우면 모든 탭)" v={it.cat || ''} on={(v) => up({ cat: v.trim() })} />
                  </div>
                  <Txt label="키워드 (칩 라벨을 쉼표로 구분)"
                    v={(it.picks || []).map((p) => (Array.isArray(p) ? p[1] : p)).join(', ')}
                    on={(v) => up({ picks: v.split(',').map((s) => s.trim()).filter(Boolean) })} />
                </>
              )}
            />
          </>
        )}
      </div>
    </div>
  )
}

/* 레퍼런스 키워드 그룹 — 줄 단위 편집 ("라벨 | 영문 | 한글 | #색상")
   타이핑 중 커서가 튀지 않게 비제어 textarea로 두고, 입력할 때마다 파싱해 저장 */
function KeywordLines({ items, onChange }) {
  const toText = (list) =>
    list.map((it) => `${it.ko} | ${it.en || ''} | ${it.kr || ''}${it.dot ? ` | ${it.dot}` : ''}`).join('\n')
  const parse = (txt) =>
    txt.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const [ko = '', en = '', kr = '', dot = ''] = l.split('|').map((s) => s.trim())
      return { ko, en: en || ko, kr: kr || ko, ...(dot ? { dot } : {}) }
    }).filter((it) => it.ko)
  return (
    <div className="ed-field">
      <label>키워드 목록 ({items.length}개)</label>
      <textarea rows={Math.min(14, Math.max(4, items.length + 1))} defaultValue={toText(items)}
        style={{ fontSize: 12, lineHeight: 1.6 }}
        onChange={(e) => onChange(parse(e.target.value))} />
    </div>
  )
}

/* ---------- 편집 위젯 ---------- */
function Txt({ label, v, on }) {
  return (
    <div className="ed-field">
      <label>{label}</label>
      <input value={v || ''} onChange={(e) => on(e.target.value)} />
    </div>
  )
}
function Area({ label, v, on, rows = 3 }) {
  return (
    <div className="ed-field">
      <label>{label}</label>
      <textarea rows={rows} value={v || ''} onChange={(e) => on(e.target.value)} />
    </div>
  )
}
function Sel({ label, v, on, options }) {
  return (
    <div className="ed-field">
      <label>{label}</label>
      <select value={v} onChange={(e) => on(e.target.value)}>
        {options.map(([val, lb]) => <option key={val} value={val}>{lb}</option>)}
      </select>
    </div>
  )
}

function ImgField({ v, on }) {
  const [busy, setBusy] = useState(false)
  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    const r = await uploadFile(file, 'inquiry-site')
    setBusy(false)
    if (r.error) alert('업로드 실패: ' + r.error)
    else on(r.url)
  }
  return (
    <div className="ed-field">
      <label>사진 (선택)</label>
      <div className="ed-img-row">
        <input value={v || ''} placeholder="이미지 주소 또는 오른쪽 버튼으로 업로드" onChange={(e) => on(e.target.value)} />
        <label className="btn sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {busy ? '업로드 중…' : '📎 업로드'}
          <input type="file" accept="image/*" hidden onChange={pick} disabled={busy} />
        </label>
        {v && <button className="btn sm" onClick={() => on('')}>✕</button>}
      </div>
      {v && <img src={v} alt="" className="ed-img-preview" />}
    </div>
  )
}

/* 폼 탭 — 단계 구분 헤더 */
function StepLabel({ n, t }) {
  return (
    <>
      <div className="ed-sep" />
      <label style={{ fontWeight: 750, fontSize: 13, display: 'block', marginBottom: 6 }}>{n}단계 · {t}</label>
    </>
  )
}

/* 폼 질문 항목 편집 — 표시 토글 + 문구 + 입력 예시(+선택지 등 children)
   fixed: 끌 수 없는 필수 항목 / ph: placeholder 편집칸 표시 */
function FieldEd({ title, f = {}, on, ph, fixed, children }) {
  const off = !fixed && f.on === false
  return (
    <div className="ed-item" style={off ? { opacity: .55 } : undefined}>
      <div className="ed-item-bar">
        <span className="mut3" style={{ fontSize: 11, fontWeight: 700 }}>{title}</span>
        <span className="sp" />
        {fixed
          ? <span className="mut3" style={{ fontSize: 11 }}>항상 표시</span>
          : (
            <label style={{ fontSize: 11.5, fontWeight: 650, display: 'inline-flex', gap: 5, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={f.on !== false} onChange={(e) => on({ on: e.target.checked })} />
              폼에 표시
            </label>
          )}
      </div>
      <div className={ph ? 'ed-row2' : undefined}>
        <Txt label="질문 문구" v={f.label} on={(v) => on({ label: v })} />
        {ph && <Txt label="입력 예시 (연하게 보이는 안내)" v={f.ph} on={(v) => on({ ph: v })} />}
      </div>
      {!off && children}
    </div>
  )
}

/* 객체 리스트 편집 — 추가/삭제/위아래 이동 */
function ListEditor({ items, onChange, blank, render }) {
  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} className="ed-item">
          <div className="ed-item-bar">
            <span className="mut3 num" style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
            <span className="sp" />
            <button className="btn ghost sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
            <button className="btn ghost sm" onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</button>
            <button className="btn ghost sm" style={{ color: 'var(--ink-3)' }}
              onClick={() => { if (confirm('이 항목을 삭제할까요?')) onChange(items.filter((_, j) => j !== i)) }}>삭제</button>
          </div>
          {render(it, (p) => onChange(items.map((x, j) => (j === i ? { ...x, ...p } : x))))}
        </div>
      ))}
      <button className="btn sm" onClick={() => onChange([...items, { ...blank }])}>＋ 항목 추가</button>
    </div>
  )
}

/* 문자열 리스트 편집 */
function StrListEditor({ label, items, onChange, area }) {
  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <div className="ed-field">
      <label>{label}</label>
      {items.map((s, i) => (
        <div key={i} className="ed-str-row">
          {area
            ? <textarea rows={2} value={s} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
            : <input value={s} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />}
          <div className="ed-str-btns">
            <button className="btn ghost sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
            <button className="btn ghost sm" onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</button>
            <button className="btn ghost sm" style={{ color: 'var(--ink-3)' }} onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
          </div>
        </div>
      ))}
      <button className="btn sm" onClick={() => onChange([...items, ''])}>＋ 추가</button>
    </div>
  )
}
