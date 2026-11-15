import { useEffect } from 'react'

/**
 * Пока `enabled` = true, экран телефона не гаснет (Screen Wake Lock API).
 *
 * Браузер сам снимает блокировку, когда приложение свёрнуто, поэтому при возвращении
 * в приложение мы запрашиваем её снова. Работает только по HTTPS — то есть после
 * публикации; при просмотре с компьютера по Wi-Fi (http://192.168…) экран будет гаснуть.
 */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return

    let lock: WakeLockSentinel | null = null
    let disposed = false

    async function request() {
      if (document.visibilityState !== 'visible' || (lock && !lock.released)) return
      try {
        const newLock = await navigator.wakeLock.request('screen')
        if (disposed) void newLock.release()
        else lock = newLock
      } catch {
        // Браузер может отказать (например, в режиме энергосбережения) —
        // тогда экран просто гаснет как обычно, приложение работает дальше.
      }
    }

    void request()
    document.addEventListener('visibilitychange', request)
    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', request)
      void lock?.release()
    }
  }, [enabled])
}
