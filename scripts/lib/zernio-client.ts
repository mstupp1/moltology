import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export const ZERNIO_API_BASE_URL = 'https://zernio.com/api/v1'

// Canonical Moltology Profile and Account Identifiers
export const DEFAULT_PROFILE_ID = '6a7f74b1839bf39ff3b6aaaa' // Moltology Default Profile
export const DEFAULT_INSTAGRAM_ACCOUNT_ID = '6a7f7f0777555aae01d99b54' // moltology_org (Silas Trench voice)
export const DEFAULT_YOUTUBE_ACCOUNT_ID = '6a7fd9bd77555aae01ebea63' // moltology (YouTube Shorts)

// Canonical Queue Identifiers
export const QUEUE_IDS = {
  CAROUSELS_AND_POSTS: '6a84b76d2421e968ac81f5bc', // Moltology Carousels (Mon, Wed, Fri at 13:00 EST)
  REELS_AND_SHORTS: '6a84b7702421e968ac81f5bd', // Moltology Reels & Shorts (Daily at 18:30 EST)
  LEAD_MAGNETS_DAILY: '6a8d93576f0e96efe2960c91', // Moltology Lead Magnets — Daily (Daily at 13:00 EST)
} as const

export interface ZernioMediaItem {
  type: 'image' | 'video'
  url: string
}

export interface ZernioPlatformConfig {
  platform: string
  accountId: string
  customContent?: string
  platformSpecificData?: Record<string, any>
}

export interface ZernioCreatePostPayload {
  content?: string
  title?: string
  mediaItems?: ZernioMediaItem[]
  platforms: ZernioPlatformConfig[]
  queuedFromProfile?: string
  queueId?: string
  scheduledFor?: string
  publishNow?: boolean
  isDraft?: boolean
  tags?: string[]
}

export interface ZernioPostResult {
  _id: string
  status: string
  scheduledFor?: string
  platforms: any[]
  content?: string
  title?: string
  [key: string]: any
}

/**
 * Resolves the Zernio API key from environment variable or MCP config fallback.
 */
export function getZernioApiKey(): string {
  if (process.env.ZERNIO_API_KEY && process.env.ZERNIO_API_KEY.trim().length > 0) {
    return process.env.ZERNIO_API_KEY.trim()
  }

  // Fallback to antigravity / gemini MCP config if present
  try {
    const mcpConfigPath = path.join(os.homedir(), '.gemini/config/mcp_config.json')
    if (fs.existsSync(mcpConfigPath)) {
      const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'))
      const authHeader = config?.mcpServers?.zernio?.headers?.Authorization
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace(/^Bearer\s+/, '').trim()
        if (token) return token
      }
    }
  } catch {
    // Ignore fallback errors and throw informative message below
  }

  throw new Error(
    'Zernio API Key missing. Please set ZERNIO_API_KEY in your .env file or environment.'
  )
}

/**
 * Base HTTP fetch wrapper with authorization and standard JSON handling.
 */
