import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash } from 'node:crypto'
import { hashFile } from './social-archive'
import { getMimeType } from '../../src/lib/ingest/s3-upload'
import { getAbsoluteAssetUrl } from '../../src/lib/assets'

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
 * Delete a post by ID in Zernio.
 */
export async function deleteZernioPost(postId: string): Promise<any> {
  return await fetchZernio(`/posts/${postId}`, {
    method: 'DELETE',
  })
}

/**
 * Core primitive to create and queue a post via Zernio POST /v1/posts.
 */
export async function createZernioPost(
  payload: ZernioCreatePostPayload,
  localMediaPaths: Record<string, string> = {}
): Promise<ZernioPostResult> {
  // Re-uploads get fresh URLs. Keep retries tied to the original logical payload.
  const logicalMedia = await Promise.all((payload.mediaItems || []).map(async item => ({
    ...item, url: localMediaPaths[item.url] ? `sha256:${await hashFile(localMediaPaths[item.url])}` : item.url,
  })))
  const idempotencyKey = createHash('sha256').update(JSON.stringify({ ...payload, mediaItems: logicalMedia })).digest('hex')
  // Stage all media before creating a post. Never fall back to an origin URL on failure.
  const hostedUrls = new Map<string, string>()
  const mediaItems: ZernioMediaItem[] = []
  for (const item of payload.mediaItems || []) {
    let url = hostedUrls.get(item.url)
    if (!url) {
      url = await uploadZernioMedia(item, localMediaPaths[item.url])
      hostedUrls.set(item.url, url)
    }
    mediaItems.push({ ...item, url })
  }
  const res = await fetchZernio<{ post: ZernioPostResult }>('/posts', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ ...payload, ...(payload.mediaItems ? { mediaItems } : {}) }),
  })
  return { ...res.post, mediaItems }
}

/** Upload local production media to Zernio; URL-only inputs are copied once. */
export async function uploadZernioMedia(item: ZernioMediaItem, localFilePath?: string): Promise<string> {
  const sourceUrl = new URL(item.url)
  if (sourceUrl.protocol !== 'https:') throw new Error('Publishing media must use HTTPS.')
  if (sourceUrl.hostname === 'media.zernio.com' && !localFilePath) return item.url

  let filename: string
  let contentType: string
  let bytes: Uint8Array<ArrayBuffer>
  if (localFilePath) {
    filename = path.basename(localFilePath)
    contentType = getMimeType(filename)
    bytes = new Uint8Array(await fs.promises.readFile(localFilePath))
  } else {
    // Existing Neon URLs go through the site's CDN; normal production uses local files.
    const response = await fetch(getAbsoluteAssetUrl(item.url))
    if (!response.ok) throw new Error(`Could not read publishing media (HTTP ${response.status}).`)
    filename = path.basename(sourceUrl.pathname)
    contentType = response.headers.get('content-type')?.split(';')[0].trim() || getMimeType(filename)
    bytes = new Uint8Array(await response.arrayBuffer())
  }
  if (!contentType.startsWith(`${item.type}/`)) {
    throw new Error(`Expected ${item.type} media, received ${contentType}.`)
  }
  if (!bytes.byteLength || bytes.byteLength > 5 * 1024 ** 3) {
    throw new Error('Publishing media must be nonempty and no larger than 5 GB.')
  }
  const presigned = await fetchZernio<{ uploadUrl: string; publicUrl: string }>('/media/presign', {
    method: 'POST',
    body: JSON.stringify({ filename, contentType, size: bytes.byteLength }),
  })
  if (new URL(presigned.uploadUrl).protocol !== 'https:' ||
      new URL(presigned.publicUrl).protocol !== 'https:' ||
      new URL(presigned.publicUrl).hostname !== 'media.zernio.com') {
    throw new Error('Zernio returned an invalid media upload destination.')
  }
  // Signed storage PUTs must not receive the Zernio API Authorization header.
  const upload = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: bytes,
  })
  if (!upload.ok) throw new Error(`Zernio media upload failed (HTTP ${upload.status}).`)
  return presigned.publicUrl
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

