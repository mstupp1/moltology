import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronRight, Loader2, Search, Users } from 'lucide-react'
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
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import { MemberSearchRow } from '@/components/hud/connections/MemberSearchRow'
import { FriendRequestButton } from '@/components/hud/member/FriendRequestButton'
import { useMemberSearch } from '@/hooks/useMemberSearch'
import { MEMBER_SEARCH_MIN_CHARS } from '@/lib/member-search'
import { relativeTime } from '@/lib/forum-utils'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'

export const CONNECTIONS_HUB_TITLE = 'CONNECTIONS'
export const CONNECTIONS_HUB_SUBTITLE = 'Find members, answer requests, and keep your circle close.'
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
      <div className="h-9 border border-[#3a4a49]/50 bg-[#070b0b]/40 chamfer-corner" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 flex-1 border border-[#3a4a49]/50 bg-[#070b0b]/40 chamfer-corner" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="chitin-card-inset h-14 border border-[#3a4a49]/50 bg-[#070b0b]/40 chamfer-corner" />
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border chamfer-corner transition-colors ${
        lit
          ? 'border-[#00ffff]/50 text-[#00ffff] bg-[#00ffff]/10 hover:bg-[#00ffff]/20'
          : 'border-[#3a4a49] text-[#839493] bg-[#070b0b]/60 hover:border-[#00ffff]/50'
      }`}
    >
      {label}
      <span className="tabular-nums text-[#00ffff]">{count}</span>
    </button>
  )
}

function HubAvatarStack({ members, overflow }: { members: ConnectionsListView['friends']; overflow: number }) {
  if (members.length === 0) return null

  return (
    <div className="flex items-center shrink-0" aria-hidden="true">
      <div className="flex -space-x-2">
        {members.map((member) => (
          <div key={member.id} className="ring-2 ring-[#0b0f0f] rounded-full">
            <LobsterAvatarPortrait
              config={(member.avatarConfig as LobsterAvatarConfig | null) ?? null}
              className="w-7 h-7"
              size={64}
              eyeTracking={false}
              fisheyeLens={false}
              vignette={false}
              specularSheen={false}
            />
          </div>
        ))}
      </div>
      {overflow > 0 && (
        <span className="ml-1.5 text-[10px] font-bold tabular-nums text-[#839493]">+{overflow}</span>
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
    <div
      className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3.5 sm:space-y-4 h-full flex flex-col justify-between"
      data-testid="connections-hub-card"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3 border-b border-[#3a4a49] pb-3">
          <div className="min-w-0">
            <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00ffff] shrink-0" />
              {CONNECTIONS_HUB_TITLE}
              {incomingCount > 0 && (
                <button
                  type="button"
                  onClick={() => openConnections('incoming')}
                  className="text-[9px] font-sans font-bold text-[#00ffff] bg-[#00ffff]/10 border border-[#00ffff]/40 px-1.5 py-0.5 chamfer-corner tracking-wider hover:bg-[#00ffff]/20"
                >
                  {incomingCount} INCOMING
                </button>
              )}
            </h2>
            <p className="text-xs text-[#839493] mt-0.5">{CONNECTIONS_HUB_SUBTITLE}</p>
          </div>
          <HubAvatarStack members={circle} overflow={Math.max(0, friendCount - circle.length)} />
        </div>

        <HudGhostWidget isLoading={isLoading} skeleton={<ConnectionsHubListGhost />}>
          <div className="space-y-2.5">
            {canSearch && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#839493]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={CONNECTIONS_HUB_SEARCH_PLACEHOLDER}
                  aria-label="Search members"
                  className="w-full pl-8 pr-8 py-2 bg-[#050808] border border-[#3a4a49] text-xs text-[#dfe3e3] placeholder:text-[#4a5a59] focus:outline-none focus:border-[#00c3ff] chamfer-corner"
                />
                {searching && (
                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#00c3ff] animate-spin" />
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
              <p className="text-xs text-[#839493] text-center py-3">
                The trench stayed quiet. No designation, larva unit, or name surfaced for that call.
              </p>
            )}

            {showPreview && preview.length === 0 && (
              <div className="p-6 text-center space-y-1.5">
                <p className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-wide uppercase">
                  {CONNECTIONS_HUB_EMPTY_COPY.title}
                </p>
                <p className="text-xs text-[#839493] leading-relaxed">{CONNECTIONS_HUB_EMPTY_COPY.body}</p>
              </div>
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
      </div>

      <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-xs">
        <span className="text-[#839493] text-[10px]">
          {incomingCount > 0 ? 'REVIEW REQUESTS' : 'FIND MEMBERS'}
        </span>
        <button
          type="button"
          onClick={() => openConnections()}
          className="px-3 py-1.5 bg-[#00ffff]/15 hover:bg-[#00ffff]/25 text-[#00ffff] border border-[#00ffff]/50 text-[10px] font-bold chamfer-corner flex items-center gap-1 transition-all"
        >
          <span>{incomingCount > 0 ? 'OPEN INCOMING' : 'OPEN CONNECTIONS'}</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
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
      className={`chitin-card-inset p-2.5 border transition-colors chamfer-corner bg-[#070b0b]/60 ${
        incoming ? 'border-[#00ffff]/45' : 'border-[#3a4a49] hover:border-[#00ffff]/50'
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
            eyeTracking={false}
          />
        </Link>
        <Link
          to="/member/$profileId"
          params={{ profileId: resolveMemberPublicParam(member) }}
          className="min-w-0 flex-1"
        >
          <p className="font-grotesk text-xs font-bold text-[#dfe3e3] hover:text-[#00ffff] transition-colors truncate">
            {member.displayName}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-[#839493] truncate">
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
