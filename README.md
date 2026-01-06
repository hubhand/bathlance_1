<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1u4K2W1eN0PbhZKyBU8izaXFlWdcRwK81

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set environment variables in `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `PUBLIC_DATA_API_KEY` (선택사항 - 공공데이터 API 인증키)
   - `PUBLIC_DATA_API_URL` (선택사항 - 화장품 원료성분정보 API 엔드포인트 URL)
   - `PUBLIC_DATA_REGULATION_API_URL` (선택사항 - 화장품 규제정보 API 엔드포인트 URL)

3. Run the app:
   ```bash
   pnpm run dev
   ```

## 배포 (Deployment)

Vercel에 배포하는 방법은 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) 파일을 참고하세요.

배포 체크리스트는 [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) 파일을 참고하세요.
