import { z } from 'zod'
import type { JWTPayload } from 'jose'
import { createServerFn } from '@tanstack/react-start'
import { publicMiddleware } from './functions'
import { changelogs, profiles, users, userStats, routines, routineCompletions, blogPosts, blogComments, forumCategories, forumTopics, forumPosts, forumVotes, podcasts, leads, equipmentCatalog, userGearItems, friendRequests, friendships, notifications } from '../../db/schema'
import { getDb } from '../../db'
import { eq, desc, like, or, sql, and, asc, ne, ilike, inArray, isNull } from 'drizzle-orm'
import type { ChangelogEntry } from '../changelogs-data'
import { resolveWriteAuth } from './write-auth'
import {
  HANDLE_TAKEN_MESSAGE,
  isUniqueViolation,
  parseMemberHandle,
  resolveMemberPublicName,
} from '../member-handle'
import { INITIAL_BLOG_POSTS } from '../blog-data'
import type { BlogPostData } from '../blog-data'
import { getCategoryBgImage } from '../forum-seed-data'
import { validateForumContent } from '../community-rules'
import { slugifyForumTitle, compareHot } from '../forum-utils'
import { INITIAL_PODCASTS } from '../podcast-data'
import { getAssetUrl } from '../assets'
import type { PodcastEpisode } from '../podcast-data'
import {
  CANONICAL_ALIGNMENT_TASKS,
  TOTAL_ALIGNMENT_TASKS,
  mergeCompletions,
  computeStreak,
  shiftDays,
  localDateString,
  type AlignmentTaskItem,
} from '../alignment-tasks'
import {
  INITIAL_EQUIPMENT_CATALOG,
  STARTER_EQUIPMENT_CATALOG_IDS,
  catalogSeedInsertValues,
} from '../equipment-seed-data'
import {
  VAULT_SIZE,
  chassisTypeImageUrl,
  computeLoadoutTotals,
  planGearMove,
  planStarterGrants,
  resolveVisualType,
  normalizeEquipSlot,
  EQUIP_SLOT_IDS,
  type CatalogRef,
  type GearItemState,
  type LoadoutTotals,
  type MoveTarget,
  type EquipSlotId,
} from '../chassis-loadout'


import { getPresignedViewUrl } from '../s3-client'
import {
  formatOracleUnavailableMessage,
  getLastUserText,
  getOracleCandidateModelIds,
  pickGuestOracleResponse,
  toModelMessages,
} from '../ai/oracle-chat'
import { verifyTurnstileToken } from './turnstile'
import {
  deleteRoutineCompletedEvent,
  listActivityEventsForUser,
  recordRoutineCompletedEvent,
} from './activity-log'
import {
  assertCanSendFriendRequest,
  buildFriendNotificationCopy,
  canTransitionFriendRequest,
  getStageLabel,
  normalizeFriendPair,
  toMemberSummary,
  type ConnectionsListView,
  type MemberSearchResult,
  type PublicProfileView,
  type RelationshipState,
} from '../connections'
import {
  countUnreadNotifications,
  friendAcceptedSourceKey,
  friendRejectedSourceKey,
  friendRequestSourceKey,
  isActionableFriendRequest,
  type NotificationView,
} from '../notifications'

type Db = ReturnType<typeof getDb>


interface AuthUser extends JWTPayload {
  id?: string
}

interface ServerFnContext {
  user?: AuthUser | null
  token?: string | null
  db?: Db
}

interface ServerFnArgs<TData = any> {
  data?: TData
  context?: any
}

const toChangelogEntry = (r: {
  id: string
  slug: string
  version: string
  title: string
  category: string
  tags?: any
  summary: string
  content: string
  isPublished: boolean
  releasedAt: Date | null
  createdAt: Date | null
}): ChangelogEntry => ({
  id: r.id,
  slug: r.slug,
  version: r.version,
  title: r.title,
  category: r.category,
  tags: Array.isArray(r.tags) ? r.tags : [],
  summary: r.summary,
  content: r.content,
  isPublished: r.isPublished,
  releasedAt: r.releasedAt ? new Date(r.releasedAt).toISOString() : new Date().toISOString(),
  createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
})

/**
 * Server Function: Get published changelogs directly from the database (authoritative).
 * No static seed fallback: an unreachable/empty DB returns an empty array and logs an
 * error so misconfigurations are surfaced instead of masquerading as seed data.
 */
export const getPublicChangelogsHandler = async ({ context }: ServerFnArgs) => {
  const dbClient = context?.db || getDb()
  try {
    const records = await dbClient
      .select()
      .from(changelogs)
      .where(eq(changelogs.isPublished, true))
      .orderBy(desc(changelogs.releasedAt))

    return (records || []).map(toChangelogEntry)
  } catch (error) {
    console.error('[ServerFn getPublicChangelogsFn] DB query failed:', error)
    return []
  }
}

export const getPublicChangelogsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .handler(getPublicChangelogsHandler)

/**
 * Server Function: Get a single published changelog entry by its slug.
 */
export const getChangelogBySlugHandler = async ({ data, context }: ServerFnArgs<string>) => {
  const dbClient = context?.db || getDb()
  const slug = data
  if (!slug) return null

  try {
    const [record] = await dbClient
      .select()
      .from(changelogs)
      .where(and(eq(changelogs.slug, slug), eq(changelogs.isPublished, true)))
      .limit(1)

    return record ? toChangelogEntry(record) : null
  } catch (error) {
    console.error('[ServerFn getChangelogBySlugFn] DB query failed:', error)
    return null
  }
}

export const getChangelogBySlugFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: string) => z.string().min(1).parse(data))
  .handler(getChangelogBySlugHandler)

/**
 * Server Function: Get authenticated user profile.
 * Accepts optional Neon JWT in `data.token` when cookies are unavailable.
 */
const getUserProfileHandler = async ({ data, context }: ServerFnArgs<{ token?: string; userId?: string }>) => {
  const auth = await resolveWriteAuth({ data, context, requireAuth: false })
  if (!auth) return null

  const [profileRecord] = await auth.dbClient
    .select()
    .from(profiles)
    .where(eq(profiles.id, auth.userId))
    .limit(1)

  return profileRecord || null
}

export const getUserProfileFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: { token?: string; userId?: string }) => data ?? {})
  .handler(getUserProfileHandler)

const claimMemberHandleSchema = z.object({
  handle: z.string(),
  token: z.string().optional(),
  userId: z.string().optional(),
})

export type ClaimMemberHandleInput = z.input<typeof claimMemberHandleSchema>

export async function claimMemberHandleHandler({
  data,
  context,
}: ServerFnArgs<ClaimMemberHandleInput>) {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) {
    throw new Error('Unauthenticated: Authentication required to claim a designation.')
  }

  const parsed = parseMemberHandle(data?.handle)
  if (!parsed.ok) {
    throw new Error(parsed.message)
  }

  const { userId, dbClient } = auth
  const [taken] = await dbClient
    .select({ id: profiles.id })
    .from(profiles)
    .where(
      and(
        sql`lower(${profiles.handle}) = ${parsed.handle.toLowerCase()}`,
        ne(profiles.id, userId),
      ),
    )
    .limit(1)

  if (taken) {
    throw new Error(HANDLE_TAKEN_MESSAGE)
  }

  try {
    const [updated] = await dbClient
      .update(profiles)
      .set({ handle: parsed.handle, updatedAt: new Date() })
      .where(eq(profiles.id, userId))
      .returning()

    if (!updated) {
      throw new Error('Could not seal that designation. Try again.')
    }

    return {
      handle: updated.handle,
      displayName: resolveMemberPublicName({
        userId,
        handle: updated.handle,
        larvaId: updated.larvaId,
      }),
      larvaId: updated.larvaId,
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error(HANDLE_TAKEN_MESSAGE)
    }
    throw error
  }
}

export const claimMemberHandleFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: ClaimMemberHandleInput) => claimMemberHandleSchema.parse(data))
  .handler(claimMemberHandleHandler)

/**
 * Server Function: Get authenticated user stats.
 */
const getUserStatsHandler = async ({ data, context }: ServerFnArgs<{ token?: string }>) => {
  const auth = await resolveWriteAuth({ data, context, requireAuth: false })
  if (!auth) return null

  const [stats] = await auth.dbClient
    .select()
    .from(userStats)
    .where(eq(userStats.userId, auth.userId))
    .limit(1)

  return stats || null
}

export const getUserStatsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: { token?: string }) => data ?? {})
  .handler(getUserStatsHandler)

interface UserStatsInput {
  pincerTorque?: number
  shellHardness?: number
  processingPower?: number
  durability?: number
  clawStrength?: number
  socialDetachmentIndex?: number
  submergenceDepthRating?: number
  moltmaxScore?: number
  moltmaxClearance?: string
  moltmaxStage?: string
  moltmaxDimensionScores?: Record<string, number>
  token?: string
}

/**
 * Server Function: Update authenticated user stats with input validation.
 */
const updateUserStatsHandler = async ({ data, context }: ServerFnArgs<UserStatsInput>) => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated: Authentication required to update stats.')
  const { userId, dbClient } = auth

  await dbClient
    .insert(userStats)
    .values({ userId })
    .onConflictDoNothing()

  const input = data ?? {}
  const { token: _token, ...statsFields } = input
  const statsData = statsFields.moltmaxScore === undefined
    ? statsFields
    : { ...statsFields, moltmaxCompletedAt: new Date() }
  const [updated] = await dbClient
    .update(userStats)
    .set({ ...statsData, updatedAt: new Date() })
    .where(eq(userStats.userId, userId))
    .returning()

  return updated
}

export const updateUserStatsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: UserStatsInput) => {
    return z
      .object({
        pincerTorque: z.number().min(0).max(100).optional(),
        shellHardness: z.number().min(0).max(100).optional(),
        processingPower: z.number().min(0).max(100).optional(),
        durability: z.number().min(0).max(100).optional(),
        clawStrength: z.number().min(0).max(100).optional(),
        socialDetachmentIndex: z.number().min(0).max(100).optional(),
        submergenceDepthRating: z.number().min(0).max(100000).optional(),
        moltmaxScore: z.number().int().min(12).max(99).optional(),
        moltmaxClearance: z.string().min(1).max(10).optional(),
        moltmaxStage: z.string().min(1).max(100).optional(),
        moltmaxDimensionScores: z.record(z.string(), z.number().min(0).max(100)).optional(),
        token: z.string().optional(),
      })
      .parse(data)
  })
  .handler(updateUserStatsHandler)

interface GetAssetUrlInput {
  key: string
  expiresIn?: number
}

/**
 * Server Function: Get presigned URL for an S3 asset key.
 */
export const getS3AssetUrlHandler = async ({ data }: ServerFnArgs<GetAssetUrlInput>) => {
  if (!data?.key) {
    throw new Error('Key parameter is required')
  }
  const url = await getPresignedViewUrl(data.key, undefined, data.expiresIn || 3600)
  return { url }
}

export const getS3AssetUrlFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: GetAssetUrlInput) => {
    return z
      .object({
        key: z.string().min(1),
        expiresIn: z.number().min(60).max(86400).optional(),
      })
      .parse(data)
  })
  .handler(getS3AssetUrlHandler)

interface GetAIThreadsInput {
  userId?: string
}

/**
 * Server Function: Fetch user's AI conversation threads.
 */
const getAIThreadsHandler = async ({ data, context }: ServerFnArgs<GetAIThreadsInput>) => {
  const userId = context?.user?.sub || context?.user?.id || data?.userId
  if (!userId) return []
  try {
    const { getUserAIThreads } = await import('../ai/service')
    return await getUserAIThreads(userId)
  } catch (err) {
    console.warn('[getAIThreadsFn] DB query error:', err)
    return []
  }
}

export const getAIThreadsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: GetAIThreadsInput) => {
    return z.object({ userId: z.string().optional() }).optional().parse(data || {})
  })
  .handler(getAIThreadsHandler)

interface GetAIMessagesInput {
  threadId: string
  userId?: string
}

/**
 * Server Function: Fetch messages for a specific AI thread.
 */
