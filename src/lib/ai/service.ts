import { eq, desc, asc, and, gte, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { aiThreads, aiMessages, aiUsageEvents, profiles } from '../../db/schema'
import { ensureUserProfile } from '../user-sync'

import { ORACLE_TITLE_MODEL_ID } from './oracle-models'
import type { OracleUsageCounts } from './usage-limits'

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
 * Summarizes the user's initial inquiry into a concise 3-6 word conversation title using the title model (ORACLE_TITLE_MODEL_ID).
 * Falls back to a sliced excerpt of the user's message if AI generation is unavailable.
 */
export async function summarizeThreadTitle(
  firstMessageText: string,
  modelId: string = ORACLE_TITLE_MODEL_ID,
  userId?: string,
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
      maxOutputTokens: 32,
    })
    if (userId) {
      void recordOracleUsage({
        userId,
        kind: 'title',
        model: modelId,
        inputTokens: result.usage?.inputTokens,
        outputTokens: result.usage?.outputTokens,
      })
    }

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

  if ((input.persona || 'oracle') === 'oracle' && thread?.id) {
    try {
      const { maybeRecordOracleConsultationMilestone } = await import('../server/activity-log')
      await maybeRecordOracleConsultationMilestone(dbClient, input.userId, thread.id)
    } catch (err) {
      console.warn('[createAIThread] Activity persist error:', err)
    }
  }

  return thread
}

/**
 * Fetches all AI conversation threads for a specific user.
 * Pinned threads sort first (most recently pinned first), then by last activity.
 * Includes archived threads — clients partition them out for the Archived section.
 */
export async function getUserAIThreads(userId: string) {
  const dbClient = getDb()
  return await dbClient
    .select()
    .from(aiThreads)
    .where(eq(aiThreads.userId, userId))
    .orderBy(sql`${aiThreads.pinnedAt} DESC NULLS LAST`, desc(aiThreads.updatedAt))
}

/**
 * Returns the thread only when it belongs to `userId`.
 */
export async function getOwnedAIThread(userId: string, threadId: string) {
  if (!userId || !threadId) return null
  const dbClient = getDb()
  const [thread] = await dbClient
    .select({ id: aiThreads.id, userId: aiThreads.userId })
    .from(aiThreads)
    .where(and(eq(aiThreads.id, threadId), eq(aiThreads.userId, userId)))
    .limit(1)
  return thread || null
}

/**
 * Fetches messages for a thread the caller owns. Unknown or foreign threads return [].
 */
export async function getAIThreadMessages(threadId: string, userId: string) {
  const owned = await getOwnedAIThread(userId, threadId)
  if (!owned) return []
  const dbClient = getDb()
  return await dbClient
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.threadId, threadId))
    .orderBy(asc(aiMessages.createdAt))
}

/**
 * Saves a new message to an AI thread the caller owns.
 */
export async function saveAIMessage(input: SaveMessageInput) {
  const owned = await getOwnedAIThread(input.userId, input.threadId)
  if (!owned) return null
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

  await dbClient
    .update(aiThreads)
    .set({ updatedAt: new Date() })
    .where(and(eq(aiThreads.id, input.threadId), eq(aiThreads.userId, input.userId)))

  return message
}

/**
 * Updates the title of an existing AI conversation thread the caller owns.
 */
export async function updateAIThreadTitle(threadId: string, title: string, userId: string) {
  if (!threadId || !title || !title.trim() || !userId) return null
  const dbClient = getDb()
  const [updated] = await dbClient
    .update(aiThreads)
    .set({ title: title.trim().slice(0, 120), updatedAt: new Date() })
    .where(and(eq(aiThreads.id, threadId), eq(aiThreads.userId, userId)))
    .returning()

  return updated
}

/**
 * Pins or unpins an AI thread. Owner-scoped on top of RLS.
 * Pinning stamps `pinnedAt`; unpinning clears it.
 */
export async function pinAIThread(userId: string, threadId: string, pinned: boolean) {
  if (!userId || !threadId) return null
  const dbClient = getDb()
  const [updated] = await dbClient
    .update(aiThreads)
    .set({ pinnedAt: pinned ? new Date() : null })
    .where(and(eq(aiThreads.id, threadId), eq(aiThreads.userId, userId)))
    .returning()

  return updated || null
}

