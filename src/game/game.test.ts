// Тесты игровой логики. Запуск: npm test
// Каждый тест — маленький сценарий: «сделали вот это → ожидаем вот такой результат».

import { describe, expect, it } from 'vitest'
import { pauseClock, resumeClock } from './clock'
import {
  addPlayer,
  addRebuy,
  areRebuysOpen,
  bustPlayer,
  calcBank,
  canRebuy,
  checkNewName,
  createGame,
  finishGame,
  getActivePlayers,
  getAverageStack,
  getLastPlayerStanding,
  getPlayerNet,
  getPlayerPaid,
  getStandings,
  getStartProblems,
  getWinner,
  reopenGame,
  restorePlayer,
  undoRebuy,
  validateSettings,
} from './game'
import type { Game, Settings } from './types'

const MIN = 60_000

const settings: Settings = {
  buyIn: 1000,
  rebuyCost: 500,
  startingStack: 10000,
  smallBlind: 50,
  bigBlind: 100,
  levelMinutes: 20,
  rebuyLimit: 'none',
  rebuyMaxPerPlayer: 1,
  rebuyMinutes: 120,
  rebuyBigBlindBelow: 1000,
}

/** Игра на четверых: Аня (p1), Боря (p2), Вика (p3), Гоша (p4). Начало в момент 0. */
function fourPlayers(overrides: Partial<Settings> = {}): Game {
  return createGame(['Аня', 'Боря', 'Вика', 'Гоша'], { ...settings, ...overrides }, 0)
}

/** Игрок выбыл и сразу докупился. */
function bustAndRebuy(game: Game, playerId: string, now: number): Game {
  return addRebuy(bustPlayer(game, playerId, now), playerId, now)
}

const player = (game: Game, id: string) => game.players.find((p) => p.id === id)!

describe('подготовка к игре', () => {
  it('не даёт добавить пустое имя или повтор', () => {
    expect(checkNewName([], '   ')).toBe('Введите имя')
    expect(checkNewName(['Аня'], ' аня ')).toBe('Такой игрок уже есть')
    expect(checkNewName(['Аня'], 'Боря')).toBeNull()
  })

  it('проверяет настройки', () => {
    expect(validateSettings(settings)).toEqual([])
    expect(validateSettings({ ...settings, buyIn: 0 })).toContain('Укажите бай-ин')
    expect(validateSettings({ ...settings, smallBlind: 200 })).toContain(
      'Большой блайнд не может быть меньше малого',
    )
    expect(validateSettings({ ...settings, levelMinutes: 0 })).toContain(
      'Укажите длительность уровня',
    )
  })

  it('проверяет настройки лимита ребаев только для выбранного способа', () => {
    // Незаполненный порог по блайндам не мешает, если выбран лимит по количеству.
    expect(
      validateSettings({ ...settings, rebuyLimit: 'perPlayer', rebuyBigBlindBelow: 0 }),
    ).toEqual([])
    expect(validateSettings({ ...settings, rebuyLimit: 'bigBlind', rebuyBigBlindBelow: 100 }))
      .toContain('Порог для ребаев должен быть больше стартового большого блайнда')
  })

  it('не даёт начать игру с одним игроком', () => {
    expect(getStartProblems(['Аня'], settings)).toContain('Добавьте хотя бы двух игроков')
    expect(getStartProblems(['Аня', 'Боря'], settings)).toEqual([])
  })

  it('создаёт игру: все в игре, ребаев нет, игра не завершена', () => {
    const game = createGame(['  Аня ', 'Боря'], settings, 123)
    expect(game.startedAt).toBe(123)
    expect(game.finishedAt).toBeNull()
    expect(game.players).toEqual([
      { id: 'p1', name: 'Аня', rebuys: 0, bustedAt: null },
      { id: 'p2', name: 'Боря', rebuys: 0, bustedAt: null },
    ])
  })
})

describe('банк и ребаи', () => {
  it('банк в начале — это бай-ины всех игроков', () => {
    expect(calcBank(fourPlayers())).toBe(4000)
  })

  it('ребай возможен только после вылета', () => {
    const game = fourPlayers()
    expect(addRebuy(game, 'p1', 10)).toBe(game) // Аня в игре — ребай ничего не меняет
  })

  it('ребай возвращает выбывшего в игру и добавляется в банк', () => {
    let game = bustAndRebuy(fourPlayers(), 'p1', 10)
    game = bustAndRebuy(game, 'p1', 20)
    game = bustAndRebuy(game, 'p2', 30)
    expect(player(game, 'p1')).toMatchObject({ rebuys: 2, bustedAt: null })
    expect(calcBank(game)).toBe(4000 + 3 * 500)
    expect(getPlayerPaid(game, player(game, 'p1'))).toBe(2000)
  })

  it('отмена ребая возвращает игрока к выбывшим', () => {
    let game = bustAndRebuy(fourPlayers(), 'p1', 10)
    game = undoRebuy(game, 'p1', 20)
    expect(player(game, 'p1')).toMatchObject({ rebuys: 0, bustedAt: 20 })
  })

  it('отмена ребая без ребаев ничего не делает', () => {
    const game = fourPlayers()
    expect(undoRebuy(game, 'p1', 10).players).toEqual(game.players)
  })

  it('опоздавший игрок платит бай-ин и получает новый id', () => {
    const game = addPlayer(fourPlayers(), 'Дима')
    expect(calcBank(game)).toBe(5000)
    expect(game.players[4]).toMatchObject({ id: 'p5', name: 'Дима' })
  })

  it('средний стек считается по оставшимся игрокам', () => {
    let game = bustAndRebuy(fourPlayers(), 'p1', 10) // 5 стеков по 10 000 на столе
    game = bustPlayer(game, 'p2', 20) // в игре трое
    expect(getAverageStack(game)).toBe(Math.round(50000 / 3))
  })
})

