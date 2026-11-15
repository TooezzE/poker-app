// Статистика для экрана «Обзор игры». Чистые функции, как и остальная логика.

import { getClockState, getPlayTime } from './clock'
import { calcBank, findLastEvent, getTotalRebuys } from './game'
import type { BlindLevel, Game, GameEvent, Player } from './types'

export type GameStats = {
  /** Сколько длилась игра от начала до конца (мс). */
  duration: number
  /** Сколько из этого времени были паузы (мс). */
  breaks: number
  /** До какого уровня дошли (1 — первый). */
  lastLevel: number
  lastBlinds: BlindLevel
  bank: number
  totalRebuys: number
  /** Сумма всех ребаев. */
  rebuysSum: number
  /** Кто сделал больше всего ребаев (несколько игроков, если поровну). null — ребаев не было. */
  mostRebuys: { players: Player[]; count: number } | null
}

/** Статистика игры. `end` — момент окончания (для завершённой игры — finishedAt). */
export function getGameStats(game: Game, end: number): GameStats {
  const duration = Math.max(0, end - game.startedAt)
  const clock = getClockState(game, end)
  const totalRebuys = getTotalRebuys(game)
  const maxRebuys = Math.max(0, ...game.players.map((player) => player.rebuys))

  return {
    duration,
    breaks: duration - getPlayTime(game, end),
    lastLevel: clock.levelIndex + 1,
    lastBlinds: clock.blinds,
    bank: calcBank(game),
    totalRebuys,
    rebuysSum: totalRebuys * game.settings.rebuyCost,
    mostRebuys:
      maxRebuys === 0
        ? null
        : {
            players: game.players.filter((player) => player.rebuys === maxRebuys),
            count: maxRebuys,
          },
  }
}

/** Последний вылет игрока (при каких блайндах выбыл окончательно). */
export function getFinalBust(game: Game, player: Player): GameEvent | undefined {
  return player.bustedAt === null ? undefined : findLastEvent(game.events, 'bust', player.id)
}
