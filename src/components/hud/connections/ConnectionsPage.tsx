import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Search, Users, Inbox, Send, Loader2 } from 'lucide-react'
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { MemberSearchRow } from '@/components/hud/connections/MemberSearchRow'
import { SynapticNearbyStrip } from '@/components/hud/connections/SynapticNearbyStrip'
import { FriendRequestButton } from '@/components/hud/member/FriendRequestButton'
import { getAuthJWTToken } from '@/lib/jwt'
import { listConnectionsFn, dismissSynapticNearbyFn } from '@/lib/server/api'
import { announceFriendRequestCount } from '@/hooks/usePendingFriendRequests'
import { useAuthSession } from '@/hooks/useAuthSession'
import { accountKeys, useAppQueryClient } from '@/lib/query/account'
import { FRESH } from '@/lib/query/content'
import {
  CONNECTIONS_FRIENDS_EMPTY,
  CONNECTIONS_INCOMING_EMPTY,
  CONNECTIONS_SENT_EMPTY,
  relationshipForMember,
  resolveConnectionsTab,
  SYNAPTIC_NEARBY_DISMISS_TOAST,
  type ConnectionsListView,
  type ConnectionsTab,
} from '@/lib/connections'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'
import { useToast } from '@/components/ui/ToastProvider'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { useMemberSearch } from '@/hooks/useMemberSearch'
import { MEMBER_SEARCH_MIN_CHARS } from '@/lib/member-search'
import { ReferralPanel } from './ReferralPanel'
import { LoadMoreButton } from '@/components/ui/LoadMoreButton'
import { MAX_PAGE_SIZE, PAGE_SIZES, mergeById } from '@/lib/pagination'

export { CONNECTIONS_FRIENDS_EMPTY, CONNECTIONS_INCOMING_EMPTY, CONNECTIONS_SENT_EMPTY }

/**
 * `view` picks what the Friends page shows: `friends` is search, invites,
 * suggestions and the friends list; `requests` is Incoming and Sent.
 * `all` (the default) shows everything with its own title.
 */
export type ConnectionsPageView = 'all' | 'friends' | 'requests'

