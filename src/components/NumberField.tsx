import { useState } from 'react'

type Props = {
  label: string
  value: number
  onChange: (value: number) => void
  className?: string
}

/** Поле для ввода целого числа. На iPhone открывает цифровую клавиатуру. */
export function NumberField({ label, value, onChange, className = '' }: Props) {
  // Текст храним отдельно от числа, чтобы поле можно было очистить и ввести заново.
  const [text, setText] = useState(value > 0 ? String(value) : '')

  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-sm text-emerald-200">{label}</span>
      <input
        inputMode="numeric"
        value={text}
        onChange={(event) => {
          const digits = event.target.value
            .replace(/\D/g, '') // только цифры
            .replace(/^0+(?=\d)/, '') // без нулей в начале
            .slice(0, 9)
          setText(digits)
          onChange(digits === '' ? 0 : Number(digits))
        }}
        className="h-12 rounded-xl bg-white/10 px-3 text-lg tabular-nums text-white outline-none focus:ring-2 focus:ring-amber-400"
      />
    </label>
  )
}
