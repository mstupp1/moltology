/**
 * The ten benefit-page costumes as plain design tokens, so content outside the landing pages
 * (composite graphics, reels, decks, merch briefs) can wear the same look. The values mirror the
 * kit CSS in src/components/benefits/kits/<kit>/<kit>.css; costumes.test.ts fails when they drift.
 * What each costume says and which tricks it borrows lives in content/costumes.md.
 */
import type { BenefitKit } from './types'

/** `script` is a hand-lettered face where the costume has one (retreat), else its display face. */
export type CostumeFontRole = 'display' | 'body' | 'serif' | 'mono' | 'script'

/** The costume's take on the Moltology lockup, as drawn on its landing pages. */
export interface CostumeLockup {
  word: 'Moltology' | 'moltology'
  /** Font role for the wordmark. */
  font: CostumeFontRole
  weight: number
  uppercase?: boolean
  italic?: boolean
  /** How the emblem sits: in a round disc, a rounded tile, a seal, bare, or left out. */
  icon: 'disc' | 'tile' | 'seal' | 'bare' | 'none'
  /** Color tokens for the disc, tile or seal and the emblem inside it. Default accent and accentText. */
  iconBackground?: string
  iconColor?: string
  /** Small word before the name ("the"). */
  prefix?: string
  /** Mark after the name ("+", "/ai") or a pill ("invest"). */
  suffix?: string
  suffixStyle?: 'mark' | 'pill' | 'word'
  /** Second line under the name ("Retreat & practice"). */
  sub?: string
}

export interface CostumeTokens {
  /** Named colors. Every costume has the role names below; the rest are its own extras. */
  colors: {
    ground: string
    surface: string
    text: string
    body: string
    muted: string
    line: string
    accent: string
    /** Text on an accent fill (buttons, stickers). */
    accentText: string
    /** Highlighted words in headlines. */
    highlight: string
  } & Record<string, string>
  fonts: Record<CostumeFontRole, string>
  /** How display headlines are set. */
  headline: { weight: number; uppercase?: boolean; italic?: boolean; tracking?: number; lineHeight?: number }
  /** Corner radii in 1x canvas pixels. */
  radius: { panel: number; button: number; pill: number }
  /** A text shadow for headlines, or none. Costumes never glow. */
  textShadow?: string
  /** Shadow under panels and buttons, e.g. the can's hard offset. */
  boxShadow?: string
  /** Light costumes print dark text on a pale ground. */
  tone: 'light' | 'dark'
  lockup: CostumeLockup
}

const INTER = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, monospace"

