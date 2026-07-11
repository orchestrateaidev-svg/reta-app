import { db } from './db'
import { useLiveQuery } from 'dexie-react-hooks'

export type Units = 'metric' | 'imperial'
export type ThemePref = 'system' | 'light' | 'dark'

export interface AppSettings {
  // Identity of the program (all user-set, aligned with their clinician)
  onboarded: boolean
  units: Units
  theme: ThemePref
  startWeightKg?: number
  goalWeightKg?: number
  heightCm?: number
  // Protective targets — floors the user sets WITH their clinician, never
  // scores the app invents. See build-loop §6.
  proteinTargetG?: number
  waterTargetMl: number
  stepTarget: number
  // Program timing (user-set to match the doctor's plan)
  injectionWeekday: number // 0=Sun..6=Sat
  phase1Start?: string // 'YYYY-MM-DD'
  phase2Start?: string
  phase3Start?: string
  programEnd?: string
  // AI coach
  apiKey?: string
  coachModel: string
  // Housekeeping
  lastExport?: string // ISO timestamp
  titrationSeeded: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  onboarded: false,
  units: 'metric',
  theme: 'system',
  waterTargetMl: 2750, // mid-point of the 2.5–3 L protective default
  stepTarget: 7000,
  injectionWeekday: 0,
  coachModel: 'claude-sonnet-5',
  titrationSeeded: false,
}

const SETTINGS_KEY = 'app'

export async function loadSettings(): Promise<AppSettings> {
  const row = await db.settings.get(SETTINGS_KEY)
  return { ...DEFAULT_SETTINGS, ...(row?.value as Partial<AppSettings>) }
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<void> {
  const current = await loadSettings()
  const next = { ...current, ...patch }
  await db.settings.put({ key: SETTINGS_KEY, value: next })
}

/** Reactive settings hook. Returns undefined until first load resolves. */
export function useSettings(): AppSettings | undefined {
  return useLiveQuery(async () => loadSettings(), [])
}

/** Suggested protein floor: 1.6–2.2 g/kg of goal weight. Presented as a
 *  default the user confirms with their clinician — never auto-applied as a
 *  score to hit. Returns the low/high band for display. */
export function proteinBand(goalWeightKg?: number): { low: number; high: number } | undefined {
  if (!goalWeightKg || goalWeightKg <= 0) return undefined
  return {
    low: Math.round(goalWeightKg * 1.6),
    high: Math.round(goalWeightKg * 2.2),
  }
}
