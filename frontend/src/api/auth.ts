import { API_ENDPOINTS } from "@/config/constants";
import type { User } from "@/types";

/**
 * 현재 로그인한 사용자 정보 조회
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const res = await fetch(API_ENDPOINTS.ME, { credentials: "include" });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (e) {
    console.warn("로그인 필요 또는 서버 연결 불가");
    return null;
  }
};

/**
 * 로그아웃
 */
export const logout = async (): Promise<void> => {
  try {
    await fetch(API_ENDPOINTS.LOGOUT, {
      method: "POST",
      credentials: "include",
    });
  } catch (e) {
    console.error("로그아웃 실패", e);
    throw e;
  }
};
