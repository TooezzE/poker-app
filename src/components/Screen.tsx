import type { ReactNode } from 'react'

/** Каркас экрана: ширина под телефон и отступ под «чёлку» iPhone. */
export function Screen({ children }: { children: ReactNode }) {
  return <div className="pt-safe mx-auto flex min-h-dvh max-w-md flex-col px-4">{children}</div>
}

/** Панель, прилипающая к низу экрана, — для главной кнопки под большим пальцем. */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="pb-safe sticky bottom-0 -mx-4 mt-auto border-t border-white/10 bg-emerald-950/95 px-4 pt-3 backdrop-blur">
      {children}
    </div>
  )
}
