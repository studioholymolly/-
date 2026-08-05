import type { MetadataRoute } from 'next'
import { PUBLIC_ROUTES, SITE_URL } from '@/lib/site'

/**
 * sitemap.xml — 공개 페이지 목록.
 *
 * 검색 콘솔(구글·빙·네이버)에 이 주소를 제출하면 크롤러가 새 페이지를
 * 훨씬 빨리 찾습니다. 페이지를 추가할 때는 `PUBLIC_ROUTES` 에만 넣으면
 * sitemap 과 내비게이션이 함께 갱신됩니다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path === '/' ? '' : route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