/** Uploaded files expire unless publication happens within seven days. */
export async function assertUploadWindow(queueId: string, profileId: string, publishNow: boolean): Promise<void> {
  if (publishNow) return
  const slot = await getNextQueueSlot(queueId, profileId)
  const scheduled = slot ? Date.parse(slot.nextSlot) : NaN
  if (!Number.isFinite(scheduled)) throw new Error('Could not verify the next Zernio queue slot. Final media remains in Drive.')
  if (scheduled - Date.now() > 7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000) {
    throw new Error(`Zernio uploads expire after seven days. The next slot (${slot!.nextSlot}) is too far away; queue this archived media closer to publication.`)
  }
}

// -----------------------------------------------------------------------------
// High-Level Deterministic Queuing Workflows
// -----------------------------------------------------------------------------

export interface QueueInstagramPostOptions {
  mediaUrl?: string
  mediaPath?: string
  caption: string
  firstComment?: string
  queueId?: string
  profileId?: string
  accountId?: string
  isAiGenerated?: boolean
  dryRun?: boolean
  publishNow?: boolean
  /** Check the next slot against Zernio's seven-day temporary upload lifetime. */
  validateMediaWindow?: boolean
}

export interface QueueInstagramPostResult {
  postId: string
  scheduledFor?: string
  queueId: string
  commentId: string | null
  status: string
  dryRun: boolean
  mediaUrls?: string[]
}

/**
 * Deterministically queues a single static image post to Instagram.
 */
export async function queueInstagramPost(
  options: QueueInstagramPostOptions
): Promise<QueueInstagramPostResult> {
  const mediaUrl = options.mediaUrl || 'https://local.social.invalid/post'
  if (!options.mediaUrl && !options.mediaPath) throw new Error('Post requires a media file or URL.')
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

  if (options.validateMediaWindow) await assertUploadWindow(queueId, profileId, !!options.publishNow)

  const postPayload: ZernioCreatePostPayload = {
    ...(options.publishNow ? {} : { queuedFromProfile: profileId, queueId }),
    content: options.caption,
    mediaItems: [{ type: 'image', url: mediaUrl }],
    platforms: [
      {
        platform: 'instagram',
        accountId,
        platformSpecificData: {
          isAiGenerated: options.isAiGenerated ?? true,
          ...(options.firstComment ? { firstComment: options.firstComment } : {}),
        },
      },
    ],
    publishNow: options.publishNow || false,
  }

  const post = await createZernioPost(postPayload, options.mediaPath ? { [mediaUrl]: options.mediaPath } : {})
  console.log(`   ✅ Post queued successfully! Zernio ID: ${post._id}`)
  if (post.scheduledFor) {
    console.log(`   ⏰ Scheduled For: ${post.scheduledFor}`)
  }

  // firstComment is delivered by Zernio after publication. Do not post it twice.
  const commentId: string | null = null

  return {
    postId: post._id,
    scheduledFor: post.scheduledFor,
    queueId,
    commentId,
    status: post.status,
    dryRun: false,
    mediaUrls: post.mediaItems.map((item: ZernioMediaItem) => item.url),
  }
}

export interface QueueInstagramCarouselOptions {
  mediaUrls?: string[]
  mediaPaths?: string[]
  caption: string
  firstComment?: string
  queueId?: string
  profileId?: string
  accountId?: string
  isAiGenerated?: boolean
  /** Use provider delivery after publication instead of an immediate inbox comment. */
  nativeFirstCommentOnly?: boolean
  dryRun?: boolean
  publishNow?: boolean
  /** Check the next slot against Zernio's seven-day temporary upload lifetime. */
  validateMediaWindow?: boolean
}

export interface QueueInstagramCarouselResult {
  postId: string
  scheduledFor?: string
  queueId: string
  commentId: string | null
  status: string
  dryRun: boolean
  mediaUrls?: string[]
}

/**
 * Deterministically queues a multi-slide carousel post to Instagram.
 */
