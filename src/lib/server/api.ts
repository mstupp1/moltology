import { z } from 'zod'
import type { JWTPayload } from 'jose'
import { createServerFn } from '@tanstack/react-start'
import { publicMiddleware, authenticatedMiddleware } from './functions'
import { changelogs, profiles, users, userStats, galleryPins, blogPosts, blogComments, forumCategories, forumTopics, forumPosts, podcasts, leads } from '../../db/schema'
import { getDb } from '../../db'
import { eq, desc, like, or, sql, and } from 'drizzle-orm'
import type { ChangelogEntry } from '../changelogs-data'
import { generateSlug } from '../ingest/parser'
import { INITIAL_GALLERY_PINS, S3_BASE_URL } from '../gallery-data'
import type { GalleryPin } from '../gallery-data'
import { INITIAL_BLOG_POSTS } from '../blog-data'
import type { BlogPostData } from '../blog-data'
import { INITIAL_FORUM_CATEGORIES, INITIAL_FORUM_TOPICS } from '../forum-seed-data'
import { validateForumContent } from '../community-rules'
import { INITIAL_PODCASTS } from '../podcast-data'
import type { PodcastEpisode } from '../podcast-data'


import { getPresignedViewUrl } from '../s3-client'
import { ORACLE_MODELS, getOracleModel } from '../ai/oracle-models'
import { verifyTurnstileToken } from './turnstile'

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

interface CreateChangelogInput {
  slug?: string
  version?: string
  title: string
  category: string
  summary: string
  content: string
  isPublished?: boolean
  userId?: string
  token?: string
}

import { ensureUserProfile } from '../user-sync'

/**
 * Resolves the authenticated user id and RLS-scoped db client for admin changelog
 * mutations. Mirrors getUserProfileHandler: falls back to an explicit Neon JWT in
 * `data.token` because the JWT is not reliably available via cookies on the client.
 */
const resolveChangelogAuth = async (opts: { data?: { token?: string; userId?: string }; context?: any }) => {
  const { data, context } = opts
  const authToken = context?.token || data?.token || undefined
  let userId = context?.user?.sub || context?.user?.id
  if (!userId && authToken) {
    const { verifyNeonJWT } = await import('../jwt')
    const verification = await verifyNeonJWT(authToken)
    if (verification.valid && verification.payload?.sub) {
      userId = verification.payload.sub
    }
  }
  if (!userId && data?.userId) {
    userId = data.userId
  }
  const dbClient = context?.db || getDb(authToken)
  return { userId, dbClient, authToken }
}

/**
 * Server Function: Create system changelog entry (Admin / Super Admin only).
 */
export const createChangelogHandler = async ({ data, context }: ServerFnArgs<CreateChangelogInput>) => {
  const { userId, dbClient } = await resolveChangelogAuth({ data, context })
  if (!userId) {
    throw new Error('Unauthenticated: Authentication required to create system changelogs.')
  }

  await ensureUserProfile(userId)

  const [userRecord] = await dbClient
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  if (!userRecord || !['admin', 'super_admin'].includes(userRecord.role)) {
    throw new Error('Unauthorized: Admin or Super Admin privileges required to post changelogs.')
  }

  if (!data) {
    throw new Error('Input payload missing for changelog creation.')
  }

  const computedSlug = data.slug ? generateSlug(data.slug) : generateSlug(data.title)

  const [inserted] = await dbClient
    .insert(changelogs)
    .values({
      slug: computedSlug,
      version: data.version || 'v1.0.0',
      title: data.title,
      category: data.category,
      summary: data.summary,
      content: data.content,
      isPublished: data.isPublished !== false,
      releasedAt: new Date(),
    })
    .returning()

  return toChangelogEntry(inserted)
}

export const createChangelogFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: CreateChangelogInput) => {
    return z.object({
      slug: z.string().optional(),
      version: z.string().optional(),
      title: z.string().min(1),
      category: z.string().min(1),
      summary: z.string().min(1),
      content: z.string().min(1),
      isPublished: z.boolean().optional(),
      userId: z.string().optional(),
      token: z.string().optional(),
    }).parse(data)
  })
  .handler(createChangelogHandler)

