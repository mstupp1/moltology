import React, { useState } from 'react'
import type { JournalPaper } from '@/lib/journal-data'
import { JOURNAL_META } from '@/lib/journal-data'
import { extractFeedTags, formatJournalInline } from '@/lib/journal-format'
import { PAPER_PALETTES, PaperReaderTheme } from '@/lib/paper-palette'
import { JournalFeedTag, ScientificTable } from '@/components/journal/ScientificTable'
import { cn } from '@/lib/utils'

interface JournalPaperSheetProps {
  paper: JournalPaper
  theme: PaperReaderTheme
  fontSize: number
  compact?: boolean
  pageIndex?: number
  pageCount?: number
  onPrev?: () => void
  onNext?: () => void
}

/**
 * Document-style paper sheet for journal articles: serif typography, justified
 * text, captioned tables, and end-matter (integration notes, citation,
 * references). Renders the same content as the codex document sheet, for the
 * journal's peer-reviewed transmissions.
 */
export const JournalPaperSheet: React.FC<JournalPaperSheetProps> = ({
  paper,
  theme,
  fontSize,
  compact = false,
  pageIndex,
  pageCount,
  onPrev,
  onNext,
}) => {
  const [copied, setCopied] = useState(false)
  const palette = PAPER_PALETTES[theme]
  let tableCounter = 0

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(paper.citation)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard may be unavailable
    }
  }

  const showNav =
    typeof pageIndex === 'number' &&
    typeof pageCount === 'number' &&
    pageCount > 0 &&
    (Boolean(onPrev) || Boolean(onNext))

  return (
    <article
      data-testid="paper-sheet"
      className={cn(
        'relative w-full max-w-3xl chamfer-corner shadow-[0_10px_50px_rgba(0,0,0,0.65)]',
        compact ? 'p-6' : 'px-5 py-8 sm:px-10 sm:py-12'
      )}
      style={{ backgroundColor: palette.sheet, color: palette.ink, fontSize }}
    >
      {/* Head band */}
      <header className="text-center">
        <div
          className="text-[10px] uppercase font-sans tracking-[0.22em]"
          style={{ color: palette.muted }}
        >
          {JOURNAL_META.name} · {JOURNAL_META.volume} / {JOURNAL_META.issue} ·{' '}
          {JOURNAL_META.editionDate} · {JOURNAL_META.issn}
        </div>
        <div className="mt-3 h-px w-full" style={{ backgroundColor: palette.heading }} />
        <div
          className="mt-1 h-[2px] w-full"
          style={{ backgroundColor: palette.heading, opacity: 0.45 }}
        />
        <div
          className="mt-4 text-[9px] uppercase font-sans tracking-[0.28em]"
          style={{ color: palette.muted }}
        >
          {paper.classification} · {paper.paperNumber}
        </div>
        <h1 className="mt-3 font-cinzel text-[1.55em] font-bold leading-tight tracking-wide">
          {paper.title}
        </h1>
        <p className="mt-3 text-[0.95em] italic leading-relaxed" style={{ color: palette.muted }}>
          {paper.subtitle}
        </p>

        <div className="mt-5 space-y-1">
          <div className="text-[1.02em] font-semibold">
            {paper.authors.map((author, i) => (
              <span key={i}>
                {author.name}
                <sup className="text-[0.7em]" style={{ color: palette.heading }}>
                  {i + 1}
                </sup>
                {i < paper.authors.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
          <div className="text-[0.8em]" style={{ color: palette.muted }}>
            {paper.authors.map((author, i) => (
              <span key={i} className="block">
                <sup className="text-[0.85em]" style={{ color: palette.heading }}>
                  {i + 1}
                </sup>{' '}
                {author.affiliation}
              </span>
            ))}
          </div>
          <div className="pt-1 text-[0.75em] font-sans" style={{ color: palette.muted }}>
            Correspondence: {paper.correspondence} · Received {paper.publishedDate} · DOI {paper.doi}
          </div>
        </div>
      </header>

      {/* Abstract */}
      <section className="mt-6">
        <div
          className="text-center text-[10px] font-bold uppercase tracking-[0.3em]"
          style={{ color: palette.heading }}
        >
          Abstract
        </div>
        <p className="mt-2 text-left sm:text-justify text-[1em] italic leading-relaxed">{paper.abstract}</p>
        <p className="mt-2 text-left sm:text-justify text-[0.88em] leading-relaxed" style={{ color: palette.muted }}>
          <span className="font-bold uppercase tracking-wider" style={{ color: palette.heading }}>
            Keywords:{' '}
          </span>
          {paper.keywords.join(' · ')}
        </p>
      </section>

      <div className="my-7 h-px w-full" style={{ backgroundColor: palette.rule }} />

      {/* Body sections */}
      {paper.sections.map((section) => (
        <section key={section.id} className="mt-9">
          <h2
            className="text-center text-[11px] font-bold uppercase leading-relaxed tracking-[0.18em]"
            style={{ color: palette.heading }}
          >
            {section.number}. {section.title}
          </h2>

          {section.blocks.map((block, idx) => {
            if (block.type === 'subheading') {
              return (
                <h3
                  key={idx}
                  className="mt-6 mb-1 text-[1.04em] font-bold italic leading-snug"
                  style={{ color: palette.heading }}
                >
                  {block.title}
                </h3>
              )
            }

            if (block.type === 'table') {
              tableCounter += 1
              return (
                <ScientificTable
                  key={idx}
                  theme={theme}
                  tableNumber={tableCounter}
                  caption={block.caption}
                  headers={block.headers}
                  rows={block.rows}
                />
              )
            }

            const { text, feeds } = extractFeedTags(block.text)
            return (
              <div key={idx} className="mt-2">
                <p
                  className="text-left sm:text-justify text-[1em] leading-relaxed indent-[1.6em]"
                  dangerouslySetInnerHTML={{ __html: formatJournalInline(text, 'font-bold') }}
                />
                {feeds.length > 0 && (
                  <span className="ml-6 mt-1 flex flex-wrap gap-x-2 gap-y-1">
                    {feeds.map((f) => (
                      <JournalFeedTag key={f} label={f} variant="paper" />
                    ))}
                  </span>
                )}
              </div>
            )
          })}
        </section>
      ))}

      {/* Doctrine integration addendum */}
      <section className="mt-12">
        <div className="h-px w-full" style={{ backgroundColor: palette.rule }} />
        <h2
          className="mt-6 text-center text-[11px] font-bold uppercase leading-relaxed tracking-[0.18em]"
          style={{ color: palette.heading }}
        >
          Appendix — {paper.integrationTitle}
        </h2>
        <p className="mt-3 text-left sm:text-justify text-[0.95em] leading-relaxed" style={{ color: palette.muted }}>
          {paper.integrationIntro}
        </p>
        <ol className="mt-4 space-y-3">
          {paper.integrationNotes.map((note, i) => {
            const { text, feeds } = extractFeedTags(note)
            return (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 text-[0.85em] font-bold shrink-0"
                  style={{ color: palette.heading }}
                >
                  [{i + 1}]
                </span>
                <div className="min-w-0">
                  <p
                    className="text-justify text-[0.98em] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatJournalInline(text, 'font-bold') }}
                  />
                  {feeds.length > 0 && (
                    <span className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                      {feeds.map((f) => (
                        <JournalFeedTag key={f} label={f} variant="paper" />
                      ))}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Citation + references */}
      <section className="mt-12">
        <div className="h-px w-full" style={{ backgroundColor: palette.rule }} />
        <h2
          className="mt-6 text-center text-[11px] font-bold uppercase leading-relaxed tracking-[0.18em]"
          style={{ color: palette.heading }}
        >
          Recommended Citation
        </h2>
        <blockquote
          className="mt-3 border px-4 py-3 text-[0.9em] leading-relaxed"
          style={{ borderColor: palette.rule }}
        >
          <span className="flex items-start justify-between gap-3">
            <span>{paper.citation}</span>
            <button
              type="button"
              onClick={copyCitation}
              className="no-print shrink-0 text-[0.72em] font-sans uppercase tracking-widest underline underline-offset-2"
              style={{ color: palette.heading }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </span>
        </blockquote>

        <h2
          className="mt-8 text-center text-[11px] font-bold uppercase leading-relaxed tracking-[0.18em]"
          style={{ color: palette.heading }}
        >
          References
        </h2>
        <ol className="mt-3 space-y-1.5">
          {paper.references.map((ref, i) => (
            <li key={i} className="flex gap-2 text-[0.9em] leading-relaxed">
              <span className="shrink-0 font-semibold" style={{ color: palette.heading }}>
                {i + 1}.
              </span>
              <span style={{ textIndent: '-1.2em', paddingLeft: '1.2em' }}>{ref}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Footer */}
      <footer
        className="mt-10 pt-4 text-center text-[0.75em] uppercase font-sans tracking-[0.2em]"
        style={{ borderTop: `1px solid ${palette.rule}`, color: palette.muted }}
      >
        End of transmission — {JOURNAL_META.name} {JOURNAL_META.volume} / {JOURNAL_META.issue}
      </footer>

      {/* Paper navigation */}
      {showNav && (
        <div
          className="no-print mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4 text-[0.85em] font-sans"
          style={{ borderColor: palette.rule }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrev}
              disabled={!onPrev || (pageIndex ?? 0) <= 0}
              className="px-3 py-1.5 rounded border transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5"
              style={{ borderColor: palette.rule, color: palette.ink }}
            >
              PREVIOUS PAPER
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext || (pageIndex ?? 0) >= (pageCount ?? 1) - 1}
              className="px-3 py-1.5 rounded border transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5"
              style={{ borderColor: palette.rule, color: palette.ink }}
            >
              NEXT PAPER
            </button>
          </div>

          <div className="text-center sm:text-right" style={{ color: palette.muted }}>
            Paper <strong>{(pageIndex ?? 0) + 1}</strong> of <strong>{pageCount}</strong>
            <span className="mx-2">•</span>
            {JOURNAL_META.name}
          </div>
        </div>
      )}
    </article>
  )
}

export default JournalPaperSheet