describe('лимиты ребаев', () => {
  it('без ограничений — ребай можно всегда', () => {
    const game = bustPlayer(fourPlayers(), 'p1', 10 * 60 * MIN)
    expect(canRebuy(game, player(game, 'p1'), 10 * 60 * MIN)).toBe(true)
  })

  it('по количеству: не больше N ребаев на игрока', () => {
    let game = fourPlayers({ rebuyLimit: 'perPlayer', rebuyMaxPerPlayer: 1 })
    game = bustAndRebuy(game, 'p1', 10) // первый ребай — можно
    game = bustPlayer(game, 'p1', 20)
    expect(canRebuy(game, player(game, 'p1'), 20)).toBe(false)
    expect(addRebuy(game, 'p1', 20)).toBe(game)
    // У других игроков свой лимит.
    game = bustPlayer(game, 'p2', 30)
    expect(canRebuy(game, player(game, 'p2'), 30)).toBe(true)
  })

  it('по времени: только первые N минут, паузы не считаются', () => {
    let game = fourPlayers({ rebuyLimit: 'time', rebuyMinutes: 120 })
    expect(areRebuysOpen(game, 119 * MIN)).toBe(true)
    expect(areRebuysOpen(game, 120 * MIN)).toBe(false)

    // Перерыв на 30 минут сдвигает конец ребаев на 30 минут.
    game = resumeClock(pauseClock(game, 60 * MIN), 90 * MIN)
    expect(areRebuysOpen(game, 149 * MIN)).toBe(true)
    expect(areRebuysOpen(game, 150 * MIN)).toBe(false)
  })

  it('по блайндам: только пока большой блайнд меньше порога', () => {
    // Уровни по 20 минут: 100, 150, 200, 300, 500, 800, 1600…
    const game = fourPlayers({ rebuyLimit: 'bigBlind', rebuyBigBlindBelow: 500 })
    expect(areRebuysOpen(game, 79 * MIN)).toBe(true) // 4-й уровень, ББ 300
    expect(areRebuysOpen(game, 80 * MIN)).toBe(false) // 5-й уровень, ББ 500
  })
})

describe('выбывание и конец игры', () => {
  it('выбывший больше не в игре; повторное выбывание ничего не меняет', () => {
    let game = bustPlayer(fourPlayers(), 'p1', 10)
    game = bustPlayer(game, 'p1', 99)
    expect(getActivePlayers(game).map((p) => p.name)).toEqual(['Боря', 'Вика', 'Гоша'])
    expect(player(game, 'p1').bustedAt).toBe(10)
  })

  it('можно вернуть выбывшего по ошибке', () => {
    let game = bustPlayer(fourPlayers(), 'p1', 10)
    game = restorePlayer(game, 'p1')
    expect(getActivePlayers(game)).toHaveLength(4)
  })

  it('когда остался один, игра не завершается сама — выбывшие ещё могут докупиться', () => {
    let game = fourPlayers()
    game = bustPlayer(game, 'p1', 10)
    game = bustPlayer(game, 'p2', 20)
    game = bustPlayer(game, 'p3', 30)
    expect(getLastPlayerStanding(game)?.name).toBe('Гоша')
    expect(getWinner(game)).toBeNull()
    expect(canRebuy(game, player(game, 'p3'), 30)).toBe(true)

    // Последнего выбить нельзя.
    expect(bustPlayer(game, 'p4', 40)).toBe(game)
  })

  it('завершить игру можно только когда остался один', () => {
    const game = bustPlayer(fourPlayers(), 'p1', 10)
    expect(finishGame(game, 20)).toBe(game)
  })

  it('после завершения есть победитель и ребаи закрыты; к игре можно вернуться', () => {
    let game = fourPlayers()
    game = bustPlayer(game, 'p1', 10)
    game = bustPlayer(game, 'p2', 20)
    game = bustPlayer(game, 'p3', 30)
    game = finishGame(game, 40)
    expect(getWinner(game)?.name).toBe('Гоша')
    expect(canRebuy(game, player(game, 'p3'), 40)).toBe(false)

    game = reopenGame(game)
    expect(getWinner(game)).toBeNull()
  })

  it('места: кто выбыл позже — тот выше', () => {
    let game = fourPlayers()
    game = bustPlayer(game, 'p2', 10) // Боря — 4-й
    expect(getStandings(game).find((s) => s.player.id === 'p2')?.place).toBe(4)
    expect(getStandings(game)[0].place).toBeNull() // у тех, кто в игре, места ещё нет

    game = bustPlayer(game, 'p1', 20) // Аня — 3-я
    game = bustPlayer(game, 'p4', 30) // Гоша — 2-й
    game = finishGame(game, 40) // Вика побеждает
    expect(getStandings(game).map((s) => [s.player.name, s.place])).toEqual([
      ['Вика', 1],
      ['Гоша', 2],
      ['Аня', 3],
      ['Боря', 4],
    ])
  })

  it('итоги всех игроков в сумме дают ноль', () => {
    let game = fourPlayers()
    game = bustAndRebuy(game, 'p1', 5)
    game = bustAndRebuy(game, 'p3', 6)
    game = bustPlayer(game, 'p1', 10)
    game = bustPlayer(game, 'p2', 20)
    game = bustPlayer(game, 'p3', 30)
    game = finishGame(game, 40)

    expect(getPlayerNet(game, player(game, 'p4'))).toBe(calcBank(game) - 1000)
    const total = game.players.reduce((sum, p) => sum + getPlayerNet(game, p), 0)
    expect(total).toBe(0)
  })
})
