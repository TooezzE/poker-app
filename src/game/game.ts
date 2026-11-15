// Игровая логика: чистые функции.
//
// «Чистая функция» — это функция, которая:
//   1) ничего не меняет вокруг себя (не трогает старый объект игры, а возвращает новый);
//   2) при одинаковых входных данных всегда возвращает одинаковый результат.
// Поэтому текущее время передаётся параметром `now`, а не берётся внутри через Date.now().
// Такие функции легко проверять тестами и можно перенести в любое другое приложение.

import type { Game, Player, Settings, Standing } from './types'

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
  return errors
}

/** Всё, что мешает начать игру. Пустой список — можно начинать. */
export function getStartProblems(names: string[], settings: Settings): string[] {
  const problems: string[] = []
  if (names.length < MIN_PLAYERS) problems.push('Добавьте хотя бы двух игроков')
  return [...problems, ...validateSettings(settings)]
}

/** Создаёт новую игру. */
export function createGame(names: string[], settings: Settings, now: number): Game {
  return {
    settings: { ...settings },
    players: names.map((name, index) => newPlayer(`p${index + 1}`, name)),
    startedAt: now,
  }
}

function newPlayer(id: string, name: string): Player {
  return { id, name: normalizeName(name), rebuys: 0, bustedAt: null }
}

// ---------- Действия по ходу игры ----------

/** Добавляет опоздавшего игрока: он платит бай-ин и получает стартовый стек. */
export function addPlayer(game: Game, name: string): Game {
  // Игроков из игры мы никогда не удаляем, поэтому номер по порядку всегда уникален.
  const id = `p${game.players.length + 1}`
  return { ...game, players: [...game.players, newPlayer(id, name)] }
}

/** Ребай. Если игрок уже выбыл, ребай возвращает его в игру. */
export function addRebuy(game: Game, playerId: string): Game {
  return updatePlayer(game, playerId, (player) => ({
    ...player,
    rebuys: player.rebuys + 1,
    bustedAt: null,
  }))
}

/** Отменяет последний ребай игрока (если нажали по ошибке). */
export function undoRebuy(game: Game, playerId: string): Game {
  return updatePlayer(game, playerId, (player) => ({
    ...player,
    rebuys: Math.max(0, player.rebuys - 1),
  }))
}

/** Игрок выбыл. Последнего оставшегося игрока выбить нельзя — он победитель. */
export function bustPlayer(game: Game, playerId: string, now: number): Game {
  if (getActivePlayers(game).length <= 1) return game
  return updatePlayer(game, playerId, (player) =>
    player.bustedAt === null ? { ...player, bustedAt: now } : player,
  )
}

/** Возвращает выбывшего игрока в игру (если отметили по ошибке). */
export function restorePlayer(game: Game, playerId: string): Game {
  return updatePlayer(game, playerId, (player) => ({ ...player, bustedAt: null }))
}

/** Возвращает в игру того, кто выбыл последним. */
export function undoLastBust(game: Game): Game {
  const [lastBusted] = getBustedPlayers(game)
  return lastBusted ? restorePlayer(game, lastBusted.id) : game
}

/** Меняет одного игрока, остальных оставляет как есть. */
function updatePlayer(game: Game, playerId: string, change: (player: Player) => Player): Game {
  return {
    ...game,
    players: game.players.map((player) => (player.id === playerId ? change(player) : player)),
  }
}

// ---------- Подсчёты ----------

/** Игроки, которые ещё в игре (в порядке добавления). */
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

/** Победитель — единственный оставшийся игрок. Пока играют двое и больше, победителя нет. */
export function getWinner(game: Game): Player | null {
  const active = getActivePlayers(game)
  return game.players.length >= MIN_PLAYERS && active.length === 1 ? active[0] : null
}

/**
 * Таблица мест: сначала те, кто ещё играет, затем выбывшие (последний выбывший — выше).
 * Место выбывшего известно сразу: если осталось 3 игрока, следующий выбывший — третий.
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
