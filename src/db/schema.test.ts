import { describe, it, expect } from 'vitest'
import { profiles, users, userStats, assets, dailyRoutines, changelogs, neonAuthUser } from './schema'

describe('Database Schema & RLS Policies', () => {
  it('exports all user-scoped and system tables', () => {
    expect(profiles).toBeDefined()
    expect(users).toBeDefined()
    expect(userStats).toBeDefined()
    expect(assets).toBeDefined()
    expect(dailyRoutines).toBeDefined()
    expect(changelogs).toBeDefined()
    expect(neonAuthUser).toBeDefined()
  })

  it('defines required fields on the profiles table', () => {
    expect(profiles.id).toBeDefined()
    expect(profiles.stage).toBeDefined()
    expect(profiles.moltCredits).toBeDefined()
    expect(profiles.chitinGems).toBeDefined()
  })

  it('defines required fields on the userStats table', () => {
    expect(userStats.id).toBeDefined()
    expect(userStats.userId).toBeDefined()
    expect(userStats.pincerTorque).toBeDefined()
    expect(userStats.shellHardness).toBeDefined()
  })

  it('defines required fields on changelogs table', () => {
    expect(changelogs.id).toBeDefined()
    expect(changelogs.version).toBeDefined()
    expect(changelogs.title).toBeDefined()
    expect(changelogs.isPublished).toBeDefined()
  })
})
