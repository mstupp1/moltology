import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import { publicMiddleware } from './functions'
import {
  EQUIP_SLOT_IDS,
  VAULT_SIZE,
  type EquipSlotId,
  type MoveTarget,
} from '../chassis-loadout'

export type * from './db-services'

// ============================================================================
// SERVER FUNCTIONS (Thin RPC Proxies - Bundled for Client & Server)
// Handlers dynamically import './db-services' to keep the client bundle zero-bloat.
// ============================================================================

export const getPublicChangelogsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .handler(async (args) => {
    const { getPublicChangelogsHandler } = await import('./db-services')
    return getPublicChangelogsHandler(args)
  })

export const getChangelogBySlugFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: string) => z.string().min(1).parse(data))
  .handler(async (args) => {
    const { getChangelogBySlugHandler } = await import('./db-services')
    return getChangelogBySlugHandler(args)
  })

export const getUserProfileFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: { token?: string; userId?: string }) => data ?? {})
  .handler(async (args) => {
    const { getUserProfileHandler } = await import('./db-services')
    return getUserProfileHandler(args)
  })

const claimMemberHandleSchema = z.object({
  handle: z.string(),
  token: z.string().optional(),
  userId: z.string().optional(),
})

export const claimMemberHandleFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: z.input<typeof claimMemberHandleSchema>) => claimMemberHandleSchema.parse(data))
  .handler(async (args) => {
    const { claimMemberHandleHandler } = await import('./db-services')
    return claimMemberHandleHandler(args)
  })

export const getUserStatsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { userId: string; token?: string }) =>
    z.object({ userId: z.string().min(1), token: z.string().optional() }).parse(data)
  )
  .handler(async (args) => {
    const { getUserStatsHandler } = await import('./db-services')
    return getUserStatsHandler(args)
  })

export interface UserStatsInput {
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
  userId?: string
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
        userId: z.string().optional(),
      })
      .parse(data)
  })
  .handler(async (args) => {
    const { updateUserStatsHandler } = await import('./db-services')
    return updateUserStatsHandler(args)
  })

export const getS3AssetUrlFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { key: string; expiresIn?: number }) =>
    z.object({ key: z.string().min(1), expiresIn: z.number().optional() }).parse(data)
  )
  .handler(async (args) => {
    const { getS3AssetUrlHandler } = await import('./db-services')
    return getS3AssetUrlHandler(args)
  })

export const getAIThreadsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { userId: string; token?: string }) =>
    z.object({ userId: z.string().min(1), token: z.string().optional() }).parse(data)
  )
  .handler(async (args) => {
    const { getAIThreadsHandler } = await import('./db-services')
    return getAIThreadsHandler(args)
  })

export const getAIMessagesFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { threadId: string; userId?: string; token?: string }) =>
    z.object({ threadId: z.string().min(1), userId: z.string().optional(), token: z.string().optional() }).parse(data)
  )
  .handler(async (args) => {
    const { getAIMessagesHandler } = await import('./db-services')
    return (getAIMessagesHandler as any)(args)
  })

export const createAIThreadFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { userId: string; title: string; token?: string }) =>
    z.object({ userId: z.string().min(1), title: z.string().min(1), token: z.string().optional() }).parse(data)
  )
  .handler(async (args) => {
    const { createAIThreadHandler } = await import('./db-services')
    return (createAIThreadHandler as any)(args)
  })

export const pinAIThreadFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { threadId: string; pinned: boolean; token?: string }) =>
    z.object({ threadId: z.string().min(1), pinned: z.boolean(), token: z.string().optional() }).parse(data)
  )
  .handler(async (args) => {
    const { pinAIThreadFn: serverFn } = await import('./db-services')
    return (serverFn as any)(args)
  })

export const archiveAIThreadFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { threadId: string; archived: boolean; token?: string }) =>
    z.object({ threadId: z.string().min(1), archived: z.boolean(), token: z.string().optional() }).parse(data)
  )
  .handler(async (args) => {
    const { archiveAIThreadFn: serverFn } = await import('./db-services')
    return (serverFn as any)(args)
  })

export const renameAIThreadFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { threadId: string; title: string; token?: string }) =>
    z.object({ threadId: z.string().min(1), title: z.string().min(1).max(120), token: z.string().optional() }).parse(data)
  )
  .handler(async (args) => {
    const { renameAIThreadFn: serverFn } = await import('./db-services')
    return (serverFn as any)(args)
  })

export const deleteAIThreadFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { threadId: string; token?: string }) =>
    z.object({ threadId: z.string().min(1), token: z.string().optional() }).parse(data)
  )
  .handler(async (args) => {
    const { deleteAIThreadFn: serverFn } = await import('./db-services')
    return (serverFn as any)(args)
  })

const sendChatMessageSchema = z.object({
  threadId: z.string().optional(),
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  selectedModelId: z.string().optional(),
  userId: z.string().optional(),
  token: z.string().optional(),
})

