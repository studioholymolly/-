# -*- coding: utf-8 -*-
"""studioholymolly.com의 실제 콘텐츠(사진 URL·수치·클라이언트)로
인쇄용(PDF 저장) HTML 회사소개서를 생성한다. 16:9 페이지, 모노크롬 시스템.
대표(케이스) 페이지 뒤에 같은 카테고리 갤러리(10컷/페이지, 원본 비율 유지)가 이어지는 구성."""
import json

d = json.load(open('profile_data.json'))
sections, logos, cover, strip = d['sections'], d['logos'], d['cover'], d['strip']

CAT_KO = {'BEAUTY': 'Beauty', 'F&B': 'F&B', 'PRODUCT': 'Product', 'MODEL': 'Model', 'LIFESTYLE': 'Lifestyle'}

def esc(s):
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

pages = []
pno = 0
def n():
    global pno
    pno += 1
    return pno

def meta_bar(label, num, dark=False):
    cls = ' dark' if dark else ''
    return f'''<div class="meta{cls}"><span>{label}</span><span>{num:02d}</span></div><div class="metaline{cls}"></div>'''

# ---------- 01 커버 ----------
n()
pages.append(f'''
<section class="pg cover">
  <div class="cover-imgs">
    <img src="{cover[0]}" alt=""><img src="{cover[1]}" alt=""><img src="{cover[2]}" alt="">
  </div>
  <div class="cover-shade"></div>
  <div class="cover-top">
    <span>STUDIO HOLYMOLLY — VISUAL DIRECTION STUDIO</span>
    <span>COMPANY PROFILE 2026</span>
  </div>
  <div class="cover-main">
    <h1>STUDIO.<br>HOLYMOLLY</h1>
    <div class="cover-foot">
      <span class="tag">브랜드가 보여지는 모든 장면을 만듭니다.</span>
      <span class="sm">SEOUL, YEOKSAM — STUDIOHOLYMOLLY.COM</span>
    </div>
  </div>
</section>''')

# ---------- 02 매니페스토 ----------
pages.append(f'''
<section class="pg dark">
  {meta_bar('PERSPECTIVE', n(), True)}
  <div class="manifesto">
    <p>컷 한 장을 찍는 일보다,<br>그 컷이 브랜드 안에서 어떻게<br>보일지를 먼저 생각합니다.</p>
  </div>
</section>''')

# ---------- 03 Who We Are ----------
pages.append(f'''
<section class="pg">
  {meta_bar('WHO WE ARE', n())}
  <div class="who">
    <div class="who-l">
      <h2>서울 역삼,<br>비주얼 디렉션 스튜디오.</h2>
    </div>
    <div class="who-r">
      <p>스튜디오 홀리몰리는 사진과 영상, 그리고 BX 디자인까지 — 하나의 무드로 이어지는 장면을 설계합니다.</p>
      <p>뷰티와 F&amp;B, 화면 속 질감이 곧 구매가 되는 카테고리에서 출발해 제품 · 라이프스타일 · 모델로 영역을 넓혀왔습니다. 그렇게 찍은 컷이 상세페이지가 되고, 캠페인이 되고, 브랜드의 얼굴이 됩니다.</p>
    </div>
  </div>
  <div class="stats">
    <div><b>120<i>+</i></b><span>BRANDS WORKED WITH</span></div>
    <div><b>800<i>+</i></b><span>PROJECTS DELIVERED</span></div>
    <div><b>7<i>YRS</i></b><span>YEARS OF CRAFT</span></div>
  </div>
</section>''')

# ---------- 04 What We Do ----------
svc = [
    ('01', 'Beauty', '102 WORKS', '제형과 컬러, 클로즈업에서 무너지지 않는 디테일. 뷰티는 홀리몰리의 출발점입니다.'),
    ('02', 'F&B', '65 WORKS', '시즐과 온도, 먹는 순간. 음식을 가장 맛있는 장면으로 기록합니다.'),
    ('03', 'Product', '33 WORKS', '형태와 소재를 정교하게. 커머스 컷부터 캠페인까지, 제품이 팔리게 하는 컷.'),
    ('04', 'Lifestyle', '25 WORKS', '제품이 놓일 실제 삶의 장면을 만들어 브랜드에 생활의 온도를 더합니다.'),
    ('05', 'Model', '16 WORKS', '모델 화보와 캠페인. 브랜드의 결을 인물로 옮깁니다.'),
    ('06', 'Video', 'MOTION', '숏폼 · 커머스 영상 · 브랜드 필름. 사진과 같은 무드를 무빙으로 확장합니다.'),
]
rows = ''.join(f'''
    <div class="row">
      <span class="num">{s0}</span><h3>{s1}</h3><span class="cnt">{s2}</span><p>{s3}</p>
    </div>''' for s0, s1, s2, s3 in svc)
