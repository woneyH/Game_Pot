import { useState } from "react"

export type MatchType = "join" | "create" | ""

export interface MatchingState {
  selectedGame: string
  gameSearch: string
  matchType: MatchType
  playerCount: string
  isMatching: boolean
  matchProgress: number
}

export function useMatching() {
  const [selectedGame, setSelectedGame] = useState("")
  const [gameSearch, setGameSearch] = useState("")
  const [matchType, setMatchType] = useState<MatchType>("")
  const [playerCount, setPlayerCount] = useState("")
  const [isMatching, setIsMatching] = useState(false)
  const [matchProgress, setMatchProgress] = useState(0)

  const handleStartMatching = () => {
    if (!selectedGame || !matchType || (matchType === "create" && !playerCount)) return

    setIsMatching(true)
    setMatchProgress(0)

    // Simulate matching progress
    const interval = setInterval(() => {
      setMatchProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 500)
  }

  const resetMatching = () => {
    setIsMatching(false)
    setMatchProgress(0)
  }

  const canStartMatching = selectedGame && matchType && (matchType === "join" || playerCount)

  return {
    selectedGame,
    setSelectedGame,
    gameSearch,
    setGameSearch,
    matchType,
    setMatchType,
    playerCount,
    setPlayerCount,
    isMatching,
    matchProgress,
    handleStartMatching,
    resetMatching,
    canStartMatching,
  }
}
