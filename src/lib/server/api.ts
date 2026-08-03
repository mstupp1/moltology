import { z } from 'zod'
import type { JWTPayload } from 'jose'
import { createServerFn } from '@tanstack/react-start'
import { publicMiddleware, authenticatedMiddleware } from './functions'
import { changelogs, profiles, users, userStats, galleryPins } from '../../db/schema'
import { getDb } from '../../db'
import { eq, desc } from 'drizzle-orm'
import { INITIAL_CHANGELOGS } from '../changelogs-data'
import type { ChangelogEntry } from '../changelogs-data'
import { INITIAL_GALLERY_PINS, S3_BASE_URL } from '../gallery-data'
import type { GalleryPin } from '../gallery-data'
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

/**
 * Server Function: Get authenticated user profile.
 */
const getUserProfileHandler = async ({ context }: ServerFnArgs) => {
  const userId = context?.user?.sub || context?.user?.id
  if (!userId) {
    return null
  }

  const { ensureUserProfile } = await import('../user-sync')
  await ensureUserProfile(userId)

  const dbClient = context?.db || getDb(context?.token ?? undefined)
  const [userRecord] = await dbClient
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return userRecord || null
}

export const getUserProfileFn = createServerFn({ method: 'POST' })
  .middleware(authenticatedMiddleware)
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




