import { createIsomorphicFn } from '@tanstack/start-fn-stubs'
import { type ChangelogEntry } from '@/lib/changelogs-data'
import { getPublicChangelogsFn } from '@/lib/server/api'
import { executeServerFn } from '@/lib/server/execute'

export type { ChangelogEntry }

const getPublicChangelogsImpl = createIsomorphicFn()
  .server(() => executeServerFn(getPublicChangelogsFn))
  .client(() => getPublicChangelogsFn())

export async function getPublicChangelogs(): Promise<ChangelogEntry[]> {
  return (await getPublicChangelogsImpl()) as ChangelogEntry[]
}
