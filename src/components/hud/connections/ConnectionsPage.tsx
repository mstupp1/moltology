import React, { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Search, Users, Inbox, Send, Loader2 } from 'lucide-react'
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { MemberSearchRow } from '@/components/hud/connections/MemberSearchRow'
import { FriendRequestButton } from '@/components/hud/member/FriendRequestButton'
import { getAuthJWTToken } from '@/lib/jwt'
import { listConnectionsFn } from '@/lib/server/api'
import {
  CONNECTIONS_FRIENDS_EMPTY,
  CONNECTIONS_INCOMING_EMPTY,
  CONNECTIONS_SENT_EMPTY,
  relationshipForMember,
  resolveConnectionsTab,
  type ConnectionsListView,
  type ConnectionsTab,
} from '@/lib/connections'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'
import { useToast } from '@/components/ui/ToastProvider'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { useMemberSearch } from '@/hooks/useMemberSearch'
import { MEMBER_SEARCH_MIN_CHARS } from '@/lib/member-search'

export {
  CONNECTIONS_FRIENDS_EMPTY,
  CONNECTIONS_INCOMING_EMPTY,
  CONNECTIONS_SENT_EMPTY,
}

export const ConnectionsPage: React.FC<{
  tab?: ConnectionsTab
  onTabChange?: (tab: ConnectionsTab) => void
}> = ({ tab: tabProp, onTabChange }) => {
  const [connections, setConnections] = useState<ConnectionsListView | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { results, searching } = useMemberSearch(query, true)

  const incomingCount = connections?.incoming.length ?? 0
  const tab = resolveConnectionsTab(tabProp, incomingCount)

  const refresh = useCallback(async () => {
    try {
      const token = await getAuthJWTToken()
      const next = await listConnectionsFn({ data: { token: token ?? undefined } })
      setConnections(next)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load connections.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const selectTab = (next: ConnectionsTab) => {
    onTabChange?.(next)
  }

  const tabs: Array<{ id: ConnectionsTab; label: string; count: number; icon: typeof Users }> = [
    { id: 'friends', label: 'Friends', count: connections?.friends.length ?? 0, icon: Users },
    { id: 'incoming', label: 'Incoming', count: incomingCount, icon: Inbox },
    { id: 'sent', label: 'Sent', count: connections?.outgoing.length ?? 0, icon: Send },
  ]

  const rows =
    tab === 'friends'
      ? connections?.friends ?? []
      : tab === 'incoming'
        ? connections?.incoming ?? []
        : connections?.outgoing ?? []

  const emptyCopy =
    tab === 'friends'
      ? CONNECTIONS_FRIENDS_EMPTY
      : tab === 'incoming'
        ? CONNECTIONS_INCOMING_EMPTY
        : CONNECTIONS_SENT_EMPTY

  return (
    <div className="space-y-3.5 sm:space-y-5 font-sans relative">
      <HudTitlePanel
        accent="teal"
        title="Connections"
        description="Find members, send friend requests, and keep your circle close."
      />

      <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3">
        <div className="border-b border-[#3a4a49] pb-3">
          <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase flex items-center gap-2">
            <Search className="w-4 h-4 text-[#00c3ff]" />
            Search Members
          </h2>
          <p className="text-xs text-[#839493] mt-0.5">
            Search by designation, larva unit, or name (at least {MEMBER_SEARCH_MIN_CHARS} characters).
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#839493]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search designations, larva units, or names…"
            className="w-full pl-10 pr-3 py-2.5 bg-[#050808] border border-[#3a4a49] text-sm text-[#dfe3e3] placeholder:text-[#4a5a59] focus:outline-none focus:border-[#00c3ff] chamfer-corner"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00c3ff] animate-spin" />
          )}
        </div>
        {results.length > 0 && (
          <ul className="space-y-2">
            {results.map((member) => {
              const { relationship, pendingRequestId } = relationshipForMember(connections, member.id)
              return (
                <MemberSearchRow
                  key={member.id}
                  member={member}
                  relationship={relationship}
                  pendingRequestId={pendingRequestId}
                  onRelationshipChange={() => void refresh()}
                />
              )
            })}
          </ul>
        )}
        {query.trim().length >= MEMBER_SEARCH_MIN_CHARS && !searching && results.length === 0 && (
          <p className="text-xs text-[#839493] text-center py-3">
            The trench stayed quiet. No designation, larva unit, or name surfaced for that call.
          </p>
        )}
      </div>

      <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3">
        <div className="flex flex-wrap gap-2 border-b border-[#3a4a49] pb-3">
          {tabs.map(({ id, label, count, icon: Icon }) => {
            const pendingIncoming = id === 'incoming' && count > 0
            const selected = tab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                aria-pressed={selected}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border chamfer-corner transition-colors ${
                  selected
                    ? 'border-[#00c3ff] text-[#00c3ff] bg-[#00c3ff]/10'
                    : pendingIncoming
                      ? 'border-[#00ffff]/50 text-[#00ffff] bg-[#00ffff]/10'
                      : 'border-[#3a4a49] text-[#839493] hover:border-[#00c3ff]/50'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
                <span className="tabular-nums opacity-80">{count}</span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs text-[#839493]">Loading connections…</div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#839493]">{emptyCopy}</div>
        ) : (
          <ul className="space-y-2">
            {rows.map((member) => {
              const { relationship, pendingRequestId } = relationshipForMember(connections, member.id)
              return (
                <li
                  key={`${tab}-${member.id}`}
                  className={`chitin-card-inset p-3 border flex flex-wrap items-center gap-3 chamfer-corner ${
                    tab === 'incoming' ? 'border-[#00ffff]/45' : 'border-[#3a4a49]'
                  }`}
                >
                  <LobsterAvatarPortrait
                    config={(member.avatarConfig as LobsterAvatarConfig | null) ?? null}
                    className="w-12 h-12 shrink-0"
                    size={128}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/member/$profileId"
                      params={{ profileId: resolveMemberPublicParam(member) }}
                      className="font-bold text-sm text-[#dfe3e3] hover:text-[#00c3ff] truncate block"
                    >
                      {member.displayName}
                    </Link>
                    <div className="text-[10px] uppercase tracking-wider text-[#839493]">
                      Stage {member.stage} · {member.stageLabel}
                    </div>
                    {tab === 'incoming' && (
                      <div className="text-[10px] uppercase tracking-wider text-[#00ffff] mt-0.5">
                        Incoming request
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <FriendRequestButton
                      profileId={member.id}
                      relationship={relationship}
                      pendingRequestId={pendingRequestId}
                      onRelationshipChange={() => void refresh()}
                    />
                    <Link
                      to="/member/$profileId"
                      params={{ profileId: resolveMemberPublicParam(member) }}
                      className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#00c3ff]/40 text-[#00c3ff] chamfer-corner"
                    >
                      View
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
