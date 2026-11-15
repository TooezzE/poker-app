import { useState } from 'react'
import { PreviousIcon } from '../components/icons'
import { Screen } from '../components/Screen'
import {
  formatDate,
  formatDuration,
  formatNumber,
  formatRebuys,
  formatTimeOfDay,
  plural,
} from '../format'
import { getGameSummary } from '../game/history'
import { useGameStore } from '../store/useGameStore'
import { OverviewScreen } from './OverviewScreen'

/** Экран «История игр»: список завершённых игр, по нажатию — обзор игры. */
export function HistoryScreen({ onBack }: { onBack: () => void }) {
  const history = useGameStore((s) => s.history)
  const deleteFromHistory = useGameStore((s) => s.deleteFromHistory)

  // Какая игра открыта (по времени начала). null — показываем список.
  const [openedAt, setOpenedAt] = useState<number | null>(null)
  const opened = history.find((game) => game.startedAt === openedAt)

  function open(startedAt: number | null) {
    setOpenedAt(startedAt)
    window.scrollTo(0, 0)
  }

  function handleDelete(startedAt: number) {
    if (window.confirm('Удалить эту игру из истории? Это нельзя отменить.')) {
      deleteFromHistory(startedAt)
      open(null)
    }
  }

  if (opened) {
    return (
      <OverviewScreen
        game={opened}
        backLabel="История"
        onBack={() => open(null)}
        onDelete={() => handleDelete(opened.startedAt)}
      />
    )
  }

  return (
    <Screen>
      <header className="pb-4">
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 flex h-11 items-center gap-1 px-2 text-emerald-300"
        >
          <PreviousIcon className="h-5 w-5" /> Назад
        </button>
        <h1 className="text-3xl font-bold">История игр</h1>
        <p className="text-sm text-emerald-300">
          {history.length} {plural(history.length, ['игра', 'игры', 'игр'])}
        </p>
      </header>

      {history.length === 0 ? (
        <p className="text-white/50">Пока пусто. Игра попадёт сюда, когда вы её завершите.</p>
      ) : (
        <ul className="flex flex-col gap-2 pb-6">
          {history.map((game) => {
            const summary = getGameSummary(game)
            return (
              <li key={summary.startedAt}>
                <button
                  type="button"
                  onClick={() => open(summary.startedAt)}
                  className="w-full rounded-2xl bg-white/5 px-4 py-3 text-left transition-colors active:bg-white/10"
                >
                  <div className="flex justify-between gap-3 text-sm text-emerald-300">
                    <span>
                      {formatDate(summary.startedAt)}, {formatTimeOfDay(summary.startedAt)}
                    </span>
                    <span className="shrink-0">{formatDuration(summary.duration)}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-3">
                    <span className="truncate text-lg font-semibold">
                      🏆 {summary.winnerName ?? '—'}
                    </span>
                    <span className="shrink-0 text-lg font-semibold tabular-nums text-amber-300">
                      {formatNumber(summary.bank)}
                    </span>
                  </div>
                  <div className="text-sm text-white/50">
                    {summary.playerCount}{' '}
                    {plural(summary.playerCount, ['игрок', 'игрока', 'игроков'])} ·{' '}
                    {formatRebuys(summary.totalRebuys)}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Screen>
  )
}
