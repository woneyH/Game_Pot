import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function Navigation() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- 설정 ---
  const BACKEND_URL = "https://gamepot.azurewebsites.net";

  // --- API 엔드포인트 ---
  const OAUTH_LOGIN_URL = `${BACKEND_URL}/oauth2/authorization/discord`;
  const API_ME_URL = `${BACKEND_URL}/api/me`;
  const API_LOGOUT_URL = `${BACKEND_URL}/api/auth/logout`;


  // URL 파라미터 읽기 + localStorage 체크
  useEffect(() => {
    // localStorage에서 로그인 정보 가져오기
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setLoading(false);
      return;
    }

    // URL 파라미터에서 로그인 정보 가져오기
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const discordId = params.get("discordId");
    const username = params.get("username");
    const displayName = params.get("displayName");
    const avatar = params.get("avatar");

    if (id && username) {
      const userInfo = { id, discordId, username, displayName, avatar };
      setUser(userInfo);
      localStorage.setItem("user", JSON.stringify(userInfo));
    }

    setLoading(false);

    // URL 파라미터 제거
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const getAvatarUrl = (user: any) => {
    if (!user?.discordId) return "https://cdn.discordapp.com/embed/avatars/0.png";

    if (user.avatar) {
      const isGif = user.avatar.startsWith("a_");
      const ext = isGif ? "gif" : "png";
      return `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.${ext}?size=128`;
    }

    const discriminator = user.id || "0";
    const defaultAvatarIndex = Math.abs(Number(discriminator) % 5);
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
  };

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-foreground">게임팟</h1>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">홈</a>
            <a href="/matching" className="text-muted-foreground hover:text-foreground transition-colors">매칭</a>
            <a href="/community" className="text-muted-foreground hover:text-foreground transition-colors">커뮤니티</a>
          </div>

          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="text-sm text-muted-foreground">로딩중...</div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <img
                  src={getAvatarUrl(user)}
                  onError={(e) => { e.currentTarget.src = "https://cdn.discordapp.com/embed/avatars/0.png"; }}
                  className="w-9 h-9 rounded-full border border-border"
                  alt={user.displayName || user.username}
                />
                <span className="hidden sm:block font-medium">
                  {user.displayName || user.username}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>로그아웃</Button>
              </div>
            ) : (
              <a href={OAUTH_LOGIN_URL}>
                <Button size="sm" className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
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
  );
}
