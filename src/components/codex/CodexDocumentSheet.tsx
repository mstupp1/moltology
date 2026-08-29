import React from 'react'
import { Check, Copy, Highlighter } from 'lucide-react'
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
          className="bg-current/10 border border-current/20 px-1.5 py-0.5 rounded font-sans font-medium text-[0.88em]"
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

function renderVerseBlocks(rawText: string): React.ReactNode[] {
  const lines = rawText.split('\n')
  const elements: React.ReactNode[] = []

  let currentPara: string[] = []

  const flushPara = (key: string) => {
    if (currentPara.length > 0) {
      const pText = currentPara.join(' ').trim()
      if (pText) {
        elements.push(
          <p key={key} className="leading-relaxed my-1.5">
            {formatCodexInline(pText)}
          </p>
        )
      }
      currentPara = []
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    const lineKey = `line-${idx}`

    if (trimmed === '') {
      flushPara(`${lineKey}-flush`)
      return
    }

    const numMatch = line.match(/^\s*(\d+)\.\s+(.*)$/)
    if (numMatch) {
      flushPara(`${lineKey}-p`)
      elements.push(
        <div key={lineKey} className="flex items-start gap-2.5 my-1.5 pl-1">
          <span className="font-sans text-xs font-bold opacity-80 shrink-0 mt-0.5">
            {numMatch[1]}.
          </span>
          <div className="flex-1 leading-relaxed">{formatCodexInline(numMatch[2])}</div>
        </div>
      )
      return
    }

    if (/^\s{2,}[-*]\s+/.test(line)) {
      flushPara(`${lineKey}-p`)
      const subText = line.replace(/^\s{2,}[-*]\s+/, '')
      elements.push(
        <div key={lineKey} className="flex items-start gap-2 my-1 pl-6 opacity-90 text-[0.95em]">
          <span className="opacity-50 font-sans text-[10px] shrink-0 mt-1">—</span>
          <div className="flex-1 leading-relaxed">{formatCodexInline(subText)}</div>
        </div>
      )
      return
    }

    if (/^\s*[-*]\s+/.test(line)) {
      flushPara(`${lineKey}-p`)
      const itemText = line.replace(/^\s*[-*]\s+/, '')
      elements.push(
        <div key={lineKey} className="flex items-start gap-2.5 my-1.5 pl-1">
          <span className="opacity-70 font-sans text-[10px] shrink-0 mt-1">◆</span>
          <div className="flex-1 leading-relaxed">{formatCodexInline(itemText)}</div>
        </div>
      )
      return
    }

    currentPara.push(trimmed)
  })

  flushPara('final-p')

  return elements
}

export const CodexVerseBody: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null

  const lines = text.split('\n')
  const isListFirst = /^(\s*[-*]|\s*\d+\.)\s+/.test(lines[0])

  if (isListFirst) {
    return <div className="space-y-2">{renderVerseBlocks(text)}</div>
  }

  const match = lines[0].match(/^([^\w]*)([a-zA-Z0-9])(.*)$/)
  if (!match) {
    return <div className="space-y-3">{renderVerseBlocks(text)}</div>
  }

  const [, leadingPunct, dropChar, restOfFirstLine] = match
  let adjustedFirstLine = restOfFirstLine
  if (leadingPunct.includes('**') && !restOfFirstLine.startsWith('**')) {
    adjustedFirstLine = `**${restOfFirstLine}`
  }

  const remainingText = [adjustedFirstLine, ...lines.slice(1)].join('\n')

  return (
    <div className="leading-relaxed">
      <div className="drop-cap-illuminated text-3xl md:text-4xl font-extrabold opacity-95 select-none">
        {dropChar.toUpperCase()}
      </div>
      <div className="space-y-3 pt-0.5">{renderVerseBlocks(remainingText)}</div>
    </div>
  )
}

export interface CodexDocumentSheetProps {
  scripture: ScriptureItem
  pageIndex: number
  pageCount: number
  highlightedVerses: Record<number, boolean>
  copiedVerseIndex: number | null
  onToggleHighlight: (verseNumber: number) => void
  onCopyVerse: (verseNumber: number, text: string) => void
  onPrev: () => void
  onNext: () => void
  onSelectScripture: (id: string) => void
  compact?: boolean
}

