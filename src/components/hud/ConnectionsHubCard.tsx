import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronRight, Inbox, Users } from 'lucide-react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { listConnectionsFn } from '@/lib/server/api'
import {
  pickConnectionsHubPreview,
  type ConnectionsHubPreviewItem,
  type ConnectionsListView,
} from '@/lib/connections'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'

export const CONNECTIONS_HUB_TITLE = 'CONNECTIONS'
export const CONNECTIONS_HUB_SUBTITLE = 'Find members and keep your circle close.'
export const CONNECTIONS_HUB_EMPTY_COPY = {
  title: 'No connections yet',
  body: 'Search members to send a request.',
} as const

const EMPTY_CONNECTIONS: ConnectionsListView = {
  friends: [],
  incoming: [],
  outgoing: [],
}

function ConnectionsHubListGhost() {
  return (
    <div className="space-y-2" aria-hidden="true">
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 flex-1 border border-[#3a4a49]/50 bg-[#070b0b]/40 chamfer-corner" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="chitin-card-inset h-12 border border-[#3a4a49]/50 bg-[#070b0b]/40 chamfer-corner" />
      ))}
    </div>
  )
}

function CountChip({ label, count }: { label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-[#3a4a49] text-[#839493] chamfer-corner bg-[#070b0b]/60">
      {label}
      <span className="tabular-nums text-[#00ffff]">{count}</span>
    </span>
  )
}

export function ConnectionsHubCard() {
  const navigate = useNavigate()
  const session = useAuthSession()
  const userId = session.userId
  const isAuthPending = session.isPending

  const [connections, setConnections] = useState<ConnectionsListView>(EMPTY_CONNECTIONS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadConnections() {
      if (isAuthPending) return
      if (!userId) {
        if (isMounted) {
          setConnections(EMPTY_CONNECTIONS)
          setIsLoading(false)
        }
        return
      }

      try {
        const token = await getAuthJWTToken()
        const next = await listConnectionsFn({ data: { token: token ?? undefined } })
        if (isMounted) {
          setConnections(next ?? EMPTY_CONNECTIONS)
        }
      } catch {
        if (isMounted) setConnections(EMPTY_CONNECTIONS)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadConnections()
    return () => {
      isMounted = false
    }
  }, [userId, isAuthPending])

  const preview = pickConnectionsHubPreview(connections, 3)
  const friendCount = connections.friends.length
  const incomingCount = connections.incoming.length
  const sentCount = connections.outgoing.length

  return (
    <div
      className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3.5 sm:space-y-4 h-full flex flex-col justify-between"
      data-testid="connections-hub-card"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#3a4a49] pb-3">
          <div>
            <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00ffff]" />
              {CONNECTIONS_HUB_TITLE}
            </h2>
            <p className="text-xs text-[#839493] mt-0.5">{CONNECTIONS_HUB_SUBTITLE}</p>
          </div>
        </div>

        <HudGhostWidget isLoading={isLoading} skeleton={<ConnectionsHubListGhost />}>
          <div className="space-y-2.5">
            <div className="flex flex-wrap gap-1.5">
              <CountChip label="Friends" count={friendCount} />
              <CountChip label="Incoming" count={incomingCount} />
              <CountChip label="Sent" count={sentCount} />
            </div>

            {preview.length === 0 ? (
              <div className="p-6 text-center space-y-1.5">
                <p className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-wide uppercase">
                  {CONNECTIONS_HUB_EMPTY_COPY.title}
                </p>
                <p className="text-xs text-[#839493] leading-relaxed">{CONNECTIONS_HUB_EMPTY_COPY.body}</p>
              </div>
            ) : (
              <ul className="space-y-2 font-sans">
                {preview.map((member) => (
                  <HubConnectionRow key={`${member.kind}-${member.id}`} member={member} />
                ))}
              </ul>
            )}
          </div>
        </HudGhostWidget>
      </div>

      <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-xs">
        <span className="text-[#839493] text-[10px]">FIND MEMBERS</span>
        <button
          type="button"
          onClick={() => navigate({ to: '/connections' })}
          className="px-3 py-1.5 bg-[#00ffff]/15 hover:bg-[#00ffff]/25 text-[#00ffff] border border-[#00ffff]/50 text-[10px] font-bold chamfer-corner flex items-center gap-1 transition-all"
        >
          <span>OPEN CONNECTIONS</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function HubConnectionRow({ member }: { member: ConnectionsHubPreviewItem }) {
  return (
    <li className="chitin-card-inset p-2.5 border border-[#3a4a49] hover:border-[#00ffff]/50 transition-colors chamfer-corner bg-[#070b0b]/60">
      <Link
        to="/member/$profileId"
        params={{ profileId: resolveMemberPublicParam(member) }}
        className="flex items-center justify-between gap-2 min-w-0"
      >
        <div className="min-w-0">
          <p className="font-grotesk text-xs font-bold text-[#dfe3e3] hover:text-[#00ffff] transition-colors truncate">
            {member.displayName}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-[#839493] truncate">
            Stage {member.stage} · {member.stageLabel}
          </p>
        </div>
        {member.kind === 'incoming' ? (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#00ffff] bg-[#00ffff]/10 border border-[#00ffff]/40 px-1.5 py-0.5 chamfer-corner shrink-0">
            <Inbox className="w-2.5 h-2.5" />
            Incoming
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#839493] bg-[#070b0b] border border-[#3a4a49] px-1.5 py-0.5 chamfer-corner shrink-0">
            <Users className="w-2.5 h-2.5" />
            Friend
          </span>
        )}
      </Link>
    </li>
  )
}
