import { describe, expect, it } from 'vitest'
import { activeExperiments, hasExperiment, isExperimentId, toggleExperiment } from './experiments'

describe('experiments', () => {
  it('only apply to admins', () => {
    expect(hasExperiment('admin', ['new-store'], 'new-store')).toBe(true)
    expect(hasExperiment('user', ['new-store'], 'new-store')).toBe(false)
    expect(hasExperiment(null, ['new-store'], 'new-store')).toBe(false)
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
    expect(activeExperiments('admin', ['old-thing', 'avatar-kit'])).toEqual([])
    expect(activeExperiments('admin', 'new-store')).toEqual([])
    expect(activeExperiments('admin', null)).toEqual([])
    expect(isExperimentId('avatar-kit')).toBe(false)
    expect(isExperimentId('toString')).toBe(false)
  })

  it('toggle one id and drop retired ones', () => {
    expect(toggleExperiment(['old-thing'], 'new-store', true)).toEqual(['new-store'])
    expect(toggleExperiment(['new-store'], 'new-store', false)).toEqual([])
    expect(toggleExperiment(undefined, 'new-store', true)).toEqual(['new-store'])
  })
})