export function CodexDocumentSheet({
  scripture,
  pageIndex,
  pageCount,
  highlightedVerses,
  copiedVerseIndex,
  onToggleHighlight,
  onCopyVerse,
  onPrev,
  onNext,
  onSelectScripture,
  compact = false,
}: CodexDocumentSheetProps) {
  return (
    <div className={cn('relative space-y-6', compact ? 'space-y-5' : 'space-y-6')}>
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-[0.03] pointer-events-none scale-75"
        style={{ backgroundImage: `url('/images/order_emblem.png')` }}
      />

      <div className="border-b-2 border-current/20 pb-4 space-y-3 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-sans tracking-widest uppercase opacity-75 gap-2">
          <div className="flex items-center gap-2 font-bold">
            <span>MOLTOLOGY CANONICAL CODEX</span>
            <span>•</span>
            <span>{scripture.volumeName}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>
              CLEARANCE TIER: <strong>0{scripture.stageClearance}</strong>
            </span>
            <span>
              CANON ID: <strong>{scripture.id}</strong>
            </span>
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <h2 className="font-garamond font-extrabold text-2xl sm:text-3xl md:text-4xl tracking-tight leading-tight uppercase">
            {scripture.title}
          </h2>

          <div className="flex flex-wrap items-center justify-between text-xs font-serif opacity-80 pt-1 border-t border-current/10 gap-2">
            <div className="flex flex-wrap items-center gap-4">
              <span>
                AUTHOR: <strong className="font-sans">{scripture.authorUnit}</strong>
              </span>
              <span>
                REVISED: <strong className="font-sans">{scripture.lastRevised}</strong>
              </span>
            </div>
            <div>
              <span>
                SYNAPTIC WEIGHT:{' '}
                <strong className="font-sans">{scripture.synapticWeight.toFixed(1)} / 5.0</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 border-l-4 border-current/60 bg-current/5 rounded-r-md space-y-2 relative z-10">
        <div className="text-[11px] font-sans tracking-widest uppercase font-bold opacity-80 flex items-center justify-between gap-3">
          <span>CANONICAL MANDATE</span>
          {scripture.latinMotto && (
            <span className="font-serif italic font-normal text-xs">{scripture.latinMotto}</span>
          )}
        </div>
        <blockquote className="font-garamond italic font-semibold text-base sm:text-lg leading-relaxed">
          "{scripture.mandate}"
        </blockquote>
      </div>

      <div className="space-y-6 relative z-10 font-garamond text-[18px]">
        {scripture.verses.map((verse) => {
          const isCopied = copiedVerseIndex === verse.verseNumber
          const isHighlighted = Boolean(highlightedVerses[verse.verseNumber])

          return (
            <div
              key={verse.verseNumber}
              className={`p-4 rounded border transition-all relative group ${
                isHighlighted
                  ? 'bg-amber-500/15 border-amber-500/40 shadow-sm'
                  : 'border-current/10 hover:border-current/30 bg-current/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-current/10 pb-1.5 mb-2 font-sans text-xs opacity-75 gap-2">
                <span className="font-bold flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-current opacity-70 shrink-0" />
                  <span className="truncate">
                    VERSE §{verse.verseNumber} {verse.heading && `— ${verse.heading.toUpperCase()}`}
                  </span>
                </span>

                <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity no-print shrink-0">
                  <button
                    onClick={() => onToggleHighlight(verse.verseNumber)}
                    className={`px-2 py-1 text-[10px] rounded border flex items-center gap-1 transition-all min-h-[32px] ${
                      isHighlighted
                        ? 'bg-amber-500 text-stone-900 border-amber-500 font-bold'
                        : 'border-current/30 hover:bg-current/10'
                    }`}
                    title="Highlight Verse"
                  >
                    <Highlighter className="w-3 h-3" />
                    <span>{isHighlighted ? 'HIGHLIGHTED' : 'HIGHLIGHT'}</span>
                  </button>

                  <button
                    onClick={() => onCopyVerse(verse.verseNumber, verse.text)}
                    className="px-2 py-1 text-[10px] rounded border border-current/30 hover:bg-current/10 flex items-center gap-1 transition-all min-h-[32px]"
                    title="Copy Formatted Verse Citation"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>CITE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <CodexVerseBody text={verse.text} />
            </div>
          )
        })}
      </div>

      {scripture.crossReferences.length > 0 && (
        <div className="pt-4 border-t border-current/20 text-xs font-serif space-y-2 relative z-10">
          <div className="font-sans text-[10px] font-bold tracking-widest uppercase opacity-70">
            CANONICAL CROSS-REFERENCES & FOOTNOTES:
          </div>
          <div className="flex flex-wrap gap-2">
            {scripture.crossReferences.map((ref, i) => (
              <button
                key={i}
                onClick={() => {
                  const matched = CANONICAL_SCRIPTURES.find(
                    (s) => s.title.toLowerCase() === ref.toLowerCase()
                  )
                  if (matched) onSelectScripture(matched.id)
                }}
                className="px-2.5 py-1 rounded border border-current/30 text-xs font-serif bg-current/5 hover:bg-current/15 cursor-pointer transition-colors"
              >
                {ref}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pt-6 border-t-2 border-current/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans opacity-80 relative z-10 no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={pageIndex <= 0}
            className="px-3 py-1.5 rounded border border-current/30 hover:bg-current/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-bold"
          >
            <span>PREVIOUS</span>
          </button>

          <button
            onClick={onNext}
            disabled={pageIndex >= pageCount - 1}
            className="px-3 py-1.5 rounded border border-current/30 hover:bg-current/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-bold"
          >
            <span>NEXT SCRIPTURE</span>
          </button>
        </div>

        <div className="text-center sm:text-right font-serif">
          <span>
            Page <strong>{pageIndex + 1}</strong> of <strong>{pageCount}</strong>
          </span>
          <span className="mx-2">•</span>
          <span>Moltology Archival Canon</span>
        </div>
      </div>
    </div>
  )
}
