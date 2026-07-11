import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSearchParams } from 'react-router-dom'
import { db } from '../db/db'
import { useSettings } from '../db/settings'
import { loadTitration, currentStep } from '../db/titration'
import {
  INJECTION_SITES,
  SYMPTOMS,
  FOOD_TYPES,
  type InjectionSite,
  type Symptom,
  type FoodTypeTag,
  type WorkoutType,
} from '../db/types'
import { QUICK_PORTIONS } from '../data/portions'
import { Button, Card, Field, Select, TextInput, Badge, EmptyHint } from '../components/ui'
import { useToast } from '../components/Toast'
import { nowIso, todayKey, dayKeyOf, formatDayHuman } from '../lib/dates'
import { displayToKg, displayToCm, weightUnit, lengthUnit, fmtWeight } from '../lib/units'
import type { Units } from '../db/settings'

type Tab = 'weight' | 'meal' | 'water' | 'injection' | 'workout' | 'side'
const TABS: { id: Tab; label: string }[] = [
  { id: 'weight', label: 'Weight' },
  { id: 'meal', label: 'Meal' },
  { id: 'water', label: 'Water' },
  { id: 'injection', label: 'Injection' },
  { id: 'workout', label: 'Workout' },
  { id: 'side', label: 'Symptom' },
]

export default function LogHub() {
  const [params, setParams] = useSearchParams()
  const initial = (params.get('t') as Tab) || 'weight'
  const [tab, setTab] = useState<Tab>(initial)
  const settings = useSettings()

  function selectTab(t: Tab) {
    setTab(t)
    setParams({ t }, { replace: true })
  }

  if (!settings) return null

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Log</h1>
      <div className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => selectTab(t.id)}
            className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium ${
              tab === t.id ? 'bg-accent text-accent-ink' : 'bg-panel2 text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'weight' && <WeightPanel units={settings.units} />}
      {tab === 'meal' && <MealPanel />}
      {tab === 'water' && <WaterPanel units={settings.units} targetMl={settings.waterTargetMl} />}
      {tab === 'injection' && <InjectionPanel />}
      {tab === 'workout' && <WorkoutPanel />}
      {tab === 'side' && <SidePanel />}
    </div>
  )
}

