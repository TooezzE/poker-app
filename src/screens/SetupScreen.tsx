import { useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { NumberField } from '../components/NumberField'
import { BottomBar, Screen } from '../components/Screen'
import { formatBlinds, formatClockTime, formatMinutes, plural } from '../format'
import { countLevelsWithBigBlindBelow, getBlindLevels } from '../game/blinds'
import { checkNewName, getStartProblems } from '../game/game'
import type { RebuyLimitKind, Settings } from '../game/types'
import { useGameStore } from '../store/useGameStore'
import { HistoryScreen } from './HistoryScreen'

/** Ключи настроек, значения которых — числа (для полей ввода). */
type NumberSettingKey = {
  [K in keyof Settings]: Settings[K] extends number ? K : never
}[keyof Settings]

const REBUY_LIMIT_OPTIONS: { kind: RebuyLimitKind; label: string }[] = [
  { kind: 'none', label: 'Без ограничений' },
  { kind: 'perPlayer', label: 'По количеству' },
  { kind: 'time', label: 'По времени' },
  { kind: 'bigBlind', label: 'По блайндам' },
]

/** Экран 1: список игроков и настройки перед началом игры. */
export function SetupScreen() {
  const names = useGameStore((s) => s.names)
  const settings = useGameStore((s) => s.settings)
  const addName = useGameStore((s) => s.addName)
  const removeName = useGameStore((s) => s.removeName)
  const setSetting = useGameStore((s) => s.setSetting)
  const startGame = useGameStore((s) => s.startGame)
  const historyCount = useGameStore((s) => s.history.length)

  const [draft, setDraft] = useState('')
  // Показывать ли историю игр вместо настройки — состояние только интерфейса.
  const [showHistory, setShowHistory] = useState(false)
  const nameError = draft.trim() === '' ? null : checkNewName(names, draft)
  const problems = getStartProblems(names, settings)

  function toggleHistory(show: boolean) {
    setShowHistory(show)
    window.scrollTo(0, 0)
  }

  if (showHistory) return <HistoryScreen onBack={() => toggleHistory(false)} />

  function handleAdd(event: FormEvent) {
    event.preventDefault() // не перезагружать страницу при отправке формы
    if (checkNewName(names, draft) === null) {
      addName(draft)
      setDraft('')
    }
  }

  /** Поле настройки, связанное с нужным ключом в сторе. */
  const field = (key: NumberSettingKey, label: string, className?: string) => (
    <NumberField
      label={label}
      value={settings[key]}
      onChange={(value) => setSetting(key, value)}
      className={className}
    />
  )

  return (
    <Screen>
      <header className="flex items-end justify-between gap-3 py-4">
        <div>
          <p className="text-sm text-emerald-300">Покер-трекер</p>
          <h1 className="text-3xl font-bold">Новая игра</h1>
        </div>
        {historyCount > 0 && (
          <Button size="sm" onClick={() => toggleHistory(true)}>
            История · {historyCount}
          </Button>
        )}
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

      <Section title="Ставки">
        <div className="grid grid-cols-2 gap-3">
          {field('buyIn', 'Бай-ин')}
          {field('rebuyCost', 'Ребай')}
          {field('startingStack', 'Стартовый стек (фишки)', 'col-span-2')}
        </div>
      </Section>

      <Section title="Блайнды">
        <div className="grid grid-cols-2 gap-3">
          {field('smallBlind', 'Малый блайнд')}
          {field('bigBlind', 'Большой блайнд')}
          {field('levelMinutes', 'Уровень, минут')}
          {field('minChip', 'Мелкая фишка')}
        </div>
        <Hint>
          Каждый уровень блайнды растут примерно в 1,5 раза и округляются до круглых чисел,
          которые делятся на самую мелкую фишку, — чтобы их всегда можно было собрать.
        </Hint>
        <LevelsPreview settings={settings} />
      </Section>

      <Section title="Ребаи">
        <div className="grid grid-cols-2 gap-2">
          {REBUY_LIMIT_OPTIONS.map(({ kind, label }) => {
            const selected = settings.rebuyLimit === kind
            return (
              <button
                key={kind}
                type="button"
                aria-pressed={selected}
                onClick={() => setSetting('rebuyLimit', kind)}
                className={`h-12 rounded-xl px-2 font-semibold transition-colors ${
                  selected ? 'bg-amber-400 text-emerald-950' : 'bg-white/10 text-white active:bg-white/20'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <RebuyLimitDetails settings={settings} field={field} />
      </Section>

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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-sm text-white/50">{children}</p>
}

/** Можно ли уже построить шкалу блайндов по введённым числам. */
function blindsAreValid(settings: Settings): boolean {
  return (
    settings.smallBlind > 0 &&
    settings.bigBlind >= settings.smallBlind &&
    settings.levelMinutes > 0 &&
    settings.minChip > 0 &&
    settings.smallBlind % settings.minChip === 0 &&
    settings.bigBlind % settings.minChip === 0
  )
}

/** Раскрывающийся список первых уровней блайндов со временем начала. */
function LevelsPreview({ settings }: { settings: Settings }) {
  if (!blindsAreValid(settings)) return null
  const levels = getBlindLevels(settings, 12)

  return (
    <details className="mt-3 rounded-xl bg-white/5">
      <summary className="cursor-pointer select-none px-4 py-3 text-emerald-200">
        Посмотреть уровни
      </summary>
      <ol className="grid grid-flow-col grid-rows-6 gap-x-6 gap-y-1 px-4 pb-3 text-sm tabular-nums">
        {levels.map((level, index) => (
          <li key={index} className="flex justify-between gap-2">
            <span className="text-white/50">{formatClockTime(index * settings.levelMinutes)}</span>
            <span>{formatBlinds(level)}</span>
          </li>
        ))}
      </ol>
    </details>
  )
}

type RebuyLimitDetailsProps = {
  settings: Settings
  field: (key: NumberSettingKey, label: string, className?: string) => ReactNode
}

/** Поле и подсказка для выбранного способа ограничения ребаев. */
function RebuyLimitDetails({ settings, field }: RebuyLimitDetailsProps) {
  switch (settings.rebuyLimit) {
    case 'perPlayer':
      return (
        <div className="mt-3">
          {field('rebuyMaxPerPlayer', 'Сколько ребаев можно одному игроку')}
        </div>
      )

    case 'time':
      return (
        <div className="mt-3">
          {field('rebuyMinutes', 'Ребаи открыты первые … минут')}
          {settings.rebuyMinutes > 0 && (
            <Hint>
              Это {formatMinutes(settings.rebuyMinutes)} игрового времени — паузы не считаются.
            </Hint>
          )}
        </div>
      )

    case 'bigBlind': {
      const threshold = settings.rebuyBigBlindBelow
      const showHint = blindsAreValid(settings) && threshold > settings.bigBlind
      const levels = showHint ? countLevelsWithBigBlindBelow(settings, threshold) : 0
      return (
        <div className="mt-3">
          {field('rebuyBigBlindBelow', 'Ребай можно, пока большой блайнд меньше')}
          {showHint && (
            <Hint>
              По этой шкале это {levels} {plural(levels, ['уровень', 'уровня', 'уровней'])} —
              первые {formatClockTime(levels * settings.levelMinutes)} игры без пауз.
            </Hint>
          )}
        </div>
      )
    }

    default:
      return <Hint>Выбывший игрок может докупиться в любой момент игры.</Hint>
  }
}