interface UpdateChangelogInput extends CreateChangelogInput {
  id: string
  releasedAt?: string | Date
}

/**
 * Server Function: Update an existing system changelog entry (Admin / Super Admin only).
 */
export const updateChangelogHandler = async ({ data, context }: ServerFnArgs<UpdateChangelogInput>) => {
  const { userId, dbClient } = await resolveChangelogAuth({ data, context })
  if (!userId) {
    throw new Error('Unauthenticated: Authentication required to edit system changelogs.')
  }

  await ensureUserProfile(userId)

  const [userRecord] = await dbClient
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  if (!userRecord || !['admin', 'super_admin'].includes(userRecord.role)) {
    throw new Error('Unauthorized: Admin or Super Admin privileges required to edit changelogs.')
  }

  if (!data?.id) {
    throw new Error('Input payload missing changelog id for update.')
  }

  const computedSlug = data.slug ? generateSlug(data.slug) : generateSlug(data.title)

  const [updated] = await dbClient
    .update(changelogs)
    .set({
      slug: computedSlug,
      version: data.version || 'v1.0.0',
      title: data.title,
      category: data.category,
      summary: data.summary,
      content: data.content,
      isPublished: data.isPublished !== false,
      releasedAt: data.releasedAt ? new Date(data.releasedAt) : new Date(),
    })
    .where(eq(changelogs.id, data.id))
    .returning()

  return toChangelogEntry(updated)
}

export const updateChangelogFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: UpdateChangelogInput) => {
    return z.object({
      id: z.string().min(1),
      slug: z.string().optional(),
      version: z.string().optional(),
      title: z.string().min(1),
      category: z.string().min(1),
      summary: z.string().min(1),
      content: z.string().min(1),
      isPublished: z.boolean().optional(),
      userId: z.string().optional(),
      token: z.string().optional(),
      releasedAt: z.union([z.string(), z.date()]).optional(),
    }).parse(data)
  })
  .handler(updateChangelogHandler)

interface DeleteChangelogInput {
  id: string
  userId?: string
  token?: string
}

/**
 * Server Function: Delete a system changelog entry (Admin / Super Admin only).
 */
export const deleteChangelogHandler = async ({ data, context }: ServerFnArgs<DeleteChangelogInput>) => {
  const { userId, dbClient } = await resolveChangelogAuth({ data, context })
  if (!userId) {
    throw new Error('Unauthenticated: Authentication required to delete system changelogs.')
  }

  await ensureUserProfile(userId)

  const [userRecord] = await dbClient
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  if (!userRecord || !['admin', 'super_admin'].includes(userRecord.role)) {
    throw new Error('Unauthorized: Admin or Super Admin privileges required to delete changelogs.')
  }

  if (!data?.id) {
    throw new Error('Input payload missing changelog id for deletion.')
  }

  const [deleted] = await dbClient
    .delete(changelogs)
    .where(eq(changelogs.id, data.id))
    .returning()

  return toChangelogEntry(deleted)
}

export const deleteChangelogFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: DeleteChangelogInput) => {
    return z.object({
      id: z.string().min(1),
      userId: z.string().optional(),
      token: z.string().optional(),
    }).parse(data)
  })
  .handler(deleteChangelogHandler)



/**
 * Server Function: Get authenticated user profile.
 * Accepts optional `token` (Neon JWT) or `userId` fallback for client components
 * where the JWT isn't available via cookies (Neon's get-j-w-t-token is unavailable).
 */
const getUserProfileHandler = async ({ data, context }: ServerFnArgs<{ token?: string; userId?: string }>) => {
  let userId = context?.user?.sub || context?.user?.id

  // Try explicit JWT if middleware couldn't resolve from cookies
  if (!userId && data?.token) {
    const { verifyNeonJWT } = await import('../jwt')
    const verification = await verifyNeonJWT(data.token)
    if (verification.valid && verification.payload?.sub) {
      userId = verification.payload.sub
    }
  }

  // Final fallback: userId passed directly from client session
  if (!userId && data?.userId) {
    userId = data.userId
  }

  if (!userId) return null

  const { ensureUserProfile } = await import('../user-sync')
  await ensureUserProfile(userId)

  const dbClient = context?.db || getDb(context?.token ?? data?.token ?? undefined)
  const [profileRecord] = await dbClient
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  return profileRecord || null
}

