import { useEffect, useState } from 'react'

/**
 * Текущее время, которое обновляется раз в секунду, — чтобы таймер на экране шёл.
 *
 * Важно: интервал здесь только перерисовывает экран. Само время таймера считается
 * от сохранённых отметок (см. src/game/clock.ts), поэтому ничего не сбивается,
 * если iPhone приостановит свёрнутое приложение.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const update = () => setNow(Date.now())
    const id = window.setInterval(update, intervalMs)
    // Когда приложение снова открыли — сразу обновить, не дожидаясь интервала.
    document.addEventListener('visibilitychange', update)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', update)
    }
  }, [intervalMs])

  return now
}
