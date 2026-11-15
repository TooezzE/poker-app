// Хранилище (стор) — единое место, где живут данные приложения.
//
// Экраны читают отсюда данные и вызывают действия («ребай», «выбыл», «пауза»).
// Сами действия ничего не считают — они вызывают чистые функции из src/game/.
// Middleware `persist` автоматически сохраняет состояние в localStorage телефона,
// поэтому игра не пропадёт, если закрыть приложение.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as clock from '../game/clock'
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
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  startGame: () => void

  bustPlayer: (playerId: string) => void
  addRebuy: (playerId: string) => void
  undoRebuy: (playerId: string) => void
  restorePlayer: (playerId: string) => void
  addLatePlayer: (name: string) => void

  pauseClock: () => void
  resumeClock: () => void
  nextLevel: () => void
  previousLevel: () => void

  /** Объявить победителя (когда остался один игрок). */
  finishGame: () => void
  /** Вернуться к игре после завершения. */
  reopenGame: () => void
  /** Закрыть игру и вернуться к настройке новой. */
  resetGame: () => void
}

/** То, что сохраняется в телефоне (действия не сохраняются — это код). */
type SavedData = Pick<GameStore, 'names' | 'settings' | 'game'>

const defaultSettings: Settings = {
  buyIn: 1000,
  rebuyCost: 1000,
  startingStack: 10000,
  smallBlind: 50,
  bigBlind: 100,
  levelMinutes: 20,
  rebuyLimit: 'none',
  rebuyMaxPerPlayer: 2,
  rebuyMinutes: 120,
  rebuyBigBlindBelow: 1000,
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => {
      /** Применяет функцию из src/game к текущей игре (если игра идёт). */
      const updateGame = (change: (game: Game, now: number) => Game) => {
        const { game } = get()
        if (game) set({ game: change(game, Date.now()) })
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

        bustPlayer: (id) => updateGame((game, now) => rules.bustPlayer(game, id, now)),
        addRebuy: (id) => updateGame((game, now) => rules.addRebuy(game, id, now)),
        undoRebuy: (id) => updateGame((game, now) => rules.undoRebuy(game, id, now)),
        restorePlayer: (id) => updateGame((game) => rules.restorePlayer(game, id)),

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

        pauseClock: () => updateGame(clock.pauseClock),
        resumeClock: () => updateGame(clock.resumeClock),
        nextLevel: () => updateGame((game, now) => clock.changeLevel(game, 1, now)),
        previousLevel: () => updateGame((game, now) => clock.changeLevel(game, -1, now)),

        finishGame: () => updateGame(rules.finishGame),
        reopenGame: () => updateGame(rules.reopenGame),
        resetGame: () => set({ game: null }),
      }
    },
    {
      name: 'poker-tracker', // ключ в localStorage
      version: 2, // увеличиваем, когда меняется формат сохранённых данных
      partialize: (state): SavedData => ({
        names: state.names,
        settings: state.settings,
        game: state.game,
      }),
      // Перенос данных, сохранённых старой версией приложения.
      migrate: (persisted, version) => {
        const saved = persisted as Partial<SavedData>
        if (version < 2) {
          // В версии 2 появились таймер блайндов и лимиты ребаев.
          // Игроков и ставки сохраняем (дополняя новыми настройками),
          // а незаконченную старую игру не переносим — в ней нет таймера.
          return {
            names: saved.names ?? [],
            settings: { ...defaultSettings, ...saved.settings },
            game: null,
          }
        }
        return saved as SavedData
      },
    },
  ),
)