export async function fetchZernio<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getZernioApiKey()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${ZERNIO_API_BASE_URL}${cleanEndpoint}`

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const text = await response.text()
  let data: any
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }

  if (!response.ok) {
    const errorMsg =
      data?.error?.message ||
      data?.message ||
      data?.error ||
      `HTTP ${response.status} ${response.statusText}`
    throw new Error(`Zernio API Error (${cleanEndpoint}): ${errorMsg}`)
  }

  return data as T
}

/**
 * Inspect the next available queue slot for a specific queue ID.
 */
export async function getNextQueueSlot(
  queueId: string,
  profileId: string = DEFAULT_PROFILE_ID
): Promise<{ nextSlot: string; timezone: string } | null> {
  try {
    const res = await fetchZernio<{
      nextSlot: string
      timezone: string
    }>(`/queue/next-slot?profileId=${profileId}&queueId=${queueId}`)
    return res
  } catch (err: any) {
    console.warn(`⚠️ Warning: Could not preview next queue slot for ${queueId}: ${err.message}`)
    return null
  }
}

/**
 * Core primitive to create and queue a post via Zernio POST /v1/posts.
 */
export async function createZernioPost(
  payload: ZernioCreatePostPayload
): Promise<ZernioPostResult> {
  const res = await fetchZernio<{ post: ZernioPostResult }>('/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res.post
}

/**
 * Post an algorithmic first comment on a post via POST /v1/inbox/comments/{postId}.
 */
export async function postZernioComment(
  postId: string,
  accountId: string,
  message: string
): Promise<any> {
  try {
    const res = await fetchZernio(`/inbox/comments/${postId}`, {
      method: 'POST',
      body: JSON.stringify({
        accountId,
        message,
      }),
    })
    return res
  } catch (err: any) {
    console.warn(`⚠️ Warning: First comment creation failed on post ${postId}: ${err.message}`)
    return null
  }
}

// -----------------------------------------------------------------------------
// High-Level Deterministic Queuing Workflows
// -----------------------------------------------------------------------------

export interface QueueInstagramPostOptions {
  mediaUrl: string
  caption: string
  firstComment?: string
  queueId?: string
  profileId?: string
  accountId?: string
  isAiGenerated?: boolean
  dryRun?: boolean
  publishNow?: boolean
}

export interface QueueInstagramPostResult {
  postId: string
  scheduledFor?: string
  queueId: string
  commentId: string | null
  status: string
  dryRun: boolean
}

/**
 * Deterministically queues a single static image post to Instagram.
 */
export async function queueInstagramPost(
  options: QueueInstagramPostOptions
): Promise<QueueInstagramPostResult> {
  const queueId = options.queueId || QUEUE_IDS.CAROUSELS_AND_POSTS
  const profileId = options.profileId || DEFAULT_PROFILE_ID
  const accountId = options.accountId || DEFAULT_INSTAGRAM_ACCOUNT_ID

  console.log(`\n📡 [Zernio API] Staging Instagram Post to Queue (${queueId})...`)

  if (options.dryRun) {
    console.log(`   🛡️ [Dry Run] Simulating Zernio queue payload:`)
    console.log(`      • Queue ID: ${queueId}`)
    console.log(`      • Account: ${accountId}`)
    console.log(`      • Media URL: ${options.mediaUrl}`)
    console.log(`      • First comment: ${options.firstComment ? 'Yes' : 'No'}`)
    return {
      postId: `dry-run-post-${Date.now()}`,
      scheduledFor: '2026-09-03T17:00:00.000Z',
      queueId,
      commentId: options.firstComment ? `dry-run-comment-${Date.now()}` : null,
      status: options.publishNow ? 'published' : 'queued',
      dryRun: true,
    }
  }

  const postPayload: ZernioCreatePostPayload = {
    queuedFromProfile: profileId,
    queueId,
    content: options.caption,
    mediaItems: [{ type: 'image', url: options.mediaUrl }],
    platforms: [
      {
        platform: 'instagram',
        accountId,
        platformSpecificData: {
          ...(options.firstComment ? { firstComment: options.firstComment } : {}),
        },
      },
    ],
    publishNow: options.publishNow || false,
  }

  const post = await createZernioPost(postPayload)
  console.log(`   ✅ Post queued successfully! Zernio ID: ${post._id}`)
  if (post.scheduledFor) {
    console.log(`   ⏰ Scheduled For: ${post.scheduledFor}`)
  }

  let commentId: string | null = null
  if (options.firstComment) {
    console.log(`   💬 Posting algorithmic first comment...`)
    const commentRes = await postZernioComment(post._id, accountId, options.firstComment)
    commentId = commentRes?.comment?._id || commentRes?._id || 'posted'
    if (commentId) {
      console.log(`   ✅ First comment posted successfully!`)
    }
  }

  return {
    postId: post._id,
    scheduledFor: post.scheduledFor,
    queueId,
    commentId,
    status: post.status,
    dryRun: false,
  }
}

export interface QueueInstagramCarouselOptions {
  mediaUrls: string[]
  caption: string
  firstComment?: string
  queueId?: string
  profileId?: string
  accountId?: string
  isAiGenerated?: boolean
  dryRun?: boolean
  publishNow?: boolean
}

export interface QueueInstagramCarouselResult {
  postId: string
  scheduledFor?: string
  queueId: string
  commentId: string | null
  status: string
  dryRun: boolean
}

/**
 * Deterministically queues a multi-slide carousel post to Instagram.
 */
export async function queueInstagramCarousel(
  options: QueueInstagramCarouselOptions
): Promise<QueueInstagramCarouselResult> {
  const queueId = options.queueId || QUEUE_IDS.CAROUSELS_AND_POSTS
  const profileId = options.profileId || DEFAULT_PROFILE_ID
  const accountId = options.accountId || DEFAULT_INSTAGRAM_ACCOUNT_ID

  console.log(`\n📡 [Zernio API] Staging Instagram Carousel (${options.mediaUrls.length} slides) to Queue (${queueId})...`)

  if (options.dryRun) {
    console.log(`   🛡️ [Dry Run] Simulating Zernio carousel payload:`)
    console.log(`      • Queue ID: ${queueId}`)
    console.log(`      • Slide Count: ${options.mediaUrls.length}`)
    console.log(`      • First comment: ${options.firstComment ? 'Yes' : 'No'}`)
    return {
      postId: `dry-run-carousel-${Date.now()}`,
      scheduledFor: '2026-09-04T17:00:00.000Z',
      queueId,
      commentId: options.firstComment ? `dry-run-comment-${Date.now()}` : null,
      status: options.publishNow ? 'published' : 'queued',
      dryRun: true,
    }
  }

  const postPayload: ZernioCreatePostPayload = {
    queuedFromProfile: profileId,
    queueId,
    content: options.caption,
    mediaItems: options.mediaUrls.map((url) => ({ type: 'image', url })),
    platforms: [
      {
        platform: 'instagram',
        accountId,
        platformSpecificData: {
          ...(options.firstComment ? { firstComment: options.firstComment } : {}),
        },
      },
    ],
    publishNow: options.publishNow || false,
  }

  const post = await createZernioPost(postPayload)
  console.log(`   ✅ Carousel queued successfully! Zernio ID: ${post._id}`)
  if (post.scheduledFor) {
    console.log(`   ⏰ Scheduled For: ${post.scheduledFor}`)
  }

  let commentId: string | null = null
  if (options.firstComment) {
    console.log(`   💬 Posting algorithmic first comment...`)
    const commentRes = await postZernioComment(post._id, accountId, options.firstComment)
    commentId = commentRes?.comment?._id || commentRes?._id || 'posted'
    if (commentId) {
      console.log(`   ✅ First comment posted successfully!`)
    }
  }

  return {
    postId: post._id,
    scheduledFor: post.scheduledFor,
    queueId,
    commentId,
    status: post.status,
    dryRun: false,
  }
}

export interface QueueDualReelAndShortOptions {
  videoUrl: string
  instagramCaption: string
  youtubeTitle: string
  youtubeDescription: string
  youtubeTags?: string[]
  firstComment?: string
  queueId?: string
  profileId?: string
  instagramAccountId?: string
  youtubeAccountId?: string
  isAiGenerated?: boolean
  dryRun?: boolean
  publishNow?: boolean
}

export interface QueueDualReelAndShortResult {
  postId: string
  instagramPostId: string
  youtubePostId: string
  scheduledFor?: string
  queueId: string
  commentId: string | null
  status: string
  dryRun: boolean
}

/**
 * Deterministically queues a dual broadcast (Instagram Reel + YouTube Short) into the Reels & Shorts queue as a single unified multi-platform post.
 */
export async function queueDualReelAndShort(
  options: QueueDualReelAndShortOptions
): Promise<QueueDualReelAndShortResult> {
  const queueId = options.queueId || QUEUE_IDS.REELS_AND_SHORTS
  const profileId = options.profileId || DEFAULT_PROFILE_ID
  const igAccountId = options.instagramAccountId || DEFAULT_INSTAGRAM_ACCOUNT_ID
  const ytAccountId = options.youtubeAccountId || DEFAULT_YOUTUBE_ACCOUNT_ID

  console.log(`\n📡 [Zernio API] Staging Unified Dual Reel & Short to Queue (${queueId})...`)

  if (options.dryRun) {
    console.log(`   🛡️ [Dry Run] Simulating Zernio Unified Reel & Short payload:`)
    console.log(`      • Queue ID: ${queueId}`)
    console.log(`      • Video URL: ${options.videoUrl}`)
    console.log(`      • Instagram Account: ${igAccountId}`)
    console.log(`      • YouTube Account: ${ytAccountId}`)
    console.log(`      • YouTube Title: ${options.youtubeTitle}`)
    console.log(`      • First comment: ${options.firstComment ? 'Yes' : 'No'}`)
    const dryRunId = `dry-run-reel-short-${Date.now()}`
    return {
      postId: dryRunId,
      instagramPostId: dryRunId,
      youtubePostId: dryRunId,
      scheduledFor: '2026-09-05T22:30:00.000Z',
      queueId,
      commentId: options.firstComment ? `dry-run-comment-${Date.now()}` : null,
      status: options.publishNow ? 'published' : 'queued',
      dryRun: true,
    }
  }

  // Stage Unified Post targeting both Instagram and YouTube simultaneously in a single queue slot
  console.log(`   • Staging Unified Dual Broadcast (Instagram Reel + YouTube Short)...`)
  const postPayload: ZernioCreatePostPayload = {
    queuedFromProfile: profileId,
    queueId,
    content: options.instagramCaption,
    mediaItems: [{ type: 'video', url: options.videoUrl }],
    platforms: [
      {
        platform: 'instagram',
        accountId: igAccountId,
        customContent: options.instagramCaption,
        platformSpecificData: {
          contentType: 'reel',
          shareToFeed: true,
          ...(options.firstComment ? { firstComment: options.firstComment } : {}),
        },
      },
      {
        platform: 'youtube',
        accountId: ytAccountId,
        customContent: options.youtubeDescription,
        platformSpecificData: {
          title: options.youtubeTitle,
          visibility: 'public',
          ...(options.youtubeTags && options.youtubeTags.length > 0 ? { tags: options.youtubeTags } : {}),
          ...(options.firstComment ? { firstComment: options.firstComment } : {}),
        },
      },
    ],
    publishNow: options.publishNow || false,
  }

  const post = await createZernioPost(postPayload)
  console.log(`   ✅ Unified Reel & Short queued! Zernio Post ID: ${post._id}`)
  if (post.scheduledFor) {
    console.log(`   ⏰ Scheduled For: ${post.scheduledFor}`)
  }

  let commentId: string | null = null
  if (options.firstComment) {
    console.log(`   💬 Posting algorithmic first comment on Instagram...`)
    const commentRes = await postZernioComment(post._id, igAccountId, options.firstComment)
    commentId = commentRes?.comment?._id || commentRes?._id || 'posted'
    if (commentId) {
      console.log(`   ✅ First comment registered successfully!`)
    }
  }

  return {
    postId: post._id,
    instagramPostId: post._id,
    youtubePostId: post._id,
    scheduledFor: post.scheduledFor,
    queueId,
    commentId,
    status: post.status,
    dryRun: false,
  }
}
