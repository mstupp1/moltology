import { describe, it, expect } from 'vitest'
import {
  FEATURE_FLAGS,
  isFeatureFlagEnabled,
  isFeatureFlagPreview,
} from './feature-flags'

describe('feature-flags', () => {
  it('registers premium as an admin-only feature flag', () => {
    expect(FEATURE_FLAGS.premium).toBeDefined()
    expect(FEATURE_FLAGS.premium.audience).toBe('admin-only')
  })

  it('evaluates admin-only feature flag correctly for admins vs members', () => {
    const adminUser = { role: 'admin', experiments: ['premium'] }
    const memberUser = { role: 'user', experiments: ['premium'] }
    const guestUser = null

    expect(isFeatureFlagEnabled('premium', adminUser)).toBe(true)
    expect(isFeatureFlagEnabled('premium', memberUser, 'admin')).toBe(true)
    expect(isFeatureFlagEnabled('premium', memberUser)).toBe(false)
    expect(isFeatureFlagEnabled('premium', guestUser)).toBe(false)
  })

  it('marks admin-only flags as preview when viewed by an admin', () => {
    const adminUser = { role: 'admin', experiments: ['premium'] }
    const memberUser = { role: 'user', experiments: ['premium'] }

    expect(isFeatureFlagPreview('premium', adminUser)).toBe(true)
    expect(isFeatureFlagPreview('premium', memberUser)).toBe(false)
  })

  it('requires admins to opt in to Premium', () => {
    expect(isFeatureFlagEnabled('premium', { role: 'admin' })).toBe(false)
    expect(isFeatureFlagEnabled('premium', { role: 'admin', experiments: ['new-store'] })).toBe(false)
  })

  it('returns false for unknown feature flags', () => {
    expect(isFeatureFlagEnabled('non-existent-flag', { role: 'admin', experiments: ['premium'] })).toBe(false)
    expect(isFeatureFlagPreview('non-existent-flag', { role: 'admin', experiments: ['premium'] })).toBe(false)
  })
})
