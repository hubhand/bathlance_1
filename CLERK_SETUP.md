# Clerk 인증 설정 가이드

## 현재 프로젝트 (Next.js App Router)

현재 프로젝트는 **Next.js App Router**로 구성되어 있으며, `@clerk/nextjs`를 사용하여 Clerk 인증이 통합되어 있습니다.

### 설치 완료된 패키지

- `@clerk/nextjs` - Next.js용 Clerk SDK

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Clerk Authentication
# https://dashboard.clerk.com 에서 키를 발급받으세요
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_**********
CLERK_SECRET_KEY=sk_test_**********

# Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

**중요**: Next.js에서는 클라이언트에서 사용할 환경 변수에 `NEXT_PUBLIC_` 접두사가 필요합니다.

### 구현된 기능

1. **Middleware 설정** (`middleware.ts`)
   - `clerkMiddleware()`를 사용하여 인증 미들웨어 설정

2. **ClerkProvider 설정** (`app/layout.tsx`)
   - 앱 전체를 `<ClerkProvider>`로 래핑하여 인증 컨텍스트 제공

3. **Header 컴포넌트** (`components/Header.tsx`)
   - 로그인/회원가입 버튼 (미인증 사용자)
   - 사용자 프로필 버튼 (인증된 사용자)

4. **인증 보호** (`app/page.tsx`)
   - `<SignedIn>`: 인증된 사용자만 앱 콘텐츠 접근
   - `<SignedOut>`: 미인증 사용자에게 로그인 안내 화면 표시

### 사용 방법

1. [Clerk Dashboard](https://dashboard.clerk.com)에서 계정 생성 및 애플리케이션 생성
2. Publishable Key와 Secret Key 복사
3. `.env.local` 파일에 키 추가
4. 개발 서버 실행: `pnpm run dev`

### 프로젝트 구조

```
bathlance_1/
├── app/
│   ├── layout.tsx          # 루트 레이아웃 (ClerkProvider 포함)
│   ├── page.tsx            # 홈 페이지 (메인 앱 로직)
│   └── globals.css         # 전역 스타일
├── components/              # 컴포넌트
├── hooks/                  # 커스텀 훅
├── services/               # API 서비스
├── utils/                  # 유틸리티 함수
├── middleware.ts           # Clerk 미들웨어
└── next.config.js          # Next.js 설정
```

### 다음 단계 (선택사항)

- 사용자별 데이터 분리 (현재는 localStorage 사용)
- 서버 API와 연동하여 사용자별 데이터 저장
- 역할 기반 접근 제어 (RBAC)
- Server Actions를 사용한 서버 사이드 로직 구현

---

## 참고 자료

- [Clerk Next.js 공식 문서](https://clerk.com/docs/quickstarts/nextjs)
- [Next.js App Router 문서](https://nextjs.org/docs/app)
- 상세 가이드라인: `.cursor/rules/clerk-nextjs-guide.md`

