# 📷 Studio App — 설치 가이드

사진 스튜디오 ↔ 클라이언트 셀렉/보정 협업 플랫폼을 **본인 스튜디오용으로** 설치하는 방법입니다.

> 예상 소요 시간: **30분 ~ 1시간**
> 필요 비용: 무료 (Supabase Free + Vercel Hobby)

---

## 1. 준비물 (한 번만)

아래를 미리 설치/가입해 두세요.

### 🛠 설치
- **Node.js** (LTS 버전) — <https://nodejs.org>
- **Git** — macOS/Linux 는 보통 기본 포함. 확인: 터미널에 `git --version`
- 텍스트 에디터 — **VS Code** 추천 — <https://code.visualstudio.com>

### 🔐 계정
- **GitHub** 계정 — <https://github.com> (코드 받기용)
- **Supabase** 계정 — <https://supabase.com> (데이터베이스)
- **Vercel** 계정 — <https://vercel.com> (배포)

> 💡 셋 다 Google/GitHub 로그인으로 1분이면 가입 가능.

---

## 2. 코드 복제

터미널을 열고 원하는 폴더로 이동 후:

```bash
cd ~/Desktop
git clone <원본-저장소-URL> studio-app
cd studio-app
npm install
```

> `<원본-저장소-URL>` 자리에 GitHub 저장소 주소를 넣으세요 (예: `https://github.com/your-org/studio-app.git`).
> 이 과정에서 에러가 난다면 대부분 Node.js 버전 문제 — Node LTS (22.x 이상) 설치 후 재시도.

---

## 3. Supabase 프로젝트 만들기

1. <https://supabase.com/dashboard> 접속 → **New project** 클릭
2. 아래 값을 입력:
   - **Name**: `studio-app` 같은 식별 가능한 이름
   - **Database Password**: 강력한 비밀번호 (나중에 한 번 더 볼 일은 거의 없지만 메모장에 저장해 두세요)
   - **Region**: `Northeast Asia (Seoul)` 추천
3. **Create new project** 클릭 → 1~2분 기다리면 준비됨

---

## 4. DB 스키마 생성

1. 좌측 메뉴에서 **SQL Editor** 클릭 → **New query**
2. 저장소 루트의 **`supabase-schema.sql`** 파일 내용을 **전부 복사**해서 붙여넣기
3. 우측 하단 **RUN** 클릭
4. `Success. No rows returned` 메시지가 뜨면 성공

> 이 SQL 은 테이블, 인덱스, RLS 정책을 한꺼번에 생성합니다.

---

## 5. 스토리지 버킷 만들기

좌측 메뉴 **Storage** 클릭 → **New bucket** 으로 아래 2개 생성 (둘 다 **private**):

- `originals` (원본 사진)
- `retouched` (보정본)

각 버킷 생성 후, **Policies** 탭에서 아래 SQL 정책도 추가해야 합니다:

**SQL Editor** 에서:

```sql
-- 로그인한 사용자는 자유롭게 업로드/다운로드/삭제 가능
create policy "studio_all_originals" on storage.objects
  for all using (bucket_id = 'originals' and auth.uid() is not null)
  with check (bucket_id = 'originals' and auth.uid() is not null);

create policy "studio_all_retouched" on storage.objects
  for all using (bucket_id = 'retouched' and auth.uid() is not null)
  with check (bucket_id = 'retouched' and auth.uid() is not null);

-- 클라이언트(비로그인)가 공유 링크에서 서명 URL을 생성하기 위해 SELECT 필요
create policy "public_select_originals" on storage.objects
  for select using (bucket_id = 'originals');

create policy "public_select_retouched" on storage.objects
  for select using (bucket_id = 'retouched');
```

---

## 6. Supabase 키 복사

Supabase 프로젝트의 좌측 메뉴 **Settings → API** 클릭. 아래 두 값을 메모장에 복사해 두세요:

- **Project URL** (`https://xxxx.supabase.co` 형태)
- **Project API keys → anon / public** (긴 문자열)

---

## 7. 관리자 계정 만들기 (첫 로그인용)

좌측 메뉴 **Authentication → Users → Add user → Create new user**

- **Email**: 본인 이메일
- **Password**: 원하는 비밀번호
- **Auto Confirm User**: ✅ **체크** (안 하면 이메일 인증해야 로그인 가능)

**Create user** 클릭.

---

## 8. 환경변수 설정

프로젝트 폴더의 **`.env.example`** 을 복사해서 **`.env.local`** 파일을 만드세요:

