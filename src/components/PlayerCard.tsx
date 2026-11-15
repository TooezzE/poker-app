import { formatNumber, plural } from '../format'
import { getPlayerPaid } from '../game/game'
import type { Game, Standing } from '../game/types'
import { useGameStore } from '../store/useGameStore'
import { Button } from './Button'

type Props = {
  game: Game
  standing: Standing
}

/** Карточка игрока на экране игры. */
export function PlayerCard({ game, standing: { player, place } }: Props) {
  const addRebuy = useGameStore((s) => s.addRebuy)
  const undoRebuy = useGameStore((s) => s.undoRebuy)
  const bustPlayer = useGameStore((s) => s.bustPlayer)
  const restorePlayer = useGameStore((s) => s.restorePlayer)

  const paid = formatNumber(getPlayerPaid(game, player))
  const rebuysText =
    player.rebuys > 0
      ? `${player.rebuys} ${plural(player.rebuys, ['ребай', 'ребая', 'ребаев'])}`
      : 'без ребаев'

  // Выбывший игрок: компактная серая строка.
  if (player.bustedAt !== null) {
    return (
      <li className="flex items-center gap-3 rounded-2xl bg-white/5 py-2 pr-2 pl-4 text-white/50">
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{player.name}</div>
          <div className="text-sm">
            {place}-е место · {rebuysText} · внёс {paid}
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => restorePlayer(player.id)}>
          Вернуть
        </Button>
      </li>
    )
  }

  return (
    <li className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-xl font-semibold">{player.name}</span>
        <span className="shrink-0 text-sm tabular-nums text-emerald-200">внёс {paid}</span>
      </div>

      <div className="mt-1 flex min-h-6 items-center justify-between text-sm text-emerald-200">
        <span>{rebuysText}</span>
        {player.rebuys > 0 && (
          <button
            type="button"
            onClick={() => undoRebuy(player.id)}
            className="-my-2 px-2 py-2 text-emerald-300 underline underline-offset-2"
          >
            отменить ребай
          </button>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="primary" size="lg" className="flex-1" onClick={() => addRebuy(player.id)}>
          + Ребай
        </Button>
        <Button variant="danger" size="lg" onClick={() => bustPlayer(player.id)}>
          Выбыл
        </Button>
      </div>
    </li>
  )
}
