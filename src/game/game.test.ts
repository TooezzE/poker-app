// Тесты игровой логики. Запуск: npm test
// Каждый тест — маленький сценарий: «сделали вот это → ожидаем вот такой результат».

import { describe, expect, it } from 'vitest'
import {
  addPlayer,
  addRebuy,
  bustPlayer,
  calcBank,
  checkNewName,
  createGame,
  getActivePlayers,
  getAverageStack,
  getPlayerNet,
  getPlayerPaid,
  getStandings,
  getStartProblems,
  getWinner,
  restorePlayer,
  undoLastBust,
  undoRebuy,
  validateSettings,
} from './game'
import type { Settings } from './types'

const settings: Settings = {
  buyIn: 1000,
  rebuyCost: 500,
  startingStack: 10000,
  smallBlind: 50,
  bigBlind: 100,
}

/** Игра на четверых: Аня (p1), Боря (p2), Вика (p3), Гоша (p4). */
function fourPlayers() {
  return createGame(['Аня', 'Боря', 'Вика', 'Гоша'], settings, 0)
}

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
  })

  it('не даёт начать игру с одним игроком', () => {
    expect(getStartProblems(['Аня'], settings)).toContain('Добавьте хотя бы двух игроков')
    expect(getStartProblems(['Аня', 'Боря'], settings)).toEqual([])
  })

  it('создаёт игру: все в игре, ребаев нет', () => {
    const game = createGame(['  Аня ', 'Боря'], settings, 123)
    expect(game.startedAt).toBe(123)
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

  it('ребаи добавляются в банк', () => {
    let game = fourPlayers()
    game = addRebuy(game, 'p1')
    game = addRebuy(game, 'p1')
    game = addRebuy(game, 'p2')
    expect(calcBank(game)).toBe(4000 + 3 * 500)
    expect(getPlayerPaid(game, game.players[0])).toBe(2000)
  })

  it('отмена ребая не уходит ниже нуля', () => {
    let game = addRebuy(fourPlayers(), 'p1')
    game = undoRebuy(game, 'p1')
    game = undoRebuy(game, 'p1')
    expect(game.players[0].rebuys).toBe(0)
  })

  it('ребай выбывшего игрока возвращает его в игру', () => {
    let game = bustPlayer(fourPlayers(), 'p1', 10)
    game = addRebuy(game, 'p1')
    expect(game.players[0]).toMatchObject({ rebuys: 1, bustedAt: null })
  })

  it('опоздавший игрок платит бай-ин и получает новый id', () => {
    const game = addPlayer(fourPlayers(), 'Дима')
    expect(calcBank(game)).toBe(5000)
    expect(game.players[4]).toMatchObject({ id: 'p5', name: 'Дима' })
  })

  it('средний стек считается по оставшимся игрокам', () => {
    let game = addRebuy(fourPlayers(), 'p1') // 5 стеков по 10 000 на столе
    game = bustPlayer(game, 'p2', 10) // осталось трое
    expect(getAverageStack(game)).toBe(Math.round(50000 / 3))
  })
})

describe('выбывание и победитель', () => {
  it('выбывший больше не в игре; повторное выбывание ничего не меняет', () => {
    let game = bustPlayer(fourPlayers(), 'p1', 10)
    game = bustPlayer(game, 'p1', 99)
    expect(getActivePlayers(game).map((p) => p.name)).toEqual(['Боря', 'Вика', 'Гоша'])
    expect(game.players[0].bustedAt).toBe(10)
  })

  it('пока играют двое и больше — победителя нет', () => {
    const game = bustPlayer(fourPlayers(), 'p1', 10)
    expect(getWinner(game)).toBeNull()
  })

  it('последний оставшийся — победитель, выбить его нельзя', () => {
    let game = fourPlayers()
    game = bustPlayer(game, 'p1', 10)
    game = bustPlayer(game, 'p2', 20)
    game = bustPlayer(game, 'p3', 30)
    expect(getWinner(game)?.name).toBe('Гоша')

    const after = bustPlayer(game, 'p4', 40)
    expect(after).toBe(game)
  })

  it('места: кто выбыл позже — тот выше', () => {
    let game = fourPlayers()
    game = bustPlayer(game, 'p2', 10) // Боря — 4-й
    expect(getStandings(game).find((s) => s.player.id === 'p2')?.place).toBe(4)

    game = bustPlayer(game, 'p1', 20) // Аня — 3-я
    game = bustPlayer(game, 'p4', 30) // Гоша — 2-й, Вика побеждает
    expect(getStandings(game).map((s) => [s.player.name, s.place])).toEqual([
      ['Вика', 1],
      ['Гоша', 2],
      ['Аня', 3],
      ['Боря', 4],
    ])
  })

  it('пока игра идёт, у оставшихся игроков места нет', () => {
    const game = bustPlayer(fourPlayers(), 'p1', 10)
    expect(getStandings(game)[0].place).toBeNull()
  })

  it('можно вернуть выбывшего по ошибке', () => {
    let game = bustPlayer(fourPlayers(), 'p1', 10)
    game = restorePlayer(game, 'p1')
    expect(getActivePlayers(game)).toHaveLength(4)
  })

  it('отмена последнего вылета возвращает того, кто выбыл позже всех', () => {
    let game = fourPlayers()
    game = bustPlayer(game, 'p1', 10)
    game = bustPlayer(game, 'p2', 20)
    game = undoLastBust(game)
    expect(getActivePlayers(game).map((p) => p.name)).toEqual(['Боря', 'Вика', 'Гоша'])
  })

  it('итоги всех игроков в сумме дают ноль', () => {
    let game = fourPlayers()
    game = addRebuy(game, 'p1')
    game = addRebuy(game, 'p3')
    game = bustPlayer(game, 'p1', 10)
    game = bustPlayer(game, 'p2', 20)
    game = bustPlayer(game, 'p3', 30)

    const winner = game.players[3]
    expect(getPlayerNet(game, winner)).toBe(calcBank(game) - 1000)
    const total = game.players.reduce((sum, p) => sum + getPlayerNet(game, p), 0)
    expect(total).toBe(0)
  })
})
