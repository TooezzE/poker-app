// Игровая логика: чистые функции.
//
// «Чистая функция» — это функция, которая:
//   1) ничего не меняет вокруг себя (не трогает старый объект игры, а возвращает новый);
//   2) при одинаковых входных данных всегда возвращает одинаковый результат.
// Поэтому текущее время передаётся параметром `now`, а не берётся внутри через Date.now().
// Такие функции легко проверять тестами и можно перенести в любое другое приложение.

import { createClock, getClockState, getPlayTime, MINUTE } from './clock'
import type { Game, GameEvent, Player, Settings, Standing } from './types'

export const MIN_PLAYERS = 2

// ---------- Подготовка к игре ----------

/** Убирает лишние пробелы в имени: «  Вася   Пупкин » → «Вася Пупкин». */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

/** Проверяет, можно ли добавить игрока с таким именем. Возвращает текст ошибки или null. */
export function checkNewName(existingNames: string[], name: string): string | null {
  const normalized = normalizeName(name)
  if (normalized === '') return 'Введите имя'
  const taken = existingNames.some(
    (existing) => existing.toLowerCase() === normalized.toLowerCase(),
  )
  if (taken) return 'Такой игрок уже есть'
  return null
}

/** Проверяет настройки. Возвращает список ошибок (пустой — всё в порядке). */
export function validateSettings(settings: Settings): string[] {
  const errors: string[] = []
  if (!(settings.buyIn > 0)) errors.push('Укажите бай-ин')
  if (!(settings.rebuyCost > 0)) errors.push('Укажите стоимость ребая')
  if (!(settings.startingStack > 0)) errors.push('Укажите стартовый стек')
  if (!(settings.smallBlind > 0)) errors.push('Укажите малый блайнд')
  if (!(settings.bigBlind > 0)) errors.push('Укажите большой блайнд')
  else if (settings.bigBlind < settings.smallBlind) {
    errors.push('Большой блайнд не может быть меньше малого')
  }
  if (!(settings.levelMinutes > 0)) errors.push('Укажите длительность уровня')
  if (!(settings.minChip > 0)) errors.push('Укажите самую мелкую фишку')
  else if (settings.smallBlind % settings.minChip !== 0 || settings.bigBlind % settings.minChip !== 0) {
    errors.push(`Блайнды должны делиться на самую мелкую фишку (${settings.minChip})`)
  }

  switch (settings.rebuyLimit) {
    case 'perPlayer':
      if (!(settings.rebuyMaxPerPlayer > 0)) errors.push('Укажите, сколько ребаев можно игроку')
      break
    case 'time':
      if (!(settings.rebuyMinutes > 0)) errors.push('Укажите, сколько минут открыты ребаи')
      break
    case 'bigBlind':
      if (!(settings.rebuyBigBlindBelow > settings.bigBlind)) {
        errors.push('Порог для ребаев должен быть больше стартового большого блайнда')
      }
      break
  }
  return errors
}

/** Всё, что мешает начать игру. Пустой список — можно начинать. */
export function getStartProblems(names: string[], settings: Settings): string[] {
  const problems: string[] = []
  if (names.length < MIN_PLAYERS) problems.push('Добавьте хотя бы двух игроков')
  return [...problems, ...validateSettings(settings)]
}

/** Создаёт новую игру. Таймер блайндов запускается сразу. */
export function createGame(names: string[], settings: Settings, now: number): Game {
  return {
    settings: { ...settings },
    players: names.map((name, index) => newPlayer(`p${index + 1}`, name)),
    startedAt: now,
    finishedAt: null,
    clock: createClock(),
    events: [],
  }
}

function newPlayer(id: string, name: string): Player {
  return { id, name: normalizeName(name), rebuys: 0, bustedAt: null }
}

// ---------- Ребаи ----------

/**
 * Открыты ли ребаи в игре сейчас (без учёта лимита на одного игрока).
 * Время считается игровое — паузы не входят.
 */
