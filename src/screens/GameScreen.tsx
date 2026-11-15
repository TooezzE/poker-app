import { useState, type FormEvent } from 'react'
import { Button } from '../components/Button'
import { PlayerCard } from '../components/PlayerCard'
import { Screen } from '../components/Screen'
import { formatNumber } from '../format'
import {
  calcBank,
  checkNewName,
  getActivePlayers,
  getAverageStack,
  getStandings,
  getTotalRebuys,
} from '../game/game'
import type { Game } from '../game/types'
import { useGameStore } from '../store/useGameStore'

/** Экран 2: идёт игра — банк, игроки, ребаи и вылеты. */
export function GameScreen({ game }: { game: Game }) {
  const finishGame = useGameStore((s) => s.finishGame)

  const { smallBlind, bigBlind } = game.settings
  const averageStack = getAverageStack(game)

  function handleFinish() {
    if (window.confirm('Завершить игру без победителя? Данные этой игры удалятся.')) {
      finishGame()
    }
  }

  return (
    <Screen>
      <header className="py-4">
        <p className="text-sm text-emerald-300">Банк</p>
        <p className="text-5xl font-bold tabular-nums text-amber-300">
          {formatNumber(calcBank(game))}
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="В игре" value={`${getActivePlayers(game).length} из ${game.players.length}`} />
          <Stat label="Ребаев" value={String(getTotalRebuys(game))} />
          <Stat label="Блайнды" value={`${formatNumber(smallBlind)}/${formatNumber(bigBlind)}`} />
        </dl>
        <p className="mt-2 text-sm text-emerald-200">
          Средний стек: {formatNumber(averageStack)} фишек (
          {formatNumber(Math.round(averageStack / bigBlind))} BB)
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {getStandings(game).map((standing) => (
          <PlayerCard key={standing.player.id} game={game} standing={standing} />
        ))}
      </ul>

      <AddLatePlayer game={game} />

      <div className="pb-safe mt-auto pt-8">
        <Button variant="ghost" size="sm" className="w-full" onClick={handleFinish}>
          Завершить игру без победителя
        </Button>
      </div>
    </Screen>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2">
      <dt className="text-xs text-emerald-300">{label}</dt>
      <dd className="truncate text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

/** Кнопка «Добавить игрока», которая раскрывается в поле ввода. */
function AddLatePlayer({ game }: { game: Game }) {
  const addLatePlayer = useGameStore((s) => s.addLatePlayer)
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState('')

  const playerNames = game.players.map((p) => p.name)
  const error = draft.trim() === '' ? null : checkNewName(playerNames, draft)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (checkNewName(playerNames, draft) === null) {
      addLatePlayer(draft)
      setDraft('')
      setIsOpen(false)
    }
  }

  if (!isOpen) {
    return (
      <Button className="mt-3 w-full" onClick={() => setIsOpen(true)}>
        + Добавить игрока
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-2xl bg-white/5 p-3">
      <p className="mb-2 text-sm text-emerald-200">
        Опоздавший игрок платит бай-ин {formatNumber(game.settings.buyIn)}
      </p>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Имя игрока"
          autoFocus
          autoComplete="off"
          autoCapitalize="words"
          autoCorrect="off"
          className="h-12 min-w-0 flex-1 rounded-xl bg-white/10 px-3 text-lg text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-amber-400"
        />
        <Button type="submit" variant="primary" disabled={draft.trim() === '' || error !== null}>
          Добавить
        </Button>
      </div>
      {error && <p className="mt-1 text-sm text-red-300">{error}</p>}
      <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setIsOpen(false)}>
        Отмена
      </Button>
    </form>
  )
}
