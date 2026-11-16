import React from 'react'
import { ArrowUpRight, Pin, Shield, Sparkles, UserPlus, X } from 'lucide-react'
import { BrandIcon3D } from '@/components/ui/BrandIcon3D'
import { BenthicCTAButton } from '../hud/BenthicCTAButton'
import { ORACLE_GUEST_LIMITS } from '@/lib/ai/usage-limits'
import { LocalTime } from '@/components/ui/LocalTime'
import { relativeTime } from '@/lib/forum-utils'
import type { ManagedThread } from './useThreadActions'

/** How many recent chats the empty new-chat screen lists. */
export const RECENT_CHATS_LIMIT = 3

const timeMs = (value?: string | Date | null) => {
  const ms = value ? new Date(value).getTime() : 0
  return Number.isNaN(ms) ? 0 : ms
}

/** The most recently active chat, pinned or not. */
export function pickLatestChat(threads: ManagedThread[]): ManagedThread | null {
  let latest: ManagedThread | null = null
  for (const t of threads) {
    if (t.archivedAt) continue
    if (!latest || timeMs(t.updatedAt ?? t.createdAt) > timeMs(latest.updatedAt ?? latest.createdAt)) latest = t
  }
  return latest
}

/** The chats worth showing on a fresh screen: pinned first, then the most recently active. */
export function pickRecentChats(threads: ManagedThread[], limit = RECENT_CHATS_LIMIT): ManagedThread[] {
  const active = threads.filter((t) => !t.archivedAt)
  const pinned = active.filter((t) => t.pinnedAt).sort((a, b) => timeMs(b.pinnedAt) - timeMs(a.pinnedAt))
  const rest = active
    .filter((t) => !t.pinnedAt)
    .sort((a, b) => timeMs(b.updatedAt ?? b.createdAt) - timeMs(a.updatedAt ?? a.createdAt))
  return [...pinned, ...rest].slice(0, limit)
}

export interface PromptShortcut {
  label: string
  prompt: string
}

export const DEFAULT_PROMPT_SHORTCUTS: PromptShortcut[] = [
  { label: 'What is Moltology?', prompt: 'What is Moltology and why should I molt?' },
  { label: 'Start moltmaxxing', prompt: 'How do I start moltmaxxing and optimize my routine?' },
  { label: 'Earn Chitin Gems', prompt: 'How do I earn Chitin Gems?' },
  {
    label: 'The Great Melt vs the Great Molt',
    prompt: 'Explain the difference between The Great Melt and The Great Molt.',
  },
]

/** One tab of the "More ideas" list. */
export interface PromptIdeaGroup {
  id: string
  label: string
  prompts: PromptShortcut[]
}

export interface NewChatScreenProps {
  isGuest?: boolean
  /** Sends a suggestion straight away. */
  onSubmit: (data: { text: string }) => void
  onOpenAuthModal?: () => void
  shortcuts?: PromptShortcut[]
  /** Every starter prompt the visitor can use, by group. Empty hides "More ideas". */
  moreIdeas?: PromptIdeaGroup[]
  /**
   * The prompt box, rendered under the greeting on wide panels. Leave it out on narrow
   * panels (phones, popout, sidebar), where the panel docks the same box at the bottom.
   */
  composer?: React.ReactNode
  /** Up to three recent chats, already picked with `pickRecentChats`. Empty hides the block. */
  recentChats?: ManagedThread[]
  onOpenChat?: (id: string) => void
  /** Opens the full chats panel. */
  onShowAllChats?: () => void
  disabled?: boolean
  className?: string
}

