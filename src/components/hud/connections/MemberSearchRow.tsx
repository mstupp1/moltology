import React from 'react'
import { Link } from '@tanstack/react-router'
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import { FriendRequestButton } from '@/components/hud/member/FriendRequestButton'
import type { MemberSearchResult, RelationshipState } from '@/lib/connections'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'

export function MemberSearchRow({
  member,
  relationship,
  pendingRequestId,
  onRelationshipChange,
}: {
  member: MemberSearchResult
  relationship: RelationshipState
  pendingRequestId: string | null
  onRelationshipChange?: () => void
}) {
  return (
    <li className="chitin-card-inset p-3 border border-[#3a4a49] flex items-center gap-3 chamfer-corner">
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
          {member.displayName}
        </Link>
        <div className="text-[10px] uppercase tracking-wider text-[#839493]">
          Stage {member.stage} · {member.stageLabel}
        </div>
      </div>
      <FriendRequestButton
        profileId={member.id}
        relationship={relationship}
        pendingRequestId={pendingRequestId}
        onRelationshipChange={() => onRelationshipChange?.()}
      />
    </li>
  )
}
