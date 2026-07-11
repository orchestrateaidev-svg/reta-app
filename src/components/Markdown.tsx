// Minimal, safe markdown renderer for the coach report. Deliberately tiny:
// handles headings, bold, bullet lists and paragraphs. It NEVER uses
// dangerouslySetInnerHTML — every node is a plain React element, so coach
// output cannot inject markup.

import { Fragment, type ReactNode } from 'react'

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = /\*\*(.+?)\*\*|`(.+?)`/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      parts.push(<strong key={key++}>{m[1]}</strong>)
    } else if (m[2] !== undefined) {
      parts.push(
        <code key={key++} className="rounded bg-panel2 px-1 py-0.5 text-[0.85em]">
          {m[2]}
        </code>,
      )
    }
    last = regex.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let list: string[] = []
  let key = 0

  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={key++} className="my-2 list-disc space-y-1 pl-5 text-sm text-muted">
          {list.map((li, i) => (
            <li key={i}>{renderInline(li)}</li>
          ))}
        </ul>,
      )
      list = []
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (/^###\s+/.test(line)) {
      flushList()
      blocks.push(
        <h4 key={key++} className="mt-3 text-sm font-bold text-ink">
          {renderInline(line.replace(/^###\s+/, ''))}
        </h4>,
      )
    } else if (/^##\s+/.test(line)) {
      flushList()
      blocks.push(
        <h3 key={key++} className="mt-4 text-base font-bold text-accent">
          {renderInline(line.replace(/^##\s+/, ''))}
        </h3>,
      )
    } else if (/^[-*]\s+/.test(line)) {
      list.push(line.replace(/^[-*]\s+/, ''))
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      blocks.push(
        <p key={key++} className="my-2 text-sm leading-relaxed text-muted">
          {renderInline(line)}
        </p>,
      )
    }
  }
  flushList()
  return <Fragment>{blocks}</Fragment>
}
