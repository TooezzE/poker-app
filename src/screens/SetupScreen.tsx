import { useState, type FormEvent } from 'react'
import { Button } from '../components/Button'
import { NumberField } from '../components/NumberField'
import { BottomBar, Screen } from '../components/Screen'
import { checkNewName, getStartProblems } from '../game/game'
import type { Settings } from '../game/types'
import { useGameStore } from '../store/useGameStore'

/** Экран 1: список игроков и настройки перед началом игры. */
export function SetupScreen() {
  const names = useGameStore((s) => s.names)
  const settings = useGameStore((s) => s.settings)
  const addName = useGameStore((s) => s.addName)
  const removeName = useGameStore((s) => s.removeName)
  const setSetting = useGameStore((s) => s.setSetting)
  const startGame = useGameStore((s) => s.startGame)

  const [draft, setDraft] = useState('')
  const nameError = draft.trim() === '' ? null : checkNewName(names, draft)
  const problems = getStartProblems(names, settings)

  function handleAdd(event: FormEvent) {
    event.preventDefault() // не перезагружать страницу при отправке формы
    if (checkNewName(names, draft) === null) {
      addName(draft)
      setDraft('')
    }
  }

  /** Поле настройки, связанное с нужным ключом в сторе. */
  const field = (key: keyof Settings, label: string, className?: string) => (
    <NumberField
      label={label}
      value={settings[key]}
      onChange={(value) => setSetting(key, value)}
      className={className}
    />
  )

  return (
    <Screen>
      <header className="py-4">
        <p className="text-sm text-emerald-300">Покер-трекер</p>
        <h1 className="text-3xl font-bold">Новая игра</h1>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-semibold">
          Игроки <span className="text-emerald-300">· {names.length}</span>
        </h2>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Имя игрока"
            autoComplete="off"
            autoCapitalize="words"
            autoCorrect="off"
            className="h-12 min-w-0 flex-1 rounded-xl bg-white/10 px-3 text-lg text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-amber-400"
          />
          <Button type="submit" disabled={draft.trim() === '' || nameError !== null}>
            Добавить
          </Button>
        </form>
        {nameError && <p className="mt-1 text-sm text-red-300">{nameError}</p>}

        {names.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">
            Пока никого. Список запомнится для следующих игр.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {names.map((name) => (
              <li key={name} className="flex items-center rounded-xl bg-white/5 pl-4">
                <span className="flex-1 truncate text-lg">{name}</span>
                <button
                  type="button"
                  onClick={() => removeName(name)}
                  aria-label={`Убрать ${name}`}
                  className="h-12 w-12 text-xl text-white/50 active:text-white"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 mb-6">
        <h2 className="mb-2 text-lg font-semibold">Ставки</h2>
        <div className="grid grid-cols-2 gap-3">
          {field('buyIn', 'Бай-ин')}
          {field('rebuyCost', 'Ребай')}
          {field('startingStack', 'Стартовый стек (фишки)', 'col-span-2')}
          {field('smallBlind', 'Малый блайнд')}
          {field('bigBlind', 'Большой блайнд')}
        </div>
      </section>

      <BottomBar>
        {problems.length > 0 && (
          <p className="mb-2 text-center text-sm text-emerald-200">{problems[0]}</p>
        )}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={problems.length > 0}
          onClick={startGame}
        >
          Начать игру
        </Button>
      </BottomBar>
    </Screen>
  )
}
