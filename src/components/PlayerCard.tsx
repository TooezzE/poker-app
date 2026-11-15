import { formatNumber, formatRebuys } from '../format'
import { getPlayerPaid } from '../game/game'
import type { Game, Standing } from '../game/types'
import { useGameStore } from '../store/useGameStore'
import { Button } from './Button'

type Props = {
  game: Game
  standing: Standing
}

type ActiveProps = Props & {
  /** Можно ли игрока выбить (последнего оставшегося — нельзя). */
  canBust: boolean
}

/** Игрок, который сейчас в игре: только кнопка «Выбыл». */
export function ActivePlayerCard({ game, standing: { player }, canBust }: ActiveProps) {
  const bustPlayer = useGameStore((s) => s.bustPlayer)
  const undoRebuy = useGameStore((s) => s.undoRebuy)

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 py-3 pr-3 pl-4">
      <div className="min-w-0 flex-1">
        <div className="truncate text-xl font-semibold">{player.name}</div>
        <div className="text-sm text-emerald-200">
          {formatRebuys(player.rebuys)} · внёс {formatNumber(getPlayerPaid(game, player))}
        </div>
        {player.rebuys > 0 && (
          <button
            type="button"
            onClick={() => undoRebuy(player.id)}
            className="-ml-1 px-1 py-1 text-sm text-emerald-300 underline underline-offset-2"
          >
            отменить ребай
          </button>
        )}
      </div>
      {canBust && (
        <Button variant="danger" size="lg" onClick={() => bustPlayer(player.id)}>
          Выбыл
        </Button>
      )}
    </li>
  )
}

type BustedProps = Props & {
  /** Можно ли игроку сейчас сделать ребай (с учётом лимитов). */
  rebuyAllowed: boolean
}

/** Выбывший игрок: может сделать ребай и вернуться в игру. */
export function BustedPlayerCard({ game, standing: { player, place }, rebuyAllowed }: BustedProps) {
  const addRebuy = useGameStore((s) => s.addRebuy)
  const restorePlayer = useGameStore((s) => s.restorePlayer)

  return (
    <li className="rounded-2xl bg-white/5 py-3 pr-3 pl-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold text-white/70">{player.name}</div>
          <div className="text-sm text-white/50">
            {place}-е место · {formatRebuys(player.rebuys)} · внёс{' '}
            {formatNumber(getPlayerPaid(game, player))}
          </div>
        </div>
        {!rebuyAllowed && (
          <Button size="sm" variant="ghost" onClick={() => restorePlayer(player.id)}>
            Отменить вылет
          </Button>
        )}
      </div>

      {rebuyAllowed && (
        <div className="mt-2 flex gap-2">
          <Button variant="primary" className="flex-1" onClick={() => addRebuy(player.id)}>
            + Ребай · {formatNumber(game.settings.rebuyCost)}
          </Button>
          <Button size="md" variant="ghost" onClick={() => restorePlayer(player.id)}>
            Отменить вылет
          </Button>
        </div>
      )}
    </li>
  )
}
