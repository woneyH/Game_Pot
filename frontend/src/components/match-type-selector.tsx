import { Users, Play } from "lucide-react"
import type { MatchType } from "@/hooks/use-matching"

interface MatchTypeSelectorProps {
  matchType: MatchType
  onMatchTypeChange: (type: MatchType) => void
}

export function MatchTypeSelector({ matchType, onMatchTypeChange }: MatchTypeSelectorProps) {
  return (
    <div className="space-y-3">
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
  )
}