pages.append(f'''
<section class="pg">
  {meta_bar('WHAT WE DO', n())}
  <div class="rows">{rows}</div>
</section>''')

# ---------- 05 WORKS 디바이더 + 필름 스트립 ----------
strip_imgs = ''.join(f'<img src="{u}" alt="">' for u in strip)
pages.append(f'''
<section class="pg dark">
  {meta_bar('SELECTED WORKS', n(), True)}
  <div class="worksdiv">
    <h2>WORKS&nbsp;→</h2>
    <p>말보다 컷이 빠릅니다. 전체 작업물은 studioholymolly.com에서.</p>
  </div>
  <div class="filmstrip">{strip_imgs}</div>
</section>''')

# ---------- 카테고리 섹션: 대표(케이스) 1p + 같은 카테고리 갤러리(10컷/페이지, 원본비율) ----------
ci = 0
for sec in sections:
    cs = sec['case']
    ci += 1
    subs = ''.join(f'<img src="{u}" alt="">' for u in cs['subs'])
    pages.append(f'''
<section class="pg case">
  <div class="case-main"><img src="{cs['main']}" alt="{esc(cs['name'])}"></div>
  <div class="case-side">
    <div class="case-subs">{subs}</div>
    <div class="case-cap">
      <span class="cc">{CAT_KO.get(cs['cat'], cs['cat']).upper()} — CASE {ci:02d}</span>
      <h3>{esc(cs['name'])}</h3>
      <p>{esc(cs['desc'])} · 납품 {cs['count']}컷</p>
    </div>
  </div>
  <div class="case-pageno">{n():02d}</div>
</section>''')
    gn_total = len(sec['galleries'])
    for gi, items in enumerate(sec['galleries'], 1):
        cells = ''.join(f'<div class="gph"><img src="{g["img"]}" alt="{esc(g["name"])}" title="{esc(g["name"])}" loading="lazy"></div>' for g in items)
        pages.append(f'''
<section class="pg gal">
  {meta_bar(f"{cs['cat']} — {sec['brand_count']} BRANDS ({gi}/{gn_total})", n())}
  <div class="galgrid">{cells}</div>
</section>''')

# ---------- 클라이언트 로고 월 ----------
logo_cells = ''.join(f'<div class="clogo"><img src="{l["image"]}" alt="{esc(l["name"])}" title="{esc(l["name"])}" loading="lazy"></div>' for l in logos[:24])
big_names = '바세린 · 딥디크 · 애경산업 · 빙그레 · 풀무원 · 오리온 · 동서식품 · 서울우유 · 동원F&B · 케라시스 · 멜릭서 · DOLE 외 120+ 브랜드'
pages.append(f'''
<section class="pg">
  {meta_bar('CLIENTS — WITH HOLYMOLLY', n())}
  <div class="clients">{logo_cells}</div>
  <p class="clients-line">{big_names}</p>
</section>''')

# ---------- Why ----------
why = [
    ('01', '디렉션이 있는 촬영', '찍기 전에 설계합니다. 레퍼런스부터 무드보드, 세팅 계획까지 — 촬영은 기획의 마지막 단계입니다.'),
    ('02', '질감에 강한 스튜디오', '뷰티의 제형, F&B의 시즐, 패브릭의 결. 클로즈업에서 무너지지 않는 디테일.'),
    ('03', '현장에서 한 컷 더', '계획에 없던 세팅을 그 자리에서 추가하는 팀. 같은 예산에서 얻는 컷이 늘어납니다.'),
    ('04', '원본부터 다른 퀄리티', '톤 정리만 거친 원본을 그대로 보여드릴 수 있는 촬영. 보정은 마지막 손질입니다.'),
]
cells = ''.join(f'''
    <div class="wcell"><span class="num">{w0}</span><div><h3>{w1}</h3><p>{w2}</p></div></div>''' for w0, w1, w2 in why)
pages.append(f'''
<section class="pg">
  {meta_bar('WHY HOLYMOLLY', n())}
  <h2 class="sec-title">홀리몰리와 찍으면 다른 것</h2>
  <div class="whygrid">{cells}</div>
</section>''')

