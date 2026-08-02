import { describe, it, expect } from 'vitest'
import {
  MOCK_SEED_USERS,
  MOCK_SEED_USER_STATS,
  MOCK_SEED_ASSETS,
  MOCK_SEED_DAILY_ROUTINES,
  seedDatabase,
} from './seed'
import { resetDatabase } from './reset'

describe('Database Seed Data & CLI Utilities', () => {
  it('contains valid mock users with correct cult stage values', () => {
    expect(MOCK_SEED_USERS.length).toBeGreaterThan(0)
    for (const user of MOCK_SEED_USERS) {
      expect(user.id).toBeTruthy()
      expect(user.email).toContain('@')
      expect(user.stage).toBeGreaterThanOrEqual(1)
      expect(user.stage).toBeLessThanOrEqual(4)
      expect(typeof user.moltCredits).toBe('string')
    }
  })

  it('contains valid mock user stats matching user IDs', () => {
    expect(MOCK_SEED_USER_STATS.length).toBeGreaterThan(0)
    const userIds = MOCK_SEED_USERS.map((u) => u.id)

    for (const stats of MOCK_SEED_USER_STATS) {
      expect(userIds).toContain(stats.userId)
      expect(stats.pincerTorque).toBeGreaterThan(0)
      expect(stats.shellHardness).toBeGreaterThan(0)
      expect(stats.submergenceDepthRating).toBeGreaterThan(0)
    }
  })

  it('contains valid mock liquidated assets', () => {
    expect(MOCK_SEED_ASSETS.length).toBeGreaterThan(0)
    for (const asset of MOCK_SEED_ASSETS) {
      expect(asset.userId).toBeTruthy()
      expect(asset.assetType).toBeTruthy()
      expect(asset.description).toBeTruthy()
      expect(asset.status).toBe('TRANSMUTED')
    }
  })

  it('contains valid mock daily routines', () => {
    expect(MOCK_SEED_DAILY_ROUTINES.length).toBeGreaterThan(0)
    for (const routine of MOCK_SEED_DAILY_ROUTINES) {
      expect(routine.userId).toBeTruthy()
      expect(routine.timeSlot).toBeTruthy()
      expect(routine.description).toBeTruthy()
      expect(typeof routine.completed).toBe('boolean')
    }
  })

  it('gracefully handles missing DATABASE_URL in seedDatabase and resetDatabase', async () => {
    const seedResult = await seedDatabase('')
    expect(seedResult).toEqual({ success: false, reason: 'DATABASE_URL missing' })

    const resetResult = await resetDatabase('')
    expect(resetResult).toEqual({ success: false, reason: 'DATABASE_URL missing' })
  })
})