export const NewChatScreen: React.FC<NewChatScreenProps> = ({
  isGuest = false,
  onSubmit,
  onOpenAuthModal,
  shortcuts = DEFAULT_PROMPT_SHORTCUTS,
  moreIdeas = [],
  composer,
  recentChats = [],
  onOpenChat,
  onShowAllChats,
  disabled = false,
  className = '',
}) => {
  const isCentered = Boolean(composer)
  const showRecents = recentChats.length > 0 && Boolean(onOpenChat)
  // Narrow panels trim suggestions while recents show, so the empty screen keeps its height.
  const visibleShortcuts = showRecents && !isCentered ? shortcuts.slice(0, 2) : shortcuts
  const [ideasOpen, setIdeasOpen] = React.useState(false)
  const [ideaTab, setIdeaTab] = React.useState(0)
  const ideaGroup = moreIdeas[Math.min(ideaTab, moreIdeas.length - 1)]
  const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

  const greeting = (
    <div className={`flex flex-col gap-2 ${isCentered ? 'items-center text-center' : 'items-start'}`}>
      <BrandIcon3D size={64} glow aria-hidden="true" />
      <h2 className="font-grotesk text-lg sm:text-xl font-semibold text-ink tracking-tight">
        Ask the Oracle
      </h2>
    </div>
  )

  const moreIdeasButton = moreIdeas.length > 0 && (
    <li className={isCentered ? '' : 'w-full'}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIdeasOpen(true)}
        aria-expanded={false}
        className={`inline-flex items-center gap-1.5 rounded-control text-sm text-cyan-glow hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${focus} ${
          isCentered ? 'px-3 py-1.5' : 'px-3 py-1.5 -ml-1'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
        More ideas
      </button>
    </li>
  )

  // "More ideas" swaps in place of the chips: tabs by group, then that group's prompts.
  const ideas = ideasOpen && ideaGroup && (
    <section aria-label="More ideas" className="w-full flex flex-col gap-2 text-left" data-testid="oracle-more-ideas">
      <div className="flex items-center gap-1">
        <div role="tablist" aria-label="Idea groups" className="flex flex-1 min-w-0 gap-1 overflow-x-auto no-scrollbar">
          {moreIdeas.map((g, i) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={g.id === ideaGroup.id}
              onClick={() => setIdeaTab(i)}
              className={`shrink-0 rounded-chip px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${focus} ${
                g.id === ideaGroup.id ? 'bg-cyan-soft text-cyan-glow' : 'text-ink-muted hover:text-ink hover:bg-surface-2'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIdeasOpen(false)}
          aria-label="Close ideas"
          className={`shrink-0 rounded-control p-1.5 text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer ${focus}`}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <ul role="tabpanel" aria-label={ideaGroup.label} className="flex flex-col">
        {ideaGroup.prompts.map((s) => (
          <li key={s.label}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSubmit({ text: s.prompt })}
              className={`group w-full flex items-center justify-between gap-2 rounded-control px-2 py-2 text-left text-sm text-ink-body hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${focus}`}
            >
              <span className="min-w-0">{s.label}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-cyan-glow shrink-0 transition-colors" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )

  const suggestions = ideas || (visibleShortcuts.length > 0 && (
    <ul
      aria-label="Suggested questions"
      className={isCentered ? 'flex flex-wrap justify-center gap-2' : 'flex flex-col gap-1.5 w-full'}
    >
      {visibleShortcuts.map((s) => (
        <li key={s.label} className={isCentered ? '' : 'w-full'}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSubmit({ text: s.prompt })}
            className={`group inline-flex items-center gap-1.5 rounded-control border border-line-subtle bg-surface-1/70 hover:bg-surface-2 hover:border-line text-sm text-ink-body hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
              isCentered ? 'px-3 py-1.5' : 'w-full justify-between px-3 py-2.5 text-left'
            }`}
          >
            <span>{s.label}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-cyan-glow shrink-0 transition-colors" />
          </button>
        </li>
      ))}
      {moreIdeasButton}
    </ul>
  ))

  const recents = showRecents && (
    <section aria-labelledby="oracle-recent-chats" className="-mx-2 flex flex-col gap-1 text-left">
      <div className="flex items-center justify-between pl-2 pr-1">
        <h3 id="oracle-recent-chats" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          Recent
        </h3>
        {onShowAllChats && (
          <button
            type="button"
            onClick={onShowAllChats}
            className="rounded-control px-1 py-0.5 text-xs text-cyan-glow hover:text-ink transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            All chats
          </button>
        )}
      </div>
      <ul className="flex flex-col">
        {recentChats.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onOpenChat?.(t.id)}
              className="w-full flex items-center gap-2 rounded-control px-2 py-2 text-left text-sm text-ink-body hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              {t.pinnedAt && <Pin aria-label="Pinned" className="w-3 h-3 shrink-0 text-ink-muted" />}
              <span className="flex-1 min-w-0 truncate">{t.title || 'Untitled chat'}</span>
              {(t.updatedAt ?? t.createdAt) && (
                <LocalTime
                  value={(t.updatedAt ?? t.createdAt)!}
                  format={relativeTime}
                  className="shrink-0 text-xs text-ink-muted"
                />
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )

  const guestBanner = isGuest && (
    <div className="p-3 bg-surface-1 hud-sheen border border-line-subtle rounded-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full text-left">
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
          <Shield className="w-3.5 h-3.5 text-cyan-glow" />
          <span>You're exploring as a guest</span>
        </div>
        <p className="text-[11px] text-ink-muted">
          Guests get {ORACLE_GUEST_LIMITS.perDay} messages a day, and chats aren't saved. Sign up free for more.
        </p>
      </div>
      {onOpenAuthModal && (
        <BenthicCTAButton
          variant="cyan"
          size="sm"
          onClick={onOpenAuthModal}
          className="shrink-0 w-full sm:w-auto !py-1 !px-3"
        >
          <span className="flex items-center justify-center gap-1.5 text-[11px] font-bold font-grotesk tracking-[0.08em] uppercase">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </span>
        </BenthicCTAButton>
      )}
    </div>
  )

  if (isCentered) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-full w-full px-4 py-8 font-sans ${className}`}>
        <div className="w-full max-w-2xl flex flex-col gap-6">
          {greeting}
          {composer}
          {suggestions}
          {recents}
          {guestBanner}
        </div>
      </div>
    )
  }

  // Narrow panels: content settles at the bottom, right above the docked prompt box.
  return (
    <div className={`flex flex-col justify-end min-h-full w-full px-4 pt-6 pb-4 font-sans ${className}`}>
      <div className="w-full flex flex-col gap-5">
        {greeting}
        {recents}
        {suggestions}
        {guestBanner}
      </div>
    </div>
  )
}
