import { useState } from 'react'
import { EVIDENCE, STRENGTH_ORDER, type EvidenceEntry } from '../data/evidence'
import { Card, Badge, SectionTitle } from '../components/ui'

const CATEGORIES: { id: EvidenceEntry['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'drug', label: 'The drugs' },
  { id: 'maintenance', label: 'Keeping it off' },
  { id: 'lean-mass', label: 'Lean mass' },
  { id: 'supplement', label: 'Supplements' },
  { id: 'peptide', label: 'Other peptides' },
]

const VERIFICATION_LABEL = {
  verified: 'Verified',
  preliminary: 'Preliminary — verify with source',
  unverified: 'Verify with your prescriber/source',
} as const

export default function Evidence() {
  const [cat, setCat] = useState<EvidenceEntry['category'] | 'all'>('all')
  const [open, setOpen] = useState<string | null>(null)

  const entries = EVIDENCE.filter((e) => cat === 'all' || e.category === cat).sort(
    (a, b) => STRENGTH_ORDER[a.strength] - STRENGTH_ORDER[b.strength],
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Evidence library</h1>
        <p className="mt-1 text-sm text-muted">
          Plain-English summaries of the research, with how strong the evidence is and where it
          comes from. This is education, not medical advice — and it contains no dosing
          information for anything your doctor hasn't prescribed.
        </p>
      </div>

      <div className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium ${
              cat === c.id ? 'bg-accent text-accent-ink' : 'bg-panel2 text-muted'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {entries.map((e) => {
          const isOpen = open === e.id
          return (
            <Card key={e.id} className="!p-0">
              <button
                onClick={() => setOpen(isOpen ? null : e.id)}
                aria-expanded={isOpen}
                className="flex w-full items-start justify-between gap-3 p-4 text-left"
              >
                <div>
                  <div className="font-semibold">{e.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone={e.strength}>{e.strength}</Badge>
                    {e.verification !== 'verified' && (
                      <Badge tone="warn">{VERIFICATION_LABEL[e.verification]}</Badge>
                    )}
                  </div>
                </div>
                <span aria-hidden className="mt-1 text-faint">{isOpen ? '−' : '+'}</span>
              </button>

              {isOpen && (
                <div className="space-y-3 border-t border-line p-4">
                  <p className="text-sm leading-relaxed text-muted">{e.summary}</p>

                  {e.keyNumbers && e.keyNumbers.length > 0 && (
                    <div className="grid grid-cols-1 gap-1.5 rounded-xl bg-panel2 p-3">
                      {e.keyNumbers.map((n) => (
                        <div key={n.label} className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="text-muted">{n.label}</span>
                          <span className="tnum font-semibold">{n.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {e.caveat && (
                    <p className="rounded-lg border border-warn/40 bg-warn/10 p-2.5 text-xs text-muted">
                      <strong className="text-warn">Caveat: </strong>
                      {e.caveat}
                    </p>
                  )}

                  {e.regulatory && (
                    <p className="text-xs text-faint">
                      <strong>Regulatory status:</strong> {e.regulatory}
                    </p>
                  )}

                  <div>
                    <SectionTitle>Ask your doctor</SectionTitle>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                      {e.askYourDoctor.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>

                  {e.citations.length > 0 && (
                    <div>
                      <SectionTitle>Sources</SectionTitle>
                      <ul className="space-y-1.5 text-xs text-muted">
                        {e.citations.map((c, i) => (
                          <li key={i}>
                            {c.url ? (
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-accent underline"
                              >
                                {c.text}
                              </a>
                            ) : (
                              c.text
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <p className="px-1 text-center text-xs text-faint">
        Figures web-verified on 11 July 2026. Entries marked "preliminary" or "verify" are not
        yet confirmed against a peer-reviewed publication. Always confirm with your prescriber.
      </p>
    </div>
  )
}
