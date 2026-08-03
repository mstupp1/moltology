import { createIsomorphicFn } from '@tanstack/start-fn-stubs'
import { type ChangelogEntry } from '@/lib/changelogs-data'
import { getPublicChangelogsFn, createChangelogFn } from '@/lib/server/api'
import { executeServerFn } from '@/lib/server/execute'

import { INITIAL_CHANGELOGS } from '@/lib/changelogs-data'

export type { ChangelogEntry }

const getPublicChangelogsImpl = createIsomorphicFn()
  .server(() => executeServerFn(getPublicChangelogsFn))
  .client(() => getPublicChangelogsFn())

const createChangelogImpl = createIsomorphicFn()
  .server((data: Parameters<typeof createChangelogFn>[0]['data']) => executeServerFn(createChangelogFn, undefined, data))
  .client((data: Parameters<typeof createChangelogFn>[0]['data']) => createChangelogFn({ data }))

export async function getPublicChangelogs(): Promise<ChangelogEntry[]> {
  try {
    const res = await getPublicChangelogsImpl()
    if (Array.isArray(res)) return res as ChangelogEntry[]
  } catch (err) {
    console.warn('[getPublicChangelogs] Error fetching changelogs:', err)
  }
  return INITIAL_CHANGELOGS
}

export async function createChangelog(data: {
  version: string
  title: string
  category: string
  summary: string
  content: string
  isPublished?: boolean
}): Promise<ChangelogEntry> {
  return (await createChangelogImpl(data)) as ChangelogEntry
}

