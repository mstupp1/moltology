import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, Search, Users } from 'lucide-react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { listConnectionsFn } from '@/lib/server/api'
import {
  connectionsHubLocation,
  connectionsPageLocation,
  pickConnectionsHubCircle,
  pickConnectionsHubPreview,
  relationshipForHubPreview,
  relationshipForMember,
  type ConnectionsHubPreviewItem,
  type ConnectionsListView,
  type ConnectionsTab,
} from '@/lib/connections'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'
import { DASHBOARD_FOCUS, DashboardEmptyRow, DashboardPanel } from '@/components/hud/dashboard/DashboardPanel'
import { cn } from '@/lib/utils'
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import { MemberSearchRow } from '@/components/hud/connections/MemberSearchRow'
import { FriendRequestButton } from '@/components/hud/member/FriendRequestButton'
import { useMemberSearch } from '@/hooks/useMemberSearch'
import { MEMBER_SEARCH_MIN_CHARS } from '@/lib/member-search'
import { relativeTime } from '@/lib/forum-utils'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'

export const CONNECTIONS_HUB_TITLE = 'CONNECTIONS'
export const CONNECTIONS_HUB_EMPTY_COPY = {
  title: 'The circle is quiet',
  body: 'Search a designation to send a request.',
} as const
export const CONNECTIONS_HUB_SEARCH_PLACEHOLDER = 'Search names or designations…'

const EMPTY_CONNECTIONS: ConnectionsListView = {
  friends: [],
  incoming: [],
  outgoing: [],
}

const HUB_SEARCH_RESULT_LIMIT = 3

function ConnectionsHubListGhost() {
  return (
    <div className="space-y-2" aria-hidden="true">
      <div className="h-9 border border-line-subtle bg-surface-1 rounded-control" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 flex-1 border border-line-subtle bg-surface-1 rounded-control" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-14 border border-line-subtle bg-surface-1 rounded-card" />
      ))}
    </div>
  )
}

/** The three lists as one segmented control; each segment opens that tab of the full page. */
function CountTabs({
  items,
}: {
  items: Array<{ label: string; count: number; accent?: boolean; onOpen: () => void }>
}) {
  return (
    <div className="inline-flex items-stretch rounded-control border border-line-subtle bg-surface-1 divide-x divide-line-subtle overflow-hidden">
      {items.map(({ label, count, accent = false, onOpen }) => {
        const lit = accent && count > 0
        return (
          <button
            key={label}
            type="button"
            onClick={onOpen}
            className={cn(
              'inline-flex items-center gap-1.5 min-h-8 px-2.5 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow',
              lit ? 'bg-surface-3 shadow-nav-current text-ink' : 'text-ink-muted hover:text-ink hover:bg-surface-2',
            )}
          >
            {label}
            <span className={cn('tabular-nums', lit ? 'text-cyan-glow' : 'text-ink-body font-normal')}>{count}</span>
          </button>
        )
      })}
    </div>
  )
}

function HubAvatarStack({ members, overflow }: { members: ConnectionsListView['friends']; overflow: number }) {
  if (members.length === 0) return null

  return (
    <div className="flex items-center shrink-0" aria-hidden="true">
      <div className="flex -space-x-2">
        {members.map((member) => (
          <div key={member.id} className="ring-2 ring-surface-1 rounded-full">
            <LobsterAvatarPortrait
              config={(member.avatarConfig as LobsterAvatarConfig | null) ?? null}
              className="w-7 h-7"
              size={64}
              fisheyeLens={false}
              vignette={false}
              specularSheen={false}
            />
          </div>
        ))}
      </div>
      {overflow > 0 && (
        <span className="ml-1.5 text-[11px] font-bold tabular-nums text-ink-muted">+{overflow}</span>
      )}
    </div>
  )
}