export const getUserProfileFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: { token?: string; userId?: string }) => data ?? {})
  .handler(getUserProfileHandler)

/**
 * Server Function: Get authenticated user stats.
 */
const getUserStatsHandler = async ({ context }: ServerFnArgs) => {
  const userId = context?.user?.sub || context?.user?.id
  if (!userId) {
    return null
  }

  const dbClient = context?.db || getDb(context?.token ?? undefined)
  const [stats] = await dbClient
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1)

  return stats || null
}

export const getUserStatsFn = createServerFn({ method: 'POST' })
  .middleware(authenticatedMiddleware)
  .handler(getUserStatsHandler)

interface UserStatsInput {
  pincerTorque?: number
  shellHardness?: number
  clawStrength?: number
  moltmaxScore?: number
  moltmaxClearance?: string
  moltmaxStage?: string
  moltmaxDimensionScores?: Record<string, number>
}

/**
 * Server Function: Update authenticated user stats with input validation.
 */
const updateUserStatsHandler = async ({ data, context }: ServerFnArgs<UserStatsInput>) => {
  const userId = context?.user?.sub || context?.user?.id
  if (!userId) {
    throw new Error('User identifier missing from context')
  }

  // Auth flows can succeed before the profile/stat sync request finishes. Make
  // the save path self-healing instead of allowing a zero-row UPDATE.
  const { ensureUserProfile } = await import('../user-sync')
  await ensureUserProfile(userId)

  const dbClient = context?.db || getDb(context?.token ?? undefined)
  await dbClient
    .insert(userStats)
    .values({ userId })
    .onConflictDoNothing()

  const input = data ?? {}
  const statsData = input.moltmaxScore === undefined
    ? input
    : { ...input, moltmaxCompletedAt: new Date() }
  const [updated] = await dbClient
    .update(userStats)
    .set({ ...statsData, updatedAt: new Date() })
    .where(eq(userStats.userId, userId))
    .returning()

  return updated
}

export const updateUserStatsFn = createServerFn({ method: 'POST' })
  .middleware(authenticatedMiddleware)
  .validator((data: UserStatsInput) => {
    return z
      .object({
        pincerTorque: z.number().min(0).max(100).optional(),
        shellHardness: z.number().min(0).max(100).optional(),
        clawStrength: z.number().min(0).max(100).optional(),
        moltmaxScore: z.number().int().min(12).max(99).optional(),
        moltmaxClearance: z.string().min(1).max(10).optional(),
        moltmaxStage: z.string().min(1).max(100).optional(),
        moltmaxDimensionScores: z.record(z.string(), z.number().min(0).max(100)).optional(),
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

/**
 * Server Function: Get gallery pins from DB or return preloaded initial catalog.
 */
const getGalleryPinsHandler = async ({ context }: ServerFnArgs): Promise<GalleryPin[]> => {
  const dbClient = context?.db || getDb()
  try {
    const records = await dbClient
      .select()
      .from(galleryPins)
      .orderBy(desc(galleryPins.createdAt))

    if (records && records.length > 0) {
      return records.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        title: r.title,
        description: r.description,
        prompt: r.prompt || undefined,
        s3Key: r.s3Key,
        imageUrl: (r.imageUrl && r.imageUrl.startsWith('http'))
          ? r.imageUrl
          : `${S3_BASE_URL}/${r.s3Key ? r.s3Key.replace(/^\//, '') : ''}`,
        aspectRatio: r.aspectRatio as GalleryPin['aspectRatio'],
        category: r.category as GalleryPin['category'],
        tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
        authorName: r.authorName,
        authorAvatar: r.authorAvatar,
        authorStage: r.authorStage,
        pinCount: r.pinCount,
        views: r.views,
        likes: r.likes,
        isPreloaded: r.isPreloaded,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      }))
    }
  } catch (error) {
    console.warn('[ServerFn getGalleryPinsFn] DB query failed, using preloaded gallery fallback:', error)
  }

  return INITIAL_GALLERY_PINS
}

export const getGalleryPinsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .handler(getGalleryPinsHandler)

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
}