export async function queueInstagramCarousel(
  options: QueueInstagramCarouselOptions
): Promise<QueueInstagramCarouselResult> {
  const mediaUrls = options.mediaUrls || options.mediaPaths?.map((_, i) => `https://local.social.invalid/slide-${i + 1}`) || []
  if (!mediaUrls.length) throw new Error('Carousel requires media files or URLs.')
  if (options.mediaPaths && options.mediaPaths.length !== mediaUrls.length) throw new Error('Carousel file count must match its media URL count.')
  const queueId = options.queueId || QUEUE_IDS.CAROUSELS_AND_POSTS
  const profileId = options.profileId || DEFAULT_PROFILE_ID
  const accountId = options.accountId || DEFAULT_INSTAGRAM_ACCOUNT_ID

  console.log(`\n📡 [Zernio API] Staging Instagram Carousel (${mediaUrls.length} slides) to Queue (${queueId})...`)

  if (options.dryRun) {
    console.log(`   🛡️ [Dry Run] Simulating Zernio carousel payload:`)
    console.log(`      • Queue ID: ${queueId}`)
    console.log(`      • Slide Count: ${mediaUrls.length}`)
    console.log(`      • First comment: ${options.firstComment ? 'Yes' : 'No'}`)
    return {
      postId: `dry-run-carousel-${Date.now()}`,
      scheduledFor: '2026-09-04T17:00:00.000Z',
      queueId,
      commentId: options.firstComment && !options.nativeFirstCommentOnly ? `dry-run-comment-${Date.now()}` : null,
      status: options.publishNow ? 'published' : 'queued',
      dryRun: true,
    }
  }

  if (options.validateMediaWindow) await assertUploadWindow(queueId, profileId, !!options.publishNow)

  const postPayload: ZernioCreatePostPayload = {
    queuedFromProfile: profileId,
    queueId,
    content: options.caption,
    mediaItems: mediaUrls.map((url) => ({ type: 'image', url })),
    platforms: [
      {
        platform: 'instagram',
        accountId,
        platformSpecificData: {
          ...(options.firstComment ? { firstComment: options.firstComment } : {}),
          ...(options.isAiGenerated !== undefined ? { isAiGenerated: options.isAiGenerated } : {}),
        },
      },
    ],
    publishNow: options.publishNow || false,
  }

  if (options.mediaPaths && options.mediaPaths.length !== mediaUrls.length) {
    throw new Error('Carousel file count must match its media URL count.')
  }
  const localMediaPaths = Object.fromEntries(mediaUrls.flatMap((url, i) =>
    options.mediaPaths ? [[url, options.mediaPaths[i]]] : []))
  const post = await createZernioPost(postPayload, localMediaPaths)
  console.log(`   ✅ Carousel queued successfully! Zernio ID: ${post._id}`)
  if (post.scheduledFor) {
    console.log(`   ⏰ Scheduled For: ${post.scheduledFor}`)
  }

  let commentId: string | null = null
  if (options.firstComment && !options.nativeFirstCommentOnly) {
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
    mediaUrls: post.mediaItems.map((item: ZernioMediaItem) => item.url),
  }
}

export interface QueueDualReelAndShortOptions {
  videoUrl?: string
  videoPath?: string
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
  platform?: 'all' | 'instagram' | 'youtube'
  /** Check the next slot against Zernio's seven-day temporary upload lifetime. */
  validateMediaWindow?: boolean
}

export interface QueueDualReelAndShortResult {
  postId: string
  instagramPostId?: string
  youtubePostId?: string
  scheduledFor?: string
  queueId: string
  commentId: string | null
  status: string
  dryRun: boolean
  mediaUrls?: string[]
}

/**
 * Deterministically queues a broadcast (Instagram Reel, YouTube Short, or both) into the Reels & Shorts queue as a unified post.
 */
