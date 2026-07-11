import type { WeightEntry, Meal, Workout, WaterEntry } from '../db/types'
import { addDays, dayKeyOf, daysBetween, todayKey } from './dates'

// ---------------------------------------------------------------------------
// Derived statistics (spec §4, exit gate 7). Pure functions over logged data,
// nothing stored. Thresholds are transcribed exactly from the spec:
//   • lean-mass alert: rate of loss > ~1%/wk for 2+ weeks, OR protein
//     adherence < 60% during rapid loss.
//   • minimum-food-floor: genuinely low intake sustained 3+ days.
// ---------------------------------------------------------------------------

export interface DayWeight {
  key: string
  kg: number // last reading of the day
}

/** Collapse weight entries to one value per day (last logged that day). */
export function dailyWeights(weights: WeightEntry[]): DayWeight[] {
  const byDay = new Map<string, WeightEntry>()
  for (const w of weights) {
    const k = w.date.length === 10 ? w.date : dayKeyOf(w.date)
    const existing = byDay.get(k)
    if (!existing || w.date >= existing.date) byDay.set(k, w)
  }
  return [...byDay.entries()]
    .map(([key, w]) => ({ key, kg: w.kg }))
    .sort((a, b) => (a.key < b.key ? -1 : 1))
}

/** Centred-trailing 7-day moving average of weight. For each day that has a
 *  reading, average all readings within the trailing 7 calendar days. */
export function smoothedWeightSeries(
  weights: WeightEntry[],
): { key: string; kg: number; smooth: number }[] {
  const days = dailyWeights(weights)
  if (!days.length) return []
  return days.map((d) => {
    const from = addDays(d.key, -6)
    const window = days.filter((x) => x.key >= from && x.key <= d.key)
    const smooth = window.reduce((s, x) => s + x.kg, 0) / window.length
    return { key: d.key, kg: d.kg, smooth }
  })
}

/** Weekly rate of loss as %/week, computed from the smoothed series over the
 *  trailing `windowDays`. Positive = losing weight. Needs >= 2 smoothed points
 *  spanning >= 3 days to be meaningful; otherwise returns null. */
export function weeklyLossPct(
  weights: WeightEntry[],
  windowDays = 14,
  ref = todayKey(),
): number | null {
  const series = smoothedWeightSeries(weights)
  if (series.length < 2) return null
  const from = addDays(ref, -windowDays)
  const win = series.filter((s) => s.key >= from && s.key <= ref)
  if (win.length < 2) return null
  const first = win[0]
  const last = win[win.length - 1]
  const span = daysBetween(first.key, last.key)
  if (span < 3 || first.smooth <= 0) return null
  const totalPct = ((first.smooth - last.smooth) / first.smooth) * 100
  return (totalPct / span) * 7
}

/** Per-week loss %, one value per ISO-ish week, for the last `weeks` weeks. */
export function weeklyLossHistory(
  weights: WeightEntry[],
  weeks = 4,
  ref = todayKey(),
): { weekEnd: string; pct: number | null }[] {
  const out: { weekEnd: string; pct: number | null }[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = addDays(ref, -i * 7)
    out.push({ weekEnd, pct: weeklyLossPct(weights, 14, weekEnd) })
  }
  return out
}

// ---- Protein --------------------------------------------------------------

export function proteinByDay(meals: Meal[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const meal of meals) {
    const k = dayKeyOf(meal.date)
    m.set(k, (m.get(k) ?? 0) + (meal.proteinG || 0))
  }
  return m
}

export function kcalByDay(meals: Meal[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const meal of meals) {
    const k = dayKeyOf(meal.date)
    m.set(k, (m.get(k) ?? 0) + (meal.kcal || 0))
  }
  return m
}

/** Consecutive days up to today meeting the protein target (>= target). */
export function proteinStreak(
  meals: Meal[],
  targetG: number | undefined,
  ref = todayKey(),
): number {
  if (!targetG) return 0
  const byDay = proteinByDay(meals)
  let streak = 0
  let cur = ref
  while ((byDay.get(cur) ?? 0) >= targetG) {
    streak++
    cur = addDays(cur, -1)
  }
  return streak
}

/** Fraction (0..1) of the last `days` days meeting the protein target. */
export function proteinAdherence(
  meals: Meal[],
  targetG: number | undefined,
  days = 14,
  ref = todayKey(),
): number | null {
  if (!targetG) return null
  const byDay = proteinByDay(meals)
  let met = 0
  let counted = 0
  for (let i = 0; i < days; i++) {
    const k = addDays(ref, -i)
    // Only count days where SOMETHING was logged, to avoid punishing
    // not-yet-logged days as failures.
    if (byDay.has(k)) {
      counted++
      if ((byDay.get(k) ?? 0) >= targetG) met++
    }
  }
  if (counted === 0) return null
  return met / counted
}

// ---- Training -------------------------------------------------------------

/** Resistance sessions in the trailing 7 days. */
export function resistanceSessions7d(workouts: Workout[], ref = todayKey()): number {
  const from = addDays(ref, -6)
  return workouts.filter(
    (w) => w.type === 'resistance' && w.date >= from && w.date <= ref,
  ).length
}

/** Consecutive weeks (ending today) with >= 2 resistance sessions. */
export function trainingStreakWeeks(workouts: Workout[], ref = todayKey()): number {
  let streak = 0
  for (let wk = 0; wk < 26; wk++) {
    const end = addDays(ref, -wk * 7)
    const start = addDays(end, -6)
    const n = workouts.filter(
      (w) => w.type === 'resistance' && w.date >= start && w.date <= end,
    ).length
    if (n >= 2) streak++
    else break
  }
  return streak
}

