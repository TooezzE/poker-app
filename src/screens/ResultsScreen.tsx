import { useState } from 'react'
import { Button } from '../components/Button'
import { BottomBar, Screen } from '../components/Screen'
import { formatNumber, formatSigned } from '../format'
import { calcBank, getPlayerNet, getPlayerPaid, getStandings } from '../game/game'
import type { Game, Player } from '../game/types'
import { useGameStore } from '../store/useGameStore'
import { OverviewScreen } from './OverviewScreen'

/** Экран 3: игра окончена — победитель, банк и итоги каждого. */
export function ResultsScreen({ game, winner }: { game: Game; winner: Player }) {
  const resetGame = useGameStore((s) => s.resetGame)
  // Какой экран показывать: итоги или обзор. Это состояние только интерфейса, не игры,
  // поэтому оно живёт в компоненте, а не в сторе.
  const [showOverview, setShowOverview] = useState(false)

  function toggleOverview(show: boolean) {
    setShowOverview(show)
    window.scrollTo(0, 0)
  }

  function handleNewGame() {
    if (window.confirm('Начать новую игру? Итоги и история этой игры удалятся.')) {
      resetGame()
    }
  }

  if (showOverview) return <OverviewScreen game={game} onBack={() => toggleOverview(false)} />

  return (
    <Screen>
      <header className="py-8 text-center">
        <div className="text-6xl">🏆</div>
        <p className="mt-3 text-emerald-300">Победитель</p>
        <h1 className="text-4xl font-bold">{winner.name}</h1>
        <p className="mt-6 text-emerald-300">забирает банк</p>
        <p className="text-5xl font-bold tabular-nums text-amber-300">
          {formatNumber(calcBank(game))}
        </p>
      </header>

      <ol className="divide-y divide-white/10 rounded-2xl bg-white/5">
        {getStandings(game).map(({ player, place }) => {
          const net = getPlayerNet(game, player)
          return (
            <li key={player.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 tabular-nums text-emerald-300">{place}</span>
              <span className="flex-1 truncate text-lg">{player.name}</span>
              <span className="text-right tabular-nums">
                <span
                  className={`block font-semibold ${net > 0 ? 'text-amber-300' : 'text-white/70'}`}
                >
                  {formatSigned(net)}
                </span>
                <span className="block text-xs text-white/50">
                  внёс {formatNumber(getPlayerPaid(game, player))}
                </span>
              </span>
            </li>
          )
        })}
      </ol>

      <Button className="mt-4 mb-6 w-full" onClick={() => toggleOverview(true)}>
        Обзор игры: статистика и история
      </Button>

      <BottomBar>
        <Button variant="primary" size="lg" className="w-full" onClick={handleNewGame}>
          Новая игра
        </Button>
      </BottomBar>
    </Screen>
  )
}
