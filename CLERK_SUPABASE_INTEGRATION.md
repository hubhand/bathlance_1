# Clerk와 Supabase 통합 가이드

이 문서는 BATHLANCE 프로젝트에서 Clerk 인증과 Supabase 데이터베이스를 통합하는 방법을 설명합니다.

## 📋 목차

1. [개요](#개요)
2. [Clerk Dashboard 설정](#clerk-dashboard-설정)
3. [Supabase Dashboard 설정](#supabase-dashboard-설정)
4. [코드 통합](#코드-통합)
5. [RLS 정책 활성화](#rls-정책-활성화)
6. [테스트](#테스트)
7. [문제 해결](#문제-해결)

---

## 개요

Clerk와 Supabase를 통합하면 다음과 같은 이점이 있습니다:

- **데이터베이스 레벨 보안**: Row Level Security (RLS)를 통해 데이터베이스 레벨에서 접근 제어
- **자동 인증**: Clerk session token이 자동으로 Supabase 요청에 포함됨
- **보안 강화**: 애플리케이션 레벨 필터링 외에 데이터베이스 레벨 보안 추가

이 통합은 [Clerk 공식 문서](https://clerk.com/docs/guides/development/integrations/databases/supabase)를 기반으로 구현되었습니다.

---

## Clerk Dashboard 설정

### 1. Supabase 통합 활성화

1. [Clerk Dashboard](https://dashboard.clerk.com)에 로그인
2. 왼쪽 메뉴에서 **"Integrations"** 또는 **"Setup"** 클릭
3. **"Supabase"** 통합 찾기
4. **"Activate Supabase integration"** 버튼 클릭
5. 표시된 **Clerk domain** 복사 (예: `integral-puma-47.clerk.accounts.dev`)

### 2. Clerk Domain 확인

Clerk domain은 다음과 같은 형식입니다:
```
your-instance-name.clerk.accounts.dev
```

이 값은 다음 단계에서 Supabase에 입력해야 합니다.

---

## Supabase Dashboard 설정

### 1. Clerk를 Third-Party Auth Provider로 추가

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **"Authentication"** 클릭
4. **"Providers"** 또는 **"Sign In / Up"** 탭 클릭
5. **"Add provider"** 버튼 클릭
6. **"Clerk"** 선택 (목록에 없으면 검색)
7. Clerk Dashboard에서 복사한 **Clerk domain** 입력
8. **"Save"** 클릭

### 2. 설정 확인

Supabase Dashboard에서 다음을 확인하세요:
- Clerk provider가 활성화되어 있는지
- Clerk domain이 올바르게 입력되어 있는지

---

## 코드 통합

### 1. Supabase 클라이언트 생성 함수

프로젝트는 [Supabase 공식 문서](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)의 모범 사례를 따릅니다:

**클라이언트 사이드** (`lib/supabase/client.ts`):
```typescript
'use client'
import { useSession } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'

export default function MyComponent() {
  const { session } = useSession()
  const supabase = createClient(session)
  
  // Supabase 요청 시 Clerk token이 자동으로 포함됨
  const { data } = await supabase.from('products').select()
}
```

**서버 사이드** (`lib/supabase/server.ts`):
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function ServerComponent() {
  const supabase = await createClient()
  
  // Clerk token이 자동으로 포함됨
  const { data } = await supabase.from('products').select()
}
```

### 2. Hooks 업데이트

`useMemos`와 `useProducts` 훅은 이미 Clerk 통합 클라이언트를 사용하도록 업데이트되었습니다:

```typescript
// hooks/useMemos.ts
import { useSession } from '@clerk/nextjs'
import { createClient } from '../lib/supabase/client'

export const useMemos = () => {
  const { session } = useSession()
  const supabase = useMemo(() => {
    return createClient(session)
  }, [session])
  
  // ... 나머지 코드
}
```

> 💡 **참고**: Supabase 공식 문서의 모범 사례에 따라 클라이언트와 서버를 분리했습니다:
> - 클라이언트: `@/lib/supabase/client`
> - 서버: `@/lib/supabase/server`

---

## RLS 정책 활성화

### 1. SQL 스크립트 실행

1. Supabase Dashboard에서 **"SQL Editor"** 열기
2. `supabase/schema.sql` 파일의 RLS 정책 부분 확인
3. 다음 SQL을 실행하여 RLS 활성화:

```sql
-- RLS 활성화
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE trouble_history ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (schema.sql 파일 참고)
-- 각 테이블에 대해 SELECT, INSERT, UPDATE, DELETE 정책 생성
```

### 2. 정책 확인

Supabase Dashboard에서:
1. **"Table Editor"** 열기
2. 각 테이블 선택
3. **"Policies"** 탭에서 정책이 생성되었는지 확인

---

## 테스트

### 1. 로그인 테스트

1. 애플리케이션 실행: `pnpm run dev`
2. Clerk로 로그인
3. 브라우저 개발자 도구 → Network 탭 열기
4. Supabase 요청 확인:
   - `Authorization: Bearer <clerk-token>` 헤더가 포함되어 있는지 확인

### 2. 데이터 접근 테스트

1. 제품 추가/수정/삭제 시도
2. 다른 사용자로 로그인하여 데이터 접근 불가 확인
3. Supabase Dashboard → Logs에서 RLS 정책이 작동하는지 확인

### 3. RLS 정책 테스트

Supabase SQL Editor에서 직접 테스트:

```sql
-- 현재 사용자의 데이터만 조회되는지 확인
SELECT * FROM products;
-- 다른 사용자의 데이터는 보이지 않아야 함
```

---

## 문제 해결

### 문제: "401 Unauthorized" 에러

**원인**: Clerk session token이 Supabase 요청에 포함되지 않음

**해결 방법**:
1. `createClerkSupabaseClient()` 또는 `createServerSupabaseClient()` 사용 확인
2. Clerk Dashboard에서 Supabase 통합이 활성화되어 있는지 확인
3. Supabase Dashboard에서 Clerk provider가 올바르게 설정되어 있는지 확인

### 문제: RLS 정책이 작동하지 않음

**원인**: 
- RLS가 활성화되지 않음
- 정책이 올바르게 생성되지 않음
- Clerk token이 올바르게 전달되지 않음

**해결 방법**:
1. Supabase Dashboard에서 RLS 활성화 확인
2. SQL Editor에서 정책 생성 확인
3. 브라우저 개발자 도구에서 Authorization 헤더 확인

### 문제: "relation does not exist" 에러

**원인**: 테이블이 생성되지 않음

**해결 방법**:
1. `supabase/schema.sql` 파일 전체 실행
2. Supabase Dashboard → Table Editor에서 테이블 존재 확인

### 문제: 데이터가 보이지 않음

**원인**: RLS 정책이 너무 엄격하거나 잘못 설정됨

**해결 방법**:
1. RLS 정책 확인
2. `auth.jwt() ->> 'sub'` 값이 `user_id`와 일치하는지 확인
3. 임시로 RLS 비활성화하여 테스트

---

## 추가 리소스

- [Clerk Supabase 통합 공식 문서](https://clerk.com/docs/guides/development/integrations/databases/supabase)
- [Supabase Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Third-Party Auth Providers](https://supabase.com/docs/guides/auth/third-party/overview)

---

## ✅ 체크리스트

통합이 완료되면 다음 항목을 확인하세요:

- [ ] Clerk Dashboard에서 Supabase 통합 활성화
- [ ] Supabase Dashboard에서 Clerk를 third-party auth provider로 추가
- [ ] `supabase/schema.sql`의 RLS 정책 실행
- [ ] 애플리케이션에서 로그인 후 데이터 접근 테스트
- [ ] 다른 사용자로 로그인하여 데이터 격리 확인
- [ ] 브라우저 개발자 도구에서 Authorization 헤더 확인

---

통합이 완료되면 이제 BATHLANCE 서비스가 데이터베이스 레벨에서 보안이 강화되었습니다! 🎉

