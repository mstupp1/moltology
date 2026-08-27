import { eq, desc, asc } from 'drizzle-orm'
import { getDb } from '../../db'
import { aiThreads, aiMessages } from '../../db/schema'
import { ensureUserProfile } from '../user-sync'

import { ORACLE_TITLE_MODEL_ID } from './oracle-models'

export interface CreateThreadInput {
  /** Pre-assigned thread id so clients can receive the header before insert completes. */
  id?: string
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
 * Summarizes the user's initial inquiry into a concise 3-6 word conversation title using Qwen 3.7 Flash.
 * Falls back to a sliced excerpt of the user's message if AI generation is unavailable.
 */
export async function summarizeThreadTitle(
  firstMessageText: string,
  modelId: string = ORACLE_TITLE_MODEL_ID
): Promise<string> {
  const fallback = firstMessageText.trim().split('\n')[0].slice(0, 100) || 'Ascendance Consultation'
  if (!firstMessageText || !firstMessageText.trim()) {
    return fallback
  }

  try {
    const { generateText } = await import('ai')
    const result = await generateText({
      model: modelId as any,
      system:
        'You are a conversation title generator. Create a brief, concise, and clear 3 to 6 word title summarizing the user inquiry. Output ONLY the title with no quotation marks, no markdown, no punctuation at the end, and no "Title:" prefix.',
      prompt: `User message: "${firstMessageText.slice(0, 500)}"`,
    })

    const raw = result.text?.trim()
    if (!raw) return fallback

    const cleanTitle = raw
      .replace(/^["'`]|["'`]$/g, '')
      .replace(/^Title:\s*/i, '')
      .replace(/\.+$/, '')
      .trim()

    return cleanTitle.slice(0, 120) || fallback
  } catch (err) {
    console.warn('[summarizeThreadTitle] AI title summarization warning, falling back to message excerpt:', err)
    return fallback
  }
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
      ...(input.id ? { id: input.id } : {}),
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

/**
 * Updates the title of an existing AI conversation thread.
 */
export async function updateAIThreadTitle(threadId: string, title: string) {
  if (!threadId || !title || !title.trim()) return null
  const dbClient = getDb()
  const [updated] = await dbClient
    .update(aiThreads)
    .set({ title: title.trim().slice(0, 120), updatedAt: new Date() })
    .where(eq(aiThreads.id, threadId))
    .returning()

  return updated
}
