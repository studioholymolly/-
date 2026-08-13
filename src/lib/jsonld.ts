/**
 * schema.org 구조화 데이터 빌더.
 *
 * 왜 필요한가: AI 검색이 "이 페이지가 무엇에 대한 것인지" 판단할 때 본문
 * 해석에만 의존하지 않고 이 기계 판독용 명함을 함께 읽습니다. FAQPage 를
 * 붙인 페이지가 AI 요약에 인용되는 빈도가 눈에 띄게 높다는 점이 여러
 * 관측에서 공통적으로 보고됩니다.
 *
 * 주의: 마크업과 화면에 보이는 내용이 어긋나면 오히려 신뢰도가 깎입니다.
 * 그래서 FAQ 스키마는 페이지 본문과 **같은 데이터 배열**에서 생성합니다.
 */
import {
  BRAND,
  CONTACT_EMAIL,
  NAP,
  SERVICE_CATALOG,
  SITE_URL,
  SOCIAL_PROFILES,
} from '@/lib/site'

/** 값이 있는 항목만 남깁니다 — 빈 문자열을 내보내면 잘못된 사실이 됩니다. */
function compact<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== '' && v !== undefined && v != null)
  ) as T
}

/**
 * 사업자 주소. 값이 비어 있으면 통째로 생략합니다.
 *
 * 한국 주소의 schema.org 매핑: 시/도 → addressRegion, 시/군/구 →
 * addressLocality, 나머지 → streetAddress.
 */
function postalAddress() {
  if (!NAP.street && !NAP.locality) return undefined
  return compact({
    '@type': 'PostalAddress',
    streetAddress: NAP.street,
    addressLocality: NAP.locality,
    addressRegion: NAP.region,
    postalCode: NAP.postalCode,
    addressCountry: NAP.country,
  })
}

/**
 * 스튜디오 자체를 가리키는 엔티티.
 * 사이트 전역에서 이 하나의 @id 를 참조해 "같은 사업자"임을 못박습니다.
 */
export const ORGANIZATION_ID = `${SITE_URL}/#studio`

export function studioSchema() {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': ORGANIZATION_ID,
    name: BRAND.name,
    alternateName: BRAND.alternateName,
    description: BRAND.description,
    url: SITE_URL,
    email: CONTACT_EMAIL,
    telephone: NAP.phone,
    image: `${SITE_URL}/opengraph-image`,
    logo: `${SITE_URL}/icon.svg`,
    address: postalAddress(),
    areaServed: { '@type': 'Country', name: '대한민국' },
    knowsLanguage: ['ko', 'en'],
    sameAs: SOCIAL_PROFILES,
    priceRange: '₩₩₩',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: '촬영·제작 서비스',
      itemListElement: SERVICE_CATALOG.map((s) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.name,
          description: s.description,
          provider: { '@id': ORGANIZATION_ID },
        },
      })),
    },
  })
}

export type FaqItem = {
  /** 질문 — 페이지의 H2 와 동일해야 합니다. */
  q: string
  /** 답변 캡슐. 앞뒤 문맥 없이 그대로 인용되어도 말이 되는 2~3문장. */
  a: string
  /** 캡슐 뒤에 붙는 부연. 스키마에는 캡슐과 합쳐 들어갑니다. */
  detail?: string
}

export function faqPageSchema(items: readonly FaqItem[], pageUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    url: pageUrl,
    inLanguage: 'ko',
    publisher: { '@id': ORGANIZATION_ID },
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.detail ? `${item.a} ${item.detail}` : item.a,
      },
    })),
  }
}

/** 일반 콘텐츠 페이지(가격 안내·소개 등)의 기본 서술. */
export function webPageSchema(opts: {
  url: string
  name: string
  description: string
  /** ISO 날짜. 신선도 신호로 쓰입니다. */
  dateModified?: string
}) {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${opts.url}#page`,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    inLanguage: 'ko',
    dateModified: opts.dateModified,
    isPartOf: { '@type': 'WebSite', url: SITE_URL, name: BRAND.name },
    about: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
  })
}

/** 빵부스러기 — AI 가 사이트 구조를 파악하는 데 씁니다. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  }
}
