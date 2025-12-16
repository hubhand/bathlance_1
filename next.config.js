/** @type {import('next').NextConfig} */
const nextConfig = {
  // API 키는 서버 사이드에서만 사용하므로 env에 노출하지 않음
  // Gemini API는 app/api/gemini/analyze/route.ts를 통해 서버 사이드에서만 호출됨
  // Next.js 15에서는 Turbopack이 기본적으로 비활성화됨

  // 캐시 헤더 설정으로 브라우저 캐시 문제 해결
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
