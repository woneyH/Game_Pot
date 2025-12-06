import { Clock, Users, Play } from "lucide-react";
import { useMatching } from "@/hooks/use-matching";
import { Navigation } from "@/components/navigation";
import { MatchingForm } from "@/components/matching-form";
import { MatchingScreen } from "@/components/matching-screen";
import { Card, CardContent } from "@/components/ui/card";

export default function GamePotPage() {
  const {
    selectedGame,
    setSelectedGame,
    gameSearch,
    setGameSearch,
    matchType,
    setMatchType,
    playerCount,
    setPlayerCount,
    isMatching,
    matchedGameName,
    matchedGameId,
    waitingUsers,
    handleStartMatching,
    handleCancelMatching,
    canStartMatching,
  } = useMatching();

  if (isMatching && matchedGameId) {
    return (
      <MatchingScreen
        gameName={matchedGameName || selectedGame}
        gameId={matchedGameId}
        waitingUsers={waitingUsers}
        onCancel={handleCancelMatching}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            게임 친구를 찾는 가장 쉬운 방법
          </h1>
          <p className="text-xl text-muted-foreground mb-12 text-pretty max-w-2xl mx-auto">
            혼자서는 재미없는 게임, 이제 게임팟에서 함께할 친구들을 찾아보세요. 빠르고 안전한 매칭으로 새로운 게임
            경험을 시작하세요.
          </p>
        </div>
      </section>

      <MatchingForm
        selectedGame={selectedGame}
        gameSearch={gameSearch}
        matchType={matchType}
        playerCount={playerCount}
        canStartMatching={!!canStartMatching}
        onGameSelect={setSelectedGame}
        onSearchChange={setGameSearch}
        onMatchTypeChange={setMatchType}
        onPlayerCountChange={setPlayerCount}
        onStartMatching={handleStartMatching}
      />

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">왜 게임팟을 선택해야 할까요?</h2>
            <p className="text-muted-foreground text-lg">안전하고 빠른 매칭으로 최고의 게임 경험을 제공합니다</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">빠른 매칭</h3>
                <p className="text-muted-foreground text-sm">평균 3분 이내에 적합한 팀원을 찾아드립니다</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">실력 매칭</h3>
                <p className="text-muted-foreground text-sm">비슷한 실력의 플레이어들과 매칭됩니다</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Play className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">다양한 게임</h3>
                <p className="text-muted-foreground text-sm">인기 게임부터 인디 게임까지 모든 장르 지원</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-foreground mb-4">게임팟</h3>
              <p className="text-muted-foreground text-sm">게임 친구를 찾는 가장 쉬운 방법</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">서비스</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    매칭
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    커뮤니티
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    랭킹
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">지원</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    도움말
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    문의하기
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    신고
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">회사</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    소개
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    채용
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    개인정보처리방침
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2025 게임팟. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
