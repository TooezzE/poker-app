import { formatBlinds, formatCountdown } from '../format'
import type { ClockState } from '../game/clock'
import { useGameStore } from '../store/useGameStore'
import { Button } from './Button'
import { NextIcon, PauseIcon, PlayIcon, PreviousIcon } from './icons'

/** Таймер блайндов: текущий уровень, обратный отсчёт и управление. */
export function BlindClock({ clock }: { clock: ClockState }) {
  const pauseClock = useGameStore((s) => s.pauseClock)
  const resumeClock = useGameStore((s) => s.resumeClock)
  const nextLevel = useGameStore((s) => s.nextLevel)
  const previousLevel = useGameStore((s) => s.previousLevel)

  const blinds = formatBlinds(clock.blinds)

  return (
    <section className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-emerald-200">Уровень {clock.levelIndex + 1}</span>
        <span
          className={`text-3xl font-bold tabular-nums ${
            clock.isPaused ? 'animate-pulse text-white/50' : 'text-amber-300'
          }`}
        >
          {formatCountdown(clock.timeLeft)}
        </span>
      </div>

      <p className={`font-bold tabular-nums ${blinds.length > 11 ? 'text-4xl' : 'text-5xl'}`}>
        {blinds}
      </p>
      <p className="mt-1 text-sm text-emerald-200">
        {clock.isPaused ? 'Пауза · ' : ''}Далее {formatBlinds(clock.nextBlinds)}
      </p>

      <div className="mt-3 flex gap-2">
        <Button
          aria-label="Предыдущий уровень"
          onClick={previousLevel}
          disabled={clock.levelIndex === 0}
          className="w-14"
        >
          <PreviousIcon />
        </Button>
        {clock.isPaused ? (
          <Button variant="primary" className="flex-1" onClick={resumeClock}>
            <PlayIcon className="h-5 w-5" /> Продолжить
          </Button>
        ) : (
          <Button className="flex-1" onClick={pauseClock}>
            <PauseIcon className="h-5 w-5" /> Пауза
          </Button>
        )}
        <Button aria-label="Следующий уровень" onClick={nextLevel} className="w-14">
          <NextIcon />
        </Button>
      </div>
    </section>
  )
}
