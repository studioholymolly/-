/**
 * 사이트·사업자 정보 — 단일 소스.
 *
 * 여기 값들이 메타데이터, sitemap, robots, JSON-LD(구조화 데이터)에 함께
 * 쓰입니다. AI 검색(ChatGPT·Perplexity·네이버 AI 브리핑)은 여러 채널에
 * 흩어진 상호·주소·연락처가 **문자 단위로 일치**할 때만 같은 사업자로
 * 인식하므로, 표기를 바꿀 일이 있으면 반드시 이 파일에서 바꾸고
 * 네이버 플레이스·인스타그램·메일 서명도 함께 맞춰 주세요.
 *
 * 배포 환경에서 덮어쓸 수 있는 값 (Vercel 프로젝트 설정 → Environment Variables):
 *
 *   NEXT_PUBLIC_SITE_URL      = https://example.com   (도메인 구입 시 필수 변경)
 *   NEXT_PUBLIC_STUDIO_PHONE  = 02-000-0000
 *   NEXT_PUBLIC_STUDIO_ADDRESS_STREET   = 서울특별시 ○○구 ○○로 00, 0층
 *   NEXT_PUBLIC_STUDIO_ADDRESS_LOCALITY = 서울특별시
 *   NEXT_PUBLIC_STUDIO_POSTAL_CODE      = 00000
 *   NEXT_PUBLIC_NAVER_PLACE_URL         = https://map.naver.com/...
 *   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION / _NAVER_ / _BING_
 *
 * 값을 비워두면 JSON-LD 출력에서 해당 항목이 **빠집니다**. 없는 정보를
 * 지어내는 것보다 생략하는 편이 안전합니다 (틀린 구조화 데이터는 신뢰도를
 * 깎습니다).
 */

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '')

/** 배포 URL. 자체 도메인을 붙이면 NEXT_PUBLIC_SITE_URL 로 교체하세요. */
export const SITE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL || 'https://holymolly-ops.vercel.app'
)

export const CONTACT_EMAIL = 'studio.holymolly@gmail.com'

/**
 * 상호 표준 표기.
 * 한글 정식명을 주(主)로, 영문 워드마크를 별칭으로 둡니다.
 * 지금까지 `스튜디오 홀리몰리 / 홀리몰리 / STUDIO. HOLYMOLLY / studio_holymolly`
 * 네 가지로 흩어져 있어 AI가 서로 다른 사업자로 볼 여지가 있었습니다.
 */
export const BRAND = {
  name: '스튜디오 홀리몰리',
  alternateName: 'STUDIO. HOLYMOLLY',
  short: '홀리몰리',
  tagline: '브랜드의 모든 장면을 만드는 크리에이티브 스튜디오',
  description:
    '뷰티, 제품, F&B, 의류, 인물, 영상, BX 디자인 — 브랜드의 모든 장면을 만드는 크리에이티브 스튜디오입니다. 촬영이 끝나면 전용 온라인 갤러리로 셀렉부터 전달까지 링크 하나로 진행합니다.',
} as const

/** 소셜·외부 프로필. schema.org 의 sameAs 로 나가 엔티티를 묶어 줍니다. */
export const SOCIAL_PROFILES = [
  'https://www.instagram.com/studio_holymolly/',
  'https://www.threads.net/@studio_holymolly',
  process.env.NEXT_PUBLIC_NAVER_PLACE_URL || '',
].filter(Boolean)

/**
 * 소재지·연락처.
 *
 * 도로명주소를 표준으로 씁니다. 지번주소(역삼동 783-2)와 병기하면 AI 가
 * 두 개의 다른 위치로 읽을 수 있어, 기계가 읽는 구조화 데이터에는 도로명만
 * 내보내고 지번은 사람이 보는 안내에만 둡니다. 네이버 플레이스·구글
 * 비즈니스 프로필에도 아래 `street` 문자열을 그대로 쓰셔야 합니다.
 *
 * 미설정 값은 구조화 데이터와 화면 출력에서 자동으로 생략됩니다.
 */
export const NAP = {
  phone: process.env.NEXT_PUBLIC_STUDIO_PHONE || '010-8236-9368',
  street: process.env.NEXT_PUBLIC_STUDIO_ADDRESS_STREET || '언주로65길 29, 지하 1층',
  /** 시/군/구 */
  locality: process.env.NEXT_PUBLIC_STUDIO_ADDRESS_LOCALITY || '강남구',
  /** 시/도 */
  region: process.env.NEXT_PUBLIC_STUDIO_ADDRESS_REGION || '서울특별시',
  /** 우편번호 — 확인되면 채워 주세요. 비어 있으면 구조화 데이터에서 빠집니다. */
  postalCode: process.env.NEXT_PUBLIC_STUDIO_POSTAL_CODE || '',
  /** 지번주소 — 사람이 찾아올 때의 보조 표기. 구조화 데이터에는 넣지 않습니다. */
  lotNumberAddress: '서울특별시 강남구 역삼동 783-2, 지하 1층',
  country: 'KR',
} as const

/** 검색엔진 소유확인 코드. 콘솔에서 발급받아 환경변수로 넣으면 자동 반영됩니다. */
export const SITE_VERIFICATION = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  naver: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || '',
  bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || '',
} as const

/** 제공 서비스 — 랜딩 소개, sitemap, JSON-LD 의 서비스 카탈로그가 공유합니다. */
export const SERVICE_CATALOG = [
  { name: '뷰티 촬영', description: '코스메틱과 뷰티 브랜드의 질감, 컬러, 무드를 정교하게 담아냅니다.' },
  { name: '제품 촬영', description: '스마트스토어부터 상세페이지까지, 제품이 팔리게 하는 컷을 만듭니다.' },
  { name: 'F&B 촬영', description: '시즐과 온도까지. 음식과 음료를 가장 맛있는 순간으로 기록합니다.' },
  { name: '의류·룩북 촬영', description: '시즌 룩북, 캠페인, 커머스 화보까지 브랜드의 결을 화보로 옮깁니다.' },
  { name: '인물 촬영', description: '브랜드를 이끄는 사람들, 캠페인 속 인물을 자연스럽게 담습니다.' },
  { name: '영상 제작', description: '브랜드 필름, 커머스 영상, 소셜 콘텐츠까지 무빙으로 확장합니다.' },
  { name: 'BX 디자인', description: '촬영을 넘어 브랜드 경험을 설계합니다. 비주얼 아이덴티티부터 콘텐츠 시스템까지.' },
] as const

/** 공개(색인 대상) 라우트. sitemap 과 내비게이션이 함께 씁니다. */
export const PUBLIC_ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'monthly' as const },
  { path: '/faq', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/about', priority: 0.7, changeFrequency: 'yearly' as const },
  { path: '/inquiry', priority: 0.6, changeFrequency: 'yearly' as const },
]

/**
 * 색인에서 제외할 경로.
 * `/c/` 는 클라이언트 전용 갤러리(토큰 보호)라 절대 노출되면 안 됩니다.
 */
export const PRIVATE_PATHS = ['/dashboard', '/projects', '/c/', '/login', '/api/']

/** 문서 최종 갱신 표기 — AI 검색은 신선도를 인용 판단에 씁니다. */
export const CONTENT_UPDATED = '2026-08'
