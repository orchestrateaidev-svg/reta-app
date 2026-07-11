import type { Workout, SideEffect } from '../db/types'
import type { PhaseId } from './phases'
import { addDays, todayKey } from './dates'
import { resistanceSessions7d } from './stats'

// Phase-aware training recommendation (spec §5.2). This recommends TRAINING,
// never dosing. It also adapts DOWN on rough weeks rather than pushing.

export interface SessionMove {
  pattern: string
  example: string
}

/** Bundled minimal-effective-dose full-body template — 6 movement patterns. */
export const RESISTANCE_TEMPLATE: SessionMove[] = [
  { pattern: 'Squat', example: 'Goblet squat or leg press' },
  { pattern: 'Hinge', example: 'Romanian deadlift or kip thrust' },
  { pattern: 'Horizontal push', example: 'Push-up or chest press' },
  { pattern: 'Horizontal pull', example: 'Row (cable or dumbbell)' },
  { pattern: 'Vertical pull', example: 'Lat pulldown or assisted pull-up' },
  { pattern: 'Carry / core', example: 'Farmer carry or dead-bug' },
]

export interface TrainingRec {
  headline: string
  detail: string
  resistanceTarget: number
  cardioNote?: string
  deload: boolean
  progressionPrompt?: string
}

/** High-fatigue week = 2+ fatigue/dizziness entries at severity >= 3 in the
 *  trailing 7 days, or any severity-5 entry. Triggers a deload. */
export function highFatigueWeek(sideEffects: SideEffect[], ref = todayKey()): boolean {
  const from = addDays(ref, -6)
  const win = sideEffects.filter((s) => s.date >= from + 'T00:00:00' && s.date <= ref + 'T23:59:59')
  const tired = win.filter(
    (s) => (s.symptom === 'fatigue' || s.symptom === 'dizziness') && s.severity >= 3,
  )
  const anySevere = win.some((s) => s.severity >= 5)
  return tired.length >= 2 || anySevere
}

export function trainingRecommendation(
  phase: PhaseId | undefined,
  workouts: Workout[],
  sideEffects: SideEffect[],
  stepTarget: number,
  ref = todayKey(),
): TrainingRec {
  const doneThisWeek = resistanceSessions7d(workouts, ref)
  const deload = highFatigueWeek(sideEffects, ref)

  // Rough week overrides the phase target with a protective fallback.
  if (deload) {
    return {
      headline: 'Ease off this week',
      detail:
        'Your side-effect log shows a high-fatigue week. Swap intensity for a short, ' +
        'easy session — even 15 minutes of light resistance keeps the habit without digging a hole.',
      resistanceTarget: 1,
      cardioNote: 'Gentle walking to your step target if you feel up to it.',
      deload: true,
    }
  }

  if (phase === 3) {
    return {
      headline: 'Maintain the frequency that sticks',
      detail:
        'Keep resistance training at the frequency you can sustain after the drug — this is the ' +
        'strongest predictor of keeping fat off. Build the walking/cardio habit that will carry on too.',
      resistanceTarget: 2,
      cardioNote: `Daily movement toward ${stepTarget.toLocaleString()} steps.`,
      deload: false,
      progressionPrompt:
        doneThisWeek > 0 ? 'Hold your loads steady; consistency beats maxing out now.' : undefined,
    }
  }

  if (phase === 2) {
    return {
      headline: 'Bank the muscle while you lose fat',
      detail:
        '2–3 full-body resistance sessions with progressive overload, plus two easy zone-2 cardio blocks ' +
        'or your step target. Protein floor first, then train.',
      resistanceTarget: 3,
      cardioNote: `Two zone-2 blocks, or ${stepTarget.toLocaleString()} steps most days.`,
      deload: false,
      progressionPrompt: 'Add 2.5 kg or 1 rep versus last session on each movement.',
    }
  }

  // Phase 1 (or unset): build the habit gently.
  return {
    headline: 'Build the habit gently',
    detail:
      'Two easy full-body resistance sessions this week at comfortable loads, and daily movement. ' +
      'The goal now is consistency and learning the movements, not intensity.',
    resistanceTarget: 2,
    cardioNote: `Daily movement toward ${stepTarget.toLocaleString()} steps.`,
    deload: false,
  }
}
