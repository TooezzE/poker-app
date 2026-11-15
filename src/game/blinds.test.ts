import { describe, expect, it } from 'vitest'
import { countLevelsWithBigBlindBelow, getBlindLevel, getBlindLevels, roundToNice } from './blinds'
import type { Settings } from './types'

function settingsWith(smallBlind: number, bigBlind: number): Settings {
  return {
    buyIn: 1000,
    rebuyCost: 1000,
    startingStack: 10000,
    smallBlind,
    bigBlind,
    levelMinutes: 20,
    rebuyLimit: 'none',
    rebuyMaxPerPlayer: 1,
    rebuyMinutes: 120,
    rebuyBigBlindBelow: 1000,
  }
}

const show = (settings: Settings, count: number) =>
  getBlindLevels(settings, count).map(({ small, big }) => `${small}/${big}`)

/** Круглое число: первые две цифры — одна из ступеней 10, 15, 20, 25, 30, 40, 50, 60, 75, 80. */
function isNice(n: number): boolean {
  const digits = String(n).replace(/0+$/, '').padEnd(2, '0')
  return n < 10 || ['10', '15', '20', '25', '30', '40', '50', '60', '75', '80'].includes(digits)
}

describe('округление', () => {
  it('округляет до ближайшего круглого числа', () => {
    expect(roundToNice(1255)).toBe(1500) // ×1,20 до 1500 ближе, чем ×1,26 до 1000
    expect(roundToNice(854)).toBe(800)
    expect(roundToNice(380)).toBe(400)
    expect(roundToNice(75)).toBe(75)
  })
})

describe('шкала блайндов', () => {
  it('первый уровень — ровно стартовые блайнды', () => {
    expect(getBlindLevel(settingsWith(35, 70), 0)).toEqual({ small: 35, big: 70 })
  })

  it('от 50/100 растёт примерно ×1,5 по круглым числам', () => {
    expect(show(settingsWith(50, 100), 14)).toEqual([
      '50/100',
      '75/150',
      '100/200',
      '150/300',
      '250/500',
      '400/800',
      '600/1200',
      '800/1600',
      '1500/3000',
      '2000/4000',
      '3000/6000',
      '4000/8000',
      '6000/12000',
      '10000/20000',
    ])
  })

  it('при любом старте блайнды круглые, растут и не прыгают больше чем вдвое', () => {
    for (const [sb, bb] of [[1, 2], [5, 10], [10, 20], [25, 50], [50, 100], [100, 200], [500, 1000]]) {
      const levels = getBlindLevels(settingsWith(sb, bb), 30)
      levels.slice(1).forEach((level, i) => {
        const prev = levels[i]
        expect(isNice(level.small), `${level.small} при старте ${sb}/${bb}`).toBe(true)
        expect(level.small).toBeGreaterThan(prev.small)
        expect(level.small / prev.small).toBeLessThanOrEqual(2)
        expect(level.big).toBe(level.small * 2)
      })
    }
  })

  it('если старт не 1:2, большой блайнд тоже круглый', () => {
    const levels = getBlindLevels(settingsWith(10, 25), 10)
    for (const level of levels) {
      expect(Number.isInteger(level.big)).toBe(true)
      expect(level.big).toBeGreaterThanOrEqual(level.small)
    }
  })

  it('считает, сколько уровней с большим блайндом меньше порога', () => {
    // 100, 150, 200, 300, 500, 800 < 1000
    expect(countLevelsWithBigBlindBelow(settingsWith(50, 100), 1000)).toBe(6)
  })
})