export const ConnectionsPage: React.FC<{
  tab?: ConnectionsTab
  onTabChange?: (tab: ConnectionsTab) => void
  view?: ConnectionsPageView
}> = ({ tab: tabProp, onTabChange, view = 'all' }) => {
  const session = useAuthSession()
  const queryClient = useAppQueryClient()
  // The page's own read (with suggestions and every loaded friend), kept between visits.
  const pageKey = accountKeys.connections(session.userId ?? '', 'page')
  const pageKeyHash = JSON.stringify(pageKey)
  const [connections, setConnections] = useState<ConnectionsListView | null>(
    () => queryClient.getQueryData<ConnectionsListView>(pageKey) ?? null,
  )
  const [hiddenSuggestionIds, setHiddenSuggestionIds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(() => !queryClient.getQueryData(pageKey))
  const { toast } = useToast()
  const { results, searching } = useMemberSearch(query, true)

  const incomingCount = connections?.incoming.length ?? 0
  const resolvedTab = resolveConnectionsTab(tabProp, incomingCount)
  const tab: ConnectionsTab =
    view === 'friends' ? 'friends' : view === 'requests' && resolvedTab === 'friends' ? 'incoming' : resolvedTab
  const showSearch = view !== 'requests'

  const [loadingMoreFriends, setLoadingMoreFriends] = useState(false)
  // After a change, reload as many friends as are already on screen so the list does not shrink.
  const loadedFriendsRef = useRef(connections?.friends.length ?? 0)

  /** `force` skips the cache, after this member changed something. */
  const load = useCallback(
    async (force: boolean) => {
      try {
        const next = await queryClient.fetchQuery({
          queryKey: JSON.parse(pageKeyHash) as readonly unknown[],
          queryFn: async () => {
            const token = await getAuthJWTToken()
            return listConnectionsFn({
              data: {
                token: token ?? undefined,
                includeSuggestions: true,
                friendsLimit: Math.min(Math.max(loadedFriendsRef.current, PAGE_SIZES.friends), MAX_PAGE_SIZE),
              },
            })
          },
          staleTime: force ? 0 : FRESH.panel,
        })
        loadedFriendsRef.current = next?.friends.length ?? 0
        setConnections(next)
        announceFriendRequestCount(next?.incoming?.length ?? 0)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not load connections.')
      } finally {
        setLoading(false)
      }
    },
    [toast, queryClient, pageKeyHash],
  )
  const refresh = useCallback(() => load(true), [load])

  useEffect(() => {
    void load(false)
  }, [load])

  const loadMoreFriends = async () => {
    const offset = connections?.nextFriendsOffset
    if (offset == null) return
    setLoadingMoreFriends(true)
    try {
      const token = await getAuthJWTToken()
      const next = await listConnectionsFn({
        data: { token: token ?? undefined, friendsOffset: offset },
      })
      setConnections((current) => {
        if (!current) return next
        const friends = mergeById(current.friends, next.friends)
        loadedFriendsRef.current = friends.length
        const merged = {
          ...current,
          friends,
          friendCount: next.friendCount ?? current.friendCount,
          nextFriendsOffset: next.nextFriendsOffset ?? null,
        }
        queryClient.setQueryData(pageKey, merged)
        return merged
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load more friends.')
    } finally {
      setLoadingMoreFriends(false)
    }
  }

  const hideSuggestion = (memberId: string) => {
    setHiddenSuggestionIds((ids) => (ids.includes(memberId) ? ids : [...ids, memberId]))
  }

  const dismissSuggestion = async (memberId: string) => {
    hideSuggestion(memberId)
    try {
      const token = await getAuthJWTToken()
      await dismissSynapticNearbyFn({
        data: { memberId, token: token ?? undefined },
      })
      toast.info(SYNAPTIC_NEARBY_DISMISS_TOAST)
      void queryClient.invalidateQueries({ queryKey: pageKey, exact: true })
    } catch (err) {
      setHiddenSuggestionIds((ids) => ids.filter((id) => id !== memberId))
      toast.error(err instanceof Error ? err.message : 'Could not hide that suggestion.')
    }
  }

  const suggested = (connections?.suggested ?? []).filter((member) => !hiddenSuggestionIds.includes(member.id))

  const selectTab = (next: ConnectionsTab) => {
    onTabChange?.(next)
  }

  const allTabs: Array<{
    id: ConnectionsTab
    label: string
    count: number
    icon: typeof Users
  }> = [
    {
      id: 'friends',
      label: 'Friends',
      count: connections?.friendCount ?? connections?.friends.length ?? 0,
      icon: Users,
    },
    { id: 'incoming', label: 'Incoming', count: incomingCount, icon: Inbox },
    {
      id: 'sent',
      label: 'Sent',
      count: connections?.outgoing.length ?? 0,
      icon: Send,
    },
  ]
  const tabs = view === 'friends' ? [] : view === 'requests' ? allTabs.filter((t) => t.id !== 'friends') : allTabs

  const rows =
    tab === 'friends'
      ? (connections?.friends ?? [])
      : tab === 'incoming'
        ? (connections?.incoming ?? [])
        : (connections?.outgoing ?? [])

  const emptyCopy =
    tab === 'friends'
      ? CONNECTIONS_FRIENDS_EMPTY
      : tab === 'incoming'
        ? CONNECTIONS_INCOMING_EMPTY
        : CONNECTIONS_SENT_EMPTY

  return (
    <div
      className={
        view === 'all'
          ? 'rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4 lg:p-5 space-y-4 font-sans relative'
          : 'space-y-4 font-sans relative'
      }
    >
      {showSearch && (
        <div className="space-y-3">
          {view === 'all' ? (
            <HudTitlePanel
              treatment="integrated"
              title="Connections"
              description={`Find members by name, username, or ID (at least ${MEMBER_SEARCH_MIN_CHARS} characters).`}
            />
          ) : (
            <p className="text-xs text-ink-muted">
              Find members by name, username, or ID (at least {MEMBER_SEARCH_MIN_CHARS} characters).
            </p>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or username…"
              className="w-full pl-10 pr-3 py-2.5 bg-abyss border border-line-subtle text-sm text-ink placeholder:text-ink-muted focus:outline-hidden focus:border-cyan-glow rounded-control"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-glow animate-spin" />
            )}
          </div>
          {results.length > 0 && (
            <ul className="space-y-2">
              {results.map((member) => {
                const { relationship, pendingRequestId } = relationshipForMember(connections, member.id, member.isFriend)
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
            <p className="text-xs text-ink-muted text-center py-3">
              No members matched that search.
            </p>
          )}
        </div>
      )}

      {showSearch && <ReferralPanel />}

      {showSearch && (
        <SynapticNearbyStrip
          members={suggested}
          onRequested={(memberId) => {
            hideSuggestion(memberId)
            void refresh()
          }}
          onDismiss={(memberId) => void dismissSuggestion(memberId)}
        />
      )}

      <div className="space-y-3">
        {tabs.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-line-subtle pb-3">
            {tabs.map(({ id, label, count, icon: Icon }) => {
              const pendingIncoming = id === 'incoming' && count > 0
              const selected = tab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectTab(id)}
                  aria-pressed={selected}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-2xs font-semibold border rounded-control transition-colors ${
                    selected
                      ? 'border-cyan-glow text-cyan-glow bg-cyan-glow/10'
                      : pendingIncoming
                        ? 'border-cyan-glow/50 text-cyan-glow bg-cyan-glow/10'
                        : 'border-line-subtle text-ink-muted hover:border-cyan-glow/50'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                  <span className="tabular-nums opacity-80">{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {view === 'friends' && (
          <h2 className="eyebrow">
            Your friends <span className="tabular-nums">{connections?.friendCount ?? connections?.friends.length ?? 0}</span>
          </h2>
        )}

        {loading ? (
          <div className="py-10 text-center text-xs text-ink-muted">Loading connections…</div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-xs text-ink-muted">{emptyCopy}</div>
        ) : (
          <ul className="space-y-2">
            {rows.map((member) => {
              const { relationship, pendingRequestId } = relationshipForMember(connections, member.id)
              return (
                <li
                  key={`${tab}-${member.id}`}
                  className={`chitin-card-inset p-3 border flex flex-wrap items-center gap-3 rounded-card ${
                    tab === 'incoming' ? 'border-cyan-glow/45' : 'border-line-subtle'
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
                      className="font-semibold text-sm text-ink hover:text-cyan-glow truncate block"
                    >
                      {member.displayName}
                    </Link>
                    <div className="eyebrow">
                      Stage {member.stage} · {member.stageLabel}
                    </div>
                    {tab === 'incoming' && (
                      <div className="eyebrow mt-0.5">Incoming request</div>
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
                      className="px-2.5 py-1.5 text-2xs font-semibold border border-cyan-glow/40 text-cyan-glow rounded-control"
                    >
                      View
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {!loading && tab === 'friends' && connections?.nextFriendsOffset != null && (
          <LoadMoreButton
            label="Load more friends"
            loading={loadingMoreFriends}
            testId="friends-load-more"
            onClick={() => void loadMoreFriends()}
          />
        )}
      </div>
    </div>
  )
}