export function areRebuysOpen(game: Game, now: number): boolean {
  const { settings } = game
  switch (settings.rebuyLimit) {
    case 'time':
      return getPlayTime(game, now) < settings.rebuyMinutes * MINUTE
    case 'bigBlind':
      return getClockState(game, now).blinds.big < settings.rebuyBigBlindBelow
    default:
      return true
  }
}

/** Сколько мс игрового времени ребаи ещё открыты (только для лимита по времени). */
export function getRebuyTimeLeft(game: Game, now: number): number {
  return Math.max(0, game.settings.rebuyMinutes * MINUTE - getPlayTime(game, now))
}

/** Может ли игрок сейчас сделать ребай. Ребай возможен только после вылета. */
export function canRebuy(game: Game, player: Player, now: number): boolean {
  if (game.finishedAt !== null || player.bustedAt === null) return false
  if (!areRebuysOpen(game, now)) return false
  const { rebuyLimit, rebuyMaxPerPlayer } = game.settings
  return !(rebuyLimit === 'perPlayer' && player.rebuys >= rebuyMaxPerPlayer)
}

// ---------- Действия по ходу игры ----------

/** Добавляет опоздавшего игрока: он платит бай-ин и получает стартовый стек. */
export function addPlayer(game: Game, name: string, now: number): Game {
  // Игроков из игры мы никогда не удаляем, поэтому номер по порядку всегда уникален.
  const id = `p${game.players.length + 1}`
  const withPlayer = { ...game, players: [...game.players, newPlayer(id, name)] }
  return logEvent(withPlayer, 'join', id, now)
}

/** Игрок выбыл (проиграл весь стек). Последнего оставшегося выбить нельзя. */
export function bustPlayer(game: Game, playerId: string, now: number): Game {
  const player = findPlayer(game, playerId)
  if (!player || player.bustedAt !== null || getActivePlayers(game).length <= 1) return game
  const busted = updatePlayer(game, playerId, (p) => ({ ...p, bustedAt: now }))
  return logEvent(busted, 'bust', playerId, now)
}

/** Ребай: выбывший игрок докупается и возвращается в игру. */
export function addRebuy(game: Game, playerId: string, now: number): Game {
  const player = findPlayer(game, playerId)
  if (!player || !canRebuy(game, player, now)) return game
  const rebought = updatePlayer(game, playerId, (p) => ({
    ...p,
    rebuys: p.rebuys + 1,
    bustedAt: null,
  }))
  return logEvent(rebought, 'rebuy', playerId, now)
}

/**
 * Отменяет ребай (нажали по ошибке): игрок снова среди выбывших,
 * а ребай исчезает из истории, как будто его и не было.
 */
export function undoRebuy(game: Game, playerId: string, now: number): Game {
  const player = findPlayer(game, playerId)
  if (!player || player.bustedAt !== null || player.rebuys === 0) return game

  const events = removeLastEvent(game.events, 'rebuy', playerId)
  // Возвращаем игроку время его настоящего вылета — чтобы места считались верно.
  const lastBust = findLastEvent(events, 'bust', playerId)
  const updated = updatePlayer(game, playerId, (p) => ({
    ...p,
    rebuys: p.rebuys - 1,
    bustedAt: lastBust?.at ?? now,
  }))
  return { ...updated, events }
}

/** Отменяет вылет (отметили по ошибке): игрок возвращается в игру, вылет исчезает из истории. */
export function restorePlayer(game: Game, playerId: string): Game {
  const player = findPlayer(game, playerId)
  if (!player || player.bustedAt === null) return game
  const restored = updatePlayer(game, playerId, (p) => ({ ...p, bustedAt: null }))
  return { ...restored, events: removeLastEvent(game.events, 'bust', playerId) }
}

function findPlayer(game: Game, playerId: string): Player | undefined {
  return game.players.find((player) => player.id === playerId)
}

/** Меняет одного игрока, остальных оставляет как есть. */
function updatePlayer(game: Game, playerId: string, change: (player: Player) => Player): Game {
  return {
    ...game,
    players: game.players.map((player) => (player.id === playerId ? change(player) : player)),
  }
}

// ---------- История ----------

