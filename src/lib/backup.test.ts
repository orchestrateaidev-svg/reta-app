import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db/db'
import { buildBackup, importJson, wipeAll } from './backup'
import { saveSettings, loadSettings } from '../db/settings'
import { loadTitration, setStepAgreed } from '../db/titration'

describe('backup round-trip (gate 5)', () => {
  beforeEach(async () => {
    await wipeAll()
  })

  it('exports and re-imports all tables losslessly', async () => {
    // Seed a representative slice of every table.
    await db.weights.bulkAdd([
      { date: '2026-07-01', kg: 104, waistCm: 100 },
      { date: '2026-07-08', kg: 102.5 },
    ])
    await db.meals.add({ date: '2026-07-08T12:00:00', name: 'Chicken', kcal: 246, proteinG: 46, typeTag: 'leanProtein' })
    await db.water.add({ date: '2026-07-08T09:00:00', ml: 500 })
    await db.workouts.add({ date: '2026-07-08', type: 'resistance', durationMin: 40 })
    await db.sideEffects.add({ date: '2026-07-08T20:00:00', symptom: 'nausea', severity: 2 })
    await db.doses.add({ date: '2026-07-08T08:00:00', compound: 'retatrutide', doseMg: 4, site: 'abdomen-L', logged: true })
    await saveSettings({ onboarded: true, proteinTargetG: 136 })
    await setStepAgreed(0, true)

    const backup = await buildBackup()
    const before = {
      weights: await db.weights.count(),
      meals: await db.meals.count(),
      settingsProtein: (await loadSettings()).proteinTargetG,
      titrationAgreed: (await loadTitration())[0].agreedWithDoctor,
    }

    // Wipe everything, then restore.
    await wipeAll()
    expect(await db.weights.count()).toBe(0)

    const counts = await importJson(backup)
    expect(counts.weights).toBe(2)

    const after = {
      weights: await db.weights.count(),
      meals: await db.meals.count(),
      settingsProtein: (await loadSettings()).proteinTargetG,
      titrationAgreed: (await loadTitration())[0].agreedWithDoctor,
    }
    expect(after).toEqual(before)

    // Deep-check a row survived intact.
    const meal = await db.meals.toArray()
    expect(meal[0]).toMatchObject({ name: 'Chicken', proteinG: 46, typeTag: 'leanProtein' })
  })

  it('rejects a non-companion backup file', async () => {
    await expect(
      importJson({ app: 'something-else' as 'retatrutide-companion', version: 1, exportedAt: '', tables: {} }),
    ).rejects.toThrow()
  })
})
