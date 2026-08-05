import type { MetadataRoute } from 'next'
import { PRIVATE_PATHS, SITE_URL } from '@/lib/site'

/**
 * robots.txt
 *
 * 2026년 기준 AI 크롤러는 두 갈래로 나뉩니다.
 *   - 학습용:      GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot …
 *   - 검색·인용용: OAI-SearchBot, Claude-SearchBot, PerplexityBot, Perplexity-User …
 *
 * 학습만 막고 인용은 허용하는 선택도 가능하지만, 우리는 노출 자체가 자산인
 * B2B 스튜디오이고 막아야 할 독점 콘텐츠가 없으므로 **전부 허용**합니다.
 * 대신 고객 사진이 있는 갤러리(/c/)와 내부 화면은 명시적으로 차단합니다.
 *
 * 주의: robots.txt 는 "요청하지 말아 달라"는 신청이지 접근 통제가 아닙니다.
 * 갤러리의 실제 보호는 토큰과 미들웨어가 담당하고, 여기 Disallow 는
 * 색인 노출을 막는 용도입니다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        // AI 검색이 인용할 때 실제로 오는 크롤러들 — 명시적으로 환영.
        userAgent: [
          'OAI-SearchBot',
          'ChatGPT-User',
          'GPTBot',
          'Claude-SearchBot',
          'ClaudeBot',
          'PerplexityBot',
          'Perplexity-User',
          'Google-Extended',
          'Applebot-Extended',
          'CCBot',
          'Bingbot',
        ],
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
