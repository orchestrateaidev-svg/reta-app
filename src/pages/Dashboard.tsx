import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../db/db'
import { useSettings } from '../db/settings'
import { loadTitration, currentStep } from '../db/titration'
import { Card, Ring, Stat, AlertCard, SectionTitle, Badge } from '../components/ui'
import { QualityDot } from './LogHub'
import { WeightChart } from '../components/WeightChart'
import {
  proteinByDay,
  proteinStreak,
  weeklyLossPct,
  waterTotalForDay,
  leanMassAlert,
  minFoodFloorAlert,
  resistanceSessions7d,
  trainingStreakWeeks,
  hydrationPace,
} from '../lib/stats'
import { sideEffectDoseBanner } from '../lib/correlations'
import { phaseStatus } from '../lib/phases'
import { trainingRecommendation } from '../lib/exercise'
import { todayKey, dayKeyOf, nextWeekday, formatDayHuman, daysBetween } from '../lib/dates'
import { FOOD_TYPES } from '../db/types'
import { fmtWater, weightUnit, kgToDisplay } from '../lib/units'

export default function Dashboard() {
  const settings = useSettings()
  const weights = useLiveQuery(() => db.weights.toArray(), [])
  const meals = useLiveQuery(() => db.meals.toArray(), [])
  const water = useLiveQuery(() => db.water.toArray(), [])
  const workouts = useLiveQuery(() => db.workouts.toArray(), [])
  const sideEffects = useLiveQuery(() => db.sideEffects.toArray(), [])
  const titration = useLiveQuery(() => loadTitration(), [])
  const latestReport = useLatestCoachHeadline()

  if (!settings || !weights || !meals || !water || !workouts || !sideEffects || !titration) {
    return <div className="text-muted">Loading…</div>
  }

  const today = todayKey()
  const proteinToday = proteinByDay(meals).get(today) ?? 0
  const proteinTarget = settings.proteinTargetG
  const waterToday = waterTotalForDay(water, today)
  const streak = proteinStreak(meals, proteinTarget)
  const loss = weeklyLossPct(weights)
  const phase = phaseStatus(settings)
  const step = currentStep(titration, today)
  const rec = trainingRecommendation(phase.current?.id, workouts, sideEffects, settings.stepTarget)
  const resistanceDone = resistanceSessions7d(workouts)
  const trainStreak = trainingStreakWeeks(workouts)

  // Alerts
  const alerts = [
    leanMassAlert(weights, meals, proteinTarget),
    minFoodFloorAlert(meals),
  ].filter(Boolean)
  const doseBanner = sideEffectDoseBanner(sideEffects, titration)

  // Hydration pace — escalating nudge once the afternoon is underway and the
  // day's intake is meaningfully behind the linear ramp to target.
  const pace = hydrationPace(water, settings.waterTargetMl)
  const hydrationBehind =
    new Date().getHours() >= 14 && pace.behindMl >= 400
      ? pace
      : null

  // Today's food-quality mix
  const todaysMeals = meals.filter((m) => dayKeyOf(m.date) === today && m.typeTag)
  const qCounts = { green: 0, amber: 0, red: 0 }
  for (const m of todaysMeals) {
    const q = FOOD_TYPES.find((f) => f.key === m.typeTag)?.quality
    if (q) qCounts[q]++
  }
  const qTotal = qCounts.green + qCounts.amber + qCounts.red

  // Next injection day
  const nextInj = nextWeekday(settings.injectionWeekday)
  const injInDays = daysBetween(today, nextInj)

  const startKg = settings.startWeightKg
  const latestKg = weights.length
    ? [...weights].sort((a, b) => (a.date < b.date ? 1 : -1))[0].kg
    : undefined
  const lostKg = startKg && latestKg ? startKg - latestKg : undefined

  return (
    <div className="space-y-4">
      {/* Alerts first — surface what needs attention */}
      {doseBanner && <AlertCard tone="warn" title={doseBanner.title} body={doseBanner.body} />}
      {alerts.map((a) => a && <AlertCard key={a.id} tone="warn" title={a.title} body={a.body} />)}
      {hydrationBehind && (
        <AlertCard
          tone="info"
          title="You're behind on water"
          body={`About ${fmtWater(hydrationBehind.behindMl, settings.units)} behind pace for this time of day. Appetite suppression blunts thirst, so it's easy to miss — a glass now helps with the fatigue and constipation dehydration causes.`}
        />
      )}

      {/* Phase + program progress */}
      <Card>
        <SectionTitle
          hint={
            phase.current
              ? phase.daysToNextPhase != null
                ? `${phase.daysToNextPhase}d to next phase`
                : undefined
              : undefined
          }
        >
          {phase.configured
            ? phase.current
              ? `Phase ${phase.current.id} · ${phase.current.name}`
              : phase.nextPhase
                ? `Starts in ${phase.daysToNextPhase}d`
                : 'Program complete'
            : 'Set your phase dates'}
        </SectionTitle>
        {phase.current ? (
          <p className="text-sm text-muted">{phase.current.focus}</p>
        ) : (
          <Link to="/plan" className="text-sm font-medium text-accent">
            Configure your 6-month plan →
          </Link>
        )}
      </Card>

      {/* Weight trend */}
      <Card>
        <div className="mb-1 flex items-baseline justify-between">
          <SectionTitle>Weight trend</SectionTitle>
          <div className="text-right">
            {lostKg != null && (
              <span className="tnum text-sm font-semibold text-good">
                −{kgToDisplay(Math.max(0, lostKg), settings.units).toFixed(1)} {weightUnit(settings.units)}
              </span>
            )}
          </div>
        </div>
        <WeightChart weights={weights} settings={settings} />
        <div className="mt-1 flex justify-between text-xs text-faint">
          <span>7-day average (bold line)</span>
          <span className="tnum">
            {loss != null ? `${loss > 0 ? '−' : '+'}${Math.abs(loss).toFixed(2)}%/wk` : 'trend building'}
          </span>
        </div>
      </Card>

      {/* Rings row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center">
          <Ring
            value={proteinToday}
            max={proteinTarget ?? 1}
            tone={proteinTarget && proteinToday >= proteinTarget ? 'good' : 'accent'}
            centerTop={`${Math.round(proteinToday)}`}
            centerBottom="g protein"
          />
          <div className="mt-1 text-xs text-muted">
            {proteinTarget ? `of ${proteinTarget} g floor` : 'set a protein floor'}
          </div>
        </Card>
        <Card className="flex flex-col items-center">
          <Ring
            value={waterToday}
            max={settings.waterTargetMl}
            tone={waterToday >= settings.waterTargetMl ? 'good' : 'accent'}
            centerTop={fmtWater(waterToday, settings.units).replace(/ (L|ml|fl oz)/, '')}
            centerBottom="water"
          />
          <div className="mt-1 text-xs text-muted">
            of {fmtWater(settings.waterTargetMl, settings.units)}
          </div>
        </Card>
      </div>

      {/* Food quality bar */}
      <Card>
        <SectionTitle hint={qTotal ? `${qTotal} tagged today` : undefined}>
          Food quality today
        </SectionTitle>
        {qTotal === 0 ? (
          <p className="text-sm text-faint">Tag meals by type to see your green/amber/red mix.</p>
        ) : (
          <>
            <div className="flex h-4 overflow-hidden rounded-full">
              {(['green', 'amber', 'red'] as const).map((q) =>
                qCounts[q] > 0 ? (
                  <div
                    key={q}
                    className={q === 'green' ? 'bg-good' : q === 'amber' ? 'bg-warn' : 'bg-bad'}
                    style={{ width: `${(qCounts[q] / qTotal) * 100}%` }}
                    title={`${qCounts[q]} ${q}`}
                  />
                ) : null,
              )}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted">
              <span><QualityDot q="green" /> {qCounts.green} prioritise</span>
              <span><QualityDot q="amber" /> {qCounts.amber} moderate</span>
              <span><QualityDot q="red" /> {qCounts.red} aggravators</span>
            </div>
          </>
        )}
      </Card>

      {/* Dose + injection */}
      <Card>
        <SectionTitle>Medication</SectionTitle>
        <div className="flex items-center justify-between">
          <Stat
            value={step ? `${step.doseMg} mg` : '—'}
            label={step ? `Current ${step.compound}` : 'No confirmed dose'}
            tone={step ? 'accent' : 'default'}
          />
          <div className="text-right">
            <div className="tnum text-lg font-bold">
              {injInDays === 0 ? 'Today' : `${injInDays}d`}
            </div>
            <div className="text-xs text-muted">next injection ({formatDayHuman(nextInj).replace(/^\w+ /, '')})</div>
          </div>
        </div>
        {!step && (
          <Link to="/plan" className="mt-2 block text-sm font-medium text-accent">
            Confirm your titration step with your doctor →
          </Link>
        )}
      </Card>

      {/* Training */}
      <Card>
        <SectionTitle hint={trainStreak > 0 ? `${trainStreak}-week streak` : undefined}>
          This week's training
        </SectionTitle>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-ink">{rec.headline}</div>
            <p className="mt-0.5 text-sm text-muted">{rec.detail}</p>
            {rec.progressionPrompt && (
              <p className="mt-1 text-xs text-accent">{rec.progressionPrompt}</p>
            )}
          </div>
          {rec.deload && <Badge tone="warn">deload</Badge>}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          <Badge tone={resistanceDone >= rec.resistanceTarget ? 'good' : 'neutral'}>
            resistance {resistanceDone}/{rec.resistanceTarget}
          </Badge>
          {rec.cardioNote && <span>{rec.cardioNote}</span>}
        </div>
      </Card>

      {/* Coach headline */}
      {latestReport && (
        <Card>
          <SectionTitle hint="latest">Coach</SectionTitle>
          <p className="text-sm text-muted">{latestReport}</p>
          <Link to="/coach" className="mt-1 block text-sm font-medium text-accent">
            Open coach →
          </Link>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2">
        <QuickAction to="/log?t=weight" label="Weight" icon="⚖" />
        <QuickAction to="/log?t=meal" label="Meal" icon="🍽" />
        <QuickAction to="/log?t=water" label="Water" icon="💧" />
        <QuickAction to="/log?t=injection" label="Injection" icon="💉" />
        <QuickAction to="/log?t=workout" label="Workout" icon="🏋" />
        <QuickAction to="/log?t=side" label="Symptom" icon="🩺" />
      </div>

      <p className="px-1 pt-1 text-center text-xs text-faint">
        Streak: {streak} day{streak === 1 ? '' : 's'} at your protein floor. This app supports your
        doctor-supervised program and never sets doses.
      </p>
    </div>
  )
}

function QuickAction({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1 rounded-xl2 border border-line bg-panel py-3 text-sm font-medium hover:border-accent"
    >
      <span aria-hidden className="text-xl">{icon}</span>
      {label}
    </Link>
  )
}

function useLatestCoachHeadline(): string | null {
  const report = useLiveQuery(
    async () => (await db.coachReports.orderBy('createdAt').reverse().first()),
    [],
  )
  if (!report) return null
  // Pull the first non-heading line as the headline.
  const line = report.reportMd
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('#') && !l.startsWith('-'))
  return line ? line.replace(/\*\*/g, '').slice(0, 160) : null
}
