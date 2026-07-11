import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useSettings, saveSettings } from '../db/settings'
import {
  useTitration,
  setStepAgreed,
  setStepStartDate,
} from '../db/titration'
import { Card, SectionTitle, Badge, Button, Field, TextInput, AlertCard, EmptyHint } from '../components/ui'
import { PHASES, phaseStatus, defaultPhaseDates } from '../lib/phases'
import { sideEffectDoseBanner, foodSideEffectPattern, foodPatternSentence } from '../lib/correlations'
import { addDays, todayKey, formatDayHuman, daysBetween } from '../lib/dates'
import { SYMPTOMS } from '../db/types'

export default function Plan() {
  const settings = useSettings()
  const titration = useTitration()
  const sideEffects = useLiveQuery(() => db.sideEffects.toArray(), [])
  const meals = useLiveQuery(() => db.meals.toArray(), [])

  if (!settings || !titration || !sideEffects || !meals) return <div className="text-muted">Loading…</div>

  const phase = phaseStatus(settings)
  const doseBanner = sideEffectDoseBanner(sideEffects, titration)
  const foodPattern = foodSideEffectPattern(meals, sideEffects)

  // Readiness-for-step-up: summarise last 2 weeks of side effects as material
  // for the doctor conversation. This does NOT recommend proceeding.
  const twoWeeksAgo = addDays(todayKey(), -14)
  const recentSe = sideEffects.filter((s) => s.date >= twoWeeksAgo + 'T00:00:00')
  const nextStep = titration.find((s) => !s.agreedWithDoctor)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Plan</h1>

      {doseBanner && <AlertCard tone="warn" title={doseBanner.title} body={doseBanner.body} />}

      {/* Titration plan — safety-critical */}
      <Card>
        <SectionTitle hint="from your prescriber">Titration plan</SectionTitle>
        <p className="mb-3 text-sm text-muted">
          Seeded from your prescriber's guide. Each step-up activates only when you confirm
          you've agreed it with your doctor. The app never sets timing for you.
        </p>
        <ol className="space-y-2">
          {titration.map((s) => (
            <li
              key={s.index}
              className="rounded-xl border border-line bg-panel2 p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="tnum text-lg font-bold">{s.doseMg} mg</span>
                  <span className="text-sm capitalize text-muted">{s.compound}</span>
                </div>
                {s.agreedWithDoctor ? (
                  <Badge tone="good">confirmed</Badge>
                ) : (
                  <Badge tone="neutral">not yet confirmed</Badge>
                )}
              </div>

              {!s.agreedWithDoctor ? (
                <div className="mt-2">
                  <p className="text-xs text-faint">
                    Typical trial protocol held each step about 4 weeks — confirm the timing with
                    your prescriber before activating.
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-2"
                    onClick={() => setStepAgreed(s.index, true)}
                  >
                    I've agreed this step with my doctor
                  </Button>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <Field label="Start date (as your doctor set)">
                    <TextInput
                      type="date"
                      value={s.startDate ?? ''}
                      onChange={(e) => setStepStartDate(s.index, e.target.value || undefined)}
                    />
                  </Field>
                  <button
                    onClick={() => setStepAgreed(s.index, false)}
                    className="text-xs text-faint underline hover:text-bad"
                  >
                    Undo confirmation
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      </Card>

      {/* Readiness-for-step-up card */}
      {nextStep && (
        <Card>
          <SectionTitle>Readiness for {nextStep.doseMg} mg — for your doctor</SectionTitle>
          <p className="mb-2 text-sm text-muted">
            A summary of your last 2 weeks of side effects to bring to your prescriber. This is
            material for that conversation — it is not a recommendation to step up.
          </p>
          {recentSe.length === 0 ? (
            <p className="text-sm text-good">No side effects logged in the last 2 weeks.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {summariseSymptoms(recentSe).map((row) => (
                <li key={row.symptom} className="flex justify-between">
                  <span>{SYMPTOMS.find((x) => x.key === row.symptom)?.label ?? row.symptom}</span>
                  <span className="tnum text-muted">
                    {row.count}× · peak severity {row.peak}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Food-type correlation */}
      {foodPattern && (
        <Card>
          <SectionTitle>Food pattern</SectionTitle>
          <p className="text-sm text-muted">{foodPatternSentence(foodPattern)}</p>
          <p className="mt-1 text-xs text-faint">
            An observation from your logs, not medical advice. Adjusting what you eat before an
            injection is worth discussing with your prescriber if it persists.
          </p>
        </Card>
      )}

      {/* Dose timeline + side effects overlay */}
      <DoseTimeline />

      {/* Phase planner */}
      <Card>
        <SectionTitle
          hint={phase.dayInProgram ? `Day ${phase.dayInProgram}` : undefined}
        >
          6-month map
        </SectionTitle>
        {!settings.phase1Start && (
          <Button
            className="mb-3"
            onClick={() => saveSettings(defaultPhaseDates(todayKey()))}
          >
            Set default phase dates from today
          </Button>
        )}
        <div className="space-y-2">
          {PHASES.map((p) => {
            const active = phase.current?.id === p.id
            const start =
              p.id === 1 ? settings.phase1Start : p.id === 2 ? settings.phase2Start : settings.phase3Start
            return (
              <div
                key={p.id}
                className={`rounded-xl border p-3 ${
                  active ? 'border-accent bg-accent/10' : 'border-line bg-panel2'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    Phase {p.id} · {p.name}
                  </span>
                  {active && <Badge tone="accent">current</Badge>}
                </div>
                <div className="text-xs text-faint">
                  {p.weeks}
                  {start ? ` · from ${formatDayHuman(start).replace(/^\w+ /, '')}` : ''}
                </div>
                <p className="mt-1 text-sm text-muted">{p.focus}</p>
                <p className="mt-1 text-xs text-accent">Success: {p.success}</p>
              </div>
            )
          })}
        </div>
        <PhaseDateEditor />
      </Card>
    </div>
  )
}

function summariseSymptoms(
  se: { symptom: string; severity: number }[],
): { symptom: string; count: number; peak: number }[] {
  const map = new Map<string, { count: number; peak: number }>()
  for (const s of se) {
    const cur = map.get(s.symptom) ?? { count: 0, peak: 0 }
    cur.count++
    cur.peak = Math.max(cur.peak, s.severity)
    map.set(s.symptom, cur)
  }
  return [...map.entries()]
    .map(([symptom, v]) => ({ symptom, ...v }))
    .sort((a, b) => b.peak - a.peak || b.count - a.count)
}

function DoseTimeline() {
  const doses = useLiveQuery(
    async () => (await db.doses.filter((d) => d.logged).toArray()).sort((a, b) => (a.date < b.date ? -1 : 1)),
    [],
  )
  const sideEffects = useLiveQuery(() => db.sideEffects.toArray(), [])
  if (!doses || !sideEffects) return null
  if (!doses.length) {
    return (
      <Card>
        <SectionTitle>Dose &amp; side-effect timeline</SectionTitle>
        <EmptyHint>Log injections and symptoms to see them overlaid here.</EmptyHint>
      </Card>
    )
  }

  return (
    <Card>
      <SectionTitle>Dose &amp; side-effect timeline</SectionTitle>
      <ul className="space-y-1.5">
        {doses.slice(-8).map((d) => {
          const near = sideEffects.filter((s) => {
            const diff = Math.abs(new Date(s.date).getTime() - new Date(d.date).getTime())
            return diff <= 72 * 3_600_000
          })
          return (
            <li key={d.id} className="flex items-center justify-between rounded-lg bg-panel2 px-3 py-2 text-sm">
              <span>
                💉 <span className="tnum font-semibold">{d.doseMg} mg</span>{' '}
                <span className="text-faint">{formatDayHuman(d.date.slice(0, 10)).replace(/^\w+ /, '')}</span>
              </span>
              {near.length > 0 ? (
                <Badge tone={near.some((s) => s.severity >= 4) ? 'bad' : 'warn'}>
                  {near.length} symptom{near.length === 1 ? '' : 's'} ±72h
                </Badge>
              ) : (
                <span className="text-xs text-good">clear ±72h</span>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function PhaseDateEditor() {
  const settings = useSettings()
  if (!settings) return null
  const fields: { key: 'phase1Start' | 'phase2Start' | 'phase3Start' | 'programEnd'; label: string }[] = [
    { key: 'phase1Start', label: 'Phase 1 start' },
    { key: 'phase2Start', label: 'Phase 2 start' },
    { key: 'phase3Start', label: 'Phase 3 start' },
    { key: 'programEnd', label: 'Program end' },
  ]
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm font-medium text-accent">Edit phase dates</summary>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {fields.map((f) => (
          <Field key={f.key} label={f.label}>
            <TextInput
              type="date"
              value={(settings[f.key] as string | undefined) ?? ''}
              onChange={(e) => saveSettings({ [f.key]: e.target.value || undefined })}
            />
          </Field>
        ))}
      </div>
      {settings.programEnd && (
        <p className="mt-2 text-xs text-faint">
          {daysBetween(todayKey(), settings.programEnd) >= 0
            ? `${daysBetween(todayKey(), settings.programEnd)} days remaining in your program.`
            : 'Program end date has passed.'}
        </p>
      )}
    </details>
  )
}
