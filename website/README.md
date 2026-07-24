# studioholymolly.com — 마케팅 사이트 프론트엔드 소스

`studioholymolly.com`(Vercel 프로젝트 `studioholymolly`)에 배포되는 홈페이지의
프론트엔드 소스입니다. 이 사이트는 그동안 Vercel CLI로만 배포되어 **저장소에
소스가 없었고**, 이번에 프로덕션에서 복원해 버전 관리 아래로 가져왔습니다.

## 이번 변경 (모바일 홈 오류 수정 + 클라이언트 로고 숨김)

`assets/site.css`
- **버그 수정**: 클라이언트 로고 카드(`.clogo`)의 `aspect-ratio` 기반 높이를
  **고정 높이**로 변경. iOS Safari에서 grid 자식에 `aspect-ratio`를 주면 행 높이가
  0으로 잘못 계산되어, 로고 이미지가 인접 섹션(영상·푸터) 위로 비쳐 보이던
  문제(첨부 스크린샷)를 없앴습니다.
- **요청 반영**: 모바일(≤720px) 홈 화면에서는 `#homeClients`(클라이언트 로고 섹션)를
  `display:none`으로 숨깁니다. 데스크톱 홈과 About 페이지에서는 그대로 노출됩니다.

## 구조

- `index.html`, `about.html`, `photo.html`, `video.html`, `schedule.html`, `contact.html` — 페이지
- `assets/site.css`, `assets/site.js` — 공용 스타일·스크립트
- 콘텐츠는 런타임에 `/api/content`(Vercel 함수)에서 불러오고, 이미지·심볼·파비콘은
  Cloudflare R2에서 서빙합니다. 서버리스 함수(`/api/*`)와 관리자 화면(`/admin`)은
  프로덕션 배포본에만 있으며 이 커밋에는 포함하지 않았습니다(자격증명을 다루는
  코드라 별도 검토 후 반영 예정).

> 이 소스는 프론트엔드 렌더 검증·리뷰용 복원본입니다. 실제 배포에는 위의
> `/api/*` 함수와 R2 자산 서빙 설정이 함께 필요합니다.
