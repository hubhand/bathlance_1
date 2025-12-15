/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.GEMINI_API_KEY, // 클라이언트에서도 사용 가능하도록 (보안 주의)
  },
};

module.exports = nextConfig;

