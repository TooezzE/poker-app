import { Button } from '../components/Button'
import { PreviousIcon } from '../components/icons'
import { Screen } from '../components/Screen'
import { Stat } from '../components/Stat'
import {
  formatBlinds,
  formatDate,
  formatDuration,
  formatNumber,
  formatRebuys,
  formatSigned,
  formatTimeOfDay,
} from '../format'
import { getBlindLevel } from '../game/blinds'
import { getPlayerNet, getStandings, getWinner } from '../game/game'
import { getFinalBust, getGameStats } from '../game/stats'
import type { BlindLevel, Game, GameEvent } from '../game/types'

const EVENT_LABELS: Record<GameEvent['type'], { text: string; className: string }> = {
  bust: { text: 'вылет', className: 'text-red-300' },
  rebuy: { text: 'ребай', className: 'text-amber-300' },
  join: { text: 'вход в игру', className: 'text-emerald-300' },
}

type Props = {
  game: Game
  /** Куда ведёт кнопка «назад» — подпись, например «Итоги» или «История». */
  backLabel: string
  onBack: () => void
  /** Если передано — внизу появляется кнопка «Удалить из истории». */
  onDelete?: () => void
}

/** Экран «Обзор игры»: статистика, итоги игроков и история вылетов и ребаев. */
export function OverviewScreen({ game, backLabel, onBack, onDelete }: Props) {
  const end = game.finishedAt ?? game.startedAt
  const stats = getGameStats(game, end)
  const winner = getWinner(game)
  const { settings } = game
  const nameOf = (playerId: string) => game.players.find((p) => p.id === playerId)?.name ?? '—'

  return (
    <Screen>
      <header className="pb-4">
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 flex h-11 items-center gap-1 px-2 text-emerald-300"
        >
          <PreviousIcon className="h-5 w-5" /> {backLabel}
        </button>
        <h1 className="text-3xl font-bold">Обзор игры</h1>
        <p className="text-sm text-emerald-300">
          {formatDate(game.startedAt)}, {formatTimeOfDay(game.startedAt)}–{formatTimeOfDay(end)}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-2">
        <Stat label="Длительность" value={formatDuration(stats.duration)} />
        <Stat
          label="Перерывы"
          value={stats.breaks >= 60_000 ? formatDuration(stats.breaks) : 'не было'}
        />
        <Stat label={`Последний уровень (${stats.lastLevel})`} value={formatBlinds(stats.lastBlinds)} />
        <Stat label="Банк" value={formatNumber(stats.bank)} />
        <Stat label="Бай-ины" value={`${game.players.length} × ${formatNumber(settings.buyIn)}`} />
        <Stat label="Ребаи" value={`${stats.totalRebuys} × ${formatNumber(settings.rebuyCost)}`} />
      </dl>
      {stats.mostRebuys && (
        <p className="mt-2 text-sm text-emerald-200">
          Больше всего ребаев: {stats.mostRebuys.players.map((p) => p.name).join(', ')} (
          {stats.mostRebuys.players.length > 1 ? 'по ' : ''}
          {stats.mostRebuys.count})
        </p>
      )}

      <h2 className="mt-8 mb-2 text-lg font-semibold">Игроки</h2>
      <ol className="divide-y divide-white/10 rounded-2xl bg-white/5">
        {getStandings(game).map(({ player, place }) => {
          const finalBust = getFinalBust(game, player)
          const net = getPlayerNet(game, player)
          return (
            <li key={player.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 tabular-nums text-emerald-300">{place}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg">{player.name}</div>
                <div className="text-sm text-white/50">
                  {formatRebuys(player.rebuys)} ·{' '}
                  {finalBust ? `вылет на ${formatBlinds(finalBust.blinds)}` : 'победитель'}
                </div>
              </div>
              <span
                className={`font-semibold tabular-nums ${net > 0 ? 'text-amber-300' : 'text-white/70'}`}
              >
                {formatSigned(net)}
              </span>
            </li>
          )
        })}
      </ol>

      <h2 className="mt-8 mb-2 text-lg font-semibold">История</h2>
      <ol>
        <HistoryRow
          time={game.startedAt}
          title="Начало игры"
          blinds={getBlindLevel(settings, 0)}
          level={0}
        />
        {game.events.map((event, index) => (
          <HistoryRow
            key={index}
            time={event.at}
            title={nameOf(event.playerId)}
            label={EVENT_LABELS[event.type]}
            blinds={event.blinds}
            level={event.level}
          />
        ))}
        <HistoryRow
          time={end}
          title="Конец игры"
          label={winner ? { text: `победитель — ${winner.name}`, className: 'text-amber-300' } : undefined}
          blinds={stats.lastBlinds}
          level={stats.lastLevel - 1}
        />
      </ol>

      <div className="pb-safe mt-auto pt-8">
        <Button className="w-full" onClick={onBack}>
          Назад
        </Button>
        {onDelete && (
          <Button variant="danger" size="sm" className="mt-3 w-full" onClick={onDelete}>
            Удалить из истории
          </Button>
        )}
      </div>
    </Screen>
  )
}

type HistoryRowProps = {
  time: number
  title: string
  label?: { text: string; className: string }
  blinds: BlindLevel
  level: number
}

/** Строка истории: время, кто и что, блайнды в этот момент. */
function HistoryRow({ time, title, label, blinds, level }: HistoryRowProps) {
  return (
    <li className="flex items-center gap-3 border-b border-white/10 py-2">
      <span className="w-11 shrink-0 text-sm tabular-nums text-white/50">
        {formatTimeOfDay(time)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{title}</div>
        {label && <div className={`text-sm ${label.className}`}>{label.text}</div>}
      </div>
      <div className="shrink-0 text-right tabular-nums">
        <div className="text-sm text-emerald-100">{formatBlinds(blinds)}</div>
        <div className="text-xs text-white/40">уровень {level + 1}</div>
      </div>
    </li>
  )
}
