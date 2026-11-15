import { describe, expect, it } from 'vitest'
import { addRebuy, bustPlayer, createGame, finishGame } from './game'
import { addToHistory, getGameSummary, removeFromHistory } from './history'
import type { Game, Settings } from './types'

const MIN = 60_000

const settings: Settings = {
  buyIn: 1000,
  rebuyCost: 500,
  startingStack: 10000,
  smallBlind: 50,
  bigBlind: 100,
  levelMinutes: 20,
  minChip: 5,
  rebuyLimit: 'none',
  rebuyMaxPerPlayer: 1,
  rebuyMinutes: 120,
  rebuyBigBlindBelow: 1000,
}

/** Завершённая игра на троих, начавшаяся в `start`: Аня делает ребай, побеждает Вика. */
function finishedGame(start: number): Game {
  let game = createGame(['Аня', 'Боря', 'Вика'], settings, start)
  game = bustPlayer(game, 'p1', start + 10 * MIN)
  game = addRebuy(game, 'p1', start + 11 * MIN)
  game = bustPlayer(game, 'p1', start + 50 * MIN)
  game = bustPlayer(game, 'p2', start + 90 * MIN)
  return finishGame(game, start + 95 * MIN)
}

describe('история игр', () => {
  it('добавляет завершённые игры, новые — сверху', () => {
    const first = finishedGame(0)
    const second = finishedGame(1000 * MIN)
    let history = addToHistory([], first)
    history = addToHistory(history, second)
    expect(history.map((g) => g.startedAt)).toEqual([1000 * MIN, 0])
  })

  it('не добавляет незавершённую игру и не дублирует уже сохранённую', () => {
    const unfinished = createGame(['Аня', 'Боря'], settings, 0)
    expect(addToHistory([], unfinished)).toEqual([])

    const game = finishedGame(0)
    const history = addToHistory([], game)
    expect(addToHistory(history, game)).toBe(history)
  })

  it('удаляет игру из истории', () => {
    const history = addToHistory(addToHistory([], finishedGame(0)), finishedGame(1000 * MIN))
    expect(removeFromHistory(history, 0).map((g) => g.startedAt)).toEqual([1000 * MIN])
  })

  it('сводка для списка: победитель, банк, игроки, ребаи, длительность', () => {
    expect(getGameSummary(finishedGame(0))).toEqual({
      startedAt: 0,
      duration: 95 * MIN,
      winnerName: 'Вика',
      bank: 3 * 1000 + 500,
      playerCount: 3,
      totalRebuys: 1,
    })
  })
})
