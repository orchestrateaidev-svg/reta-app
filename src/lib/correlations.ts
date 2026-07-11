import type { SideEffect, Meal, FoodTypeTag } from '../db/types'
import type { TitrationStep } from '../db/titration'
import { FOOD_TYPES } from '../db/types'
import { dayKeyOf } from './dates'

// ---------------------------------------------------------------------------
// Correlations (spec §5.1, §5.3). These NEVER diagnose or advise treatment.
// They surface a pattern and route it to the prescriber. Wording is fixed here
// so no code path can turn an observation into medical advice.
// ---------------------------------------------------------------------------

const HOUR = 3_600_000

/** Side-effect ↔ dose step-up: fires when any side effect has severity >= 4,
 *  OR two or more side effects cluster within 72h AFTER a confirmed step-up's
 *  start date. Returns a raise-with-prescriber banner or null. */
export function sideEffectDoseBanner(
  sideEffects: SideEffect[],
  titration: TitrationStep[],
): { title: string; body: string } | null {
  const severe = sideEffects.find((s) => s.severity >= 4)

  const stepUps = titration.filter((s) => s.agreedWithDoctor && s.startDate)
  let clustered = false
  for (const step of stepUps) {
    const start = new Date(step.startDate + 'T00:00:00').getTime()
    const within = sideEffects.filter((s) => {
      const t = new Date(s.date).getTime()
      return t >= start && t - start <= 72 * HOUR
    })
    if (within.length >= 2) {
      clustered = true
      break
    }
  }

  if (!severe && !clustered) return null
  const lead = severe
    ? 'You logged a side effect rated 4 or R in severity.'
    : 'Two or more side effects clustered within 72 hours of a dose step-up.'
  return {
    title: 'Worth raising with your prescriber',
    body:
      `${lead} This is information to bring to your prescriber — the app does not ` +
      'diagnose or advise on treatment. If symptoms are severe or worsening, contact your doctor promptly.',
  }
}

/** Food-type ↔ side-effect: for each red-quality food tag, count how often a
 *  nausea/reflux entry falls within `windowH` hours AFTER a meal with that tag.
 *  Returns the strongest pattern as a plain observation (never advice). */
export function foodSideEffectPattern(
  meals: Meal[],
  sideEffects: SideEffect[],
  windowH = 6,
): { tag: FoodTypeTag; label: string; hits: number; total: number } | null {
  const gutSymptoms = sideEffects.filter(
    (s) => s.symptom === 'nausea' || s.symptom === 'reflux',
  )
  if (!gutSymptoms.length) return null

  const redTags = FOOD_TYPES.filter((f) => f.quality === 'red')
  let best: { tag: FoodTypeTag; label: string; hits: number; total: number } | null =
    null

  for (const ft of redTags) {
    const tagged = meals.filter((m) => m.typeTag === ft.key)
    if (tagged.length < 3) continue // need a minimum base rate to claim a pattern
    let hits = 0
    for (const meal of tagged) {
      const mt = new Date(meal.date).getTime()
      const followed = gutSymptoms.some((s) => {
        const st = new Date(s.date).getTime()
        return st >= mt && st - mt <= windowH * HOUR
      })
      if (followed) hits++
    }
    // Only report if the pattern is more often than not.
    if (hits >= 3 && hits / tagged.length >= 0.5) {
      if (!best || hits > best.hits) {
        best = { tag: ft.key, label: ft.label, hits, total: tagged.length }
      }
    }
  }
  return best
}

export function foodPatternSentence(p: {
  label: string
  hits: number
  total: number
}): string {
  return `Nausea or reflux followed ${p.label.toLowerCase()} meals ${p.hits} of the last ${p.total} times you logged them.`
}

/** Group side effects by day for the dose-timeline overlay. */
export function sideEffectsByDay(sideEffects: SideEffect[]): Map<string, SideEffect[]> {
  const m = new Map<string, SideEffect[]>()
  for (const s of sideEffects) {
    const k = dayKeyOf(s.date)
    const arr = m.get(k) ?? []
    arr.push(s)
    m.set(k, arr)
  }
  return m
}