const getAIMessagesHandler = async ({ data }: ServerFnArgs<GetAIMessagesInput>) => {
  if (!data?.threadId) return []
  try {
    const { getAIThreadMessages } = await import('../ai/service')
    const msgs = await getAIThreadMessages(data.threadId)
    return msgs.map((m: any) => ({
      id: m.id,
      threadId: m.threadId,
      userId: m.userId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    }))
  } catch (err) {
    console.warn('[getAIMessagesFn] DB query error:', err)
    return []
  }
}

export const getAIMessagesFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: GetAIMessagesInput) => {
    return z
      .object({
        threadId: z.string().min(1),
        userId: z.string().optional(),
      })
      .parse(data)
  })
  .handler(getAIMessagesHandler)

interface CreateAIThreadInput {
  title?: string
  persona?: string
  token?: string
}

/**
 * Server Function: Create a new AI conversation thread.
 */
const createAIThreadHandler = async ({ data, context }: ServerFnArgs<CreateAIThreadInput>) => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated')
  const { createAIThread } = await import('../ai/service')
  return await createAIThread({
    userId: auth.userId,
    title: data?.title || 'Ascendance Consultation',
    persona: data?.persona || 'oracle',
  })
}

export const createAIThreadFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: CreateAIThreadInput) => {
    return z
      .object({
        title: z.string().optional(),
        persona: z.string().optional(),
        token: z.string().optional(),
      })
      .parse(data)
  })
  .handler(createAIThreadHandler)

const serializeAIThread = (thread: any) =>
  thread
    ? {
        id: thread.id,
        title: thread.title,
        pinnedAt: thread.pinnedAt ?? null,
        archivedAt: thread.archivedAt ?? null,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      }
    : null

interface MutateAIThreadInput {
  threadId: string
  token?: string
}

/**
 * Server Function: Pin or unpin an AI conversation thread.
 */
export const pinAIThreadFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: MutateAIThreadInput & { pinned: boolean }) => {
    return z
      .object({
        threadId: z.string().min(1),
        pinned: z.boolean(),
        token: z.string().optional(),
      })
      .parse(data)
  })
  .handler(async ({ data, context }) => {
    const auth = await resolveWriteAuth({ data, context })
    if (!auth) throw new Error('Unauthenticated')
    const { pinAIThread } = await import('../ai/service')
    const thread = await pinAIThread(auth.userId, data.threadId, data.pinned)
    if (!thread) throw new Error('Thread not found')
    return { thread: serializeAIThread(thread) }
  })

/**
 * Server Function: Archive or unarchive an AI conversation thread.
 */
export const archiveAIThreadFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: MutateAIThreadInput & { archived: boolean }) => {
    return z
      .object({
        threadId: z.string().min(1),
        archived: z.boolean(),
        token: z.string().optional(),
      })
      .parse(data)
  })
  .handler(async ({ data, context }) => {
    const auth = await resolveWriteAuth({ data, context })
    if (!auth) throw new Error('Unauthenticated')
    const { archiveAIThread } = await import('../ai/service')
    const thread = await archiveAIThread(auth.userId, data.threadId, data.archived)
    if (!thread) throw new Error('Thread not found')
    return { thread: serializeAIThread(thread) }
  })

/**
 * Server Function: Rename an AI conversation thread.
 */
export const renameAIThreadFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: MutateAIThreadInput & { title: string }) => {
    return z
      .object({
        threadId: z.string().min(1),
        title: z.string().min(1).max(120),
        token: z.string().optional(),
      })
      .parse(data)
  })
  .handler(async ({ data, context }) => {
    const auth = await resolveWriteAuth({ data, context })
    if (!auth) throw new Error('Unauthenticated')
    const { renameAIThread } = await import('../ai/service')
    const thread = await renameAIThread(auth.userId, data.threadId, data.title)
    if (!thread) throw new Error('Thread not found')
    return { thread: serializeAIThread(thread) }
  })

/**
 * Server Function: Permanently delete an AI conversation thread (messages cascade).
 */
export const deleteAIThreadFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: MutateAIThreadInput) => {
    return z
      .object({
        threadId: z.string().min(1),
        token: z.string().optional(),
      })
      .parse(data)
  })
  .handler(async ({ data, context }) => {
    const auth = await resolveWriteAuth({ data, context })
    if (!auth) throw new Error('Unauthenticated')
    const { deleteAIThread } = await import('../ai/service')
    const ok = await deleteAIThread(auth.userId, data.threadId)
    if (!ok) throw new Error('Thread not found')
    return { ok: true }
  })

interface SendChatMessageInput {
  messages: Array<{ role: string; content?: string; text?: string }>
  userId?: string
  threadId?: string
  model?: string
}

/**
 * Server Function: Send a message to the Benthic neural gateway (free-tier Oracle models) with guardrails & DB persistence.
 */
export const sendChatMessageHandler = async ({ data, context }: ServerFnArgs<SendChatMessageInput>) => {
  const { messages, userId: inputUserId, threadId: inputThreadId, model: selectedModelId } = data || {}
  const authUserId = context?.user?.sub || context?.user?.id
  const userId = authUserId || inputUserId

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages array is required')
  }

  const userText = getLastUserText(messages)

  const { validateInputGuardrails, checkRateLimit } = await import('../ai/guardrails')
  const clientIp = '127.0.0.1'
  const rateLimit = checkRateLimit(userId || clientIp, 30, 60 * 1000)
  if (!rateLimit.success) {
    throw new Error('Rate limit exceeded. Please wait a moment before sending more messages.')
  }

  const guardrail = validateInputGuardrails(userText)
  if (!guardrail.allowed) {
    throw new Error(guardrail.reason || 'Message blocked by safety filters.')
  }

  const { saveAIMessage, createAIThread, summarizeThreadTitle } = await import('../ai/service')
  let activeThreadId = inputThreadId

  // Guest Mode Gating: Unauthenticated seekers receive friendly, clear guidance directing them to sign up
  if (!userId) {
    return {
      text: pickGuestOracleResponse(userText, messages.length),
      threadId: null,
      isGuest: true,
    }
  }

  // Safe DB Thread creation & User message logging
  if (userId) {
    try {
      if (!activeThreadId) {
        const title = await summarizeThreadTitle(userText)
        const newThread = await createAIThread({
          userId,
          title,
          persona: 'oracle',
        })
        activeThreadId = newThread?.id || activeThreadId
      }

      if (activeThreadId) {
        await saveAIMessage({
          threadId: activeThreadId,
          userId,
          role: 'user',
          content: userText,
        })
      }
    } catch (dbErr) {
      console.warn('[sendChatMessageFn] DB thread/message logging warning:', dbErr)
    }
  }

  const { generateText } = await import('ai')
  const { buildSystemPrompt } = await import('../ai/codex-prompt')

  let assistantText = ''
  const systemPrompt = buildSystemPrompt()
  const payloadMessages = toModelMessages(messages)

  // Model cascade: selected model first, then remaining candidates, so a rate-limited or restricted model falls through to a reachable one.
  const candidateModels = getOracleCandidateModelIds(selectedModelId)
  let lastError: Error | null = null

  for (const modelCandidate of candidateModels) {
    try {
      const result = await generateText({
        model: modelCandidate as any,
        system: systemPrompt,
        messages: payloadMessages,
      })
      if (result.text) {
        assistantText = result.text
        break
      }
    } catch (err: any) {
      console.warn(`[Oracle Chat] Model candidate '${modelCandidate}' failed:`, err.message)
      lastError = err
    }
  }

  if (!assistantText) {
    assistantText = formatOracleUnavailableMessage(lastError)
  }

  // Safe DB Assistant message logging
  if (userId && activeThreadId && assistantText) {
    try {
      await saveAIMessage({
        threadId: activeThreadId,
        userId,
        role: 'assistant',
        content: assistantText,
      })
    } catch (dbErr) {
      console.warn('[sendChatMessageFn] DB assistant response logging warning:', dbErr)
    }
  }

  return {
    text: assistantText,
    threadId: activeThreadId,
  }
}

export const sendChatMessageFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: SendChatMessageInput) => {
    return z
      .object({
        messages: z.array(
          z.object({
            role: z.string(),
            content: z.string().optional(),
            text: z.string().optional(),
          })
        ),
        userId: z.string().optional(),
        threadId: z.string().optional(),
        model: z.string().optional(),
      })
      .parse(data)
  })
  .handler(sendChatMessageHandler)

/**
 * Server Function: Get all published blog posts from database or fallback to seed data.
 */
export const getBlogPostsHandler = async ({ context }: ServerFnArgs) => {
  const dbClient = context?.db || getDb()
  try {
    const records = await dbClient
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true))
      .orderBy(desc(blogPosts.publishedAt))

    if (records.length > 0) {
      return records.map((r: any) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        summary: r.summary,
        content: r.content,
        coverImageUrl: r.coverImageUrl || '/images/ai_learning_ascension_cover.jpg',
        authorName: r.authorName,
        authorAvatar: r.authorAvatar,
        authorRole: r.authorRole || 'Stage 4 Ascendant',
        category: r.category,
        tags: (r.tags as string[]) || [],
        readTimeMinutes: r.readTimeMinutes,
        views: r.views ?? 0,
        likes: r.likes ?? 0,
        isFeatured: r.isFeatured ?? false,
        isPublished: r.isPublished,
        publishedAt: r.publishedAt ? new Date(r.publishedAt).toISOString() : new Date().toISOString(),
      }))
    }
  } catch (err) {
    console.warn('[getBlogPostsFn] Error loading from DB, using fallback blog data:', err)
  }
  return INITIAL_BLOG_POSTS
}

export const getBlogPostsFn = createServerFn({ method: 'GET' })
  .middleware(publicMiddleware)
  .handler(getBlogPostsHandler)

/**
 * Server Function: Get single blog post by slug.
 */
export const getBlogPostBySlugHandler = async ({ data: slug, context }: ServerFnArgs<string>) => {
  if (!slug) return null
  const dbClient = context?.db || getDb()
  try {
    const records = await dbClient
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1)

    if (records.length > 0) {
      const r = records[0]
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        summary: r.summary,
        content: r.content,
        coverImageUrl: r.coverImageUrl || '/images/ai_learning_ascension_cover.jpg',
        authorName: r.authorName,
        authorAvatar: r.authorAvatar,
        authorRole: r.authorRole || 'Stage 4 Ascendant',
        category: r.category,
        tags: (r.tags as string[]) || [],
        readTimeMinutes: r.readTimeMinutes,
        views: r.views ?? 0,
        likes: r.likes ?? 0,
        isFeatured: r.isFeatured ?? false,
        isPublished: r.isPublished,
        publishedAt: r.publishedAt ? new Date(r.publishedAt).toISOString() : new Date().toISOString(),
      }
    }
  } catch (err) {
    console.warn(`[getBlogPostBySlugFn] Error loading post ${slug} from DB, fallback checking:`, err)
  }

  const fallback = INITIAL_BLOG_POSTS.find((p) => p.slug === slug)
  return fallback ?? null
}

export const getBlogPostBySlugFn = createServerFn({ method: 'GET' })
  .middleware(publicMiddleware)
  .validator((slug: string) => slug)
  .handler(getBlogPostBySlugHandler)

/**
 * Server Function: Increment blog post view count.
 */
export const incrementBlogPostViewsHandler = async ({ data: slug, context }: ServerFnArgs<string>) => {
  if (!slug) return null
  const dbClient = context?.db || getDb()
  try {
    const records = await dbClient
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1)

    if (records.length > 0) {
      const r = records[0]
      const updated = await dbClient
        .update(blogPosts)
        .set({ views: (r.views || 0) + 1 })
        .where(eq(blogPosts.slug, slug))
        .returning()
      return updated[0]?.views ?? r.views + 1
    }
  } catch (err) {
    console.warn(`[incrementBlogPostViewsFn] Failed to increment views for ${slug}:`, err)
  }
  return null
}

export const incrementBlogPostViewsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((slug: string) => slug)
  .handler(incrementBlogPostViewsHandler)

export interface BlogCommentEntry {
  id: string
  postId: string
  userId: string | null
  authorName: string
  authorAvatar: string
  authorStage: number
  content: string
  createdAt: string
}

export interface CreateBlogCommentInput {
  postId: string
  content: string
  userId?: string
  token?: string
  turnstileToken?: string
}

