// Domain types for the on-device data model (spec §4).
// Dates are stored as ISO date strings 'YYYY-MM-DD' for day-level records,
// and full ISO timestamps where a precise time matters (injections, water).

export type CompoundName = 'retatrutide' | 'tirzepatide' | string

/** A single prescribed titration/administration step. Doses are only ever
 *  what the prescriber set — the app never generates one. */
export interface Dose {
  id?: number
  date: string // ISO timestamp of the logged injection OR planned step start
  compound: CompoundName
  doseMg: number
  site?: InjectionSite
  notes?: string
  /** true = an actual logged injection event; false = a planned titration step */
  logged: boolean
}

export type InjectionSite =
  | 'abdomen-L'
  | 'abdomen-R'
  | 'thigh-L'
  | 'thigh-R'

export const INJECTION_SITES: InjectionSite[] = [
  'abdomen-L',
  'abdomen-R',
  'thigh-L',
  'thigh-R',
]

export type Symptom =
  | 'nausea'
  | 'constipation'
  | 'fatigue'
  | 'injection-site'
  | 'reflux'
  | 'dizziness'
  | 'vomiting'
  | 'abdominal-pain'
  | 'other'

export const SYMPTOMS: { key: Symptom; label: string }[] = [
  { key: 'nausea', label: 'Nausea' },
  { key: 'constipation', label: 'Constipation' },
  { key: 'fatigue', label: 'Fatigue' },
  { key: 'injection-site', label: 'Injection-site reaction' },
  { key: 'reflux', label: 'Reflux' },
  { key: 'dizziness', label: 'Dizziness' },
  { key: 'vomiting', label: 'Vomiting' },
  { key: 'abdominal-pain', label: 'Abdominal pain' },
  { key: 'other', label: 'Other' },
]

export interface SideEffect {
  id?: number
  date: string // ISO timestamp
  symptom: Symptom
  severity: 1 | 2 | 3 | 4 | 5
  notes?: string
}

export interface WeightEntry {
  id?: number
  date: string // 'YYYY-MM-DD'
  kg: number
  waistCm?: number
  bodyFatPct?: number
}

export type FoodTypeTag =
  | 'leanProtein'
  | 'vegFibre'
  | 'wholeCarb'
  | 'dairy'
  | 'highFat'
  | 'sugary'
  | 'carbonated'
  | 'alcohol'

export type FoodQuality = 'green' | 'amber' | 'red'

export interface FoodTypeMeta {
  key: FoodTypeTag
  label: string
  quality: FoodQuality
}

// The quality mapping is fixed clinical guidance, not user opinion.
export const FOOD_TYPES: FoodTypeMeta[] = [
  { key: 'leanProtein', label: 'Lean protein', quality: 'green' },
  { key: 'vegFibre', label: 'Veg & fibre', quality: 'green' },
  { key: 'wholeCarb', label: 'Whole carb', quality: 'green' },
  { key: 'dairy', label: 'Low-fat dairy', quality: 'green' },
  { key: 'highFat', label: 'High-fat / fried', quality: 'red' },
  { key: 'sugary', label: 'Sugary', quality: 'red' },
  { key: 'carbonated', label: 'Carbonated', quality: 'red' },
  { key: 'alcohol', label: 'Alcohol', quality: 'red' },
]

export function foodQuality(tag?: FoodTypeTag): FoodQuality | undefined {
  if (!tag) return undefined
  return FOOD_TYPES.find((f) => f.key === tag)?.quality
}

export interface Meal {
  id?: number
  date: string // ISO timestamp
  name: string
  kcal: number
  proteinG: number
  typeTag?: FoodTypeTag
  isFavourite?: boolean
}

export interface WaterEntry {
  id?: number
  date: string // ISO timestamp
  ml: number
}

export type WorkoutType = 'resistance' | 'cardio' | 'steps'

export interface WorkoutExercise {
  name: string
  sets?: number
  reps?: number
  loadKg?: number
}

export interface Workout {
  id?: number
  date: string // 'YYYY-MM-DD'
  type: WorkoutType
  exercises?: WorkoutExercise[]
  durationMin?: number
  steps?: number
  notes?: string
}

/** A tracked compound the DOCTOR prescribed. `scheduleText` is free-text the
 *  user copies from their prescriber — the app never fills a dose in here. */
export interface Compound {
  id?: number
  name: string
  prescribed: boolean
  scheduleText: string
  startDate?: string
  endDate?: string
}

export interface CoachReport {
  id?: number
  weekStart: string // 'YYYY-MM-DD'
  createdAt: string // ISO timestamp
  inputSnapshot: string // JSON string of the derived-stats snapshot sent
  reportMd: string
  model: string
}

export interface SettingRow {
  key: string
  value: unknown
}