/**
 * Archives or unarchives an AI thread. Owner-scoped on top of RLS.
 * Archiving stamps `archivedAt`; unarchiving clears it.
 */
export async function archiveAIThread(userId: string, threadId: string, archived: boolean) {
  if (!userId || !threadId) return null
  const dbClient = getDb()
  const [updated] = await dbClient
    .update(aiThreads)
    .set({ archivedAt: archived ? new Date() : null })
    .where(and(eq(aiThreads.id, threadId), eq(aiThreads.userId, userId)))
    .returning()

  return updated || null
}

/**
 * Renames an AI thread with owner scoping (RLS defense-in-depth).
 */
export async function renameAIThread(userId: string, threadId: string, title: string) {
  if (!userId || !threadId || !title || !title.trim()) return null
  const dbClient = getDb()
  const [updated] = await dbClient
    .update(aiThreads)
    .set({ title: title.trim().slice(0, 120), updatedAt: new Date() })
    .where(and(eq(aiThreads.id, threadId), eq(aiThreads.userId, userId)))
    .returning()

  return updated || null
}

/**
 * Permanently deletes an AI thread and its messages (FK cascade). Owner-scoped on top of RLS.
 */
export async function deleteAIThread(userId: string, threadId: string) {
  if (!userId || !threadId) return false
  const dbClient = getDb()
  const deleted = await dbClient
    .delete(aiThreads)
    .where(and(eq(aiThreads.id, threadId), eq(aiThreads.userId, userId)))
    .returning({ id: aiThreads.id })

  return deleted.length > 0
}

export interface OracleUsageRecord {
  userId: string
  kind: 'chat' | 'title'
  model?: string
  inputTokens?: number
  outputTokens?: number
}

/** Records one model call. Returns the row id, or null when the write fails. */
export async function recordOracleUsage(input: OracleUsageRecord): Promise<string | null> {
  try {
    const [row] = await getDb()
      .insert(aiUsageEvents)
      .values({
        userId: input.userId,
        kind: input.kind,
        model: input.model ?? null,
        inputTokens: input.inputTokens ?? null,
        outputTokens: input.outputTokens ?? null,
      })
      .returning({ id: aiUsageEvents.id })
    return row?.id ?? null
  } catch (err) {
    console.warn('[recordOracleUsage] Usage write warning:', err)
    return null
  }
}

/** Fills in the model and token counts once a chat stream finishes. */
export async function finalizeOracleUsage(
  id: string,
  usage: { model: string; inputTokens?: number; outputTokens?: number },
): Promise<void> {
  try {
    await getDb()
      .update(aiUsageEvents)
      .set({
        model: usage.model,
        inputTokens: usage.inputTokens ?? null,
        outputTokens: usage.outputTokens ?? null,
      })
      .where(eq(aiUsageEvents.id, id))
  } catch (err) {
    console.warn('[finalizeOracleUsage] Usage write warning:', err)
  }
}

/** Chat calls in the last minute and last 24 hours, plus the member's Premium flag. */
export async function getOracleUsageSnapshot(
  userId: string,
  now: Date = new Date(),
): Promise<OracleUsageCounts & { isPremium: boolean }> {
  const db = getDb()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const minuteAgo = new Date(now.getTime() - 60 * 1000)
  const [[counts], [profile]] = await Promise.all([
    db
      .select({
        lastDay: sql<number>`count(*)::int`,
        lastMinute: sql<number>`count(*) filter (where ${aiUsageEvents.createdAt} >= ${minuteAgo.toISOString()}::timestamp)::int`,
      })
      .from(aiUsageEvents)
      .where(
        and(
          eq(aiUsageEvents.userId, userId),
          eq(aiUsageEvents.kind, 'chat'),
          gte(aiUsageEvents.createdAt, dayAgo),
        ),
      ),
    db.select({ isPremium: profiles.isPremium }).from(profiles).where(eq(profiles.id, userId)).limit(1),
  ])
  return {
    lastDay: Number(counts?.lastDay ?? 0),
    lastMinute: Number(counts?.lastMinute ?? 0),
    isPremium: profile?.isPremium === true,
  }
}
