import {
  getCharacterInfo,
  CHARACTER_REGISTRY,
  getAllCharacterKeys,
  getRandomCharacterKey,
  getRandomCharacterRotation,
} from './character-overlay'

describe('Character Overlay & Registry', () => {
  it('contains core registered cartoon characters with valid S3 URLs', () => {
    const keys = ['crab_juno_marsh', 'lobster_kit_shallows', 'crab_otto_basalt', 'lobster_sol_ember', 'lobster_nell_quill', 'crab_bo_pebble', 'lobster_vera_drift', 'crab_moss_tern']

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
    expect(allKeys.length).toBe(8)

    const randomKey = getRandomCharacterKey()
    expect(allKeys).toContain(randomKey)

    // Supports exclude list
    const excludedKey = allKeys[0]
    const randomKeyWithExclude = getRandomCharacterKey([excludedKey])
    expect(randomKeyWithExclude).not.toBe(excludedKey)
    const exclusions = allKeys.filter((key) => key !== 'lobster_kit_shallows').map((key) => key === 'lobster_sol_ember' ? 'thumbs_up' : key)
    expect(getRandomCharacterKey(exclusions)).toBe('lobster_kit_shallows')

    // Resolves 'random' keyword
    const randomInfo = getCharacterInfo('random')
    expect(randomInfo).toBeDefined()
    expect(allKeys).toContain(randomInfo.key)
  })

  it('maps retired art file names to the current renders', () => {
    expect(getCharacterInfo('char_lobster_pointing_cta.png').key).toBe('lobster_sol_ember')
    expect(getCharacterInfo('char_lobster_pointing_cta.png').filename).toMatch(/^char_sol_ember_3d_victory_[0-9a-f]{8}\.webp$/)
    expect(getCharacterInfo('lobster_speed_action').key).toBe('lobster_vera_drift')
    expect(getCharacterInfo('char_crab_pointing_stats.webp').key).toBe('crab_otto_basalt')
    expect(getCharacterInfo('char_rook_tide_v5.webp').key).toBe('lobster_sol_ember')
  })

  it('picks a posed 3D still with key:pose', () => {
    expect(getCharacterInfo('juno:point').key).toBe('crab_juno_marsh')
    expect(getCharacterInfo('juno:point').filename).toMatch(/^char_juno_marsh_3d_point_[0-9a-f]{8}\.webp$/)
    expect(getCharacterInfo('host-crab').filename).toMatch(/^char_juno_marsh_3d_wave_/)
  })

  it('generates unique random rotations without duplicates', () => {
    const rotation = getRandomCharacterRotation(6)
    expect(rotation.length).toBe(6)
    const uniqueKeys = new Set(rotation)
    expect(uniqueKeys.size).toBe(6)
  })
})
