import React from 'react'
import { extractFeedTags, formatJournalInline } from '@/lib/journal-format'
import { PAPER_PALETTES, PaperReaderTheme } from '@/lib/paper-palette'

export type ScientificTableTheme = 'hud' | PaperReaderTheme

interface JournalFeedTagProps {
  label: string
  variant?: 'hud' | 'paper'
  className?: string
}

/**
 * Small chip rendering a [FEEDS: X] doctrinal mapping tag. The "hud" variant
 * is the HUD chrome chip; the "paper" variant is a print-style bracketed note.
 */
export const JournalFeedTag: React.FC<JournalFeedTagProps> = ({
  label,
  variant = 'hud',
  className,
}) => {
  if (variant === 'paper') {
    return (
      <span
        className={`inline-flex items-center text-[8.5px] font-mono uppercase tracking-widest border-b border-dotted ${className ?? ''}`}
        style={{ color: '#8a1f1f' }}
      >
        [{label}]
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#0b1414] border border-[#2c4648] text-[9px] font-mono uppercase tracking-widest text-[#5fc8c8] chamfer-corner ${className ?? ''}`}
    >
      <span className="w-1 h-1 rounded-full bg-[#00c3ff] shadow-[0_0_4px_#00c3ff]" />
      {label}
    </span>
  )
}

interface JournalTableCellProps {
  raw: string
  theme?: ScientificTableTheme
}

/** Renders a journal table cell body with math/bold formatting and feed chips. */
export const JournalTableCell: React.FC<JournalTableCellProps> = ({ raw, theme = 'hud' }) => {
  const { text, feeds } = extractFeedTags(raw)
  const isHud = theme === 'hud'
  const boldClass = isHud ? 'text-[#e8f6ff] font-bold' : 'font-bold'
  return (
    <span className="block">
      <span
        className={isHud ? 'text-[#dfe3e3]' : undefined}
        dangerouslySetInnerHTML={{ __html: formatJournalInline(text, boldClass) }}
      />
      {feeds.length > 0 && (
        <span className="mt-1.5 flex flex-wrap gap-1">
          {feeds.map((f) => (
            <JournalFeedTag key={f} label={f} variant={isHud ? 'hud' : 'paper'} />
          ))}
        </span>
      )}
    </span>
  )
}

interface ScientificTableProps {
  caption: string
  headers: string[]
  rows: string[][]
  tableNumber: number
  className?: string
  theme?: ScientificTableTheme
}

/**
 * Professional scientific table. The "hud" variant is the dark HUD chrome
 * panel; the paper/parchment/night variants render like a printed journal
 * table with the caption above the table and print-style borders.
 */
export const ScientificTable: React.FC<ScientificTableProps> = ({
  caption,
  headers,
  rows,
  tableNumber,
  className,
  theme = 'hud',
}) => {
  if (theme !== 'hud') {
    const palette = PAPER_PALETTES[theme]
    return (
      <figure className={`my-6 ${className ?? ''}`}>
        <figcaption
          className="mb-1.5 text-[11px] leading-snug text-justify font-garamond"
          style={{ color: palette.muted }}
        >
          <span
            className="font-bold uppercase tracking-[0.08em] mr-1"
            style={{ color: palette.heading }}
          >
            Table {tableNumber}.
          </span>
          {caption}
        </figcaption>

        <div className="overflow-x-auto touch-pan-scroll border" style={{ borderColor: palette.tableBorder }}>
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr>
                {headers.map((header, i) => (
                  <th
                    key={i}
                    className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider align-top"
                    style={{
                      backgroundColor: palette.tableHead,
                      color: palette.ink,
                      borderRight: `1px solid ${palette.tableBorder}`,
                      borderBottom: `1px solid ${palette.tableBorder}`,
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  style={{ backgroundColor: rowIdx % 2 === 1 ? palette.tableHead : 'transparent' }}
                >
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className={`px-2.5 py-2 align-top text-[11px] leading-relaxed ${
                        cellIdx === 0 ? 'font-semibold' : ''
                      }`}
                      style={{
                        color: palette.ink,
                        borderRight: `1px solid ${palette.tableBorder}`,
                        borderBottom: `1px solid ${palette.tableBorder}`,
                      }}
                    >
                      <JournalTableCell raw={cell} theme={theme} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </figure>
    )
  }

  return (
    <figure
      className={`my-6 border border-[#3a4a49]/70 bg-[#080d0d]/80 chamfer-corner overflow-hidden ${className ?? ''}`}
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#3a4a49]/60 bg-[#0b1212]/90">
        <span className="font-mono text-[10px] font-bold tracking-widest text-[#00c3ff] uppercase">
          Table {tableNumber}
        </span>
        <span className="font-mono text-[9px] tracking-widest text-[#5f7a7a] uppercase">
          Doctrinal Data Matrix
        </span>
      </div>

      <div className="overflow-x-auto touch-pan-scroll">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#00c3ff]/50">
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#9fd9e6] bg-[#0e1717] border-r border-[#3a4a49]/50 last:border-r-0 align-top"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`border-b border-[#3a4a49]/40 last:border-b-0 ${
                  rowIdx % 2 === 1 ? 'bg-[#0a1010]/60' : 'bg-transparent'
                }`}
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className={`px-3 py-2.5 align-top text-[11px] leading-relaxed border-r border-[#3a4a49]/40 last:border-r-0 ${
                      cellIdx === 0 ? 'font-grotesk font-semibold text-[#e8f6ff]' : ''
                    }`}
                  >
                    <JournalTableCell raw={cell} theme="hud" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <figcaption className="px-3 py-2 border-t border-[#3a4a49]/60 text-[10px] leading-relaxed text-[#839493] font-mono">
        <span className="text-[#00c3ff] font-bold mr-1">TABLE {tableNumber}:</span>
        {caption}
      </figcaption>
    </figure>
  )
}