export function ConnectionsHubCard() {
  const navigate = useNavigate()
  const session = useAuthSession()
  const userId = session.userId
  const isAuthPending = session.isPending
  const canSearch = Boolean(userId)

  const [connections, setConnections] = useState<ConnectionsListView>(EMPTY_CONNECTIONS)
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const { results, searching } = useMemberSearch(query, canSearch)
  const searchResults = results.slice(0, HUB_SEARCH_RESULT_LIMIT)
  const queryReady = query.trim().length >= MEMBER_SEARCH_MIN_CHARS

  const refreshConnections = useCallback(async () => {
    if (!userId) return
    try {
      const token = await getAuthJWTToken()
      const next = await listConnectionsFn({ data: { token: token ?? undefined } })
      setConnections(next ?? EMPTY_CONNECTIONS)
    } catch {
      // Keep the last good snapshot; the row actions toast their own failures.
    }
  }, [userId])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (isAuthPending) return
      if (!userId) {
        if (!cancelled) {
          setConnections(EMPTY_CONNECTIONS)
          setIsLoading(false)
        }
        return
      }

      try {
        const token = await getAuthJWTToken()
        const next = await listConnectionsFn({ data: { token: token ?? undefined } })
        if (!cancelled) setConnections(next ?? EMPTY_CONNECTIONS)
      } catch {
        if (!cancelled) setConnections(EMPTY_CONNECTIONS)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [userId, isAuthPending])

  const preview = pickConnectionsHubPreview(connections)
  const circle = pickConnectionsHubCircle(connections)
  const friendCount = connections.friends.length
  const incomingCount = connections.incoming.length
  const sentCount = connections.outgoing.length
  const showSearchResults = canSearch && queryReady
  const showPreview = !showSearchResults
  const openConnections = (tab?: ConnectionsTab) => {
    navigate(tab ? connectionsPageLocation(tab) : connectionsHubLocation(incomingCount))
  }

  return (
    <DashboardPanel
      icon={<Users />}
      title={CONNECTIONS_HUB_TITLE}
      action={{ label: incomingCount > 0 ? 'Open incoming' : 'Open connections', onClick: () => openConnections() }}
      className="h-full"
      data-testid="connections-hub-card"
    >
      <HudGhostWidget isLoading={isLoading} skeleton={<ConnectionsHubListGhost />}>
        <div className="space-y-3">
          {canSearch && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={CONNECTIONS_HUB_SEARCH_PLACEHOLDER}
                aria-label="Search members"
                className="w-full pl-8 pr-8 py-2 bg-surface-2 border border-line text-xs text-ink placeholder:text-ink-muted/70 hover:border-line-hover focus:outline-hidden focus:border-cyan-glow focus:shadow-field-focus transition-[border-color,box-shadow] rounded-control"
              />
              {searching && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-glow animate-spin" />
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <CountTabs
              items={[
                { label: 'Friends', count: friendCount, onOpen: () => openConnections('friends') },
                { label: 'Incoming', count: incomingCount, accent: true, onOpen: () => openConnections('incoming') },
                { label: 'Sent', count: sentCount, onOpen: () => openConnections('sent') },
              ]}
            />
            <HubAvatarStack members={circle} overflow={Math.max(0, friendCount - circle.length)} />
          </div>

          {showSearchResults && searchResults.length > 0 && (
            <ul className="space-y-1.5 font-sans">
              {searchResults.map((member) => {
                const { relationship, pendingRequestId } = relationshipForMember(connections, member.id)
                return (
                  <MemberSearchRow
                    key={member.id}
                    member={member}
                    relationship={relationship}
                    pendingRequestId={pendingRequestId}
                    compact
                    allowRemove={false}
                    onRelationshipChange={() => void refreshConnections()}
                  />
                )
              })}
            </ul>
          )}

          {showSearchResults && !searching && searchResults.length === 0 && (
            <p className="text-xs text-ink-muted text-center py-3">
              The trench stayed quiet. No designation, larva unit, or name surfaced for that call.
            </p>
          )}

          {showPreview && preview.length === 0 && (
            <DashboardEmptyRow title={CONNECTIONS_HUB_EMPTY_COPY.title} body={CONNECTIONS_HUB_EMPTY_COPY.body} />
          )}

          {showPreview && preview.length > 0 && (
            <ul className="rounded-control border border-line-subtle divide-y divide-line-subtle overflow-hidden font-sans">
              {preview.map((member) => (
                <HubConnectionRow
                  key={`${member.kind}-${member.id}`}
                  member={member}
                  onRelationshipChange={() => void refreshConnections()}
                />
              ))}
            </ul>
          )}
        </div>
      </HudGhostWidget>
    </DashboardPanel>
  )
}

function HubConnectionRow({
  member,
  onRelationshipChange,
}: {
  member: ConnectionsHubPreviewItem
  onRelationshipChange: () => void
}) {
  const { relationship, pendingRequestId } = relationshipForHubPreview(member)
  const ageLabel = member.since ? relativeTime(member.since) : ''
  const incoming = member.kind === 'incoming'

  return (
    <li className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5', incoming ? 'bg-surface-2' : 'bg-surface-1')}>
      <Link
        to="/member/$profileId"
        params={{ profileId: resolveMemberPublicParam(member) }}
        className={cn('flex items-center gap-2.5 min-w-[9rem] flex-1 rounded-control group', DASHBOARD_FOCUS)}
      >
        <LobsterAvatarPortrait
          config={(member.avatarConfig as LobsterAvatarConfig | null) ?? null}
          className="w-8 h-8 shrink-0"
          size={96}
        />
        <span className="min-w-0 flex flex-col">
          <span className="text-sm font-bold text-ink group-hover:text-cyan-glow transition-colors truncate leading-snug">
            {member.displayName}
          </span>
          <span className="text-[11px] text-ink-muted truncate">
            {incoming ? 'Wants to connect' : member.kind === 'sent' ? 'Request sent' : `Stage ${member.stage} · ${member.stageLabel}`}
            {ageLabel ? ` · ${ageLabel}` : ''}
          </span>
        </span>
      </Link>
      <div className="shrink-0 ml-auto">
        <FriendRequestButton
          profileId={member.id}
          relationship={relationship}
          pendingRequestId={pendingRequestId}
          compact
          allowRemove={false}
          onRelationshipChange={onRelationshipChange}
        />
      </div>
    </li>
  )
}
