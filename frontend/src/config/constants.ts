// 백엔드 API 기본 URL
export const BACKEND_URL = "https://gamepot.azurewebsites.net";

// API 엔드포인트
export const API_ENDPOINTS = {
  // 인증
  OAUTH_LOGIN: `${BACKEND_URL}/oauth2/authorization/discord`,
  ME: `${BACKEND_URL}/api/me`,
  LOGOUT: `${BACKEND_URL}/api/auth/logout`,

  // 매칭
  MATCH_START: `${BACKEND_URL}/api/match/start`,
  MATCH_STATUS: (gameId: number) => `${BACKEND_URL}/api/match/status/${gameId}`,
  MATCH_STOP: `${BACKEND_URL}/api/match/stop`,
  MATCH_PARTY: `${BACKEND_URL}/api/match/party`,
} as const;
