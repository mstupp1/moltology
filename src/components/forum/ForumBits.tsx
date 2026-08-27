import React, { useEffect, useState } from 'react'
import { ArrowBigUp, ShieldCheck, Cpu, Terminal, Flame, Radio, MessageSquare, Pin } from 'lucide-react'
import { toggleForumTopicVoteFn, toggleForumPostVoteFn } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { peekForumVote, resolveForumVoted, writeForumVote } from '@/lib/forum-vote-cache'
import { useHudPersist } from '@/hooks/useHudPersist'
import { useToast } from '@/components/ui/ToastProvider'
import { useForumAuth } from './ForumShell'

const STAGE_COLORS: Record<number, string> = {
  4: 'bg-[#00ffff]/10 text-[#00ffff] border-[#00ffff]/60',
  3: 'bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/60',
  2: 'bg-[#ffb703]/10 text-[#ffb703] border-[#ffb703]/60',
  1: 'bg-[#171c1c] text-[#ff5540] border-[#ff5540]/60',
}

export function StageBadge({ stage }: { stage: number }) {
  const normalized = Math.max(1, Math.min(4, stage))
  const cls = STAGE_COLORS[normalized] || STAGE_COLORS[1]
  return (
    <span
      className={`inline-block text-[10px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.2 chamfer-corner border ${cls}`}
    >
      STAGE {normalized}
    </span>
  )
}

export function CategoryIcon({ icon, color }: { icon: string; color?: string }) {
  const cls = 'w-4 h-4 shrink-0'
  const style = color ? { color } : undefined
  switch (icon) {
    case 'ShieldCheck':
      return <ShieldCheck className={cls} style={style} />
    case 'Cpu':
      return <Cpu className={cls} style={style} />
    case 'Terminal':
      return <Terminal className={cls} style={style} />
    case 'Flame':
      return <Flame className={cls} style={style} />
    case 'Radio':
      return <Radio className={cls} style={style} />
    default:
      return <MessageSquare className={cls} style={style} />
  }
}

export function PinBadge() {
  return (
    <span className="text-[9px] font-sans bg-[#ff5540]/15 text-[#ff5540] border border-[#ff5540]/50 px-1.5 py-0.2 font-bold chamfer-corner flex items-center gap-1">
      <Pin className="w-2.5 h-2.5" /> PINNED
    </span>
  )
}

interface VoteButtonProps {
  count: number
  /** `undefined` = server has not hydrated vote state yet; use session cache for instant paint. */
  voted?: boolean
  targetId: string
  targetType: 'topic' | 'post'
  onResult?: (res: { upvotes: number; voted: boolean }) => void
  size?: 'sm' | 'md' | 'inline'
}

export function VoteButton({
  count,
  voted,
  targetId,
  targetType,
  onResult,
  size = 'md',
}: VoteButtonProps) {
  const { isAuthenticated, isPending, userId, openAuth } = useForumAuth()
  const persist = useHudPersist()
  const [local, setLocal] = useState(() => ({
    count,
    voted: resolveForumVoted(voted, userId, targetId),
  }))
  const [busy, setBusy] = useState(false)

  let toast: { warning: (m: string, o?: any) => string }
  try {
    toast = useToast().toast
  } catch {
    toast = { warning: () => '' }
  }

  useEffect(() => {
    if (typeof voted === 'boolean') {
      setLocal({ count, voted })
      writeForumVote(userId, targetId, voted)
      return
    }
    const cached = peekForumVote(userId, targetId)
    setLocal({
      count,
      voted: cached === true,
    })
  }, [count, voted, userId, targetId])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy || isPending) return
    if (!isAuthenticated) {
      openAuth('signup')
      return
    }
    const rollback = { count: local.count, voted: local.voted }
    const optimistic = {
      count: local.count + (local.voted ? -1 : 1),
      voted: !local.voted,
    }
    setLocal(optimistic)
    writeForumVote(userId, targetId, optimistic.voted)
    setBusy(true)
    persist.begin('forum-vote')
    try {
      const token = await getAuthJWTToken()
      const res =
        targetType === 'topic'
          ? await toggleForumTopicVoteFn({
              data: { topicId: targetId, userId: userId ?? undefined, token: token ?? undefined },
            })
          : await toggleForumPostVoteFn({
              data: { postId: targetId, userId: userId ?? undefined, token: token ?? undefined },
            })
      setLocal({ count: res.upvotes, voted: res.voted })
      writeForumVote(userId, targetId, res.voted)
      onResult?.(res)
    } catch (err) {
      console.error('Vote failed:', err)
      setLocal(rollback)
      writeForumVote(userId, targetId, rollback.voted)
      toast.warning('Upvote could not be recorded. Please try again.', {
        id: 'forum-vote-sync-warning',
        title: 'UPVOTE',
        duration: 4000,
      })
    } finally {
      persist.end('forum-vote')
      setBusy(false)
    }
  }

  const active = local.voted

  if (size === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={active}
        title={active ? 'Remove upvote' : 'Upvote'}
        className={`px-2 py-1 flex items-center gap-1.5 chamfer-corner border transition-all select-none ${
          active
            ? 'bg-[#00ffff]/15 border-[#00ffff] text-[#00ffff]'
            : 'bg-[#070b0b] border-[#3a4a49] text-[#839493] hover:border-[#00ffff]/60 hover:text-[#dfe3e3]'
        }`}
      >
        <ArrowBigUp
          className={`w-3.5 h-3.5 transition-colors ${
            active ? 'text-[#00ffff] fill-[#00ffff]' : 'text-[#839493] group-hover:text-[#00ffff]'
          }`}
        />
        <span className="font-sans font-bold text-xs tabular-nums leading-none">
          {local.count}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      title={active ? 'Remove upvote' : 'Upvote'}
      className={`group flex flex-col items-center justify-center shrink-0 transition-all select-none chamfer-corner border ${
        size === 'sm'
          ? 'w-9 h-11 p-1 gap-0.5'
          : 'w-11 h-13 p-1.5 gap-1'
      } ${
        active
          ? 'bg-[#00ffff]/10 border-[#00ffff]/80 text-[#00ffff] shadow-[0_0_10px_rgba(0,255,255,0.15)]'
          : 'bg-[#070b0b] border-[#3a4a49] text-[#839493] hover:border-[#00ffff]/50 hover:bg-[#0b1011]'
      }`}
    >
      <ArrowBigUp
        className={`transition-colors ${
          size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
        } ${active ? 'text-[#00ffff] fill-[#00ffff]' : 'text-[#839493] group-hover:text-[#00ffff]'}`}
      />
      <span
        className={`font-sans font-bold tabular-nums leading-none ${
          size === 'sm' ? 'text-[10px]' : 'text-xs'
        } ${active ? 'text-[#00ffff]' : 'text-[#dfe3e3]'}`}
      >
        {local.count}
      </span>
    </button>
  )
}