export async function queueDualReelAndShort(
  options: QueueDualReelAndShortOptions
): Promise<QueueDualReelAndShortResult> {
  const videoUrl = options.videoUrl || 'https://local.social.invalid/video'
  if (!options.videoUrl && !options.videoPath) throw new Error('Reel requires a media file or URL.')
  const queueId = options.queueId || QUEUE_IDS.REELS_AND_SHORTS
  const profileId = options.profileId || DEFAULT_PROFILE_ID
  const igAccountId = options.instagramAccountId || DEFAULT_INSTAGRAM_ACCOUNT_ID
  const ytAccountId = options.youtubeAccountId || DEFAULT_YOUTUBE_ACCOUNT_ID
  const platformTarget = options.platform || 'all'

  console.log(`\n📡 [Zernio API] Staging Unified Reel/Short (${platformTarget}) to Queue (${queueId})...`)

  if (options.dryRun) {
    console.log(`   🛡️ [Dry Run] Simulating Zernio Unified Reel & Short payload:`)
    console.log(`      • Queue ID: ${queueId}`)
    console.log(`      • Platform Target: ${platformTarget}`)
    console.log(`      • Video URL: ${options.videoUrl}`)
    if (platformTarget === 'all' || platformTarget === 'instagram') {
      console.log(`      • Instagram Account: ${igAccountId}`)
    }
    if (platformTarget === 'all' || platformTarget === 'youtube') {
      console.log(`      • YouTube Account: ${ytAccountId}`)
      console.log(`      • YouTube Title: ${options.youtubeTitle}`)
    }
    console.log(`      • First comment: ${options.firstComment ? 'Yes' : 'No'}`)
    const dryRunId = `dry-run-reel-short-${Date.now()}`
    return {
      postId: dryRunId,
      instagramPostId: (platformTarget === 'all' || platformTarget === 'instagram') ? dryRunId : undefined,
      youtubePostId: (platformTarget === 'all' || platformTarget === 'youtube') ? dryRunId : undefined,
      scheduledFor: '2026-09-05T22:30:00.000Z',
      queueId,
      commentId: options.firstComment ? `dry-run-comment-${Date.now()}` : null,
      status: options.publishNow ? 'published' : 'queued',
      dryRun: true,
    }
  }


  if (options.validateMediaWindow) await assertUploadWindow(queueId, profileId, !!options.publishNow)
  // Build target platform configs
  const platforms: ZernioPlatformConfig[] = []

  if (platformTarget === 'all' || platformTarget === 'instagram') {
    platforms.push({
      platform: 'instagram',
      accountId: igAccountId,
      customContent: options.instagramCaption,
      platformSpecificData: {
        contentType: 'reel',
        shareToFeed: true,
        isAiGenerated: options.isAiGenerated ?? true,
        ...(options.firstComment ? { firstComment: options.firstComment } : {}),
      },
    })
  }

  if (platformTarget === 'all' || platformTarget === 'youtube') {
    platforms.push({
      platform: 'youtube',
      accountId: ytAccountId,
      customContent: options.youtubeDescription,
      platformSpecificData: {
        title: options.youtubeTitle,
        visibility: 'public',
        ...(options.youtubeTags && options.youtubeTags.length > 0 ? { tags: options.youtubeTags } : {}),
        ...(options.firstComment ? { firstComment: options.firstComment } : {}),
      },
    })
  }

  if (platforms.length === 0) {
    throw new Error(`No platforms selected for queueDualReelAndShort (platformTarget: ${platformTarget})`)
  }

  console.log(`   • Staging Broadcast to [${platforms.map(p => p.platform).join(', ')}]...`)
  const postPayload: ZernioCreatePostPayload = {
    queuedFromProfile: profileId,
    queueId,
    content: options.instagramCaption,
    mediaItems: [{ type: 'video', url: videoUrl }],
    platforms,
    publishNow: options.publishNow || false,
  }

  const post = await createZernioPost(postPayload, options.videoPath ? { [videoUrl]: options.videoPath } : {})
  console.log(`   ✅ Reel / Short queued! Zernio Post ID: ${post._id}`)
  if (post.scheduledFor) {
    console.log(`   ⏰ Scheduled For: ${post.scheduledFor}`)
  }

  let commentId: string | null = null
  if (options.firstComment && (platformTarget === 'all' || platformTarget === 'instagram')) {
    console.log(`   💬 Posting algorithmic first comment on Instagram...`)
    try {
      const commentRes = await postZernioComment(post._id, igAccountId, options.firstComment)
      commentId = commentRes ? (commentRes.comment?._id || commentRes._id || 'posted') : null
      if (commentId) {
        console.log(`   ✅ First comment registered successfully!`)
      }
    } catch (commentErr: any) {
      console.warn(`   ⚠️ Warning: Failed to post first comment: ${commentErr.message}`)
    }
  }

  return {
    postId: post._id,
    instagramPostId: (platformTarget === 'all' || platformTarget === 'instagram') ? post._id : undefined,
    youtubePostId: (platformTarget === 'all' || platformTarget === 'youtube') ? post._id : undefined,
    scheduledFor: post.scheduledFor,
    queueId,
    commentId,
    status: post.status,
    dryRun: false,
    mediaUrls: post.mediaItems.map((item: ZernioMediaItem) => item.url),
  }
}
