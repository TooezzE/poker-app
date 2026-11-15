// Таймер блайндов: чистые функции над отметками времени.
//
// «Игровое время» — сколько прошло с начала игры, не считая пауз.
// Текущий уровень = уровень, от которого идёт отсчёт, + сколько полных уровней прошло с тех пор.

import { getBlindLevel } from './blinds'
import type { BlindLevel, Clock, Game } from './types'

export const MINUTE = 60_000

export function createClock(): Clock {
  return { pausedAt: null, pausedTotal: 0, levelIndex: 0, levelStartedAt: 0 }
}

/** Игровое время в мс: сколько прошло с начала игры, не считая пауз. */
export function getPlayTime(game: Game, now: number): number {
  const { pausedAt, pausedTotal } = game.clock
  return Math.max(0, (pausedAt ?? now) - game.startedAt - pausedTotal)
}

/** Всё, что нужно показать на таймере. */
export type ClockState = {
  /** Номер текущего уровня (0 — первый). */
  levelIndex: number
  blinds: BlindLevel
  nextBlinds: BlindLevel
  /** Сколько мс осталось до следующего уровня. */
  timeLeft: number
  isPaused: boolean
}

export function getClockState(game: Game, now: number): ClockState {
  const levelDuration = game.settings.levelMinutes * MINUTE
  const sinceLevelStart = Math.max(0, getPlayTime(game, now) - game.clock.levelStartedAt)
  const levelIndex = game.clock.levelIndex + Math.floor(sinceLevelStart / levelDuration)

  return {
    levelIndex,
    blinds: getBlindLevel(game.settings, levelIndex),
    nextBlinds: getBlindLevel(game.settings, levelIndex + 1),
    timeLeft: levelDuration - (sinceLevelStart % levelDuration),
    isPaused: game.clock.pausedAt !== null,
  }
}

/** Пауза: запоминаем, когда остановились. */
export function pauseClock(game: Game, now: number): Game {
  if (game.clock.pausedAt !== null) return game
  return { ...game, clock: { ...game.clock, pausedAt: now } }
}

/** Продолжить: длительность паузы добавляется к общему времени пауз. */
export function resumeClock(game: Game, now: number): Game {
  const { pausedAt, pausedTotal } = game.clock
  if (pausedAt === null) return game
  return {
    ...game,
    clock: { ...game.clock, pausedAt: null, pausedTotal: pausedTotal + (now - pausedAt) },
  }
}

/**
 * Переключить уровень вручную: step = 1 — следующий, step = −1 — предыдущий.
 * Таймер уровня начинается заново. Если таймер на паузе, он так и остаётся на паузе.
 */
export function changeLevel(game: Game, step: 1 | -1, now: number): Game {
  const current = getClockState(game, now).levelIndex
  return {
    ...game,
    clock: {
      ...game.clock,
      levelIndex: Math.max(0, current + step),
      levelStartedAt: getPlayTime(game, now),
    },
  }
}