/**
 * Server Function: Create a new AI conversation thread.
 */
const createAIThreadHandler = async ({ data, context }: ServerFnArgs<CreateAIThreadInput>) => {
  const userId = context?.user?.sub || context?.user?.id
  if (!userId) throw new Error('Unauthenticated')
  const { createAIThread } = await import('../ai/service')
  return await createAIThread({
    userId,
    title: data?.title || 'Ascendance Consultation',
    persona: data?.persona || 'oracle',
  })
}

export const createAIThreadFn = createServerFn({ method: 'POST' })
  .middleware(authenticatedMiddleware)
  .validator((data: CreateAIThreadInput) => {
    return z.object({ title: z.string().optional(), persona: z.string().optional() }).parse(data)
  })
  .handler(createAIThreadHandler)

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

  const lastMsg = messages[messages.length - 1]
  const userText = lastMsg?.content || lastMsg?.text || ''

  const { validateInputGuardrails, checkRateLimit } = await import('../ai/guardrails')
  const clientIp = '127.0.0.1'
  const rateLimit = checkRateLimit(userId || clientIp, 30, 60 * 1000)
  if (!rateLimit.success) {
    throw new Error('Rate limit exceeded. Please wait a moment before sending more messages.')
  }

  const guardrail = validateInputGuardrails(userText)
  if (!guardrail.allowed) {
    throw new Error(guardrail.reason || 'Message blocked by AI guardrails.')
  }

  const { saveAIMessage, createAIThread } = await import('../ai/service')
  let activeThreadId = inputThreadId

  // Guest Mode Gating: Unauthenticated seekers receive friendly, clear guidance directing them to sign up
  if (!userId) {
    const GUEST_ORACLE_RESPONSES = [
      "The Oracle sees great potential in you, but you're still in Guest Mode! Create a free account to unlock detailed answers, advice, and save your chat history.",
      "That is a great question! In Guest Mode, my answers are kept brief. Sign up for a free account to unlock full Oracle guidance and start your journey.",
      "I'd love to give you the full breakdown, but you're browsing as a guest. Create your free account in seconds to get complete answers and track your progress!",
      "The answer lies just beneath the surface! In Guest Mode, detailed insights and saved chats are locked. Sign up for free to unlock the full Oracle experience.",
      "You're asking the right questions, but full answers require a free account. Sign up below to unlock complete answers and permanent chat history!",
    ]
    const index = Math.abs(userText.length + messages.length) % GUEST_ORACLE_RESPONSES.length
    return {
      text: GUEST_ORACLE_RESPONSES[index],
      threadId: null,
      isGuest: true,
    }
  }

  // Safe DB Thread creation & User message logging
  if (userId) {
    try {
      if (!activeThreadId) {
        const newThread = await createAIThread({
          userId,
          title: userText.slice(0, 30) + '...',
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
  const payloadMessages = messages.map((m) => ({
    role: m.role as any,
    content: m.content || m.text || '',
  }))

  // Model cascade: selected model first, then remaining candidates, so a rate-limited or restricted model falls through to a reachable one.
  const selectedModel = getOracleModel(selectedModelId)
  const candidateModels = [
    selectedModel.id,
    ...ORACLE_MODELS.filter((m) => m.id !== selectedModel.id).map((m) => m.id),
  ]
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
      console.warn(`[Benthic Neural Gateway] Model candidate '${modelCandidate}' failed:`, err.message)
      lastError = err
    }
  }

  if (!assistantText) {
    assistantText = `[SYNAPTIC ORACLE SYSTEM ERROR] The Benthic neural gateway could not reach any registered cognition core. Your current Ascension tier does not grant passage to the requested Oracle channels. Await re-synchronization or petition a higher tier. (${lastError?.message || 'Gateway Unavailable'})`
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
  const userId = context?.user?.sub || context?.user?.id || data?.userId
  if (!userId) {
    throw new Error('Unauthenticated: You must be registered and logged in to post comments.')
  }

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

  // Guardrail 2: Length validation
  if (sanitizedContent.length < 3) {
    throw new Error('Guardrail trigger: Comment must be at least 3 characters long.')
  }
  if (sanitizedContent.length > 1000) {
    throw new Error('Guardrail trigger: Comment exceeds maximum limit of 1000 characters.')
  }

  // Guardrail 3: Basic toxicity / link spam filter
  const prohibitedPatterns = [/http:\/\//i, /https:\/\//i, /free money/i, /crypto scam/i]
  for (const pattern of prohibitedPatterns) {
    if (pattern.test(sanitizedContent)) {
      throw new Error('Guardrail trigger: Your transmission contained restricted external links or promotional content.')
    }
  }

  await ensureUserProfile(userId)
  const dbClient = context?.db || getDb(context?.token ?? undefined)

  const [userProfile] = await dbClient
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  const authorName = userProfile?.larvaId || (context?.user as any)?.name || 'Ascendant Initiate'
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
}

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
        topicCount: countsMap.get(c.id) || 0,
      }))
    }
  } catch (err) {
    console.warn('[getForumCategoriesFn] DB error, using seed fallback:', err)
  }

  return INITIAL_FORUM_CATEGORIES.map((c) => ({
    ...c,
    topicCount: INITIAL_FORUM_TOPICS.filter((t) => t.categoryId === c.id).length,
  }))
}

