// Шкала блайндов: как растут блайнды от уровня к уровню.
//
// Правило:
//   1. «Идеальный» малый блайнд уровня N = стартовый малый блайнд × 1,5^N.
//   2. Он округляется до ближайшего «круглого» числа из ряда
//      10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 150, 200, 250, … (и так далее ×10).
//   3. Большой блайнд = малый × то же соотношение, что на старте (обычно ×2).
//
// Округляется каждый раз идеальное значение, а не предыдущее округлённое,
// поэтому ошибки округления не накапливаются и в среднем рост остаётся ×1,5.

import type { BlindLevel, Settings } from './types'

/** Во сколько раз в среднем растут блайнды за уровень. */
export const BLIND_GROWTH = 1.5

/**
 * «Круглые» ступени внутри одного разряда, умноженные на 10:
 * 10 → 1, 15 → 1,5, 75 → 7,5 и т. д. Хранятся целыми, чтобы не было ошибок с дробями.
 */
const NICE_STEPS = [10, 15, 20, 25, 30, 40, 50, 60, 75, 80]

/** Круглые целые числа рядом со значением (разряд ниже, тот же и выше), по возрастанию. */
function niceNumbersNear(value: number): number[] {
  const power = Math.floor(Math.log10(Math.max(value, 1)))
  const numbers: number[] = []
  for (let p = power - 1; p <= power + 1; p++) {
    for (const step of NICE_STEPS) {
      const n = p >= 1 ? step * 10 ** (p - 1) : step / 10 ** (1 - p)
      if (Number.isInteger(n) && n >= 1) numbers.push(n)
    }
  }
  return numbers.sort((a, b) => a - b)
}

/**
 * Округляет до ближайшего круглого числа.
 * «Ближайшее» — по соотношению, а не по разнице: 854 ближе к 800 (×1,07), чем к 1000 (×1,17).
 */
export function roundToNice(value: number): number {
  const distance = (n: number) => Math.abs(Math.log(n / value))
  return niceNumbersNear(value).reduce((best, n) => (distance(n) < distance(best) ? n : best))
}

/** Первые `count` уровней блайндов. Первый уровень — ровно стартовые блайнды. */
export function getBlindLevels(settings: Settings, count: number): BlindLevel[] {
  const { smallBlind, bigBlind } = settings
  const ratio = bigBlind / smallBlind
  const levels: BlindLevel[] = []

  let small = smallBlind
  for (let index = 0; index < count; index++) {
    if (index === 0) {
      levels.push({ small: smallBlind, big: bigBlind })
      continue
    }

    let next = roundToNice(smallBlind * BLIND_GROWTH ** index)
    // Блайнды не должны стоять на месте: если округление не дало роста, берём следующее круглое.
    if (next <= small) next = niceNumbersNear(small).find((n) => n > small) ?? small * 2
    small = next

    const exactBig = small * ratio
    const big = Number.isInteger(exactBig) ? exactBig : Math.max(small, roundToNice(exactBig))
    levels.push({ small, big })
  }
  return levels
}

/** Блайнды уровня с номером `index` (0 — первый уровень). */
export function getBlindLevel(settings: Settings, index: number): BlindLevel {
  return getBlindLevels(settings, index + 1)[index]
}

/** Сколько первых уровней имеют большой блайнд меньше `threshold` (не больше 100 уровней). */
export function countLevelsWithBigBlindBelow(settings: Settings, threshold: number): number {
  return getBlindLevels(settings, 100).filter((level) => level.big < threshold).length
}
