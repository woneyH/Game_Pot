import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { API_ENDPOINTS } from "@/config/constants";
import { Gamepad2, LogOut, User, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Navigation() {
  const { user, loading, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // 아바타 URL 처리
  const getAvatarUrl = (avatarUrl?: string) => {
    return avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png";
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
  };

  return (
    <nav className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 왼쪽: 로고 영역 */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:bg-primary/30 transition-colors"></div>
                <div className="relative bg-gradient-to-br from-primary to-primary/60 p-2 rounded-lg group-hover:scale-105 transition-transform">
                  <Gamepad2 className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-all">
                  게임팟
                </h1>
                <span className="text-[10px] text-muted-foreground -mt-1 hidden sm:block">GamePot</span>
              </div>
            </a>
          </div>

          {/* 오른쪽: 회원정보 영역 */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">로딩중...</span>
              </div>
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                {/* 프로필 버튼 */}
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm group-hover:bg-primary/30 transition-colors"></div>
                    <img
                      src={getAvatarUrl(user.avatarUrl)}
                      alt="profile"
                      className="relative w-9 h-9 rounded-full border-2 border-primary/20 object-cover ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all"
                      onError={(e) => {
                        e.currentTarget.src = "https://cdn.discordapp.com/embed/avatars/0.png";
                      }}
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card ring-1 ring-green-500/50"></div>
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {user.displayName}
                    </span>
                    {user.email && (
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</span>
                    )}
                  </div>
                  <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors sm:hidden" />
                </button>

                {/* 드롭다운 메뉴 */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                    {/* 프로필 헤더 */}
                    <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={getAvatarUrl(user.avatarUrl)}
                            alt="profile"
                            className="w-12 h-12 rounded-full border-2 border-primary/20 object-cover ring-2 ring-primary/10"
                            onError={(e) => {
                              e.currentTarget.src = "https://cdn.discordapp.com/embed/avatars/0.png";
                            }}
                          />
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-card"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{user.displayName}</p>
                          {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-muted-foreground">온라인</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 메뉴 아이템 */}
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        로그아웃
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <a href={API_ENDPOINTS.OAUTH_LOGIN}>
                <Button
                  size="sm"
                  className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752c4] text-white shadow-md hover:shadow-lg transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.105a13.107 13.107 0 0 1-1.872-.878a.075.075 0 0 1-.008-.125a10.166 10.166 0 0 0 .765-.392a.077.077 0 0 1 .106-.007a14.248 14.248 0 0 0 12.082 0a.077.077 0 0 1 .106.007a10.166 10.166 0 0 0 .765.392a.075.075 0 0 1-.008.125a13.107 13.107 0 0 1-1.872.878a.075.075 0 0 0-.041.105a14.09 14.09 0 0 0 1.226 1.994a.078.078 0 0 0 .084.028a19.9 19.9 0 0 0 5.993-3.03a.082.082 0 0 0 .031-.057c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.032-.027zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
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
