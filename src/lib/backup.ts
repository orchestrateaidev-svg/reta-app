import { db, TABLE_NAMES, type TableName } from '../db/db'
import { saveSettings } from '../db/settings'
import { nowIso } from './dates'

// Full JSON export/import (backup gate 5) and per-table CSV. All local; no
// network. The export is the user's own data leaving only to a file they save.

export interface BackupFile {
  app: 'retatrutide-companion'
  version: 1
  exportedAt: string
  tables: Record<string, unknown[]>
}

export async function buildBackup(): Promise<BackupFile> {
  const tables: Record<string, unknown[]> = {}
  for (const name of TABLE_NAMES) {
    tables[name] = await db.table(name).toArray()
  }
  return {
    app: 'retatrutide-companion',
    version: 1,
    exportedAt: nowIso(),
    tables,
  }
}

export async function exportJson(): Promise<void> {
  const backup = await buildBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  downloadBlob(blob, `reta-companion-backup-${backup.exportedAt.slice(0, 10)}.json`)
  await saveSettings({ lastExport: backup.exportedAt })
}

/** Restore from a backup file. Replaces all data (after the caller confirms).
 *  Returns the number of rows imported per table. */
export async function importJson(file: BackupFile): Promise<Record<string, number>> {
  if (file.app !== 'retatrutide-companion') {
    throw new Error('This file is not a Retatrutide Companion backup.')
  }
  const counts: Record<string, number> = {}
  await db.transaction('rw', db.tables, async () => {
    for (const name of TABLE_NAMES) {
      const rows = (file.tables[name] ?? []) as unknown[]
      await db.table(name).clear()
      if (rows.length) await db.table(name).bulkAdd(rows as never[])
      counts[name] = rows.length
    }
  })
  return counts
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function exportCsv(table: TableName): Promise<void> {
  const rows = (await db.table(table).toArray()) as Record<string, unknown>[]
  const cols = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k))
      return set
    }, new Set<string>()),
  )
  const header = cols.join(',')
  const body = rows
    .map((r) => cols.map((c) => csvEscape(r[c])).join(','))
    .join('\n')
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' })
  downloadBlob(blob, `reta-${table}-${nowIso().slice(0, 10)}.csv`)
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function wipeAll(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const name of TABLE_NAMES) await db.table(name).clear()
  })
}
