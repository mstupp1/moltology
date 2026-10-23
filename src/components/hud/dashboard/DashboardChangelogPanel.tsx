import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { GitCommit } from 'lucide-react'
import { INITIAL_CHANGELOGS, type ChangelogEntry } from '@/lib/changelogs-data'
import { getPublicChangelogs } from '@/lib/changelogs'
import { cn } from '@/lib/utils'
import { DASHBOARD_FOCUS, DashboardPanel } from './DashboardPanel'

export const DASHBOARD_CHANGELOG_LIMIT = 5

/** Fixed time zone so the server and the browser print the same day. */
export function formatReleaseDay(value: string | Date): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function DashboardChangelogPanel() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<ChangelogEntry[]>(INITIAL_CHANGELOGS)

  useEffect(() => {
    let isMounted = true
    getPublicChangelogs()
      .then((fetched) => {
        if (isMounted && fetched.length > 0) setEntries(fetched)
      })
      .catch(() => {
        // keep the bundled entries
      })
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <DashboardPanel
      icon={<GitCommit />}
      title="What’s new"
      action={{ label: `All ${entries.length} releases`, onClick: () => navigate({ to: '/changelog' }) }}
      data-testid="dashboard-changelog"
    >
      <ol className="divide-y divide-line-subtle -my-1">
        {entries.slice(0, DASHBOARD_CHANGELOG_LIMIT).map((entry) => (
          <li key={entry.slug || entry.version}>
            <Link
              to="/changelog/$slug"
              params={{ slug: entry.slug }}
              className={cn('group grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 py-2.5 rounded-control hover:bg-surface-2 -mx-2 px-2 transition-colors', DASHBOARD_FOCUS)}
            >
              <span className="text-[11px] font-bold text-ink-muted tabular-nums pt-0.5">{formatReleaseDay(entry.releasedAt)}</span>
              <span className="min-w-0 flex flex-col gap-0.5">
                <span className="text-sm font-bold text-ink group-hover:text-cyan-glow transition-colors leading-snug line-clamp-1">
                  {entry.title}
                </span>
                <span className="text-xs text-ink-muted leading-relaxed line-clamp-1">{entry.summary}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </DashboardPanel>
  )
}
