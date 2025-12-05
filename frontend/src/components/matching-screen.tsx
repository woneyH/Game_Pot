import { Users, Clock, User, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "./navigation";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { createParty } from "@/api/match";
import type { WaitingUser } from "@/types";

interface MatchingScreenProps {
  gameName: string;
  gameId: number;
  waitingUsers: WaitingUser[];
  onCancel: () => void;
}

const INITIAL_DISPLAY_COUNT = 3; // 처음에 보여줄 플레이어 수

export function MatchingScreen({ gameName, gameId, waitingUsers, onCancel }: MatchingScreenProps) {
  const waitingCount = waitingUsers.length;
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isCreatingParty, setIsCreatingParty] = useState(false);
  const [partyError, setPartyError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCreateParty = async () => {
    if (!confirm("현재 대기 중인 모든 유저를 위한 디스코드 음성 채널을 생성할까요?")) {
      return;
    }

    setIsCreatingParty(true);
    setPartyError(null);

    try {
      const result = await createParty(gameId);
      setInviteLink(result.inviteLink);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "파티 생성 실패";
      setPartyError(errorMessage);
      alert(`파티 생성 실패: ${errorMessage}`);
    } finally {
      setIsCreatingParty(false);
    }
  };

  const handleDiscordJoin = () => {
    if (inviteLink) {
      window.open(inviteLink, "_blank");
    }
  };

  const displayedUsers = isExpanded ? waitingUsers : waitingUsers.slice(0, INITIAL_DISPLAY_COUNT);
  const remainingCount = waitingCount - INITIAL_DISPLAY_COUNT;
  const hasMoreUsers = remainingCount > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
        <div className="w-full max-w-2xl space-y-6">
          {/* 메인 카드 */}
          <Card className="shadow-lg border-0 bg-card">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-2">{gameName}</h2>
                <Badge variant="secondary" className="text-sm">
                  매칭 중...
                </Badge>
              </div>

              {/* 대기 인원 통계 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{waitingCount}</div>
                  <div className="text-sm text-muted-foreground mt-1">대기 중인 플레이어</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-2xl font-bold">5초</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">갱신 주기</div>
                </div>
              </div>

              {/* 대기 중인 사용자 목록 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5" />
                    대기 중인 플레이어
                  </h3>
                  {waitingCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      총 {waitingCount}명
                    </Badge>
                  )}
                </div>

                {waitingCount === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>아직 대기 중인 플레이어가 없습니다</p>
                    <p className="text-sm mt-1">곧 다른 플레이어들이 합류할 예정입니다!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* 플레이어 목록 */}
                    <div className="space-y-2">
                      {displayedUsers.map((user, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all duration-200 animate-in fade-in slide-in-from-left-4"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">{user.displayName}</div>
                            <div className="text-xs text-muted-foreground">대기 중</div>
                          </div>
                          <Badge variant="outline" className="flex-shrink-0">
                            #{index + 1}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {/* 더 보기/접기 버튼 */}
                    {hasMoreUsers && (
                      <div className="pt-2">
                        <Button
                          variant="ghost"
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="w-full text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-2" />
                              접기
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-2" />
                              {remainingCount}명 더 보기
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* 펼쳐진 상태에서 스크롤 가능하도록 */}
                    {isExpanded && waitingCount > 6 && (
                      <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
                        스크롤하여 모든 플레이어를 확인하세요
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 파티 생성 안내 및 상태 */}
              {waitingCount > 0 && !inviteLink && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm flex-1">
                      <p className="font-medium text-foreground mb-1">음성 채널 생성</p>
                      <p className="text-muted-foreground mb-3">
                        대기 중인 플레이어들과 함께 게임할 준비가 되셨나요? 디스코드 음성 채널을 생성하여 함께
                        소통하세요.
                      </p>
                      <Button
                        onClick={handleCreateParty}
                        disabled={isCreatingParty}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        size="sm"
                      >
                        {isCreatingParty ? "채널 생성 중..." : "🔊 디스코드 음성 채널 생성하기"}
                      </Button>
                      {partyError && <p className="text-destructive text-xs mt-2">{partyError}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* 파티 생성 완료 안내 */}
              {inviteLink && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm flex-1">
                      <p className="font-medium text-green-900 dark:text-green-100 mb-1">✅ 채널 생성 완료!</p>
                      <p className="text-green-700 dark:text-green-300 mb-2">
                        디스코드 음성 채널이 생성되었습니다. 아래 버튼을 클릭하여 입장하세요.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 안내 메시지 */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">매칭 안내</p>
                    <p className="text-muted-foreground">
                      평균 대기시간은 2-5분입니다. 대기 중인 플레이어 목록은 5초마다 자동으로 갱신됩니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 버튼 영역 - 반으로 나눔 */}
              <div className="grid grid-cols-2 gap-3">
                {/* 왼쪽: 디스코드 채널 입장 버튼 */}
                {inviteLink ? (
                  <Button
                    onClick={handleDiscordJoin}
                    className="bg-[#5865F2] hover:bg-[#4752c4] text-white transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    디스코드 채널 입장
                  </Button>
                ) : (
                  <Button
                    onClick={handleCreateParty}
                    disabled={isCreatingParty || waitingCount === 0}
                    variant="outline"
                    className="bg-transparent"
                  >
                    {isCreatingParty ? "생성 중..." : "채널 생성"}
                  </Button>
                )}

                {/* 오른쪽: 매칭 취소 버튼 */}
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="bg-transparent hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
                >
                  매칭 취소
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
