import React from 'react'
import { Radio } from 'lucide-react'
import { MemberSearchRow } from '@/components/hud/connections/MemberSearchRow'
import {
  SYNAPTIC_NEARBY_HINT,
  SYNAPTIC_NEARBY_LIMIT,
  SYNAPTIC_NEARBY_TITLE,
  type ConnectionMemberSummary,
} from '@/lib/connections'

export function SynapticNearbyStrip({
  members,
  onRequested,
  onDismiss,
}: {
  members: ConnectionMemberSummary[]
  onRequested: (memberId: string) => void
  onDismiss: (memberId: string) => void
}) {
  if (members.length === 0) return null

  const visible = members.slice(0, SYNAPTIC_NEARBY_LIMIT)

  return (
    <div className="chitin-card p-3 sm:p-4 lg:p-5 rounded-card shadow-2xl space-y-3">
      <div className="border-b border-line-subtle pb-3">
        <h2 className="font-grotesk text-sm font-semibold text-ink flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-glow" />
          {SYNAPTIC_NEARBY_TITLE}
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">{SYNAPTIC_NEARBY_HINT}</p>
      </div>
      <ul className="space-y-2">
        {visible.map((member) => (
          <MemberSearchRow
            key={member.id}
            member={member}
            relationship="none"
            pendingRequestId={null}
            compact
            allowRemove={false}
            onRelationshipChange={() => onRequested(member.id)}
            onDismiss={() => onDismiss(member.id)}
          />
        ))}
      </ul>
    </div>
  )
}