/**
 * Server Function: Get comments for a blog post.
 */
export const getBlogCommentsHandler = async ({ data: postId, context }: ServerFnArgs<string>): Promise<BlogCommentEntry[]> => {
  if (!postId) return []
  const dbClient = context?.db || getDb()
  try {
    const records = await dbClient
      .select({
        id: blogComments.id,
        postId: blogComments.postId,
        userId: blogComments.userId,
        authorName: blogComments.authorName,
        authorAvatar: blogComments.authorAvatar,
        content: blogComments.content,
        createdAt: blogComments.createdAt,
        profileStage: profiles.stage,
      })
      .from(blogComments)
      .leftJoin(profiles, eq(blogComments.userId, profiles.id))
      .where(eq(blogComments.postId, postId))
      .orderBy(desc(blogComments.createdAt))

    return records.map((r: any) => ({
      id: r.id,
      postId: r.postId,
      userId: r.userId,
      authorName: r.authorName,
      authorAvatar: r.authorAvatar,
      authorStage: r.profileStage ?? 1,
      content: r.content,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }))
  } catch (err) {
    console.warn(`[getBlogCommentsFn] Error loading comments for postId ${postId}:`, err)
    return []
  }
}

export const getBlogCommentsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((postId: string) => postId)
  .handler(getBlogCommentsHandler)

/**
 * Server Function: Create a blog comment (Authenticated registered users only).
 */
export const createBlogCommentHandler = async ({ data, context }: ServerFnArgs<CreateBlogCommentInput>): Promise<BlogCommentEntry> => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) {
    throw new Error('Unauthenticated: You must be registered and logged in to post comments.')
  }
  const { userId, dbClient, payload } = auth

  if (!data?.postId || !data?.content) {
    throw new Error('Invalid input: Post ID and comment content are required.')
  }

  // Canonical Turnstile bot verification check
  if (data?.turnstileToken) {
    const verification = await verifyTurnstileToken({
      token: data.turnstileToken,
      expectedAction: 'blog_comment',
    })
    if (!verification.success) {
      throw new Error(verification.errorMessage || 'Bot verification check failed.')
    }
  }

  // Guardrail 1: Clean & sanitize input
  const sanitizedContent = data.content.trim().replace(/<[^>]*>?/gm, '')

  // Validation: Length
  if (sanitizedContent.length < 3) {
    throw new Error('Comment must be at least 3 characters long.')
  }
  if (sanitizedContent.length > 1000) {
    throw new Error('Comment cannot exceed 1000 characters.')
  }

  // Toxicity / link spam filter
  const prohibitedPatterns = [/http:\/\//i, /https:\/\//i, /free money/i, /crypto scam/i]
  for (const pattern of prohibitedPatterns) {
    if (pattern.test(sanitizedContent)) {
      throw new Error('Your comment contains restricted external links or promotional content.')
    }
  }

  const [userProfile] = await dbClient
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  const authorName = resolveMemberPublicName({
    userId,
    handle: userProfile?.handle,
    larvaId: userProfile?.larvaId,
  })
  const authorAvatar = '/images/stage1_larva.png'

  const [inserted] = await dbClient
    .insert(blogComments)
    .values({
      postId: data.postId,
      userId: userId,
      authorName,
      authorAvatar,
      content: sanitizedContent,
    })
    .returning()

  return {
    id: inserted.id,
    postId: inserted.postId,
    userId: inserted.userId,
    authorName: inserted.authorName,
    authorAvatar: inserted.authorAvatar,
    authorStage: userProfile?.stage ?? 1,
    content: inserted.content,
    createdAt: inserted.createdAt ? new Date(inserted.createdAt).toISOString() : new Date().toISOString(),
  }
}

export const createBlogCommentFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: CreateBlogCommentInput) => {
    return z
      .object({
        postId: z.string().min(1),
        content: z.string().min(3).max(1000),
        userId: z.string().optional(),
        token: z.string().optional(),
        turnstileToken: z.string().optional(),
      })
      .parse(data)
  })
  .handler(createBlogCommentHandler)


// ==========================================
// FORUM / COMMUNITY CORE SERVER FUNCTIONS
// ==========================================

export interface ForumCategoryEntry {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  color: string
  sortOrder: number
  topicCount: number
  bgImage?: string
}

export interface ForumTopicEntry {
  id: string
  categoryId: string
  categorySlug?: string
  categoryName?: string
  categoryColor?: string
  userId: string | null
  authorName: string
  authorAvatar: string
  authorStage: number
  title: string
  slug: string
  content: string
  isPinned: boolean
  isLocked: boolean
  views: number
  repliesCount: number
  upvotes: number
  lastReplyAt: string
  createdAt: string
  voted?: boolean
}

export interface ForumPostEntry {
  id: string
  topicId: string
  userId: string | null
  authorName: string
  authorAvatar: string
  authorStage: number
  content: string
  upvotes: number
  createdAt: string
  voted?: boolean
}

/**
 * Resolves the authenticated user id from middleware context only.
 * Bare client userId is not trusted for writes.
 */
function resolveForumUserId(context?: ServerFnContext, _dataUserId?: string): string | null {
  return (context?.user?.sub as string) || (context?.user?.id as string) || null
}

/**
 * Fetches the set of topic ids the given user has voted on.
 */
async function fetchVotedTopicIds(dbClient: Db, userId: string, topicIds: string[]): Promise<Set<string>> {
  if (!userId || topicIds.length === 0) return new Set()
  try {
    const rows = await dbClient
      .select({ topicId: forumVotes.topicId })
      .from(forumVotes)
      .where(and(eq(forumVotes.userId, userId), sql`${forumVotes.topicId} IN (${sql.join(topicIds.map((id) => sql`${id}`), sql`, `)})`))
    return new Set(rows.filter((r) => r.topicId).map((r) => r.topicId as string))
  } catch (err) {
    console.warn('[fetchVotedTopicIds] failed:', err)
    return new Set()
  }
}

/**
 * Fetches the set of post ids the given user has voted on.
 */
async function fetchVotedPostIds(dbClient: Db, userId: string, postIds: string[]): Promise<Set<string>> {
  if (!userId || postIds.length === 0) return new Set()
  try {
    const rows = await dbClient
      .select({ postId: forumVotes.postId })
      .from(forumVotes)
      .where(and(eq(forumVotes.userId, userId), sql`${forumVotes.postId} IN (${sql.join(postIds.map((id) => sql`${id}`), sql`, `)})`))
    return new Set(rows.filter((r) => r.postId).map((r) => r.postId as string))
  } catch (err) {
    console.warn('[fetchVotedPostIds] failed:', err)
    return new Set()
  }
}

/**
 * Server Function: Get a single forum category by slug with its topic count.
 */
export const getForumCategoryBySlugHandler = async ({ data, context }: ServerFnArgs<{ slug: string }>): Promise<ForumCategoryEntry | null> => {
  const slug = data?.slug
  if (!slug) return null
  const dbClient = context?.db || getDb()

  try {
    const [cat] = await dbClient
      .select()
      .from(forumCategories)
      .where(eq(forumCategories.slug, slug))
      .limit(1)

    if (cat) {
      const [countRow] = await dbClient
        .select({ count: sql<number>`count(*)::int` })
        .from(forumTopics)
        .where(eq(forumTopics.categoryId, cat.id))
      return {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
        bgImage: (cat as any).bgImage || getCategoryBgImage(cat.slug),
        topicCount: countRow?.count || 0,
      }
    }

    return null
  } catch (err) {
    console.error('[getForumCategoryBySlugFn] DB query failed:', err)
    return null
  }
}

export const getForumCategoryBySlugFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(getForumCategoryBySlugHandler)

/**
 * Server Function: Get all forum categories with topic counts.
 */
export const getForumCategoriesHandler = async ({ context }: ServerFnArgs): Promise<ForumCategoryEntry[]> => {
  const dbClient = context?.db || getDb()
  try {
    const cats = await dbClient
      .select({
        id: forumCategories.id,
        slug: forumCategories.slug,
        name: forumCategories.name,
        description: forumCategories.description,
        icon: forumCategories.icon,
        color: forumCategories.color,
        sortOrder: forumCategories.sortOrder,
      })
      .from(forumCategories)
      .orderBy(forumCategories.sortOrder)

    if (cats.length > 0) {
      // Calculate topic counts per category
      const countsMap = new Map<string, number>()
      try {
        const topicCounts = await dbClient
          .select({
            categoryId: forumTopics.categoryId,
            count: sql<number>`count(*)::int`,
          })
          .from(forumTopics)
          .groupBy(forumTopics.categoryId)

        for (const tc of topicCounts) {
          countsMap.set(tc.categoryId, tc.count)
        }
      } catch (err) {
        console.warn('[getForumCategoriesFn] Topic count grouping failed:', err)
      }

      return cats.map((c: any) => ({
        ...c,
        bgImage: c.bgImage || getCategoryBgImage(c.slug),
        topicCount: countsMap.get(c.id) || 0,
      }))
    }

    return []
  } catch (err) {
    console.error('[getForumCategoriesFn] DB query failed:', err)
    return []
  }
}

export const getForumCategoriesFn = createServerFn({ method: 'GET' })
  .middleware(publicMiddleware)
  .handler(getForumCategoriesHandler)

export interface GetForumTopicsInput {
  categorySlug?: string
  query?: string
  sortBy?: 'latest' | 'top' | 'active' | 'hot'
  userId?: string
  /** Neon Auth JWT so vote state can hydrate for the current initiate. */
  token?: string
}

/**
 * Server Function: Get forum topics with filtering and search.
 */
export const getForumTopicsHandler = async ({ data, context }: ServerFnArgs<GetForumTopicsInput>): Promise<ForumTopicEntry[]> => {
  const dbClient = context?.db || getDb()
  const { categorySlug, query, sortBy = 'hot' } = data || {}
  const currentUserId = resolveForumUserId(context, data?.userId)

  try {
    const queryBuilder = dbClient
      .select({
        id: forumTopics.id,
        categoryId: forumTopics.categoryId,
        categorySlug: forumCategories.slug,
        categoryName: forumCategories.name,
        categoryColor: forumCategories.color,
        userId: forumTopics.userId,
        authorName: forumTopics.authorName,
        authorAvatar: forumTopics.authorAvatar,
        authorStage: forumTopics.authorStage,
        title: forumTopics.title,
        slug: forumTopics.slug,
        content: forumTopics.content,
        isPinned: forumTopics.isPinned,
        isLocked: forumTopics.isLocked,
        views: forumTopics.views,
        repliesCount: forumTopics.repliesCount,
        upvotes: forumTopics.upvotes,
        lastReplyAt: forumTopics.lastReplyAt,
        createdAt: forumTopics.createdAt,
        profileHandle: profiles.handle,
        profileLarvaId: profiles.larvaId,
      })
      .from(forumTopics)
      .leftJoin(forumCategories, eq(forumTopics.categoryId, forumCategories.id))
      .leftJoin(profiles, eq(forumTopics.userId, profiles.id))

    // Apply conditions
    const conditions = []
    if (categorySlug && categorySlug !== 'all') {
      conditions.push(eq(forumCategories.slug, categorySlug))
    }
    if (query && query.trim() !== '') {
      const q = `%${query.trim()}%`
      conditions.push(or(like(forumTopics.title, q), like(forumTopics.content, q)))
    }

    let finalQuery = queryBuilder
    if (conditions.length > 0) {
      finalQuery = finalQuery.where(sql.join(conditions, sql` AND `)) as any
    }

    if (sortBy === 'top') {
      finalQuery = finalQuery.orderBy(desc(forumTopics.isPinned), desc(forumTopics.upvotes), desc(forumTopics.createdAt)) as any
    } else if (sortBy === 'active') {
      finalQuery = finalQuery.orderBy(desc(forumTopics.isPinned), desc(forumTopics.lastReplyAt)) as any
    } else if (sortBy === 'latest') {
      finalQuery = finalQuery.orderBy(desc(forumTopics.isPinned), desc(forumTopics.createdAt)) as any
    } else {
      // 'hot' — rank in JS after fetching (volume is small for MVP)
      finalQuery = finalQuery.orderBy(desc(forumTopics.isPinned)) as any
    }

    let records = await finalQuery

    if (sortBy === 'hot') {
      const sorted = [...records].sort(compareHot as any)
      records = sorted
    }

    if (records && records.length > 0) {
      const entries: ForumTopicEntry[] = records.map((r: any) => ({
        id: r.id,
        categoryId: r.categoryId,
        categorySlug: r.categorySlug || 'general-discussion',
        categoryName: r.categoryName || 'General Discussion',
        categoryColor: r.categoryColor || '#00ffff',
        userId: r.userId,
        authorName: resolveMemberPublicName({
          userId: r.userId,
          handle: r.profileHandle,
          larvaId: r.profileLarvaId ?? r.authorName,
        }),
        authorAvatar: r.authorAvatar,
        authorStage: r.authorStage,
        title: r.title,
        slug: r.slug,
        content: r.content,
        isPinned: r.isPinned,
        isLocked: r.isLocked,
        views: r.views,
        repliesCount: r.repliesCount,
        upvotes: r.upvotes,
        lastReplyAt: r.lastReplyAt ? new Date(r.lastReplyAt).toISOString() : new Date().toISOString(),
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      }))

      if (currentUserId) {
        const votedIds = await fetchVotedTopicIds(dbClient, currentUserId, entries.map((e) => e.id))
        return entries.map((e) => ({ ...e, voted: votedIds.has(e.id) }))
      }
      return entries
    }

    // Empty DB is a valid state — never return seed IDs that cannot be replied to / voted on.
    return []
  } catch (err) {
    console.error('[getForumTopicsFn] DB query failed:', err)
    return []
  }
}

