import React, { useEffect, useState } from 'react'
import { ArrowBigUp, ShieldCheck, Cpu, Terminal, Flame, Radio, MessageSquare, Pin } from 'lucide-react'
import { toggleForumTopicVoteFn, toggleForumPostVoteFn } from '@/lib/server/api'
import { useForumAuth } from './ForumShell'

const STAGE_COLORS: Record<number, string> = {
  4: 'bg-[#00ffff]/10 text-[#00ffff] border-[#00ffff]/60',
  3: 'bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/60',
  2: 'bg-[#ffb703]/10 text-[#ffb703] border-[#ffb703]/60',
  1: 'bg-[#171c1c] text-[#ff5540] border-[#ff5540]/60',
}

export function StageBadge({ stage }: { stage: number }) {
  const cls = STAGE_COLORS[stage] || STAGE_COLORS[1]
  return (
    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border ${cls}`}>
      Stage {Math.max(1, Math.min(4, stage))}
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
    <span className="text-[10px] bg-[#ff5540]/20 text-[#ff5540] border border-[#ff5540] px-1.5 py-0.5 font-bold flex items-center gap-1">
      <Pin className="w-3 h-3" /> PINNED
    </span>
  )
}

interface VoteButtonProps {
  count: number
  voted: boolean
  targetId: string
  targetType: 'topic' | 'post'
  onResult?: (res: { upvotes: number; voted: boolean }) => void
  size?: 'sm' | 'md'
}

export function VoteButton({ count, voted, targetId, targetType, onResult, size = 'md' }: VoteButtonProps) {
  const { isAuthenticated, userId, openAuth } = useForumAuth()
  const [local, setLocal] = useState({ count, voted })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setLocal({ count, voted })
  }, [count, voted])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    if (!isAuthenticated) {
      openAuth('signup')
      return
    }
    const optimistic = {
      count: local.count + (local.voted ? -1 : 1),
      voted: !local.voted,
    }
    setLocal(optimistic)
    setBusy(true)
    try {
      const res =
        targetType === 'topic'
          ? await toggleForumTopicVoteFn({ data: { topicId: targetId, userId: userId ?? undefined } })
          : await toggleForumPostVoteFn({ data: { postId: targetId, userId: userId ?? undefined } })
      setLocal({ count: res.upvotes, voted: res.voted })
      onResult?.(res)
    } catch (err) {
      console.error('Vote failed:', err)
      setLocal({ count, voted })
    } finally {
      setBusy(false)
    }
  }

  const active = local.voted
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      title={active ? 'Remove upvote' : 'Upvote'}
      className={`group flex flex-col items-center justify-center shrink-0 transition select-none ${
        size === 'sm' ? 'w-9 gap-0.5' : 'w-12 gap-1'
      }`}
    >
      <ArrowBigUp
        className={`transition ${
          size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
        } ${active ? 'text-[#ff5540] fill-[#ff5540]' : 'text-[#839493] group-hover:text-[#ff5540]'}`}
      />
      <span
        className={`font-bold tabular-nums leading-none ${
          size === 'sm' ? 'text-[11px]' : 'text-sm'
        } ${active ? 'text-[#ff5540]' : 'text-[#dfe3e3]'}`}
      >
        {local.count}
      </span>
    </button>
  )
}