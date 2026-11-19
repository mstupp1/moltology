import { describe, expect, it } from 'vitest'
import { activeExperiments, hasExperiment, isExperimentId, toggleExperiment } from './experiments'

describe('experiments', () => {
  it('only apply to admins', () => {
    expect(hasExperiment('admin', ['molt-credits'], 'molt-credits')).toBe(true)
    expect(hasExperiment('user', ['molt-credits'], 'molt-credits')).toBe(false)
    expect(hasExperiment(null, ['molt-credits'], 'molt-credits')).toBe(false)
  })

  it('keeps Premium and the store off until independently enabled by an admin', () => {
    for (const id of ['premium', 'molt-credits'] as const) {
      expect(isExperimentId(id)).toBe(true)
      expect(hasExperiment('admin', [], id)).toBe(false)
      expect(hasExperiment('admin', [id], id)).toBe(true)
      expect(hasExperiment('user', [id], id)).toBe(false)
    }
    expect(hasExperiment('admin', ['premium'], 'molt-credits')).toBe(false)
    expect(toggleExperiment(['premium'], 'molt-credits', true)).toEqual(['premium', 'molt-credits'])
    expect(toggleExperiment(['premium', 'molt-credits'], 'premium', false)).toEqual(['molt-credits'])
  })

  it('keeps Molt Credit purchases admin-only', () => {
    expect(isExperimentId('molt-credits')).toBe(true)
    expect(hasExperiment('admin', ['molt-credits'], 'molt-credits')).toBe(true)
    expect(hasExperiment('user', ['molt-credits'], 'molt-credits')).toBe(false)
  })

  it('ignore retired or malformed stored values', () => {
    expect(activeExperiments('admin', ['old-thing', 'avatar-kit'])).toEqual([])
    expect(activeExperiments('admin', 'molt-credits')).toEqual([])
    expect(activeExperiments('admin', null)).toEqual([])
    expect(isExperimentId('avatar-kit')).toBe(false)
    expect(isExperimentId('toString')).toBe(false)
  })

  it('toggle one id and drop retired ones', () => {
    expect(toggleExperiment(['old-thing'], 'molt-credits', true)).toEqual(['molt-credits'])
    expect(toggleExperiment(['molt-credits'], 'molt-credits', false)).toEqual([])
    expect(toggleExperiment(undefined, 'molt-credits', true)).toEqual(['molt-credits'])
  })
})