export const sendChatMessageFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: z.input<typeof sendChatMessageSchema>) => sendChatMessageSchema.parse(data))
  .handler(async (args) => {
    const { sendChatMessageHandler } = await import('./db-services')
    return (sendChatMessageHandler as any)(args)
  })

export const getBlogPostsFn = createServerFn({ method: 'GET' })
  .middleware(publicMiddleware)
  .handler(async (args) => {
    const { getBlogPostsHandler } = await import('./db-services')
    return getBlogPostsHandler(args)
  })

export const getBlogPostBySlugFn = createServerFn({ method: 'GET' })
  .middleware(publicMiddleware)
  .validator((slug: string) => z.string().min(1).parse(slug))
  .handler(async (args) => {
    const { getBlogPostBySlugHandler } = await import('./db-services')
    return getBlogPostBySlugHandler(args)
  })

export const incrementBlogPostViewsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((slug: string) => slug)
  .handler(async (args) => {
    const { incrementBlogPostViewsHandler } = await import('./db-services')
    return incrementBlogPostViewsHandler(args)
  })

export const getBlogCommentsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((postId: string) => postId)
  .handler(async (args) => {
    const { getBlogCommentsHandler } = await import('./db-services')
    return getBlogCommentsHandler(args)
  })

export const createBlogCommentFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: {
    postId: string
    content: string
    userId?: string
    token?: string
    turnstileToken?: string
  }) =>
    z
      .object({
        postId: z.string().min(1),
        content: z.string().min(3).max(1000),
        userId: z.string().optional(),
        token: z.string().optional(),
        turnstileToken: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async (args) => {
    const { createBlogCommentHandler } = await import('./db-services')
    return createBlogCommentHandler(args)
  })

export const getForumCategoryBySlugFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async (args) => {
    const { getForumCategoryBySlugHandler } = await import('./db-services')
    return getForumCategoryBySlugHandler(args)
  })

export const getForumCategoriesFn = createServerFn({ method: 'GET' })
  .middleware(publicMiddleware)
  .handler(async (args) => {
    const { getForumCategoriesHandler } = await import('./db-services')
    return getForumCategoriesHandler(args)
  })

export const getForumTopicsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: {
    categorySlug?: string
    query?: string
    sortBy?: 'latest' | 'top' | 'active' | 'hot'
    userId?: string
    token?: string
  }) =>
    z
      .object({
        categorySlug: z.string().optional(),
        query: z.string().optional(),
        sortBy: z.enum(['latest', 'top', 'active', 'hot']).optional(),
        userId: z.string().optional(),
        token: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async (args) => {
    const { getForumTopicsHandler } = await import('./db-services')
    return getForumTopicsHandler(args)
  })

export const getForumTopicDetailFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: {
    slugOrId: string
    categorySlug?: string
    userId?: string
    token?: string
    trackView?: boolean
  }) =>
    z
      .object({
        slugOrId: z.string().min(1),
        categorySlug: z.string().optional(),
        userId: z.string().optional(),
        token: z.string().optional(),
        trackView: z.boolean().optional(),
      })
      .parse(data)
  )
  .handler(async (args) => {
    const { getForumTopicDetailHandler } = await import('./db-services')
    return getForumTopicDetailHandler(args)
  })

export const createForumTopicFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: {
    categoryId: string
    title: string
    content: string
    userId?: string
    token?: string
  }) =>
    z
      .object({
        categoryId: z.string().min(1),
        title: z.string().min(1),
        content: z.string().min(1),
        userId: z.string().optional(),
        token: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async (args) => {
    const { createForumTopicHandler } = await import('./db-services')
    return createForumTopicHandler(args)
  })

export const createForumPostFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: {
    topicId: string
    content: string
    userId?: string
    token?: string
  }) =>
    z
      .object({
        topicId: z.string().min(1),
        content: z.string().min(1),
        userId: z.string().optional(),
        token: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async (args) => {
    const { createForumPostHandler } = await import('./db-services')
    return createForumPostHandler(args)
  })

export const toggleForumTopicVoteFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: {
    topicId?: string
    postId?: string
    userId?: string
    token?: string
  }) =>
    z
      .object({
        topicId: z.string().optional(),
        postId: z.string().optional(),
        userId: z.string().optional(),
        token: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async (args) => {
    const { toggleForumTopicVoteHandler } = await import('./db-services')
    return toggleForumTopicVoteHandler(args)
  })

export const toggleForumPostVoteFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: {
    topicId?: string
    postId?: string
    userId?: string
    token?: string
  }) =>
    z
      .object({
        topicId: z.string().optional(),
        postId: z.string().optional(),
        userId: z.string().optional(),
        token: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async (args) => {
    const { toggleForumPostVoteHandler } = await import('./db-services')
    return toggleForumPostVoteHandler(args)
  })

export const getPodcastsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .handler(async (args) => {
    const { getPodcastsHandler } = await import('./db-services')
    return getPodcastsHandler(args)
  })

const submitLeadSchema = z.object({
  email: z.string().email('Valid email telemetry is required for decryption transmission.'),
  source: z.string().optional().default('moltmax_guide'),
  referrer: z.string().optional(),
  turnstileToken: z.string().optional(),
  emailOptIn: z.boolean().optional().default(false),
})

export const submitLeadFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: z.input<typeof submitLeadSchema>) => submitLeadSchema.parse(data))
  .handler(async (args) => {
    const { submitLeadHandler } = await import('./db-services')
    return submitLeadHandler(args)
  })

