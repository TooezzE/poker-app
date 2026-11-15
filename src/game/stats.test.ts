import { describe, expect, it } from 'vitest'
import { changeLevel, pauseClock, resumeClock } from './clock'
import { addRebuy, bustPlayer, createGame, finishGame } from './game'
import { getFinalBust, getGameStats } from './stats'
import type { Settings } from './types'

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

describe('обзор игры', () => {
  it('считает длительность, перерывы, уровень и ребаи', () => {
    let game = createGame(['Аня', 'Боря', 'Вика'], settings, 0)
    game = bustPlayer(game, 'p1', 10 * MIN)
    game = addRebuy(game, 'p1', 11 * MIN)
    game = bustPlayer(game, 'p2', 15 * MIN)
    game = addRebuy(game, 'p2', 16 * MIN)
    game = pauseClock(game, 30 * MIN)
    game = resumeClock(game, 45 * MIN) // перерыв 15 минут
    game = bustPlayer(game, 'p1', 60 * MIN)
    game = bustPlayer(game, 'p2', 70 * MIN)
    game = finishGame(game, 75 * MIN)

    const stats = getGameStats(game, game.finishedAt!)
    expect(stats).toMatchObject({
      duration: 75 * MIN,
      breaks: 15 * MIN,
      lastLevel: 4, // 60 минут игрового времени → 4-й уровень
      lastBlinds: { small: 150, big: 300 },
      bank: 3 * 1000 + 2 * 500,
      totalRebuys: 2,
      rebuysSum: 1000,
    })
    expect(stats.mostRebuys?.players.map((p) => p.name)).toEqual(['Аня', 'Боря'])
    expect(stats.mostRebuys?.count).toBe(1)
  })

  it('без ребаев — «больше всего ребаев» нет', () => {
    const game = createGame(['Аня', 'Боря'], settings, 0)
    expect(getGameStats(game, 10 * MIN).mostRebuys).toBeNull()
  })

  it('уровень учитывает ручное переключение', () => {
    let game = createGame(['Аня', 'Боря'], settings, 0)
    game = changeLevel(game, 1, 5 * MIN)
    game = changeLevel(game, 1, 6 * MIN)
    expect(getGameStats(game, 7 * MIN)).toMatchObject({
      lastLevel: 3,
      lastBlinds: { small: 100, big: 200 },
    })
  })

  it('последний вылет игрока — при каких блайндах выбыл окончательно', () => {
    let game = createGame(['Аня', 'Боря', 'Вика'], settings, 0)
    game = bustPlayer(game, 'p1', 5 * MIN) // 50/100
    game = addRebuy(game, 'p1', 6 * MIN)
    game = bustPlayer(game, 'p1', 25 * MIN) // 75/150
    const anya = game.players[0]
    expect(getFinalBust(game, anya)?.blinds).toEqual({ small: 75, big: 150 })
    expect(getFinalBust(game, game.players[1])).toBeUndefined() // Боря в игре
  })
})
