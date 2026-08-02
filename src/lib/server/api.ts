import { z } from 'zod'
import type { JWTPayload } from 'jose'
import { handlerWithServer, publicServerFn, authenticatedServerFn } from './functions'
import { changelogs, profiles, users, userStats, galleryPins } from '../../db/schema'
import { getDb } from '../../db'
import { eq, desc } from 'drizzle-orm'
import { INITIAL_CHANGELOGS } from '../changelogs-data'
import type { ChangelogEntry } from '../changelogs-data'
import { INITIAL_GALLERY_PINS } from '../gallery-data'
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

interface ServerFnArgs<TData = undefined> {
  data: TData
  context: ServerFnContext
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
const getPublicChangelogsHandler = async ({ context }: ServerFnArgs) => {
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

export const getPublicChangelogsFn = handlerWithServer(publicServerFn, getPublicChangelogsHandler)

/**
 * Server Function: Get authenticated user profile.
 */
const getUserProfileHandler = async ({ context }: ServerFnArgs) => {
  const userId = context?.user?.sub || context?.user?.id
  if (!userId) {
    return null
  }

  const dbClient = context?.db || getDb(context?.token ?? undefined)
  const [userRecord] = await dbClient
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return userRecord || null
}

export const getUserProfileFn = handlerWithServer(authenticatedServerFn, getUserProfileHandler)

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

export const getUserStatsFn = handlerWithServer(authenticatedServerFn, getUserStatsHandler)

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

export const updateUserStatsFn = handlerWithServer(
  authenticatedServerFn.validator((data: UserStatsInput) => {
    return z
      .object({
        pincerTorque: z.number().min(0).max(100).optional(),
        shellHardness: z.number().min(0).max(100).optional(),
        clawStrength: z.number().min(0).max(100).optional(),
      })
      .parse(data)
  }),
  updateUserStatsHandler,
)

interface GetAssetUrlInput {
  key: string
  expiresIn?: number
}

/**
 * Server Function: Get presigned URL for an S3 asset key.
 */
const getS3AssetUrlHandler = async ({ data }: ServerFnArgs<GetAssetUrlInput>) => {
  if (!data?.key) {
    throw new Error('Key parameter is required')
  }
  const url = await getPresignedViewUrl(data.key, undefined, data.expiresIn || 3600)
  return { url }
}

export const getS3AssetUrlFn = handlerWithServer(
  publicServerFn.validator((data: GetAssetUrlInput) => {
    return z
      .object({
        key: z.string().min(1),
        expiresIn: z.number().min(60).max(86400).optional(),
      })
      .parse(data)
  }),
  getS3AssetUrlHandler,
)

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
      return records.map((r) => ({
        id: r.id,
        userId: r.userId,
        title: r.title,
        description: r.description,
        prompt: r.prompt || undefined,
        s3Key: r.s3Key,
        imageUrl: r.imageUrl,
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

export const getGalleryPinsFn = handlerWithServer(publicServerFn, getGalleryPinsHandler)


