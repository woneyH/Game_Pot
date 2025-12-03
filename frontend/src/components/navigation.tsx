import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

// 유저 데이터 타입 정의
interface User {
  id: number;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  discordId?: string;
}

export function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 설정 ---
  // 로컬 개발 중에는 백엔드 주소(Azure)를 적어줍니다.
  const BACKEND_URL = "https://gamepot.azurewebsites.net";

  // --- API 엔드포인트 ---
  const OAUTH_LOGIN_URL = `${BACKEND_URL}/oauth2/authorization/discord`;
  const API_ME_URL = `${BACKEND_URL}/api/me`;
  const API_LOGOUT_URL = `${BACKEND_URL}/api/auth/logout`;

  // --- [핵심] 초기화 로직 (URL 확인 -> API 확인) ---
  useEffect(() => {
    const initLogin = async () => {
      // 1. URL 파라미터 확인 (로그인 직후 리다이렉트 된 상황)
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const username = params.get("username");
      const displayName = params.get("displayName");
      const email = params.get("email");
      const discordId = params.get("discordId");
      const avatarUrl = params.get("avatarUrl");

      if (id && username) {
        // 2. 데이터가 주소창에 있으면 -> 즉시 로그인 처리
        console.log("URL에서 로그인 정보 발견!");
        
        setUser({
          id: Number(id),
          username,
          displayName: displayName || "",
          email: email || "",
          discordId: discordId || undefined,
          avatarUrl: avatarUrl || undefined,
        });

        // 3. 주소창 청소 (지저분한 ?id=... 제거)
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // 4. (선택) 더 확실한 정보(프로필 사진 등)를 위해 API로 최신 정보 가져오기
        await fetchUserApi();
      } else {
        // 5. 주소창에 없으면 -> 새로고침 했거나 나중에 다시 온 상황 -> 세션 확인
        await fetchUserApi();
      }
      setLoading(false);
    };

    initLogin();
  }, []);

  // --- 내 정보 가져오기 API ---
  const fetchUserApi = async () => {
    try {
      const res = await fetch(API_ME_URL, { credentials: "include" });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.warn("로그인 필요 또는 서버 연결 불가");
      setUser(null);
    }
  };

  // --- 로그아웃 ---
  const handleLogout = async () => {
    try {
      await fetch(API_LOGOUT_URL, { method: "POST", credentials: "include" });
      setUser(null);
      // 메인으로 이동
      window.location.href = "/";
    } catch (e) {
      console.error("로그아웃 실패", e);
    }
  };

  // --- 아바타 URL 처리 헬퍼 ---
  const getAvatar = (u: User) => {
    // 1. 백엔드가 준 avatarUrl이 있으면 사용
    if (u.avatarUrl) return u.avatarUrl;
    // 2. 없으면 디스코드 기본 이미지 사용
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  };

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-foreground">게임팟</h1>
          </div>
          
          {/* 메뉴 영역 */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              홈
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              매칭
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              커뮤니티
            </a>
          </div>

          {/* 우측 로그인/프로필 영역 */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="text-sm text-muted-foreground">로딩중...</div>
            ) : user ? (
              // [로그인 상태] 프로필 + 로그아웃 버튼 표시
              <div className="flex items-center gap-3">
                <img
                  src={getAvatar(user)}
                  alt="profile"
                  className="w-8 h-8 rounded-full border border-border object-cover"
                  onError={(e) => (e.currentTarget.src = "https://cdn.discordapp.com/embed/avatars/0.png")}
                />
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-medium text-foreground">
                    {user.displayName}
                  </span>
                  {user.email && (
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  로그아웃
                </Button>
              </div>
            ) : (
              // [비로그인 상태] 로그인 버튼 표시
              <a href={OAUTH_LOGIN_URL}>
                <Button size="sm" className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.105a13.107 13.107 0 0 1-1.872-.878a.075.075 0 0 1-.008-.125a10.166 10.166 0 0 0 .765-.392a.077.077 0 0 1 .106-.007a14.248 14.248 0 0 0 12.082 0a.077.077 0 0 1 .106.007a10.166 10.166 0 0 0 .765.392a.075.075 0 0 1-.008.125a13.107 13.107 0 0 1-1.872.878a.075.075 0 0 0-.041.105a14.09 14.09 0 0 0 1.226 1.994a.078.078 0 0 0 .084.028a19.9 19.9 0 0 0 5.993-3.03a.082.082 0 0 0 .031-.057c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.032-.027zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Discord로 로그인
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}