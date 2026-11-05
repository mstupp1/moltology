import { describe, expect, it } from 'vitest'
import { MASCOT_CAST, RETIRED_MASCOT_SUCCESSORS, getMascotKeys, isCrabMascot, resolveMascotAlias } from './mascots'

describe('mascot cast', () => {
  it('offers only named film renders with unique keys and files', () => {
    expect(getMascotKeys()).toEqual(['lobster_pip_current', 'crab_mira_kelp', 'crab_cal_brack', 'lobster_clove_cinder', 'lobster_tess_shoal', 'lobster_faye_ripple'])
    expect(new Set(getMascotKeys()).size).toBe(MASCOT_CAST.length)
    expect(new Set(MASCOT_CAST.map((m) => m.filename)).size).toBe(MASCOT_CAST.length)
    for (const m of MASCOT_CAST) expect(m.filename).toMatch(/^char_[a-z_]+_v3\.webp$/)
    for (const retired of Object.keys(RETIRED_MASCOT_SUCCESSORS)) expect(getMascotKeys()).not.toContain(retired)
    expect(getMascotKeys()).not.toContain('bram_silt')
  })

  it('resolves all retired role keys and exact filenames to active successors', () => {
    expect(Object.keys(RETIRED_MASCOT_SUCCESSORS)).toHaveLength(22)
    for (const [key, successor] of Object.entries(RETIRED_MASCOT_SUCCESSORS)) {
      expect(getMascotKeys()).toContain(successor)
      expect(successor.startsWith('crab_')).toBe(key.startsWith('crab_'))
      expect(resolveMascotAlias(key)).toBe(successor)
      const stem = key.endsWith('_junior') ? `${key}_v2` : `${key}_adult_v2`
      expect(resolveMascotAlias(`char_${stem}.png`)).toBe(successor)
      expect(resolveMascotAlias(`char_${stem}.webp`)).toBe(successor)
    }
    expect(resolveMascotAlias('Pointing')).toBe('lobster_tess_shoal')
    expect(resolveMascotAlias('char_lobster_corner_peek.webp')).toBe('lobster_pip_current')
    expect(resolveMascotAlias('char_lobster_engineer_junior_v2.png')).toBe('lobster_faye_ripple')
    expect(resolveMascotAlias('char_pip_current_v3.png')).toBe('lobster_pip_current')
    expect(resolveMascotAlias('Mira')).toBe('crab_mira_kelp')
    expect(resolveMascotAlias(' Faye Ripple ')).toBe('lobster_faye_ripple')
    expect(resolveMascotAlias('sentinel')).toBe('crab_cal_brack')
    for (const m of MASCOT_CAST) {
      expect(resolveMascotAlias(m.filename)).toBe(m.key)
      expect(resolveMascotAlias(m.name)).toBe(m.key)
    }
    expect(resolveMascotAlias('char_deep_diver.png')).toBe('deep_diver')
  })

  it('keeps species-aware sizing for canonical and historical choices', () => {
    expect(isCrabMascot('stats')).toBe(true)
    expect(isCrabMascot('crab_explorer_junior')).toBe(true)
    expect(isCrabMascot('crab_mira_kelp')).toBe(true)
    expect(isCrabMascot('lobster_navigator')).toBe(false)
    expect(isCrabMascot('lobster_pip_current')).toBe(false)
  })
})
