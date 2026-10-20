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
import { DashboardEmptyRow, DashboardPanel } from '@/components/hud/dashboard/DashboardPanel'
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import { MemberSearchRow } from '@/components/hud/connections/MemberSearchRow'
import { FriendRequestButton } from '@/components/hud/member/FriendRequestButton'
import { useMemberSearch } from '@/hooks/useMemberSearch'
import { MEMBER_SEARCH_MIN_CHARS } from '@/lib/member-search'
import { relativeTime } from '@/lib/forum-utils'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'

export const CONNECTIONS_HUB_TITLE = 'CONNECTIONS'
export const CONNECTIONS_HUB_SUBTITLE = 'Find members and keep your circle close.'
export const CONNECTIONS_HUB_EMPTY_COPY = {
  title: 'The circle is quiet',
  body: 'Search a designation to send a request.',
} as const
export const CONNECTIONS_HUB_SEARCH_PLACEHOLDER = 'Search designations, larva units, or names…'

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

function CountChip({
  label,
  count,
  accent = false,
  onOpen,
}: {
  label: string
  count: number
  accent?: boolean
  onOpen: () => void
}) {
  const lit = accent && count > 0
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] border rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
        lit
          ? 'border-cyan-glow/40 text-cyan-glow bg-cyan-soft hover:bg-surface-2'
          : 'border-line text-ink-muted bg-surface-1 hover:bg-surface-2 hover:border-line-strong'
      }`}
    >
      {label}
      <span className="tabular-nums text-cyan-glow">{count}</span>
    </button>
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
      subtitle={CONNECTIONS_HUB_SUBTITLE}
      meta={<HubAvatarStack members={circle} overflow={Math.max(0, friendCount - circle.length)} />}
      action={{ label: incomingCount > 0 ? 'Open incoming' : 'Open connections', onClick: () => openConnections() }}
      className="h-full"
      data-testid="connections-hub-card"
    >
      <HudGhostWidget isLoading={isLoading} skeleton={<ConnectionsHubListGhost />}>
        <div className="space-y-2.5">
          {canSearch && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={CONNECTIONS_HUB_SEARCH_PLACEHOLDER}
                aria-label="Search members"
                className="w-full pl-8 pr-8 py-2 bg-surface-2 border border-line text-xs text-ink placeholder:text-ink-muted/70 hover:border-line-hover focus:outline-none focus:border-cyan-glow focus:shadow-field-focus transition-[border-color,box-shadow] rounded-control"
              />
              {searching && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-glow animate-spin" />
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            <CountChip label="Friends" count={friendCount} onOpen={() => openConnections('friends')} />
            <CountChip
              label="Incoming"
              count={incomingCount}
              accent
              onOpen={() => openConnections('incoming')}
            />
            <CountChip label="Sent" count={sentCount} onOpen={() => openConnections('sent')} />
          </div>

          {showSearchResults && searchResults.length > 0 && (
            <ul className="space-y-2 font-sans">
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
            <ul className="space-y-2 font-sans">
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
    <li
      className={`p-2.5 border transition-colors rounded-card bg-surface-1 ${
        incoming ? 'border-cyan-glow/40' : 'border-line-subtle hover:border-line-strong'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Link
          to="/member/$profileId"
          params={{ profileId: resolveMemberPublicParam(member) }}
          className="shrink-0"
        >
          <LobsterAvatarPortrait
            config={(member.avatarConfig as LobsterAvatarConfig | null) ?? null}
            className="w-9 h-9"
            size={96}
          />
        </Link>
        <Link
          to="/member/$profileId"
          params={{ profileId: resolveMemberPublicParam(member) }}
          className="min-w-0 flex-1"
        >
          <p className="font-grotesk text-xs font-bold text-ink hover:text-cyan-glow transition-colors truncate">
            {member.displayName}
          </p>
          <p className="text-[11px] uppercase tracking-[0.08em] text-ink-muted truncate">
            Stage {member.stage} · {member.stageLabel}
            {ageLabel ? ` · ${ageLabel}` : ''}
          </p>
        </Link>
        <div className="shrink-0">
          <FriendRequestButton
            profileId={member.id}
            relationship={relationship}
            pendingRequestId={pendingRequestId}
            compact
            allowRemove={false}
            onRelationshipChange={onRelationshipChange}
          />
        </div>
      </div>
    </li>
  )
}