function RecentList<T extends { id?: number; date: string }>({
  rows,
  render,
  onDelete,
  empty,
}: {
  rows: T[] | undefined
  render: (r: T) => React.ReactNode
  onDelete: (id: number) => void
  empty: string
}) {
  if (!rows) return null
  if (!rows.length) return <EmptyHint>{empty}</EmptyHint>
  return (
    <ul className="divide-y divide-line rounded-xl border border-line bg-panel">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3 px-3 py-2.5">
          <div className="flex-1 text-sm">{render(r)}</div>
          <button
            onClick={() => onDelete(r.id!)}
            aria-label="Delete entry"
            className="text-faint hover:text-bad"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}

// ---- Weight ---------------------------------------------------------------
function WeightPanel({ units }: { units: Units }) {
  const toast = useToast()
  const [kg, setKg] = useState('')
  const [waist, setWaist] = useState('')
  const [bf, setBf] = useState('')
  const rows = useLiveQuery(
    async () => (await db.weights.orderBy('date').reverse().limit(10).toArray()),
    [],
  )

  async function save() {
    if (!kg) return
    await db.weights.add({
      date: todayKey(),
      kg: displayToKg(Number(kg), units),
      waistCm: waist ? displayToCm(Number(waist), units) : undefined,
      bodyFatPct: bf ? Number(bf) : undefined,
    })
    setKg('')
    setWaist('')
    setBf('')
    toast('Weight logged')
  }

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <Field label={`Weight (${weightUnit(units)})`}>
          <TextInput type="number" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Waist (${lengthUnit(units)})`} hint="Weekly is enough">
            <TextInput type="number" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} />
          </Field>
          <Field label="Body fat %" hint="Optional">
            <TextInput type="number" inputMode="decimal" value={bf} onChange={(e) => setBf(e.target.value)} />
          </Field>
        </div>
        <Button onClick={save} disabled={!kg}>Log weight</Button>
      </Card>
      <RecentList
        rows={rows}
        empty="No weigh-ins yet."
        onDelete={(id) => db.weights.delete(id)}
        render={(r) => (
          <div className="flex items-center justify-between">
            <span className="tnum font-semibold">{fmtWeight(r.kg, units)}</span>
            <span className="text-faint">
              {formatDayHuman(r.date)}
              {r.waistCm ? ` · waist ${displayToCm(r.waistCm, units).toFixed(0)} ${lengthUnit(units)}` : ''}
            </span>
          </div>
        )}
      />
    </div>
  )
}

// ---- Meal -----------------------------------------------------------------
function MealPanel() {
  const toast = useToast()
  const [name, setName] = useState('')
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [tag, setTag] = useState<FoodTypeTag | ''>('')
  const favourites = useLiveQuery(
    async () => (await db.meals.filter((m) => !!m.isFavourite).toArray()).slice(0, 12),
    [],
  )
  const todays = useLiveQuery(
    async () =>
      (await db.meals.toArray())
        .filter((m) => dayKeyOf(m.date) === todayKey())
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [],
  )

  async function save(fav = false) {
    if (!name || !protein) return
    await db.meals.add({
      date: nowIso(),
      name,
      kcal: kcal ? Number(kcal) : 0,
      proteinG: Number(protein),
      typeTag: tag || undefined,
      isFavourite: fav,
    })
    setName('')
    setKcal('')
    setProtein('')
    setTag('')
    toast(fav ? 'Meal logged & saved to favourites' : 'Meal logged')
  }

  async function quickAdd(p: (typeof QUICK_PORTIONS)[number]) {
    await db.meals.add({
      date: nowIso(),
      name: p.name,
      kcal: p.kcal,
      proteinG: p.proteinG,
      typeTag: p.typeTag,
    })
    toast(`${p.name} logged`)
  }

  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <div className="text-sm font-semibold">One-tap portions</div>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_PORTIONS.map((p) => (
            <button
              key={p.name}
              onClick={() => quickAdd(p)}
              className="rounded-xl border border-line bg-panel2 px-3 py-2 text-left text-sm hover:border-accent"
            >
              <div className="font-medium leading-tight">{p.name}</div>
              <div className="tnum text-xs text-muted">{p.proteinG} g protein · {p.kcal} kcal</div>
            </button>
          ))}
        </div>
      </Card>

      {favourites && favourites.length > 0 && (
        <Card className="space-y-2">
          <div className="text-sm font-semibold">Your favourites</div>
          <div className="flex flex-wrap gap-2">
            {favourites.map((f) => (
              <button
                key={f.id}
                onClick={() => quickAdd({ name: f.name, kcal: f.kcal, proteinG: f.proteinG, typeTag: f.typeTag ?? 'leanProtein' })}
                className="rounded-full border border-line bg-panel2 px-3 py-1.5 text-xs hover:border-accent"
              >
                {f.name} · {f.proteinG}g
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card className="space-y-3">
        <div className="text-sm font-semibold">Custom meal</div>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Salmon & greens" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Protein (g)">
            <TextInput type="number" inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} />
          </Field>
          <Field label="Energy (kcal)">
            <TextInput type="number" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} />
          </Field>
        </div>
        <div>
          <div className="mb-1 text-sm font-medium">Food type</div>
          <div className="flex flex-wrap gap-1.5">
            {FOOD_TYPES.map((f) => (
              <button
                key={f.key}
                onClick={() => setTag(tag === f.key ? '' : f.key)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  tag === f.key
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-line bg-panel2 text-muted'
                }`}
              >
                <QualityDot q={f.quality} /> {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => save(false)} disabled={!name || !protein} className="flex-1">Log meal</Button>
          <Button variant="ghost" onClick={() => save(true)} disabled={!name || !protein}>Save ★</Button>
        </div>
      </Card>

      <div>
        <div className="mb-1 text-sm font-semibold text-muted">Today's meals</div>
        <RecentList
          rows={todays}
          empty="Nothing logged today yet."
          onDelete={(id) => db.meals.delete(id)}
          render={(r) => (
            <div className="flex items-center justify-between">
              <span>
                {r.typeTag ? <QualityDot q={FOOD_TYPES.find((f) => f.key === r.typeTag)?.quality} /> : null} {r.name}
              </span>
              <span className="tnum text-faint">{r.proteinG}g · {r.kcal}kcal</span>
            </div>
          )}
        />
      </div>
    </div>
  )
}

