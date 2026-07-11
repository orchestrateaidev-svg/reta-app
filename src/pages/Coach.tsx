import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../db/db'
import { useSettings } from '../db/settings'
import { runCoach } from '../lib/coach'
import { Card, Button, SectionTitle, AlertCard, EmptyHint } from '../components/ui'
import { Markdown } from '../components/Markdown'
import { formatDayHuman } from '../lib/dates'

export default function Coach() {
  const settings = useSettings()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reports = useLiveQuery(
    async () => (await db.coachReports.orderBy('createdAt').reverse().limit(8).toArray()),
    [],
  )

  const hasKey = !!settings?.apiKey

  async function generate() {
    setBusy(true)
    setError(null)
    try {
      await runCoach()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Coach</h1>
        <p className="mt-1 text-sm text-muted">
          A weekly review of your own logged data. It sends a structured summary of your stats to
          Claude using your own API key — the only time this app talks to the internet. It never
          suggests doses; it helps you spot trends and prepare questions for your doctor.
        </p>
      </div>

      {!hasKey ? (
        <Card>
          <SectionTitle>Set up the coach</SectionTitle>
          <p className="text-sm text-muted">
            Add your Anthropic API key in Settings to enable weekly reviews. Your key is stored
            only on this device and is sent only to Anthropic when you request a review.
          </p>
          <Link to="/settings" className="mt-2 inline-block text-sm font-medium text-accent">
            Go to Settings →
          </Link>
        </Card>
      ) : (
        <Card className="flex items-center justify-between">
          <div className="text-sm text-muted">
            Uses model <span className="font-mono text-ink">{settings?.coachModel}</span>
          </div>
          <Button onClick={generate} disabled={busy}>
            {busy ? 'Reviewing…' : 'Generate this week’s review'}
          </Button>
        </Card>
      )}

      {error && <AlertCard tone="bad" title="Couldn't generate the review" body={error} />}

      {reports && reports.length === 0 && hasKey && (
        <EmptyHint>No reviews yet. Generate your first one above.</EmptyHint>
      )}

      <div className="space-y-3">
        {reports?.map((r) => (
          <Card key={r.id}>
            <div className="mb-1 flex items-center justify-between">
              <SectionTitle>Week of {formatDayHuman(r.weekStart)}</SectionTitle>
              <span className="text-xs text-faint">{new Date(r.createdAt).toLocaleString()}</span>
            </div>
            <Markdown source={r.reportMd} />
          </Card>
        ))}
      </div>

      <p className="px-1 text-center text-xs text-faint">
        The coach is a supportive tool, not a clinician. It routes every medical and dosing
        question back to your prescriber.
      </p>
    </div>
  )
}
