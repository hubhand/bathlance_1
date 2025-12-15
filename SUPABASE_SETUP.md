# Supabase 데이터베이스 설정 가이드

이 가이드는 BATHLANCE 서비스를 Supabase 데이터베이스와 연동하는 방법을 설명합니다.

## 📋 목차

1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [데이터베이스 스키마 생성](#2-데이터베이스-스키마-생성)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [테스트](#4-테스트)

---

## 1. Supabase 프로젝트 생성

### 1.1 Supabase 계정 생성

1. [Supabase 웹사이트](https://supabase.com)에 접속
2. "Start your project" 버튼 클릭
3. GitHub 계정으로 로그인 (또는 이메일로 회원가입)

### 1.2 새 프로젝트 생성

1. 대시보드에서 "New Project" 버튼 클릭
2. 프로젝트 정보 입력:
   - **Name**: `bathlance` (원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (저장해두세요!)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 사용자 권장)
3. "Create new project" 버튼 클릭
4. 프로젝트 생성 완료까지 2-3분 대기

---

## 2. 데이터베이스 스키마 생성

### 2.1 SQL Editor 열기

1. Supabase 대시보드에서 왼쪽 메뉴의 **"SQL Editor"** 클릭
2. **"New query"** 버튼 클릭

### 2.2 스키마 실행

1. 프로젝트의 `supabase/schema.sql` 파일을 열어서 전체 내용을 복사
2. Supabase SQL Editor에 붙여넣기
3. **"Run"** 버튼 클릭 (또는 `Ctrl + Enter`)
4. 성공 메시지 확인:
   ```
   Success. No rows returned
   ```

### 2.3 테이블 확인

1. 왼쪽 메뉴에서 **"Table Editor"** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - `products` (제품)
   - `shopping_list` (쇼핑 리스트)
   - `diary_entries` (샤워 일기)

---

## 3. 환경 변수 설정

### 3.1 Supabase API 키 가져오기

1. Supabase 대시보드에서 왼쪽 메뉴의 **"Settings"** (⚙️) 클릭
2. **"API"** 섹션 클릭
3. 다음 정보를 복사:
   - **Project URL** (예: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** 키 (``anon`` 또는 ``public`` 키)

### 3.2 .env.local 파일 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Clerk 인증 (기존 설정 유지)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Gemini API (기존 설정 유지)
GEMINI_API_KEY=your_gemini_api_key

# Supabase (새로 추가)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**예시:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3.3 환경 변수 확인

환경 변수가 제대로 설정되었는지 확인:

```bash
# Windows (PowerShell)
Get-Content .env.local

# 또는 파일을 직접 열어서 확인
```

---

## 4. 테스트

### 4.1 개발 서버 실행

터미널에서 다음 명령어를 실행하세요:

```bash
pnpm run dev
```

### 4.2 기능 테스트

1. 브라우저에서 `http://localhost:3000` 접속
2. Clerk로 로그인
3. 제품 등록 테스트:
   - 홈 화면의 "등록하기" 버튼 클릭
   - 제품 정보 입력 후 저장
   - Supabase 대시보드의 Table Editor에서 `products` 테이블에 데이터가 추가되었는지 확인
4. 쇼핑 리스트 테스트:
   - 메모 화면에서 쇼핑 리스트 항목 추가
   - Supabase 대시보드에서 `shopping_list` 테이블 확인
5. 샤워 일기 테스트:
   - 메모 화면에서 일기 작성
   - Supabase 대시보드에서 `diary_entries` 테이블 확인

---

## 🔒 보안 참고사항

### 현재 설정

- **RLS (Row Level Security)**: 현재 비활성화됨
- **필터링**: 애플리케이션 레벨에서 `user_id`로 필터링
- **보안**: Clerk 인증을 통해 사용자 식별

### 향후 개선 사항

Clerk JWT를 Supabase에 통합하면 RLS를 활성화하여 데이터베이스 레벨에서 보안을 강화할 수 있습니다. 이는 다음 단계에서 구현할 수 있습니다.

---

## 🐛 문제 해결

### 문제: "Supabase URL과 Anon Key가 설정되지 않았습니다" 에러

**해결 방법:**
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 환경 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 필수)
3. 개발 서버를 재시작 (`pnpm run dev`)

### 문제: "relation does not exist" 에러

**해결 방법:**
1. `supabase/schema.sql` 파일이 제대로 실행되었는지 확인
2. Supabase 대시보드의 Table Editor에서 테이블이 생성되었는지 확인
3. SQL Editor에서 다시 스키마 실행

### 문제: 데이터가 저장되지 않음

**해결 방법:**
1. 브라우저 콘솔에서 에러 메시지 확인
2. Supabase 대시보드의 "Logs" 섹션에서 에러 확인
3. Clerk 로그인이 제대로 되어 있는지 확인

---

## 📚 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript/introduction)
- [Clerk + Supabase 통합 가이드](https://clerk.com/docs/integrations/databases/supabase)

---

## ✅ 체크리스트

설정이 완료되면 다음 항목을 확인하세요:

- [ ] Supabase 프로젝트 생성 완료
- [ ] 데이터베이스 스키마 실행 완료
- [ ] `.env.local` 파일에 Supabase 환경 변수 추가
- [ ] 개발 서버 실행 후 제품 등록 테스트 성공
- [ ] Supabase 대시보드에서 데이터 확인 가능

---

설정이 완료되면 이제 BATHLANCE 서비스가 Supabase 데이터베이스와 연동되어 사용자 데이터를 안전하게 저장할 수 있습니다! 🎉

