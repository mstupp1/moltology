import { describe, expect, it } from 'vitest'
import { activeExperiments, hasExperiment, isExperimentId, toggleExperiment } from './experiments'

describe('experiments', () => {
  it('only apply to admins', () => {
    expect(hasExperiment('admin', ['avatar-kit'], 'avatar-kit')).toBe(true)
    expect(hasExperiment('user', ['avatar-kit'], 'avatar-kit')).toBe(false)
    expect(hasExperiment(null, ['avatar-kit'], 'avatar-kit')).toBe(false)
  })

  it('keeps Premium and the store off until independently enabled by an admin', () => {
    for (const id of ['premium', 'new-store'] as const) {
      expect(isExperimentId(id)).toBe(true)
      expect(hasExperiment('admin', [], id)).toBe(false)
      expect(hasExperiment('admin', [id], id)).toBe(true)
      expect(hasExperiment('user', [id], id)).toBe(false)
    }
    expect(hasExperiment('admin', ['premium'], 'new-store')).toBe(false)
    expect(toggleExperiment(['premium'], 'new-store', true)).toEqual(['premium', 'new-store'])
    expect(toggleExperiment(['premium', 'new-store'], 'premium', false)).toEqual(['new-store'])
  })

  it('ignore retired or malformed stored values', () => {
    expect(activeExperiments('admin', ['old-thing', 'avatar-kit'])).toEqual(['avatar-kit'])
    expect(activeExperiments('admin', 'avatar-kit')).toEqual([])
    expect(activeExperiments('admin', null)).toEqual([])
    expect(isExperimentId('toString')).toBe(false)
  })

  it('toggle one id and drop retired ones', () => {
    expect(toggleExperiment(['old-thing'], 'avatar-kit', true)).toEqual(['avatar-kit'])
    expect(toggleExperiment(['avatar-kit'], 'avatar-kit', false)).toEqual([])
    expect(toggleExperiment(undefined, 'avatar-kit', true)).toEqual(['avatar-kit'])
  })
})
