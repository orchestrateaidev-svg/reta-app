import { useState } from 'react'
import { Button, Card, Field, Select, TextInput } from '../components/ui'
import { DEFAULT_SETTINGS, proteinBand, saveSettings, type Units } from '../db/settings'
import { defaultPhaseDates } from '../lib/phases'
import { displayToKg, displayToCm, weightUnit, lengthUnit } from '../lib/units'
import { todayKey } from '../lib/dates'
import { loadTitration, saveTitration } from '../db/titration'
import { useToast } from '../components/Toast'

// First-run setup. Captures the protective targets and program dates the user
// aligns with their clinician. Nothing here generates a dose — the titration
// plan is seeded with durations unset (see db/titration.ts).
export default function Onboarding() {
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [units, setUnits] = useState<Units>('metric')
  const [startWeight, setStartWeight] = useState('')
  const [goalWeight, setGoalWeight] = useState('')
  const [height, setHeight] = useState('')
  const [protein, setProtein] = useState('')
  const [injectionWeekday, setInjectionWeekday] = useState('0')
  const [programStart, setProgramStart] = useState(todayKey())

  const goalKg = goalWeight ? displayToKg(Number(goalWeight), units) : undefined
  const band = proteinBand(goalKg)

  async function finish() {
    const dates = defaultPhaseDates(programStart)
    await saveSettings({
      ...DEFAULT_SETTINGS,
      onboarded: true,
      units,
      startWeightKg: startWeight ? displayToKg(Number(startWeight), units) : undefined,
      goalWeightKg: goalKg,
      heightCm: height ? displayToCm(Number(height), units) : undefined,
      proteinTargetG: protein ? Number(protein) : band ? band.low : undefined,
      injectionWeekday: Number(injectionWeekday),
      ...dates,
      titrationSeeded: true,
    })
    // Ensure the seeded 4→8→12 plan exists (durations unset, unconfirmed).
    const plan = await loadTitration()
    await saveTitration(plan)
    toast('Setup complete')
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 py-8">
      <div className="mb-6">
        <div className="text-2xl font-bold tracking-tight">Retatrutide Companion</div>
        <p className="mt-1 text-sm text-muted">
          A private companion to your doctor-supervised program. Everything you enter stays
          on this device. This app never sets or suggests a dose — your prescriber does that.
        </p>
      </div>

      {step === 0 && (
        <Card className="space-y-4">
          <h2 className="font-semibold">Units</h2>
          <Field label="Measurement units">
            <Select value={units} onChange={(e) => setUnits(e.target.value as Units)}>
              <option value="metric">Metric (kg, cm, L)</option>
              <option value="imperial">Imperial (lb, in, fl oz)</option>
            </Select>
          </Field>
          <Field label={`Starting weight (${weightUnit(units)})`}>
            <TextInput
              type="number"
              inputMode="decimal"
              value={startWeight}
              onChange={(e) => setStartWeight(e.target.value)}
              placeholder="optional"
            />
          </Field>
          <Field label={`Goal weight (${weightUnit(units)})`} hint="Used only to suggest a protein floor.">
            <TextInput
              type="number"
              inputMode="decimal"
              value={goalWeight}
              onChange={(e) => setGoalWeight(e.target.value)}
              placeholder="optional"
            />
          </Field>
          <Field label={`Height (${lengthUnit(units)})`}>
            <TextInput
              type="number"
              inputMode="decimal"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="optional"
            />
          </Field>
          <Button onClick={() => setStep(1)}>Next</Button>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-4">
          <h2 className="font-semibold">Protective targets</h2>
          <p className="text-sm text-muted">
            These are floors to defend your lean mass and wellbeing — set them with your
            doctor or dietitian, not as scores to beat.
          </p>
          <Field
            label="Daily protein floor (g)"
            hint={
              band
                ? `Evidence suggests ~${band.low}–${band.high} g for you (1.6–2.2 g/kg of goal weight). Confirm with your clinician.`
                : 'Add a goal weight to see a suggested band.'
            }
          >
            <TextInput
              type="number"
              inputMode="numeric"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder={band ? String(band.low) : 'e.g. 130'}
            />
          </Field>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={() => setStep(2)} className="flex-1">Next</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-4">
          <h2 className="font-semibold">Program timing</h2>
          <p className="text-sm text-muted">
            Align these with your doctor's plan. You can change them any time, and the
            phase dates below are just a starting point.
          </p>
          <Field label="Program start date">
            <TextInput
              type="date"
              value={programStart}
              onChange={(e) => setProgramStart(e.target.value)}
            />
          </Field>
          <Field label="Injection day">
            <Select
              value={injectionWeekday}
              onChange={(e) => setInjectionWeekday(e.target.value)}
            >
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                (d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ),
              )}
            </Select>
          </Field>
          <div className="rounded-xl border border-line bg-panel2 p-3 text-sm text-muted">
            Your titration plan is seeded from your prescriber's guide —
            <strong className="text-ink"> retatrutide 4 → 8 → 12 mg</strong>. Step timing is
            left blank on purpose; you'll confirm each step-up in the app only after you've
            agreed it with your doctor.
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={finish} className="flex-1">Start using the app</Button>
          </div>
        </Card>
      )}

      <div className="mt-6 flex justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-6 rounded-full ${i <= step ? 'bg-accent' : 'bg-line'}`}
          />
        ))}
      </div>
    </div>
  )
}
