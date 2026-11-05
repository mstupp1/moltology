import {
  getCharacterInfo,
  CHARACTER_REGISTRY,
  getAllCharacterKeys,
  getRandomCharacterKey,
  getRandomCharacterRotation,
} from './character-overlay'

describe('Character Overlay & Registry', () => {
  it('contains core registered cartoon characters with valid S3 URLs', () => {
    const keys = ['lobster_pip_current', 'crab_mira_kelp', 'crab_cal_brack', 'lobster_clove_cinder', 'lobster_tess_shoal', 'lobster_faye_ripple']

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
    expect(allKeys.length).toBe(6)

    const randomKey = getRandomCharacterKey()
    expect(allKeys).toContain(randomKey)

    // Supports exclude list
    const excludedKey = allKeys[0]
    const randomKeyWithExclude = getRandomCharacterKey([excludedKey])
    expect(randomKeyWithExclude).not.toBe(excludedKey)
    const exclusions = allKeys.filter((key) => key !== 'lobster_pip_current').map((key) => key === 'lobster_faye_ripple' ? 'thumbs_up' : key)
    expect(getRandomCharacterKey(exclusions)).toBe('lobster_pip_current')

    // Resolves 'random' keyword
    const randomInfo = getCharacterInfo('random')
    expect(randomInfo).toBeDefined()
    expect(allKeys).toContain(randomInfo.key)
  })

  it('maps retired art file names to the current renders', () => {
    expect(getCharacterInfo('char_lobster_pointing_cta.png').filename).toBe('char_tess_shoal_v3.webp')
    expect(getCharacterInfo('lobster_speed_action').key).toBe('lobster_tess_shoal')
    expect(getCharacterInfo('char_crab_pointing_stats.webp').filename).toBe('char_cal_brack_v3.webp')
  })

  it('generates unique random rotations without duplicates', () => {
    const rotation = getRandomCharacterRotation(6)
    expect(rotation.length).toBe(6)
    const uniqueKeys = new Set(rotation)
    expect(uniqueKeys.size).toBe(6)
  })
})