export const getForumTopicsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: GetForumTopicsInput) => {
    return z
      .object({
        categorySlug: z.string().optional(),
        query: z.string().optional(),
        sortBy: z.enum(['latest', 'top', 'active', 'hot']).optional(),
        userId: z.string().optional(),
        token: z.string().optional(),
      })
      .optional()
      .parse(data || {})
  })
  .handler(getForumTopicsHandler)

export interface GetForumTopicDetailInput {
  slugOrId: string
  categorySlug?: string
  userId?: string
  /** Neon Auth JWT so topic/reply vote state can hydrate for the current initiate. */
  token?: string
  /** When false, skip the view counter bump (client vote-state hydration). Default true. */
  trackView?: boolean
}

export interface ForumTopicDetailResult {
  topic: ForumTopicEntry
  posts: ForumPostEntry[]
}

/**
 * Server Function: Get single topic detail with posts and increment view count.
 */
export const getForumTopicDetailHandler = async ({ data, context }: ServerFnArgs<GetForumTopicDetailInput>): Promise<ForumTopicDetailResult | null> => {
  const { slugOrId, categorySlug, trackView = true } = data || {}
  if (!slugOrId) return null
  const currentUserId = resolveForumUserId(context, data?.userId)
  const dbClient = context?.db || getDb()

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)
    const topicRecord = await dbClient
      .select({
        id: forumTopics.id,
        categoryId: forumTopics.categoryId,
        categorySlug: forumCategories.slug,
        categoryName: forumCategories.name,
        categoryColor: forumCategories.color,
        userId: forumTopics.userId,
        authorName: forumTopics.authorName,
        authorAvatar: forumTopics.authorAvatar,
        authorStage: forumTopics.authorStage,
        title: forumTopics.title,
        slug: forumTopics.slug,
        content: forumTopics.content,
        isPinned: forumTopics.isPinned,
        isLocked: forumTopics.isLocked,
        views: forumTopics.views,
        repliesCount: forumTopics.repliesCount,
        upvotes: forumTopics.upvotes,
        lastReplyAt: forumTopics.lastReplyAt,
        createdAt: forumTopics.createdAt,
        profileHandle: profiles.handle,
        profileLarvaId: profiles.larvaId,
        profileStage: profiles.stage,
      })
      .from(forumTopics)
      .leftJoin(forumCategories, eq(forumTopics.categoryId, forumCategories.id))
      .leftJoin(profiles, eq(forumTopics.userId, profiles.id))
      .where(isUuid ? eq(forumTopics.id, slugOrId) : eq(forumTopics.slug, slugOrId))
      .limit(1)

    if (topicRecord.length > 0) {
      const t = topicRecord[0]

      // Validate nested URL: category slug must match the topic's category
      if (categorySlug && t.categorySlug && categorySlug !== t.categorySlug) {
        return null
      }

      // Fire-and-forget view count increment (skip on vote-state hydration refetches)
      if (trackView) {
        dbClient
          .update(forumTopics)
          .set({ views: t.views + 1 })
          .where(eq(forumTopics.id, t.id))
          .catch((err: any) => console.warn('[getForumTopicDetailFn] View count update error:', err))
      }

      // Fetch posts / replies
      const postsRecords = await dbClient
        .select({
          id: forumPosts.id,
          topicId: forumPosts.topicId,
          userId: forumPosts.userId,
          authorName: forumPosts.authorName,
          authorAvatar: forumPosts.authorAvatar,
          authorStage: forumPosts.authorStage,
          content: forumPosts.content,
          upvotes: forumPosts.upvotes,
          createdAt: forumPosts.createdAt,
          profileHandle: profiles.handle,
          profileLarvaId: profiles.larvaId,
          profileStage: profiles.stage,
        })
        .from(forumPosts)
        .leftJoin(profiles, eq(forumPosts.userId, profiles.id))
        .where(eq(forumPosts.topicId, t.id))
        .orderBy(forumPosts.createdAt)

      const topicVoted = currentUserId
        ? (await fetchVotedTopicIds(dbClient, currentUserId, [t.id])).has(t.id)
        : false

      const posts: ForumPostEntry[] = postsRecords.map((p: any) => ({
        id: p.id,
        topicId: p.topicId,
        userId: p.userId,
        authorName: resolveMemberPublicName({
          userId: p.userId,
          handle: p.profileHandle,
          larvaId: p.profileLarvaId ?? p.authorName,
        }),
        authorAvatar: p.authorAvatar,
        authorStage: p.profileStage ?? p.authorStage,
        content: p.content,
        upvotes: p.upvotes,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      }))

      let postVotedIds = new Set<string>()
      if (currentUserId && posts.length > 0) {
        postVotedIds = await fetchVotedPostIds(dbClient, currentUserId, posts.map((p) => p.id))
      }

      return {
        topic: {
          id: t.id,
          categoryId: t.categoryId,
          categorySlug: t.categorySlug || 'general-discussion',
          categoryName: t.categoryName || 'General Discussion',
          categoryColor: t.categoryColor || '#00ffff',
          userId: t.userId,
          authorName: resolveMemberPublicName({
            userId: t.userId,
            handle: t.profileHandle,
            larvaId: t.profileLarvaId ?? t.authorName,
          }),
          authorAvatar: t.authorAvatar,
          authorStage: t.profileStage ?? t.authorStage,
          title: t.title,
          slug: t.slug,
          content: t.content,
          isPinned: t.isPinned,
          isLocked: t.isLocked,
          views: trackView ? t.views + 1 : t.views,
          repliesCount: t.repliesCount,
          upvotes: t.upvotes,
          ...(currentUserId ? { voted: topicVoted } : {}),
          lastReplyAt: t.lastReplyAt ? new Date(t.lastReplyAt).toISOString() : new Date().toISOString(),
          createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
        },
        posts: posts.map((p) => ({
          ...p,
          ...(currentUserId ? { voted: postVotedIds.has(p.id) } : {}),
        })),
      }
    }

    // Topic not in DB — never invent seed rows with non-writable IDs.
    return null
  } catch (err) {
    console.error('[getForumTopicDetailFn] DB query failed:', err)
    return null
  }
}

export const getForumTopicDetailFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: GetForumTopicDetailInput) => {
    return z
      .object({
        slugOrId: z.string().min(1),
        categorySlug: z.string().optional(),
        userId: z.string().optional(),
        token: z.string().optional(),
        trackView: z.boolean().optional(),
      })
      .parse(data)
  })
  .handler(getForumTopicDetailHandler)

export interface CreateForumTopicInput {
  categoryId: string
  title: string
  content: string
  userId?: string
  token?: string
}

/**
 * Server Function: Create a new topic with guardrails validation.
 */
export const createForumTopicHandler = async ({ data, context }: ServerFnArgs<CreateForumTopicInput>): Promise<ForumTopicEntry> => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) {
    throw new Error('Unauthenticated: You must be registered and logged in to create discussion topics.')
  }
  const { userId, dbClient, payload } = auth

  if (!data?.categoryId || !data?.title || !data?.content) {
    throw new Error('Invalid input: Category, title, and content are required.')
  }

  // Content Validation
  const validation = validateForumContent(data.title, data.content)
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid content.')
  }

  const [userProfile] = await dbClient
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  const authorName = resolveMemberPublicName({
    userId,
    handle: userProfile?.handle,
    larvaId: userProfile?.larvaId,
  })
  const authorAvatar = (payload as any)?.image || '/images/stage1_larva.png'
  const authorStage = userProfile?.stage ?? 1

  // Generate clean unique slug
  const uniqueSlug = slugifyForumTitle(data.title)

  const [inserted] = await dbClient
    .insert(forumTopics)
    .values({
      categoryId: data.categoryId,
      userId,
      authorName,
      authorAvatar,
      authorStage,
      title: data.title.trim(),
      slug: uniqueSlug,
      content: data.content.trim(),
      lastReplyAt: new Date(),
    })
    .returning()

  // Fetch category info
  const [cat] = await dbClient
    .select()
    .from(forumCategories)
    .where(eq(forumCategories.id, inserted.categoryId))
    .limit(1)

  return {
    id: inserted.id,
    categoryId: inserted.categoryId,
    categorySlug: cat?.slug || 'general-discussion',
    categoryName: cat?.name || 'General Discussion',
    categoryColor: cat?.color || '#00ffff',
    userId: inserted.userId,
    authorName: inserted.authorName,
    authorAvatar: inserted.authorAvatar,
    authorStage: inserted.authorStage,
    title: inserted.title,
    slug: inserted.slug,
    content: inserted.content,
    isPinned: inserted.isPinned,
    isLocked: inserted.isLocked,
    views: inserted.views,
    repliesCount: inserted.repliesCount,
    upvotes: inserted.upvotes,
    lastReplyAt: inserted.lastReplyAt ? new Date(inserted.lastReplyAt).toISOString() : new Date().toISOString(),
    createdAt: inserted.createdAt ? new Date(inserted.createdAt).toISOString() : new Date().toISOString(),
  }
}

export const createForumTopicFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: CreateForumTopicInput) => {
    return z
      .object({
        categoryId: z.string().min(1),
        title: z.string().min(5).max(150),
        content: z.string().min(10).max(10000),
        userId: z.string().optional(),
        token: z.string().optional(),
      })
      .parse(data)
  })
  .handler(createForumTopicHandler)

export interface CreateForumPostInput {
  topicId: string
  content: string
  userId?: string
  token?: string
}

/**
 * Server Function: Create a reply to an existing forum topic.
 */
