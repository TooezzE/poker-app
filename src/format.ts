// Помощники для красивого вывода чисел, времени и слов.

import type { BlindLevel } from './game/types'

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

/** { small: 50, big: 100 } → «50/100» */
export function formatBlinds({ small, big }: BlindLevel): string {
  return `${formatNumber(small)}/${formatNumber(big)}`
}

/** Обратный отсчёт: 754 000 мс → «12:34», 4 000 000 мс → «1:06:40». */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mm = String(minutes).padStart(hours > 0 ? 2 : 1, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

/** Время от начала игры: 100 минут → «1:40». */
export function formatClockTime(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`
}

/** Продолжительность: 90 → «1 ч 30 мин», 120 → «2 ч», 45 → «45 мин». */
export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} мин`
  return minutes === 0 ? `${hours} ч` : `${hours} ч ${minutes} мин`
}

/** Длительность в мс → «3 ч 12 мин». */
export function formatDuration(ms: number): string {
  return formatMinutes(Math.round(ms / 60_000))
}

/** Время суток: «21:05». */
export function formatTimeOfDay(ms: number): string {
  return new Date(ms).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

/** Дата: «15 ноября»; если год не текущий — «15 ноября 2025 г.». */
export function formatDate(ms: number): string {
  const date = new Date(ms)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: sameYear ? undefined : 'numeric',
  })
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

/** «2 ребая», «без ребаев» */
export function formatRebuys(count: number): string {
  return count === 0 ? 'без ребаев' : `${count} ${plural(count, ['ребай', 'ребая', 'ребаев'])}`
}
