# Vercel 배포 가이드

## 필수 환경 변수 목록

Vercel 프로젝트 설정 > Environment Variables에서 다음 환경 변수를 추가해야 합니다:

### Production 환경 변수

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 환경 변수 설명

1. **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**
   - Clerk Dashboard > API Keys에서 프로덕션 Publishable Key 복사
   - `pk_live_`로 시작하는 키

2. **CLERK_SECRET_KEY**
   - Clerk Dashboard > API Keys에서 프로덕션 Secret Key 복사
   - `sk_live_`로 시작하는 키

3. **GEMINI_API_KEY**
   - Google AI Studio에서 발급받은 API 키
   - 서버 사이드에서만 사용되므로 `NEXT_PUBLIC_` 접두사 없음

4. **NEXT_PUBLIC_SUPABASE_URL**
   - Supabase Dashboard > Project Settings > API에서 확인
   - `https://xxxxx.supabase.co` 형식

5. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Supabase Dashboard > Project Settings > API에서 확인
   - `anon` 또는 `public` 키

## Clerk 프로덕션 설정

1. [Clerk Dashboard](https://dashboard.clerk.com) 접속
2. 프로덕션 인스턴스 생성 (아직 없다면)
3. Settings > Domains에서 Allowed Origins에 추가:
   - `https://your-project.vercel.app`
   - 커스텀 도메인 사용 시 해당 도메인도 추가

## Supabase 확인 사항

- 현재 Supabase 프로젝트가 프로덕션 환경인지 확인
- RLS (Row Level Security)는 현재 비활성화 상태 (애플리케이션 레벨 필터링 사용)
- API 키가 올바른지 확인

## 로컬 프로덕션 서버 테스트 (선택사항)

빌드가 성공했으므로, 프로덕션 빌드가 제대로 작동하는지 테스트할 수 있습니다:

```bash
# 프로덕션 서버 실행 (다른 터미널에서)
pnpm run start
```

브라우저에서 `http://localhost:3000`으로 접속하여 테스트하세요.

**참고**: 프로덕션 서버는 빌드된 파일을 실행하므로, 코드를 수정해도 반영되지 않습니다. 개발 중에는 `pnpm run dev`를 사용하세요.

---

## Vercel 프로젝트 생성 단계

### 1. Vercel 계정 및 프로젝트 생성

1. [Vercel](https://vercel.com)에 로그인 (GitHub 계정으로 로그인 권장)
2. "Add New Project" 또는 "New Project" 클릭
3. GitHub/GitLab/Bitbucket 저장소 연결
   - 저장소가 없다면 먼저 GitHub에 푸시 필요
4. 프로젝트 이름 설정: `bathlance` 또는 원하는 이름
5. Framework Preset: **Next.js** (자동 감지됨)
6. Root Directory: `.` (루트)
7. Build Command: `pnpm run build` (자동 감지됨)
8. Output Directory: `.next` (Next.js 기본값)
9. Install Command: `pnpm install` (자동 감지됨)

### 2. 환경 변수 설정 (Vercel 대시보드)

프로젝트 생성 후 Settings > Environment Variables에서 다음 변수 추가:

**Production 환경:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = (프로덕션 키)
- `CLERK_SECRET_KEY` = (프로덕션 키)
- `GEMINI_API_KEY` = (Gemini API 키)
- `NEXT_PUBLIC_SUPABASE_URL` = (Supabase 프로젝트 URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Supabase Anon 키)

**Preview 환경 (선택사항):**
- 동일한 환경 변수 또는 테스트용 키 사용

**Development 환경 (선택사항):**
- 개발용 키 사용

### 3. Clerk 프로덕션 설정

1. [Clerk Dashboard](https://dashboard.clerk.com) 접속
2. 프로덕션 인스턴스 생성 (아직 없다면)
3. Settings > Domains에서 Allowed Origins에 추가:
   - `https://your-project.vercel.app` (배포 후 실제 도메인으로 변경)
   - 커스텀 도메인 사용 시 해당 도메인도 추가

### 4. 첫 배포 실행

1. Vercel 프로젝트 페이지에서 "Deploy" 버튼 클릭
2. 빌드 로그 확인
3. 배포 완료 후 제공되는 URL로 접속 테스트

## 배포 후 확인 사항

- [ ] 로그인/회원가입 기능
- [ ] 제품 등록/수정/삭제
- [ ] 제품 목록 조회
- [ ] 쇼핑 리스트 기능
- [ ] 샤워 일기 기능
- [ ] 이미지 업로드 및 Gemini API 분석
- [ ] PWA 설치 기능 (모바일)

## 문제 해결

### 빌드 실패 시
- Vercel 대시보드의 Functions 로그 확인
- 환경 변수 누락 확인
- 로컬에서 `pnpm run build` 재실행하여 에러 확인

### 런타임 에러 시
- 브라우저 콘솔 에러 확인
- Vercel Functions 로그 확인
- 환경 변수 값 확인 (특히 `NEXT_PUBLIC_` 접두사 확인)