export const createForumPostHandler = async ({ data, context }: ServerFnArgs<CreateForumPostInput>): Promise<ForumPostEntry> => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) {
    throw new Error('Unauthenticated: You must be registered and logged in to post replies.')
  }
  const { userId, dbClient, payload } = auth

  if (!data?.topicId || !data?.content) {
    throw new Error('Invalid input: Topic ID and content are required.')
  }

  // Content Validation
  const validation = validateForumContent(undefined, data.content)
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid content.')
  }

  const [userProfile] = await dbClient
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  const authorName = resolveMemberPublicName({
    userId,
    handle: userProfile?.handle,
    larvaId: userProfile?.larvaId,
  })
  const authorAvatar = (payload as any)?.image || '/images/stage1_larva.png'
  const authorStage = userProfile?.stage ?? 1

  const [topicExists] = await dbClient
    .select({ id: forumTopics.id })
    .from(forumTopics)
    .where(eq(forumTopics.id, data.topicId))
    .limit(1)

  if (!topicExists) {
    throw new Error('This thread is no longer available. Refresh the forums and try again.')
  }

  const [inserted] = await dbClient
    .insert(forumPosts)
    .values({
      topicId: data.topicId,
      userId,
      authorName,
      authorAvatar,
      authorStage,
      content: data.content.trim(),
    })
    .returning()

  // Update topic repliesCount and lastReplyAt
  try {
    const [topicRecord] = await dbClient
      .select({ repliesCount: forumTopics.repliesCount })
      .from(forumTopics)
      .where(eq(forumTopics.id, data.topicId))
      .limit(1)

    const currentCount = topicRecord?.repliesCount ?? 0

    await dbClient
      .update(forumTopics)
      .set({
        repliesCount: currentCount + 1,
        lastReplyAt: new Date(),
      })
      .where(eq(forumTopics.id, data.topicId))
  } catch (err) {
    console.warn('[createForumPostFn] Topic reply counter update error:', err)
  }

  return {
    id: inserted.id,
    topicId: inserted.topicId,
    userId: inserted.userId,
    authorName: inserted.authorName,
    authorAvatar: inserted.authorAvatar,
    authorStage: inserted.authorStage,
    content: inserted.content,
    upvotes: inserted.upvotes,
    createdAt: inserted.createdAt ? new Date(inserted.createdAt).toISOString() : new Date().toISOString(),
  }
}

export const createForumPostFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: CreateForumPostInput) => {
    return z
      .object({
        topicId: z.string().min(1),
        content: z.string().min(10).max(10000),
        userId: z.string().optional(),
        token: z.string().optional(),
      })
      .parse(data)
  })
  .handler(createForumPostHandler)

export interface ToggleForumVoteInput {
  topicId?: string
  postId?: string
  userId?: string
  token?: string
}

export interface ForumVoteResult {
  upvotes: number
  voted: boolean
}

/**
 * Server Function: Toggle an upvote on a topic (one vote per user).
 */
export const toggleForumTopicVoteHandler = async ({ data, context }: ServerFnArgs<ToggleForumVoteInput>): Promise<ForumVoteResult> => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) {
    throw new Error('Unauthenticated: You must be logged in to upvote.')
  }
  if (!data?.topicId) {
    throw new Error('Topic ID required.')
  }

  const { userId, dbClient } = auth
  const topicId = data.topicId

  const [topic] = await dbClient
    .select({ upvotes: forumTopics.upvotes })
    .from(forumTopics)
    .where(eq(forumTopics.id, topicId))
    .limit(1)

  if (!topic) {
    throw new Error('This thread is no longer available. Refresh the forums and try again.')
  }

  const currentUpvotes = topic.upvotes

  const [existing] = await dbClient
    .select({ id: forumVotes.id })
    .from(forumVotes)
    .where(and(eq(forumVotes.userId, userId), eq(forumVotes.topicId, topicId)))
    .limit(1)

  if (existing) {
    await dbClient.delete(forumVotes).where(eq(forumVotes.id, existing.id))
    const newCount = Math.max(0, currentUpvotes - 1)
    await dbClient.update(forumTopics).set({ upvotes: newCount }).where(eq(forumTopics.id, topicId))
    return { upvotes: newCount, voted: false }
  }

  await dbClient.insert(forumVotes).values({ userId, topicId })
  const newCount = currentUpvotes + 1
  await dbClient.update(forumTopics).set({ upvotes: newCount }).where(eq(forumTopics.id, topicId))
  return { upvotes: newCount, voted: true }
}

export const toggleForumTopicVoteFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: ToggleForumVoteInput) => {
    return z
      .object({
        topicId: z.string().min(1),
        userId: z.string().optional(),
        token: z.string().optional(),
      })
      .parse(data)
  })
  .handler(toggleForumTopicVoteHandler)

/**
 * Server Function: Toggle an upvote on a reply (one vote per user).
 */
export const toggleForumPostVoteHandler = async ({ data, context }: ServerFnArgs<ToggleForumVoteInput>): Promise<ForumVoteResult> => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) {
    throw new Error('Unauthenticated: You must be logged in to upvote.')
  }
  if (!data?.postId) {
    throw new Error('Post ID required.')
  }

  const { userId, dbClient } = auth
  const postId = data.postId

  const [post] = await dbClient
    .select({ upvotes: forumPosts.upvotes })
    .from(forumPosts)
    .where(eq(forumPosts.id, postId))
    .limit(1)

  if (!post) {
    throw new Error('This reply is no longer available. Refresh the thread and try again.')
  }

  const currentUpvotes = post.upvotes

  const [existing] = await dbClient
    .select({ id: forumVotes.id })
    .from(forumVotes)
    .where(and(eq(forumVotes.userId, userId), eq(forumVotes.postId, postId)))
    .limit(1)

  if (existing) {
    await dbClient.delete(forumVotes).where(eq(forumVotes.id, existing.id))
    const newCount = Math.max(0, currentUpvotes - 1)
    await dbClient.update(forumPosts).set({ upvotes: newCount }).where(eq(forumPosts.id, postId))
    return { upvotes: newCount, voted: false }
  }

  await dbClient.insert(forumVotes).values({ userId, postId })
  const newCount = currentUpvotes + 1
  await dbClient.update(forumPosts).set({ upvotes: newCount }).where(eq(forumPosts.id, postId))
  return { upvotes: newCount, voted: true }
}

export const toggleForumPostVoteFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: ToggleForumVoteInput) => {
    return z
      .object({
        postId: z.string().min(1),
        userId: z.string().optional(),
        token: z.string().optional(),
      })
      .parse(data)
  })
  .handler(toggleForumPostVoteHandler)

/**
 * Server Function: Get podcast episodes
 */
export const getPodcastsHandler = async ({ context }: ServerFnArgs) => {
  const dbClient = context?.db || getDb()
  try {
    const records = await dbClient
      .select()
      .from(podcasts)
      .where(eq(podcasts.isPublished, true))
      .orderBy(desc(podcasts.publishedAt))

    if (records && records.length > 0) {
      return records.map((r: any) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        subtitle: r.subtitle || '',
        description: r.description,
        audioUrl: (r.audioUrl && /^https?:/.test(r.audioUrl))
          ? r.audioUrl
          : getAssetUrl(r.s3Key || (r.audioUrl || '').replace(/^\/+/, '')),
        s3Key: r.s3Key || undefined,
        durationSeconds: r.durationSeconds,
        fileSizeBytes: r.fileSizeBytes || undefined,
        authorName: r.authorName,
        authorAvatar: r.authorAvatar,
        authorRole: r.authorRole,
        category: r.category,
        tags: (r.tags as string[]) || [],
        playCount: r.playCount,
        likes: r.likes,
        isFeatured: r.isFeatured,
        isPublished: r.isPublished,
        transcript: r.transcript || '',
        publishedAt: r.publishedAt ? new Date(r.publishedAt).toISOString() : new Date().toISOString(),
      }))
    }
  } catch (error) {
    console.warn('[ServerFn getPodcastsFn] DB query failed, using static fallback:', error)
  }

  return INITIAL_PODCASTS
}

export const getPodcastsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .handler(getPodcastsHandler)

// Lead Capture & Field Manual Decryption API
const submitLeadSchema = z.object({
  email: z.string().email('Valid email telemetry is required for decryption transmission.'),
  source: z.string().optional().default('moltmax_guide'),
  referrer: z.string().optional(),
  turnstileToken: z.string().optional(),
  emailOptIn: z.boolean().optional().default(false),
})

export type SubmitLeadInput = z.input<typeof submitLeadSchema>

export async function submitLeadHandler(args: ServerFnArgs<SubmitLeadInput>) {
  const { data } = args
  const validated = submitLeadSchema.parse(data || {})
  const normalizedEmail = validated.email.trim().toLowerCase()
  const source = validated.source || 'moltmax_guide'
  const referrer = validated.referrer || null
  const emailOptIn = validated.emailOptIn ?? false

  // Canonical Turnstile bot verification check
  if (validated.turnstileToken) {
    const verification = await verifyTurnstileToken({
      token: validated.turnstileToken,
      expectedAction: 'lead_capture',
    })
    if (!verification.success) {
      throw new Error(verification.errorMessage || 'Turnstile bot protection check failed.')
    }
  }

  const downloadUrl = getAssetUrl('downloads/the-2026-moltmaxxing-protocol-guide.pdf')

  try {
    const db = getDb()
    if (db) {
      const existing = await db
        .select()
        .from(leads)
        .where(eq(leads.email, normalizedEmail))
        .limit(1)

      if (existing.length > 0) {
        if (emailOptIn && !existing[0].emailOptIn) {
          await db
            .update(leads)
            .set({
              emailOptIn: true,
              emailOptInAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(leads.id, existing[0].id))
        }

        return {
          success: true,
          isExisting: true,
          email: normalizedEmail,
          downloadUrl,
          message: 'Biometric telemetry confirmed. Dossier transmission unlocked.',
        }
      }

      await db.insert(leads).values({
        email: normalizedEmail,
        source,
        referrer,
        claimedPdf: true,
        convertedToUser: false,
        emailOptIn,
        emailOptInAt: emailOptIn ? new Date() : null,
      })

      return {
        success: true,
        isExisting: false,
        email: normalizedEmail,
        downloadUrl,
        message: 'New initiate registered. Transmission unlocked.',
      }
    }
  } catch (error) {
    console.warn('[ServerFn submitLeadFn] DB insertion fallback:', error)
  }

  // Graceful fallback if database is in mock or offline mode
  return {
    success: true,
    isExisting: false,
    email: normalizedEmail,
    downloadUrl,
    message: 'Telemetry acknowledged. Offline decryption enabled.',
  }
}

export const submitLeadFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: SubmitLeadInput) => submitLeadSchema.parse(data))
  .handler(submitLeadHandler)

// User Email Communication Preferences API
const updateEmailPreferencesSchema = z.object({
  emailOptIn: z.boolean(),
  source: z.string().optional(),
  token: z.string().optional(),
  userId: z.string().optional(),
})

export type UpdateEmailPreferencesInput = z.input<typeof updateEmailPreferencesSchema>

export async function updateEmailPreferencesHandler({ data, context }: ServerFnArgs<UpdateEmailPreferencesInput>) {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) {
    throw new Error('Authentication required to update email preferences.')
  }

  const validated = updateEmailPreferencesSchema.parse(data || {})
  const { userId, dbClient } = auth

  const [updated] = await dbClient
    .update(profiles)
    .set({
      emailOptIn: validated.emailOptIn,
      emailOptInAt: validated.emailOptIn ? new Date() : null,
      emailOptInSource: validated.source || 'profile_settings',
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning()

  return {
    success: true,
    emailOptIn: updated?.emailOptIn ?? validated.emailOptIn,
  }
}

export const updateEmailPreferencesFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: UpdateEmailPreferencesInput) => updateEmailPreferencesSchema.parse(data))
  .handler(updateEmailPreferencesHandler)

// Lobster avatar (DiceBear) preferences
const lobsterAvatarConfigSchema = z.object({
  style: z.string().min(1).max(64),
  seed: z.string().min(1).max(128),
  backgroundTheme: z.string().max(64).optional(),
  backgroundPattern: z.string().max(64).optional(),
  backgroundTexture: z.string().max(64).optional(),
  patternDensity: z.enum(['compact', 'standard', 'spacious']).optional(),
  patternGlow: z.enum(['subtle', 'chromatic', 'none']).optional(),
  patternPulse: z.enum(['pulse', 'steady']).optional(),
  patternSparkles: z.enum(['subtle', 'radiant', 'none']).optional(),
  token: z.string().optional(),
  userId: z.string().optional(),
})

export type SaveLobsterAvatarInput = z.input<typeof lobsterAvatarConfigSchema>