// ---- Lean-mass proxy ------------------------------------------------------

/** Weight-vs-waist divergence proxy. When weight falls but waist holds/rises,
 *  a larger share of loss may be lean mass. Returns a qualitative flag plus the
 *  deltas over the window. Explicitly a PROXY, surfaced as such in the UI. */
export interface LeanProxy {
  weightDeltaKg: number | null
  waistDeltaCm: number | null
  /** true when weight dropped meaningfully but waist barely moved. */
  divergence: boolean
}

export function leanMassProxy(
  weights: WeightEntry[],
  windowDays = 28,
  ref = todayKey(),
): LeanProxy {
  const from = addDays(ref, -windowDays)
  const inWin = weights
    .map((w) => ({ ...w, key: w.date.length === 10 ? w.date : dayKeyOf(w.date) }))
    .filter((w) => w.key >= from && w.key <= ref)
    .sort((a, b) => (a.key < b.key ? -1 : 1))
  const firstW = inWin[0]
  const lastW = inWin[inWin.length - 1]
  const weightDeltaKg = firstW && lastW ? lastW.kg - firstW.kg : null
  const waistPts = inWin.filter((w) => typeof w.waistCm === 'number')
  const firstWaist = waistPts[0]?.waistCm
  const lastWaist = waistPts[waistPts.length - 1]?.waistCm
  const waistDeltaCm =
    typeof firstWaist === 'number' && typeof lastWaist === 'number'
      ? lastWaist - firstWaist
      : null
  const divergence =
    weightDeltaKg !== null &&
    waistDeltaCm !== null &&
    weightDeltaKg < -1.5 &&
    waistDeltaCm > -1.0
  return { weightDeltaKg, waistDeltaCm, divergence }
}

// ---- Alerts (exact thresholds) --------------------------------------------

export interface Alert {
  id: string
  severity: 'info' | 'warn'
  title: string
  body: string
}

/** Lean-mass alert: loss > 1%/wk for 2+ weeks, OR protein adherence < 60%
 *  while losing rapidly (> 1%/wk this window). */
export function leanMassAlert(
  weights: WeightEntry[],
  meals: Meal[],
  proteinTargetG: number | undefined,
  ref = todayKey(),
): Alert | null {
  const hist = weeklyLossHistory(weights, 2, ref)
  const bothWeeksRapid =
    hist.length === 2 && hist.every((h) => h.pct !== null && h.pct > 1)
  const thisWeek = weeklyLossPct(weights, 14, ref)
  const adherence = proteinAdherence(meals, proteinTargetG, 14, ref)
  const lowProteinDuringRapid =
    thisWeek !== null && thisWeek > 1 && adherence !== null && adherence < 0.6

  if (!bothWeeksRapid && !lowProteinDuringRapid) return null
  const reason = bothWeeksRapid
    ? 'Your smoothed weight has been falling faster than about 1% per week for two or more weeks.'
    : 'You are losing weight quickly while hitting your protein floor on fewer than 60% of logged days.'
  return {
    id: 'lean-mass',
    severity: 'warn',
    title: 'Protect your lean mass',
    body:
      `${reason} Fast loss with low protein raises the share of weight lost as muscle. ` +
      'Prioritise your protein floor and resistance sessions this week, and consider raising the pace of loss with your prescriber or dietitian.',
  }
}

/** Minimum-food-floor: genuinely low intake sustained 3+ days. "Genuinely low"
 *  = a logged day under `floorKcal` (default 1000). Only fires when the last 3
 *  days ALL have meals logged and all fall under the floor — never punishes an
 *  unlogged day, and framed as "discuss with your doctor", not a target. */
export function minFoodFloorAlert(
  meals: Meal[],
  floorKcal = 1000,
  ref = todayKey(),
): Alert | null {
  const byDay = kcalByDay(meals)
  for (let i = 0; i < 3; i++) {
    const k = addDays(ref, -i)
    const v = byDay.get(k)
    if (v === undefined || v >= floorKcal) return null
  }
  return {
    id: 'min-food-floor',
    severity: 'warn',
    title: 'Very low intake for 3 days',
    body:
      'Your logged energy intake has been under ~1000 kcal for three days running. ' +
      'Appetite suppression can make under-eating easy to miss. This is worth discussing ' +
      'with your doctor or dietitian — it is a flag to raise, not a target to hit.',
  }
}

// ---- Hydration ------------------------------------------------------------

export function waterTotalForDay(water: WaterEntry[], key = todayKey()): number {
  return water
    .filter((w) => dayKeyOf(w.date) === key)
    .reduce((s, w) => s + (w.ml || 0), 0)
}

/** Escalating hydration pace: expected intake by this hour is a linear ramp
 *  across waking hours (07:00–22:00). Returns how far behind pace, in ml. */
export function hydrationPace(
  water: WaterEntry[],
  targetMl: number,
  now = new Date(),
): { consumed: number; expected: number; behindMl: number } {
  const consumed = waterTotalForDay(water, todayKey(now))
  const startHour = 7
  const endHour = 22
  const h = now.getHours() + now.getMinutes() / 60
  const frac = Math.min(1, Math.max(0, (h - startHour) / (endHour - startHour)))
  const expected = Math.round(targetMl * frac)
  return { consumed, expected, behindMl: Math.max(0, expected - consumed) }
}
