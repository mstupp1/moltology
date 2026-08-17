import { describe, it, expect } from 'vitest'
import { CHARACTER_REGISTRY } from './character-overlay'

describe('Character Overlay & Registry', () => {
  it('contains all 7 homepage cartoon characters in the registry with valid S3 URLs', () => {
    const keys = [
      'lobster_pointing',
      'lobster_peek',
      'lobster_thumbs_up',
      'lobster_peaceful',
      'lobster_action',
      'crab_stats',
      'crab_cling',
    ]

    for (const key of keys) {
      const char = CHARACTER_REGISTRY[key as keyof typeof CHARACTER_REGISTRY]
      expect(char).toBeDefined()
      expect(char.filename).toContain('char_')
      expect(char.publicUrl).toContain('moltology-public-assets/images/characters/')
      expect(char.publicUrl).toContain(char.filename)
    }
  })
})
