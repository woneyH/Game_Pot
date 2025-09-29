import { useMatching } from "@/hooks/use-matching"
import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { MatchingForm } from "@/components/matching-form"
import { FeaturesSection } from "@/components/features-section"
import { Footer } from "@/components/footer"
import { MatchingScreen } from "@/components/matching-screen"

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
    matchProgress,
    handleStartMatching,
    resetMatching,
    canStartMatching,
  } = useMatching()

  if (isMatching) {
    return (
      <MatchingScreen
        selectedGame={selectedGame}
        matchType={matchType}
        playerCount={playerCount}
        matchProgress={matchProgress}
        onCancel={resetMatching}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <MatchingForm
        selectedGame={selectedGame}
        gameSearch={gameSearch}
        matchType={matchType}
        playerCount={playerCount}
        canStartMatching={canStartMatching}
        onGameSelect={setSelectedGame}
        onSearchChange={setGameSearch}
        onMatchTypeChange={setMatchType}
        onPlayerCountChange={setPlayerCount}
        onStartMatching={handleStartMatching}
      />
      <FeaturesSection />
      <Footer />
    </div>
  )
}
