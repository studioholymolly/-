/* ============================================================
   촬영 문의 공개 페이지 콘텐츠 — 기본값
   - 실제 운영값은 Supabase `inquiry_site` 테이블에 저장되며
     대시보드 [촬영 문의 → 폼 콘텐츠 편집]에서 수정·추가·삭제합니다.
   - 이 파일은 저장된 값이 없을 때의 기본값(카카오 채널·몰리봇 내용 기반).
   - ⚠️ 대시보드 코드(data.js)를 import하지 않는 순수 상수 모듈.
============================================================ */

export const DEFAULT_SITE = {
  studio: {
    name: '스튜디오 홀리몰리',
    tagline: '브랜드의 매력을 시각적으로 설계하는\n브랜드 콘텐츠 제작 전문 스튜디오',
    replyPromise: '접수 확인 후 영업일 기준 24시간 내 담당자가 답변드립니다.',
    ctaLabel: '✏️ 촬영 문의 등록하기', // 각 탭 하단 공통 CTA 버튼 문구
  },

  /* 랜딩 최상단 고정 버튼 3개 — 문의 등록은 항상 표시(문구만 편집),
     도우미·레퍼런스는 on:false로 숨길 수 있다. desc 비우면 문의 버튼은 답변 약속 문구 사용 */
  landingFixed: {
    inquiry: { ic: '✏️', title: '촬영 문의 등록하기', desc: '' },
    planner: { on: true, ic: '🐥', title: '촬영 기획안 도우미', desc: '기획안이 처음이라면 — 3분 선택만으로 PPT·PDF 기획안 완성' },
    reference: { on: true, ic: '📌', title: '촬영 레퍼런스 모아보기', desc: '뷰티 · F&B · 라이프스타일 · 영상 키워드만 고르면 핀터레스트 레퍼런스가 한 번에' },
  },

  contact: {
    kakaoUrl: 'http://pf.kakao.com/_xkURyG',
    kakaoChatUrl: 'http://pf.kakao.com/_xkURyG/chat',
    phone: '010-8236-9368',
    email: 'studio.holymolly@gmail.com',
    website: 'https://studioholymolly.com',
    location: '서울 강남구 역삼동 783-2 B1',
  },

  /* 스튜디오 위치 · 오시는 길 (/inquiry → 스튜디오 위치) */
  place: {
    address: '서울 강남구 역삼동 783-2',
    addressDetail: 'B1', // 도로명 주소·층·호수 — 대시보드에서 입력
    naverMapUrl: 'https://naver.me/5l7ThgyS',
    notes: [
      '방문 전 미리 연락 주시면 찾아오시는 길을 자세히 안내해 드려요.',
      '주차 안내가 필요하시면 문의 시 말씀해 주세요.',
    ],
  },

  /* 촬영 스케줄 (/inquiry → 촬영 스케줄)
     embedUrl이 있으면 구글 캘린더 임베드를 바로 보여주고,
     비어 있으면 예약 날짜(●)만 표시하는 자체 달력으로 대체 */
  schedule: {
    embedUrl:
      'https://calendar.google.com/calendar/embed?src=86b5eb6197651abdd3ba94228c879b9eef7bade3654490aaf893e432cd5d9114%40group.calendar.google.com&ctz=Asia%2FSeoul&mode=MONTH&showTitle=0&showPrint=0&showTabs=0&showCalendars=0',
    note: '달력의 일정 외에도 준비 상황에 따라 조율이 필요할 수 있어요. 원하시는 날짜로 문의 주시면 가능 여부를 바로 확인해 드립니다.',
    months: 3, // (자체 달력일 때) 오늘 기준 몇 개월 뒤까지 넘겨볼 수 있는지
  },

  /* 랜딩(링크트리) 버튼 — 맨 위 '촬영 문의 등록하기'만 고정, 나머지는 이 순서대로.
     view: about/process/pricing/info/schedule/location/form(내부 화면)
           | kakao·website(기본 정보의 URL로 연결) | link(href에 외부 URL 직접 입력) */
  landing: [
    { view: 'kakao', ic: '💬', title: '카카오톡 채널로 상담', desc: '간단한 문의는 카톡이 가장 빨라요' },
    { view: 'schedule', ic: '📅', title: '촬영 스케줄', desc: '이번 달 예약 현황을 한눈에 확인하세요' },
    { view: 'link', href: 'https://naver.me/5l7ThgyS', ic: '📍', title: '스튜디오 위치', desc: '서울 강남구 역삼동 · 네이버 지도로 바로 열기' },
    { view: 'website', ic: '📷', title: '포트폴리오 · 공식 홈페이지', desc: '실제 촬영 결과물을 먼저 확인해 보세요' },
    { view: 'about', ic: '◈', title: '스튜디오 소개', desc: '푸드·뷰티·라이프스타일 비주얼 파트너' },
    { view: 'process', ic: '◎', title: '촬영 진행 과정', desc: '문의부터 납품까지 한눈에' },
    { view: 'pricing', ic: '₩', title: '촬영 견적 · 옵션 안내', desc: '시간제 · 컷당 · 기획 · 보정' },
    { view: 'info', ic: '?', title: '상세 안내 · FAQ', desc: '자주 묻는 질문 모음' },
  ],

  about: {
    paragraphs: [
      '푸드 · 뷰티 · 라이프스타일 분야를 중심으로 사진·영상 콘텐츠를 기획부터 제작까지 One-stop으로 제공하는 스튜디오입니다.',
      '브랜드의 목적과 문제를 분석해, 필요한 방향의 콘셉트·연출·비주얼 전략을 함께 설계합니다.',
      '서울 강남구 역삼동에 위치해 있으며, 온·오프라인 협업이 모두 편리한 커뮤니케이션 시스템을 구축하고 있습니다.',
      '홀리몰리는 단순한 촬영 대행이 아닌, 브랜드가 "어떻게 보여야 하는지"를 함께 고민하는 비주얼 파트너입니다.',
      '"좋은 콘텐츠는 브랜드의 이미지를 만들고, 좋은 이미지는 결국 성장을 만들어냅니다."',
    ],
    services: [
      '브랜드 제품 사진 촬영 (푸드/뷰티/리빙/패키지)',
      'SNS · 홈페이지 · 광고용 사진 및 영상 콘텐츠 제작',
      '숏폼 영상, 브랜드 바이럴 영상, 무드필름',
      '상세페이지용 콘텐츠 촬영 및 구성 제안',
      '시즌 캠페인 · 브랜딩 콘텐츠 기획 및 제작',
    ],
    clients: '아닐로 · 스타라이크 · 포맨트 · 빌리엔젤 · 수협 · 본가네 등',
  },

  /* 촬영 진행 과정 — tag: '촬영 전' | '촬영 후' 등 자유 입력 */
  processSteps: [
    { tag: '촬영 전', title: '촬영 시안 및 레퍼런스 전달', desc: '촬영 품목, 내용 및 분량, 레퍼런스를 전달 주시면 상담이 진행됩니다.', img: '' },
    { tag: '촬영 전', title: '견적서 전달', desc: '상담 후 안내드린 견적 토대로 견적서를 작성하여 전달드립니다.', img: '' },
    { tag: '촬영 전', title: '계약서 작성', desc: '협의된 촬영 세부 내용 및 견적이 포함된 계약서를 작성합니다.', img: '' },
    { tag: '촬영 전', title: '촬영비 결제 (50% 선입금)', desc: '안내드린 견적으로 50% 선입금 결제를 진행합니다. 계약서 작성과 선입금이 완료되어야 일정이 확정됩니다.', img: '' },
    { tag: '촬영 전', title: '세금계산서 발행 및 일정 확정', desc: '결제 진행, 세금계산서 발행 후 협의된 촬영 일정으로 예약을 확정합니다.', img: '' },
    { tag: '촬영 후', title: '스튜디오 방문 또는 실시간 공유', desc: '촬영날 스튜디오 방문, 또는 방문이 어려우실 경우 실시간 카카오톡으로 작업 과정을 공유해 드립니다.', img: '' },
    { tag: '촬영 후', title: '세팅 및 촬영 진행', desc: '사전 기획한 내용 토대로 스타일링, 세팅 및 촬영을 진행합니다.', img: '' },
    { tag: '촬영 후', title: '현장 컨펌', desc: '현장에서 촬영본 확인 후 컨펌, 또는 카카오톡 사진 공유 후 컨펌합니다.', img: '' },
    { tag: '촬영 후', title: '결과물 전달', desc: '촬영 원본(JPG)은 촬영 다음 날 구글 드라이브 링크로 전달되고, 정밀 보정본은 셀렉한 날로부터 +7일 이내 전달됩니다.', img: '' },
  ],

  /* 촬영 견적 · 옵션 — 2026 견적표 기준 */
  pricingItems: [
    { title: '하프 데이 촬영 (4시간)', desc: '포토그래퍼 단독 진행 기준입니다. 소품·재료는 스튜디오에서 준비하고, 제품 스타일링은 포토그래퍼가 직접 진행합니다. 깔끔한 제품컷·심플한 구도 중심의 촬영에 적합합니다.', price: '1,500,000원', img: '' },
    { title: '원 데이 촬영 (8시간)', desc: '연출 난이도가 높거나 촬영 분량이 많은 경우에 적합합니다. 소품·재료 준비와 스타일링 방식은 하프 데이와 동일합니다.', price: '3,000,000원', img: '' },
    { title: '전문 스타일리스트 추가', desc: '하프 데이 +700,000원 · 원 데이 +1,200,000원. 전문 스타일리스트가 소품 서치·구매·연출을 담당하고, 음식 촬영은 푸드스타일리스트(그릇·배경 준비, 조리, 푸드스타일링)와 함께합니다. 대량 컷수·다양한 구성이 필요한 브랜딩·패키지·컨셉 촬영에 추천드립니다.', price: '+700,000원~', img: '' },
    { title: '컷당 촬영', desc: '소량 촬영은 보정이 포함된 1컷 기준 견적으로 진행합니다. 품목과 난이도에 따라 맞춤 안내드립니다.', price: '상담 후 안내', img: '' },
    { title: '촬영 기획', desc: '브랜드에 맞는 무드보드·컨셉·컷 촬영을 제안해 드립니다. 브랜드 소개서·제품 소개서·제품 소구점을 전달해 주시면 진행됩니다.', price: '1,000,000원', img: '' },
    { title: '제품 정밀 보정', desc: '먼지 제거, 문안 합성, 수평·수직 정렬, 색감·톤 조절, 정밀 합성 포함. 보정본 수령 후 추가 수정 1회가 포함됩니다.', price: '컷당 100,000원', img: '' },
    { title: '인물 정밀 보정', desc: '잡티 제거, 피부 톤 보정, 헤어 정돈, 눈·코·입 이목구비 보정 포함. 보정본 수령 후 추가 수정 1회가 포함됩니다.', price: '컷당 100,000원', img: '' },
    { title: '영상 · GIF 편집', desc: '색보정과 컷 편집이 포함된 1클립 기준입니다.', price: '클립당 100,000원', img: '' },
    { title: '시간 초과', desc: '하프 데이 4시간 · 원 데이 8시간 기준 초과 시 1시간 단위로 자동 가산됩니다. (포토그래퍼 +300,000원/시 · 스타일리스트 +150,000원/시)', price: '+300,000원/시', img: '' },
    { title: 'ASAP 긴급 보정', desc: '일반 납기(셀렉일 +7일)보다 빠른 납품이 필요한 경우 선택하는 옵션입니다. 단축 납기는 문의 시 협의하여 확정합니다.', price: '+300,000원', img: '' },
  ],
  pricingNotes: [
    '촬영 원본(JPG)은 기본 무료 제공되며, 촬영 다음 날 구글 드라이브 링크로 전달됩니다. (RAW·PSD는 요청 시 추가 비용)',
    '정밀 보정본은 셀렉한 날로부터 +7일 이내 전달되며, 수령 후 추가 수정 1회는 무료입니다. (2회 이상은 컷당 비용 재산정)',
    '부가세(VAT 10%) 별도이며, 촬영에 필요한 식재료·소품은 별도 재료비로 청구됩니다. (구매 후 영수증 첨부)',
    '외부 촬영 시 출장비가 추가됩니다. 서울 100,000원 / 경기권 200,000원 / 그 외 지역은 개별 협의',
    '촬영 가능 시간은 평일 09:00–20:00이며, 공휴일·야간 촬영은 별도 견적입니다.',
    '촬영 일정은 계약금 50% 입금 시 확정되며, 잔금은 보정본 납품 후 결제합니다. (촬영 7일 전까지 변경·취소 가능)',
  ],

  /* 상세 안내 · FAQ — 2026 견적표 기준 */
  infoItems: [
    { q: '결과물은 언제 받을 수 있나요?', a: '촬영 원본(JPG)은 촬영 다음 날 바로 전달되고, 정밀 보정본은 셀렉한 날로부터 +7일 이내 전달됩니다. 모든 파일은 구글 드라이브 링크로 보내드립니다.' },
    { q: '납품을 더 빨리 받을 수도 있나요?', a: 'ASAP 긴급 보정 옵션(+300,000원)으로 일반 납기(셀렉일 +7일)보다 단축 납품이 가능합니다. 정확한 단축 일정은 문의 시 협의하여 확정합니다.' },
    { q: '수정은 몇 회까지 가능한가요?', a: '정밀 보정본 수령 후 추가 수정 1회가 무료로 포함되어 있습니다. 2회 이상 재수정은 1컷당 비용이 재산정됩니다.' },
    { q: '원본(RAW) 파일도 받을 수 있나요?', a: '기본 제공 파일은 톤 보정된 JPG이며, RAW·PSD 파일은 요청 시 추가 비용이 발생합니다.' },
    { q: '촬영 당일 참관할 수 있나요?', a: '스튜디오 방문 참관이 가능하며, 방문이 어려우시면 실시간 카카오톡으로 작업 과정을 공유하고 컨펌을 받습니다.' },
    { q: '음식 촬영도 가능한가요?', a: '가능합니다. 음식 촬영은 전문 푸드스타일리스트(그릇·배경 준비, 조리, 푸드스타일링)와 함께하는 협업 옵션으로 진행됩니다.' },
    { q: '일정은 어떻게 확정되나요?', a: '계약서 작성과 촬영비 50% 선입금이 완료되면 촬영 일정이 확정됩니다. 잔금은 보정본 납품 후 결제하며, 촬영 7일 전까지 변경·취소가 가능합니다.' },
    { q: '출장 촬영도 하시나요?', a: '가능합니다. 서울 100,000원, 경기권 200,000원의 출장비가 추가되며, 그 외 지역은 문의 시 개별 협의합니다.' },
    { q: '촬영 가능 시간은 어떻게 되나요?', a: '평일 09:00–20:00에 촬영이 가능하며, 공휴일·야간 촬영은 별도 견적으로 진행됩니다.' },
    { q: '스튜디오는 어디에 있나요?', a: '서울 강남구 역삼동 783-2 B1에 위치해 있습니다. 방문 전 미리 연락 주시면 오시는 길을 자세히 안내해 드리며, 온·오프라인 협업이 모두 편리합니다.' },
  ],

  /* 문의 폼 선택지 */
  form: {
    // 스텝 상단 진행 표시에 쓰이는 단계 이름 (5개 고정)
    stepTitles: ['기본 정보', '촬영 내용', '기획안', '일정 · 예산', '자료 · 동의'],
    /* 각 단계의 질문 항목 — on:false면 폼에서 숨겨지고 필수 검증도 해제된다.
       label: 질문 문구 / ph: 입력 예시(placeholder, 입력형 항목만)
       ⚠ contact(연락처)와 agree(개인정보 동의)는 회신·법적 필수라 숨길 수 없음 */
    fields: {
      // 1단계 — 기본 정보
      brand: { on: true, label: '브랜드명 (회사명) *', ph: '예: 홀리몰리 코스메틱' },
      manager: { on: true, label: '담당자 성함 *', ph: '예: 김수민' },
      contact: { on: true, label: '연락처 (전화 또는 이메일) *', ph: '010-0000-0000 / hello@brand.com' },
      contactPref: { on: true, label: '편한 회신 방법' },
      // 2단계 — 촬영 내용
      shootType: { on: true, label: '촬영 유형 *' },
      videoLen: { on: true, label: '영상 분량 (초)', ph: '예: 15~30초 릴스 2편' },
      videoEdit: { on: true, label: '편집 포함 여부' },
      items: { on: true, label: '촬영 품목 · 수량/분량', ph: '예: 립밤 3종 × 각 5컷' },
      purposes: { on: true, label: '촬영 목적 · 사용처 (복수 선택)' },
      concept: { on: true, label: '촬영 내용 · 컨셉', ph: '원하시는 무드, 배경, 연출 방향을 자유롭게 적어주세요.' },
      // 3단계 — 기획안
      planStatus: { on: true, label: '촬영 기획안을 작성해 보신 적 있나요? *' },
      // 4단계 — 일정 · 예산
      shootDate: { on: true, label: '희망 촬영일 (미정이면 비워두세요)' },
      dueDate: { on: true, label: '결과물 필요일 (마감일)' },
      budget: { on: true, label: '예산 범위 *' },
      // 5단계 — 자료 · 동의
      refUrls: { on: true, label: '레퍼런스 · 참고 링크 (핀터레스트, 인스타 등)' },
      etc: { on: true, label: '그 외 문의사항', ph: '궁금한 점을 자유롭게 남겨주세요.' },
    },
    shootTypes: ['제품 촬영', '음식 촬영', '컨셉·브랜딩 촬영', '모델컷', '영상'],
    purposes: ['SNS 콘텐츠', '유튜브 숏츠', '포스터', '상세페이지', '광고', '기타'],
    budgetRanges: ['50만 원 이하', '50~100만 원', '100~300만 원', '300만 원 이상', '미정 · 상담 후 결정'],
    budgetPopular: '100~300만 원', // '가장 많이 선택' 배지가 붙는 옵션 (빈 값이면 표시 안 함)
    contactPrefs: ['카카오톡', '전화', '이메일'],
    videoEditOptions: ['편집까지', '촬영 원본만', '상담 후 결정'], // 촬영 유형 '영상' 선택 시
    // 기획안 단계 — 분기 동작(첨부/가이드/안내)은 고정, 문구·선택지만 편집 가능
    planTexts: {
      have: { label: '네, 기획안이 있어요', desc: '쓰시던 양식 그대로 첨부해 주시면 됩니다' },
      guide: { label: '처음이에요, 가이드 따라 쓸게요', desc: '아는 것만 적어주세요 — 나머지는 상담에서 함께' },
      later: { label: '아직이요, 상담하면서 정할래요', desc: '좋아요! 처음부터 차근차근 안내해 드릴게요' },
      guideIntro: '4가지만 알려주시면 저희가 기획안으로 정리해 드려요. 모르는 항목은 비워두셔도 괜찮습니다!',
      laterNote: '촬영이 처음이신 분들이 정말 많아요. 상담에서 담당자가 처음부터 끝까지 차근차근 안내해 드리고, 기획안도 함께 만들어 드립니다.',
    },
    planFormats: ['인스타 피드 (1:1)', '릴스·숏츠 (세로)', '상세페이지', '홈페이지 배너', '인쇄물·현수막', '아직 몰라요'],
    privacyNotice:
      '수집 항목: 담당자명·연락처(전화/이메일) · 수집 목적: 촬영 문의 상담 및 견적 안내 · ' +
      '보관 기간: 문의 처리 완료 후 1년 보관 뒤 파기 (계약 진행 시 고객 정보로 이관)',
  },

  /* 촬영 기획안 도우미(/planner) 선택지 */
  planner: {
    industries: ['패션·잡화', '뷰티·코스메틱', 'F&B·식품', '리빙·홈데코', '전자·테크', '키즈·펫', '기타'],
    purposes: ['상세페이지', 'SNS 콘텐츠', '릴스·숏츠', '광고 소재', '홈페이지·배너', '룩북·브랜딩', '메뉴판·인쇄물'],
    modelOptions: ['모델 필요 없음', '모델 필요 (섭외 요청)', '자체 모델 있음', '상담 후 결정'],
    // 무드 카드 — colors: [밝은 배경지 톤, 중간 톤, 포인트]. key는 저장 식별용(없으면 name 사용)
    moods: [
      { key: 'clean', name: '미니멀 · 클린', keywords: ['깔끔한', '정돈된', '화이트톤'], colors: ['#FFFFFF', '#EDEDED', '#5A5A66'],
        desc: '여백을 살린 정돈된 화면에 제품이 또렷하게 돋보이는 무드입니다. 밝고 균일한 조명과 화이트·그레이 배경지를 사용합니다.' },
      { key: 'warm', name: '내추럴 · 따뜻한', keywords: ['따뜻한', '포근한', '데일리'], colors: ['#F5EBDD', '#D9BFA3', '#8A6A4F'],
        desc: '자연광 느낌의 부드러운 빛과 우드·린넨·스톤 소재를 활용합니다. 배경지도 아이보리·베이지 계열의 따뜻한 톤으로 맞춥니다.' },
      { key: 'moody', name: '시네마틱 · 무디', keywords: ['어두운', '분위기', '강한 대비'], colors: ['#26262C', '#3B3B45', '#B99B6B'],
        desc: '짙은 배경지와 강한 명암 대비로 밀도 있는 분위기를 만듭니다. 프리미엄 제품과 F&B에 잘 어울립니다.' },
      { key: 'vivid', name: '비비드 · 팝', keywords: ['컬러풀', '발랄', '임팩트'], colors: ['#FFE3E4', '#FFC542', '#3E7BFA'],
        desc: '선명한 컬러 배경지와 과감한 구도로 시선을 붙잡습니다. SNS·광고 소재에 특히 효과적입니다.' },
      { key: 'luxe', name: '럭셔리 · 하이엔드', keywords: ['고급스러운', '절제된', '광택'], colors: ['#1B1B1D', '#5C5548', '#CBB78E'],
        desc: '절제된 구성과 소재의 광택을 살린 조명으로 브랜드의 격을 보여주는 하이엔드 연출입니다.' },
      { key: 'kitsch', name: '키치 · 유니크', keywords: ['개성', '위트', '실험적'], colors: ['#F9F1B5', '#F06292', '#7C4DFF'],
        desc: '예상을 비트는 소품과 색 조합, 위트 있는 연출로 브랜드의 개성을 극대화합니다.' },
      { key: 'fresh', name: '청량 · 프레시', keywords: ['시원한', '투명한', '생기'], colors: ['#E8F6FF', '#9BD4F5', '#1B7FBF'],
        desc: '물·유리·얼음·빛 반사를 활용한 투명하고 시원한 화면입니다. 탁도가 있는 은은한 하늘색 배경지 톤을 기본으로 합니다.' },
      { key: 'retro', name: '빈티지 · 레트로', keywords: ['아날로그', '필름 감성', '스토리'], colors: ['#E9DCC3', '#C96F4A', '#5B4636'],
        desc: '필름 그레인과 빛바랜 색감의 아날로그 감성입니다. 스토리가 있는 브랜드 화보에 어울립니다.' },
    ],
  },

  /* 촬영 레퍼런스 파인더(/reference) 키워드 — ko: 칩 라벨, en/kr: 실제 검색어, dot: 색상 표시(선택)
     cats: 상단 카테고리 탭. 그룹의 cat이 탭 key와 일치하면 그 탭에서만 보이고, cat이 없으면 모든 탭 공통.
     cat에 공백으로 여러 key를 적으면 해당 탭들에서만 보인다 (예: 'beauty fnb'). */
  reference: {
    lead: '카테고리를 고른 뒤 키워드를 눌러 조합하면 핀터레스트에서 촬영 레퍼런스 이미지를 바로 모아볼 수 있어요.',
    cats: [
      { key: 'beauty', name: '💄 뷰티', base: { en: 'cosmetics product photography', kr: '화장품 제품 촬영' } },
      { key: 'fnb', name: '🍽️ F&B', base: { en: 'food photography', kr: '음식 촬영' } },
      { key: 'life', name: '👕 라이프스타일', base: { en: 'fashion product photography', kr: '패션 제품 촬영' } },
      { key: 'video', name: '🎬 영상', base: { en: 'commercial video', kr: '광고 영상' } },
    ],
    groups: [
      {
        key: 'product', cat: 'beauty', title: '제품', hint: '어떤 제품을 찍나요?',
        items: [
          { ko: '앰플', en: 'ampoule', kr: '앰플' },
          { ko: '세럼', en: 'serum', kr: '세럼' },
          { ko: '선크림', en: 'sunscreen', kr: '선크림' },
          { ko: '스킨·토너', en: 'toner', kr: '토너' },
          { ko: '크림', en: 'face cream', kr: '크림' },
          { ko: '클렌저', en: 'cleanser', kr: '클렌저' },
          { ko: '마스크팩', en: 'sheet mask', kr: '마스크팩' },
          { ko: '립', en: 'lip product', kr: '립스틱' },
          { ko: '립글로스·틴트', en: 'lip gloss tint', kr: '립글로스 틴트' },
          { ko: '마스카라·아이라이너', en: 'mascara eyeliner', kr: '마스카라 아이라이너' },
          { ko: '블러셔·치크', en: 'blush cheek makeup', kr: '블러셔' },
          { ko: '하이라이터', en: 'highlighter makeup glow', kr: '하이라이터' },
          { ko: '파우더·팩트', en: 'face powder compact', kr: '파우더 팩트' },
          { ko: '메이크업 브러시·도구', en: 'makeup brushes beauty tools', kr: '메이크업 브러시' },
          { ko: '쿠션·파운데이션', en: 'cushion foundation', kr: '쿠션 파운데이션' },
          { ko: '토너패드', en: 'toner pad', kr: '토너패드' },
          { ko: '미스트', en: 'face mist', kr: '미스트' },
          { ko: '페이스 오일', en: 'facial oil', kr: '페이스오일' },
          { ko: '아이크림', en: 'eye cream', kr: '아이크림' },
          { ko: '스틱·밤', en: 'stick balm', kr: '스틱밤' },
          { ko: '팔레트·섀도', en: 'eyeshadow palette', kr: '아이섀도 팔레트' },
          { ko: '네일', en: 'nail polish', kr: '네일' },
          { ko: '향수', en: 'perfume', kr: '향수' },
          { ko: '헤어케어', en: 'hair care', kr: '헤어케어' },
          { ko: '바디', en: 'body lotion', kr: '바디로션' },
          { ko: '샴푸·트리트먼트', en: 'shampoo treatment bottle', kr: '샴푸 트리트먼트' },
          { ko: '헤어 오일·에센스', en: 'hair oil essence', kr: '헤어 오일' },
          { ko: '바디워시·입욕제', en: 'body wash bath products', kr: '바디워시 입욕제' },
          { ko: '핸드크림', en: 'hand cream', kr: '핸드크림' },
          { ko: '스크럽·필링', en: 'exfoliating scrub peeling', kr: '스크럽 필링' },
          { ko: '남성 그루밍', en: 'mens grooming skincare', kr: '남성 화장품' },
          { ko: '이너뷰티·콜라겐', en: 'collagen inner beauty supplement', kr: '이너뷰티 콜라겐' },
          { ko: '베이비·키즈', en: 'baby skincare products', kr: '유아 화장품' },
          { ko: '뷰티 디바이스', en: 'beauty device skincare tool', kr: '뷰티 디바이스' },
          { ko: 'LED 마스크', en: 'led face mask device', kr: 'LED 마스크' },
          { ko: '리프팅·고주파 기기', en: 'facial lifting device', kr: '리프팅 기기' },
          { ko: '괄사·페이스 롤러', en: 'gua sha face roller', kr: '괄사 롤러' },
          { ko: '클렌징 기기', en: 'facial cleansing device', kr: '클렌징 기기' },
          { ko: '헤어 드라이어·스타일러', en: 'hair dryer styler', kr: '헤어 드라이어' },
          { ko: '제모기·면도기', en: 'shaver epilator device', kr: '면도기 제모기' },
        ],
      },
      {
        key: 'concept', cat: 'beauty', title: '컨셉 · 무드', hint: '원하는 분위기를 골라주세요',
        items: [
          { ko: '미니멀·클린', en: 'minimal clean', kr: '미니멀' },
          { ko: '내추럴', en: 'natural organic', kr: '내추럴' },
          { ko: '럭셔리', en: 'luxury premium', kr: '럭셔리' },
          { ko: '청량·워터리', en: 'fresh water', kr: '청량' },
          { ko: '글로우·듀이', en: 'dewy glow glossy', kr: '글로우 광채' },
          { ko: '더마·클리니컬', en: 'clinical derma lab', kr: '더마 코스메틱' },
          { ko: '비비드·팝', en: 'colorful pop', kr: '컬러풀' },
          { ko: '무디·시네마틱', en: 'dark moody', kr: '무디' },
          { ko: '몽환·에테리얼', en: 'dreamy ethereal soft', kr: '몽환적' },
          { ko: 'Y2K·크롬', en: 'y2k chrome futuristic', kr: 'Y2K 크롬' },
          { ko: '에코·어스톤', en: 'eco earthy sustainable', kr: '어스톤' },
          { ko: '한국적·한방', en: 'hanbang korean heritage', kr: '한방 전통' },
          { ko: '빈티지·레트로', en: 'retro vintage', kr: '레트로' },
          { ko: '키치·유니크', en: 'kitsch quirky', kr: '키치' },
          { ko: '테크·퓨처리스틱', en: 'high tech futuristic sleek', kr: '하이테크' },
          { ko: '글래스 스킨', en: 'glass skin glowing', kr: '유리 피부 광채' },
          { ko: '스파·웰니스', en: 'spa wellness serene', kr: '스파 웰니스' },
          { ko: '로맨틱·페미닌', en: 'romantic feminine soft', kr: '로맨틱 페미닌' },
          { ko: '아트·오브제', en: 'sculptural art object still life', kr: '아트 오브제' },
        ],
      },
      {
        key: 'fnbProduct', cat: 'fnb', title: '제품 · 메뉴', hint: '어떤 음식·음료를 찍나요?',
        items: [
          { ko: '음료·드링크', en: 'beverage drink', kr: '음료' },
          { ko: '커피', en: 'coffee', kr: '커피' },
          { ko: '티·차', en: 'tea', kr: '차' },
          { ko: '주류·와인', en: 'wine cocktail liquor', kr: '와인 칵테일' },
          { ko: '맥주', en: 'beer', kr: '맥주' },
          { ko: '디저트', en: 'dessert', kr: '디저트' },
          { ko: '케이크', en: 'cake', kr: '케이크' },
          { ko: '베이커리·빵', en: 'bakery bread pastry', kr: '베이커리 빵' },
          { ko: '초콜릿', en: 'chocolate', kr: '초콜릿' },
          { ko: '아이스크림', en: 'ice cream gelato', kr: '아이스크림' },
          { ko: '스낵·과자', en: 'snack cookies', kr: '스낵 과자' },
          { ko: '요거트·유제품', en: 'yogurt dairy', kr: '요거트' },
          { ko: '잼·스프레드', en: 'jam spread honey', kr: '잼 스프레드' },
          { ko: '소스·오일', en: 'sauce olive oil bottle', kr: '소스 오일' },
          { ko: '건강식품·영양제', en: 'health supplement vitamins', kr: '건강식품 영양제' },
          { ko: '밀키트·간편식', en: 'meal kit packaged food', kr: '밀키트' },
          { ko: '한식', en: 'korean food', kr: '한식' },
          { ko: '브런치·플레이트', en: 'brunch plate', kr: '브런치' },
          { ko: '과일·청과', en: 'fresh fruit', kr: '과일' },
          { ko: '스무디·주스', en: 'smoothie fresh juice', kr: '스무디 주스' },
          { ko: '에이드·스파클링', en: 'ade sparkling beverage', kr: '에이드' },
          { ko: '버블티·밀크티', en: 'bubble tea milk tea', kr: '버블티' },
          { ko: '하이볼', en: 'whisky highball', kr: '하이볼' },
          { ko: '소주·전통주', en: 'soju korean liquor', kr: '소주 전통주' },
          { ko: '마카롱', en: 'macaron', kr: '마카롱' },
          { ko: '도넛', en: 'doughnut donut', kr: '도넛' },
          { ko: '와플·팬케이크', en: 'waffle pancake', kr: '와플 팬케이크' },
          { ko: '빙수', en: 'bingsu korean shaved ice', kr: '빙수' },
          { ko: '떡·한과', en: 'korean rice cake dessert', kr: '떡 한과' },
          { ko: '젤리·사탕', en: 'jelly gummy candy', kr: '젤리 캔디' },
          { ko: '패키지·용기', en: 'food packaging jar bottle', kr: '식품 패키지' },
        ],
      },
      {
        key: 'fnbMeal', cat: 'fnb', title: '식사 · 요리', hint: '메인 요리·식사 메뉴는 여기서 골라주세요',
        items: [
          { ko: '고기·구이', en: 'korean bbq grilled meat', kr: '고기 구이' },
          { ko: '삼겹살', en: 'samgyeopsal pork belly bbq', kr: '삼겹살' },
          { ko: '스테이크', en: 'steak', kr: '스테이크' },
          { ko: '치킨', en: 'korean fried chicken', kr: '치킨' },
          { ko: '국·탕·찌개', en: 'korean stew soup', kr: '찌개 국물요리' },
          { ko: '전골·샤브샤브', en: 'hot pot shabu shabu', kr: '전골 샤브샤브' },
          { ko: '마라탕·훠궈', en: 'malatang hot pot', kr: '마라탕' },
          { ko: '족발·보쌈', en: 'korean braised pork jokbal', kr: '족발 보쌈' },
          { ko: '곱창·막창', en: 'korean intestine bbq gopchang', kr: '곱창' },
          { ko: '비빔밥', en: 'bibimbap', kr: '비빔밥' },
          { ko: '덮밥·라이스볼', en: 'rice bowl donburi', kr: '덮밥' },
          { ko: '죽·수프', en: 'porridge soup bowl', kr: '죽 수프' },
          { ko: '떡볶이·분식', en: 'tteokbokki korean street food', kr: '떡볶이 분식' },
          { ko: '김밥', en: 'gimbap korean rice roll', kr: '김밥' },
          { ko: '만두', en: 'dumpling mandu', kr: '만두' },
          { ko: '핫도그', en: 'corn dog', kr: '핫도그' },
          { ko: '파스타', en: 'pasta', kr: '파스타' },
          { ko: '라멘·라면', en: 'ramen noodles', kr: '라멘 라면' },
          { ko: '국수·칼국수', en: 'korean noodle soup guksu', kr: '국수 칼국수' },
          { ko: '냉면', en: 'naengmyeon korean cold noodles', kr: '냉면' },
          { ko: '우동·소바', en: 'udon soba', kr: '우동 소바' },
          { ko: '쌀국수', en: 'pho rice noodle soup', kr: '쌀국수' },
          { ko: '짜장·짬뽕', en: 'jajangmyeon korean chinese food', kr: '짜장면 짬뽕' },
          { ko: '버거', en: 'gourmet burger', kr: '수제버거' },
          { ko: '피자', en: 'pizza', kr: '피자' },
          { ko: '샌드위치·토스트', en: 'sandwich toast', kr: '샌드위치' },
          { ko: '샐러드·포케', en: 'salad bowl poke', kr: '샐러드' },
          { ko: '돈카츠', en: 'tonkatsu pork cutlet', kr: '돈카츠' },
          { ko: '카레', en: 'curry rice', kr: '카레' },
          { ko: '스시·초밥', en: 'sushi', kr: '스시 초밥' },
          { ko: '회·사시미', en: 'sashimi', kr: '회 사시미' },
          { ko: '해산물', en: 'seafood dish', kr: '해산물 요리' },
          { ko: '생선구이', en: 'grilled fish', kr: '생선구이' },
          { ko: '새우·랍스터', en: 'shrimp lobster', kr: '새우 랍스터' },
          { ko: '조개·굴', en: 'oyster clams', kr: '조개 굴' },
          { ko: '타코·멕시칸', en: 'tacos mexican food', kr: '타코' },
          { ko: '도시락·밀박스', en: 'lunch box bento', kr: '도시락' },
        ],
      },
      {
        key: 'fnbConcept', cat: 'fnb', title: '컨셉 · 무드', hint: '원하는 분위기를 골라주세요',
        items: [
          { ko: '미니멀·클린', en: 'minimal clean', kr: '미니멀' },
          { ko: '내추럴·러스틱', en: 'natural rustic', kr: '내추럴 러스틱' },
          { ko: '홈메이드·코지', en: 'homemade cozy', kr: '홈메이드' },
          { ko: '프리미엄·파인다이닝', en: 'fine dining gourmet', kr: '파인다이닝' },
          { ko: '청량·아이스', en: 'refreshing iced cold', kr: '청량한' },
          { ko: '시즐·역동', en: 'sizzling dynamic action', kr: '시즐감' },
          { ko: '무디·다크', en: 'dark moody food', kr: '다크 푸드' },
          { ko: '컬러풀·팝', en: 'colorful pop', kr: '컬러풀' },
          { ko: '빈티지·레트로', en: 'retro vintage', kr: '레트로' },
          { ko: '팜투테이블·신선', en: 'farm fresh organic', kr: '신선한 유기농' },
        ],
      },
      {
        key: 'fnbElement', cat: 'fnb', title: '연출 요소', hint: '화면에 넣고 싶은 요소 (선택)',
        items: [
          { ko: '스팀·김', en: 'steam hot', kr: '스팀 김' },
          { ko: '푸어링·붓기', en: 'pouring shot', kr: '붓는 장면' },
          { ko: '드리핑·흐르는', en: 'dripping melting', kr: '흘러내리는' },
          { ko: '스플래시', en: 'splash', kr: '스플래시' },
          { ko: '물방울·결로', en: 'condensation droplets', kr: '물방울 맺힌' },
          { ko: '얼음', en: 'ice cubes', kr: '얼음' },
          { ko: '단면·크로스섹션', en: 'cross section cut', kr: '단면' },
          { ko: '크럼·부스러기', en: 'crumbs sprinkle', kr: '부스러기' },
          { ko: '원재료·식재료', en: 'raw ingredients', kr: '원재료' },
          { ko: '허브·가니시', en: 'herbs garnish', kr: '허브 가니시' },
          { ko: '테이블 세팅', en: 'table setting tablescape', kr: '테이블 세팅' },
          { ko: '리넨·패브릭', en: 'linen fabric napkin', kr: '리넨' },
          { ko: '나무 도마·우드', en: 'wooden board rustic wood', kr: '나무 도마' },
          { ko: '세라믹·그릇', en: 'ceramic plate pottery', kr: '세라믹 그릇' },
          { ko: '손 연출', en: 'hand holding', kr: '손' },
          { ko: '공중부양', en: 'floating levitation', kr: '공중부양' },
          { ko: '그림자·햇살', en: 'hard shadow sunlight', kr: '그림자 햇살' },
          { ko: '치즈 풀링', en: 'cheese pull melted', kr: '치즈 풀링' },
          { ko: '소스·드리즐', en: 'sauce drizzle', kr: '소스 뿌리기' },
          { ko: '불꽃·플람베', en: 'flame fire cooking', kr: '불맛 플람베' },
          { ko: '젓가락·커트러리', en: 'chopsticks cutlery', kr: '젓가락 커트러리' },
          { ko: '한입·베어문 컷', en: 'bite shot taken', kr: '한입 컷' },
          { ko: '밀가루·베이킹', en: 'flour dust baking scene', kr: '밀가루 베이킹' },
          { ko: '꿀·시럽', en: 'honey syrup drip', kr: '꿀 시럽' },
        ],
      },
      {
        key: 'lifeProduct', cat: 'life', title: '아이템', hint: '어떤 아이템을 찍나요?',
        items: [
          { ko: '의류·어패럴', en: 'clothing apparel', kr: '의류' },
          { ko: '티셔츠', en: 't-shirt', kr: '티셔츠' },
          { ko: '니트·스웨터', en: 'knitwear sweater', kr: '니트' },
          { ko: '셔츠·블라우스', en: 'shirt blouse', kr: '셔츠' },
          { ko: '데님', en: 'denim jeans', kr: '데님' },
          { ko: '아우터·재킷', en: 'outerwear jacket coat', kr: '아우터' },
          { ko: '드레스·원피스', en: 'dress', kr: '원피스' },
          { ko: '액티브웨어', en: 'activewear athleisure', kr: '액티브웨어' },
          { ko: '라운지웨어', en: 'loungewear pajama', kr: '라운지웨어' },
          { ko: '신발·스니커즈', en: 'sneakers shoes', kr: '신발 스니커즈' },
          { ko: '가방', en: 'bag handbag', kr: '가방' },
          { ko: '모자·캡', en: 'cap hat', kr: '모자' },
          { ko: '주얼리·액세서리', en: 'jewelry accessories', kr: '주얼리' },
          { ko: '시계', en: 'watch', kr: '시계' },
          { ko: '아이웨어·안경', en: 'eyewear sunglasses', kr: '선글라스 안경' },
          { ko: '양말', en: 'socks', kr: '양말' },
          { ko: '텀블러·컵', en: 'tumbler mug cup', kr: '텀블러 컵' },
          { ko: '문구·소품', en: 'stationery lifestyle goods', kr: '문구 소품' },
          { ko: '캔들·홈', en: 'candle home fragrance', kr: '캔들' },
          { ko: '디퓨저·룸스프레이', en: 'room diffuser', kr: '디퓨저' },
          { ko: '침구·홈텍스타일', en: 'bedding home textile', kr: '침구' },
          { ko: '테크·가젯', en: 'tech gadget', kr: '테크 가젯' },
          { ko: '그릇·테이블웨어', en: 'tableware plates ceramic', kr: '그릇 테이블웨어' },
          { ko: '인테리어 소품·오브제', en: 'home decor object', kr: '인테리어 소품' },
          { ko: '가구', en: 'furniture design', kr: '가구' },
          { ko: '조명·램프', en: 'lamp lighting design', kr: '조명 램프' },
          { ko: '러그·쿠션', en: 'rug cushion home textile', kr: '러그 쿠션' },
          { ko: '키즈·유아용품', en: 'kids baby products', kr: '유아용품' },
          { ko: '반려동물 용품', en: 'pet products dog cat', kr: '반려동물 용품' },
          { ko: '캠핑·아웃도어', en: 'camping outdoor gear', kr: '캠핑용품' },
          { ko: '운동·요가용품', en: 'yoga fitness equipment', kr: '운동용품' },
          { ko: '오디오·헤드폰', en: 'headphones speaker audio', kr: '오디오 헤드폰' },
          { ko: '여행·캐리어', en: 'luggage travel accessories', kr: '여행 캐리어' },
          { ko: '폰케이스·테크 액세서리', en: 'phone case tech accessories', kr: '폰케이스' },
          { ko: '키링·굿즈', en: 'keyring character goods', kr: '키링 굿즈' },
          { ko: '지갑·가죽소품', en: 'wallet leather goods', kr: '지갑 가죽소품' },
        ],
      },
      {
        key: 'lifeConcept', cat: 'life', title: '컨셉 · 무드', hint: '원하는 분위기를 골라주세요',
        items: [
          { ko: '미니멀·클린', en: 'minimal clean', kr: '미니멀' },
          { ko: '스트릿·어반', en: 'streetwear urban', kr: '스트릿' },
          { ko: '캐주얼·데일리', en: 'casual daily wear', kr: '캐주얼 데일리' },
          { ko: '럭셔리·하이패션', en: 'luxury high fashion editorial', kr: '하이패션 화보' },
          { ko: '시티보이·매거진', en: 'city boy magazine style', kr: '시티보이 매거진' },
          { ko: '빈티지·아메카지', en: 'vintage americana workwear', kr: '빈티지 아메카지' },
          { ko: '아웃도어·고프코어', en: 'gorpcore outdoor', kr: '아웃도어 고프코어' },
          { ko: 'Y2K', en: 'y2k fashion', kr: 'Y2K 패션' },
          { ko: '코지·홈', en: 'cozy home lifestyle', kr: '코지 홈' },
          { ko: '무디·시네마틱', en: 'dark moody', kr: '무디' },
          { ko: '프레피·클래식', en: 'preppy classic style', kr: '프레피 클래식' },
          { ko: '스포티', en: 'sporty athletic', kr: '스포티' },
          { ko: '바캉스·리조트', en: 'resort vacation summer', kr: '바캉스 리조트' },
          { ko: '내추럴·킨포크', en: 'kinfolk natural lifestyle', kr: '내추럴 킨포크' },
          { ko: '미드센추리 모던', en: 'mid century modern interior', kr: '미드센추리 모던' },
        ],
      },
      {
        key: 'lifeElement', cat: 'life', title: '연출 · 촬영', hint: '어떻게 보여줄까요? (선택)',
        items: [
          { ko: '룩북·착용샷', en: 'lookbook model wearing', kr: '룩북 착용샷' },
          { ko: '스튜디오 화보', en: 'studio editorial fashion', kr: '스튜디오 화보' },
          { ko: '스트릿 스냅', en: 'street snap candid', kr: '스트릿 스냅' },
          { ko: '옷걸이·행잉', en: 'clothes hanging rack', kr: '옷걸이 행잉' },
          { ko: '의류 플랫레이', en: 'clothing flat lay outfit grid', kr: '의류 플랫레이' },
          { ko: '고스트 마네킹', en: 'ghost mannequin', kr: '고스트 마네킹' },
          { ko: '디테일·텍스처', en: 'fabric detail texture closeup', kr: '원단 디테일' },
          { ko: '무빙·워킹', en: 'motion walking dynamic', kr: '움직임 워킹' },
          { ko: '거울 셀피', en: 'mirror selfie outfit', kr: '거울 셀피' },
          { ko: '자연광·창가', en: 'natural window light', kr: '자연광' },
          { ko: '그림자 연출', en: 'hard shadow', kr: '그림자' },
          { ko: '컬러 배경지', en: 'colored backdrop studio', kr: '컬러 배경지' },
          { ko: '소품 스타일링', en: 'props styling', kr: '소품 스타일링' },
          { ko: '일상 스냅', en: 'lifestyle candid everyday', kr: '일상 스냅' },
          { ko: '카페·공간 연출', en: 'cafe interior lifestyle scene', kr: '카페 공간' },
          { ko: '룸·침실 연출', en: 'cozy bedroom scene', kr: '침실 연출' },
          { ko: '야외·필드', en: 'outdoor field location shoot', kr: '야외 촬영' },
          { ko: '손 연출', en: 'hand holding product', kr: '손' },
        ],
      },
      {
        key: 'videoType', cat: 'video', title: '영상 종류', hint: '어떤 영상을 만드나요?',
        items: [
          { ko: '브랜드 필름', en: 'brand film', kr: '브랜드 필름' },
          { ko: '제품 광고', en: 'product commercial', kr: '제품 광고 영상' },
          { ko: '뷰티 필름', en: 'beauty film cosmetics video', kr: '뷰티 영상' },
          { ko: '패션 필름', en: 'fashion film', kr: '패션 필름' },
          { ko: 'F&B 영상', en: 'food commercial video', kr: '푸드 영상' },
          { ko: '룩북 영상', en: 'lookbook video', kr: '룩북 영상' },
          { ko: '숏폼·릴스', en: 'short form reels', kr: '숏폼 릴스' },
          { ko: 'B롤', en: 'b-roll cinematic', kr: '비롤' },
          { ko: '시네마그래프', en: 'cinemagraph', kr: '시네마그래프' },
          { ko: '스톱모션', en: 'stop motion', kr: '스톱모션' },
          { ko: '타임랩스', en: 'timelapse', kr: '타임랩스' },
          { ko: '인터뷰·다큐', en: 'interview documentary', kr: '인터뷰 다큐' },
          { ko: '모션그래픽', en: 'motion graphics', kr: '모션그래픽' },
        ],
      },
      {
        key: 'videoMood', cat: 'video', title: '무드', hint: '영상의 톤 (선택)',
        items: [
          { ko: '시네마틱', en: 'cinematic', kr: '시네마틱' },
          { ko: '미니멀·클린', en: 'minimal clean', kr: '미니멀' },
          { ko: '다이내믹·에너제틱', en: 'dynamic energetic', kr: '다이내믹' },
          { ko: '몽환·드리미', en: 'dreamy ethereal', kr: '몽환적' },
          { ko: '레트로 필름', en: 'retro film look', kr: '레트로 필름' },
          { ko: '무디·다크', en: 'dark moody', kr: '무디' },
          { ko: '청량·프레시', en: 'fresh clean bright', kr: '청량한' },
          { ko: '럭셔리', en: 'luxury premium', kr: '럭셔리' },
        ],
      },
      {
        key: 'videoTech', cat: 'video', title: '연출 · 기법', hint: '촬영·편집 기법 (선택)',
        items: [
          { ko: '슬로우모션', en: 'slow motion', kr: '슬로우모션' },
          { ko: '매크로 영상', en: 'macro video closeup', kr: '매크로 영상' },
          { ko: '프로브 렌즈', en: 'probe lens', kr: '프로브 렌즈' },
          { ko: '시네마틱 조명', en: 'cinematic lighting', kr: '시네마틱 조명' },
          { ko: '트래킹·달리', en: 'dolly tracking shot', kr: '트래킹 샷' },
          { ko: '스피드램프', en: 'speed ramp', kr: '스피드램프' },
          { ko: '트랜지션', en: 'seamless transition', kr: '트랜지션' },
          { ko: '탑뷰 영상', en: 'top view overhead video', kr: '탑뷰 영상' },
          { ko: '핸드헬드', en: 'handheld camera', kr: '핸드헬드' },
          { ko: '렌즈 플레어', en: 'lens flare', kr: '렌즈 플레어' },
          { ko: '필름 룩·35mm', en: '35mm film look grain', kr: '필름 룩' },
          { ko: '스톱모션 루프', en: 'stop motion loop', kr: '스톱모션 루프' },
        ],
      },
      {
        key: 'color', title: '색상', hint: '메인 컬러 톤',
        items: [
          { ko: '화이트', en: 'white', kr: '화이트', dot: '#FFFFFF' },
          { ko: '블랙', en: 'black', kr: '블랙', dot: '#1B1B1D' },
          { ko: '베이지', en: 'beige', kr: '베이지', dot: '#D9BFA3' },
          { ko: '핑크', en: 'pink', kr: '핑크', dot: '#F5A8B8' },
          { ko: '코랄·피치', en: 'coral peach', kr: '코랄 피치', dot: '#FF8B73' },
          { ko: '블루', en: 'blue', kr: '블루', dot: '#3E7BFA' },
          { ko: '민트', en: 'mint', kr: '민트', dot: '#A8E0CE' },
          { ko: '그린', en: 'green', kr: '그린', dot: '#3E8E5A' },
          { ko: '옐로우', en: 'yellow', kr: '옐로우', dot: '#FFC542' },
          { ko: '라벤더', en: 'lavender', kr: '라벤더', dot: '#B9A7E0' },
          { ko: '퍼플', en: 'purple', kr: '퍼플', dot: '#7C4DFF' },
          { ko: '레드', en: 'red', kr: '레드', dot: '#D63B3B' },
          { ko: '오렌지', en: 'orange', kr: '오렌지', dot: '#F07C2E' },
          { ko: '모카·브라운', en: 'mocha brown', kr: '모카 브라운', dot: '#9A7156' },
          { ko: '골드', en: 'gold', kr: '골드', dot: '#D4AF37' },
          { ko: '실버·메탈', en: 'silver chrome', kr: '실버 메탈', dot: '#C0C4CC' },
          { ko: '파스텔', en: 'pastel', kr: '파스텔톤', dot: '#EAD9F2' },
          { ko: '네온', en: 'neon', kr: '네온', dot: '#7CFC00' },
        ],
      },
      {
        key: 'element', cat: 'beauty', title: '연출 요소', hint: '화면에 넣고 싶은 요소 (선택)',
        items: [
          { ko: '물·스플래시', en: 'water splash', kr: '물 스플래시' },
          { ko: '물방울·이슬', en: 'water droplets dew', kr: '물방울' },
          { ko: '얼음', en: 'ice', kr: '얼음' },
          { ko: '거품·버블', en: 'foam bubbles', kr: '거품 버블' },
          { ko: '연기·안개', en: 'smoke mist', kr: '연기 안개' },
          { ko: '유리·아크릴', en: 'glass acrylic props', kr: '유리 소품' },
          { ko: '거울·미러', en: 'mirror reflection', kr: '거울' },
          { ko: '스톤·단상', en: 'stone podium', kr: '스톤 단상' },
          { ko: '마블·대리석', en: 'marble', kr: '대리석' },
          { ko: '타일·세라믹', en: 'ceramic tile', kr: '타일' },
          { ko: '꽃·식물', en: 'flowers botanical', kr: '꽃' },
          { ko: '과일·원료', en: 'fresh ingredients fruit', kr: '과일 원료' },
          { ko: '패브릭', en: 'fabric drapery', kr: '패브릭' },
          { ko: '실크·새틴', en: 'silk satin', kr: '실크 새틴' },
          { ko: '그림자', en: 'hard shadow', kr: '그림자' },
          { ko: '네온 조명', en: 'neon light', kr: '네온 조명' },
          { ko: '컬러 젤 조명', en: 'color gel lighting', kr: '컬러 조명' },
          { ko: '그라데이션 배경', en: 'gradient backdrop', kr: '그라데이션 배경' },
          { ko: '우유·밀크', en: 'milk splash creamy', kr: '우유' },
          { ko: '프리즘·빛 반사', en: 'prism light refraction', kr: '프리즘 빛' },
          { ko: '손 연출', en: 'hand holding', kr: '손' },
          { ko: '제형·텍스처', en: 'texture smear swatch', kr: '제형 텍스처' },
          { ko: '모래·샌드', en: 'sand texture beach', kr: '모래' },
          { ko: '수중·언더워터', en: 'underwater shot', kr: '수중 촬영' },
          { ko: '종이·페이퍼아트', en: 'paper art backdrop', kr: '페이퍼아트' },
          { ko: '미스트 분사', en: 'mist spray moment', kr: '미스트 분사' },
          { ko: '글리터·펄', en: 'glitter pearl sparkle', kr: '글리터 펄' },
          { ko: '골드 포일', en: 'gold foil metallic', kr: '골드 포일' },
          { ko: '크리스탈·보석', en: 'crystal gemstone', kr: '크리스탈' },
          { ko: '파우더 버스트', en: 'powder explosion burst', kr: '파우더 폭발' },
        ],
      },
      {
        key: 'tech', cat: 'beauty fnb life', title: '구도 · 촬영 기법', hint: '어떻게 찍을지 (선택)',
        items: [
          { ko: '공중에 뜬 연출', en: 'floating levitation', kr: '공중부양' },
          { ko: '위에서 내려찍은 컷', en: 'flat lay top view', kr: '플랫레이' },
          { ko: '초근접 확대 컷', en: 'macro closeup', kr: '매크로 접사' },
          { ko: '가지런히 정렬한 컷', en: 'knolling grid arrangement', kr: '제품 정렬' },
          { ko: '창가 햇살·그림자', en: 'window light gobo shadow', kr: '창문 빛 그림자' },
          { ko: '흩날리는 움직임', en: 'dynamic motion', kr: '역동적인' },
          { ko: '거울처럼 반사', en: 'reflection glossy surface', kr: '반사 연출' },
          { ko: '정면 아이레벨', en: 'eye level front shot', kr: '정면 컷' },
          { ko: '45도 비스듬히', en: '45 degree angle product shot', kr: '45도 구도' },
          { ko: '아래에서 올려찍은 컷', en: 'low angle hero shot', kr: '로우앵글' },
          { ko: '배경 흐린 아웃포커스', en: 'shallow depth of field bokeh', kr: '아웃포커스' },
          { ko: '좌우 대칭 구도', en: 'symmetrical composition', kr: '대칭 구도' },
          { ko: '여백을 살린 구도', en: 'negative space minimal composition', kr: '여백 구도' },
          { ko: '프레임 속 프레임', en: 'frame within frame', kr: '프레임 구도' },
          { ko: '패턴처럼 반복 배치', en: 'repetition pattern products', kr: '반복 패턴' },
        ],
      },
    ],
    // 추천 조합 — picks는 위 그룹들의 칩 라벨(ko). 없는 라벨은 자동으로 건너뛴다. cat: 보이는 카테고리 탭
    presets: [
      { name: '청량한 선크림', cat: 'beauty', picks: ['선크림', '청량·워터리', '블루', '물·스플래시'] },
      { name: '럭셔리 앰플', cat: 'beauty', picks: ['앰플', '럭셔리', '블랙'] },
      { name: '내추럴 토너', cat: 'beauty', picks: ['스킨·토너', '내추럴', '베이지', '스톤·단상'] },
      { name: '팝한 립', cat: 'beauty', picks: ['립', '비비드·팝', '핑크'] },
      { name: '글로우 세럼', cat: 'beauty', picks: ['세럼', '글로우·듀이', '물방울·이슬', '초근접 확대 컷'] },
      { name: 'Y2K 쿠션', cat: 'beauty', picks: ['쿠션·파운데이션', 'Y2K·크롬', '실버·메탈', '거울·미러'] },
      { name: '하이테크 디바이스', cat: 'beauty', picks: ['뷰티 디바이스', '테크·퓨처리스틱', '실버·메탈'] },
      { name: '글래스 스킨', cat: 'beauty', picks: ['세럼', '글래스 스킨', '물방울·이슬', '초근접 확대 컷'] },
      { name: '청량한 음료', cat: 'fnb', picks: ['음료·드링크', '청량·아이스', '얼음', '스플래시'] },
      { name: '무디한 디저트', cat: 'fnb', picks: ['디저트', '무디·다크', '그림자·햇살'] },
      { name: '따뜻한 베이커리', cat: 'fnb', picks: ['베이커리·빵', '내추럴·러스틱', '나무 도마·우드', '스팀·김'] },
      { name: '프리미엄 와인', cat: 'fnb', picks: ['주류·와인', '프리미엄·파인다이닝', '블랙'] },
      { name: '커피 푸어링', cat: 'fnb', picks: ['커피', '푸어링·붓기', '무디·다크'] },
      { name: '시즐 고기구이', cat: 'fnb', picks: ['고기·구이', '시즐·역동', '스팀·김'] },
      { name: '스트릿 분식', cat: 'fnb', picks: ['떡볶이·분식', '컬러풀·팝', '스팀·김'] },
      { name: '파인다이닝 플레이팅', cat: 'fnb', picks: ['스테이크', '프리미엄·파인다이닝', '허브·가니시'] },
      { name: '미니멀 룩북', cat: 'life', picks: ['의류·어패럴', '미니멀·클린', '룩북·착용샷', '화이트'] },
      { name: '스트릿 스냅', cat: 'life', picks: ['스트릿·어반', '스트릿 스냅', '데님'] },
      { name: '하이패션 화보', cat: 'life', picks: ['럭셔리·하이패션', '스튜디오 화보', '그림자 연출'] },
      { name: '코지 홈 소품', cat: 'life', picks: ['캔들·홈', '코지·홈', '베이지', '자연광·창가'] },
      { name: '감성 캠핑', cat: 'life', picks: ['캠핑·아웃도어', '아웃도어·고프코어', '야외·필드'] },
      { name: '시네마틱 브랜드 필름', cat: 'video', picks: ['브랜드 필름', '시네마틱', '시네마틱 조명'] },
      { name: '뷰티 제품 영상', cat: 'video', picks: ['뷰티 필름', '슬로우모션', '매크로 영상'] },
      { name: '푸드 시즐 영상', cat: 'video', picks: ['F&B 영상', '다이내믹·에너제틱', '슬로우모션'] },
      { name: '레트로 패션 필름', cat: 'video', picks: ['패션 필름', '레트로 필름', '핸드헬드'] },
    ],
  },
}

