// Date helpers. All "day keys" are local-date 'YYYY-MM-DD' strings so that a
// log at 11pm and one at 1am the next day fall on the correct calendar days.

export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function dayKeyOf(iso: string): string {
  return todayKey(new Date(iso))
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function addDays(key: string, n: number): string {
  const d = new Date(key + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return todayKey(d)
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime()
  const db = new Date(b + 'T00:00:00').getTime()
  return Math.round((db - da) / 86_400_000)
}

/** Inclusive list of day keys from `from` to `to`. */
export function dayRange(from: string, to: string): string[] {
  const out: string[] = []
  let cur = from
  // Guard against inverted ranges.
  if (daysBetween(from, to) < 0) return out
  while (daysBetween(cur, to) >= 0) {
    out.push(cur)
    cur = addDays(cur, 1)
  }
  return out
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export function weekdayLabel(n: number): string {
  return WEEKDAYS[((n % 7) + 7) % 7]
}

/** Next occurrence (>= today) of a given weekday, as a day key. */
export function nextWeekday(weekday: number, from = new Date()): string {
  const cur = from.getDay()
  const delta = (((weekday - cur) % 7) + 7) % 7
  return addDays(todayKey(from), delta)
}

export function formatDayHuman(key: string): string {
  const d = new Date(key + 'T00:00:00')
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