export const getForumCategoriesFn = createServerFn({ method: 'GET' })
  .middleware(publicMiddleware)
  .handler(getForumCategoriesHandler)

export interface GetForumTopicsInput {
  categorySlug?: string
  query?: string
  sortBy?: 'latest' | 'top' | 'active'
}

/**
 * Server Function: Get forum topics with filtering and search.
 */
export const getForumTopicsHandler = async ({ data, context }: ServerFnArgs<GetForumTopicsInput>): Promise<ForumTopicEntry[]> => {
  const dbClient = context?.db || getDb()
  const { categorySlug, query, sortBy = 'latest' } = data || {}

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
      })
      .from(forumTopics)
      .leftJoin(forumCategories, eq(forumTopics.categoryId, forumCategories.id))

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
    } else {
      finalQuery = finalQuery.orderBy(desc(forumTopics.isPinned), desc(forumTopics.createdAt)) as any
    }

    const records = await finalQuery

    if (records && records.length > 0) {
      return records.map((r: any) => ({
        id: r.id,
        categoryId: r.categoryId,
        categorySlug: r.categorySlug || 'general-discussion',
        categoryName: r.categoryName || 'General Discussion',
        categoryColor: r.categoryColor || '#00ffff',
        userId: r.userId,
        authorName: r.authorName,
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
    }
  } catch (err) {
    console.warn('[getForumTopicsFn] DB error, using seed fallback:', err)
  }

  // Fallback to initial seed topics
  let fallback: ForumTopicEntry[] = INITIAL_FORUM_TOPICS.map((t) => {
    const cat = INITIAL_FORUM_CATEGORIES.find((c) => c.id === t.categoryId)
    return {
      ...t,
      userId: t.userId ?? null,
      categorySlug: cat?.slug || 'general-discussion',
      categoryName: cat?.name || 'General Discussion',
      categoryColor: cat?.color || '#00ffff',
    }
  })


  if (categorySlug && categorySlug !== 'all') {
    fallback = fallback.filter((t) => t.categorySlug === categorySlug)
  }
  if (query && query.trim() !== '') {
    const q = query.toLowerCase()
    fallback = fallback.filter((t) => t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q))
  }
  return fallback
}

