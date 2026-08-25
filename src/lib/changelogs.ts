import { type ChangelogEntry } from '@/lib/changelogs-data'
import { getPublicChangelogsFn, getChangelogBySlugFn } from '@/lib/server/api'

export type { ChangelogEntry }

export async function getPublicChangelogs(): Promise<ChangelogEntry[]> {
  try {
    const res = await getPublicChangelogsFn()
    return Array.isArray(res) ? (res as ChangelogEntry[]) : []
  } catch (err) {
    console.error('[getPublicChangelogs] Error fetching changelogs from DB:', err)
    return []
  }
}

export async function getChangelogBySlug(slug: string): Promise<ChangelogEntry | null> {
  try {
    const res = await getChangelogBySlugFn({ data: slug })
    return (res as ChangelogEntry) || null
  } catch (err) {
    console.error(`[getChangelogBySlug] Error fetching changelog for slug "${slug}":`, err)
    return null
  }
}
