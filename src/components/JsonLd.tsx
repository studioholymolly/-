/**
 * 구조화 데이터(JSON-LD)를 <script> 로 심습니다.
 *
 * Next.js 공식 권장 방식대로 next/script 가 아니라 네이티브 <script> 를 씁니다
 * (JSON-LD 는 실행 코드가 아니라 데이터라서). `<` 를 유니코드로 치환하는 것은
 * 문자열에 HTML 태그가 섞여 들어오는 XSS 를 막기 위한 공식 권고 사항입니다.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
