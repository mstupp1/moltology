import { type ChangelogEntry } from '@/lib/changelogs-data'
import { getPublicChangelogsFn, createChangelogFn, updateChangelogFn, deleteChangelogFn } from '@/lib/server/api'

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

export async function createChangelog(data: {
  version: string
  title: string
  category: string
  summary: string
  content: string
  isPublished?: boolean
  userId?: string
  token?: string
}): Promise<ChangelogEntry> {
  return (await createChangelogFn({ data })) as ChangelogEntry
}

export async function updateChangelog(data: {
  id: string
  version: string
  title: string
  category: string
  summary: string
  content: string
  isPublished?: boolean
  userId?: string
  token?: string
  releasedAt?: string | Date
}): Promise<ChangelogEntry> {
  return (await updateChangelogFn({ data })) as ChangelogEntry
}

export async function deleteChangelog(data: {
  id: string
  userId?: string
  token?: string
}): Promise<ChangelogEntry> {
  return (await deleteChangelogFn({ data })) as ChangelogEntry
}
