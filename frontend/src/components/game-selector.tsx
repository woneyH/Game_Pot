import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const games = [
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
]

interface GameSelectorProps {
  selectedGame: string
  gameSearch: string
  onGameSelect: (game: string) => void
  onSearchChange: (search: string) => void
}

export function GameSelector({ selectedGame, gameSearch, onGameSelect, onSearchChange }: GameSelectorProps) {
  const filteredGames = games.filter((game) => game.toLowerCase().includes(gameSearch.toLowerCase()))

  const handleGameSelect = (game: string) => {
    onGameSelect(game)
    onSearchChange("")
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">게임 선택</label>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="게임을 검색하세요..."
          value={gameSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      {gameSearch && (
        <div className="border border-border rounded-md bg-card max-h-40 overflow-y-auto">
          {filteredGames.map((game) => (
            <button
              key={game}
              onClick={() => handleGameSelect(game)}
              className="w-full text-left px-3 py-2 hover:bg-accent transition-colors text-sm"
            >
              {game}
            </button>
          ))}
        </div>
      )}
      {selectedGame && (
        <Badge variant="secondary" className="mt-2">
          {selectedGame}
        </Badge>
      )}
    </div>
  )
}
