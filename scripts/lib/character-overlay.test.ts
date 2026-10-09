import {
  getCharacterInfo,
  CHARACTER_REGISTRY,
  getAllCharacterKeys,
  getRandomCharacterKey,
  getRandomCharacterRotation,
} from './character-overlay'

describe('Character Overlay & Registry', () => {
  it('contains core registered cartoon characters with valid S3 URLs', () => {
    const keys = [
      'lobster_pointing',
      'lobster_peek',
      'lobster_thumbs_up',
      'lobster_peaceful',
      'lobster_navigator',
      'crab_stats',
      'lobster_engineer',
      'lobster_archivist',
      'lobster_oracle_attendant',
      'crab_builder',
      'crab_explorer',
      'crab_sentinel',
      'crab_ritual_keeper',
      'lobster_pointing_junior',
      'crab_explorer_junior',
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

  it('maps retired art file names to the current renders', () => {
    expect(getCharacterInfo('char_lobster_pointing_cta.png').filename).toBe('char_lobster_pointing_adult_v2.webp')
    expect(getCharacterInfo('lobster_speed_action').key).toBe('lobster_navigator')
    expect(getCharacterInfo('char_crab_pointing_stats.webp').filename).toBe('char_crab_stats_adult_v2.webp')
  })

  it('generates unique random rotations without duplicates', () => {
    const rotation = getRandomCharacterRotation(3)
    expect(rotation.length).toBe(3)
    const uniqueKeys = new Set(rotation)
    expect(uniqueKeys.size).toBe(3)
  })
})
