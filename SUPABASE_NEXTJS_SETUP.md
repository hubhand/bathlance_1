# Supabase Next.js 통합 가이드

이 문서는 [Supabase 공식 Next.js 문서](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)의 모범 사례를 따라 BATHLANCE 프로젝트에 Supabase를 통합하는 방법을 설명합니다.

## 📋 목차

1. [프로젝트 구조](#프로젝트-구조)
2. [클라이언트 사이드 사용법](#클라이언트-사이드-사용법)
3. [서버 사이드 사용법](#서버-사이드-사용법)
4. [Clerk 통합](#clerk-통합)
5. [환경 변수 설정](#환경-변수-설정)

---

## 프로젝트 구조

Supabase 공식 문서의 모범 사례에 따라 클라이언트와 서버를 분리했습니다:

```
lib/
  supabase/
    client.ts    # 클라이언트 사이드 클라이언트
    server.ts    # 서버 사이드 클라이언트
  supabase.ts    # 레거시 호환용 (deprecated)
```

### 파일 설명

- **`lib/supabase/client.ts`**: Client Components에서 사용
- **`lib/supabase/server.ts`**: Server Components, Server Actions, API Routes에서 사용
- **`lib/supabase.ts`**: 기존 코드 호환성을 위한 레거시 파일 (deprecated)

---

## 클라이언트 사이드 사용법

Client Components에서 Supabase를 사용할 때:

```tsx
'use client'

import { useSession } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function ProductsList() {
  const { session } = useSession()
  const [products, setProducts] = useState([])
  
  useEffect(() => {
    if (!session) return
    
    const supabase = createClient(session)
    
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select()
        .eq('user_id', session.user.id)
      
      if (error) {
        console.error('Error:', error)
      } else {
        setProducts(data)
      }
    }
    
    fetchProducts()
  }, [session])
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

### Hooks에서 사용

현재 프로젝트의 `useMemos`와 `useProducts` 훅은 이미 이 패턴을 사용합니다:

```typescript
import { useSession } from '@clerk/nextjs'
import { createClient } from '../lib/supabase/client'

export const useProducts = () => {
  const { session } = useSession()
  const supabase = useMemo(() => {
    return createClient(session)
  }, [session])
  
  // ... 나머지 코드
}
```

---

## 서버 사이드 사용법

Server Components에서 Supabase를 사용할 때:

```tsx
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'

async function ProductsData() {
  const supabase = await createClient()
  const { data: products, error } = await supabase
    .from('products')
    .select()
  
  if (error) {
    throw error
  }
  
  return (
    <div>
      {products?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsData />
    </Suspense>
  )
}
```

### Server Actions에서 사용

```tsx
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addProduct(name: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('products')
    .insert({ name, user_id: '...' })
  
  if (error) {
    throw new Error('Failed to add product')
  }
  
  revalidatePath('/products')
}
```

### API Routes에서 사용

```tsx
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
```

---

## Clerk 통합

이 프로젝트는 Clerk를 인증 제공자로 사용하므로, Supabase 클라이언트는 자동으로 Clerk session token을 포함합니다.

### 작동 원리

1. **클라이언트 사이드**: `useSession()` hook에서 session을 가져와 `createClient(session)`에 전달
2. **서버 사이드**: `auth()` 함수에서 자동으로 Clerk token을 가져옴
3. **자동 포함**: 모든 Supabase 요청에 `Authorization: Bearer <clerk-token>` 헤더가 자동으로 추가됨

### RLS 정책과의 연동

Clerk token이 포함되면 Supabase의 RLS 정책이 자동으로 작동합니다:

```sql
-- RLS 정책 예시
CREATE POLICY "사용자는 자신의 제품만 조회 가능"
  ON products FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id);
```

`auth.jwt() ->> 'sub'`는 Clerk session token의 `sub` 클레임을 가져옵니다.

---

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정하세요:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Supabase 키 가져오기

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **Settings** → **API** 클릭
4. **Project URL**과 **anon public** 키 복사

---

## 참고 자료

- [Supabase Next.js 공식 문서](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Clerk Supabase 통합 가이드](./CLERK_SUPABASE_INTEGRATION.md)
- [Supabase 설정 가이드](./SUPABASE_SETUP.md)

---

## ✅ 체크리스트

- [ ] `lib/supabase/client.ts` 파일 확인
- [ ] `lib/supabase/server.ts` 파일 확인
- [ ] 환경 변수 설정 완료
- [ ] 클라이언트 사이드에서 `createClient(session)` 사용
- [ ] 서버 사이드에서 `await createClient()` 사용
- [ ] Clerk 통합 확인

---

이제 Supabase 공식 문서의 모범 사례를 따르는 구조로 통합이 완료되었습니다! 🎉

