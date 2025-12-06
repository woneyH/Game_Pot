import { API_ENDPOINTS } from "@/config/constants";
import type { GameMatchStartResponse, WaitingUser } from "@/types";

export const startMatching = async (gameName: string): Promise<GameMatchStartResponse> => {
  const res = await fetch(API_ENDPOINTS.MATCH_START, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameName }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || `서버 오류: ${res.status}`);
  }

  return res.json();
};

export const getMatchStatus = async (gameId: number): Promise<WaitingUser[]> => {
  const res = await fetch(API_ENDPOINTS.MATCH_STATUS(gameId), {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("매칭 상태 조회 실패");
  }

  return res.json();
};

export const stopMatching = async (): Promise<void> => {
  const res = await fetch(API_ENDPOINTS.MATCH_STOP, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("매칭 중지 실패");
  }
};

export const createParty = async (gameId: number): Promise<{ inviteLink: string }> => {
  const res = await fetch(API_ENDPOINTS.MATCH_PARTY, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "파티 생성 실패");
  }

  return res.json();
};
