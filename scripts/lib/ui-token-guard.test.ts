import { describe, expect, it } from 'vitest'
import { countUiTokenViolations, findRegressions, totals } from './ui-token-guard'

describe('countUiTokenViolations', () => {
  it('counts arbitrary hex colour classes', () => {
    const src = `<div className="bg-[#0a1112] text-[#00ffff] border-b-[#3a4a49] hover:border-[#fff]" />`
    expect(countUiTokenViolations(src)['hex-color']).toBe(4)
  })

  it('ignores hex values outside colour classes', () => {
    const src = `const color = '#00c3ff'; <div style={{ color: '#fff' }} className="bg-surface-1 text-ink" />`
    expect(countUiTokenViolations(src)).toEqual({})
  })

  it('counts cut corners, text under 11px and one-off UI sizes', () => {
    const src = `"chamfer-corner chamfer-corner-lg hud-cut text-[10px] text-[8.5px] text-[11px] text-[12.5px] text-[0.8rem] text-[18px] text-[2.6rem] text-2xs text-ui"`
    expect(countUiTokenViolations(src)).toEqual({ chamfer: 3, 'tiny-text': 2, 'ui-text-size': 3 })
  })

  it('counts positive tracking, uppercase and heavy weights but not the eyebrow class or negative tracking', () => {
    const src = `"eyebrow uppercase sm:uppercase tracking-[0.08em] tracking-widest tracking-tight tracking-[-0.02em] tracking-eyebrow font-bold font-black font-semibold"`
    expect(countUiTokenViolations(src)).toEqual({ uppercase: 2, tracking: 2, 'heavy-weight': 2 })
  })

  it('counts Tailwind greys, legacy colours and glows', () => {
    const src = `"text-slate-400 border-gray-800/60 bg-benthic-border text-sacred-red bg-benthic-vignette shadow-hud-cyan shadow-[0_0_20px_rgba(0,195,255,0.4)] shadow-[0_4px_20px_rgba(0,0,0,0.45)] text-ink-muted"`
    expect(countUiTokenViolations(src)).toEqual({ 'default-grey': 2, 'legacy-token': 2, glow: 2 })
  })

  it('counts radii off the token scale but not the token names or rounded-full', () => {
    const src = `"rounded-lg rounded-t-xl rounded-[28px] rounded-sm rounded-full rounded-chip rounded-control rounded-card rounded-panel rounded-t-card rounded"`
    expect(countUiTokenViolations(src)['off-scale-radius']).toBe(4)
  })
})

describe('findRegressions', () => {
  it('flags only files that went above their baseline, treating new files as zero', () => {
    const baseline = { 'a.tsx': { 'hex-color': 3 }, 'b.tsx': { chamfer: 1 } }
    const current = { 'a.tsx': { 'hex-color': 2 }, 'b.tsx': { chamfer: 2 }, 'c.tsx': { 'tiny-text': 1 } }
    expect(findRegressions(current, baseline)).toEqual([
      { file: 'b.tsx', rule: 'chamfer', baseline: 1, current: 2 },
      { file: 'c.tsx', rule: 'tiny-text', baseline: 0, current: 1 },
    ])
  })

  it('sums totals per rule', () => {
    expect(totals({ 'a.tsx': { 'hex-color': 2 }, 'b.tsx': { 'hex-color': 1, chamfer: 1 } })).toEqual({
      'hex-color': 3,
      chamfer: 1,
      'tiny-text': 0,
      'off-scale-radius': 0,
      'ui-text-size': 0,
      tracking: 0,
      uppercase: 0,
      'heavy-weight': 0,
      'default-grey': 0,
      'legacy-token': 0,
      glow: 0,
    })
  })
})
