export const CHAT_LIMIT = 50
export const CHAT_ARCHIVE_RETENTION_DAYS = 30

import type { NeonQueryFunction } from '@neondatabase/serverless'

type ThreadRow = {
  id: string
  userId: string
  title: string
  persona: string
  pinnedAt: Date | null
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

type ThreadCreationInput = {
  id?: string
  userId: string
  title: string
  persona: string
}

const MAX_SERIALIZATION_ATTEMPTS = 3

/**
 * Enforces the per-member cap atomically. Serializable isolation prevents two
 * simultaneous requests from both observing the same final free slot.
 * Replaying a caller-supplied id returns that member's existing thread.
 */
export async function createChatThreadWithinLimit(
  client: NeonQueryFunction<false, false>,
  input: ThreadCreationInput,
): Promise<{ thread: ThreadRow; created: boolean } | null> {
  for (let attempt = 1; attempt <= MAX_SERIALIZATION_ATTEMPTS; attempt += 1) {
    try {
      const query = client`
        WITH existing AS MATERIALIZED (
          SELECT id, "userId", title, persona, "pinnedAt", "archivedAt", "createdAt", "updatedAt"
          FROM ai_threads
          WHERE "userId" = ${input.userId}
            AND id = ${input.id ?? null}::uuid
        ), member_count AS MATERIALIZED (
          SELECT count(*)::integer AS count
          FROM ai_threads
          WHERE "userId" = ${input.userId}
        ), inserted AS (
          INSERT INTO ai_threads (id, "userId", title, persona)
          SELECT COALESCE(${input.id ?? null}::uuid, gen_random_uuid()), ${input.userId}, ${input.title}, ${input.persona}
          FROM member_count
          WHERE member_count.count < ${CHAT_LIMIT}
            AND NOT EXISTS (SELECT 1 FROM existing)
          RETURNING id, "userId", title, persona, "pinnedAt", "archivedAt", "createdAt", "updatedAt"
        )
        SELECT 'created'::text AS outcome, inserted.* FROM inserted
        UNION ALL
        SELECT 'existing'::text AS outcome, existing.* FROM existing
        UNION ALL
        SELECT 'limit'::text AS outcome, NULL::uuid, NULL::text, NULL::text, NULL::text,
          NULL::timestamp, NULL::timestamp, NULL::timestamp, NULL::timestamp
        FROM member_count
        WHERE member_count.count >= ${CHAT_LIMIT}
          AND NOT EXISTS (SELECT 1 FROM existing)
      `
      const [result] = await client.transaction([query], { isolationLevel: 'Serializable' })
      const row = result[0] as ({ outcome: string } & ThreadRow) | undefined
      if (!row || row.outcome === 'limit') return null
      const { outcome, ...thread } = row
      return { thread, created: outcome === 'created' }
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined
      if (code !== '40001' || attempt === MAX_SERIALIZATION_ATTEMPTS) throw error
    }
  }
  throw new Error('Serializable thread creation retry exhausted.')
}

export class ChatLimitError extends Error {
  readonly code = 'CHAT_LIMIT_REACHED'

  constructor() {
    super(getChatLimitMessage())
    this.name = 'ChatLimitError'
  }
}

export function getChatLimitMessage(): string {
  return `You have ${CHAT_LIMIT} conversations. Delete one to start another.`
}

export function getChatLimitError(): ChatLimitError {
  return new ChatLimitError()
}

export function isChatLimitError(error: unknown): error is ChatLimitError {
  return error instanceof ChatLimitError
    || (typeof error === 'object' && error !== null && 'code' in error && error.code === 'CHAT_LIMIT_REACHED')
}

