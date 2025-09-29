import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GameSelector } from "./game-selector"
import { MatchTypeSelector } from "./match-type-selector"
import { PlayerCountInput } from "./player-count-input"

interface MatchingFormProps {
  selectedGame: string
  gameSearch: string
  matchType: string
  playerCount: string
  canStartMatching: boolean
  onGameSelect: (game: string) => void
  onSearchChange: (search: string) => void
  onMatchTypeChange: (type: any) => void
  onPlayerCountChange: (count: string) => void
  onStartMatching: () => void
}

export function MatchingForm({
  selectedGame,
  gameSearch,
  matchType,
  playerCount,
  canStartMatching,
  onGameSelect,
  onSearchChange,
  onMatchTypeChange,
  onPlayerCountChange,
  onStartMatching,
}: MatchingFormProps) {
  return (
    <section className="pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-0 bg-card">
          <CardContent className="p-8">
            <div className="space-y-6">
              <GameSelector
                selectedGame={selectedGame}
                gameSearch={gameSearch}
                onGameSelect={onGameSelect}
                onSearchChange={onSearchChange}
              />

              <MatchTypeSelector matchType={matchType} onMatchTypeChange={onMatchTypeChange} />

              <PlayerCountInput
                matchType={matchType}
                playerCount={playerCount}
                onPlayerCountChange={onPlayerCountChange}
              />

              <Button
                onClick={onStartMatching}
                disabled={!canStartMatching}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                매칭 시작하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
