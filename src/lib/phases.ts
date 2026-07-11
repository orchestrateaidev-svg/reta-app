import type { AppSettings } from '../db/settings'
import { daysBetween, todayKey, addDays } from './dates'

export type PhaseId = 1 | 2 | 3

export interface PhaseDef {
  id: PhaseId
  name: string
  weeks: string
  focus: string
  success: string
}

export const PHASES: PhaseDef[] = [
  {
    id: 1,
    name: 'Transition & Stabilise',
    weeks: 'Weeks 1–4',
    focus: 'Establish baselines, settle onto your titration, build the logging habit.',
    success: 'A steady logging streak and stable, tolerable side effects.',
  },
  {
    id: 2,
    name: 'Maximum Fat Loss',
    weeks: 'Weeks 5–18',
    focus: 'Sustained deficit, protein floor defended, resistance training banked.',
    success:
      '0.5–1%/week lost with protein at target 5+ days/week and 2+ resistance sessions/week.',
  },
  {
    id: 3,
    name: 'Maintenance Rehearsal',
    weeks: 'Weeks 19–26',
    focus:
      'Practise eating at maintenance while still on the drug, so the habits are set before you stop.',
    success: 'Weight stable within ±1 kg across four weeks with habits intact.',
  },
]

export interface PhaseStatus {
  current?: PhaseDef
  dayInProgram?: number
  daysToNextPhase?: number
  nextPhase?: PhaseDef
  configured: boolean
}

/** Determine the current phase purely from user-set dates. If dates are not
 *  configured, returns configured:false and the UI prompts the user to set them
 *  (aligned to their doctor's plan) — the app never invents a schedule. */
export function phaseStatus(s: AppSettings, ref = todayKey()): PhaseStatus {
  const { phase1Start, phase2Start, phase3Start, programEnd } = s
  if (!phase1Start) return { configured: false }

  const boundaries: { phase: PhaseDef; start: string; end?: string }[] = []
  const p1 = PHASES[0]
  const p2 = PHASES[1]
  const p3 = PHASES[2]
  boundaries.push({ phase: p1, start: phase1Start, end: phase2Start ?? phase3Start })
  if (phase2Start)
    boundaries.push({ phase: p2, start: phase2Start, end: phase3Start })
  if (phase3Start) boundaries.push({ phase: p3, start: phase3Start, end: programEnd })

  let current: PhaseDef | undefined
  let nextPhase: PhaseDef | undefined
  let daysToNextPhase: number | undefined

  for (let i = 0; i < boundaries.length; i++) {
    const b = boundaries[i]
    const afterStart = daysBetween(b.start, ref) >= 0
    const beforeEnd = !b.end || daysBetween(ref, b.end) > 0
    if (afterStart && beforeEnd) {
      current = b.phase
      const nb = boundaries[i + 1]
      if (nb) {
        nextPhase = nb.phase
        daysToNextPhase = daysBetween(ref, nb.start)
      } else if (programEnd) {
        daysToNextPhase = daysBetween(ref, programEnd)
      }
      break
    }
  }

  // Before the program starts.
  if (!current && daysBetween(ref, phase1Start) > 0) {
    nextPhase = p1
    daysToNextPhase = daysBetween(ref, phase1Start)
  }

  const dayInProgram = daysBetween(phase1Start, ref) + 1
  return {
    current,
    nextPhase,
    daysToNextPhase,
    dayInProgram: dayInProgram > 0 ? dayInProgram : undefined,
    configured: true,
  }
}

/** Sensible default phase dates derived from a program start: P1 = 4 weeks,
 *  P2 = 14 weeks, P3 = 8 weeks (26 weeks total). Offered as an editable
 *  starting point during onboarding; the user aligns them to their doctor. */
export function defaultPhaseDates(startKey: string): {
  phase1Start: string
  phase2Start: string
  phase3Start: string
  programEnd: string
} {
  return {
    phase1Start: startKey,
    phase2Start: addDays(startKey, 28),
    phase3Start: addDays(startKey, 28 + 14 * 7),
    programEnd: addDays(startKey, 26 * 7),
  }
}
