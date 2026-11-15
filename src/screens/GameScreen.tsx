import { useState, type FormEvent } from 'react'
import { BlindClock } from '../components/BlindClock'
import { Button } from '../components/Button'
import { ActivePlayerCard, BustedPlayerCard } from '../components/PlayerCard'
import { Screen } from '../components/Screen'
import { Stat } from '../components/Stat'
import { formatCountdown, formatNumber } from '../format'
import { getClockState } from '../game/clock'
import {
  areRebuysOpen,
  calcBank,
  canRebuy,
  checkNewName,
  getAverageStack,
  getLastPlayerStanding,
  getRebuyTimeLeft,
  getStandings,
  getTotalRebuys,
} from '../game/game'
import type { Game, Player } from '../game/types'
import { useNow } from '../hooks/useNow'
import { useGameStore } from '../store/useGameStore'

/** Экран 2: идёт игра — таймер блайндов, банк, игроки, вылеты и ребаи. */
export function GameScreen({ game }: { game: Game }) {
  const resetGame = useGameStore((s) => s.resetGame)
  const now = useNow()

  const clock = getClockState(game, now)
  const standings = getStandings(game)
  const active = standings.filter((s) => s.player.bustedAt === null)
  const busted = standings.filter((s) => s.player.bustedAt !== null)
  const lastPlayer = getLastPlayerStanding(game)

  function handleReset() {
    if (window.confirm('Завершить игру без победителя? Данные этой игры удалятся.')) {
      resetGame()
    }
  }

  return (
    <Screen>
      <div className="pt-2">
        <BlindClock clock={clock} />
      </div>

      <section className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-emerald-300">Банк</span>
          <span className="text-4xl font-bold tabular-nums text-amber-300">
            {formatNumber(calcBank(game))}
          </span>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="В игре" value={`${active.length} из ${game.players.length}`} />
          <Stat label="Ребаев" value={String(getTotalRebuys(game))} />
          <Stat
            label="Средний стек"
            value={`${formatNumber(Math.round(getAverageStack(game) / clock.blinds.big))} BB`}
          />
        </dl>
        <p className="mt-2 text-sm text-emerald-200">{rebuyStatus(game, now)}</p>
      </section>

      {lastPlayer && <FinishPrompt player={lastPlayer} />}

      <h2 className="mt-6 mb-2 text-lg font-semibold">
        В игре <span className="text-emerald-300">· {active.length}</span>
      </h2>
      <ul className="flex flex-col gap-2">
        {active.map((standing) => (
          <ActivePlayerCard
            key={standing.player.id}
            game={game}
            standing={standing}
            canBust={active.length > 1}
          />
        ))}
      </ul>
      <AddLatePlayer game={game} />

      {busted.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-lg font-semibold">
            Выбывшие <span className="text-emerald-300">· {busted.length}</span>
          </h2>
          <ul className="flex flex-col gap-2">
            {busted.map((standing) => (
              <BustedPlayerCard
                key={standing.player.id}
                game={game}
                standing={standing}
                rebuyAllowed={canRebuy(game, standing.player, now)}
              />
            ))}
          </ul>
        </>
      )}

      <div className="pb-safe mt-auto pt-8">
        <Button variant="ghost" size="sm" className="w-full" onClick={handleReset}>
          Завершить игру без победителя
        </Button>
      </div>
    </Screen>
  )
}

/** Строка о том, открыты ли ребаи. */
function rebuyStatus(game: Game, now: number): string {
  const { settings } = game
  const open = areRebuysOpen(game, now)
  switch (settings.rebuyLimit) {
    case 'perPlayer':
      return `Ребаи: не больше ${settings.rebuyMaxPerPlayer} на игрока`
    case 'time':
      return open
        ? `Ребаи открыты ещё ${formatCountdown(getRebuyTimeLeft(game, now))}`
        : 'Время ребаев вышло'
    case 'bigBlind':
      return open
        ? `Ребаи — пока большой блайнд меньше ${formatNumber(settings.rebuyBigBlindBelow)}`
        : 'Ребаи закрыты: блайнды выросли'
    default:
      return 'Ребаи без ограничений'
  }
}

/** Остался один игрок: предлагаем завершить игру. */
function FinishPrompt({ player }: { player: Player }) {
  const finishGame = useGameStore((s) => s.finishGame)

  function handleFinish() {
    if (window.confirm(`Завершить игру? Победитель — ${player.name}. Вернуться к игре будет нельзя.`)) {
      finishGame()
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4">
      <p className="text-sm text-amber-200">Остался один игрок</p>
      <p className="text-2xl font-bold">{player.name}</p>
      <p className="mt-1 text-sm text-emerald-100/80">
        Если никто из выбывших не делает ребай — завершайте игру.
      </p>
      <Button variant="primary" size="lg" className="mt-3 w-full" onClick={handleFinish}>
        Завершить игру
      </Button>
    </section>
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
      <Button className="mt-2 w-full" onClick={() => setIsOpen(true)}>
        + Добавить игрока
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 rounded-2xl bg-white/5 p-3">
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