export async function saveLobsterAvatarHandler({ data, context }: ServerFnArgs<SaveLobsterAvatarInput>) {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) {
    throw new Error('Authentication required to save avatar.')
  }

  const validated = lobsterAvatarConfigSchema.parse(data || {})
  const { userId, dbClient } = auth

  const { isValidLobsterAvatarStyle, LOBSTER_AVATAR_STYLE } = await import('../lobster-avatar')
  if (!isValidLobsterAvatarStyle(validated.style)) {
    throw new Error('Invalid avatar style.')
  }

  const avatarConfig: {
    style: string
    seed: string
    backgroundTheme?: string
    backgroundPattern?: string
    backgroundTexture?: string
    patternDensity?: 'compact' | 'standard' | 'spacious'
    patternGlow?: 'subtle' | 'chromatic' | 'none'
    patternPulse?: 'pulse' | 'steady'
    patternSparkles?: 'subtle' | 'radiant' | 'none'
  } = {
    style: LOBSTER_AVATAR_STYLE,
    seed: validated.seed.trim(),
  }

  if (validated.backgroundTheme?.trim()) {
    avatarConfig.backgroundTheme = validated.backgroundTheme.trim()
  }
  if (validated.backgroundPattern?.trim()) {
    avatarConfig.backgroundPattern = validated.backgroundPattern.trim()
  }
  if (validated.backgroundTexture?.trim()) {
    avatarConfig.backgroundTexture = validated.backgroundTexture.trim()
  }
  if (validated.patternDensity) {
    avatarConfig.patternDensity = validated.patternDensity
  }
  if (validated.patternGlow) {
    avatarConfig.patternGlow = validated.patternGlow
  }
  if (validated.patternPulse) {
    avatarConfig.patternPulse = validated.patternPulse
  }
  if (validated.patternSparkles) {
    avatarConfig.patternSparkles = validated.patternSparkles
  }

  const [updated] = await dbClient
    .update(profiles)
    .set({ avatarConfig, updatedAt: new Date() })
    .where(eq(profiles.id, userId))
    .returning()

  return {
    success: true,
    avatarConfig: updated?.avatarConfig ?? avatarConfig,
  }
}

export const saveLobsterAvatarFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: SaveLobsterAvatarInput) => lobsterAvatarConfigSchema.parse(data))
  .handler(saveLobsterAvatarHandler)

const clearLobsterAvatarSchema = z.object({
  token: z.string().optional(),
  userId: z.string().optional(),
})

export type ClearLobsterAvatarInput = z.input<typeof clearLobsterAvatarSchema>

export async function clearLobsterAvatarHandler({ data, context }: ServerFnArgs<ClearLobsterAvatarInput>) {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) {
    throw new Error('Authentication required to clear avatar.')
  }

  const { userId, dbClient } = auth

  await dbClient
    .update(profiles)
    .set({ avatarConfig: null, updatedAt: new Date() })
    .where(eq(profiles.id, userId))

  return { success: true }
}

export const clearLobsterAvatarFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: ClearLobsterAvatarInput) => clearLobsterAvatarSchema.parse(data))
  .handler(clearLobsterAvatarHandler)

export interface GetDailyAlignmentInput {
  date?: string
  userId?: string
  token?: string
}

export interface ToggleDailyAlignmentInput {
  taskKey: string
  completed: boolean
  date: string
  userId?: string
  token?: string
}

export interface DailyAlignmentResponse {
  date: string
  tasks: AlignmentTaskItem[]
  completedKeys: string[]
  completedCount: number
  totalCount: number
  isAllCompleted: boolean
  history: Array<{ date: string; completedCount: number }>
  streakDays: number
}

const getDailyAlignmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  userId: z.string().optional(),
  token: z.string().optional(),
})

const toggleDailyAlignmentSchema = z.object({
  taskKey: z.string().min(1),
  completed: z.boolean(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  userId: z.string().optional(),
  token: z.string().optional(),
})

export const getDailyAlignmentData = async (
  dbClient: Db,
  userId: string,
  targetDate: string
): Promise<DailyAlignmentResponse> => {
  const todayCompletions = await dbClient
    .select({
      taskKey: routineCompletions.taskKey,
    })
    .from(routineCompletions)
    .where(
      and(
        eq(routineCompletions.userId, userId),
        eq(routineCompletions.completedOn, targetDate)
      )
    )

  const completedKeys = todayCompletions.map((r) => r.taskKey)
  const tasks = mergeCompletions(completedKeys)
  const completedCount = completedKeys.length

  const startDate = shiftDays(targetDate, -30)
  const pastCompletions = await dbClient
    .select({
      completedOn: routineCompletions.completedOn,
      taskKey: routineCompletions.taskKey,
    })
    .from(routineCompletions)
    .where(
      and(
        eq(routineCompletions.userId, userId),
        sql`${routineCompletions.completedOn} >= ${startDate}`,
        sql`${routineCompletions.completedOn} <= ${targetDate}`
      )
    )

  const dayCounts = new Map<string, Set<string>>()
  for (const c of pastCompletions) {
    if (!dayCounts.has(c.completedOn)) {
      dayCounts.set(c.completedOn, new Set())
    }
    dayCounts.get(c.completedOn)!.add(c.taskKey)
  }

  const history: Array<{ date: string; completedCount: number }> = []
  for (let i = 30; i >= 0; i--) {
    const d = shiftDays(targetDate, -i)
    const count = dayCounts.get(d)?.size || 0
    history.push({ date: d, completedCount: count })
  }

  const streakDays = computeStreak(history, targetDate)

  return {
    date: targetDate,
    tasks,
    completedKeys,
    completedCount,
    totalCount: TOTAL_ALIGNMENT_TASKS,
    isAllCompleted: completedCount >= TOTAL_ALIGNMENT_TASKS,
    history,
    streakDays,
  }
}

export const getDailyAlignmentHandler = async ({
  data,
  context,
}: ServerFnArgs<GetDailyAlignmentInput>): Promise<DailyAlignmentResponse> => {
  const auth = await resolveWriteAuth({ data, context, requireAuth: false })
  const { date } = getDailyAlignmentSchema.parse(data || {})
  const targetDate = date || localDateString()

  if (!auth) {
    return {
      date: targetDate,
      tasks: mergeCompletions([]),
      completedKeys: [],
      completedCount: 0,
      totalCount: TOTAL_ALIGNMENT_TASKS,
      isAllCompleted: false,
      history: [],
      streakDays: 0,
    }
  }

  return await getDailyAlignmentData(auth.dbClient, auth.userId, targetDate)
}

export const toggleDailyAlignmentTaskHandler = async ({
  data,
  context,
}: ServerFnArgs<ToggleDailyAlignmentInput>): Promise<DailyAlignmentResponse> => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) {
    throw new Error('Unauthenticated: Authentication required to update daily alignment.')
  }

  const { taskKey, completed, date } = toggleDailyAlignmentSchema.parse(data)
  const { userId, dbClient } = auth

  const isValidKey = CANONICAL_ALIGNMENT_TASKS.some((t) => t.key === taskKey)
  if (!isValidKey) {
    throw new Error(`Invalid liturgy identifier: ${taskKey}`)
  }

  if (completed) {
    await dbClient
      .insert(routineCompletions)
      .values({
        userId,
        taskKey,
        completedOn: date,
      })
      .onConflictDoNothing()
    try {
      await recordRoutineCompletedEvent(dbClient, userId, taskKey, date)
    } catch (err) {
      console.warn('[toggleDailyAlignmentTaskFn] activity event write warning:', err)
    }
  } else {
    await dbClient
      .delete(routineCompletions)
      .where(
        and(
          eq(routineCompletions.userId, userId),
          eq(routineCompletions.taskKey, taskKey),
          eq(routineCompletions.completedOn, date)
        )
      )
    try {
      await deleteRoutineCompletedEvent(dbClient, userId, taskKey, date)
    } catch (err) {
      console.warn('[toggleDailyAlignmentTaskFn] activity event delete warning:', err)
    }
  }

  return await getDailyAlignmentData(dbClient, userId, date)
}

export const getDailyAlignmentFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: GetDailyAlignmentInput) => getDailyAlignmentSchema.parse(data || {}))
  .handler(getDailyAlignmentHandler)

export const toggleDailyAlignmentTaskFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: ToggleDailyAlignmentInput) => toggleDailyAlignmentSchema.parse(data))
  .handler(toggleDailyAlignmentTaskHandler)

export interface GetActivityEventsInput {
  userId?: string
  token?: string
  limit?: number
}

const getActivityEventsSchema = z.object({
  userId: z.string().optional(),
  token: z.string().optional(),
  limit: z.number().int().min(1).max(40).optional(),
})

export const getActivityEventsHandler = async ({
  data,
  context,
}: ServerFnArgs<GetActivityEventsInput>) => {
  const auth = await resolveWriteAuth({ data, context, requireAuth: false })
  if (!auth) return []
  const parsed = getActivityEventsSchema.parse(data || {})
  try {
    return await listActivityEventsForUser(auth.dbClient, auth.userId, parsed.limit)
  } catch (error) {
    console.error('[ServerFn getActivityEventsFn] DB query failed:', error)
    return []
  }
}

export const getActivityEventsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: GetActivityEventsInput) => getActivityEventsSchema.parse(data || {}))
  .handler(getActivityEventsHandler)

// ─── Chassis loadout (equipment vault) ───────────────────────────────────────

function toCatalogRef(row: typeof equipmentCatalog.$inferSelect): CatalogRef {
  const visualType = resolveVisualType(row.category, row.visualType)
  const rawUrl = row.imageUrl
  const imageUrl = rawUrl && !rawUrl.endsWith('.svg') ? rawUrl : chassisTypeImageUrl(visualType)
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    flavorText: row.flavorText,
    category: row.category,
    rarity: row.rarity,
    visualType,
    primaryStat: row.primaryStat,
    affixes: row.affixes ?? [],
    uniquePower: row.uniquePower ?? null,
    imageUrl,
    sortOrder: row.sortOrder,
  }
}

function toGearState(row: typeof userGearItems.$inferSelect): GearItemState {
  return {
    id: row.id,
    catalogItemId: row.catalogItemId,
    equippedSlot: normalizeEquipSlot(row.equippedSlot),
    vaultIndex: row.vaultIndex ?? null,
  }
}

async function loadChassisPayload(dbClient: Db, userId: string): Promise<{
  catalog: CatalogRef[]
  items: GearItemState[]
  totals: LoadoutTotals
  vaultSize: number
}> {
  let catalogRows = await dbClient
    .select()
    .from(equipmentCatalog)
    .orderBy(asc(equipmentCatalog.sortOrder))

  // Auto-sync any seed catalog entries missing from the database
  const existingIds = new Set(catalogRows.map((r) => r.id))
  const missingSeeds = INITIAL_EQUIPMENT_CATALOG.filter((item) => !existingIds.has(item.id))

  if (missingSeeds.length > 0) {
    try {
      for (const item of missingSeeds) {
        const values = catalogSeedInsertValues(item)
        await dbClient
          .insert(equipmentCatalog)
          .values(values)
          .onConflictDoUpdate({
            target: equipmentCatalog.id,
            set: {
              slug: values.slug,
              name: values.name,
              flavorText: values.flavorText,
              category: values.category,
              rarity: values.rarity,
              visualType: values.visualType,
              primaryStat: values.primaryStat,
              affixes: values.affixes,
              uniquePower: values.uniquePower,
              imageUrl: values.imageUrl,
              sortOrder: values.sortOrder,
            },
          })
      }
      catalogRows = await dbClient
        .select()
        .from(equipmentCatalog)
        .orderBy(asc(equipmentCatalog.sortOrder))
    } catch (e) {
      console.warn('[loadChassisPayload] Auto-sync catalog warning:', e)
    }
  }

  let gearRows = await dbClient
    .select()
    .from(userGearItems)
    .where(eq(userGearItems.userId, userId))

  const legacyClaws = gearRows.filter((row) => row.equippedSlot === 'claws')
  if (legacyClaws.length > 0) {
    for (const row of legacyClaws) {
      await dbClient
        .update(userGearItems)
        .set({ equippedSlot: 'claws-1', updatedAt: new Date() })
        .where(and(eq(userGearItems.id, row.id), eq(userGearItems.userId, userId)))
    }
    gearRows = await dbClient
      .select()
      .from(userGearItems)
      .where(eq(userGearItems.userId, userId))
  }

  if (catalogRows.length > 0) {
    const grants = planStarterGrants(
      gearRows.map(toGearState),
      catalogRows.map((c) => c.id),
      STARTER_EQUIPMENT_CATALOG_IDS,
      VAULT_SIZE
    )
    if (grants.length > 0) {
      await dbClient.insert(userGearItems).values(
        grants.map((grant) => ({
          userId,
          catalogItemId: grant.catalogItemId,
          equippedSlot: null,
          vaultIndex: grant.vaultIndex,
        }))
      )
      gearRows = await dbClient
        .select()
        .from(userGearItems)
        .where(eq(userGearItems.userId, userId))
    }
  }

  const catalog = catalogRows.map(toCatalogRef)
  const items = gearRows.map(toGearState)
  const catalogById = new Map(catalog.map((c) => [c.id, c]))
  const totals = computeLoadoutTotals(items, catalogById)

  return { catalog, items, totals, vaultSize: VAULT_SIZE }
}

