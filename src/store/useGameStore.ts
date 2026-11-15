// Хранилище (стор) — единое место, где живут данные приложения.
//
// Экраны читают отсюда данные и вызывают действия («ребай», «выбыл»).
// Сами действия ничего не считают — они вызывают чистые функции из src/game/.
// Middleware `persist` автоматически сохраняет состояние в localStorage телефона,
// поэтому игра не пропадёт, если закрыть приложение.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as rules from '../game/game'
import type { Game, Settings } from '../game/types'

type GameStore = {
  /** Список игроков для следующей игры (сохраняется между играми). */
  names: string[]
  /** Настройки для следующей игры (сохраняются между играми). */
  settings: Settings
  /** Текущая игра. null — игра не начата. */
  game: Game | null

  addName: (name: string) => void
  removeName: (name: string) => void
  setSetting: (key: keyof Settings, value: number) => void
  startGame: () => void

  addRebuy: (playerId: string) => void
  undoRebuy: (playerId: string) => void
  bustPlayer: (playerId: string) => void
  restorePlayer: (playerId: string) => void
  addLatePlayer: (name: string) => void
  undoLastBust: () => void
  /** Закрыть игру и вернуться к настройке новой. */
  finishGame: () => void
}

const defaultSettings: Settings = {
  buyIn: 1000,
  rebuyCost: 1000,
  startingStack: 10000,
  smallBlind: 50,
  bigBlind: 100,
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => {
      /** Применяет функцию из src/game к текущей игре (если игра идёт). */
      const updateGame = (change: (game: Game) => Game) => {
        const { game } = get()
        if (game) set({ game: change(game) })
      }

      return {
        names: [],
        settings: defaultSettings,
        game: null,

        addName: (name) => {
          const { names } = get()
          if (rules.checkNewName(names, name) === null) {
            set({ names: [...names, rules.normalizeName(name)] })
          }
        },

        removeName: (name) => set({ names: get().names.filter((n) => n !== name) }),

        setSetting: (key, value) => set({ settings: { ...get().settings, [key]: value } }),

        startGame: () => {
          const { names, settings } = get()
          if (rules.getStartProblems(names, settings).length === 0) {
            set({ game: rules.createGame(names, settings, Date.now()) })
          }
        },

        addRebuy: (playerId) => updateGame((game) => rules.addRebuy(game, playerId)),
        undoRebuy: (playerId) => updateGame((game) => rules.undoRebuy(game, playerId)),
        bustPlayer: (playerId) => updateGame((game) => rules.bustPlayer(game, playerId, Date.now())),
        restorePlayer: (playerId) => updateGame((game) => rules.restorePlayer(game, playerId)),
        undoLastBust: () => updateGame(rules.undoLastBust),

        addLatePlayer: (name) => {
          const { game, names } = get()
          if (!game) return
          const playerNames = game.players.map((p) => p.name)
          if (rules.checkNewName(playerNames, name) !== null) return

          const normalized = rules.normalizeName(name)
          set({
            game: rules.addPlayer(game, normalized),
            // Запоминаем опоздавшего и для следующих игр.
            names: rules.checkNewName(names, normalized) === null ? [...names, normalized] : names,
          })
        },

        finishGame: () => set({ game: null }),
      }
    },
    {
      name: 'poker-tracker', // ключ в localStorage
      version: 1, // увеличим, если поменяется формат данных
    },
  ),
)
