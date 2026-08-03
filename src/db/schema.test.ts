import { describe, it, expect } from 'vitest'
import { profiles, users, userStats, assets, dailyRoutines, changelogs, neonAuthUser, galleryPins, aiThreads, aiMessages, blogPosts, blogComments } from './schema'

describe('Database Schema & RLS Policies', () => {
  it('exports all user-scoped and system tables', () => {
    expect(profiles).toBeDefined()
    expect(users).toBeDefined()
    expect(userStats).toBeDefined()
    expect(assets).toBeDefined()
    expect(dailyRoutines).toBeDefined()
    expect(changelogs).toBeDefined()
    expect(neonAuthUser).toBeDefined()
    expect(galleryPins).toBeDefined()
    expect(aiThreads).toBeDefined()
    expect(aiMessages).toBeDefined()
    expect(blogPosts).toBeDefined()
    expect(blogComments).toBeDefined()
  })

  it('defines required fields on the profiles table', () => {
    expect(profiles.id).toBeDefined()
    expect(profiles.role).toBeDefined()
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

  it('defines required fields and unique constraint on galleryPins table', () => {
    expect(galleryPins.id).toBeDefined()
    expect(galleryPins.s3Key).toBeDefined()
    expect(galleryPins.s3Key.isUnique).toBe(true)
  })

  it('defines required fields and unique constraint on blogPosts and blogComments tables', () => {
    expect(blogPosts.id).toBeDefined()
    expect(blogPosts.slug).toBeDefined()
    expect(blogPosts.slug.isUnique).toBe(true)
    expect(blogPosts.title).toBeDefined()
    expect(blogPosts.authorRole).toBeDefined()
    expect(blogPosts.likes).toBeDefined()
    expect(blogPosts.isFeatured).toBeDefined()

    expect(blogComments.id).toBeDefined()
    expect(blogComments.postId).toBeDefined()
    expect(blogComments.content).toBeDefined()
  })
})