export const getChassisLoadoutHandler = async ({
  data,
  context,
}: ServerFnArgs<{ token?: string; userId?: string }>) => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated: Authentication required to inspect equipment.')
  return loadChassisPayload(auth.dbClient, auth.userId)
}

export const getChassisLoadoutFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: { token?: string; userId?: string }) =>
    z
      .object({
        token: z.string().optional(),
        userId: z.string().optional(),
      })
      .parse(data ?? {})
  )
  .handler(getChassisLoadoutHandler)

const moveGearTargetSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('equip'),
    slot: z.enum(EQUIP_SLOT_IDS as [EquipSlotId, ...EquipSlotId[]]),
  }),
  z.object({
    type: z.literal('vault'),
    index: z.number().int().min(0).max(VAULT_SIZE - 1),
  }),
])

interface MoveGearItemInput {
  itemId: string
  target: MoveTarget
  token?: string
  userId?: string
}

export const moveGearItemHandler = async ({ data, context }: ServerFnArgs<MoveGearItemInput>) => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated: Authentication required to update equipment.')
  if (!data?.itemId || !data?.target) throw new Error('Missing gear move payload.')
  const { userId, dbClient } = auth

  const catalogRows = await dbClient.select().from(equipmentCatalog)
  const gearRows = await dbClient
    .select()
    .from(userGearItems)
    .where(eq(userGearItems.userId, userId))

  const catalog = catalogRows.map(toCatalogRef)
  const items = gearRows.map(toGearState)
  const catalogById = new Map(catalog.map((c) => [c.id, c]))

  const plan = planGearMove(items, catalogById, data.itemId, data.target, VAULT_SIZE)
  if (!plan.ok) throw new Error(plan.error)

  if (plan.updates.length > 0) {
    // Clear positions first to avoid unique-index collisions during swaps
    const ids = plan.updates.map((u) => u.id)
    for (const id of ids) {
      await dbClient
        .update(userGearItems)
        .set({
          equippedSlot: null,
          vaultIndex: null,
          updatedAt: new Date(),
        })
        .where(and(eq(userGearItems.id, id), eq(userGearItems.userId, userId)))
    }
    for (const update of plan.updates) {
      await dbClient
        .update(userGearItems)
        .set({
          equippedSlot: update.equippedSlot,
          vaultIndex: update.vaultIndex,
          updatedAt: new Date(),
        })
        .where(and(eq(userGearItems.id, update.id), eq(userGearItems.userId, userId)))
    }
  }

  return loadChassisPayload(dbClient, userId)
}

export const moveGearItemFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: MoveGearItemInput) =>
    z
      .object({
        itemId: z.string().uuid(),
        target: moveGearTargetSchema,
        token: z.string().optional(),
        userId: z.string().optional(),
      })
      .parse(data)
  )
  .handler(moveGearItemHandler)

// ─── Public profiles & connections ───────────────────────────────────────────

async function loadMemberEquippedLoadout(dbClient: Db, targetUserId: string) {
  const catalogRows = await dbClient
    .select()
    .from(equipmentCatalog)
    .orderBy(asc(equipmentCatalog.sortOrder))

  const gearRows = await dbClient
    .select()
    .from(userGearItems)
    .where(eq(userGearItems.userId, targetUserId))

  const catalog = catalogRows.map(toCatalogRef)
  const items = gearRows
    .map(toGearState)
    .filter((item) => item.equippedSlot != null)
  const catalogById = new Map(catalog.map((c) => [c.id, c]))
  const totals = computeLoadoutTotals(items, catalogById)

  return {
    catalog: catalog.filter((c) => items.some((item) => item.catalogItemId === c.id)),
    items,
    totals,
  }
}

async function resolveRelationship(
  dbClient: Db,
  viewerId: string,
  targetId: string
): Promise<{ relationship: RelationshipState; pendingRequestId: string | null }> {
  if (viewerId === targetId) {
    return { relationship: 'self', pendingRequestId: null }
  }

  const [userAId, userBId] = normalizeFriendPair(viewerId, targetId)
  const [friendship] = await dbClient
    .select({ id: friendships.id })
    .from(friendships)
    .where(and(eq(friendships.userAId, userAId), eq(friendships.userBId, userBId)))
    .limit(1)

  if (friendship) {
    return { relationship: 'friends', pendingRequestId: null }
  }

  const pending = await dbClient
    .select({
      id: friendRequests.id,
      senderId: friendRequests.senderId,
      recipientId: friendRequests.recipientId,
    })
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.status, 'pending'),
        or(
          and(eq(friendRequests.senderId, viewerId), eq(friendRequests.recipientId, targetId)),
          and(eq(friendRequests.senderId, targetId), eq(friendRequests.recipientId, viewerId))
        )
      )
    )
    .limit(1)

  if (pending[0]) {
    if (pending[0].senderId === viewerId) {
      return { relationship: 'pending_sent', pendingRequestId: pending[0].id }
    }
    return { relationship: 'pending_received', pendingRequestId: pending[0].id }
  }

  return { relationship: 'none', pendingRequestId: null }
}

async function insertNotification(
  dbClient: Db,
  input: {
    userId: string
    kind: 'friend_request' | 'friend_accepted' | 'friend_rejected'
    actorUserId: string
    title: string
    detail: string
    payload: { requestId?: string; profileId?: string }
    sourceKey: string
  }
) {
  await dbClient
    .insert(notifications)
    .values({
      userId: input.userId,
      kind: input.kind,
      actorUserId: input.actorUserId,
      title: input.title,
      detail: input.detail,
      payload: input.payload,
      sourceKey: input.sourceKey,
    })
    .onConflictDoNothing()
}

export const getPublicProfileHandler = async ({
  data,
  context,
}: ServerFnArgs<{ profileId: string; token?: string; userId?: string }>): Promise<PublicProfileView | null> => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated: Authentication required to view member profiles.')
  if (!data?.profileId) throw new Error('Missing profile id.')

  const [profile] = await auth.dbClient
    .select({
      id: profiles.id,
      larvaId: profiles.larvaId,
      handle: profiles.handle,
      stage: profiles.stage,
      avatarConfig: profiles.avatarConfig,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.id, data.profileId))
    .limit(1)

  if (!profile) return null

  const [stats] = await auth.dbClient
    .select()
    .from(userStats)
    .where(eq(userStats.userId, profile.id))
    .limit(1)

  const { relationship, pendingRequestId } = await resolveRelationship(
    auth.dbClient,
    auth.userId,
    profile.id
  )

  return {
    id: profile.id,
    larvaId: profile.larvaId,
    handle: profile.handle?.trim() || null,
    displayName: resolveMemberPublicName({
      userId: profile.id,
      handle: profile.handle,
      larvaId: profile.larvaId,
    }),
    stage: profile.stage,
    stageLabel: getStageLabel(profile.stage),
    avatarConfig: (profile.avatarConfig as PublicProfileView['avatarConfig']) ?? null,
    memberSince: profile.createdAt.toISOString(),
    stats: stats
      ? {
          pincerTorque: stats.pincerTorque,
          shellHardness: stats.shellHardness,
          processingPower: stats.processingPower,
          durability: stats.durability,
          clawStrength: stats.clawStrength,
          socialDetachmentIndex: stats.socialDetachmentIndex,
          submergenceDepthRating: stats.submergenceDepthRating,
        }
      : null,
    moltmax: stats
      ? {
          score: stats.moltmaxScore,
          clearance: stats.moltmaxClearance,
          stage: stats.moltmaxStage,
        }
      : null,
    relationship,
    pendingRequestId,
  }
}

export const getPublicProfileFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { profileId: string; token?: string; userId?: string }) =>
    z
      .object({
        profileId: z.string().min(1),
        token: z.string().optional(),
        userId: z.string().optional(),
      })
      .parse(data)
  )
  .handler(getPublicProfileHandler)

export const getMemberLoadoutHandler = async ({
  data,
  context,
}: ServerFnArgs<{ profileId: string; token?: string; userId?: string }>) => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated: Authentication required to view member loadouts.')
  if (!data?.profileId) throw new Error('Missing profile id.')

  const [exists] = await auth.dbClient
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, data.profileId))
    .limit(1)
  if (!exists) throw new Error('Member profile not found.')

  return loadMemberEquippedLoadout(auth.dbClient, data.profileId)
}

export const getMemberLoadoutFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { profileId: string; token?: string; userId?: string }) =>
    z
      .object({
        profileId: z.string().min(1),
        token: z.string().optional(),
        userId: z.string().optional(),
      })
      .parse(data)
  )
  .handler(getMemberLoadoutHandler)

export const searchMembersHandler = async ({
  data,
  context,
}: ServerFnArgs<{ query: string; token?: string; userId?: string }>): Promise<MemberSearchResult[]> => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated: Authentication required to search members.')

  const query = (data?.query || '').trim()
  if (query.length < 2) return []

  const rows = await auth.dbClient
    .select({
      id: profiles.id,
      larvaId: profiles.larvaId,
      handle: profiles.handle,
      stage: profiles.stage,
      avatarConfig: profiles.avatarConfig,
    })
    .from(profiles)
    .where(
      and(
        ne(profiles.id, auth.userId),
        or(ilike(profiles.handle, `%${query}%`), ilike(profiles.larvaId, `%${query}%`)),
      ),
    )
    .orderBy(asc(profiles.larvaId))
    .limit(20)

  return rows.map((row) => ({
    id: row.id,
    larvaId: row.larvaId,
    handle: row.handle?.trim() || null,
    displayName: resolveMemberPublicName({
      userId: row.id,
      handle: row.handle,
      larvaId: row.larvaId,
    }),
    stage: row.stage,
    stageLabel: getStageLabel(row.stage),
    avatarConfig: (row.avatarConfig as MemberSearchResult['avatarConfig']) ?? null,
  }))
}

export const searchMembersFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { query: string; token?: string; userId?: string }) =>
    z
      .object({
        query: z.string().min(1).max(80),
        token: z.string().optional(),
        userId: z.string().optional(),
      })
      .parse(data)
  )
  .handler(searchMembersHandler)

export const sendFriendRequestHandler = async ({
  data,
  context,
}: ServerFnArgs<{ recipientId: string; token?: string; userId?: string }>) => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated: Authentication required to send friend requests.')
  if (!data?.recipientId) throw new Error('Missing recipient.')

  assertCanSendFriendRequest(auth.userId, data.recipientId)

  const [recipient] = await auth.dbClient
    .select({ id: profiles.id, larvaId: profiles.larvaId })
    .from(profiles)
    .where(eq(profiles.id, data.recipientId))
    .limit(1)
  if (!recipient) throw new Error('That member could not be found.')

  const { relationship } = await resolveRelationship(auth.dbClient, auth.userId, data.recipientId)
  if (relationship === 'friends') throw new Error('You are already friends with this member.')
  if (relationship === 'pending_sent') throw new Error('Friend request already sent.')
  if (relationship === 'pending_received') {
    throw new Error('This member already sent you a friend request. Accept it from Connections or Activity Center.')
  }

  const [sender] = await auth.dbClient
    .select({ id: profiles.id, larvaId: profiles.larvaId, handle: profiles.handle })
    .from(profiles)
    .where(eq(profiles.id, auth.userId))
    .limit(1)

  const [created] = await auth.dbClient
    .insert(friendRequests)
    .values({
      senderId: auth.userId,
      recipientId: data.recipientId,
      status: 'pending',
    })
    .returning()

  const copy = buildFriendNotificationCopy(
    'friend_request',
    resolveMemberPublicName({
      userId: auth.userId,
      handle: sender?.handle,
      larvaId: sender?.larvaId,
    }),
  )
  await insertNotification(auth.dbClient, {
    userId: data.recipientId,
    kind: 'friend_request',
    actorUserId: auth.userId,
    title: copy.title,
    detail: copy.detail,
    payload: { requestId: created.id, profileId: auth.userId },
    sourceKey: friendRequestSourceKey(created.id),
  })

  return { requestId: created.id, status: created.status as string }
}

