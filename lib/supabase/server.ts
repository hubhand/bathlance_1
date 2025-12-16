/**
 * Supabase 서버 사이드 클라이언트
 * 
 * Next.js App Router의 Server Components, Server Actions, API Routes에서 사용합니다.
 * Clerk session token이 자동으로 포함됩니다.
 * 
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 * 
 * @example
 * ```ts
 * import { createClient } from '@/lib/supabase/server'
 * 
 * export default async function ServerComponent() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('products').select()
 *   return <div>{JSON.stringify(data)}</div>
 * }
 * ```
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

/**
 * 서버 사이드에서 사용할 Supabase 클라이언트 생성
 * 
 * Clerk session token이 자동으로 포함되어 RLS 정책과 함께 작동합니다.
 * 
 * @returns Supabase 클라이언트 인스턴스
 */
export async function createClient(): Promise<SupabaseClient> {
  // Clerk session token 가져오기
  const { getToken } = await auth();
  const token = await getToken();

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        // Authorization 헤더에 Clerk token 추가
        const headers = new Headers(options.headers);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        // Supabase 요청에 전달
        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
    // Clerk를 사용하므로 Supabase 기본 인증은 비활성화
    // 필요시 cookies를 사용한 세션 관리 추가 가능
  });
}