```bash
cp .env.example .env.local
```

텍스트 에디터로 `.env.local` 열어서 아래를 본인 값으로 교체:

```
NEXT_PUBLIC_SUPABASE_URL=<6번 단계에서 복사한 URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<6번 단계에서 복사한 anon key>
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_STUDIO_NAME=내 스튜디오 이름
NEXT_PUBLIC_STUDIO_SHORT_NAME=짧은 이름
```

---

## 9. 로컬 테스트

```bash
npm run dev
```

브라우저에서 <http://localhost:3000> 열기 → 로그인 페이지가 뜹니다.
7번에서 만든 이메일/비밀번호로 로그인 → **대시보드**가 보이면 성공 🎉

문제가 있으면 터미널 에러 메시지 확인.

---

## 10. Vercel 배포

```bash
npm install -g vercel
vercel login    # 브라우저로 Vercel 로그인
vercel          # 프로젝트 연결 (기본값 그대로 Enter 몇 번)
```

첫 배포 후 Vercel 대시보드 (<https://vercel.com/dashboard>) 에서 방금 만든 프로젝트 열기:

1. **Settings → Environment Variables** 에 `.env.local` 과 **같은 값**들을 추가
   - `NEXT_PUBLIC_APP_URL` 만은 **배포된 URL로 변경** (예: `https://studio-app-abc.vercel.app`)
2. 저장 후, 터미널에서 다시:
   ```bash
   vercel --prod
   ```

배포 URL 로 접속해서 로그인되면 완료!

---

## 11. Supabase Auth 리다이렉트 URL 설정 (중요!)

배포 후 비밀번호 재설정, 매직 링크 같은 이메일 링크가 **localhost** 가 아닌 **실제 사이트**로 가도록 설정해야 해요.

Supabase 대시보드 → **Authentication → URL Configuration**:

- **Site URL**: `https://your-project.vercel.app` (배포된 주소)
- **Redirect URLs**: `https://your-project.vercel.app/**` 추가

**Save**.

---

## 12. 커스터마이징 (선택)

### 스튜디오 이름
`.env.local` / Vercel 환경변수의 `NEXT_PUBLIC_STUDIO_NAME`, `NEXT_PUBLIC_STUDIO_SHORT_NAME` 변경 후 재배포.

### 로고
좌측 상단 📷 이모지가 로고예요. 바꾸고 싶으면:
- `src/components/Navbar.tsx` — 📷 이모지 부분
- `src/app/page.tsx` — 로그인 화면 📷
- `src/app/layout.tsx` — 탭 favicon 은 `public/favicon.ico` 교체

### 색상
프로젝트 전반의 보라색 테마를 바꾸려면 `src/app/globals.css` 에서 `--vio` 로 시작하는 CSS 변수 색상 코드를 교체.

### 클라이언트 안내 메시지 기본값
`src/app/projects/new/page.tsx` 의 `defaultValue="마음에 드시는..."` 부분 수정.

---

## 13. 팀원 추가하기 (직원과 함께 쓰기)

이 앱은 **로그인한 모든 사용자가 모든 프로젝트를 공유**하도록 설정되어 있어요 (한 스튜디오 안에서 직원과 함께 쓰는 구조).

직원 계정 추가:
1. Supabase → Authentication → Users
2. **Add user → Create new user**
3. 이메일 + 임시 비밀번호 + **Auto Confirm User 체크**
4. 직원에게 이메일/비밀번호 전달 → 직원이 첫 로그인 후 비밀번호 변경 권장

---

## ❓ 자주 막히는 곳

**Q. 로그인이 안 돼요 / "Invalid login credentials"**
→ 7번에서 **Auto Confirm User** 체크 안 했을 가능성. 그 사용자 삭제 후 다시 체크하고 생성.

**Q. 이미지가 업로드는 되는데 클라이언트 화면에서 파일명만 보여요**
→ 5번의 Storage 정책이 누락됨. SQL 다시 실행.

**Q. 배포 후 비밀번호 재설정 링크가 localhost 로 가요**
→ 11번 Redirect URL 설정 누락.

**Q. `vercel --prod` 할 때 환경변수 에러**
→ Vercel 대시보드 Settings → Environment Variables 에 누락된 값이 있는지 확인. 추가 후 재배포.

**Q. 다른 문제가 발생해요**
→ 터미널/브라우저 콘솔 에러 메시지를 원본 스튜디오에 그대로 공유해서 도움 요청.

---

즐겁게 쓰세요 ☀️
