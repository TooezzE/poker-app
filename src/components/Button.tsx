import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'lg' | 'md' | 'sm'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-amber-400 text-emerald-950 active:bg-amber-300',
  secondary: 'bg-white/10 text-white active:bg-white/20',
  danger: 'bg-red-500/20 text-red-100 active:bg-red-500/35',
  ghost: 'text-emerald-200 active:bg-white/10',
}

// Высота от 44px — минимальный удобный размер для пальца по рекомендациям Apple.
const sizeClasses: Record<Size, string> = {
  lg: 'h-14 px-6 text-lg',
  md: 'h-12 px-4 text-base',
  sm: 'h-11 px-3 text-sm',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  )
}
