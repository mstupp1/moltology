import { randomUUID } from 'node:crypto'
import { neonConfig } from '@neondatabase/serverless'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { inArray } from 'drizzle-orm'
import { getDb } from '../../db'
import {
  activityEvents,
  aiMessages,
  aiThreads,
  blogComments,
  blogPosts,
  forumBoardVisits,
  forumCategories,
  forumPosts,
  forumTopicVisits,
  forumTopics,
  friendRequests,
  friendships,
  profiles,
} from '../../db/schema'
import { resolveIntegrationDatabaseUrl } from '../../../scripts/lib/integration-database'
import {
  countPendingFriendRequestsHandler,
  getBlogCommentsHandler,
  getForumCategoriesHandler,
  getForumTopicsHandler,
  listConnectionsHandler,
  loadForumReplyPage,
} from './db-services'
import { listActivityFeed } from './activity-log'
import { getAIThreadMessages } from '../ai/service'

const db = getDb()
neonConfig.disableWarningInBrowsers = true

const run = randomUUID().slice(0, 8)
const viewer = randomUUID()
const friends: string[] = Array.from({ length: 5 }, () => randomUUID())
const stranger = randomUUID()
const memberIds = [viewer, ...friends, stranger]
const categoryId = randomUUID()
const otherCategoryId = randomUUID()
const topicId = randomUUID()
const threadId = randomUUID()
const blogPostId = randomUUID()
const at = (minute: number) => new Date(Date.UTC(2026, 10, 1, 12, minute, 0))

// Reply tree: three roots, the first with a nested chain two deep.
const rootA = randomUUID(), rootB = randomUUID(), rootC = randomUUID()
const childA1 = randomUUID(), grandchildA1 = randomUUID(), childB1 = randomUUID()

