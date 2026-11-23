import { describe, expect, it } from 'vitest'
import { DEFAULT_MASCOT_KEY, MASCOT_CAST, RETIRED_MASCOT_SUCCESSORS, getMascotKeys, isCrabMascot, resolveMascotAlias } from './mascots'

describe('mascot cast', () => {
  it('offers only named film renders with unique keys and files', () => {
    expect(getMascotKeys()).toEqual(['crab_juno_marsh', 'lobster_kit_shallows', 'crab_otto_basalt', 'lobster_sol_ember', 'lobster_nell_quill', 'crab_bo_pebble', 'lobster_vera_drift', 'crab_moss_tern', 'crab_maris_slate', 'lobster_cora_pearl'])
    expect(DEFAULT_MASCOT_KEY).toBe('crab_juno_marsh')
    expect(getMascotKeys()).not.toContain('lobster_clove_cinder')
    expect(new Set(getMascotKeys()).size).toBe(MASCOT_CAST.length)
    expect(new Set(MASCOT_CAST.map((m) => m.filename)).size).toBe(MASCOT_CAST.length)
    for (const m of MASCOT_CAST) expect(m.filename).toMatch(/^char_[a-z_]+_3d_[a-z]+_[0-9a-f]{8}\.webp$/)
    for (const retired of Object.keys(RETIRED_MASCOT_SUCCESSORS)) expect(getMascotKeys()).not.toContain(retired)
    expect(getMascotKeys()).not.toContain('bram_silt')
  })

  it('resolves all retired role keys and exact filenames to active successors', () => {
    expect(Object.keys(RETIRED_MASCOT_SUCCESSORS)).toHaveLength(29)
    for (const [key, successor] of Object.entries(RETIRED_MASCOT_SUCCESSORS)) {
      expect(getMascotKeys()).toContain(successor)
      expect(successor.startsWith('crab_')).toBe(key.startsWith('crab_'))
      expect(resolveMascotAlias(key)).toBe(successor)
      if (['lobster_rook_tide', 'lobster_pip_current', 'crab_mira_kelp', 'crab_cal_brack', 'lobster_tess_shoal', 'lobster_faye_ripple'].includes(key)) continue
      const stem = key === 'lobster_clove_cinder' ? 'clove_cinder_v3' : key.endsWith('_junior') ? `${key}_v2` : `${key}_adult_v2`
      expect(resolveMascotAlias(`char_${stem}.png`)).toBe(successor)
      expect(resolveMascotAlias(`char_${stem}.webp`)).toBe(successor)
    }
    const next: Record<string, string> = {
      rook_tide: 'lobster_sol_ember',
      pip_current: 'lobster_kit_shallows',
      mira_kelp: 'crab_moss_tern',
      cal_brack: 'crab_otto_basalt',
      tess_shoal: 'lobster_vera_drift',
      faye_ripple: 'lobster_nell_quill',
    }
    expect(resolveMascotAlias('Pointing')).toBe('lobster_sol_ember')
    expect(resolveMascotAlias('char_lobster_corner_peek.webp')).toBe('lobster_kit_shallows')
    expect(resolveMascotAlias('char_lobster_engineer_junior_v2.png')).toBe('lobster_nell_quill')
    expect(resolveMascotAlias('Mira')).toBe('crab_moss_tern')
    expect(resolveMascotAlias('Clove Cinder')).toBe('lobster_sol_ember')
    expect(resolveMascotAlias(' Faye Ripple ')).toBe('lobster_nell_quill')
    expect(resolveMascotAlias('sentinel')).toBe('crab_otto_basalt')
    for (const [name, key] of Object.entries(next)) {
      for (const v of ['v3', 'v4', 'v5']) {
        expect(resolveMascotAlias(`char_${name}_${v}.png`)).toBe(key)
        expect(resolveMascotAlias(`char_${name}_${v}.webp`)).toBe(key)
      }
      expect(resolveMascotAlias(`${name.startsWith('cal') || name.startsWith('mira') ? 'crab' : 'lobster'}_${name}`)).toBe(key)
    }
    expect(resolveMascotAlias('host-crab')).toBe('crab_juno_marsh')
    expect(resolveMascotAlias('junior-lobster')).toBe('lobster_kit_shallows')
    expect(resolveMascotAlias('Kit')).toBe('lobster_kit_shallows')
    expect(resolveMascotAlias('otto_basalt')).toBe('crab_otto_basalt')
    expect(resolveMascotAlias('juno:point')).toBe('crab_juno_marsh')
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
    expect(isCrabMascot('juno')).toBe(true)
    expect(isCrabMascot('kit')).toBe(false)
    expect(isCrabMascot('lobster_navigator')).toBe(false)
    expect(isCrabMascot('lobster_pip_current')).toBe(false)
  })
})
