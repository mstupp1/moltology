import { describe, it, expect } from 'vitest'
import { users, userStats, assets, dailyRoutines, sessions, accounts, changelogs } from './schema'

describe('Database Schema & RLS Policies', () => {
  it('exports all user-scoped and system tables', () => {
    expect(users).toBeDefined()
    expect(userStats).toBeDefined()
    expect(assets).toBeDefined()
    expect(dailyRoutines).toBeDefined()
    expect(sessions).toBeDefined()
    expect(accounts).toBeDefined()
    expect(changelogs).toBeDefined()
  })

  it('defines required fields on the users table', () => {
    expect(users.id).toBeDefined()
    expect(users.email).toBeDefined()
    expect(users.stage).toBeDefined()
    expect(users.moltCredits).toBeDefined()
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
