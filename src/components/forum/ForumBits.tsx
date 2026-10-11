import React, { useEffect, useState } from 'react'
import { ArrowBigUp, ShieldCheck, Cpu, Terminal, Flame, Radio, MessageSquare, Pin, Lock } from 'lucide-react'
import { toggleForumTopicVoteFn, toggleForumPostVoteFn } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { peekForumVote, resolveForumVoted, writeForumVote } from '@/lib/forum-vote-cache'
import { useHudPersist } from '@/hooks/useHudPersist'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { useForumAuth } from './ForumShell'

const STAGE_COLORS: Record<number, string> = {
  4: 'bg-cyan-soft text-cyan-glow border-line-subtle',
  3: 'bg-emerald-500/15 text-emerald-400 border-line-subtle',
  2: 'bg-amber-500/15 text-amber-400 border-line-subtle',
  1: 'bg-crimson-soft text-crimson-text border-line-subtle',
}

export function StageBadge({ stage }: { stage: number }) {
  const normalized = Math.max(1, Math.min(4, stage))
  const cls = STAGE_COLORS[normalized] || STAGE_COLORS[1]
  return (
    <span
      className={`inline-block text-[11px] font-sans font-bold uppercase tracking-[0.08em] px-1.5 py-0.2 rounded-chip border ${cls}`}
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
    <span className="text-[11px] font-sans bg-crimson-soft text-crimson-text border border-line-subtle px-1.5 py-0.2 font-bold tracking-[0.08em] rounded-chip flex items-center gap-1">
      <Pin className="w-2.5 h-2.5" /> PINNED
    </span>
  )
}

export function LockBadge() {
  return (
    <span
      className="text-[11px] font-sans bg-surface-2 text-ink-muted border border-line-subtle px-1.5 py-0.2 font-bold rounded-chip flex items-center gap-1"
      data-testid="forum-lock-badge"
    >
      <Lock className="w-2.5 h-2.5" /> Locked
    </span>
  )
}

export function WithdrawnBadge() {
  return (
    <span
      className="text-[11px] font-sans bg-surface-2 text-ink-muted border border-line-subtle px-1.5 py-0.2 font-bold rounded-chip"
      data-testid="forum-withdrawn-badge"
    >
      Withdrawn
    </span>
  )
}

export function ForumUnreadMark({
  label,
}: {
  label: string
}) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-cyan-glow"
      data-testid="forum-unread-mark"
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-cyan-glow"
        aria-hidden
      />
      <span>{label}</span>
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

  const toastContext = useOptionalToast()

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
      toastContext?.toast.warning('Upvote could not be recorded. Please try again.', {
        id: 'forum-vote-sync-warning',
        title: 'Upvote Failed',
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
        className={`group px-2 py-1 flex items-center gap-1.5 rounded-control border transition-all select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
          active
            ? 'bg-cyan-soft border-cyan-glow/40 text-cyan-glow'
            : 'border-transparent text-ink-muted hover:text-ink hover:bg-surface-2'
        }`}
      >
        <ArrowBigUp
          className={`w-3.5 h-3.5 transition-colors ${
            active ? 'text-cyan-glow fill-cyan-glow' : 'text-ink-muted group-hover:text-ink'
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
      className={`group flex flex-col items-center justify-center shrink-0 transition-all select-none rounded-control border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
        size === 'sm'
          ? 'w-9 h-11 p-1 gap-0.5'
          : 'w-11 h-13 p-1.5 gap-1'
      } ${
        active
          ? 'bg-cyan-soft border-cyan-glow/40 text-cyan-glow'
          : 'bg-surface-1 border-line-subtle text-ink-muted hover:text-ink hover:bg-surface-2 hover:border-line'
      }`}
    >
      <ArrowBigUp
        className={`transition-colors ${
          size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
        } ${active ? 'text-cyan-glow fill-cyan-glow' : 'text-ink-muted group-hover:text-ink'}`}
      />
      <span
        className={`font-sans font-bold tabular-nums leading-none ${
          size === 'sm' ? 'text-[11px]' : 'text-xs'
        } ${active ? 'text-cyan-glow' : 'text-ink'}`}
      >
        {local.count}
      </span>
    </button>
  )
}