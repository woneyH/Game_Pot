import { Input } from "@/components/ui/input"
import type { MatchType } from "@/hooks/use-matching"

interface PlayerCountInputProps {
  matchType: MatchType
  playerCount: string
  onPlayerCountChange: (count: string) => void
}

export function PlayerCountInput({ matchType, playerCount, onPlayerCountChange }: PlayerCountInputProps) {
  return (
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
  )
}
