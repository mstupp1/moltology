import { createIsomorphicFn } from '@tanstack/start-fn-stubs'
import { type ChangelogEntry } from '@/lib/changelogs-data'
import { getPublicChangelogsFn } from '@/lib/server/api'
import { executeServerFn } from '@/lib/server/execute'

import { INITIAL_CHANGELOGS } from '@/lib/changelogs-data'

export type { ChangelogEntry }

const getPublicChangelogsImpl = createIsomorphicFn()
  .server(() => executeServerFn(getPublicChangelogsFn))
  .client(() => getPublicChangelogsFn())

export async function getPublicChangelogs(): Promise<ChangelogEntry[]> {
  try {
    const res = await getPublicChangelogsImpl()
    if (Array.isArray(res)) return res as ChangelogEntry[]
  } catch (err) {
    console.warn('[getPublicChangelogs] Error fetching changelogs:', err)
  }
  return INITIAL_CHANGELOGS
}
