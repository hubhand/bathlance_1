/** @type {import('next').NextConfig} */
const nextConfig = {
  // API 키는 서버 사이드에서만 사용하므로 env에 노출하지 않음
  // Gemini API는 app/api/gemini/analyze/route.ts를 통해 서버 사이드에서만 호출됨
};

module.exports = nextConfig;

