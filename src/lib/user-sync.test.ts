import { describe, it, expect } from 'vitest'
import { ensureUserProfile } from './user-sync'

describe('User Sync & Auto Profile Creation', () => {
  it('returns null gracefully when userId is null or undefined', async () => {
    const resNull = await ensureUserProfile(null)
    expect(resNull).toBeNull()

    const resUndefined = await ensureUserProfile(undefined)
    expect(resUndefined).toBeNull()
  })

  it('runs ensureUserProfile safely for valid user ID string', async () => {
    const testUserId = 'test-user-sync-id-' + Date.now()
    await expect(ensureUserProfile(testUserId)).resolves.not.toThrow()

    // Clean up test profile row from database
    const { getDb } = await import('../db')
    const { profiles } = await import('../db/schema')
    const { eq } = await import('drizzle-orm')
    await getDb().delete(profiles).where(eq(profiles.id, testUserId)).catch(() => {})
  })
})
