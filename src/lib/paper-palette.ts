export type PaperReaderTheme = 'paper' | 'parchment' | 'night'

export interface PaperPalette {
  sheet: string
  ink: string
  muted: string
  heading: string
  rule: string
  tableHead: string
  tableBorder: string
  chipBg: string
}

/**
 * Color palettes for the document-style paper reader. The sheet/ink values are
 * kept identical to the codex reader's pdf-page-sheet themes
 * (codex-parchment-theme, codex-sepia-theme, codex-dark-theme) so the journal
 * and codex documents share a cohesive paper identity. Shared by the
 * JournalPaperReader sheet and the ScientificTable "paper" variant.
 */
export const PAPER_PALETTES: Record<PaperReaderTheme, PaperPalette> = {
  paper: {
    sheet: '#fcfaf2',
    ink: '#1c1917',
    muted: '#6f6a5c',
    heading: '#7c1f1f',
    rule: '#c7bea6',
    tableHead: '#f1ecdc',
    tableBorder: '#b6af9a',
    chipBg: '#efe9da',
  },
  parchment: {
    sheet: '#f4ecd8',
    ink: '#2b2318',
    muted: '#75684f',
    heading: '#7c1f1f',
    rule: '#c7b896',
    tableHead: '#e7d9b8',
    tableBorder: '#a89a76',
    chipBg: '#e2d3ae',
  },
  night: {
    sheet: '#12100e',
    ink: '#e6dfd5',
    muted: '#8a7f70',
    heading: '#d19a7c',
    rule: '#4a3e35',
    tableHead: '#1d1916',
    tableBorder: '#4a3e35',
    chipBg: '#1a1714',
  },
}
