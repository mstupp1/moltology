import {
  getCharacterInfo,
  CHARACTER_REGISTRY,
  getAllCharacterKeys,
  getRandomCharacterKey,
  getRandomCharacterRotation,
} from './character-overlay'
import { MASCOT_REGISTRY, getMascotInfo } from '../../src/components/composite/MascotOverlay'

describe('Character Overlay & Registry', () => {
  it('keeps browser and script asset metadata aligned across adults, juniors and classes', () => {
    expect(Object.keys(CHARACTER_REGISTRY).sort()).toEqual(Object.keys(MASCOT_REGISTRY).sort())
    for (const [key, character] of Object.entries(CHARACTER_REGISTRY)) {
      const mascot = MASCOT_REGISTRY[key]
      expect(character.filename).toBe(mascot.filename)
      expect(character.publicUrl).toBe(mascot.s3Url)
      expect(character.publicUrl).toContain('?v=20261008')
      expect(character.s3Path).toBe(`images/characters/${character.filename}`)
      for (const filename of [character.filename, character.filename.replace('.webp', '.png')]) {
        expect(getCharacterInfo(filename).key).toBe(key)
        expect(getMascotInfo(filename).key).toBe(key)
      }
    }
  })

  it('resolves legacy filenames and aliases to adult successors while juniors stay separate', () => {
    const aliases = {
      'char_lobster_pointing_cta.png': 'lobster_pointing',
      'char_lobster_corner_peek.webp': 'lobster_peek',
      'char_lobster_floating_peaceful.png': 'lobster_peaceful',
      'char_crab_pointing_stats.webp': 'crab_stats',
      'LOBSTER_ACTION': 'lobster_navigator',
      hardhat: 'lobster_engineer',
    }
    for (const [alias, key] of Object.entries(aliases)) {
      expect(getCharacterInfo(alias).key).toBe(key)
      expect(getMascotInfo(alias).key).toBe(key)
      expect(getCharacterInfo(alias).filename).toContain('_adult_v2.webp')
    }
    expect(getCharacterInfo('lobster_pointing_junior').filename).toContain('_junior_v2.webp')
    expect(getMascotInfo('crab_builder_junior').filename).toContain('_junior_v2.webp')
    for (const key of ['lobster_archivist', 'crab_ritual_keeper', 'crab_sentinel', 'lobster_oracle_attendant']) {
      expect(getCharacterInfo(key).key).toBe(key)
      expect(getCharacterInfo(key).filename).toContain('_adult_v2.webp')
    }
  })

  it('contains core registered cartoon characters with valid S3 URLs', () => {
    const keys = [
      'lobster_pointing',
      'lobster_peek',
      'lobster_thumbs_up',
      'lobster_peaceful',
      'lobster_navigator',
      'crab_stats',
      'lobster_engineer',
    ]

    for (const key of keys) {
      const char = CHARACTER_REGISTRY[key]
      expect(char).toBeDefined()
      expect(char.filename).toContain('char_')
      expect(char.publicUrl).toContain('moltology-public-assets/images/characters/')
      expect(char.publicUrl).toContain(char.filename)
    }
  })

  it('dynamically resolves unlisted character keys directly to S3 images/characters path', () => {
    const info = getCharacterInfo('custom_scholar_crab')
    expect(info.filename).toBe('char_custom_scholar_crab.png')
    expect(info.publicUrl).toContain('moltology-public-assets/images/characters/char_custom_scholar_crab.png')

    const fileInfo = getCharacterInfo('char_deep_diver.png')
    expect(fileInfo.filename).toBe('char_deep_diver.png')
    expect(fileInfo.publicUrl).toContain('moltology-public-assets/images/characters/char_deep_diver.png')
  })

  it('provides random character selection across the entire registry', () => {
    const allKeys = getAllCharacterKeys()
    expect(allKeys.length).toBeGreaterThanOrEqual(7)

    const randomKey = getRandomCharacterKey()
    expect(allKeys).toContain(randomKey)

    // Supports exclude list
    const excludedKey = allKeys[0]
    const randomKeyWithExclude = getRandomCharacterKey([excludedKey])
    expect(randomKeyWithExclude).not.toBe(excludedKey)

    // Resolves 'random' keyword
    const randomInfo = getCharacterInfo('random')
    expect(randomInfo).toBeDefined()
    expect(allKeys).toContain(randomInfo.key)
  })

  it('generates unique random rotations without duplicates', () => {
    const rotation = getRandomCharacterRotation(3)
    expect(rotation.length).toBe(3)
    const uniqueKeys = new Set(rotation)
    expect(uniqueKeys.size).toBe(3)
  })
})
