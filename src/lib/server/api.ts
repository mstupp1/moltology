import { z } from 'zod'
import type { JWTPayload } from 'jose'
import { createServerFn } from '@tanstack/react-start'
import { publicMiddleware, authenticatedMiddleware } from './functions'
import { changelogs, profiles, users, userStats, galleryPins, blogPosts, blogComments } from '../../db/schema'
import { getDb } from '../../db'
import { eq, desc } from 'drizzle-orm'
import { INITIAL_CHANGELOGS } from '../changelogs-data'
import type { ChangelogEntry } from '../changelogs-data'
import { INITIAL_GALLERY_PINS, S3_BASE_URL } from '../gallery-data'
import type { GalleryPin } from '../gallery-data'
import { INITIAL_BLOG_POSTS } from '../blog-data'
import type { BlogPostData } from '../blog-data'
import { getPresignedViewUrl } from '../s3-client'

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
 * Server Function: Get public changelogs from database or initial seed data.
 */
export const getPublicChangelogsHandler = async ({ context }: ServerFnArgs) => {
  const dbClient = context?.db || getDb()
  try {
    const records = await dbClient
      .select()
      .from(changelogs)
      .where(eq(changelogs.isPublished, true))
      .orderBy(desc(changelogs.releasedAt))

    if (records && records.length > 0) {
      return records.map(toChangelogEntry)
    }
  } catch (error) {
    console.warn('[ServerFn getPublicChangelogsFn] DB query failed, using static fallback:', error)
  }

  return INITIAL_CHANGELOGS
}

export const getPublicChangelogsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .handler(getPublicChangelogsHandler)

interface PublicChangelogsQueryInput {
  category?: string
  limit?: number
}

/**
 * Server Function: Public REST API Endpoint handler for system changelogs with security headers & filtering.
 */
export const getPublicChangelogsRestApiHandler = async ({ data, context }: ServerFnArgs<PublicChangelogsQueryInput>) => {
  const dbClient = context?.db || getDb()
  let results: ChangelogEntry[] = []
  try {
    const records = await dbClient
      .select()
      .from(changelogs)
      .where(eq(changelogs.isPublished, true))
      .orderBy(desc(changelogs.releasedAt))

    if (records && records.length > 0) {
      results = records.map(toChangelogEntry)
    } else {
      results = INITIAL_CHANGELOGS.filter((c) => c.isPublished !== false)
    }
  } catch (error) {
    console.warn('[getPublicChangelogsRestApiHandler] DB query warning:', error)
    results = INITIAL_CHANGELOGS.filter((c) => c.isPublished !== false)
  }

  if (data?.category && data.category !== 'ALL') {
    const catUpper = data.category.toUpperCase()
    results = results.filter((c) => c.category?.toUpperCase() === catUpper)
  }

  if (data?.limit && data.limit > 0) {
    results = results.slice(0, data.limit)
  }

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
    data: results,
  }
}

export const getPublicChangelogsRestApiFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: PublicChangelogsQueryInput) => {
    return z.object({ category: z.string().optional(), limit: z.number().optional() }).optional().parse(data || {})
  })
  .handler(getPublicChangelogsRestApiHandler)

interface CreateChangelogInput {
  version: string
  title: string
  category: string
  summary: string
  content: string
  isPublished?: boolean
  userId?: string
}

import { ensureUserProfile } from '../user-sync'

/**
 * Server Function: Create system changelog entry (Admin / Super Admin only).
 */
export const createChangelogHandler = async ({ data, context }: ServerFnArgs<CreateChangelogInput>) => {
  const userId = context?.user?.sub || context?.user?.id || data?.userId
  if (!userId) {
    throw new Error('Unauthenticated: Authentication required to create system changelogs.')
  }

  await ensureUserProfile(userId)

  const dbClient = context?.db || getDb(context?.token ?? undefined)
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

  const [inserted] = await dbClient
    .insert(changelogs)
    .values({
      version: data.version,
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
      version: z.string().min(1),
      title: z.string().min(1),
      category: z.string().min(1),
      summary: z.string().min(1),
      content: z.string().min(1),
      isPublished: z.boolean().optional(),
      userId: z.string().optional(),
    }).parse(data)
  })
  .handler(createChangelogHandler)



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
}

/**
 * Server Function: Update authenticated user stats with input validation.
 */
const updateUserStatsHandler = async ({ data, context }: ServerFnArgs<UserStatsInput>) => {
  const userId = context?.user?.sub || context?.user?.id
  if (!userId) {
    throw new Error('User identifier missing from context')
  }

  const dbClient = context?.db || getDb(context?.token ?? undefined)
  const [updated] = await dbClient
    .update(userStats)
    .set({
      ...data,
      updatedAt: new Date(),
    })
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
}

/**
 * Server Function: Send a message to AI gateway (DeepSeek V4 / GPT-4o-mini fallback) with guardrails & DB persistence.
 */
export const sendChatMessageHandler = async ({ data, context }: ServerFnArgs<SendChatMessageInput>) => {
  const { messages, userId: inputUserId, threadId: inputThreadId } = data || {}
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

  // Model cascade: try DeepSeek V4 first; if free tier credit limit occurs on Gateway, fall back to gpt-4o-mini
  const candidateModels = ['deepseek/deepseek-v4-flash-0731', 'openai/gpt-4o-mini']
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
      console.warn(`[Vercel AI Gateway] Model candidate '${modelCandidate}' failed:`, err.message)
      lastError = err
    }
  }

  if (!assistantText) {
    try {
      const { openai } = await import('@ai-sdk/openai')
      const result = await generateText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        messages: payloadMessages,
      })
      if (result.text) {
        assistantText = result.text
      }
    } catch (err: any) {
      console.warn('[AI SDK Direct OpenAI] Fallback failed:', err.message)
    }
  }

  if (!assistantText) {
    assistantText = `[SYNAPTIC ORACLE SYSTEM ERROR] The Benthic neural gateway encountered network turbulence (${lastError?.message || 'Gateway Unavailable'}). Pull Vercel environment variables locally using "vc env pull .env.local" or configure VERCEL_OIDC_TOKEN.`
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





