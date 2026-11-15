// Простые иконки в SVG. Символы ▶ и ⏸ на iPhone превращаются в цветные эмодзи,
// поэтому рисуем их сами.

type IconProps = { className?: string }

const base = 'h-6 w-6 fill-current'

export function PlayIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`}>
      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
    </svg>
  )
}

export function PauseIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`}>
      <rect x="5" y="4" width="5" height="16" rx="1.5" />
      <rect x="14" y="4" width="5" height="16" rx="1.5" />
    </svg>
  )
}

export function PreviousIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`}>
      <path d="M15.5 4.5 7 12l8.5 7.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function NextIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`}>
      <path d="M8.5 4.5 17 12l-8.5 7.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
