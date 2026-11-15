// Помощники для красивого вывода чисел и слов.

const numberFormat = new Intl.NumberFormat('ru-RU')

/** 12000 → «12 000» */
export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

/** 2500 → «+2 500», −1000 → «−1 000» */
export function formatSigned(value: number): string {
  if (value > 0) return `+${formatNumber(value)}`
  if (value < 0) return `−${formatNumber(-value)}`
  return '0'
}

/**
 * Склонение по числу: plural(5, ['игрок', 'игрока', 'игроков']) → «игроков».
 * Формы: для 1, для 2–4, для 5–20.
 */
export function plural(count: number, forms: [string, string, string]): string {
  const mod100 = Math.abs(count) % 100
  const mod10 = mod100 % 10
  if (mod100 >= 11 && mod100 <= 14) return forms[2]
  if (mod10 === 1) return forms[0]
  if (mod10 >= 2 && mod10 <= 4) return forms[1]
  return forms[2]
}