/** Записывает событие в историю вместе с текущими блайндами. */
function logEvent(game: Game, type: GameEvent['type'], playerId: string, now: number): Game {
  const { levelIndex, blinds } = getClockState(game, now)
  const event: GameEvent = { type, playerId, at: now, level: levelIndex, blinds }
  return { ...game, events: [...game.events, event] }
}

/** Последнее событие такого типа у игрока. */
export function findLastEvent(
  events: GameEvent[],
  type: GameEvent['type'],
  playerId: string,
): GameEvent | undefined {
  return events.findLast((event) => event.type === type && event.playerId === playerId)
}

/** Убирает из истории последнее событие такого типа у игрока. */
function removeLastEvent(
  events: GameEvent[],
  type: GameEvent['type'],
  playerId: string,
): GameEvent[] {
  const index = events.findLastIndex((event) => event.type === type && event.playerId === playerId)
  return index === -1 ? events : events.filter((_, i) => i !== index)
}

// ---------- Завершение игры ----------

/** Единственный оставшийся игрок (пока за столом двое и больше — null). */
export function getLastPlayerStanding(game: Game): Player | null {
  const active = getActivePlayers(game)
  return game.players.length >= MIN_PLAYERS && active.length === 1 ? active[0] : null
}

/**
 * Завершить игру. Возможно, только когда остался один игрок.
 * Игра не завершается сама: выбывшие должны успеть решить, делать ли ребай.
 * Завершение окончательное — вернуться к игре нельзя.
 */
export function finishGame(game: Game, now: number): Game {
  if (game.finishedAt !== null || !getLastPlayerStanding(game)) return game
  return { ...game, finishedAt: now }
}

/** Победитель — оставшийся игрок, но только после того, как игру завершили. */
export function getWinner(game: Game): Player | null {
  return game.finishedAt === null ? null : getLastPlayerStanding(game)
}

// ---------- Подсчёты ----------

/** Игроки, которые сейчас в игре (в порядке добавления). */
export function getActivePlayers(game: Game): Player[] {
  return game.players.filter((player) => player.bustedAt === null)
}

/** Выбывшие игроки: сначала те, кто выбыл последним. */
export function getBustedPlayers(game: Game): Player[] {
  return game.players
    .filter((player) => player.bustedAt !== null)
    .sort((a, b) => (b.bustedAt ?? 0) - (a.bustedAt ?? 0))
}

/** Сколько всего ребаев сделано за игру. */
export function getTotalRebuys(game: Game): number {
  return game.players.reduce((sum, player) => sum + player.rebuys, 0)
}

/** Банк: все бай-ины и все ребаи. */
export function calcBank(game: Game): number {
  const { buyIn, rebuyCost } = game.settings
  return game.players.length * buyIn + getTotalRebuys(game) * rebuyCost
}

/** Сколько денег игрок внёс в банк. */
export function getPlayerPaid(game: Game, player: Player): number {
  return game.settings.buyIn + player.rebuys * game.settings.rebuyCost
}

/** Итог игрока: победитель получает банк за вычетом своих взносов, остальные теряют взносы. */
export function getPlayerNet(game: Game, player: Player): number {
  const paid = getPlayerPaid(game, player)
  return getWinner(game)?.id === player.id ? calcBank(game) - paid : -paid
}

/** Сколько фишек всего на столе. */
export function getChipsInPlay(game: Game): number {
  return (game.players.length + getTotalRebuys(game)) * game.settings.startingStack
}

/** Средний стек у оставшихся игроков. */
export function getAverageStack(game: Game): number {
  const activeCount = getActivePlayers(game).length
  return activeCount === 0 ? 0 : Math.round(getChipsInPlay(game) / activeCount)
}

/**
 * Таблица мест: сначала те, кто в игре, затем выбывшие (последний выбывший — выше).
 * Место выбывшего: если осталось 3 игрока, следующий выбывший — третий.
 */
export function getStandings(game: Game): Standing[] {
  const active = getActivePlayers(game)
  const winner = getWinner(game)
  return [
    ...active.map((player) => ({ player, place: winner ? 1 : null })),
    ...getBustedPlayers(game).map((player, index) => ({
      player,
      place: active.length + index + 1,
    })),
  ]
}
