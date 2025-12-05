import { Search, Gamepad2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { MatchType } from "@/hooks/use-matching";

const GAMES = [
  "League of Legends",
  "Valorant",
  "Overwatch 2",
  "Apex Legends",
  "Counter-Strike 2",
  "Dota 2",
  "Rocket League",
  "Among Us",
  "Fall Guys",
  "Minecraft",
];

interface MatchingFormProps {
  selectedGame: string;
  gameSearch: string;
  matchType: MatchType;
  playerCount: string;
  canStartMatching: boolean;
  onGameSelect: (game: string) => void;
  onSearchChange: (search: string) => void;
  onMatchTypeChange: (type: MatchType) => void;
  onPlayerCountChange: (count: string) => void;
  onStartMatching: () => void;
}

export function MatchingForm({
  selectedGame,
  gameSearch,
  // matchType, playerCount, onMatchTypeChange, onPlayerCountChange는 나중에 사용할 수 있으므로 주석 처리
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  matchType: _matchType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  playerCount: _playerCount,
  canStartMatching,
  onGameSelect,
  onSearchChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMatchTypeChange: _onMatchTypeChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPlayerCountChange: _onPlayerCountChange,
  onStartMatching,
}: MatchingFormProps) {
  const filteredGames = GAMES.filter((game) => game.toLowerCase().includes(gameSearch.toLowerCase()));

  const handleGameSelect = (game: string) => {
    onGameSelect(game);
    onSearchChange("");
  };

  return (
    <section className="pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-0 bg-card">
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* 헤더 */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Gamepad2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">게임 매칭 시작하기</h2>
                <p className="text-muted-foreground text-sm">함께 플레이할 게임을 선택하고 매칭을 시작하세요</p>
              </div>

              {/* 게임 선택 */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  게임 선택
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="게임을 검색하거나 입력하세요..."
                    value={gameSearch}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && gameSearch.trim()) {
                        onGameSelect(gameSearch.trim());
                        onSearchChange("");
                      }
                    }}
                    className="pl-10 h-12 text-base"
                  />
                </div>

                {/* 게임 검색 결과 */}
                {gameSearch && filteredGames.length > 0 && (
                  <div className="border border-border rounded-lg bg-card shadow-md max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                    {filteredGames.map((game) => (
                      <button
                        key={game}
                        onClick={() => handleGameSelect(game)}
                        className="w-full text-left px-4 py-3 hover:bg-accent transition-colors text-sm border-b border-border last:border-b-0 flex items-center gap-2"
                      >
                        <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                        <span>{game}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 선택된 게임 표시 */}
                {selectedGame && (
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="secondary" className="text-base px-4 py-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {selectedGame}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onGameSelect("")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      변경
                    </Button>
                  </div>
                )}
              </div>

              {/* 매칭 시작 버튼 */}
              <div className="pt-4">
                <Button
                  onClick={onStartMatching}
                  disabled={!canStartMatching || !selectedGame}
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  매칭 시작하기
                </Button>
                {!selectedGame && <p className="text-xs text-muted-foreground text-center mt-2">게임을 선택해주세요</p>}
              </div>

              {/* 매칭 방식 선택 (비활성화 - 나중에 사용할 수 있음) */}
              {/* 
              <div className="space-y-3 opacity-50 pointer-events-none">
                <label className="text-sm font-medium text-foreground">매칭 방식</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => onMatchTypeChange("join")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      matchType === "join" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">대기열 참가</div>
                        <div className="text-sm text-muted-foreground">기존 팀에 합류</div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => onMatchTypeChange("create")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      matchType === "create" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Play className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">대기열 생성</div>
                        <div className="text-sm text-muted-foreground">새로운 팀 만들기</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div
                className={`space-y-2 transition-all duration-300 ${
                  matchType === "create" ? "opacity-100 max-h-20" : "opacity-0 max-h-0 overflow-hidden"
                }`}
              >
                <label className="text-sm font-medium text-foreground">필요한 플레이어 수</label>
                <Input
                  type="number"
                  placeholder="필요한 인원수를 입력하세요 (예: 3, 8, 12)"
                  value={playerCount}
                  onChange={(e) => onPlayerCountChange(e.target.value)}
                  min="1"
                  max="20"
                  className="w-full"
                />
                {playerCount && (
                  <p className="text-xs text-muted-foreground">
                    총 {Number.parseInt(playerCount) + 1}명이서 게임을 진행합니다 (본인 포함)
                  </p>
                )}
              </div>
              */}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
