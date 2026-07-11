import type { ReactNode } from 'react'

// Shared clinical-calm UI primitives. Semantic colour (good/warn/bad) is kept
// separate from the accent, and every colour signal is paired with text/icon
// so nothing relies on colour alone (accessibility gate 8).

export function Card({
  children,
  className = '',
  as: Tag = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
}) {
  return (
    <Tag
      className={
        'rounded-xl2 bg-panel border border-line shadow-sm p-4 ' + className
      }
    >
      {children}
    </Tag>
  )
}

export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode
  hint?: ReactNode
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        {children}
      </h2>
      {hint ? <span className="text-xs text-faint">{hint}</span> : null}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className = '',
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  'aria-label'?: string
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]'
  const styles = {
    primary: 'bg-accent text-accent-ink hover:brightness-110',
    ghost: 'bg-transparent text-ink border border-line hover:bg-panel2',
    subtle: 'bg-panel2 text-ink hover:brightness-105',
    danger: 'bg-bad text-white hover:brightness-110',
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-faint">{hint}</span> : null}
    </label>
  )
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className={
        'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink placeholder:text-faint focus:border-accent min-h-[44px] ' +
        (props.className ?? '')
      }
    />
  )
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select
      {...props}
      className={
        'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink focus:border-accent min-h-[44px] ' +
        (props.className ?? '')
      }
    />
  )
}

export function Stat({
  value,
  label,
  sub,
  tone = 'default',
}: {
  value: ReactNode
  label: string
  sub?: ReactNode
  tone?: 'default' | 'good' | 'warn' | 'bad' | 'accent'
}) {
  const toneClass = {
    default: 'text-ink',
    good: 'text-good',
    warn: 'text-warn',
    bad: 'text-bad',
    accent: 'text-accent',
  }[tone]
  return (
    <div>
      <div className={`tnum text-2xl font-bold leading-tight ${toneClass}`}>
        {value}
      </div>
      <div className="text-xs font-medium text-muted">{label}</div>
      {sub ? <div className="text-xs text-faint">{sub}</div> : null}
    </div>
  )
}

const STRENGTH_TONE: Record<string, string> = {
  Strong: 'bg-good/15 text-good border-good/30',
  Moderate: 'bg-accent/15 text-accent border-accent/30',
  Emerging: 'bg-warn/15 text-warn border-warn/30',
  Insufficient: 'bg-bad/12 text-bad border-bad/30',
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'accent' | string
}) {
  const cls =
    STRENGTH_TONE[tone] ??
    {
      neutral: 'bg-panel2 text-muted border-line',
      good: 'bg-good/15 text-good border-good/30',
      warn: 'bg-warn/15 text-warn border-warn/30',
      bad: 'bg-bad/12 text-bad border-bad/30',
      accent: 'bg-accent/15 text-accent border-accent/30',
    }[tone as 'neutral'] ??
    'bg-panel2 text-muted border-line'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  )
}

/** A progress ring. `label` sits under the big number in the centre. */
export function Ring({
  value,
  max,
  centerTop,
  centerBottom,
  tone = 'accent',
  size = 104,
}: {
  value: number
  max: number
  centerTop: ReactNode
  centerBottom?: ReactNode
  tone?: 'accent' | 'good' | 'warn' | 'bad'
  size?: number
}) {
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const stroke = 9
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const toneVar = {
    accent: 'var(--accent)',
    good: 'var(--good)',
    warn: 'var(--warn)',
    bad: 'var(--bad)',
  }[tone]
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`rgb(${toneVar})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <div className="tnum text-lg font-bold leading-none text-ink">{centerTop}</div>
        {centerBottom ? (
          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
            {centerBottom}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function AlertCard({
  title,
  body,
  tone = 'warn',
}: {
  title: string
  body: ReactNode
  tone?: 'warn' | 'bad' | 'info'
}) {
  const cls = {
    warn: 'border-warn/40 bg-warn/10',
    bad: 'border-bad/40 bg-bad/10',
    info: 'border-accent/40 bg-accent/10',
  }[tone]
  const icon = tone === 'bad' ? '⚠' : tone === 'info' ? 'ℹ' : '!'
  return (
    <div className={`rounded-xl2 border p-4 ${cls}`} role="status">
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 grid h-6 w-6 flex-none place-content-center rounded-full bg-panel text-sm font-bold text-ink">
          {icon}
        </span>
        <div>
          <div className="font-semibold text-ink">{title}</div>
          <div className="mt-1 text-sm text-muted">{body}</div>
        </div>
      </div>
    </div>
  )
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-faint">
      {children}
    </div>
  )
}
