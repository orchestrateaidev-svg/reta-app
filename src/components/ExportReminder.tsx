import { useState } from 'react'
import type { AppSettings } from '../db/settings'
import { daysBetween, todayKey } from '../lib/dates'
import { exportJson } from '../lib/backup'
import { useToast } from './Toast'

/** 14-day no-export warning (backup gate 5). Dismissible for the session. */
export function ExportReminder({ settings }: { settings: AppSettings }) {
  const toast = useToast()
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || !settings.onboarded) return null

  const last = settings.lastExport?.slice(0, 10)
  const overdue = !last || daysBetween(last, todayKey()) >= 14
  if (!overdue) return null

  return (
    <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-warn/40 bg-warn/10 px-3 py-2 text-sm">
      <span aria-hidden>💾</span>
      <p className="flex-1 text-muted">
        {last
          ? `Your last backup was ${daysBetween(last, todayKey())} days ago.`
          : 'You have not backed up yet.'}{' '}
        Your data lives only on this device.
      </p>
      <button
        onClick={async () => {
          await exportJson()
          toast('Backup saved')
        }}
        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink"
      >
        Back up
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss backup reminder"
        className="text-faint hover:text-ink"
      >
        ✕
      </button>
    </div>
  )
}
