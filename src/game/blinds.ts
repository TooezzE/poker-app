// Шкала блайндов: как растут блайнды от уровня к уровню.
//
// Правило:
//   1. «Идеальный» малый блайнд = стартовый малый блайнд × 1,5, × 1,5², × 1,5³ …
//   2. Он округляется до ближайшего «круглого» числа из ряда
//      10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 150, 200, 250, … (и так далее ×10),
//      которое делится на самую мелкую фишку (иначе блайнд не собрать фишками).
//   3. Если после округления блайнд не вырос, этот шаг пропускается.
//   4. Большой блайнд = малый × то же соотношение, что на старте (обычно ×2).
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

/** Круглые числа рядом со значением (разряд ниже, тот же и выше), кратные мелкой фишке. */
function niceNumbersNear(value: number, minChip: number): number[] {
  const power = Math.floor(Math.log10(Math.max(value, 1)))
  const numbers: number[] = []
  for (let p = power - 1; p <= power + 1; p++) {
    for (const step of NICE_STEPS) {
      const n = p >= 1 ? step * 10 ** (p - 1) : step / 10 ** (1 - p)
      if (Number.isInteger(n) && n >= minChip && n % minChip === 0) numbers.push(n)
    }
  }
  return numbers.sort((a, b) => a - b)
}

/**
 * Округляет до ближайшего круглого числа, которое делится на мелкую фишку.
 * «Ближайшее» — по соотношению, а не по разнице: 854 ближе к 800 (×1,07), чем к 1000 (×1,17).
 */
export function roundToNice(value: number, minChip = 1): number {
  const candidates = niceNumbersNear(value, minChip)
  // Необычный номинал фишки (например, 7), круглых чисел для него нет — просто кратное фишке.
  if (candidates.length === 0) return Math.max(minChip, Math.round(value / minChip) * minChip)

  const distance = (n: number) => Math.abs(Math.log(n / value))
  return candidates.reduce((best, n) => (distance(n) < distance(best) ? n : best))
}

/** Первые `count` уровней блайндов. Первый уровень — ровно стартовые блайнды. */
export function getBlindLevels(settings: Settings, count: number): BlindLevel[] {
  const { smallBlind, bigBlind, minChip } = settings
  const ratio = bigBlind / smallBlind
  const levels: BlindLevel[] = [{ small: smallBlind, big: bigBlind }]

  let small = smallBlind
  // step — степень роста: идеальный малый блайнд = стартовый × 1,5^step.
  for (let step = 1; levels.length < count && step < count * 10; step++) {
    const next = roundToNice(smallBlind * BLIND_GROWTH ** step, minChip)
    if (next <= small) continue // округление не дало роста — пропускаем этот шаг

    small = next
    const exactBig = small * ratio
    const big = Number.isInteger(exactBig)
      ? exactBig
      : Math.max(small, roundToNice(exactBig, minChip))
    levels.push({ small, big })
  }
  return levels.slice(0, count)
}

/** Блайнды уровня с номером `index` (0 — первый уровень). */
export function getBlindLevel(settings: Settings, index: number): BlindLevel {
  return getBlindLevels(settings, index + 1)[index]
}

/** Сколько первых уровней имеют большой блайнд меньше `threshold` (не больше 100 уровней). */
export function countLevelsWithBigBlindBelow(settings: Settings, threshold: number): number {
  return getBlindLevels(settings, 100).filter((level) => level.big < threshold).length
}
