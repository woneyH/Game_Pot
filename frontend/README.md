# Game_Pot Frontend 개발 서버 가이드

## 사전 준비

- Node.js 18+ (LTS 권장)
- npm 9+ (레포에 `package-lock.json` 사용)

## 설치

cd frontend
npm install

## 환경 변수

백엔드 기본 URL은 `src/config/constants.ts`에 설정되어 있습니다.

- 기본값: `https://gamepot.azurewebsites.net`
- 변경이 필요하면 `constants.ts`를 수정하거나 `.env`로 관리하세요.

## 개발 서버 실행

npm run dev- 브라우저에서 `http://localhost:5173` (Vite 기본 포트) 접속

## 린트/포맷

npm run lint

## 주요 경로

- 매칭 API: `src/api/match.ts`
- 인증 API: `src/api/auth.ts`
- 매칭 상태/로직: `src/hooks/use-matching.ts`
- 인증 상태: `src/hooks/use-auth.ts`
- 주요 페이지: `src/pages/HomePage.tsx`
- UI 컴포넌트: `src/components/`

## API 테스트 스크립트 (선택)

- `src/test-api-match.ts`, `src/test-status-console.js`
- 브라우저 콘솔이나 `npm run dev` 환경에서 import하여 사용 가능

## 디스코드 음성 채널 연동

- 매칭 화면에서 음성 채널 생성/입장 기능 제공 (`src/components/matching-screen.tsx`)
- 백엔드 `/api/match/party` 엔드포인트와 연동
