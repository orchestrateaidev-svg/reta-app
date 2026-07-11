import { nextWeekday } from './dates'

// Local notifications for injection day (spec §5.1). Uses the Notification API
// with a lightweight in-page scheduler — no push server, nothing leaves the
// device. If permission isn't granted the app degrades silently to the
// on-dashboard "next injection" countdown.

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

let timer: number | undefined

/** Schedule a one-shot reminder for 9am on the next injection weekday, while
 *  the app/tab is open. Re-armed each app load; deliberately simple. */
export function scheduleInjectionReminder(weekday: number): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (timer) window.clearTimeout(timer)

  const nextKey = nextWeekday(weekday)
  const target = new Date(nextKey + 'T09:00:00')
  const delay = target.getTime() - Date.now()
  if (delay <= 0 || delay > 2_147_483_647) return // out of setTimeout range

  timer = window.setTimeout(() => {
    new Notification('Injection day', {
      body: 'Time for your weekly injection — log it in the app after.',
      icon: 'pwa-192.png',
      tag: 'reta-injection',
    })
  }, delay)
}