# ---------- Process ----------
proc = [
    ('01', '상담 · 기획', '24시간 안에 답장합니다. 목적과 무드를 듣고 레퍼런스 · 세팅 · 견적을 제안합니다.'),
    ('02', '촬영', '역삼 스튜디오 또는 로케이션. 현장에서 컷을 함께 확인하며 진행합니다.'),
    ('03', '셀렉 · 리터칭', '정리된 컷에서 고르시면, 피드백을 반영해 정성껏 보정합니다.'),
    ('04', '전달', '고해상도 완성본을 일정에 맞춰 구글 드라이브로 전달합니다.'),
]
cols = ''.join(f'''
    <div class="pcol"><span class="bignum">{p0}</span><h3>{p1}</h3><p>{p2}</p></div>''' for p0, p1, p2 in proc)
pages.append(f'''
<section class="pg dark">
  {meta_bar('HOW WE WORK', n(), True)}
  <h2 class="sec-title wh">상담부터 전달까지, 네 걸음</h2>
  <div class="procgrid">{cols}</div>
</section>''')

# ---------- 진행 안내 ----------
guide = [
    ('원본은 다음 날, 무료', '촬영 원본(JPG)은 기본 무료로, 촬영 다음 날 구글 드라이브 링크로 전달됩니다. RAW · PSD는 요청 시 별도 제공.'),
    ('보정본은 7일 이내', '셀렉하신 날로부터 7일 이내에 정밀 보정본을 전달합니다. 급한 일정은 ASAP 긴급 보정 옵션으로 단축 납품이 가능합니다.'),
    ('견적은 24시간 안에', '촬영 종류 · 수량 · 희망 일정을 알려주시면 레퍼런스와 세팅, 견적을 24시간 안에 제안드립니다.'),
    ('카톡으로 편하게', '카카오톡 채널 @스튜디오홀리몰리에서 1:1 상담으로 바로 진행 상황을 주고받을 수 있습니다.'),
]
gcells = ''.join(f'''
    <div class="gcell"><h3>{g0}</h3><p>{g1}</p></div>''' for g0, g1 in guide)
pages.append(f'''
<section class="pg">
  {meta_bar('WORKING WITH US', n())}
  <h2 class="sec-title">이렇게 진행됩니다</h2>
  <div class="guidegrid">{gcells}</div>
</section>''')

# ---------- Contact ----------
pages.append(f'''
<section class="pg dark contactpg">
  {meta_bar('CONTACT', n(), True)}
  <div class="contact-main"><h2>START<br>A PROJECT&nbsp;→</h2></div>
  <div class="contactgrid">
    <div><span>EMAIL</span><b>studio.holymolly@gmail.com</b></div>
    <div><span>PHONE · KAKAO</span><b>010-8236-9368 · @스튜디오홀리몰리</b></div>
    <div><span>INSTAGRAM · THREADS</span><b>@studio_holymolly</b></div>
    <div><span>ADDRESS</span><b>서울 강남구 역삼동 783-2, B1</b></div>
  </div>
  <p class="bizline">스튜디오 홀리몰리 · 대표 이수민 · studioholymolly.com</p>
</section>''')

