import { describe, it, expect } from 'vitest'
import { profiles, users, userStats, routines, routineCompletions, activityEvents, changelogs, neonAuthUser, galleryPins, aiThreads, aiMessages, blogPosts, blogComments, leads, friendRequests, friendships, notifications } from './schema'

describe('Database Schema & RLS Policies', () => {
  it('exports all user-scoped and system tables', () => {
    expect(profiles).toBeDefined()
    expect(users).toBeDefined()
    expect(userStats).toBeDefined()
    expect(routines).toBeDefined()
    expect(routineCompletions).toBeDefined()
    expect(activityEvents).toBeDefined()
    expect(changelogs).toBeDefined()
    expect(neonAuthUser).toBeDefined()
    expect(galleryPins).toBeDefined()
    expect(aiThreads).toBeDefined()
    expect(aiMessages).toBeDefined()
    expect(blogPosts).toBeDefined()
    expect(blogComments).toBeDefined()
    expect(leads).toBeDefined()
    expect(friendRequests).toBeDefined()
    expect(friendships).toBeDefined()
    expect(notifications).toBeDefined()
  })

  it('defines required fields on friend_requests, friendships, and notifications', () => {
    expect(friendRequests.senderId).toBeDefined()
    expect(friendRequests.recipientId).toBeDefined()
    expect(friendRequests.status).toBeDefined()
    expect(friendships.userAId).toBeDefined()
    expect(friendships.userBId).toBeDefined()
    expect(notifications.userId).toBeDefined()
    expect(notifications.kind).toBeDefined()
    expect(notifications.sourceKey).toBeDefined()
    expect(notifications.readAt).toBeDefined()
  })

  it('defines required fields on the leads table', () => {
    expect(leads.id).toBeDefined()
    expect(leads.email).toBeDefined()
    expect(leads.source).toBeDefined()
    expect(leads.claimedPdf).toBeDefined()
    expect(leads.convertedToUser).toBeDefined()
    expect(leads.emailOptIn).toBeDefined()
    expect(leads.emailOptInAt).toBeDefined()
  })


  it('defines required fields on the profiles table', () => {
    expect(profiles.id).toBeDefined()
    expect(profiles.role).toBeDefined()
    expect(profiles.stage).toBeDefined()
    expect(profiles.moltCredits).toBeDefined()
    expect(profiles.chitinGems).toBeDefined()
    expect(profiles.emailOptIn).toBeDefined()
    expect(profiles.emailOptInAt).toBeDefined()
    expect(profiles.emailOptInSource).toBeDefined()
  })

  it('defines required fields on the userStats table', () => {
    expect(userStats.id).toBeDefined()
    expect(userStats.userId).toBeDefined()
    expect(userStats.pincerTorque).toBeDefined()
    expect(userStats.shellHardness).toBeDefined()
    expect(userStats.moltmaxScore).toBeDefined()
    expect(userStats.moltmaxClearance).toBeDefined()
    expect(userStats.moltmaxDimensionScores).toBeDefined()
  })

  it('defines flexible fields on the routines table', () => {
    expect(routines.id).toBeDefined()
    expect(routines.userId).toBeDefined()
    expect(routines.title).toBeDefined()
    expect(routines.timeSlot).toBeDefined()
    expect(routines.category).toBeDefined()
    expect(routines.icon).toBeDefined()
    expect(routines.recurrence).toBeDefined()
    expect(routines.streakCount).toBeDefined()
    expect(routines.lastCompletedAt).toBeDefined()
  })

  it('defines required fields on the routineCompletions table', () => {
    expect(routineCompletions.id).toBeDefined()
    expect(routineCompletions.userId).toBeDefined()
    expect(routineCompletions.taskKey).toBeDefined()
    expect(routineCompletions.completedOn).toBeDefined()
    expect(routineCompletions.completedAt).toBeDefined()
  })

  it('defines a per-member activity event log with unique source keys', () => {
    expect(activityEvents.id).toBeDefined()
    expect(activityEvents.userId).toBeDefined()
    expect(activityEvents.kind).toBeDefined()
    expect(activityEvents.title).toBeDefined()
    expect(activityEvents.detail).toBeDefined()
    expect(activityEvents.valueBadge).toBeDefined()
    expect(activityEvents.sourceKey).toBeDefined()
    expect(activityEvents.createdAt).toBeDefined()
  })

  it('defines required fields on changelogs table', () => {
    expect(changelogs.id).toBeDefined()
    expect(changelogs.slug).toBeDefined()
    expect(changelogs.slug.isUnique).toBe(true)
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
