import { describe, expect, it } from 'vitest'
import { MASCOT_CAST, getMascotKeys, isCrabMascot, resolveMascotAlias } from './mascots'

describe('mascot cast', () => {
  it('uses only the v2 renders, with unique keys and files', () => {
    expect(MASCOT_CAST).toHaveLength(22)
    expect(new Set(getMascotKeys()).size).toBe(22)
    expect(new Set(MASCOT_CAST.map((m) => m.filename)).size).toBe(22)
    for (const m of MASCOT_CAST) expect(m.filename).toMatch(/^char_[a-z_]+_v2\.webp$/)
  })

  it('resolves aliases, retired file names and render file names', () => {
    expect(resolveMascotAlias('Pointing')).toBe('lobster_pointing')
    expect(resolveMascotAlias('char_lobster_corner_peek.webp')).toBe('lobster_peek')
    expect(resolveMascotAlias('char_lobster_engineer_junior_v2.png')).toBe('lobster_engineer_junior')
    expect(resolveMascotAlias('sentinel')).toBe('crab_sentinel')
    expect(resolveMascotAlias('char_deep_diver.png')).toBe('deep_diver')
  })

  it('tells crabs from lobsters', () => {
    expect(isCrabMascot('stats')).toBe(true)
    expect(isCrabMascot('crab_explorer_junior')).toBe(true)
    expect(isCrabMascot('lobster_navigator')).toBe(false)
  })
})
