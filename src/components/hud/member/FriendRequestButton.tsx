import React, { useState } from 'react'
import { UserPlus, UserCheck, UserX, Clock, Loader2 } from 'lucide-react'
import type { RelationshipState } from '@/lib/connections'
import { getAuthJWTToken } from '@/lib/jwt'
import {
  sendFriendRequestFn,
  respondFriendRequestFn,
  cancelFriendRequestFn,
  removeConnectionFn,
} from '@/lib/server/api'
import { useToast } from '@/components/ui/ToastProvider'
import { useHudPersist } from '@/hooks/useHudPersist'
import { Link } from '@tanstack/react-router'

export interface FriendRequestButtonProps {
  profileId: string
  relationship: RelationshipState
  pendingRequestId: string | null
  onRelationshipChange?: (next: {
    relationship: RelationshipState
    pendingRequestId: string | null
  }) => void
}

export const FriendRequestButton: React.FC<FriendRequestButtonProps> = ({
  profileId,
  relationship,
  pendingRequestId,
  onRelationshipChange,
}) => {
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const persist = useHudPersist()

  const run = async (label: string, fn: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    persist.begin('friend-request')
    try {
      await fn()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Connection action failed.')
    } finally {
      persist.end('friend-request')
      setBusy(false)
    }
  }

  if (relationship === 'self') {
    return (
      <Link
        to="/connections"
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-[#3a4a49] text-[#00c3ff] hover:border-[#00c3ff] chamfer-corner transition-colors"
      >
        Manage Connections
      </Link>
    )
  }

  if (relationship === 'friends') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-[#00ff9d]/40 text-[#00ff9d] bg-[#00ff9d]/10 chamfer-corner">
          <UserCheck className="w-3.5 h-3.5" />
          Friends
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run('remove', async () => {
              const token = await getAuthJWTToken()
              await removeConnectionFn({ data: { friendId: profileId, token: token ?? undefined } })
              onRelationshipChange?.({ relationship: 'none', pendingRequestId: null })
              toast.success('Connection removed.')
            })
          }
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-[#3a4a49] text-[#839493] hover:border-[#ff453a] hover:text-[#ff453a] chamfer-corner transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
          Remove
        </button>
      </div>
    )
  }

  if (relationship === 'pending_sent') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-[#00c3ff]/40 text-[#00c3ff] bg-[#00c3ff]/10 chamfer-corner">
          <Clock className="w-3.5 h-3.5" />
          Pending
        </span>
        {pendingRequestId && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run('cancel', async () => {
                const token = await getAuthJWTToken()
                await cancelFriendRequestFn({
                  data: { requestId: pendingRequestId, token: token ?? undefined },
                })
                onRelationshipChange?.({ relationship: 'none', pendingRequestId: null })
                toast.info('Friend request cancelled.')
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-[#3a4a49] text-[#839493] hover:border-[#ff453a] hover:text-[#ff453a] chamfer-corner transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    )
  }

  if (relationship === 'pending_received' && pendingRequestId) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run('accept', async () => {
              const token = await getAuthJWTToken()
              await respondFriendRequestFn({
                data: { requestId: pendingRequestId, action: 'accept', token: token ?? undefined },
              })
              onRelationshipChange?.({ relationship: 'friends', pendingRequestId: null })
              toast.success('You are now friends.')
            })
          }
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-[#00ff9d]/50 text-[#00ff9d] bg-[#00ff9d]/10 hover:bg-[#00ff9d]/20 chamfer-corner transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
          Accept
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run('decline', async () => {
              const token = await getAuthJWTToken()
              await respondFriendRequestFn({
                data: { requestId: pendingRequestId, action: 'reject', token: token ?? undefined },
              })
              onRelationshipChange?.({ relationship: 'none', pendingRequestId: null })
              toast.info('Friend request declined.')
            })
          }
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-[#3a4a49] text-[#839493] hover:border-[#ff453a] hover:text-[#ff453a] chamfer-corner transition-colors disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() =>
        run('send', async () => {
          const token = await getAuthJWTToken()
          const result = await sendFriendRequestFn({
            data: { recipientId: profileId, token: token ?? undefined },
          })
          onRelationshipChange?.({
            relationship: 'pending_sent',
            pendingRequestId: result.requestId,
          })
          toast.success('Friend request sent.')
        })
      }
      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-[#00c3ff]/50 text-[#00c3ff] bg-[#00c3ff]/10 hover:bg-[#00c3ff]/20 chamfer-corner transition-colors disabled:opacity-50"
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
      Add Friend
    </button>
  )
}
