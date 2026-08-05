import JsonLd from '@/components/JsonLd'
import HomeLanding from '@/components/landing/HomeLanding'
import { studioSchema } from '@/lib/jsonld'

export default function HomePage() {
  return (
    <>
      {/* 스튜디오를 하나의 엔티티로 선언합니다. 다른 페이지의 구조화 데이터가
          모두 이 @id 를 참조해 "같은 사업자"임을 못박습니다. */}
      <JsonLd data={studioSchema()} />
      <HomeLanding />
    </>
  )
}
