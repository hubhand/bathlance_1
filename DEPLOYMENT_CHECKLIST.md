# 배포 체크리스트

## 배포 전 체크리스트

### ✅ 완료된 항목

- [x] 로컬 빌드 테스트 성공 (`pnpm run build`)
- [x] 모든 환경 변수 목록 정리
- [x] 디버깅용 console.log 제거
- [x] 코드 정리 완료
- [x] `.gitignore` 확인 (환경 변수 파일 제외 확인)

### 📝 확인 필요 항목

- [ ] Clerk 프로덕션 키 준비
  - [Clerk Dashboard](https://dashboard.clerk.com)에서 프로덕션 인스턴스 생성
  - 프로덕션 Publishable Key (`pk_live_...`) 복사
  - 프로덕션 Secret Key (`sk_live_...`) 복사

- [ ] Supabase 프로젝트 확인
  - Supabase 프로젝트 URL 확인
  - Supabase Anon Key 확인
  - [Supabase Dashboard](https://app.supabase.com) > Project Settings > API

- [ ] Gemini API 키 확인
  - [Google AI Studio](https://aistudio.google.com/app/apikey)에서 API 키 확인

- [ ] GitHub 저장소 준비 (Vercel 연결용)
  - 코드가 GitHub에 푸시되어 있는지 확인
  - 저장소가 없다면 GitHub에 푸시 필요

## 배포 중 체크리스트

### 1. Vercel 프로젝트 생성

- [ ] [Vercel](https://vercel.com)에 로그인
- [ ] "Add New Project" 또는 "New Project" 클릭
- [ ] GitHub 저장소 연결
- [ ] 프로젝트 이름 설정: `bathlance` (또는 원하는 이름)
- [ ] Framework Preset 확인: **Next.js** (자동 감지)
- [ ] Root Directory 확인: `.` (루트)
- [ ] Build Command 확인: `pnpm run build`
- [ ] Output Directory 확인: `.next`
- [ ] Install Command 확인: `pnpm install`

### 2. 환경 변수 설정 (Vercel 대시보드)

Vercel 프로젝트 > Settings > Environment Variables에서 추가:

**Production 환경:**
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = (프로덕션 키)
- [ ] `CLERK_SECRET_KEY` = (프로덕션 키)
- [ ] `GEMINI_API_KEY` = (Gemini API 키)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = (Supabase 프로젝트 URL)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Supabase Anon 키)

**Preview 환경 (선택사항):**
- [ ] 동일한 환경 변수 또는 테스트용 키 사용

**Development 환경 (선택사항):**
- [ ] 개발용 키 사용

### 3. Clerk 프로덕션 설정

- [ ] [Clerk Dashboard](https://dashboard.clerk.com) 접속
- [ ] 프로덕션 인스턴스 생성 (아직 없다면)
- [ ] Settings > Domains에서 Allowed Origins 확인
- [ ] Vercel 배포 후 실제 도메인을 Allowed Origins에 추가:
  - `https://your-project.vercel.app` (배포 후 실제 도메인으로 변경)
  - 커스텀 도메인 사용 시 해당 도메인도 추가

### 4. 첫 배포 실행

- [ ] Vercel 프로젝트 페이지에서 "Deploy" 버튼 클릭
- [ ] 빌드 로그 확인
- [ ] 빌드 성공 확인
- [ ] 배포 완료 후 제공되는 URL 확인

## 배포 후 체크리스트

### 기능 테스트

- [ ] 로그인/회원가입 기능 테스트
- [ ] 제품 등록 기능 테스트
- [ ] 제품 목록 조회 테스트
- [ ] 제품 수정 기능 테스트
- [ ] 제품 삭제 기능 테스트
- [ ] 쇼핑 리스트 기능 테스트
  - [ ] 쇼핑 리스트 항목 추가
  - [ ] 쇼핑 리스트 항목 체크/해제
  - [ ] 쇼핑 리스트 항목 삭제
- [ ] 샤워 일기 기능 테스트
  - [ ] 일기 작성
  - [ ] 일기 조회
  - [ ] 일기 삭제
- [ ] 이미지 업로드 기능 테스트
- [ ] Gemini API 분석 기능 테스트
  - [ ] 제품 이미지 분석
  - [ ] 성분 분석
- [ ] PWA 설치 기능 테스트 (모바일)
  - [ ] 모바일 브라우저에서 접속
  - [ ] "홈 화면에 추가" 옵션 확인

### 에러 확인

- [ ] Vercel 대시보드의 Functions 로그 확인
- [ ] 브라우저 콘솔 에러 확인
- [ ] 환경 변수 누락 확인
- [ ] Clerk Allowed Origins 확인

### 최종 확인

- [ ] 모든 기능 정상 작동 확인
- [ ] 모바일 테스트 완료
- [ ] PWA 설치 테스트 완료
- [ ] 에러 로그 없음 확인

## 문제 해결

### 빌드 실패 시

1. Vercel 대시보드의 빌드 로그 확인
2. 로컬에서 `pnpm run build` 재실행하여 에러 확인
3. 환경 변수 누락 확인
4. TypeScript 에러 확인

### 런타임 에러 시

1. 브라우저 콘솔 에러 확인
2. Vercel 대시보드의 Functions 로그 확인
3. 환경 변수 값 확인 (특히 `NEXT_PUBLIC_` 접두사 확인)
4. Clerk Allowed Origins 확인

### 인증 에러 시

1. Clerk 프로덕션 키 확인
2. Clerk Allowed Origins에 Vercel 도메인 추가 확인
3. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`와 `CLERK_SECRET_KEY` 확인

### 데이터베이스 에러 시

1. Supabase 프로젝트 URL 및 키 확인
2. Supabase 대시보드에서 테이블 존재 확인
3. RLS (Row Level Security) 정책 확인

