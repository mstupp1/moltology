import { db } from '@/db'
import { changelogs } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { INITIAL_CHANGELOGS, type ChangelogEntry } from '@/lib/changelogs-data'

export type { ChangelogEntry }

export async function getPublicChangelogs(): Promise<ChangelogEntry[]> {
  try {
    const records = await db
      .select()
      .from(changelogs)
      .where(eq(changelogs.isPublished, true))
      .orderBy(desc(changelogs.releasedAt))

    if (records && records.length > 0) {
      return records.map((r) => ({
        id: r.id,
        version: r.version,
        title: r.title,
        category: r.category,
        summary: r.summary,
        content: r.content,
        isPublished: r.isPublished,
        releasedAt: r.releasedAt ? new Date(r.releasedAt).toISOString() : new Date().toISOString(),
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      }))
    }
  } catch (error) {
    console.warn('[Changelogs] Database query failed or unavailable, falling back to seed entries:', error)
  }

  // Fallback to static initial changelogs if database table is not yet populated
  return INITIAL_CHANGELOGS
}
