import { eq, desc, asc } from 'drizzle-orm'
import { getDb } from '../../db'
import { aiThreads, aiMessages } from '../../db/schema'
import { ensureUserProfile } from '../user-sync'

export interface CreateThreadInput {
  userId: string
  title?: string
  persona?: string
}

export interface SaveMessageInput {
  threadId: string
  userId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  parts?: Record<string, unknown>[]
}

/**
 * Creates a new AI conversation thread in Neon Postgres.
 */
export async function createAIThread(input: CreateThreadInput) {
  await ensureUserProfile(input.userId)
  const dbClient = getDb()
  const [thread] = await dbClient
    .insert(aiThreads)
    .values({
      userId: input.userId,
      title: input.title || 'Ascendance Consultation',
      persona: input.persona || 'oracle',
    })
    .returning()

  return thread
}

/**
 * Fetches all AI conversation threads for a specific user.
 */
export async function getUserAIThreads(userId: string) {
  const dbClient = getDb()
  return await dbClient
    .select()
    .from(aiThreads)
    .where(eq(aiThreads.userId, userId))
    .orderBy(desc(aiThreads.updatedAt))
}

/**
 * Fetches all messages for a specific AI thread.
 */
export async function getAIThreadMessages(threadId: string) {
  const dbClient = getDb()
  return await dbClient
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.threadId, threadId))
    .orderBy(asc(aiMessages.createdAt))
}

/**
 * Saves a new message to an AI thread.
 */
export async function saveAIMessage(input: SaveMessageInput) {
  const dbClient = getDb()
  const [message] = await dbClient
    .insert(aiMessages)
    .values({
      threadId: input.threadId,
      userId: input.userId,
      role: input.role,
      content: input.content,
      parts: input.parts || [],
    })
    .returning()

  // Update thread updatedAt timestamp
  await dbClient
    .update(aiThreads)
    .set({ updatedAt: new Date() })
    .where(eq(aiThreads.id, input.threadId))

  return message
}
