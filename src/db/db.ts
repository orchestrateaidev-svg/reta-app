import Dexie, { type Table } from 'dexie'
import type {
  Dose,
  SideEffect,
  WeightEntry,
  Meal,
  WaterEntry,
  Workout,
  Compound,
  CoachReport,
  SettingRow,
} from './types'

// All data lives here, on-device, in IndexedDB. Nothing in this file — or
// anywhere in the app — sends a row off the device. The only outbound request
// in the whole app is the user-initiated Claude call in src/lib/coach.ts.
export class RetaDB extends Dexie {
  doses!: Table<Dose, number>
  sideEffects!: Table<SideEffect, number>
  weights!: Table<WeightEntry, number>
  meals!: Table<Meal, number>
  water!: Table<WaterEntry, number>
  workouts!: Table<Workout, number>
  compounds!: Table<Compound, number>
  coachReports!: Table<CoachReport, number>
  settings!: Table<SettingRow, string>

  constructor() {
    super('retatrutide-companion')
    this.version(1).stores({
      doses: '++id, date, compound, logged',
      sideEffects: '++id, date, symptom, severity',
      weights: '++id, date',
      meals: '++id, date, isFavourite, typeTag',
      water: '++id, date',
      workouts: '++id, date, type',
      compounds: '++id, name, prescribed',
      coachReports: '++id, weekStart, createdAt',
      settings: 'key',
    })
  }
}

export const db = new RetaDB()

/** Every table name, used by export/import and CSV dumps. */
export const TABLE_NAMES = [
  'doses',
  'sideEffects',
  'weights',
  'meals',
  'water',
  'workouts',
  'compounds',
  'coachReports',
  'settings',
] as const

export type TableName = (typeof TABLE_NAMES)[number]
