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

  it('counts chamfer corners and text under 11px', () => {
    const src = `"chamfer-corner chamfer-corner-lg text-[10px] text-[8.5px] text-[11px] text-[12px]"`
    expect(countUiTokenViolations(src)).toEqual({ chamfer: 2, 'tiny-text': 2 })
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
    })
  })
})
