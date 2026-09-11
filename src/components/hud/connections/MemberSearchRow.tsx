import React from 'react'
import { Link } from '@tanstack/react-router'
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import { FriendRequestButton } from '@/components/hud/member/FriendRequestButton'
import type { MemberSearchResult, RelationshipState } from '@/lib/connections'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'
import { resolveMemberPublicParam } from '@/lib/member-handle'

export function MemberSearchRow({
  member,
  relationship,
  pendingRequestId,
  onRelationshipChange,
  compact = false,
  caption,
  allowRemove = true,
}: {
  member: MemberSearchResult
  relationship: RelationshipState
  pendingRequestId: string | null
  onRelationshipChange?: () => void
  compact?: boolean
  caption?: string
  allowRemove?: boolean
}) {
  return (
    <li
      className={`chitin-card-inset border border-[#3a4a49] flex items-center gap-3 chamfer-corner ${
        compact ? 'p-2.5' : 'p-3'
      }`}
    >
      <LobsterAvatarPortrait
        config={(member.avatarConfig as LobsterAvatarConfig | null) ?? null}
        className={compact ? 'w-9 h-9 shrink-0' : 'w-12 h-12 shrink-0'}
        size={compact ? 96 : 128}
      />
      <div className="min-w-0 flex-1">
        <Link
          to="/member/$profileId"
          params={{ profileId: resolveMemberPublicParam(member) }}
          className={`font-bold text-[#dfe3e3] hover:text-[#00c3ff] truncate block ${compact ? 'text-xs' : 'text-sm'}`}
        >
          {member.displayName}
        </Link>
        <div className="text-[10px] uppercase tracking-wider text-[#839493]">
          Stage {member.stage} · {member.stageLabel}
          {caption ? ` · ${caption}` : ''}
        </div>
      </div>
      <FriendRequestButton
        profileId={member.id}
        relationship={relationship}
        pendingRequestId={pendingRequestId}
        compact={compact}
        allowRemove={allowRemove}
        onRelationshipChange={() => onRelationshipChange?.()}
      />
    </li>
  )
}
