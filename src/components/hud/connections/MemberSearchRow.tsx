import React from 'react'
import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import { FriendRequestButton } from '@/components/hud/member/FriendRequestButton'
import type { MemberSearchResult, RelationshipState } from '@/lib/connections'
import { SYNAPTIC_NEARBY_DISMISS_LABEL } from '@/lib/connections'
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
  onDismiss,
}: {
  member: MemberSearchResult
  relationship: RelationshipState
  pendingRequestId: string | null
  onRelationshipChange?: () => void
  compact?: boolean
  caption?: string
  allowRemove?: boolean
  onDismiss?: () => void
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
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={SYNAPTIC_NEARBY_DISMISS_LABEL}
          className="shrink-0 p-1.5 text-[#839493] hover:text-[#dfe3e3] hover:border-[#3a4a49] border border-transparent chamfer-corner transition-colors"
        >
          <X className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        </button>
      )}
    </li>
  )
}
