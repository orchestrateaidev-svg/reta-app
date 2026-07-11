import { describe, it, expect } from 'vitest'
import type { WeightEntry, Meal, SideEffect, Workout } from '../db/types'
import {
  smoothedWeightSeries,
  weeklyLossPct,
  proteinStreak,
  proteinAdherence,
  leanMassAlert,
  minFoodFloorAlert,
  leanMassProxy,
  hydrationPace,
} from './stats'
import { sideEffectDoseBanner, foodSideEffectPattern } from './correlations'
import {
  currentStep,
  nextUnconfirmedStep,
  SEEDED_TITRATION,
  type TitrationStep,
} from '../db/titration'
import { phaseStatus } from './phases'
import { trainingRecommendation, highFatigueWeek } from './exercise'
import type { AppSettings } from '../db/settings'

const REF = '2026-07-11'
// Mirror the app's LOCAL-date convention (todayKey/addDays use local Y/M/D, not
// UTC). Using toISOString here would shift keys by a day in +ve timezones.
function daysBefore(n: number): string {
  const d = new Date(REF + 'T00:00:00')
  d.setDate(d.getDate() - n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const w = (date: string, kg: number, waistCm?: number): WeightEntry => ({ date, kg, waistCm })
const meal = (date: string, proteinG: number, kcal: number): Meal => ({
  date: date + 'T12:00:00',
  name: 'x',
  proteinG,
  kcal,
})

describe('smoothed weight + weekly loss', () => {
  it('averages within a trailing 7-day window', () => {
    const series = smoothedWeightSeries([w(daysBefore(1), 100), w(REF, 98)])
    expect(series).toHaveLength(2)
    // last point averages both readings (within 7d)
    expect(series[1].smooth).toBeCloseTo(99, 5)
  })

  it('computes %/week loss from the smoothed trend', () => {
    // 2 kg lost over 14 days from 100kg => ~1%/week
    const weights = [w(daysBefore(14), 100), w(REF, 98)]
    const pct = weeklyLossPct(weights, 14, REF)
    expect(pct).not.toBeNull()
    expect(pct!).toBeCloseTo(1.0, 1)
  })

  it('returns null when there is not enough data', () => {
    expect(weeklyLossPct([w(REF, 100)], 14, REF)).toBeNull()
  })
})

describe('protein streak & adherence', () => {
  const target = 130
  it('counts consecutive days meeting the floor up to ref', () => {
    const meals = [meal(REF, 140, 600), meal(daysBefore(1), 135, 600), meal(daysBefore(2), 100, 600)]
    expect(proteinStreak(meals, target, REF)).toBe(2)
  })
  it('adherence only counts logged days', () => {
    const meals = [meal(REF, 140, 600), meal(daysBefore(1), 100, 600)]
    // 1 of 2 logged days met target
    expect(proteinAdherence(meals, target, 14, REF)).toBeCloseTo(0.5, 5)
  })
  it('adherence null when target unset', () => {
    expect(proteinAdherence([meal(REF, 100, 600)], undefined, 14, REF)).toBeNull()
  })
})

describe('lean-mass alert thresholds', () => {
  it('fires when loss > 1%/wk across two consecutive weeks', () => {
    // ~1.5%/wk both weeks
    const weights = [
      w(daysBefore(21), 103),
      w(daysBefore(14), 100),
      w(daysBefore(7), 98.5),
      w(REF, 97),
    ]
    const alert = leanMassAlert(weights, [], 130, REF)
    expect(alert).not.toBeNull()
    expect(alert!.id).toBe('lean-mass')
  })

  it('fires on low protein adherence during rapid loss', () => {
    const weights = [w(daysBefore(14), 100), w(REF, 97.5)] // 2.5% / 14d ≈ 1.25%/wk
    const meals = [meal(REF, 50, 600), meal(daysBefore(1), 40, 600), meal(daysBefore(2), 45, 600)]
    const alert = leanMassAlert(weights, meals, 130, REF)
    expect(alert).not.toBeNull()
  })

  it('does not fire on slow, steady loss', () => {
    const weights = [w(daysBefore(14), 100), w(REF, 99.3)] // ~0.25%/wk
    expect(leanMassAlert(weights, [], 130, REF)).toBeNull()
  })
})

describe('minimum-food-floor', () => {
  it('fires only when all of the last 3 days are logged and under the floor', () => {
    const meals = [meal(REF, 30, 700), meal(daysBefore(1), 30, 800), meal(daysBefore(2), 30, 600)]
    expect(minFoodFloorAlert(meals, 1000, REF)).not.toBeNull()
  })
  it('does NOT fire if a day is unlogged (never punishes missing data)', () => {
    const meals = [meal(REF, 30, 700), meal(daysBefore(2), 30, 600)] // day -1 missing
    expect(minFoodFloorAlert(meals, 1000, REF)).toBeNull()
  })
  it('does not fire if any day is above the floor', () => {
    const meals = [meal(REF, 30, 700), meal(daysBefore(1), 30, 1200), meal(daysBefore(2), 30, 600)]
    expect(minFoodFloorAlert(meals, 1000, REF)).toBeNull()
  })
})

describe('lean-mass proxy divergence', () => {
  it('flags weight down but waist holding', () => {
    const weights = [w(daysBefore(28), 100, 100), w(REF, 97, 99.8)]
    const p = leanMassProxy(weights, 28, REF)
    expect(p.divergence).toBe(true)
  })
  it('no divergence when waist also drops', () => {
    const weights = [w(daysBefore(28), 100, 100), w(REF, 97, 96)]
    expect(leanMassProxy(weights, 28, REF).divergence).toBe(false)
  })
})

describe('hydration pace', () => {
  it('reports behind-pace at midday', () => {
    const noon = new Date(REF + 'T13:30:00')
    const res = hydrationPace([{ date: REF + 'T08:00:00', ml: 250 }], 2750, noon)
    expect(res.expected).toBeGreaterThan(0)
    expect(res.behindMl).toBeGreaterThan(0)
    expect(res.consumed).toBe(250)
  })
})

describe('side-effect ↔ dose correlation (routes to prescriber)', () => {
  const plan: TitrationStep[] = [
    { index: 0, compound: 'retatrutide', doseMg: 4, agreedWithDoctor: true, startDate: daysBefore(2) },
  ]
  it('fires on a severity-4 symptom', () => {
    const se: SideEffect[] = [{ date: REF + 'T09:00:00', symptom: 'nausea', severity: 4 }]
    const b = sideEffectDoseBanner(se, plan)
    expect(b).not.toBeNull()
    expect(b!.body.toLowerCase()).toContain('prescriber')
  })
  it('fires on 2+ symptoms clustering within 72h of a step-up', () => {
    const se: SideEffect[] = [
      { date: daysBefore(2) + 'T10:00:00', symptom: 'nausea', severity: 2 },
      { date: daysBefore(1) + 'T10:00:00', symptom: 'fatigue', severity: 2 },
    ]
    expect(sideEffectDoseBanner(se, plan)).not.toBeNull()
  })
  it('stays silent on mild, isolated symptoms with no step-up nearby', () => {
    const noStep: TitrationStep[] = [
      { index: 0, compound: 'retatrutide', doseMg: 4, agreedWithDoctor: false },
    ]
    const se: SideEffect[] = [{ date: REF + 'T09:00:00', symptom: 'nausea', severity: 2 }]
    expect(sideEffectDoseBanner(se, noStep)).toBeNull()
  })
})

describe('food ↔ side-effect pattern', () => {
  it('names a red food type that repeatedly precedes nausea', () => {
    const meals: Meal[] = []
    const se: SideEffect[] = []
    for (let i = 0; i < 4; i++) {
      const d = daysBefore(i)
      meals.push({ date: d + 'T19:00:00', name: 'fry', proteinG: 20, kcal: 800, typeTag: 'highFat' })
      se.push({ date: d + 'T21:00:00', symptom: 'nausea', severity: 3 })
    }
    const p = foodSideEffectPattern(meals, se)
    expect(p).not.toBeNull()
    expect(p!.tag).toBe('highFat')
    expect(p!.hits).toBeGreaterThanOrEqual(3)
  })
  it('returns null without enough base rate', () => {
    const meals: Meal[] = [{ date: daysBefore(0) + 'T19:00:00', name: 'fry', proteinG: 20, kcal: 800, typeTag: 'highFat' }]
    const se: SideEffect[] = [{ date: daysBefore(0) + 'T21:00:00', symptom: 'nausea', severity: 3 }]
    expect(foodSideEffectPattern(meals, se)).toBeNull()
  })
})

describe('titration safety invariant', () => {
  it('seeds 4 → 8 → 12 mg with durations unset and unconfirmed', () => {
    expect(SEEDED_TITRATION.map((s) => s.doseMg)).toEqual([4, 8, 12])
    expect(SEEDED_TITRATION.every((s) => !s.agreedWithDoctor)).toBe(true)
    expect(SEEDED_TITRATION.every((s) => s.startDate === undefined)).toBe(true)
  })
  it('currentStep is undefined until a step is confirmed AND dated', () => {
    expect(currentStep(SEEDED_TITRATION, REF)).toBeUndefined()
    const confirmedNoDate: TitrationStep[] = [
      { index: 0, compound: 'retatrutide', doseMg: 4, agreedWithDoctor: true },
    ]
    expect(currentStep(confirmedNoDate, REF)).toBeUndefined()
  })
  it('currentStep returns the highest agreed+dated step that has started', () => {
    const plan: TitrationStep[] = [
      { index: 0, compound: 'retatrutide', doseMg: 4, agreedWithDoctor: true, startDate: daysBefore(40) },
      { index: 1, compound: 'retatrutide', doseMg: 8, agreedWithDoctor: true, startDate: daysBefore(10) },
      { index: 2, compound: 'retatrutide', doseMg: 12, agreedWithDoctor: false },
    ]
    expect(currentStep(plan, REF)!.doseMg).toBe(8)
    expect(nextUnconfirmedStep(plan)!.doseMg).toBe(12)
  })
  it('a future-dated confirmed step is not yet current', () => {
    const plan: TitrationStep[] = [
      { index: 0, compound: 'retatrutide', doseMg: 8, agreedWithDoctor: true, startDate: daysBefore(-5) },
    ]
    expect(currentStep(plan, REF)).toBeUndefined()
  })
})

describe('phase status', () => {
  const base: AppSettings = {
    onboarded: true,
    units: 'metric',
    theme: 'system',
    waterTargetMl: 2750,
    stepTarget: 7000,
    injectionWeekday: 0,
    coachModel: 'claude-sonnet-5',
    titrationSeeded: true,
    phase1Start: daysBefore(30),
    phase2Start: daysBefore(2),
    phase3Start: daysBefore(-90),
  }
  it('detects the current phase from user dates', () => {
    const s = phaseStatus(base, REF)
    expect(s.configured).toBe(true)
    expect(s.current?.id).toBe(2)
  })
  it('is unconfigured when no dates set', () => {
    const s = phaseStatus({ ...base, phase1Start: undefined }, REF)
    expect(s.configured).toBe(false)
  })
})

describe('exercise recommendation adapts down on rough weeks', () => {
  const fatigued: SideEffect[] = [
    { date: daysBefore(1) + 'T10:00:00', symptom: 'fatigue', severity: 4 },
    { date: daysBefore(2) + 'T10:00:00', symptom: 'fatigue', severity: 3 },
  ]
  it('flags a high-fatigue week', () => {
    expect(highFatigueWeek(fatigued, REF)).toBe(true)
  })
  it('returns a deload recommendation on a high-fatigue week', () => {
    const rec = trainingRecommendation(2, [], fatigued, 7000, REF)
    expect(rec.deload).toBe(true)
    expect(rec.resistanceTarget).toBe(1)
  })
  it('phase 2 pushes progressive overload when not fatigued', () => {
    const rec = trainingRecommendation(2, [] as Workout[], [], 7000, REF)
    expect(rec.deload).toBe(false)
    expect(rec.resistanceTarget).toBe(3)
    expect(rec.progressionPrompt).toBeTruthy()
  })
})
