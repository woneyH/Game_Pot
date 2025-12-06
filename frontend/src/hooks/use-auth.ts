import { useState, useEffect } from "react";
import { getCurrentUser, logout as logoutApi } from "@/api/auth";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 초기화: URL 파라미터 확인 후 API로 사용자 정보 가져오기
  useEffect(() => {
    const initAuth = async () => {
      // 1. URL 파라미터 확인 (로그인 직후 리다이렉트된 경우)
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const username = params.get("username");
      const displayName = params.get("displayName");
      const email = params.get("email");
      const discordId = params.get("discordId");
      const avatarUrl = params.get("avatarUrl");

      if (id && username) {
        // URL에서 로그인 정보 발견 시 즉시 설정
        setUser({
          id: Number(id),
          username,
          displayName: displayName || "",
          email: email || "",
          discordId: discordId || undefined,
          avatarUrl: avatarUrl || undefined,
        });

        // 주소창 정리
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // 2. API로 최신 사용자 정보 가져오기
      const userData = await getCurrentUser();
      if (userData) {
        setUser(userData);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // 로그아웃
  const logout = async () => {
    try {
      await logoutApi();
      setUser(null);
      window.location.href = "/";
    } catch (e) {
      console.error("로그아웃 실패", e);
    }
  };

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
  };
}
