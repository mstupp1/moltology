/**
 * UI token guard rules. Counts styling that bypasses the shared tokens in
 * docs/design/ui-tokens.md so new code uses `surface-*`, `line-*`, `ink-*`,
 * `cyan-*`, `crimson-*` and the `rounded-chip/control/card/panel` scale.
 */

export type UiTokenRule = 'hex-color' | 'chamfer' | 'tiny-text' | 'off-scale-radius'

export const UI_TOKEN_RULES: Record<UiTokenRule, { pattern: RegExp; hint: string }> = {
  'hex-color': {
    pattern:
      /\b(?:bg|text|border(?:-[trblxy])?|from|via|to|ring|ring-offset|fill|stroke|outline|decoration|placeholder|accent|caret|divide)-\[#[0-9a-fA-F]{3,8}\]/g,
    hint: 'use a colour token (surface-*, line-*, ink-*, cyan-*, crimson-*) instead of an arbitrary hex',
  },
  chamfer: {
    pattern: /\bchamfer-corner(?:-lg)?\b/g,
    hint: 'use rounded-control (controls) or rounded-card (panels)',
  },
  'tiny-text': {
    pattern: /\btext-\[(?:[0-9]|10)(?:\.\d+)?px\]/g,
    hint: 'nothing under 11px: use text-[11px] or larger',
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
