import { ImageResponse } from 'next/og'

export const alt = '스튜디오 홀리몰리 — 브랜드의 모든 장면을 만드는 크리에이티브 스튜디오'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * 링크 공유 시 뜨는 대표 이미지.
 *
 * 한글 웹폰트를 번들하지 않았으므로 이미지 안에는 라틴 문자만 씁니다
 * (한글을 넣으면 폰트가 없어 네모로 렌더링됩니다). 한글 설명은 alt 와
 * og:description 이 담당합니다.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#fafaf8',
          color: '#0a0a0a',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: '#6f6f6f',
          }}
        >
          Creative Studio — Seoul
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 104,
              fontWeight: 700,
              letterSpacing: '0.04em',
              lineHeight: 1.05,
            }}
          >
            STUDIO
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 104,
              fontWeight: 700,
              letterSpacing: '0.04em',
              lineHeight: 1.05,
            }}
          >
            HOLYMOLLY
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '1px solid #e5e5e3',
            paddingTop: 28,
            fontSize: 24,
            color: '#6f6f6f',
          }}
        >
          <div style={{ display: 'flex' }}>
            Beauty · Product · F&amp;B · Fashion · People · Film · BX
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