export function QualityDot({ q }: { q?: 'green' | 'amber' | 'red' }) {
  const color = q === 'green' ? 'bg-good' : q === 'red' ? 'bg-bad' : q === 'amber' ? 'bg-warn' : 'bg-faint'
  return <span aria-hidden className={`mr-0.5 inline-block h-2 w-2 rounded-full ${color}`} />
}

// ---- Water ----------------------------------------------------------------
function WaterPanel({ units, targetMl }: { units: Units; targetMl: number }) {
  const toast = useToast()
  const glass = units === 'imperial' ? 240 : 250
  const bottle = units === 'imperial' ? 500 : 600
  const todays = useLiveQuery(
    async () =>
      (await db.water.toArray()).filter((w) => dayKeyOf(w.date) === todayKey()),
    [],
  )
  const total = (todays ?? []).reduce((s, w) => s + w.ml, 0)

  async function add(ml: number) {
    await db.water.add({ date: nowIso(), ml })
    toast('Water logged')
  }

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Today</span>
          <span className="tnum text-sm text-muted">
            {(total / (units === 'imperial' ? 29.5735 : 1000)).toFixed(units === 'imperial' ? 0 : 2)}
            {units === 'imperial' ? ' fl oz' : ' L'} / target{' '}
            {(targetMl / (units === 'imperial' ? 29.5735 : 1000)).toFixed(units === 'imperial' ? 0 : 1)}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${Math.min(100, (total / targetMl) * 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="subtle" onClick={() => add(glass)}>+ Glass ({glass} ml)</Button>
          <Button variant="subtle" onClick={() => add(bottle)}>+ Bottle ({bottle} ml)</Button>
        </div>
      </Card>
      <RecentList
        rows={(todays ?? []).slice().sort((a, b) => (a.date < b.date ? 1 : -1))}
        empty="No water logged today."
        onDelete={(id) => db.water.delete(id)}
        render={(r) => (
          <div className="flex items-center justify-between">
            <span className="tnum">{r.ml} ml</span>
            <span className="text-faint">{new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      />
    </div>
  )
}

// ---- Injection ------------------------------------------------------------
function InjectionPanel() {
  const toast = useToast()
  const [site, setSite] = useState<InjectionSite>('abdomen-L')
  const [notes, setNotes] = useState('')
  const recent = useLiveQuery(
    async () =>
      (await db.doses.filter((d) => d.logged).toArray())
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 10),
    [],
  )

  // Suggest the next site by rotating from the last logged one.
  const lastSite = recent?.[0]?.site
  const suggested =
    lastSite && INJECTION_SITES.includes(lastSite)
      ? INJECTION_SITES[(INJECTION_SITES.indexOf(lastSite) + 1) % INJECTION_SITES.length]
      : 'abdomen-L'

  async function log() {
    // Record the injection at the CURRENT confirmed dose (or unknown). The app
    // reads the dose from the confirmed titration plan; it never invents one.
    const plan = await loadTitration()
    const step = currentStep(plan, todayKey())
    await db.doses.add({
      date: nowIso(),
      compound: step?.compound ?? 'retatrutide',
      doseMg: step?.doseMg ?? 0,
      site,
      notes: notes || undefined,
      logged: true,
    })
    setNotes('')
    toast('Injection logged')
  }

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <div className="rounded-xl border border-line bg-panel2 p-3 text-sm text-muted">
          The dose recorded comes from your confirmed titration plan on the Plan tab. If no
          step is confirmed yet, it logs as 0 mg until you confirm one with your doctor.
        </div>
        <Field label="Injection site" hint={`Suggested next: ${labelSite(suggested)}`}>
          <div className="grid grid-cols-2 gap-2">
            {INJECTION_SITES.map((s) => (
              <button
                key={s}
                onClick={() => setSite(s)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${
                  site === s ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-panel2 text-muted'
                }`}
              >
                {labelSite(s)}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Notes">
          <TextInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" />
        </Field>
        <Button onClick={log}>Log injection</Button>
      </Card>
      <RecentList
        rows={recent}
        empty="No injections logged yet."
        onDelete={(id) => db.doses.delete(id)}
        render={(r) => (
          <div className="flex items-center justify-between">
            <span>{labelSite(r.site as InjectionSite)} · <span className="tnum">{r.doseMg} mg</span></span>
            <span className="text-faint">{formatDayHuman(dayKeyOf(r.date))}</span>
          </div>
        )}
      />
    </div>
  )
}

function labelSite(s?: InjectionSite): string {
  switch (s) {
    case 'abdomen-L': return 'Abdomen (L)'
    case 'abdomen-R': return 'Abdomen (R)'
    case 'thigh-L': return 'Thigh (L)'
    case 'thigh-R': return 'Thigh (R)'
    default: return '—'
  }
}

// ---- Workout --------------------------------------------------------------
function WorkoutPanel() {
  const toast = useToast()
  const [type, setType] = useState<WorkoutType>('resistance')
  const [duration, setDuration] = useState('')
  const [steps, setSteps] = useState('')
  const [notes, setNotes] = useState('')
  const recent = useLiveQuery(
    async () => (await db.workouts.orderBy('date').reverse().limit(10).toArray()),
    [],
  )

  async function save() {
    await db.workouts.add({
      date: todayKey(),
      type,
      durationMin: duration ? Number(duration) : undefined,
      steps: type === 'steps' && steps ? Number(steps) : undefined,
      notes: notes || undefined,
    })
    setDuration('')
    setSteps('')
    setNotes('')
    toast('Workout logged')
  }

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <Field label="Type">
          <div className="grid grid-cols-3 gap-2">
            {(['resistance', 'cardio', 'steps'] as WorkoutType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-xl border px-2 py-2.5 text-sm font-medium capitalize ${
                  type === t ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-panel2 text-muted'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
        {type === 'steps' ? (
          <Field label="Steps">
            <TextInput type="number" inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} />
          </Field>
        ) : (
          <Field label="Duration (min)">
            <TextInput type="number" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </Field>
        )}
        <Field label="Notes" hint="Exercises, loads, how it felt">
          <TextInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" />
        </Field>
        <Button onClick={save}>Log workout</Button>
      </Card>
      <RecentList
        rows={recent}
        empty="No workouts logged yet."
        onDelete={(id) => db.workouts.delete(id)}
        render={(r) => (
          <div className="flex items-center justify-between">
            <span className="capitalize">{r.type}{r.steps ? ` · ${r.steps.toLocaleString()} steps` : r.durationMin ? ` · ${r.durationMin} min` : ''}</span>
            <span className="text-faint">{formatDayHuman(r.date)}</span>
          </div>
        )}
      />
    </div>
  )
}

// ---- Side effects ---------------------------------------------------------
function SidePanel() {
  const toast = useToast()
  const [symptom, setSymptom] = useState<Symptom>('nausea')
  const [severity, setSeverity] = useState(2)
  const [notes, setNotes] = useState('')
  const recent = useLiveQuery(
    async () =>
      (await db.sideEffects.toArray()).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 12),
    [],
  )

  async function save() {
    await db.sideEffects.add({
      date: nowIso(),
      symptom,
      severity: severity as 1 | 2 | 3 | 4 | 5,
      notes: notes || undefined,
    })
    setNotes('')
    setSeverity(2)
    toast('Symptom logged')
  }

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <Field label="Symptom">
          <Select value={symptom} onChange={(e) => setSymptom(e.target.value as Symptom)}>
            {SYMPTOMS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </Select>
        </Field>
        <Field label={`Severity: ${severity} / 5`}>
          <input
            type="range"
            min={1}
            max={5}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full accent-[rgb(var(--accent))]"
            aria-valuetext={`${severity} of 5`}
          />
        </Field>
        <Field label="Notes">
          <TextInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" />
        </Field>
        <Button onClick={save}>Log symptom</Button>
        <p className="text-xs text-faint">
          Severe abdominal pain, persistent vomiting, or signs of dehydration mean you should
          contact your doctor promptly — not wait for a pattern.
        </p>
      </Card>
      <RecentList
        rows={recent}
        empty="No symptoms logged."
        onDelete={(id) => db.sideEffects.delete(id)}
        render={(r) => (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {SYMPTOMS.find((s) => s.key === r.symptom)?.label}
              <Badge tone={r.severity >= 4 ? 'bad' : r.severity >= 3 ? 'warn' : 'neutral'}>
                sev {r.severity}
              </Badge>
            </span>
            <span className="text-faint">{formatDayHuman(dayKeyOf(r.date))}</span>
          </div>
        )}
      />
    </div>
  )
}
