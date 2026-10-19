import React from 'react'
import { CANONICAL_SCRIPTURES, type ScriptureItem } from '@/lib/codexData'
import { cn } from '@/lib/utils'

export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/^\s+[-*]\s+/gm, '  - ')
    .replace(/\n+/g, ' ')
    .trim()
}

export function formatCodexInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g

  let lastIdx = 0
  let m: RegExpExecArray | null

  while ((m = inlineRegex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(text.substring(lastIdx, m.index))
    }

    const matchedStr = m[0]
    const partKey = `inline-${m.index}`

    if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      parts.push(
        <code
          key={partKey}
          className="bg-current/10 border border-current/20 px-1.5 py-0.5 rounded-chip font-sans font-medium text-[0.88em]"
        >
          {matchedStr.slice(1, -1)}
        </code>
      )
    } else if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      parts.push(
        <strong key={partKey} className="font-bold opacity-100">
          {matchedStr.slice(2, -2)}
        </strong>
      )
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      parts.push(
        <em key={partKey} className="italic opacity-90">
          {matchedStr.slice(1, -1)}
        </em>
      )
    } else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
      const linkMatch = matchedStr.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        parts.push(
          <a
            key={partKey}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 opacity-90 hover:opacity-100 font-semibold"
          >
            {linkMatch[1]}
          </a>
        )
      } else {
        parts.push(matchedStr)
      }
    } else {
      parts.push(matchedStr)
    }

    lastIdx = m.index + matchedStr.length
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx))
  }

  return parts
}

type PendingItem = { kind: 'num' | 'bullet' | 'sub'; marker: string; parts: string[] }

function renderVerseBlocks(rawText: string, dropCap = false): React.ReactNode[] {
  const lines = rawText.split('\n')
  const elements: React.ReactNode[] = []

  let currentPara: string[] = []
  let currentItem: PendingItem | null = null
  let capPending = dropCap

  const flushPara = (key: string) => {
    if (currentPara.length > 0) {
      const pText = currentPara.join(' ').trim()
      if (pText) {
        elements.push(
          <p key={key} className={cn(capPending && 'codex-drop-cap')}>
            {formatCodexInline(pText)}
          </p>
        )
        capPending = false
      }
      currentPara = []
    }
  }

  // Source text is hard-wrapped, so a list item keeps the plain lines that follow it.
  const flushItem = (key: string) => {
    if (!currentItem) return
    const item = currentItem
    const text = item.parts.join(' ')
    currentItem = null
    capPending = false
    if (item.kind === 'num') {
      elements.push(
        <div key={key} className="flex items-baseline gap-3 pl-1">
          <span className="font-sans text-[0.72em] font-bold tabular-nums opacity-70 shrink-0 min-w-[1.25em]">
            {item.marker}.
          </span>
          <div className="flex-1">{formatCodexInline(text)}</div>
        </div>
      )
    } else if (item.kind === 'sub') {
      elements.push(
        <div key={key} className="flex items-baseline gap-2.5 pl-8 text-[0.95em] opacity-90">
          <span aria-hidden="true" className="opacity-50 shrink-0">–</span>
          <div className="flex-1">{formatCodexInline(text)}</div>
        </div>
      )
    } else {
      elements.push(
        <div key={key} className="flex items-baseline gap-3 pl-1">
          <span aria-hidden="true" className="text-[0.6em] opacity-60 shrink-0 -translate-y-[0.15em]">
            ◆
          </span>
          <div className="flex-1">{formatCodexInline(text)}</div>
        </div>
      )
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    const lineKey = `line-${idx}`

    if (trimmed === '') {
      flushItem(`${lineKey}-item`)
      flushPara(`${lineKey}-flush`)
      return
    }

    const numMatch = line.match(/^\s*(\d+)\.\s+(.*)$/)
    const subMatch = !numMatch && /^\s{2,}[-*]\s+/.test(line)
    const bulletMatch = !numMatch && !subMatch && /^\s*[-*]\s+/.test(line)

    if (numMatch || subMatch || bulletMatch) {
      flushItem(`${lineKey}-item`)
      flushPara(`${lineKey}-p`)
      currentItem = numMatch
        ? { kind: 'num', marker: numMatch[1], parts: [numMatch[2]] }
        : subMatch
          ? { kind: 'sub', marker: '', parts: [line.replace(/^\s{2,}[-*]\s+/, '')] }
          : { kind: 'bullet', marker: '', parts: [line.replace(/^\s*[-*]\s+/, '')] }
      return
    }

    if (currentItem) {
      currentItem.parts.push(trimmed)
      return
    }

    currentPara.push(trimmed)
  })

  flushItem('final-item')
  flushPara('final-p')

  return elements
}