export const getForumTopicsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: GetForumTopicsInput) => {
    return z
      .object({
        categorySlug: z.string().optional(),
        query: z.string().optional(),
        sortBy: z.enum(['latest', 'top', 'active']).optional(),
      })
      .optional()
      .parse(data || {})
  })
  .handler(getForumTopicsHandler)

export interface GetForumTopicDetailInput {
  slugOrId: string
}

export interface ForumTopicDetailResult {
  topic: ForumTopicEntry
  posts: ForumPostEntry[]
}

/**
 * Server Function: Get single topic detail with posts and increment view count.
 */
export const getForumTopicDetailHandler = async ({ data, context }: ServerFnArgs<GetForumTopicDetailInput>): Promise<ForumTopicDetailResult | null> => {
  const { slugOrId } = data || {}
  if (!slugOrId) return null
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
      })
      .from(forumTopics)
      .leftJoin(forumCategories, eq(forumTopics.categoryId, forumCategories.id))
      .where(isUuid ? eq(forumTopics.id, slugOrId) : eq(forumTopics.slug, slugOrId))
      .limit(1)

    if (topicRecord.length > 0) {
      const t = topicRecord[0]

      // Fire-and-forget view count increment
      dbClient
        .update(forumTopics)
        .set({ views: t.views + 1 })
        .where(eq(forumTopics.id, t.id))
        .catch((err: any) => console.warn('[getForumTopicDetailFn] View count update error:', err))

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
        })
        .from(forumPosts)
        .where(eq(forumPosts.topicId, t.id))
        .orderBy(forumPosts.createdAt)

      return {
        topic: {
          id: t.id,
          categoryId: t.categoryId,
          categorySlug: t.categorySlug || 'general-discussion',
          categoryName: t.categoryName || 'General Discussion',
          categoryColor: t.categoryColor || '#00ffff',
          userId: t.userId,
          authorName: t.authorName,
          authorAvatar: t.authorAvatar,
          authorStage: t.authorStage,
          title: t.title,
          slug: t.slug,
          content: t.content,
          isPinned: t.isPinned,
          isLocked: t.isLocked,
          views: t.views + 1,
          repliesCount: t.repliesCount,
          upvotes: t.upvotes,
          lastReplyAt: t.lastReplyAt ? new Date(t.lastReplyAt).toISOString() : new Date().toISOString(),
          createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
        },
        posts: postsRecords.map((p: any) => ({
          id: p.id,
          topicId: p.topicId,
          userId: p.userId,
          authorName: p.authorName,
          authorAvatar: p.authorAvatar,
          authorStage: p.authorStage,
          content: p.content,
          upvotes: p.upvotes,
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        })),
      }
    }
  } catch (err) {
    console.warn('[getForumTopicDetailFn] DB error, using seed fallback:', err)
  }

  // Seed Fallback
  const seedTopic = INITIAL_FORUM_TOPICS.find((t) => t.slug === slugOrId || t.id === slugOrId)
  if (!seedTopic) return null

  const cat = INITIAL_FORUM_CATEGORIES.find((c) => c.id === seedTopic.categoryId)
  return {
    topic: {
      ...seedTopic,
      userId: seedTopic.userId ?? null,
      categorySlug: cat?.slug || 'general-discussion',
      categoryName: cat?.name || 'General Discussion',
      categoryColor: cat?.color || '#00ffff',
    },
    posts: (seedTopic.posts || []).map((p) => ({
      ...p,
      userId: p.userId ?? null,
    })),
  }

}

export const getForumTopicDetailFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: GetForumTopicDetailInput) => {
    return z.object({ slugOrId: z.string().min(1) }).parse(data)
  })
  .handler(getForumTopicDetailHandler)

export interface CreateForumTopicInput {
  categoryId: string
  title: string
  content: string
  userId?: string
}

/**
 * Server Function: Create a new topic with guardrails validation.
 */