const updateEmailPreferencesSchema = z.object({
  emailOptIn: z.boolean(),
  source: z.string().optional(),
  token: z.string().optional(),
  userId: z.string().optional(),
})

export const updateEmailPreferencesFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: z.input<typeof updateEmailPreferencesSchema>) => updateEmailPreferencesSchema.parse(data))
  .handler(async (args) => {
    const { updateEmailPreferencesHandler } = await import('./db-services')
    return updateEmailPreferencesHandler(args)
  })

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

export const saveLobsterAvatarFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: z.input<typeof lobsterAvatarConfigSchema>) => lobsterAvatarConfigSchema.parse(data))
  .handler(async (args) => {
    const { saveLobsterAvatarHandler } = await import('./db-services')
    return saveLobsterAvatarHandler(args)
  })

const clearLobsterAvatarSchema = z.object({
  token: z.string().optional(),
  userId: z.string().optional(),
})

export const clearLobsterAvatarFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: z.input<typeof clearLobsterAvatarSchema>) => clearLobsterAvatarSchema.parse(data))
  .handler(async (args) => {
    const { clearLobsterAvatarHandler } = await import('./db-services')
    return clearLobsterAvatarHandler(args)
  })

const getDailyAlignmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  userId: z.string().optional(),
  token: z.string().optional(),
})

export const getDailyAlignmentFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: z.input<typeof getDailyAlignmentSchema>) => getDailyAlignmentSchema.parse(data || {}))
  .handler(async (args) => {
    const { getDailyAlignmentHandler } = await import('./db-services')
    return getDailyAlignmentHandler(args)
  })

const toggleDailyAlignmentSchema = z.object({
  taskKey: z.string().min(1),
  completed: z.boolean(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  userId: z.string().optional(),
  token: z.string().optional(),
})

export const toggleDailyAlignmentTaskFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: z.input<typeof toggleDailyAlignmentSchema>) => toggleDailyAlignmentSchema.parse(data))
  .handler(async (args) => {
    const { toggleDailyAlignmentTaskHandler } = await import('./db-services')
    return toggleDailyAlignmentTaskHandler(args)
  })

const getActivityEventsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  userId: z.string().optional(),
  token: z.string().optional(),
})

export const getActivityEventsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: z.input<typeof getActivityEventsSchema>) => getActivityEventsSchema.parse(data))
  .handler(async (args) => {
    const { getActivityEventsHandler } = await import('./db-services')
    return getActivityEventsHandler(args)
  })

export const getChassisLoadoutFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: { token?: string; userId?: string }) => data ?? {})
  .handler(async (args) => {
    const { getChassisLoadoutHandler } = await import('./db-services')
    return getChassisLoadoutHandler(args)
  })

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
  .handler(async (args) => {
    const { moveGearItemHandler } = await import('./db-services')
    return moveGearItemHandler(args)
  })

export const getPublicProfileFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { profileId: string; token?: string; userId?: string }) =>
    z.object({ profileId: z.string().min(1), token: z.string().optional(), userId: z.string().optional() }).parse(data)
  )
  .handler(async (args) => {
    const { getPublicProfileHandler } = await import('./db-services')
    return getPublicProfileHandler(args)
  })

export const getMemberLoadoutFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: { profileId: string; token?: string; userId?: string }) =>
    z.object({ profileId: z.string().min(1), token: z.string().optional(), userId: z.string().optional() }).parse(data)
  )
  .handler(async (args) => {
    const { getMemberLoadoutHandler } = await import('./db-services')
    return getMemberLoadoutHandler(args)
  })

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
  .handler(async (args) => {
    const { searchMembersHandler } = await import('./db-services')
    return searchMembersHandler(args)
  })

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
  .handler(async (args) => {
    const { sendFriendRequestHandler } = await import('./db-services')
    return sendFriendRequestHandler(args)
  })

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
  .handler(async (args) => {
    const { respondFriendRequestHandler } = await import('./db-services')
    return respondFriendRequestHandler(args)
  })

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
  .handler(async (args) => {
    const { cancelFriendRequestHandler } = await import('./db-services')
    return cancelFriendRequestHandler(args)
  })

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
  .handler(async (args) => {
    const { removeConnectionHandler } = await import('./db-services')
    return removeConnectionHandler(args)
  })

export const listConnectionsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data?: { token?: string; userId?: string }) => data ?? {})
  .handler(async (args) => {
    const { listConnectionsHandler } = await import('./db-services')
    return listConnectionsHandler(args)
  })

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
  .handler(async (args) => {
    const { getNotificationsHandler } = await import('./db-services')
    return getNotificationsHandler(args)
  })

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
  .handler(async (args) => {
    const { markNotificationReadHandler } = await import('./db-services')
    return markNotificationReadHandler(args)
  })
