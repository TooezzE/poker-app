import { getWinner } from './game/game'
import { GameScreen } from './screens/GameScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { SetupScreen } from './screens/SetupScreen'
import { useGameStore } from './store/useGameStore'

/**
 * Выбирает, какой экран показать:
 * нет игры → настройка; остался один игрок → итоги; иначе → игра.
 */
export default function App() {
  const game = useGameStore((s) => s.game)

  if (!game) return <SetupScreen />

  const winner = getWinner(game)
  if (winner) return <ResultsScreen game={game} winner={winner} />

  return <GameScreen game={game} />
}
