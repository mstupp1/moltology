import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Search, Users, Inbox, Send, Loader2 } from 'lucide-react'
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import { FriendRequestButton } from '@/components/hud/member/FriendRequestButton'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { getAuthJWTToken } from '@/lib/jwt'
import {
  listConnectionsFn,
  searchMembersFn,
  respondFriendRequestFn,
  cancelFriendRequestFn,
  removeConnectionFn,
} from '@/lib/server/api'
import type { ConnectionsListView, MemberSearchResult } from '@/lib/connections'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'
import { useToast } from '@/components/ui/ToastProvider'
import { useHudPersist } from '@/hooks/useHudPersist'

type TabId = 'friends' | 'incoming' | 'sent'

export const ConnectionsPage: React.FC = () => {
  const [tab, setTab] = useState<TabId>('friends')
  const [connections, setConnections] = useState<ConnectionsListView | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MemberSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const persist = useHudPersist()
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const token = await getAuthJWTToken()
        const next = await searchMembersFn({ data: { query: q, token: token ?? undefined } })
        setResults(next)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Search failed.')
      } finally {
        setSearching(false)
      }
    }, 280)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [query, toast])

  const withPersist = async (fn: () => Promise<void>) => {
    persist.begin('connections')
    try {
      await fn()
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed.')
    } finally {
      persist.end('connections')
    }
  }

  const tabs: Array<{ id: TabId; label: string; count: number; icon: typeof Users }> = [
    { id: 'friends', label: 'Friends', count: connections?.friends.length ?? 0, icon: Users },
    { id: 'incoming', label: 'Incoming', count: connections?.incoming.length ?? 0, icon: Inbox },
    { id: 'sent', label: 'Sent', count: connections?.outgoing.length ?? 0, icon: Send },
  ]

  const rows =
    tab === 'friends'
      ? connections?.friends ?? []
      : tab === 'incoming'
        ? connections?.incoming ?? []
        : connections?.outgoing ?? []

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
          <p className="text-xs text-[#839493] mt-0.5">Search by larva id (at least 2 characters).</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#839493]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search larva ids…"
            className="w-full pl-10 pr-3 py-2.5 bg-[#050808] border border-[#3a4a49] text-sm text-[#dfe3e3] placeholder:text-[#4a5a59] focus:outline-none focus:border-[#00c3ff] chamfer-corner"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00c3ff] animate-spin" />
          )}
        </div>
        {results.length > 0 && (
          <ul className="space-y-2">
            {results.map((member) => {
              const isFriend = connections?.friends.some((f) => f.id === member.id)
              const incoming = connections?.incoming.find((f) => f.id === member.id)
              const outgoing = connections?.outgoing.find((f) => f.id === member.id)
              const relationship = isFriend
                ? 'friends'
                : incoming
                  ? 'pending_received'
                  : outgoing
                    ? 'pending_sent'
                    : 'none'
              const pendingRequestId =
                incoming?.requestId ?? outgoing?.requestId ?? null

              return (
              <li
                key={member.id}
                className="chitin-card-inset p-3 border border-[#3a4a49] flex items-center gap-3 chamfer-corner"
              >
                <LobsterAvatarPortrait
                  config={(member.avatarConfig as LobsterAvatarConfig | null) ?? null}
                  className="w-12 h-12 shrink-0"
                  size={128}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to="/member/$profileId"
                    params={{ profileId: member.id }}
                    className="font-bold text-sm text-[#dfe3e3] hover:text-[#00c3ff] truncate block"
                  >
                    {member.larvaId}
                  </Link>
                  <div className="text-[10px] uppercase tracking-wider text-[#839493]">
                    Stage {member.stage} · {member.stageLabel}
                  </div>
                </div>
                <FriendRequestButton
                  profileId={member.id}
                  relationship={relationship}
                  pendingRequestId={pendingRequestId}
                  onRelationshipChange={() => void refresh()}
                />
              </li>
              )
            })}
          </ul>
        )}
        {query.trim().length >= 2 && !searching && results.length === 0 && (
          <p className="text-xs text-[#839493] text-center py-3">No members matched that search.</p>
        )}
      </div>

      <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3">
        <div className="flex flex-wrap gap-2 border-b border-[#3a4a49] pb-3">
          {tabs.map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border chamfer-corner transition-colors ${
                tab === id
                  ? 'border-[#00c3ff] text-[#00c3ff] bg-[#00c3ff]/10'
                  : 'border-[#3a4a49] text-[#839493] hover:border-[#00c3ff]/50'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
              <span className="tabular-nums opacity-80">{count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs text-[#839493]">Loading connections…</div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#839493]">
            {tab === 'friends' && 'No friends yet. Search above to find members.'}
            {tab === 'incoming' && 'No incoming friend requests.'}
            {tab === 'sent' && 'No outgoing friend requests.'}
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((member) => (
              <li
                key={`${tab}-${member.id}`}
                className="chitin-card-inset p-3 border border-[#3a4a49] flex flex-wrap items-center gap-3 chamfer-corner"
              >
                <LobsterAvatarPortrait
                  config={(member.avatarConfig as LobsterAvatarConfig | null) ?? null}
                  className="w-12 h-12 shrink-0"
                  size={128}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to="/member/$profileId"
                    params={{ profileId: member.id }}
                    className="font-bold text-sm text-[#dfe3e3] hover:text-[#00c3ff] truncate block"
                  >
                    {member.larvaId}
                  </Link>
                  <div className="text-[10px] uppercase tracking-wider text-[#839493]">
                    Stage {member.stage} · {member.stageLabel}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tab === 'incoming' && member.requestId && (
                    <>
                      <button
                        type="button"
                        className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#00ff9d]/50 text-[#00ff9d] chamfer-corner"
                        onClick={() =>
                          withPersist(async () => {
                            const token = await getAuthJWTToken()
                            await respondFriendRequestFn({
                              data: {
                                requestId: member.requestId!,
                                action: 'accept',
                                token: token ?? undefined,
                              },
                            })
                            toast.success('Friend request accepted.')
                          })
                        }
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#3a4a49] text-[#839493] hover:border-[#ff453a] hover:text-[#ff453a] chamfer-corner"
                        onClick={() =>
                          withPersist(async () => {
                            const token = await getAuthJWTToken()
                            await respondFriendRequestFn({
                              data: {
                                requestId: member.requestId!,
                                action: 'reject',
                                token: token ?? undefined,
                              },
                            })
                            toast.info('Friend request declined.')
                          })
                        }
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {tab === 'sent' && member.requestId && (
                    <button
                      type="button"
                      className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#3a4a49] text-[#839493] hover:border-[#ff453a] hover:text-[#ff453a] chamfer-corner"
                      onClick={() =>
                        withPersist(async () => {
                          const token = await getAuthJWTToken()
                          await cancelFriendRequestFn({
                            data: { requestId: member.requestId!, token: token ?? undefined },
                          })
                          toast.info('Friend request cancelled.')
                        })
                      }
                    >
                      Cancel
                    </button>
                  )}
                  {tab === 'friends' && (
                    <button
                      type="button"
                      className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#3a4a49] text-[#839493] hover:border-[#ff453a] hover:text-[#ff453a] chamfer-corner"
                      onClick={() =>
                        withPersist(async () => {
                          const token = await getAuthJWTToken()
                          await removeConnectionFn({
                            data: { friendId: member.id, token: token ?? undefined },
                          })
                          toast.info('Connection removed.')
                        })
                      }
                    >
                      Remove
                    </button>
                  )}
                  <Link
                    to="/member/$profileId"
                    params={{ profileId: member.id }}
                    className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#00c3ff]/40 text-[#00c3ff] chamfer-corner"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
