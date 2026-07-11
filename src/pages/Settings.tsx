import { useRef, useState } from 'react'
import { useSettings, saveSettings, proteinBand, type Units, type ThemePref } from '../db/settings'
import { Card, SectionTitle, Field, TextInput, Select, Button, AlertCard } from '../components/ui'
import { useToast } from '../components/Toast'
import { exportJson, exportCsv, importJson, wipeAll, type BackupFile } from '../lib/backup'
import { requestNotificationPermission, scheduleInjectionReminder } from '../lib/notifications'
import { TABLE_NAMES } from '../db/db'
import { displayToKg, kgToDisplay, weightUnit } from '../lib/units'

export default function Settings() {
  const settings = useSettings()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [showKey, setShowKey] = useState(false)
  const [confirmWipe, setConfirmWipe] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  if (!settings) return null
  const band = proteinBand(settings.goalWeightKg)

  async function onImportFile(file: File) {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as BackupFile
      const counts = await importJson(parsed)
      const total = Object.values(counts).reduce((a, b) => a + b, 0)
      setImportMsg(`Restored ${total} records from backup.`)
      toast('Backup restored')
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : 'Could not read that file.')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Appearance */}
      <Card className="space-y-3">
        <SectionTitle>Appearance &amp; units</SectionTitle>
        <Field label="Theme">
          <Select
            value={settings.theme}
            onChange={(e) => saveSettings({ theme: e.target.value as ThemePref })}
          >
            <option value="system">Match system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </Field>
        <Field label="Units">
          <Select
            value={settings.units}
            onChange={(e) => saveSettings({ units: e.target.value as Units })}
          >
            <option value="metric">Metric (kg, cm, L)</option>
            <option value="imperial">Imperial (lb, in, fl oz)</option>
          </Select>
        </Field>
      </Card>

      {/* Targets */}
      <Card className="space-y-3">
        <SectionTitle>Protective targets</SectionTitle>
        <p className="text-sm text-muted">Floors to defend with your clinician, not scores to beat.</p>
        <Field
          label="Daily protein floor (g)"
          hint={band ? `Suggested band ${band.low}–${band.high} g` : undefined}
        >
          <TextInput
            type="number"
            inputMode="numeric"
            value={settings.proteinTargetG ?? ''}
            onChange={(e) =>
              saveSettings({ proteinTargetG: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Water target (ml)">
            <TextInput
              type="number"
              inputMode="numeric"
              value={settings.waterTargetMl}
              onChange={(e) => saveSettings({ waterTargetMl: Number(e.target.value) || 2750 })}
            />
          </Field>
          <Field label="Daily step target">
            <TextInput
              type="number"
              inputMode="numeric"
              value={settings.stepTarget}
              onChange={(e) => saveSettings({ stepTarget: Number(e.target.value) || 7000 })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Goal weight (${weightUnit(settings.units)})`}>
            <TextInput
              type="number"
              inputMode="decimal"
              value={settings.goalWeightKg ? Number(kgToDisplay(settings.goalWeightKg, settings.units).toFixed(1)) : ''}
              onChange={(e) =>
                saveSettings({
                  goalWeightKg: e.target.value ? displayToKg(Number(e.target.value), settings.units) : undefined,
                })
              }
            />
          </Field>
          <Field label="Injection day">
            <Select
              value={settings.injectionWeekday}
              onChange={(e) => saveSettings({ injectionWeekday: Number(e.target.value) })}
            >
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Button
          variant="ghost"
          onClick={async () => {
            const p = await requestNotificationPermission()
            if (p === 'granted') {
              scheduleInjectionReminder(settings.injectionWeekday)
              toast('Injection reminders on')
            } else {
              toast('Notifications not permitted')
            }
          }}
        >
          Enable injection-day reminders
        </Button>
      </Card>

      {/* AI coach */}
      <Card className="space-y-3">
        <SectionTitle>AI coach</SectionTitle>
        <div className="rounded-xl border border-line bg-panel2 p-3 text-xs text-muted">
          <strong className="text-ink">Privacy:</strong> your API key is stored only in this
          browser's local database. It is sent only to Anthropic (api.anthropic.com) and only when
          you request a review. The app has no server and no other network calls. Clearing it below
          removes it from this device.
        </div>
        <Field label="Anthropic API key">
          <div className="flex gap-2">
            <TextInput
              type={showKey ? 'text' : 'password'}
              value={settings.apiKey ?? ''}
              onChange={(e) => saveSettings({ apiKey: e.target.value || undefined })}
              placeholder="sk-ant-…"
              autoComplete="off"
            />
            <Button variant="ghost" onClick={() => setShowKey((s) => !s)}>
              {showKey ? 'Hide' : 'Show'}
            </Button>
          </div>
        </Field>
        <Field label="Model">
          <TextInput
            value={settings.coachModel}
            onChange={(e) => saveSettings({ coachModel: e.target.value || 'claude-sonnet-5' })}
          />
        </Field>
        {settings.apiKey && (
          <Button variant="ghost" onClick={() => saveSettings({ apiKey: undefined })}>
            Clear API key from this device
          </Button>
        )}
      </Card>

      {/* Backup */}
      <Card className="space-y-3">
        <SectionTitle
          hint={settings.lastExport ? `last: ${settings.lastExport.slice(0, 10)}` : 'never'}
        >
          Backup &amp; data
        </SectionTitle>
        <p className="text-sm text-muted">
          All your data lives only on this device. Export regularly so you don't lose it if you
          clear your browser or change phones.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              await exportJson()
              toast('Backup saved')
            }}
          >
            Export JSON backup
          </Button>
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            Restore from backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onImportFile(f)
              e.target.value = ''
            }}
          />
        </div>
        {importMsg && (
          <p className="text-sm text-muted">{importMsg}</p>
        )}
        <details>
          <summary className="cursor-pointer text-sm font-medium text-accent">Export a single table as CSV</summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TABLE_NAMES.filter((t) => t !== 'settings').map((t) => (
              <button
                key={t}
                onClick={() => exportCsv(t)}
                className="rounded-full border border-line bg-panel2 px-3 py-1.5 text-xs hover:border-accent"
              >
                {t}.csv
              </button>
            ))}
          </div>
        </details>
      </Card>

      {/* Danger zone */}
      <Card className="space-y-3">
        <SectionTitle>Reset</SectionTitle>
        {!confirmWipe ? (
          <Button variant="ghost" onClick={() => setConfirmWipe(true)}>
            Erase all data on this device
          </Button>
        ) : (
          <AlertCard
            tone="bad"
            title="Erase everything?"
            body={
              <div className="space-y-2">
                <p>This permanently deletes all your logs and settings from this device. Export a backup first if you might want it back.</p>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    onClick={async () => {
                      await wipeAll()
                      setConfirmWipe(false)
                      toast('All data erased')
                    }}
                  >
                    Yes, erase everything
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmWipe(false)}>Cancel</Button>
                </div>
              </div>
            }
          />
        )}
      </Card>

      <p className="px-1 text-center text-xs text-faint">
        Retatrutide Companion v1.0 · a companion to your doctor-supervised program, not a medical
        device. It never sets or suggests doses.
      </p>
    </div>
  )
}
