import { z } from 'zod'
import type { JWTPayload } from 'jose'
import { handlerWithServer, publicServerFn, authenticatedServerFn } from './functions'
import { changelogs, users, userStats } from '../../db/schema'
import { getDb } from '../../db'
import { eq, desc } from 'drizzle-orm'
import { INITIAL_CHANGELOGS } from '../changelogs-data'
import type { ChangelogEntry } from '../changelogs-data'

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
