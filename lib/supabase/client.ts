/**
 * Supabase 클라이언트 사이드 클라이언트
 * 
 * Next.js App Router의 Client Components에서 사용합니다.
 * Clerk session token이 자동으로 포함됩니다.
 * 
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 * 
 * @example
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 * import { useSession } from '@clerk/nextjs'
 * 
 * export default function ClientComponent() {
 *   const { session } = useSession()
 *   const supabase = createClient(session)
 *   
 *   useEffect(() => {
 *     const fetchData = async () => {
 *       const { data } = await supabase.from('products').select()
 *       console.log(data)
 *     }
 *     fetchData()
 *   }, [supabase])
 * }
 * ```
 */

'use client';

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// Clerk session 타입 정의 (getToken 메서드를 가진 객체)
type ClerkSession = { getToken: () => Promise<string | null> } | null | undefined;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

/**
 * 클라이언트 사이드에서 사용할 Supabase 클라이언트 생성
 * 
 * Clerk session token이 자동으로 포함되어 RLS 정책과 함께 작동합니다.
 * 
 * @param session - Clerk session 객체 (useSession() hook에서 가져온 값)
 * @returns Supabase 클라이언트 인스턴스
 */
export function createClient(session: ClerkSession): SupabaseClient {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        // Clerk session token 가져오기
        const token = session ? await session.getToken() : null;

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
    // 브라우저의 localStorage를 사용하여 세션 관리
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