CSS = '''
:root{--paper:#fafaf8;--ink:#0a0a0a;--gray:#6f6f6f;--gray3:#a3a3a3;--line:#e5e5e3;
--dark:#111;--dgray:#9a9a9a;--dline:#2e2e2e;--dlabel:#8a8a8a;--dnum:#4a4a4a}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans KR','Apple SD Gothic Neo',sans-serif;background:#333;color:var(--ink)}
.jost,h1,.cover-top,.meta,.stats b,.bignum,.num,.cnt,.cc,.worksdiv h2,.contact-main h2,.contactgrid span{font-family:'Jost','Noto Sans KR',sans-serif}
.pg{width:340mm;height:191.25mm;background:var(--paper);position:relative;overflow:hidden;
padding:9mm 12mm;margin:6mm auto;box-shadow:0 2px 24px rgba(0,0,0,.35)}
.pg.dark{background:var(--dark);color:var(--paper)}
.meta{display:flex;justify-content:space-between;font-size:8.5pt;letter-spacing:.22em;color:var(--gray);font-weight:500}
.meta.dark{color:var(--dlabel)}
.metaline{height:.3mm;background:var(--line);margin-top:3.5mm}
.metaline.dark{background:var(--dline)}
/* cover */
.cover{padding:0}
.cover-imgs{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr 1fr}
.cover-imgs img{width:100%;height:100%;object-fit:cover;display:block}
.cover-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,10,10,.55),rgba(10,10,10,.25) 40%,rgba(10,10,10,.72))}
.cover-top{position:absolute;top:9mm;left:12mm;right:12mm;display:flex;justify-content:space-between;
color:rgba(250,250,248,.85);font-size:8.5pt;letter-spacing:.22em;border-bottom:.3mm solid rgba(250,250,248,.35);padding-bottom:3.5mm}
.cover-main{position:absolute;left:12mm;right:12mm;bottom:12mm;color:var(--paper)}
.cover-main h1{font-size:64pt;font-weight:400;letter-spacing:.1em;line-height:1.04;text-transform:uppercase}
.cover-foot{display:flex;justify-content:space-between;align-items:baseline;margin-top:8mm;
border-top:.3mm solid rgba(250,250,248,.35);padding-top:4mm}
.cover-foot .tag{font-weight:700;font-size:12.5pt}
.cover-foot .sm{font-size:8pt;letter-spacing:.18em;color:rgba(250,250,248,.7)}
/* manifesto */
.manifesto{display:flex;align-items:center;height:150mm}
.manifesto p{font-size:33pt;font-weight:700;line-height:1.55}
/* who */
.who{display:grid;grid-template-columns:1.25fr 1fr;gap:16mm;margin-top:14mm}
.who h2{font-size:29pt;font-weight:800;line-height:1.3;letter-spacing:-.02em}
.who-r p{font-size:10.5pt;line-height:1.85;color:var(--gray);margin-bottom:5mm}
.stats{position:absolute;left:12mm;right:12mm;bottom:12mm;display:grid;grid-template-columns:1fr 1fr 1fr;
border-top:.5mm solid var(--ink)}
.stats div{padding:7mm 0 0;border-right:.3mm solid var(--line);padding-left:7mm}
.stats div:first-child{padding-left:0}.stats div:last-child{border-right:0}
.stats b{font-size:31pt;font-weight:500;letter-spacing:.02em}
.stats i{font-style:normal;font-size:14pt;color:var(--gray3);margin-left:1mm}
.stats span{display:block;font-size:7.5pt;letter-spacing:.2em;color:var(--gray);margin-top:2mm}
/* rows */
.rows{margin-top:8mm}
.row{display:grid;grid-template-columns:16mm 46mm 26mm 1fr;align-items:baseline;gap:6mm;
padding:5.4mm 0;border-bottom:.3mm solid var(--line)}
.row .num{font-size:13pt;color:var(--gray3)}
.row h3{font-size:16.5pt;font-weight:800;letter-spacing:-.01em}
.row .cnt{font-size:8pt;letter-spacing:.18em;color:var(--gray3)}
.row p{font-size:9.5pt;color:var(--gray);line-height:1.6}
/* works divider + filmstrip */
.worksdiv{margin-top:14mm}
.worksdiv h2{font-size:82pt;font-weight:400;letter-spacing:.08em}
.worksdiv p{margin-top:7mm;color:var(--dgray);font-size:11pt}
.filmstrip{position:absolute;left:12mm;right:12mm;bottom:11mm;display:grid;
grid-template-columns:repeat(8,1fr);gap:2.5mm}
.filmstrip img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block}
/* case */
.case{padding:0}
.case-main{position:absolute;left:0;top:0;bottom:0;width:60%}
.case-main img{width:100%;height:100%;object-fit:cover;display:block}
.case-side{position:absolute;right:0;top:0;bottom:0;width:40%;padding:8mm 10mm;display:flex;flex-direction:column}
.case-subs{display:grid;grid-template-columns:1fr 1fr;gap:3.5mm}
.case-subs img{width:100%;aspect-ratio:4/4.6;object-fit:cover;display:block}
.case-cap{margin-top:auto;border-top:.5mm solid var(--ink);padding-top:4.5mm}
.case-cap .cc{font-size:8pt;letter-spacing:.22em;color:var(--gray)}
.case-cap h3{font-size:20pt;font-weight:800;margin:2mm 0}
.case-cap p{font-size:9.5pt;color:var(--gray);line-height:1.6}
.case-pageno{position:absolute;right:10mm;bottom:6mm;font-size:8.5pt;letter-spacing:.22em;color:var(--gray3)}
/* gallery brand wall */
.gal{padding-bottom:9mm}
.galgrid{margin-top:5mm;display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(2,1fr);
gap:3.5mm;height:156mm}
.gph{display:flex;align-items:center;justify-content:center;background:#f1f0ee;overflow:hidden}
.gph img{max-width:100%;max-height:100%;object-fit:contain;display:block}
/* clients */
.clients{margin-top:9mm;display:grid;grid-template-columns:repeat(6,1fr);gap:.3mm;background:var(--line);
border:.3mm solid var(--line)}
.clogo{background:#fff;height:26mm;display:flex;align-items:center;justify-content:center;padding:4mm}
.clogo img{max-width:80%;max-height:70%;object-fit:contain}
.clients-line{position:absolute;left:12mm;right:12mm;bottom:10mm;font-size:9.5pt;color:var(--gray);
border-top:.3mm solid var(--line);padding-top:4mm}
/* why */
.sec-title{font-size:24pt;font-weight:800;letter-spacing:-.02em;margin-top:9mm}
.sec-title.wh{color:var(--paper)}
.whygrid{margin-top:9mm;display:grid;grid-template-columns:1fr 1fr;border-top:.5mm solid var(--ink)}
.wcell{display:flex;gap:8mm;padding:9mm 8mm 9mm 0;border-bottom:.3mm solid var(--line)}
.wcell:nth-child(odd){border-right:.3mm solid var(--line)}
.wcell:nth-child(even){padding-left:8mm}
.wcell .num{font-size:26pt;color:var(--gray3)}
.wcell h3{font-size:13.5pt;font-weight:800;margin-bottom:2.5mm}
.wcell p{font-size:9.5pt;color:var(--gray);line-height:1.65}
/* process */
.procgrid{margin-top:10mm;display:grid;grid-template-columns:repeat(4,1fr);border-top:.3mm solid var(--dline)}
.pcol{padding:8mm 7mm 0 0;border-right:.3mm solid var(--dline);padding-left:7mm}
.pcol:first-child{padding-left:0}.pcol:last-child{border-right:0}
.bignum{display:block;font-size:33pt;color:var(--dnum);margin-bottom:9mm}
.pcol h3{font-size:13pt;font-weight:700;color:var(--paper);margin-bottom:3mm}
.pcol p{font-size:9pt;color:var(--dgray);line-height:1.7}
/* guide */
.guidegrid{margin-top:9mm;display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:.5mm solid var(--ink)}
.gcell{padding:8mm 8mm 8mm 0;border-bottom:.3mm solid var(--line)}
.gcell:nth-child(odd){border-right:.3mm solid var(--line)}
.gcell:nth-child(even){padding-left:8mm}
.gcell h3{font-size:14pt;font-weight:800;margin-bottom:3mm}
.gcell p{font-size:9.8pt;color:var(--gray);line-height:1.7}
/* contact */
.contact-main h2{font-size:64pt;font-weight:400;letter-spacing:.08em;line-height:1.06;margin-top:12mm}
.contactgrid{position:absolute;left:12mm;right:12mm;bottom:22mm;display:grid;grid-template-columns:repeat(4,1fr);
border-top:.3mm solid var(--dline);padding-top:5mm;gap:6mm}
.contactgrid span{display:block;font-size:7.5pt;letter-spacing:.2em;color:var(--dlabel);margin-bottom:2.5mm}
.contactgrid b{font-size:10pt}
.bizline{position:absolute;left:12mm;bottom:9mm;font-size:8pt;color:var(--dnum)}
/* print helper (화면 전용) */
.printbar{position:sticky;top:0;z-index:9;background:#0a0a0a;color:#fafaf8;padding:12px 20px;
font-size:13px;display:flex;gap:18px;align-items:center}
.printbar button{background:#fafaf8;color:#0a0a0a;border:0;padding:8px 18px;font-weight:700;cursor:pointer}
@media print{
  .printbar{display:none}
  body{background:#fff}
  .pg{margin:0;box-shadow:none;page-break-after:always}
  @page{size:340mm 191.25mm;margin:0}
}
'''

html = f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>STUDIO HOLYMOLLY — Company Profile 2026</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500&family=Noto+Sans+KR:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>{CSS}</style>
</head>
<body>
<div class="printbar">
  <b>STUDIO HOLYMOLLY 회사소개서</b>
  <span>PDF로 저장: 사진이 모두 뜬 뒤 버튼 클릭 → 대상 "PDF로 저장" → 여백 "없음" · "배경 그래픽" 체크</span>
  <button onclick="window.print()">PDF로 저장</button>
</div>
{''.join(pages)}
</body>
</html>'''

open('STUDIO-HOLYMOLLY_Profile_2026.html', 'w').write(html)
print('saved, pages:', html.count('class="pg'))
