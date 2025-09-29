import { Users, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "./navigation"
import type { MatchType } from "@/hooks/use-matching"

interface MatchingScreenProps {
  selectedGame: string
  matchType: MatchType
  playerCount: string
  matchProgress: number
  onCancel: () => void
}

export function MatchingScreen({ selectedGame, matchType, playerCount, matchProgress, onCancel }: MatchingScreenProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">매칭 중...</h2>
              <p className="text-muted-foreground">
                {selectedGame}에서 {matchType === "create" ? `${playerCount}명의 플레이어` : "팀"}을 찾고 있습니다
              </p>
            </div>

            <div className="mb-6">
              <div className="w-full bg-secondary rounded-full h-2 mb-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(matchProgress, 100)}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{Math.round(matchProgress)}% 완료</p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-6">
              <Clock className="w-4 h-4" />
              <span>평균 대기시간: 2-5분</span>
            </div>

            <Button variant="outline" onClick={onCancel} className="w-full bg-transparent">
              매칭 취소
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
