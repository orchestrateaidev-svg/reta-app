import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useSettings } from './db/settings'
import { useApplyTheme } from './lib/theme'
import { scheduleInjectionReminder } from './lib/notifications'
import { ToastProvider } from './components/Toast'
import { ExportReminder } from './components/ExportReminder'
import Dashboard from './pages/Dashboard'
import LogHub from './pages/LogHub'
import Plan from './pages/Plan'
import Evidence from './pages/Evidence'
import Coach from './pages/Coach'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'

const NAV = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/log', label: 'Log', icon: PlusIcon, end: false },
  { to: '/plan', label: 'Plan', icon: MapIcon, end: false },
  { to: '/learn', label: 'Learn', icon: BookIcon, end: false },
  { to: '/coach', label: 'Coach', icon: SparkIcon, end: false },
]

export default function App() {
  const settings = useSettings()
  useApplyTheme(settings?.theme)
  const location = useLocation()

  useEffect(() => {
    if (settings?.onboarded) scheduleInjectionReminder(settings.injectionWeekday)
  }, [settings?.onboarded, settings?.injectionWeekday])

  if (!settings) {
    return (
      <div className="grid min-h-full place-content-center text-muted">Loading…</div>
    )
  }

  if (!settings.onboarded && location.pathname !== '/settings') {
    return (
      <ToastProvider>
        <Onboarding />
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <div className="mx-auto flex min-h-full max-w-lg flex-col">
        <header className="safe-top sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface/90 px-4 pb-2 backdrop-blur">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-lg">🧭</span>
            <span className="font-semibold tracking-tight">Retatrutide Companion</span>
          </div>
          <NavLink
            to="/settings"
            aria-label="Settings"
            className="grid h-10 w-10 place-content-center rounded-full text-muted hover:bg-panel2"
          >
            <GearIcon />
          </NavLink>
        </header>

        <ExportReminder settings={settings} />

        <main className="flex-1 px-4 py-4 pb-28">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/log" element={<LogHub />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/learn" element={<Evidence />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>

        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-lg items-stretch justify-around border-t border-line bg-surface/95 px-2 pt-1 backdrop-blur">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium ${
                  isActive ? 'text-accent' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <n.icon active={isActive} />
                  <span>{n.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </ToastProvider>
  )
}

// --- Icons (inline, currentColor, no external assets) ---------------------
type IconProps = { active?: boolean }
function base(active?: boolean) {
  return {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: active ? 2.4 : 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
}
function HomeIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  )
}
function PlusIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}
function MapIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  )
}
function BookIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
    </svg>
  )
}
function SparkIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z" />
    </svg>
  )
}
function GearIcon() {
  return (
    <svg {...base(false)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 0 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  )
}
