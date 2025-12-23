/**
 * Supabase 클라이언트 유틸리티 (레거시 호환용)
 * 
 * ⚠️ 새로운 코드에서는 다음을 사용하세요:
 * - 서버 사이드: `@/lib/supabase/server`의 `createClient()`
 * - 클라이언트 사이드: `@/lib/supabase/client`의 `createClient()`
 * 
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// Clerk session 타입 정의 (getToken 메서드를 가진 객체)
type ClerkSession = { getToken: () => Promise<string | null> } | null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL과 Anon Key가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
}

/**
 * 기본 Supabase 클라이언트 (레거시 호환용)
 * 
 * ⚠️ 주의: 이 클라이언트는 Clerk session token을 포함하지 않습니다.
 * 
 * @deprecated 새로운 코드에서는 `@/lib/supabase/server` 또는 `@/lib/supabase/client`를 사용하세요.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 클라이언트 사이드에서 사용할 Clerk 통합 Supabase 클라이언트 생성
 * 
 * ⚠️ 새로운 코드에서는 `@/lib/supabase/client`의 `createClient()`를 사용하세요.
 * 
 * @deprecated `@/lib/supabase/client`의 `createClient()`를 사용하세요.
 */
export function createClerkSupabaseClient(session: ClerkSession): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const token = session ? await session.getToken() : null;
        const headers = new Headers(options.headers);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
  });
}

/**
 * 서버 사이드에서 사용할 Clerk 통합 Supabase 클라이언트 생성
 * 
 * ⚠️ 새로운 코드에서는 `@/lib/supabase/server`의 `createClient()`를 사용하세요.
 * 
 * @deprecated `@/lib/supabase/server`의 `createClient()`를 사용하세요.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const { getToken } = await auth();
  const token = await getToken();

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const headers = new Headers(options.headers);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
  });
}

