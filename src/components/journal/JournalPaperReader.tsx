import React, { useEffect, useRef, useState } from 'react'
import {
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Moon,
  FileText,
  Feather,
  BookOpen,
} from 'lucide-react'
import type { JournalPaper } from '@/lib/journal-data'
import { JOURNAL_META } from '@/lib/journal-data'
import { extractFeedTags, formatJournalInline } from '@/lib/journal-format'
import { PAPER_PALETTES, PaperReaderTheme } from '@/lib/paper-palette'
import { JournalFeedTag, ScientificTable } from '@/components/journal/ScientificTable'
import { cn } from '@/lib/utils'

interface JournalPaperReaderProps {
  paper: JournalPaper
}

const FONT_SIZE_MIN = 14
const FONT_SIZE_MAX = 22

const THEME_OPTIONS: { key: PaperReaderTheme; label: string; icon: React.ElementType }[] = [
  { key: 'paper', label: 'Paper', icon: FileText },
  { key: 'parchment', label: 'Parchment', icon: Feather },
  { key: 'night', label: 'Night', icon: Moon },
]

/**
 * Document-style paper reader for journal articles. Renders the paper as a
 * centered print sheet with serif typography, justified text, table captions
 * above tables, and end-matter (integration notes, citation, references).
 *
 * Shares the codex reader's document-review patterns: reader toolbar with
 * theme + font-size controls and a native fullscreen toggle, and the same
 * pdf-page-sheet palette values (see paper-palette.ts).
 */
export const JournalPaperReader: React.FC<JournalPaperReaderProps> = ({ paper }) => {
  const [theme, setTheme] = useState<PaperReaderTheme>('paper')
  const [fontSize, setFontSize] = useState<number>(17)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    const el = rootRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      el.requestFullscreen?.()
    }
  }

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(paper.citation)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard may be unavailable
    }
  }

  const palette = PAPER_PALETTES[theme]
  let tableCounter = 0

  return (
    <div
      ref={rootRef}
      className={cn('relative', isFullscreen && 'fixed inset-0 z-[120] overflow-y-auto bg-[#070b0b]')}
    >
      {/* Reader toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-[#3a4a49]/60 bg-[#070b0b]/90 px-3 py-2 chamfer-corner">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#00c3ff] uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            Reader
          </span>

          {/* Theme selector */}
          <div className="flex items-center gap-1">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const active = theme === opt.key
              return (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTheme(opt.key)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 text-[9px] font-mono uppercase tracking-widest border transition-colors chamfer-corner',
                    active
                      ? 'bg-[#00c3ff]/20 border-[#00c3ff]/70 text-[#00c3ff]'
                      : 'bg-transparent border-[#3a4a49]/60 text-[#839493] hover:text-[#dfe3e3] hover:border-[#00c3ff]/40'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Font size */}
          <div className="flex items-center gap-1">
            <span className="mr-1 text-[9px] font-mono uppercase tracking-widest text-[#839493]">Type</span>
            <button
              type="button"
              aria-label="Decrease font size"
              onClick={() => setFontSize((s) => Math.max(FONT_SIZE_MIN, s - 1))}
              className="w-6 h-6 inline-flex items-center justify-center border border-[#3a4a49]/60 text-[#839493] hover:text-[#00c3ff] hover:border-[#00c3ff]/40 chamfer-corner transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-7 text-center text-[10px] font-mono text-[#dfe3e3]">{fontSize}px</span>
            <button
              type="button"
              aria-label="Increase font size"
              onClick={() => setFontSize((s) => Math.min(FONT_SIZE_MAX, s + 1))}
              className="w-6 h-6 inline-flex items-center justify-center border border-[#3a4a49]/60 text-[#839493] hover:text-[#00c3ff] hover:border-[#00c3ff]/40 chamfer-corner transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono uppercase tracking-widest border border-[#3a4a49]/60 text-[#dfe3e3] hover:border-[#00c3ff]/50 hover:text-[#00c3ff] chamfer-corner transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Paper sheet */}
      <div className={cn('flex justify-center', isFullscreen && 'px-4 py-10')}>
        <article
          data-testid="paper-sheet"
          className="relative w-full max-w-3xl px-5 py-8 sm:px-10 sm:py-12 chamfer-corner shadow-[0_10px_50px_rgba(0,0,0,0.65)]"
          style={{ backgroundColor: palette.sheet, color: palette.ink, fontSize }}
        >
          {/* Head band */}
          <header className="text-center">
            <div
              className="text-[10px] uppercase font-mono tracking-[0.22em]"
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
              className="mt-4 text-[9px] uppercase font-mono tracking-[0.28em]"
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
              <div className="pt-1 text-[0.75em] font-mono" style={{ color: palette.muted }}>
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
            <p className="mt-2 text-justify text-[1em] italic leading-relaxed">{paper.abstract}</p>
            <p className="mt-2 text-justify text-[0.88em] leading-relaxed" style={{ color: palette.muted }}>
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
                      className="text-justify text-[1em] leading-relaxed indent-[1.6em]"
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
            <p className="mt-3 text-justify text-[0.95em] leading-relaxed" style={{ color: palette.muted }}>
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
                  className="shrink-0 text-[0.72em] font-mono uppercase tracking-widest underline underline-offset-2"
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
            className="mt-10 pt-4 text-center text-[0.75em] uppercase font-mono tracking-[0.2em]"
            style={{ borderTop: `1px solid ${palette.rule}`, color: palette.muted }}
          >
            End of transmission — {JOURNAL_META.name} {JOURNAL_META.volume} / {JOURNAL_META.issue}
          </footer>
        </article>
      </div>
    </div>
  )
}

export default JournalPaperReader
