import { describe, expect, it } from 'vitest'
import { CAST, DEFAULT_CAST_KEY, castStillFilename, isPose, lookHash, splitPose } from './cast'
import { parseLobsterAvatarConfig } from './lobster-avatar'
import { FISH_VOICE_CATALOG } from '../../scripts/lib/tts-providers/fish-audio'
import { getEquipmentVisual } from './avatar/equipment'

describe('content cast', () => {
  it('has eight valid 3D characters with their own voices', () => {
    expect(CAST).toHaveLength(8)
    expect(CAST.map((m) => m.key)).toContain(DEFAULT_CAST_KEY)
    for (const m of CAST) {
      expect(m.key).toMatch(/^(lobster|crab)_[a-z]+_[a-z]+$/)
      expect(m.key.startsWith(`${m.config.race}_`)).toBe(true)
      expect(parseLobsterAvatarConfig({ style: 'critters', ...m.config })).not.toBeNull()
      expect(isPose(m.pose)).toBe(true)
      expect(Object.keys(FISH_VOICE_CATALOG)).toContain(m.voice)
      expect(m.description.length).toBeGreaterThan(40)
      for (const piece of Object.values((m.config.equipment ?? {}) as Record<string, { visualKey: string }>)) {
        expect(getEquipmentVisual(piece.visualKey)).toBeDefined()
      }
    }
    const aliases = CAST.flatMap((m) => [m.key, ...m.aliases])
    expect(new Set(aliases).size).toBe(aliases.length)
    expect(new Set(CAST.map((m) => m.config.seed)).size).toBe(CAST.length)
  })

  it('names stills by look, so a changed look gets new files', () => {
    const juno = CAST.find((m) => m.key === 'crab_juno_marsh')!
    expect(castStillFilename(juno)).toBe(`char_juno_marsh_3d_wave_${lookHash(juno)}.webp`)
    expect(castStillFilename(juno, 'point')).toMatch(/^char_juno_marsh_3d_point_/)
    expect(lookHash({ config: { ...juno.config, shellColor: 'jade' } })).not.toBe(lookHash(juno))
    expect(lookHash({ config: { b: 1, a: { y: 2, x: 1 } } })).toBe(lookHash({ config: { a: { x: 1, y: 2 }, b: 1 } }))
  })

  it('splits key:pose', () => {
    expect(splitPose('juno:point')).toEqual({ key: 'juno', pose: 'point' })
    expect(splitPose('juno')).toEqual({ key: 'juno' })
    expect(splitPose('juno:dance')).toEqual({ key: 'juno:dance' })
  })
})