export const createForumTopicHandler = async ({ data, context }: ServerFnArgs<CreateForumTopicInput>): Promise<ForumTopicEntry> => {
  const userId = context?.user?.sub || context?.user?.id || data?.userId
  if (!userId) {
    throw new Error('Unauthenticated: You must be registered and logged in to create discussion topics.')
  }

  if (!data?.categoryId || !data?.title || !data?.content) {
    throw new Error('Invalid input: Category, title, and content are required.')
  }

  // Guardrail Validation
  const validation = validateForumContent(data.title, data.content)
  if (!validation.valid) {
    throw new Error(`Guardrail Trigger: ${validation.error}`)
  }

  await ensureUserProfile(userId)
  const dbClient = context?.db || getDb(context?.token ?? undefined)

  const [userProfile] = await dbClient
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  const authorName = userProfile?.larvaId || (context?.user as any)?.name || 'Ascendant Initiate'
  const authorAvatar = (context?.user as any)?.image || '/images/stage1_larva.png'
  const authorStage = userProfile?.stage ?? 1

  // Generate clean slug
  const baseSlug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`

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
      })
      .parse(data)
  })
  .handler(createForumTopicHandler)

export interface CreateForumPostInput {
  topicId: string
  content: string
  userId?: string
}

/**
 * Server Function: Create a reply to an existing forum topic.
 */
export const createForumPostHandler = async ({ data, context }: ServerFnArgs<CreateForumPostInput>): Promise<ForumPostEntry> => {
  const userId = context?.user?.sub || context?.user?.id || data?.userId
  if (!userId) {
    throw new Error('Unauthenticated: You must be registered and logged in to post replies.')
  }

  if (!data?.topicId || !data?.content) {
    throw new Error('Invalid input: Topic ID and content are required.')
  }

  // Guardrail Validation
  const validation = validateForumContent(undefined, data.content)
  if (!validation.valid) {
    throw new Error(`Guardrail Trigger: ${validation.error}`)
  }

  await ensureUserProfile(userId)
  const dbClient = context?.db || getDb(context?.token ?? undefined)

  const [userProfile] = await dbClient
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  const authorName = userProfile?.larvaId || (context?.user as any)?.name || 'Ascendant Initiate'
  const authorAvatar = (context?.user as any)?.image || '/images/stage1_larva.png'
  const authorStage = userProfile?.stage ?? 1

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
      })
      .parse(data)
  })
  .handler(createForumPostHandler)

export interface UpvoteForumTopicInput {
  topicId: string
}

/**
 * Server Function: Upvote a topic.
 */
export const upvoteForumTopicHandler = async ({ data, context }: ServerFnArgs<UpvoteForumTopicInput>): Promise<{ upvotes: number }> => {
  if (!data?.topicId) {
    throw new Error('Topic ID required.')
  }

  const dbClient = context?.db || getDb()
  const [topic] = await dbClient
    .select({ upvotes: forumTopics.upvotes })
    .from(forumTopics)
    .where(eq(forumTopics.id, data.topicId))
    .limit(1)

  const newCount = (topic?.upvotes ?? 0) + 1

  await dbClient
    .update(forumTopics)
    .set({ upvotes: newCount })
    .where(eq(forumTopics.id, data.topicId))

  return { upvotes: newCount }
}

export const upvoteForumTopicFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: UpvoteForumTopicInput) => {
    return z.object({ topicId: z.string().min(1) }).parse(data)
  })
  .handler(upvoteForumTopicHandler)

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
        audioUrl: r.audioUrl,
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

  const downloadUrl = '/downloads/the-2026-moltmaxxing-protocol-guide.html'

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
  let userId = context?.user?.sub || context?.user?.id

  if (!userId && data?.token) {
    const { verifyNeonJWT } = await import('../jwt')
    const verification = await verifyNeonJWT(data.token)
    if (verification.valid && verification.payload?.sub) {
      userId = verification.payload.sub
    }
  }

  if (!userId && data?.userId) {
    userId = data.userId
  }

  if (!userId) {
    throw new Error('Authentication required to update email preferences.')
  }

  const { ensureUserProfile } = await import('../user-sync')
  await ensureUserProfile(userId)

  const validated = updateEmailPreferencesSchema.parse(data || {})
  const dbClient = context?.db || getDb(context?.token ?? data?.token ?? undefined)

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