/* 저장된 값(부분)을 기본값 위에 병합 — 섹션 단위로 덮어쓴다 */
export function mergeSite(saved) {
  if (!saved || typeof saved !== 'object') return DEFAULT_SITE
  const out = { ...DEFAULT_SITE }
  for (const k of Object.keys(DEFAULT_SITE)) {
    const v = saved[k]
    if (v == null) continue
    if (Array.isArray(DEFAULT_SITE[k])) out[k] = Array.isArray(v) ? v : DEFAULT_SITE[k]
    else if (typeof DEFAULT_SITE[k] === 'object') out[k] = { ...DEFAULT_SITE[k], ...v }
    else out[k] = v
  }
  // landingFixed는 버튼 단위 병합 — 일부 버튼만 저장돼 있어도 나머지는 기본값 유지
  if (saved.landingFixed) {
    const lf = {}
    for (const k of Object.keys(DEFAULT_SITE.landingFixed)) {
      lf[k] = { ...DEFAULT_SITE.landingFixed[k], ...(saved.landingFixed[k] || {}) }
    }
    out.landingFixed = lf
  }
  // form.fields·planTexts는 항목 단위 병합 — 코드에 새 항목이 추가돼도 저장본이 통째로 덮지 않게
  if (saved.form) {
    out.form.planTexts = { ...DEFAULT_SITE.form.planTexts, ...(saved.form.planTexts || {}) }
    const fields = {}
    for (const k of Object.keys(DEFAULT_SITE.form.fields)) {
      fields[k] = { ...DEFAULT_SITE.form.fields[k], ...(saved.form.fields?.[k] || {}) }
    }
    out.form.fields = fields
  }
  // 2026-07-19 라벨 마이그레이션 — 저장본(inquiry_site)에 남아 있는 옛 '구도·촬영 기법' 전문용어 라벨을
  // 일반인이 알기 쉬운 새 라벨로 변환 (관리자가 편집기에서 재저장하면 DB도 새 라벨로 굳어진다)
  const TECH_RENAME = {
    '공중부양·플로팅': '공중에 뜬 연출', '플랫레이·탑뷰': '위에서 내려찍은 컷', '매크로·클로즈업': '초근접 확대 컷',
    '놀링·정렬': '가지런히 정렬한 컷', '창가 빛·고보': '창가 햇살·그림자', '모션·다이내믹': '흩날리는 움직임',
    '반사·리플렉션': '거울처럼 반사',
  }
  if (out.reference?.groups) {
    out.reference = {
      ...out.reference,
      groups: out.reference.groups.map((g) => g.key === 'tech'
        ? { ...g, items: (g.items || []).map((it) => TECH_RENAME[it.ko] ? { ...it, ko: TECH_RENAME[it.ko] } : it) }
        : g),
      presets: (out.reference.presets || []).map((p) => ({ ...p, picks: (p.picks || []).map((x) => TECH_RENAME[x] || x) })),
    }
  }
  // 레퍼런스 키워드 항목 단위 병합 — 코드에 새 키워드·그룹·프리셋이 추가돼도 저장본(inquiry_site)이 통째로 덮지 않게.
  // 라벨 마이그레이션(TECH_RENAME) 이후에 돌아야 옛 라벨과 새 라벨이 중복으로 붙지 않는다.
  if (saved.reference?.groups && out.reference?.groups) {
    const savedGroups = out.reference.groups
    const byKey = new Map(savedGroups.map((g) => [g.key, g]))
    const defaultKeys = new Set(DEFAULT_SITE.reference.groups.map((g) => g.key))
    const groups = DEFAULT_SITE.reference.groups.map((dg) => {
      const sg = byKey.get(dg.key)
      if (!sg) return dg
      const have = new Set((sg.items || []).map((it) => it.ko))
      return { ...sg, items: [...(sg.items || []), ...(dg.items || []).filter((it) => !have.has(it.ko))] }
    })
    const presetNames = new Set((out.reference.presets || []).map((p) => p.name))
    out.reference = {
      ...out.reference,
      groups: [...groups, ...savedGroups.filter((g) => !defaultKeys.has(g.key))],
      presets: [
        ...(out.reference.presets || []),
        ...(DEFAULT_SITE.reference.presets || []).filter((p) => !presetNames.has(p.name)),
      ],
    }
  }
  return out
}
