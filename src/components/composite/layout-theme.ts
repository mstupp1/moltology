import { COSTUMES, type CostumeLockup } from '@/lib/benefits/costumes'
import type { BenefitKit } from '@/lib/benefits/types'
import { BRAND_COLORS, FONT_STACKS } from './layout-spec'

/**
 * What a layout draws with when a layer leaves something unset: the house look by default, or a
 * benefit-page costume when the spec sets `"costume": "<kit>"`. Brand tokens (`cyan`, `abyss`...)
 * keep working inside a costume; its own tokens (`ground`, `accent`, `volt`...) are added on top.
 */
export interface LayoutTheme {
  costume?: BenefitKit
  tokens: Record<string, string>
  ground: string
  text: string
  body: string
  accent: string
  accentText: string
  highlight: string
  panel: string
  panelTo: string
  line: string
  pillText: string
  pillBackground: string
  pillBorder: string
  fonts: typeof FONT_STACKS
  headline: { weight: number; uppercase?: boolean; italic?: boolean; tracking?: number; lineHeight: number }
  textShadow: 'none' | 'soft' | 'strong' | 'glow' | string
  radius: { panel: number; button: number; pill: number }
  panelShadow?: string
  buttonShadow?: (color: string) => string | undefined
  /** House layouts get a vignette unless a spec turns it off; costumes only when asked. */
  vignette: boolean
  /** House emblem glows; costumes print it flat. */
  emblemGlow: boolean
  lockup?: CostumeLockup
}

const withAlpha = (color: string, alpha: number) => `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`

export const HOUSE_THEME: LayoutTheme = {
  tokens: { ...BRAND_COLORS },
  ground: BRAND_COLORS.abyss,
  text: BRAND_COLORS.white,
  body: BRAND_COLORS.bone,
  accent: BRAND_COLORS.cyan,
  accentText: BRAND_COLORS.abyss,
  highlight: BRAND_COLORS.cyan,
  panel: BRAND_COLORS.navy,
  panelTo: BRAND_COLORS.abyss,
  line: 'rgba(0,195,255,0.35)',
  pillText: BRAND_COLORS.white,
  pillBackground: 'rgba(0,195,255,0.16)',
  pillBorder: 'rgba(0,195,255,0.5)',
  fonts: FONT_STACKS,
  headline: { weight: 700, lineHeight: 1.08 },
  textShadow: 'soft',
  radius: { panel: 28, button: 999, pill: 999 },
  panelShadow: '0 24px 60px rgba(0,0,0,0.55)',
  buttonShadow: (color) => `0 12px 40px ${withAlpha(color, 0.35)}`,
  vignette: true,
  emblemGlow: true,
}

export function themeFor(costume?: BenefitKit): LayoutTheme {
  if (!costume) return HOUSE_THEME
  const c = COSTUMES[costume]
  const { colors } = c
  return {
    costume,
    tokens: { ...BRAND_COLORS, ...colors },
    ground: colors.ground,
    text: colors.text,
    body: colors.body,
    accent: colors.accent,
    accentText: colors.accentText,
    highlight: colors.highlight,
    panel: colors.surface,
    panelTo: colors.ground,
    line: colors.line,
    pillText: colors.accentText,
    pillBackground: colors.accent,
    pillBorder: colors.accent,
    fonts: c.fonts,
    headline: { lineHeight: 1.05, ...c.headline },
    textShadow: c.textShadow ?? 'none',
    radius: c.radius,
    panelShadow: c.boxShadow ?? (c.tone === 'dark' ? '0 24px 60px rgba(0,0,0,0.45)' : '0 18px 50px rgba(30,25,20,0.12)'),
    buttonShadow: () => c.boxShadow,
    vignette: false,
    emblemGlow: false,
    lockup: c.lockup,
  }
}

/** Resolve a theme or brand token ("accent", "cyan") or pass any CSS color through. */
export function themeColor(theme: LayoutTheme, value: string | undefined, fallback: string): string {
  if (!value) return fallback
  return theme.tokens[value] ?? value
}
