import { getCharacterInfo, CHARACTER_REGISTRY } from './character-overlay'

describe('Character Overlay & Registry', () => {
  it('contains core registered cartoon characters with valid S3 URLs', () => {
    const keys = [
      'lobster_pointing',
      'lobster_peek',
      'lobster_thumbs_up',
      'lobster_peaceful',
      'lobster_action',
      'crab_stats',
      'crab_cling',
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
})