export const COSTUMES: Record<BenefitKit, CostumeTokens> = {
  clinic: {
    tone: 'light',
    colors: {
      ground: '#f6f2ec',
      surface: '#ffffff',
      text: '#1c2626',
      body: '#3d4a49',
      muted: '#66716f',
      line: '#e4ddd3',
      accent: '#1c2626',
      accentText: '#ffffff',
      highlight: '#2f5d4f',
      blush: '#f5ddd5',
      sage: '#dde7df',
      sageInk: '#2f5d4f',
      crimson: '#d8382f',
    },
    fonts: { display: "'DM Serif Display', Georgia, serif", body: INTER, serif: "'DM Serif Display', Georgia, serif", mono: MONO, script: "'DM Serif Display', Georgia, serif" },
    headline: { weight: 400, tracking: -0.01, lineHeight: 1.05 },
    radius: { panel: 24, button: 999, pill: 999 },
    lockup: { word: 'moltology', font: 'display', weight: 400, icon: 'disc', iconBackground: 'blush', iconColor: 'crimson', suffix: '+', suffixStyle: 'mark' },
  },
  can: {
    tone: 'dark',
    colors: {
      ground: '#ff453a',
      surface: '#120807',
      text: '#fff3e3',
      body: '#fff3e3',
      muted: '#ffd9cf',
      line: '#120807',
      accent: '#c8ff3d',
      accentText: '#120807',
      highlight: '#c8ff3d',
      red: '#ff453a',
      black: '#120807',
      cream: '#fff3e3',
      lime: '#c8ff3d',
      berry: '#ff5fae',
      citrus: '#ffb21a',
      ice: '#8de8ff',
    },
    fonts: { display: "'Bowlby One', 'Arial Black', Impact, sans-serif", body: INTER, serif: "'Bowlby One', 'Arial Black', sans-serif", mono: MONO, script: "'Bowlby One', 'Arial Black', Impact, sans-serif" },
    headline: { weight: 400, uppercase: true, lineHeight: 0.95 },
    radius: { panel: 18, button: 999, pill: 999 },
    textShadow: '4px 4px 0 #120807',
    boxShadow: '6px 6px 0 #120807',
    lockup: { word: 'Moltology', font: 'display', weight: 400, uppercase: true, icon: 'bare' },
  },
  retreat: {
    tone: 'light',
    colors: {
      ground: '#f7f2ea',
      surface: '#ece3d4',
      text: '#2d3128',
      body: '#4c5145',
      muted: '#5f6457',
      line: '#d9cfbf',
      accent: '#55624d',
      accentText: '#f7f2ea',
      highlight: '#8f4c34',
      linen: '#f7f2ea',
      sand: '#ece3d4',
      sage: '#55624d',
      clay: '#8f4c34',
    },
    fonts: { display: "'EB Garamond', Garamond, Georgia, serif", body: INTER, serif: "'EB Garamond', Garamond, Georgia, serif", mono: MONO, script: "'Parisienne', 'Snell Roundhand', cursive" },
    headline: { weight: 400, lineHeight: 1.08 },
    radius: { panel: 28, button: 999, pill: 999 },
    lockup: { word: 'Moltology', font: 'script', weight: 400, icon: 'bare', iconColor: 'clay', sub: 'Retreat & practice' },
  },
  atelier: {
    tone: 'light',
    colors: {
      ground: '#f4f1ec',
      surface: '#e7e2da',
      text: '#111111',
      body: '#3d3b38',
      muted: '#6c675f',
      line: '#d3cdc3',
      accent: '#111111',
      accentText: '#f4f1ec',
      highlight: '#6c675f',
      paper: '#f4f1ec',
      greige: '#e7e2da',
      ink: '#111111',
    },
    fonts: { display: "'Bodoni Moda', 'Didot', 'Bodoni 72', Georgia, serif", body: INTER, serif: "'Bodoni Moda', 'Didot', Georgia, serif", mono: MONO, script: "'Bodoni Moda', 'Didot', 'Bodoni 72', Georgia, serif" },
    headline: { weight: 500, tracking: -0.02, lineHeight: 1 },
    radius: { panel: 0, button: 0, pill: 0 },
    lockup: { word: 'Moltology', font: 'display', weight: 500, icon: 'none', sub: 'Maison de la mue' },
  },
  ledger: {
    tone: 'light',
    colors: {
      ground: '#e6f5ea',
      surface: '#fbfdfb',
      text: '#0b3b24',
      body: '#3e5448',
      muted: '#52665a',
      line: '#d3e6d9',
      accent: '#00804a',
      accentText: '#ffffff',
      highlight: '#00804a',
      mint: '#e6f5ea',
      green: '#00804a',
      chart: '#00b264',
      deep: '#0b3b24',
    },
    fonts: { display: "'Instrument Serif', Georgia, serif", body: INTER, serif: "'Instrument Serif', Georgia, serif", mono: MONO, script: "'Instrument Serif', Georgia, serif" },
    headline: { weight: 400, tracking: -0.01, lineHeight: 1.02 },
    radius: { panel: 24, button: 999, pill: 999 },
    lockup: { word: 'moltology', font: 'body', weight: 700, icon: 'tile', iconBackground: 'deep', iconColor: 'mint', suffix: 'invest', suffixStyle: 'pill' },
  },
  locker: {
    tone: 'dark',
    colors: {
      ground: '#0c0c0c',
      surface: '#1a1a1a',
      text: '#f5f5f0',
      body: '#c9c9c2',
      muted: '#8d8d86',
      line: '#2a2a2a',
      accent: '#d8ff3c',
      accentText: '#0c0c0c',
      highlight: '#d8ff3c',
      black: '#0c0c0c',
      concrete: '#1a1a1a',
      steel: '#2a2a2a',
      volt: '#d8ff3c',
    },
    fonts: { display: "'Anton', Impact, 'Arial Narrow', sans-serif", body: INTER, serif: "'Anton', Impact, sans-serif", mono: MONO, script: "'Anton', Impact, 'Arial Narrow', sans-serif" },
    headline: { weight: 400, uppercase: true, italic: true, lineHeight: 0.95 },
    radius: { panel: 0, button: 0, pill: 0 },
    lockup: { word: 'Moltology', font: 'display', weight: 400, uppercase: true, italic: true, icon: 'bare', iconColor: 'volt' },
  },
  platform: {
    tone: 'dark',
    colors: {
      ground: '#08080d',
      surface: '#0f0f17',
      text: '#f4f4f7',
      body: '#a1a1b0',
      muted: '#8c8c9e',
      line: 'rgba(255, 255, 255, 0.09)',
      accent: '#f4f4f7',
      accentText: '#08080d',
      highlight: '#8b5cf6',
      violet: '#8b5cf6',
      blue: '#3b82f6',
    },
    fonts: { display: "'Geist', 'Inter', sans-serif", body: "'Geist', 'Inter', sans-serif", serif: "'Geist', 'Inter', sans-serif", mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace", script: "'Geist', 'Inter', sans-serif" },
    headline: { weight: 600, tracking: -0.03, lineHeight: 1.02 },
    radius: { panel: 16, button: 10, pill: 999 },
    lockup: { word: 'Moltology', font: 'display', weight: 600, icon: 'tile', iconBackground: 'violet', iconColor: 'text', suffix: '/ai', suffixStyle: 'mark' },
  },
  arcade: {
    tone: 'dark',
    colors: {
      ground: '#12082a',
      surface: '#1d1040',
      text: '#f3f0ff',
      body: '#bdb4de',
      muted: '#a297cf',
      line: '#3a2a6e',
      accent: '#3cf2e0',
      accentText: '#12082a',
      highlight: '#ff3ca6',
      night: '#12082a',
      deep: '#0b0420',
      cyan: '#3cf2e0',
      magenta: '#ff3ca6',
      gold: '#ffd23c',
    },
    fonts: { display: "'Chakra Petch', 'Inter', sans-serif", body: INTER, serif: "'Chakra Petch', 'Inter', sans-serif", mono: "'Press Start 2P', ui-monospace, monospace", script: "'Chakra Petch', 'Inter', sans-serif" },
    headline: { weight: 600, uppercase: true, lineHeight: 1 },
    radius: { panel: 0, button: 0, pill: 0 },
    lockup: { word: 'Moltology', font: 'display', weight: 600, uppercase: true, icon: 'bare', iconColor: 'cyan' },
  },
  seminar: {
    tone: 'dark',
    colors: {
      ground: '#0d1a3a',
      surface: '#fff8e8',
      text: '#fff8e8',
      body: '#e8dfc7',
      muted: '#b9bfd4',
      line: '#e8dfc7',
      accent: '#ffcf2e',
      accentText: '#0d1a3a',
      highlight: '#ffcf2e',
      navy: '#0d1a3a',
      cream: '#fff8e8',
      gold: '#ffcf2e',
      orange: '#ff8a1f',
      label: '#b35600',
    },
    fonts: { display: "'Oswald', 'Arial Narrow', Impact, sans-serif", body: INTER, serif: "'Instrument Serif', Georgia, serif", mono: MONO, script: "'Oswald', 'Arial Narrow', Impact, sans-serif" },
    headline: { weight: 600, uppercase: true, lineHeight: 1 },
    radius: { panel: 12, button: 6, pill: 4 },
    lockup: { word: 'Moltology', font: 'display', weight: 600, uppercase: true, icon: 'seal', iconBackground: 'gold', iconColor: 'navy', prefix: 'the', suffix: 'Method', suffixStyle: 'word' },
  },
  network: {
    tone: 'light',
    colors: {
      ground: '#f4f0ff',
      surface: '#ffffff',
      text: '#1b1530',
      body: '#4b4566',
      muted: '#6f6990',
      line: '#e7e1f7',
      accent: '#6b3cff',
      accentText: '#ffffff',
      highlight: '#ff4f9a',
      violet: '#6b3cff',
      pink: '#ff4f9a',
      orange: '#ff9a3c',
      lav: '#f4f0ff',
    },
    fonts: { display: "'Nunito', 'Inter', sans-serif", body: "'Nunito', 'Inter', sans-serif", serif: "'Nunito', 'Inter', sans-serif", mono: MONO, script: "'Nunito', 'Inter', sans-serif" },
    headline: { weight: 800, tracking: -0.02, lineHeight: 1.02 },
    radius: { panel: 28, button: 999, pill: 999 },
    lockup: { word: 'moltology', font: 'display', weight: 800, icon: 'tile', iconBackground: 'violet', iconColor: 'surface' },
  },
}

export const COSTUME_KEYS = Object.keys(COSTUMES) as BenefitKit[]

export function isCostume(value: unknown): value is BenefitKit {
  return typeof value === 'string' && value in COSTUMES
}
