/**
 * UI token guard rules. Counts styling that bypasses the shared tokens in
 * docs/design/ui-tokens.md and the Moltology design lock (docs/design/DESIGN.md) so new
 * code uses `surface-*`, `line-*`, `ink-*`, `cyan-*`, `crimson-*`, the type scale, sentence
 * case and the `rounded-chip/control/card/panel` scale.
 */

export type UiTokenRule =
  | 'hex-color'
  | 'chamfer'
  | 'tiny-text'
  | 'off-scale-radius'
  | 'ui-text-size'
  | 'tracking'
  | 'uppercase'
  | 'heavy-weight'
  | 'default-grey'
  | 'legacy-token'
  | 'glow'

export const UI_TOKEN_RULES: Record<UiTokenRule, { pattern: RegExp; hint: string }> = {
  'hex-color': {
    pattern:
      /\b(?:bg|text|border(?:-[trblxy])?|from|via|to|ring|ring-offset|fill|stroke|outline|decoration|placeholder|accent|caret|divide)-\[#[0-9a-fA-F]{3,8}\]/g,
    hint: 'use a colour token (surface-*, line-*, ink-*, cyan-*, crimson-*) instead of an arbitrary hex',
  },
  chamfer: {
    pattern: /\bchamfer-corner(?:-lg)?\b|\bhud-cut\b/g,
    hint: 'no cut corners: use rounded-control (controls) or rounded-card (panels)',
  },
  'tiny-text': {
    pattern: /\btext-\[(?:[0-9]|10)(?:\.\d+)?px\]/g,
    hint: 'nothing under 11px: use text-[11px] or larger',
  },
  'ui-text-size': {
    pattern: /\btext-\[(?:1[1-7](?:\.\d+)?px|0?\.\d+rem|1(?:\.0\d*)?rem)\]/g,
    hint: 'use the type scale: text-2xs (11), text-xs (12), text-ui (13), text-sm (14), text-md (15), text-base (16)',
  },
  tracking: {
    pattern: /\btracking-(?:wide|wider|widest|\[0?\.\d+em\]|\[\d+(?:\.\d+)?px\])(?![\w-])/g,
    hint: 'no positive letter-spacing on UI text: use the eyebrow class for small uppercase labels',
  },
  uppercase: {
    pattern: /(?<![\w-])uppercase(?![\w-])/g,
    hint: 'UI text is sentence case: use the eyebrow class for a small section label',
  },
  'heavy-weight': {
    pattern: /\bfont-(?:bold|extrabold|black)\b/g,
    hint: 'weights are 400 (reading), 500 (UI) and 600 (titles): use font-medium or font-semibold',
  },
  'default-grey': {
    pattern: /\b(?:text|bg|border(?:-[trblxy])?|ring|divide|from|via|to|placeholder|fill|stroke)-(?:gray|slate|zinc|neutral|stone)-\d+/g,
    hint: 'use ink-*, surface-* or line-* instead of Tailwind greys',
  },
  'legacy-token': {
    pattern: /-(?:benthic-(?:bg|dim|surface|container|high|border|outline)|sacred-(?:red|glow|dark|bg))(?![\w-])/g,
    hint: 'use surface-*, line-*, ink-* or crimson-* instead of the old benthic and sacred colours',
  },
  glow: {
    pattern: /\bshadow-(?:hud-[a-z-]+|sacred-red)\b|\b(?:drop-)?shadow-\[[^\]]*0_0_\d+px_rgba\((?:0,\s?195,\s?255|255,\s?69,\s?58|0,\s?255,\s?(?:204|255))[^\]]*\]/g,
    hint: 'depth comes from surface steps and 1px lines; glow is only for live states',
  },
  'off-scale-radius': {
    pattern: /\brounded(?:-[trbl]{1,2}|-[se]{1,2})?-(?:sm|md|lg|xl|2xl|3xl|\[[^\]]+\])(?![\w-])/g,
    hint: 'use rounded-chip, rounded-control, rounded-card or rounded-panel',
  },
}

export const UI_TOKEN_RULE_NAMES = Object.keys(UI_TOKEN_RULES) as UiTokenRule[]

export type UiTokenCounts = Partial<Record<UiTokenRule, number>>

/** Counts rule hits in one source file. Rules with no hits are omitted. */
export function countUiTokenViolations(source: string): UiTokenCounts {
  const counts: UiTokenCounts = {}
  for (const rule of UI_TOKEN_RULE_NAMES) {
    const hits = source.match(UI_TOKEN_RULES[rule].pattern)?.length ?? 0
    if (hits > 0) counts[rule] = hits
  }
  return counts
}

export type UiTokenBaseline = Record<string, UiTokenCounts>

export interface UiTokenRegression {
  file: string
  rule: UiTokenRule
  baseline: number
  current: number
}

/** Files whose count for any rule went above the baseline. New files have a baseline of 0. */
export function findRegressions(current: UiTokenBaseline, baseline: UiTokenBaseline): UiTokenRegression[] {
  const regressions: UiTokenRegression[] = []
  for (const [file, counts] of Object.entries(current)) {
    for (const rule of UI_TOKEN_RULE_NAMES) {
      const now = counts[rule] ?? 0
      const before = baseline[file]?.[rule] ?? 0
      if (now > before) regressions.push({ file, rule, baseline: before, current: now })
    }
  }
  return regressions.sort((a, b) => a.file.localeCompare(b.file) || a.rule.localeCompare(b.rule))
}

/** Total hits across all files, per rule. */
export function totals(counts: UiTokenBaseline): Record<UiTokenRule, number> {
  const sum = Object.fromEntries(UI_TOKEN_RULE_NAMES.map((rule) => [rule, 0])) as Record<UiTokenRule, number>
  for (const fileCounts of Object.values(counts)) {
    for (const rule of UI_TOKEN_RULE_NAMES) sum[rule] += fileCounts[rule] ?? 0
  }
  return sum
}
