import { describe, expect, it } from 'vitest'
import { DEFAULT_MASCOT_KEY, MASCOT_CAST, RETIRED_MASCOT_SUCCESSORS, getMascotKeys, isCrabMascot, resolveMascotAlias } from './mascots'

describe('mascot cast', () => {
  it('offers only named film renders with unique keys and files', () => {
    expect(getMascotKeys()).toEqual(['lobster_rook_tide', 'lobster_pip_current', 'crab_mira_kelp', 'crab_cal_brack', 'lobster_tess_shoal', 'lobster_faye_ripple'])
    expect(DEFAULT_MASCOT_KEY).toBe('lobster_rook_tide')
    expect(getMascotKeys()).not.toContain('lobster_clove_cinder')
    expect(new Set(getMascotKeys()).size).toBe(MASCOT_CAST.length)
    expect(new Set(MASCOT_CAST.map((m) => m.filename)).size).toBe(MASCOT_CAST.length)
    for (const m of MASCOT_CAST) expect(m.filename).toMatch(/^char_[a-z_]+_v[34]\.webp$/)
    for (const retired of Object.keys(RETIRED_MASCOT_SUCCESSORS)) expect(getMascotKeys()).not.toContain(retired)
    expect(getMascotKeys()).not.toContain('bram_silt')
  })

  it('resolves all retired role keys and exact filenames to active successors', () => {
    expect(Object.keys(RETIRED_MASCOT_SUCCESSORS)).toHaveLength(23)
    for (const [key, successor] of Object.entries(RETIRED_MASCOT_SUCCESSORS)) {
      expect(getMascotKeys()).toContain(successor)
      expect(successor.startsWith('crab_')).toBe(key.startsWith('crab_'))
      expect(resolveMascotAlias(key)).toBe(successor)
      const stem = key === 'lobster_clove_cinder' ? 'clove_cinder_v3' : key.endsWith('_junior') ? `${key}_v2` : `${key}_adult_v2`
      expect(resolveMascotAlias(`char_${stem}.png`)).toBe(successor)
      expect(resolveMascotAlias(`char_${stem}.webp`)).toBe(successor)
    }
    expect(resolveMascotAlias('Pointing')).toBe('lobster_rook_tide')
    expect(resolveMascotAlias('char_lobster_corner_peek.webp')).toBe('lobster_pip_current')
    expect(resolveMascotAlias('char_lobster_engineer_junior_v2.png')).toBe('lobster_faye_ripple')
    expect(resolveMascotAlias('char_pip_current_v3.png')).toBe('lobster_pip_current')
    expect(resolveMascotAlias('Mira')).toBe('crab_mira_kelp')
    expect(resolveMascotAlias('Clove Cinder')).toBe('lobster_rook_tide')
    expect(resolveMascotAlias('char_rook_tide_v4.png')).toBe('lobster_rook_tide')
    for (const name of ['pip_current', 'cal_brack', 'tess_shoal', 'faye_ripple']) {
      expect(resolveMascotAlias(`char_${name}_v3.webp`)).toBe(`${name === 'cal_brack' ? 'crab' : 'lobster'}_${name}`)
    }
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
