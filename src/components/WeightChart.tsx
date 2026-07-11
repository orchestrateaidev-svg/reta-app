import {
  Area,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { WeightEntry } from '../db/types'
import type { AppSettings, Units } from '../db/settings'
import { smoothedWeightSeries } from '../lib/stats'
import { kgToDisplay, weightUnit } from '../lib/units'
import { formatDayHuman } from '../lib/dates'

// Weight trend: raw points as a faint area, 7-day smoothed as the emphasised
// line, with phase bands shaded behind. Endpoint is emphasised via the line.
export function WeightChart({
  weights,
  settings,
}: {
  weights: WeightEntry[]
  settings: AppSettings
}) {
  const units: Units = settings.units
  const series = smoothedWeightSeries(weights).map((d) => ({
    key: d.key,
    raw: Number(kgToDisplay(d.kg, units).toFixed(1)),
    smooth: Number(kgToDisplay(d.smooth, units).toFixed(1)),
  }))

  if (series.length < 2) {
    return (
      <div className="grid h-40 place-content-center text-center text-sm text-faint">
        Log a few weigh-ins to see your smoothed trend here.
      </div>
    )
  }

  const values = series.flatMap((s) => [s.raw, s.smooth])
  const min = Math.floor(Math.min(...values) - 1)
  const max = Math.ceil(Math.max(...values) + 1)

  const bands: { x1: string; x2: string; fill: string }[] = []
  const { phase1Start, phase2Start, phase3Start, programEnd } = settings
  const first = series[0].key
  const last = series[series.length - 1].key
  const clamp = (d?: string, fallback?: string) => {
    if (!d) return fallback
    return d < first ? first : d > last ? last : d
  }
  if (phase1Start && phase2Start) {
    const x1 = clamp(phase1Start, first)!
    const x2 = clamp(phase2Start, last)!
    if (x1 < x2) bands.push({ x1, x2, fill: 'rgb(var(--accent) / 0.06)' })
  }
  if (phase2Start && phase3Start) {
    const x1 = clamp(phase2Start)!
    const x2 = clamp(phase3Start, last)!
    if (x1 < x2) bands.push({ x1, x2, fill: 'rgb(var(--accent) / 0.12)' })
  }
  if (phase3Start) {
    const x1 = clamp(phase3Start)!
    const x2 = clamp(programEnd, last)!
    if (x1 < x2) bands.push({ x1, x2, fill: 'rgb(var(--accent) / 0.18)' })
  }

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
          {bands.map((b, i) => (
            <ReferenceArea key={i} x1={b.x1} x2={b.x2} fill={b.fill} strokeOpacity={0} />
          ))}
          <defs>
            <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.25} />
              <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="key"
            tick={{ fontSize: 10, fill: 'rgb(var(--faint))' }}
            tickFormatter={(k) => formatDayHuman(k).replace(/^\w+ /, '')}
            minTickGap={28}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[min, max]}
            tick={{ fontSize: 10, fill: 'rgb(var(--faint))' }}
            width={44}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            contentStyle={{
              background: 'rgb(var(--panel))',
              border: '1px solid rgb(var(--line))',
              borderRadius: 12,
              fontSize: 12,
              color: 'rgb(var(--ink))',
            }}
            labelFormatter={(k) => formatDayHuman(String(k))}
            formatter={(v: number, name) => [
              `${v} ${weightUnit(units)}`,
              name === 'smooth' ? '7-day avg' : 'Logged',
            ]}
          />
          <Area
            type="monotone"
            dataKey="raw"
            stroke="rgb(var(--faint))"
            strokeWidth={1}
            fill="url(#wfill)"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="smooth"
            stroke="rgb(var(--accent))"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
