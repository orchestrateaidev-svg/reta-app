import { db } from './db'
import { useLiveQuery } from 'dexie-react-hooks'

// ---------------------------------------------------------------------------
// SAFETY-CRITICAL MODULE (build-loop §0, §6, exit gate 2).
//
// This holds the prescriber's titration PLAN — retatrutide 4 → 8 → 12 mg.
// Hard rules enforced structurally here:
//   • Durations/dates are NEVER auto-filled. They start undefined.
//   • A step is only "active" once the user marks it agreedWithDoctor === true.
//   • The app never advances a step on its own, never suggests when to step up,
//     and never invents a dose. It records what the prescriber set.
// The doses in the seed (4/8/12 mg) are the exact figures the user's own
// prescriber guide specifies; the app is transcribing them, not recommending.
// ---------------------------------------------------------------------------

export interface TitrationStep {
  /** Stable index 0..n; also the display order. */
  index: number
  compound: string
  doseMg: number
  /** Blocking gate: the step only becomes active after the user confirms the
   *  prescriber agreed to it. Until then it is shown as "not yet confirmed". */
  agreedWithDoctor: boolean
  /** Only settable by the user, only after agreedWithDoctor. Never inferred. */
  startDate?: string // 'YYYY-MM-DD'
}

const KEY = 'titrationPlan'

export const SEEDED_TITRATION: TitrationStep[] = [
  { index: 0, compound: 'retatrutide', doseMg: 4, agreedWithDoctor: false },
  { index: 1, compound: 'retatrutide', doseMg: 8, agreedWithDoctor: false },
  { index: 2, compound: 'retatrutide', doseMg: 12, agreedWithDoctor: false },
]

export async function loadTitration(): Promise<TitrationStep[]> {
  const row = await db.settings.get(KEY)
  const plan = row?.value as TitrationStep[] | undefined
  return plan && plan.length ? plan : SEEDED_TITRATION.map((s) => ({ ...s }))
}

export async function saveTitration(plan: TitrationStep[]): Promise<void> {
  await db.settings.put({ key: KEY, value: plan })
}

export function useTitration(): TitrationStep[] | undefined {
  return useLiveQuery(async () => loadTitration(), [])
}

/** Confirm (or un-confirm) that the prescriber agreed to a step. This is the
 *  ONLY way a step becomes active. */
export async function setStepAgreed(index: number, agreed: boolean): Promise<void> {
  const plan = await loadTitration()
  const next = plan.map((s) =>
    s.index === index
      ? { ...s, agreedWithDoctor: agreed, startDate: agreed ? s.startDate : undefined }
      : s,
  )
  await saveTitration(next)
}

/** Set the start date the user was given by their prescriber. Guarded: a date
 *  cannot be attached to a step the doctor hasn't agreed to. */
export async function setStepStartDate(index: number, date?: string): Promise<void> {
  const plan = await loadTitration()
  const next = plan.map((s) =>
    s.index === index && s.agreedWithDoctor ? { ...s, startDate: date } : s,
  )
  await saveTitration(next)
}

/** The current dose = the highest agreed step whose start date has arrived.
 *  Returns undefined if nothing is confirmed/active yet. Never guesses. */
export function currentStep(
  plan: TitrationStep[],
  todayKey: string,
): TitrationStep | undefined {
  const active = plan
    .filter((s) => s.agreedWithDoctor && s.startDate && s.startDate <= todayKey)
    .sort((a, b) => (a.startDate! < b.startDate! ? 1 : -1))
  return active[0]
}

/** The next not-yet-confirmed step, for the readiness card. */
export function nextUnconfirmedStep(plan: TitrationStep[]): TitrationStep | undefined {
  return plan.find((s) => !s.agreedWithDoctor)
}
