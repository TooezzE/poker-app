import { Button } from '../components/Button'
import { BottomBar, Screen } from '../components/Screen'
import { formatNumber, formatSigned } from '../format'
import { calcBank, getPlayerNet, getPlayerPaid, getStandings } from '../game/game'
import type { Game, Player } from '../game/types'
import { useGameStore } from '../store/useGameStore'

/** Экран 3: игра окончена — победитель, банк и итоги каждого. */
export function ResultsScreen({ game, winner }: { game: Game; winner: Player }) {
  const resetGame = useGameStore((s) => s.resetGame)
  const reopenGame = useGameStore((s) => s.reopenGame)

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

      <ol className="mb-6 divide-y divide-white/10 rounded-2xl bg-white/5">
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

      <BottomBar>
        <Button variant="primary" size="lg" className="w-full" onClick={resetGame}>
          Новая игра
        </Button>
        <Button variant="ghost" size="sm" className="mt-1 w-full" onClick={reopenGame}>
          Вернуться к игре
        </Button>
      </BottomBar>
    </Screen>
  )
}