describe.skipIf(process.env.RUN_PAGINATION_INTEGRATION !== '1')('pagination on explicit development database', () => {
  beforeAll(async () => {
    expect(resolveIntegrationDatabaseUrl(process.env)).toBe(process.env.DATABASE_URL)
    await db.insert(profiles).values(memberIds.map((id, i) => ({
      id, handle: `pg_${run}_${i}`, avatarConfig: { style: 'critters', seed: id },
    })))
    await db.insert(forumCategories).values([
      { id: categoryId, slug: `pg-${run}`, name: `Paging ${run}`, description: 'Integration board' },
      { id: otherCategoryId, slug: `pg-${run}-b`, name: `Paging ${run} B`, description: 'Integration board B' },
    ])
    await db.insert(forumTopics).values({
      id: topicId, categoryId, userId: viewer, title: 'Paging thread', slug: `paging-thread-${run}`, content: 'Body',
      createdAt: at(0), lastReplyAt: at(30),
    })
    await db.insert(forumPosts).values([
      { id: rootA, topicId, userId: friends[0], content: 'Root A', upvotes: 1, createdAt: at(1) },
      { id: rootB, topicId, userId: friends[1], content: 'Root B', upvotes: 9, createdAt: at(2) },
      { id: rootC, topicId, userId: friends[2], content: 'Root C', upvotes: 5, createdAt: at(3), sunk: true },
      { id: childA1, topicId, parentId: rootA, userId: friends[1], content: 'Child A1', createdAt: at(4) },
      { id: grandchildA1, topicId, parentId: childA1, userId: friends[2], content: 'Grandchild A1', createdAt: at(5) },
      { id: childB1, topicId, parentId: rootB, userId: friends[0], content: 'Child B1', createdAt: at(6) },
    ])
    await db.insert(forumTopics).values(Array.from({ length: 4 }, (_, i) => ({
      categoryId: otherCategoryId, userId: viewer, title: `Board B topic ${i}`, slug: `paging-b-${run}-${i}`,
      content: 'Body', createdAt: at(10 + i), lastReplyAt: at(10 + i),
    })))
    const pairs = friends.map((id, i) => {
      const [userAId, userBId] = [viewer, id].sort()
      return { userAId, userBId, createdAt: at(40 + i) }
    })
    await db.insert(friendships).values(pairs)
    await db.insert(friendRequests).values({ senderId: stranger, recipientId: viewer, status: 'pending' })
    await db.insert(activityEvents).values([
      { userId: friends[0], kind: 'routine_completed', title: 'Friend pulse', detail: 'd', sourceKey: `pg-${run}-1`, visibility: 'friends', createdAt: at(50) },
      { userId: stranger, kind: 'routine_completed', title: 'Stranger pulse', detail: 'd', sourceKey: `pg-${run}-2`, visibility: 'public', createdAt: at(51) },
      { userId: viewer, kind: 'routine_completed', title: 'Own pulse', detail: 'd', sourceKey: `pg-${run}-3`, visibility: 'friends', createdAt: at(52) },
    ])
    await db.insert(aiThreads).values({ id: threadId, userId: viewer, title: 'Paging chat' })
    // Same-millisecond timestamps on purpose: the row cursor must still split them exactly.
    await db.insert(aiMessages).values(Array.from({ length: 7 }, (_, i) => ({
      threadId, userId: viewer, role: i % 2 ? 'assistant' : 'user', content: `m${i}`, createdAt: at(i < 4 ? 20 : 21),
    })))
    await db.insert(blogPosts).values({
      id: blogPostId, slug: `paging-${run}`, title: 'Paging post', summary: 's', content: 'c', authorName: 'a', category: 'news',
    } as typeof blogPosts.$inferInsert)
    await db.insert(blogComments).values(Array.from({ length: 5 }, (_, i) => ({
      postId: blogPostId, userId: friends[0], authorName: 'f', content: `comment ${i}`, createdAt: at(i),
    })) as Array<typeof blogComments.$inferInsert>)
  })

  afterAll(async () => {
    await db.delete(blogPosts).where(inArray(blogPosts.id, [blogPostId]))
    await db.delete(forumCategories).where(inArray(forumCategories.id, [categoryId, otherCategoryId]))
    await db.delete(profiles).where(inArray(profiles.id, memberIds))
  })

  it('pages forum replies by top-level reply and brings nested replies along', async () => {
    const first = await loadForumReplyPage(db, topicId, { sort: 'oldest', limit: 2 })
    expect(first.posts.map((p) => p.content)).toEqual(['Root A', 'Root B', 'Child A1', 'Grandchild A1', 'Child B1'])
    expect(first.nextOffset).toBe(2)
    const second = await loadForumReplyPage(db, topicId, { sort: 'oldest', offset: 2, limit: 2 })
    // Sunk replies sort last under every order.
    expect(second.posts.map((p) => p.content)).toEqual(['Root C'])
    expect(second.nextOffset).toBeNull()

    const top = await loadForumReplyPage(db, topicId, { sort: 'top', limit: 1 })
    expect(top.posts.map((p) => p.content)).toEqual(['Root B', 'Child B1'])
    const newest = await loadForumReplyPage(db, topicId, { sort: 'newest', limit: 1 })
    expect(newest.posts.map((p) => p.content)).toEqual(['Root B', 'Child B1'])
  })

  it('counts unread topics per board in SQL with the visit rules', async () => {
    const before = await getForumCategoriesHandler({ data: {}, context: { user: { sub: viewer }, db } as never })
    expect(before.find((c) => c.id === categoryId)?.unreadCount).toBe(1)
    expect(before.find((c) => c.id === otherCategoryId)?.unreadCount).toBe(4)

    await db.insert(forumTopicVisits).values({ userId: viewer, topicId, lastVisitedAt: at(31) })
    await db.insert(forumBoardVisits).values({ userId: viewer, categoryId: otherCategoryId, lastVisitedAt: at(12) })
    const after = await getForumCategoriesHandler({ data: {}, context: { user: { sub: viewer }, db } as never })
    expect(after.find((c) => c.id === categoryId)?.unreadCount).toBe(0)
    // Board first look at :12 leaves the topics active at :13 unread only.
    expect(after.find((c) => c.id === otherCategoryId)?.unreadCount).toBe(1)
  })

  it('pages forum topic lists with an offset', async () => {
    const page1 = await getForumTopicsHandler({ data: { categorySlug: `pg-${run}-b`, sortBy: 'latest', limit: 3 }, context: { db } as never })
    const page2 = await getForumTopicsHandler({ data: { categorySlug: `pg-${run}-b`, sortBy: 'latest', limit: 3, offset: 3 }, context: { db } as never })
    expect(page1.map((t) => t.title)).toEqual(['Board B topic 3', 'Board B topic 2', 'Board B topic 1'])
    expect(page2.map((t) => t.title)).toEqual(['Board B topic 0'])
  })

  it('pages friends newest first and counts requests without the list', async () => {
    const context = { user: { sub: viewer }, db } as never
    const first = await listConnectionsHandler({ data: { friendsLimit: 2 }, context })
    expect(first.friends.map((f) => f.id)).toEqual([friends[4], friends[3]])
    expect(first.friendCount).toBe(5)
    expect(first.nextFriendsOffset).toBe(2)
    expect(first.incoming.map((r) => r.id)).toEqual([stranger])
    const last = await listConnectionsHandler({ data: { friendsLimit: 2, friendsOffset: 4 }, context })
    expect(last.friends.map((f) => f.id)).toEqual([friends[0]])
    expect(last.nextFriendsOffset).toBeNull()

    const suggested = await listConnectionsHandler({ data: { includeSuggestions: true, friendsLimit: 1 }, context })
    expect(suggested.suggested?.some((m) => friends.includes(m.id))).toBe(false)

    expect(await countPendingFriendRequestsHandler({ data: {}, context })).toEqual({ incoming: 1 })
  })

  it('reads the Circle feed through the friendship subquery', async () => {
    const page = await listActivityFeed(db, viewer, { scope: 'circle', filter: 'all', limit: 10 })
    expect(page.events.map((e) => e.title)).toEqual(['Friend pulse'])
  })

  it('pages Oracle messages backwards by row, even within one millisecond', async () => {
    const newest = await getAIThreadMessages(threadId, viewer, { limit: 3 })
    expect(newest).toHaveLength(3)
    const older = await getAIThreadMessages(threadId, viewer, { limit: 3, before: newest[0].id })
    const oldest = await getAIThreadMessages(threadId, viewer, { limit: 3, before: older[0].id })
    const seen = [...oldest, ...older, ...newest].map((m) => m.id)
    expect(new Set(seen).size).toBe(7)
    expect(oldest).toHaveLength(1)
  })

  it('pages blog comments newest first', async () => {
    const first = await getBlogCommentsHandler({ data: { postId: blogPostId, limit: 2 }, context: { db } as never })
    expect(first.map((c) => c.content)).toEqual(['comment 4', 'comment 3'])
    const next = await getBlogCommentsHandler({ data: { postId: blogPostId, limit: 2, before: first[1].id }, context: { db } as never })
    expect(next.map((c) => c.content)).toEqual(['comment 2', 'comment 1'])
  })
})
