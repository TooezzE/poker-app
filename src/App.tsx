import { getWinner } from './game/game'
import { useWakeLock } from './hooks/useWakeLock'
import { GameScreen } from './screens/GameScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { SetupScreen } from './screens/SetupScreen'
import { useGameStore } from './store/useGameStore'

/**
 * Выбирает, какой экран показать:
 * нет игры → настройка; игру завершили → итоги; иначе → игра.
 */
export default function App() {
  const game = useGameStore((s) => s.game)

  // Пока идёт игра, экран не гаснет.
  useWakeLock(game !== null && game.finishedAt === null)

  if (!game) return <SetupScreen />

  const winner = getWinner(game)
  if (winner) return <ResultsScreen game={game} winner={winner} />

  return <GameScreen game={game} />
}
