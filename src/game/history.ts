// История игр: список завершённых игр. Чистые функции, как и остальная логика.
// Игру в истории узнаём по времени её начала (startedAt) — на одном телефоне оно уникально.

import { getWinner } from './game'
import { getGameStats } from './stats'
import type { Game } from './types'

/** Добавляет завершённую игру в историю. Новые игры — сверху. Незавершённые и повторы не добавляются. */
export function addToHistory(history: Game[], game: Game): Game[] {
  if (game.finishedAt === null) return history
  if (history.some((saved) => saved.startedAt === game.startedAt)) return history
  return [game, ...history].sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
}

/** Убирает игру из истории. */
export function removeFromHistory(history: Game[], startedAt: number): Game[] {
  return history.filter((game) => game.startedAt !== startedAt)
}

/** Короткая сводка для строки в списке истории. */
export type GameSummary = {
  startedAt: number
  duration: number
  winnerName: string | null
  bank: number
  playerCount: number
  totalRebuys: number
}

export function getGameSummary(game: Game): GameSummary {
  const stats = getGameStats(game, game.finishedAt ?? game.startedAt)
  return {
    startedAt: game.startedAt,
    duration: stats.duration,
    winnerName: getWinner(game)?.name ?? null,
    bank: stats.bank,
    playerCount: game.players.length,
    totalRebuys: stats.totalRebuys,
  }
}
