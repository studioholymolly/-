# -*- coding: utf-8 -*-
"""스튜디오 홀리몰리 회사소개서 PPTX 생성 (구글 슬라이드 편집용).

폰트는 구글 폰트인 Jost(영문 디스플레이) + Noto Sans KR(국문)만 사용.
모든 요소는 일반 텍스트 박스/사각형이라 구글 슬라이드에서 그대로 수정 가능.
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

PAPER = RGBColor(0xFA, 0xFA, 0xF8)
INK = RGBColor(0x0A, 0x0A, 0x0A)
GRAY = RGBColor(0x6F, 0x6F, 0x6F)
GRAY3 = RGBColor(0xA3, 0xA3, 0xA3)
LINE = RGBColor(0xE5, 0xE5, 0xE3)
DARK = RGBColor(0x11, 0x11, 0x11)
DGRAY = RGBColor(0x90, 0x90, 0x90)   # dark-slide body
DLINE = RGBColor(0x2E, 0x2E, 0x2E)   # dark-slide hairline
PH_FILL = RGBColor(0xF0, 0xF0, 0xEE)  # image placeholder

DISPLAY = 'Jost'
KR = 'Noto Sans KR'

W, H = Inches(13.333), Inches(7.5)
MX = Inches(0.7)              # side margin
CW = W - MX * 2               # content width

prs = Presentation()
prs.slide_width = W
prs.slide_height = H
BLANK = prs.slide_layouts[6]


def set_run(run, size, color, bold=False, latin=DISPLAY, ea=KR, spacing=None):
    f = run.font
    f.size = Pt(size)
    f.bold = bold
    f.color.rgb = color
    f.name = latin
    rPr = run._r.get_or_add_rPr()
    for tag in ('a:ea', 'a:cs'):
        for el in rPr.findall(qn(tag)):
            rPr.remove(el)
    latin_el = rPr.find(qn('a:latin'))
    ea_el = rPr.makeelement(qn('a:ea'), {'typeface': ea})
    cs_el = rPr.makeelement(qn('a:cs'), {'typeface': ea})
    latin_el.addnext(cs_el)
    latin_el.addnext(ea_el)
    if spacing is not None:
        rPr.set('spc', str(spacing))


def textbox(slide, x, y, w, h, lines, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP,
            line_spacing=None, space_after=None):
    """lines: list of (text, kwargs-for-set_run) tuples — 문단 하나당 한 줄."""
    box = slide.shapes.add_textbox(x, y, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, (text, kw) in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        if line_spacing:
            p.line_spacing = line_spacing
        if space_after is not None:
            p.space_after = Pt(space_after)
        run = p.add_run()
        run.text = text
        set_run(run, **kw)
    return box


def rect(slide, x, y, w, h, fill, outline=None):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    if outline is None:
        sh.line.fill.background()
    else:
        sh.line.color.rgb = outline
        sh.line.width = Pt(0.75)
    sh.shadow.inherit = False
    # 테마 style 참조(그림자·강조색 상속)를 제거해 어느 뷰어에서든 플랫하게
    style = sh._element.find(qn('p:style'))
    if style is not None:
        sh._element.remove(style)
    return sh


def hairline(slide, x, y, w, color=LINE, weight=0.9):
    return rect(slide, x, y, w, Emu(int(Pt(weight))), color)


def new_slide(bg=PAPER):
    slide = prs.slides.add_slide(BLANK)
    rect(slide, 0, 0, W, H, bg)
    return slide


def label(slide, text, dark=False, x=MX, y=Inches(0.55)):
    color = RGBColor(0x8A, 0x8A, 0x8A) if dark else GRAY
    textbox(slide, x, y, Inches(8), Inches(0.35),
            [(text.upper(), dict(size=10, color=color, spacing=200))])


def footer(slide, num, dark=False):
    c = GRAY if dark else GRAY3
    textbox(slide, MX, H - Inches(0.42), Inches(4), Inches(0.3),
            [('STUDIO. HOLYMOLLY', dict(size=8, color=c, spacing=150))])
    textbox(slide, W - MX - Inches(1), H - Inches(0.42), Inches(1), Inches(0.3),
            [(f'{num:02d}', dict(size=8, color=c, spacing=150))],
            align=PP_ALIGN.RIGHT)


def img_placeholder(slide, x, y, w, h, note):
    rect(slide, x, y, w, h, PH_FILL, outline=LINE)
    textbox(slide, x, y, w, h,
            [('IMAGE', dict(size=10, color=GRAY3, spacing=250)),
             (note, dict(size=9.5, color=GRAY3, latin=KR))],
            align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, space_after=4)


def heading(slide, kicker, title_lines, dark=False, y=Inches(0.55)):
    label(slide, kicker, dark=dark, y=y)
    color = PAPER if dark else INK
    textbox(slide, MX, y + Inches(0.45), CW, Inches(1.3),
            [(t, dict(size=24, color=color, bold=True, latin=KR)) for t in title_lines],
            line_spacing=1.15)


# ============================================================ P1 — 커버
s = new_slide()
label(s, 'COMPANY PROFILE — 2026')
textbox(s, MX - Inches(0.05), Inches(1.9), CW, Inches(3.4),
        [('STUDIO.', dict(size=92, color=INK, spacing=300)),
         ('HOLYMOLLY', dict(size=92, color=INK, spacing=300))],
        line_spacing=1.02)
textbox(s, MX, Inches(5.8), Inches(8), Inches(0.5),
        [('브랜드가 보여지는 모든 장면을 만듭니다.', dict(size=16, color=INK, bold=True, latin=KR))])
textbox(s, MX, Inches(6.45), Inches(8), Inches(0.4),
        [('스튜디오 홀리몰리 — Visual Direction Studio', dict(size=11, color=GRAY, latin=KR))])
textbox(s, W - MX - Inches(4), H - Inches(0.5), Inches(4), Inches(0.3),
        [('studioholymolly.myportfolio.com', dict(size=9, color=GRAY3, spacing=100))],
        align=PP_ALIGN.RIGHT)

# ============================================================ P2 — Perspective
s = new_slide()
label(s, 'Perspective')
textbox(s, MX, Inches(2.1), CW, Inches(2.9),
        [('컷 한 장을 찍는 일보다,', dict(size=30, color=INK, bold=True, latin=KR)),
         ('그 컷이 브랜드 안에서 어떻게 보일지를', dict(size=30, color=INK, bold=True, latin=KR)),
         ('먼저 생각합니다.', dict(size=30, color=INK, bold=True, latin=KR))],
        line_spacing=1.4)
textbox(s, MX, Inches(5.5), Inches(9.2), Inches(1.2),
        [('스튜디오 홀리몰리는 서울 역삼의 비주얼 디렉션 스튜디오입니다. 사진과 영상, 그리고 BX 디자인까지 — 하나의 무드로 이어지는 장면을 설계합니다.',
          dict(size=12.5, color=GRAY, latin=KR))],
        line_spacing=1.6)
footer(s, 2)

# ============================================================ P3 — Story
s = new_slide()
label(s, 'Perspective')
textbox(s, MX, Inches(2.0), Inches(5.8), Inches(1.6),
        [('질감이 전부인 카테고리에서', dict(size=24, color=INK, bold=True, latin=KR)),
         ('시작했습니다', dict(size=24, color=INK, bold=True, latin=KR))],
        line_spacing=1.25)
textbox(s, MX, Inches(3.7), Inches(5.5), Inches(3.0),
        [('뷰티와 F&B — 화면 속 질감이 곧 구매가 되는 카테고리에서 출발해, 제품 · 라이프스타일 · 패션 · 인물로 영역을 넓혀왔습니다.',
          dict(size=12, color=GRAY, latin=KR)),
         ('촬영 전 기획 단계에서 무드와 톤을 함께 설계하고, 현장에서는 계획에 없던 장면도 그 자리에서 만들어냅니다. 그렇게 찍은 컷이 상세페이지가 되고, 캠페인이 되고, 브랜드의 얼굴이 됩니다.',
          dict(size=12, color=GRAY, latin=KR))],
        line_spacing=1.6, space_after=10)
img_placeholder(s, Inches(7.1), Inches(1.15), Inches(5.5), Inches(5.4), '질감 클로즈업 컷으로 교체 (뷰티 제형 / F&B 시즐)')
footer(s, 3)

# ============================================================ P4 — At a Glance
s = new_slide()
label(s, 'At a Glance')
hairline(s, MX, Inches(2.0), CW, INK, 1.4)
facts = [
    ('STUDIO', '스튜디오 홀리몰리', 'Visual Direction Studio', 13),
    ('FIELD', 'Photo · Film · Branding', '기획부터 촬영, 브랜드 경험 설계까지', 13),
    ('LOCATION', '서울 강남구 역삼동 783-2, B1', '스튜디오 및 로케이션 촬영', 13),
    ('CONTACT', 'studio.holymolly@gmail.com', '@studio_holymolly', 11),
]
col_w = CW / 4
for i, (lab, val, sub, vsize) in enumerate(facts):
    x = MX + col_w * i
    if i > 0:
        rect(s, x - Emu(int(Pt(0.45))), Inches(2.0), Emu(int(Pt(0.9))), Inches(3.2), LINE)
    pad = Inches(0.28) if i else 0
    textbox(s, x + pad, Inches(2.4), col_w - Inches(0.5), Inches(2.8),
            [(lab, dict(size=9, color=GRAY, spacing=200)),
             ('', dict(size=6, color=GRAY)),
             (val, dict(size=vsize, color=INK, bold=True, latin=KR)),
             (sub, dict(size=10, color=GRAY, latin=KR))],
            line_spacing=1.35, space_after=6)
hairline(s, MX, Inches(5.2), CW)
textbox(s, MX, Inches(5.7), CW, Inches(0.8),
        [('* 누적 프로젝트 수 · 함께한 브랜드 수 등 실적 숫자는 확정되는 대로 이 페이지에 추가',
          dict(size=9.5, color=GRAY3, latin=KR))])
footer(s, 4)

# ============================================================ P5–6 — Services
services = [
    ('01', '뷰티 & 제품', '코스메틱의 제형과 컬러, 제품의 형태와 소재를 정교하게 담아냅니다. 스마트스토어 컷부터 브랜드 캠페인까지, 제품이 팔리게 하는 컷을 만듭니다.'),
    ('02', 'F&B & 라이프스타일', '시즐과 온도, 쓰는 장면과 먹는 순간. 제품이 놓일 실제 삶의 장면을 만들어 브랜드에 생활의 온도를 더합니다.'),
    ('03', '패션 & 인물', '시즌 룩북과 커머스 화보, 그리고 브랜드를 이끄는 사람들. 브랜드의 결을 인물과 착장으로 옮깁니다.'),
    ('04', '영상', '브랜드 필름, 커머스 영상, 소셜 콘텐츠. 사진과 같은 무드를 무빙으로 확장해 채널 전체의 톤을 맞춥니다.'),
    ('05', 'BX 디자인', '촬영을 넘어 브랜드 경험을 설계합니다. 비주얼 아이덴티티부터 콘텐츠 시스템까지, 장면이 브랜드가 되도록.'),
]

def service_rows(slide, items, start_y):
    y = start_y
    row_h = Inches(1.42)
    for num, title, body in items:
        hairline(slide, MX, y, CW)
        textbox(slide, MX, y + Inches(0.3), Inches(0.9), Inches(0.4),
                [(num, dict(size=11, color=GRAY3, spacing=150))])
        textbox(slide, MX + Inches(1.1), y + Inches(0.22), Inches(4.6), Inches(0.6),
                [(title, dict(size=18, color=INK, bold=True, latin=KR))])
        textbox(slide, MX + Inches(6.1), y + Inches(0.28), CW - Inches(6.1), Inches(1.05),
                [(body, dict(size=11, color=GRAY, latin=KR))], line_spacing=1.5)
        y += row_h
    hairline(slide, MX, y, CW)

s = new_slide()
heading(s, 'Services', ['이런 작업을 함께합니다'])
service_rows(s, services[:3], Inches(2.25))
footer(s, 5)

s = new_slide()
heading(s, 'Services — cont.', ['이런 작업을 함께합니다'])
service_rows(s, services[3:], Inches(2.25))
textbox(s, MX, Inches(5.6), CW, Inches(0.8),
        [('사진 · 영상 · 디자인을 한 팀이 진행하면, 채널 전체가 하나의 무드로 이어집니다.',
          dict(size=12, color=GRAY, latin=KR))])
footer(s, 6)

# ============================================================ P7 — Works divider (dark)
s = new_slide(DARK)
label(s, 'Selected Works', dark=True)
textbox(s, MX, Inches(1.7), CW, Inches(2.0),
        [('말보다 컷이 빠릅니다.', dict(size=30, color=PAPER, bold=True, latin=KR)),
         ('작업물은 여기서 보세요.', dict(size=30, color=PAPER, bold=True, latin=KR))],
        line_spacing=1.3)
textbox(s, MX, Inches(3.75), Inches(8.5), Inches(0.8),
        [('카테고리별 작업물과 최근 프로젝트는 포트폴리오 사이트와 SNS 채널에 계속 업데이트하고 있습니다.',
          dict(size=11.5, color=DGRAY, latin=KR))], line_spacing=1.5)
hairline(s, MX, Inches(4.75), CW, DLINE)
links = [
    ('01', 'Portfolio', 'studioholymolly.myportfolio.com'),
    ('02', 'Instagram', '@studio_holymolly — 최근 작업과 현장 컷'),
    ('03', 'Threads', '@studio_holymolly — 보정 전 원본 컷까지 공개'),
]
col_w = CW / 3
for i, (num, title, desc) in enumerate(links):
    x = MX + col_w * i
    textbox(s, x, Inches(5.15), col_w - Inches(0.4), Inches(1.6),
            [(num, dict(size=10, color=RGBColor(0x6F, 0x6F, 0x6F), spacing=150)),
             (title, dict(size=15, color=PAPER, bold=True)),
             (desc, dict(size=10, color=DGRAY, latin=KR))],
            line_spacing=1.5, space_after=4)
footer(s, 7, dark=True)

# ============================================================ P8–11 — 케이스 템플릿 4장
cases = [
    ('CASE 01', '뷰티 대표 컷으로 교체'),
    ('CASE 02', '제품/커머스 대표 컷으로 교체'),
    ('CASE 03', 'F&B 대표 컷으로 교체'),
    ('CASE 04', '라이프스타일 · 인물 대표 컷으로 교체'),
]
for i, (case_no, img_note) in enumerate(cases):
    s = new_slide()
    label(s, f'Selected Works — {case_no}')
    img_placeholder(s, MX, Inches(1.15), Inches(7.5), Inches(5.4), img_note)
    tx = MX + Inches(7.9)
    tw = W - MX - tx
    textbox(s, tx, Inches(1.3), tw, Inches(1.2),
            [('[클라이언트/브랜드명]', dict(size=16, color=INK, bold=True, latin=KR)),
             ('[프로젝트명]', dict(size=13, color=INK, latin=KR))],
            line_spacing=1.35)
    hairline(s, tx, Inches(2.75), tw)
    textbox(s, tx, Inches(3.0), tw, Inches(3.2),
            [('SCOPE', dict(size=9, color=GRAY, spacing=200)),
             ('기획 · 촬영 · 리터칭 (해당 항목만 남기기)', dict(size=10.5, color=GRAY, latin=KR)),
             ('', dict(size=8, color=GRAY)),
             ('SUMMARY', dict(size=9, color=GRAY, spacing=200)),
             ('[한 줄 요약 — 무엇을 해결했는지. 예: 신제품 론칭 상세페이지 전체 비주얼]',
              dict(size=10.5, color=GRAY, latin=KR))],
            line_spacing=1.5, space_after=5)
    footer(s, 8 + i)

# ============================================================ P12 — Why Holymolly
s = new_slide()
heading(s, 'Why Holymolly', ['홀리몰리와 찍으면 다른 것'])
strengths = [
    ('01', '디렉션이 있는 촬영', '찍기 전에 설계합니다. 레퍼런스 정리부터 무드보드, 세팅 계획까지 — 촬영은 기획의 마지막 단계입니다.'),
    ('02', '질감에 강한 스튜디오', '뷰티의 제형, F&B의 시즐, 패브릭의 결. 클로즈업에서 무너지지 않는 디테일을 만듭니다.'),
    ('03', '현장에서 한 컷 더', '촬영이 잘 풀리는 날, 계획에 없던 세팅을 그 자리에서 추가하는 팀입니다. 같은 예산에서 얻어가는 컷이 늘어납니다.'),
    ('04', '원본부터 다른 퀄리티', '톤 정리만 거친 원본을 그대로 보여드릴 수 있는 촬영을 지향합니다. 보정은 원본을 살리는 마지막 손질입니다.'),
]
grid_y = Inches(2.35)
cell_w, cell_h = CW / 2, Inches(2.25)
hairline(s, MX, grid_y, CW, INK, 1.4)
for i, (num, title, body) in enumerate(strengths):
    r, c = divmod(i, 2)
    x = MX + cell_w * c
    y = grid_y + cell_h * r
    if r > 0:
        hairline(s, MX, y, CW)
    pad = Inches(0.35) if c else 0
    textbox(s, x + pad, y + Inches(0.3), cell_w - Inches(0.7), cell_h - Inches(0.5),
            [(num, dict(size=10, color=GRAY3, spacing=150)),
             (title, dict(size=15, color=INK, bold=True, latin=KR)),
             (body, dict(size=10.5, color=GRAY, latin=KR))],
            line_spacing=1.45, space_after=6)
rect(s, MX + cell_w - Emu(int(Pt(0.45))), grid_y, Emu(int(Pt(0.9))), cell_h * 2, LINE)
footer(s, 12)

# ============================================================ P13 — Process (dark)
s = new_slide(DARK)
label(s, 'Process', dark=True)
textbox(s, MX, Inches(1.0), CW, Inches(0.9),
        [('상담부터 전달까지, 네 걸음', dict(size=24, color=PAPER, bold=True, latin=KR))])
process = [
    ('01', '상담 · 기획', '문의 주시면 24시간 안에 답장드립니다. 목적과 무드를 듣고, 레퍼런스와 세팅 방향, 견적을 제안합니다.'),
    ('02', '촬영', '역삼 스튜디오 또는 로케이션에서. 현장에서 컷을 함께 확인하며, 좋은 장면이 보이면 그 자리에서 더 만듭니다.'),
    ('03', '셀렉 · 리터칭', '촬영 컷을 정리해 보내드리고, 고르신 컷을 정성껏 보정합니다. 피드백을 주고받으며 디테일을 다듬습니다.'),
    ('04', '전달', '합의된 일정에 고해상도 완성본을 전달합니다. 사용하실 채널에 맞춘 포맷 정리도 함께합니다.'),
]
hairline(s, MX, Inches(2.4), CW, DLINE)
col_w = CW / 4
for i, (num, title, body) in enumerate(process):
    x = MX + col_w * i
    if i > 0:
        rect(s, x - Emu(int(Pt(0.45))), Inches(2.4), Emu(int(Pt(0.9))), Inches(3.6), DLINE)
    pad = Inches(0.3) if i else 0
    textbox(s, x + pad, Inches(2.85), col_w - Inches(0.55), Inches(3.2),
            [(num, dict(size=10, color=RGBColor(0x6F, 0x6F, 0x6F), spacing=150)),
             (title, dict(size=14.5, color=PAPER, bold=True, latin=KR)),
             (body, dict(size=10, color=DGRAY, latin=KR))],
            line_spacing=1.5, space_after=8)
footer(s, 13, dark=True)

# ============================================================ P14 — Studio
s = new_slide()
label(s, 'Studio')
textbox(s, MX, Inches(2.0), Inches(5.8), Inches(0.8),
        [('역삼에 있습니다', dict(size=24, color=INK, bold=True, latin=KR))])
textbox(s, MX, Inches(3.1), Inches(5.5), Inches(2.6),
        [('서울 강남구 역삼동 783-2, B1', dict(size=14, color=INK, bold=True, latin=KR)),
         ('', dict(size=8, color=GRAY)),
         ('제품 · 뷰티 · F&B 촬영에 맞춘 세팅으로 운영하며, 컨셉에 따라 로케이션 촬영도 진행합니다.',
          dict(size=11.5, color=GRAY, latin=KR)),
         ('방문 상담은 이메일 또는 문의 폼으로 일정을 잡아주세요.',
          dict(size=11.5, color=GRAY, latin=KR))],
        line_spacing=1.55, space_after=6)
img_placeholder(s, Inches(7.1), Inches(1.15), Inches(5.5), Inches(5.4), '스튜디오 공간 컷으로 교체')
footer(s, 14)

# ============================================================ P15 — Contact
s = new_slide()
label(s, 'Contact')
textbox(s, MX - Inches(0.03), Inches(2.0), CW, Inches(1.6),
        [('START A PROJECT', dict(size=64, color=INK, spacing=250))])
hairline(s, MX, Inches(4.0), CW)
contact = [
    ('EMAIL', 'studio.holymolly@gmail.com'),
    ('INSTAGRAM · THREADS', '@studio_holymolly'),
    ('PORTFOLIO', 'studioholymolly.myportfolio.com'),
]
col_w = CW / 3
for i, (lab, val) in enumerate(contact):
    x = MX + col_w * i
    textbox(s, x, Inches(4.4), col_w - Inches(0.4), Inches(1.2),
            [(lab, dict(size=9, color=GRAY, spacing=200)),
             (val, dict(size=13, color=INK, bold=True))],
            line_spacing=1.6, space_after=6)
textbox(s, MX, Inches(6.5), CW, Inches(0.5),
        [('스튜디오 홀리몰리 — 서울 강남구 역삼동 783-2, B1', dict(size=10, color=GRAY3, latin=KR))])

out = 'STUDIO-HOLYMOLLY_Profile_2026.pptx'
prs.save(out)
print('saved', out, '| slides:', len(prs.slides.__iter__.__self__._sldIdLst))
