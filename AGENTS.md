<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 배포는 묻지 말고 알아서 (2026-08-16 지시)

작업이 끝나면 **매번 확인받지 말고** 브랜치 push → PR 생성 → `main` 머지까지 알아서 진행한다.
Vercel이 `main`을 보고 자동 배포하므로 머지가 곧 운영 반영이다. 끝나면 "배포 완료"를 알린다.

단, 이 저장소 세션에서 Vercel API는 접근이 막혀 있다 (팀은 조회되나 프로젝트·배포는 404).
그래서 **확인할 수 있는 것과 없는 것을 구분해서 보고한다.**

- 확인 가능: `main` 머지 여부, PR에 달리는 Vercel 프리뷰 빌드 Ready 코멘트(= 빌드는 통과)
- 확인 불가: 운영 도메인(`holymolly-ops.vercel.app`)의 최종 배포 성공 여부
- 사용자가 배포를 직접 확인해야 할 때 안내할 것 — 주소 뒤 `/version.txt`,
  그리고 대시보드 **설정 · 데이터** 화면 우측 상단의 빌드 시각

되돌릴 수 없거나 데이터를 지우는 작업(강제 푸시로 남의 커밋 덮어쓰기, 스키마 삭제 등)은
이 규칙에서 제외 — 그런 건 여전히 먼저 묻는다.
