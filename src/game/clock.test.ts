import { describe, expect, it } from 'vitest'
import { changeLevel, getClockState, getPlayTime, pauseClock, resumeClock } from './clock'
import { createGame } from './game'
import type { Settings } from './types'

const MIN = 60_000
const START = 1_000_000 // момент начала игры

const settings: Settings = {
  buyIn: 1000,
  rebuyCost: 1000,
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

const newGame = () => createGame(['Аня', 'Боря'], settings, START)
const at = (minutes: number) => START + minutes * MIN

describe('таймер блайндов', () => {
  it('в начале игры — первый уровень и полные 20 минут', () => {
    const state = getClockState(newGame(), at(0))
    expect(state).toMatchObject({
      levelIndex: 0,
      blinds: { small: 50, big: 100 },
      nextBlinds: { small: 75, big: 150 },
      timeLeft: 20 * MIN,
      isPaused: false,
    })
  })

  it('уровень меняется сам по прошествии времени', () => {
    const game = newGame()
    expect(getClockState(game, at(19)).levelIndex).toBe(0)
    expect(getClockState(game, at(20)).levelIndex).toBe(1)
    // Телефон пролежал в кармане час — уровень всё равно верный.
    expect(getClockState(game, at(65))).toMatchObject({ levelIndex: 3, timeLeft: 15 * MIN })
  })

  it('пауза останавливает время, продолжение — продолжает с того же места', () => {
    let game = pauseClock(newGame(), at(5))
    expect(getClockState(game, at(50))).toMatchObject({
      levelIndex: 0,
      timeLeft: 15 * MIN,
      isPaused: true,
    })

    game = resumeClock(game, at(50)) // перерыв 45 минут
    expect(getClockState(game, at(60)).timeLeft).toBe(5 * MIN)
    expect(getPlayTime(game, at(60))).toBe(15 * MIN)
  })

  it('следующий уровень вручную — таймер уровня начинается заново', () => {
    const game = changeLevel(newGame(), 1, at(7))
    expect(getClockState(game, at(7))).toMatchObject({ levelIndex: 1, timeLeft: 20 * MIN })
    expect(getClockState(game, at(27)).levelIndex).toBe(2)
  })

  it('предыдущий уровень вручную; раньше первого уровня не уйти', () => {
    let game = newGame()
    game = changeLevel(game, -1, at(3))
    expect(getClockState(game, at(3))).toMatchObject({ levelIndex: 0, timeLeft: 20 * MIN })

    game = changeLevel(changeLevel(game, 1, at(4)), 1, at(5)) // уровень 3
    game = changeLevel(game, -1, at(6))
    expect(getClockState(game, at(6))).toMatchObject({ levelIndex: 1, timeLeft: 20 * MIN })
  })

  it('переключение уровня на паузе: остаёмся на паузе с полным временем', () => {
    let game = pauseClock(newGame(), at(5))
    game = changeLevel(game, 1, at(8))
    expect(getClockState(game, at(30))).toMatchObject({
      levelIndex: 1,
      timeLeft: 20 * MIN,
      isPaused: true,
    })
    game = resumeClock(game, at(30))
    expect(getClockState(game, at(40)).timeLeft).toBe(10 * MIN)
  })
})
