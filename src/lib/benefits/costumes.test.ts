import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COSTUMES, COSTUME_KEYS } from './costumes'
import { BENEFIT_KITS } from './summaries'

/** Colors chosen for content that the landing page CSS doesn't spell out as-is. */
const DERIVED: Record<string, string[]> = {
  can: ['#ffd9cf'],
  seminar: ['#b9bfd4'],
}

describe('costume tokens', () => {
  it('has one costume per landing page kit', () => {
    expect(COSTUME_KEYS.sort()).toEqual(Object.keys(BENEFIT_KITS).sort())
  })

  it.each(COSTUME_KEYS)('%s colors match its kit CSS', (kit) => {
    const css = fs.readFileSync(`src/components/benefits/kits/${kit}/${kit}.css`, 'utf8').toLowerCase()
    const hexes = Object.values(COSTUMES[kit].colors).filter((value) => value.startsWith('#'))
    const missing = hexes.filter((hex) => !css.includes(hex.toLowerCase()) && !(DERIVED[kit] ?? []).includes(hex))
    expect(missing).toEqual([])
  })
})