/** Verse text with paragraphs and lists. `dropCap` sets an initial on the first paragraph. */
export const CodexVerseBody: React.FC<{ text: string; dropCap?: boolean }> = ({ text, dropCap = false }) => {
  if (!text) return null
  return <div className="codex-verse space-y-[0.9em]">{renderVerseBlocks(text, dropCap)}</div>
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** 2026-08-27 → 27 Aug 2026. Anything else is returned as written. */
export function formatRevisedDate(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return value
  const month = MONTHS[Number(match[2]) - 1]
  if (!month) return value
  return `${Number(match[3])} ${month} ${match[1]}`
}

function findScriptureByTitle(title: string): ScriptureItem | undefined {
  const needle = title.trim().toLowerCase()
  return CANONICAL_SCRIPTURES.find((s) => s.title.toLowerCase() === needle)
}

export interface CodexDocumentSheetProps {
  scripture: ScriptureItem
  pageIndex: number
  pageCount: number
  onPrev: () => void
  onNext: () => void
  onSelectScripture: (id: string) => void
  /** Titles shown on the previous and next buttons. */
  prevTitle?: string
  nextTitle?: string
  compact?: boolean
}

export function CodexDocumentSheet({
  scripture,
  pageIndex,
  pageCount,
  onPrev,
  onNext,
  onSelectScripture,
  prevTitle,
  nextTitle,
  compact = false,
}: CodexDocumentSheetProps) {
  const hasPrev = pageIndex > 0
  const hasNext = pageIndex < pageCount - 1

  return (
    <article className={cn('relative', compact ? 'space-y-7' : 'space-y-8 sm:space-y-10')}>
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[11px] font-bold uppercase tracking-[0.14em] opacity-70">
          <span>{scripture.volumeName}</span>
          <span aria-hidden="true">·</span>
          <span>{scripture.id}</span>
        </div>

        <h2 className="font-garamond font-bold text-[2rem] leading-[1.05] sm:text-[2.6rem] md:text-5xl tracking-[-0.01em] text-balance">
          {scripture.title}
        </h2>

        <p className="font-sans text-xs sm:text-[13px] opacity-75">
          {scripture.authorUnit}
          <span aria-hidden="true" className="mx-2">·</span>
          Revised {formatRevisedDate(scripture.lastRevised)}
        </p>
      </header>

      <figure className="border-l-2 border-current/40 pl-4 sm:pl-6 space-y-2">
        <figcaption className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] opacity-70">
          Mandate
        </figcaption>
        <blockquote className="font-garamond italic text-[1.3rem] sm:text-2xl leading-snug">
          “{scripture.mandate}”
        </blockquote>
        {scripture.latinMotto && (
          <p className="font-garamond italic text-sm tracking-[0.04em] opacity-65">{scripture.latinMotto}</p>
        )}
      </figure>

      <div className="font-garamond text-[17px] sm:text-[19px] leading-[1.7] space-y-9 hyphens-auto sm:hyphens-none">
        {scripture.verses.map((verse, index) => (
          <section key={verse.verseNumber} className="space-y-3">
            {verse.heading && (
              <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] opacity-70 pb-1.5 border-b border-current/15">
                {verse.heading}
              </h3>
            )}
            <CodexVerseBody text={verse.text} dropCap={index === 0} />
          </section>
        ))}
      </div>

      {scripture.crossReferences.length > 0 && (
        <aside className="pt-5 border-t border-current/15 space-y-3">
          <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">See also</h3>
          <ul className="flex flex-wrap gap-2">
            {scripture.crossReferences.map((ref) => {
              const matched = findScriptureByTitle(ref)
              return (
                <li key={ref}>
                  {matched ? (
                    <button
                      type="button"
                      onClick={() => onSelectScripture(matched.id)}
                      className="min-h-8 px-3 rounded-control border border-current/25 font-garamond text-[15px] hover:bg-current/10 hover:border-current/50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                    >
                      {ref}
                    </button>
                  ) : (
                    <span className="inline-flex min-h-8 items-center px-3 font-garamond text-[15px] opacity-70">{ref}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </aside>
      )}

      <nav
        aria-label="Scripture pages"
        className="no-print pt-5 border-t border-current/20 grid grid-cols-2 gap-3 font-sans"
      >
        <div>
          {hasPrev && (
            <button
              type="button"
              onClick={onPrev}
              className="group w-full h-full text-left rounded-control border border-current/20 px-3 py-2.5 hover:bg-current/[0.06] hover:border-current/40 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              <span className="block text-[11px] font-bold uppercase tracking-[0.14em] opacity-65">← Previous</span>
              {prevTitle && <span className="block font-garamond text-base leading-snug mt-0.5">{prevTitle}</span>}
            </button>
          )}
        </div>
        <div>
          {hasNext && (
            <button
              type="button"
              onClick={onNext}
              className="group w-full h-full text-right rounded-control border border-current/20 px-3 py-2.5 hover:bg-current/[0.06] hover:border-current/40 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              <span className="block text-[11px] font-bold uppercase tracking-[0.14em] opacity-65">Next →</span>
              {nextTitle && <span className="block font-garamond text-base leading-snug mt-0.5">{nextTitle}</span>}
            </button>
          )}
        </div>
        <p className="col-span-2 text-center text-[11px] uppercase tracking-[0.14em] opacity-60 tabular-nums">
          {pageIndex + 1} of {pageCount}
        </p>
      </nav>
    </article>
  )
}