export const sendFriendRequestFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { recipientId: string; token?: string; userId?: string }) =>
    z
      .object({
        recipientId: z.string().min(1),
        token: z.string().optional(),
        userId: z.string().optional(),
      })
      .parse(data)
  )
  .handler(sendFriendRequestHandler)

export const respondFriendRequestHandler = async ({
  data,
  context,
}: ServerFnArgs<{ requestId: string; action: 'accept' | 'reject'; token?: string; userId?: string }>) => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated: Authentication required to respond to friend requests.')
  if (!data?.requestId || !data?.action) throw new Error('Missing request response payload.')

  const [request] = await auth.dbClient
    .select()
    .from(friendRequests)
    .where(eq(friendRequests.id, data.requestId))
    .limit(1)

  if (!request) throw new Error('Friend request not found.')
  if (request.recipientId !== auth.userId) {
    throw new Error('Only the recipient can accept or decline this request.')
  }
  if (!canTransitionFriendRequest(request.status as 'pending', data.action === 'accept' ? 'accepted' : 'rejected')) {
    throw new Error('This friend request can no longer be updated.')
  }

  const nextStatus = data.action === 'accept' ? 'accepted' : 'rejected'
  await auth.dbClient
    .update(friendRequests)
    .set({ status: nextStatus, respondedAt: new Date() })
    .where(eq(friendRequests.id, request.id))

  const [actor] = await auth.dbClient
    .select({ id: profiles.id, larvaId: profiles.larvaId, handle: profiles.handle })
    .from(profiles)
    .where(eq(profiles.id, auth.userId))
    .limit(1)

  if (data.action === 'accept') {
    const [userAId, userBId] = normalizeFriendPair(request.senderId, request.recipientId)
    await auth.dbClient
      .insert(friendships)
      .values({ userAId, userBId })
      .onConflictDoNothing()

    const copy = buildFriendNotificationCopy(
      'friend_accepted',
      resolveMemberPublicName({
        userId: auth.userId,
        handle: actor?.handle,
        larvaId: actor?.larvaId,
      }),
    )
    await insertNotification(auth.dbClient, {
      userId: request.senderId,
      kind: 'friend_accepted',
      actorUserId: auth.userId,
      title: copy.title,
      detail: copy.detail,
      payload: { requestId: request.id, profileId: auth.userId },
      sourceKey: friendAcceptedSourceKey(request.id),
    })
  } else {
    const copy = buildFriendNotificationCopy(
      'friend_rejected',
      resolveMemberPublicName({
        userId: auth.userId,
        handle: actor?.handle,
        larvaId: actor?.larvaId,
      }),
    )
    await insertNotification(auth.dbClient, {
      userId: request.senderId,
      kind: 'friend_rejected',
      actorUserId: auth.userId,
      title: copy.title,
      detail: copy.detail,
      payload: { requestId: request.id, profileId: auth.userId },
      sourceKey: friendRejectedSourceKey(request.id),
    })
  }

  // Mark the recipient's actionable notification as read
  await auth.dbClient
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, auth.userId),
        eq(notifications.sourceKey, friendRequestSourceKey(request.id)),
        isNull(notifications.readAt)
      )
    )

  return { requestId: request.id, status: nextStatus }
}

export const respondFriendRequestFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { requestId: string; action: 'accept' | 'reject'; token?: string; userId?: string }) =>
    z
      .object({
        requestId: z.string().uuid(),
        action: z.enum(['accept', 'reject']),
        token: z.string().optional(),
        userId: z.string().optional(),
      })
      .parse(data)
  )
  .handler(respondFriendRequestHandler)

export const cancelFriendRequestHandler = async ({
  data,
  context,
}: ServerFnArgs<{ requestId: string; token?: string; userId?: string }>) => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated: Authentication required to cancel friend requests.')
  if (!data?.requestId) throw new Error('Missing request id.')

  const [request] = await auth.dbClient
    .select()
    .from(friendRequests)
    .where(eq(friendRequests.id, data.requestId))
    .limit(1)

  if (!request) throw new Error('Friend request not found.')
  if (request.senderId !== auth.userId) {
    throw new Error('Only the sender can cancel this request.')
  }
  if (!canTransitionFriendRequest(request.status as 'pending', 'cancelled')) {
    throw new Error('This friend request can no longer be cancelled.')
  }

  await auth.dbClient
    .update(friendRequests)
    .set({ status: 'cancelled', respondedAt: new Date() })
    .where(eq(friendRequests.id, request.id))

  return { requestId: request.id, status: 'cancelled' as const }
}

export const cancelFriendRequestFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { requestId: string; token?: string; userId?: string }) =>
    z
      .object({
        requestId: z.string().uuid(),
        token: z.string().optional(),
        userId: z.string().optional(),
      })
      .parse(data)
  )
  .handler(cancelFriendRequestHandler)

export const removeConnectionHandler = async ({
  data,
  context,
}: ServerFnArgs<{ friendId: string; token?: string; userId?: string }>) => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated: Authentication required to remove a connection.')
  if (!data?.friendId) throw new Error('Missing friend id.')
  if (data.friendId === auth.userId) throw new Error('Cannot remove yourself.')

  const [userAId, userBId] = normalizeFriendPair(auth.userId, data.friendId)
  await auth.dbClient
    .delete(friendships)
    .where(and(eq(friendships.userAId, userAId), eq(friendships.userBId, userBId)))

  return { ok: true as const }
}

export const removeConnectionFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { friendId: string; token?: string; userId?: string }) =>
    z
      .object({
        friendId: z.string().min(1),
        token: z.string().optional(),
        userId: z.string().optional(),
      })
      .parse(data)
  )
  .handler(removeConnectionHandler)

export const listConnectionsHandler = async ({
  data,
  context,
}: ServerFnArgs<{ token?: string; userId?: string }>): Promise<ConnectionsListView> => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated: Authentication required to list connections.')

  const friendshipRows = await auth.dbClient
    .select()
    .from(friendships)
    .where(or(eq(friendships.userAId, auth.userId), eq(friendships.userBId, auth.userId)))

  const friendIds = friendshipRows.map((row) =>
    row.userAId === auth.userId ? row.userBId : row.userAId
  )

  const friendProfiles =
    friendIds.length === 0
      ? []
      : await auth.dbClient
          .select({
            id: profiles.id,
            larvaId: profiles.larvaId,
            handle: profiles.handle,
            stage: profiles.stage,
            avatarConfig: profiles.avatarConfig,
          })
          .from(profiles)
          .where(inArray(profiles.id, friendIds))

  const friendSinceById = new Map(
    friendshipRows.map((row) => [
      row.userAId === auth.userId ? row.userBId : row.userAId,
      row.createdAt,
    ])
  )

  const pendingRows = await auth.dbClient
    .select()
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.status, 'pending'),
        or(eq(friendRequests.senderId, auth.userId), eq(friendRequests.recipientId, auth.userId))
      )
    )
    .orderBy(desc(friendRequests.createdAt))

  const relatedIds = [
    ...new Set(pendingRows.flatMap((row) => [row.senderId, row.recipientId])),
  ].filter((id) => id !== auth.userId)

  const relatedProfiles =
    relatedIds.length === 0
      ? []
      : await auth.dbClient
          .select({
            id: profiles.id,
            larvaId: profiles.larvaId,
            handle: profiles.handle,
            stage: profiles.stage,
            avatarConfig: profiles.avatarConfig,
          })
          .from(profiles)
          .where(inArray(profiles.id, relatedIds))

  const profileById = new Map(relatedProfiles.map((p) => [p.id, p]))

  const incoming = pendingRows
    .filter((row) => row.recipientId === auth.userId)
    .map((row) => {
      const other = profileById.get(row.senderId)
      if (!other) return null
      return toMemberSummary({
        ...other,
        avatarConfig: (other.avatarConfig as { style: string; seed: string } | null) ?? null,
        requestId: row.id,
      })
    })
    .filter(Boolean) as ConnectionsListView['incoming']

  const outgoing = pendingRows
    .filter((row) => row.senderId === auth.userId)
    .map((row) => {
      const other = profileById.get(row.recipientId)
      if (!other) return null
      return toMemberSummary({
        ...other,
        avatarConfig: (other.avatarConfig as { style: string; seed: string } | null) ?? null,
        requestId: row.id,
      })
    })
    .filter(Boolean) as ConnectionsListView['outgoing']

  return {
    friends: friendProfiles.map((p) =>
      toMemberSummary({
        ...p,
        avatarConfig: (p.avatarConfig as { style: string; seed: string } | null) ?? null,
        since: friendSinceById.get(p.id) ?? null,
      })
    ),
    incoming,
    outgoing,
  }
}

export const listConnectionsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: { token?: string; userId?: string }) =>
    z
      .object({
        token: z.string().optional(),
        userId: z.string().optional(),
      })
      .parse(data ?? {})
  )
  .handler(listConnectionsHandler)

export const getNotificationsHandler = async ({
  data,
  context,
}: ServerFnArgs<{ token?: string; userId?: string; limit?: number }>): Promise<{
  notifications: NotificationView[]
  unreadCount: number
}> => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated: Authentication required to load notifications.')

  const limit = Math.min(Math.max(data?.limit ?? 30, 1), 50)
  const rows = await auth.dbClient
    .select({
      id: notifications.id,
      kind: notifications.kind,
      title: notifications.title,
      detail: notifications.detail,
      actorUserId: notifications.actorUserId,
      payload: notifications.payload,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
      actorLarvaId: profiles.larvaId,
    })
    .from(notifications)
    .leftJoin(profiles, eq(notifications.actorUserId, profiles.id))
    .where(eq(notifications.userId, auth.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)

  const views: NotificationView[] = rows.map((row) => {
    const payload = (row.payload || {}) as { requestId?: string; profileId?: string }
    const readAt = row.readAt ? row.readAt.toISOString() : null
    return {
      id: row.id,
      kind: row.kind as NotificationView['kind'],
      title: row.title,
      detail: row.detail,
      actorUserId: row.actorUserId,
      actorLarvaId: row.actorLarvaId ?? null,
      payload,
      readAt,
      createdAt: row.createdAt.toISOString(),
      actionable: isActionableFriendRequest(row.kind as NotificationView['kind'], readAt, payload),
    }
  })

  return {
    notifications: views,
    unreadCount: countUnreadNotifications(views),
  }
}

export const getNotificationsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: { token?: string; userId?: string; limit?: number }) =>
    z
      .object({
        token: z.string().optional(),
        userId: z.string().optional(),
        limit: z.number().int().min(1).max(50).optional(),
      })
      .parse(data ?? {})
  )
  .handler(getNotificationsHandler)

export const markNotificationReadHandler = async ({
  data,
  context,
}: ServerFnArgs<{ notificationId?: string; all?: boolean; token?: string; userId?: string }>) => {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated: Authentication required to mark notifications read.')

  const now = new Date()
  if (data?.all) {
    await auth.dbClient
      .update(notifications)
      .set({ readAt: now })
      .where(and(eq(notifications.userId, auth.userId), isNull(notifications.readAt)))
    return { ok: true as const }
  }

  if (!data?.notificationId) throw new Error('Missing notification id.')
  await auth.dbClient
    .update(notifications)
    .set({ readAt: now })
    .where(and(eq(notifications.id, data.notificationId), eq(notifications.userId, auth.userId)))

  return { ok: true as const }
}

export const markNotificationReadFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { notificationId?: string; all?: boolean; token?: string; userId?: string }) =>
    z
      .object({
        notificationId: z.string().uuid().optional(),
        all: z.boolean().optional(),
        token: z.string().optional(),
        userId: z.string().optional(),
      })
      .parse(data)
  )
  .handler(markNotificationReadHandler)

