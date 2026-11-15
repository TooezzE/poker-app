/** Плитка с показателем: подпись сверху, значение крупно. Используется внутри <dl>. */
export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2">
      <dt className="truncate text-xs text-emerald-300">{label}</dt>
      <dd className="truncate text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
