import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAvatarStillSync } from '@/hooks/useAvatarStillSync'
import { createPortal } from 'react-dom'
import { ChevronRight, LogOut, Settings, X } from 'lucide-react'
import { usePanelPresence } from '@/hooks/usePanelPresence'
import { useModalPanelFocus } from '@/hooks/useModalPanelFocus'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { OPEN_ALIGNMENT_PANEL_EVENT, isAlignmentPanelHostVisible } from '@/lib/alignment-panel'
import { STAGE_PIPELINE_DATA } from '@/lib/codexStages'
import { getAssetUrl } from '@/lib/assets'
import { getEffectiveRole } from '@/lib/permissions'
import { useWalletBalances } from '@/hooks/useWalletBalances'
import { STAGE_THRESHOLDS, calculateSubStageProgress, type SubStageProgress } from '@/lib/progression'
import { UserAvatar } from '../UserAvatar'
import { useSignOutButton, type UserAvatarMenuProps } from '../UserAvatarMenu'
import { AlignmentTodayList } from './AlignmentTodayList'
import { XpRing, type XpRingSize } from './XpRing'

export interface AccountHubProps {
  variant: XpRingSize
  user: UserAvatarMenuProps['user']
  userRole?: string | null
  displayName?: string | null
  /** Waiting friend requests; shown on the Profile link. */
  pendingFriendRequests?: number
  onNavigate: (path: string) => void
}

const PROGRESS_PATH = '/character/progress'
const SHOP_PATH = '/character/shop'
const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

/** Highest sub-stage this member has already been shown, so each one is celebrated once. */
function seenKey(userId: string) {
  return `moltology:xp-seen:${userId}`
}
function readSeen(userId: string): number | null {
  try {
    const raw = window.localStorage.getItem(seenKey(userId))
    if (raw === null) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}
function writeSeen(userId: string, index: number) {
  try {
    window.localStorage.setItem(seenKey(userId), String(index))
  } catch {}
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** "THE SOFT-SHED" -> "The Soft-Shed" */
function titleCase(text: string) {
  return text.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase())
}

function stageIndexOf(subIndex: number) {
  return Math.floor(subIndex / 3)
}

/** How the XP ring is showing right now; differs from the true values while it animates. */
interface RingView {
  ratio: number
  badge: string | null
  instant: boolean
  pulseKey: number
}

/**
 * Top-pill account control: the member's portrait inside the XP ring and today's
 * task notches. Opens one panel with level, today's tasks, Settings and Sign out.
 */
export function AccountHub({
  variant,
  user,
  userRole,
  displayName: displayNameProp,
  pendingFriendRequests = 0,
  onNavigate,
}: AccountHubProps) {
  const alignment = useDailyAlignment()
  const toastApi = useOptionalToast()
  const toastRef = useRef(toastApi)
  toastRef.current = toastApi

  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const isPhone = variant === 'phone'

  useEffect(() => setMounted(true), [])

  const displayName = displayNameProp || user.name || user.email?.split('@')[0] || 'Operative'
  const effectiveRole = getEffectiveRole(user, userRole)
  const userId = user.id ?? null
  // Store the member's own portrait as an image, so other members' lists need not draw it.
  useAvatarStillSync(userId, user.avatarConfig)

  const progress = calculateSubStageProgress(alignment.xp)
  const countReady = !alignment.isLoading
  const tasks = alignment.tasks
  const done = countReady ? tasks.filter((t) => t.completed).length : 0

  // ── Ring animation and celebrations ─────────────────────────────────────────
  const [view, setView] = useState<RingView>({ ratio: 0, badge: null, instant: true, pulseKey: 0 })
  const [gain, setGain] = useState<{ id: number; amount: number } | null>(null)
  const [stageCard, setStageCard] = useState<number | null>(null)
  const [poppedNotch, setPoppedNotch] = useState<number | null>(null)
  const prevRef = useRef<{ userId: string; xp: number; index: number; confirmed: boolean } | null>(null)
  const timersRef = useRef<number[]>([])

  useEffect(() => () => timersRef.current.forEach((t) => window.clearTimeout(t)), [])

  const celebrate = useCallback((uid: string, current: SubStageProgress) => {
    const seen = readSeen(uid)
    if (seen !== null && current.index <= seen) return
    writeSeen(uid, current.index)
    if (seen === null) return
    if (stageIndexOf(current.index) > stageIndexOf(seen)) {
      setStageCard(current.stageNum)
      return
    }
    toastRef.current?.toast.success(current.shortTitle, {
      id: 'xp-sub-stage',
      title: `You reached ${current.code}`,
      duration: 6000,
      action: { label: 'Progress', href: PROGRESS_PATH },
    })
  }, [])

  useEffect(() => {
    if (!userId || !alignment.xpReady) return
    const prev = prevRef.current
    const current = progress

    // First reading for this member (or the server confirming a reading saved on this
    // device): show it as is, and catch up on a stage reached elsewhere. No gain animation.
    if (!prev || prev.userId !== userId || (!prev.confirmed && alignment.xpConfirmed)) {
      prevRef.current = { userId, xp: alignment.xp, index: current.index, confirmed: alignment.xpConfirmed }
      setView({ ratio: current.ratio, badge: current.code, instant: false, pulseKey: 0 })
      const seen = readSeen(userId)
      if (seen === null || current.index < seen) writeSeen(userId, Math.max(seen ?? 0, current.index))
      else if (stageIndexOf(current.index) > stageIndexOf(seen)) celebrate(userId, current)
      else if (current.index > seen) writeSeen(userId, current.index)
      return
    }

    if (alignment.xp === prev.xp) return
    const delta = alignment.xp - prev.xp
    prevRef.current = { userId, xp: alignment.xp, index: current.index, confirmed: alignment.xpConfirmed }
    if (delta > 0) setGain({ id: Date.now(), amount: delta })

    if (current.index > prev.index && !prefersReducedMotion()) {
      // Close the loop on the old sub-stage, then snap to empty with the new badge and refill.
      timersRef.current.forEach((t) => window.clearTimeout(t))
      setView((v) => ({ ...v, ratio: 1, instant: false }))
      timersRef.current = [
        window.setTimeout(() => {
          setView((v) => ({ ratio: 0, badge: current.code, instant: true, pulseKey: v.pulseKey + 1 }))
          celebrate(userId, current)
        }, 750),
        window.setTimeout(() => {
          setView((v) => ({ ...v, ratio: current.ratio, instant: false }))
        }, 820),
      ]
      return
    }

    if (current.index > prev.index) celebrate(userId, current)
    setView((v) => ({ ...v, ratio: current.ratio, badge: current.code, instant: current.index !== prev.index }))
    // progress is derived from alignment.xp
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, alignment.xp, alignment.xpReady, alignment.xpConfirmed, celebrate])

  const prevDoneRef = useRef<number | null>(null)
  useEffect(() => {
    if (!countReady) return
    const prevDone = prevDoneRef.current
    prevDoneRef.current = done
    if (prevDone !== null && done > prevDone) setPoppedNotch(done - 1)
  }, [done, countReady])

  useEffect(() => {
    if (!gain) return
    const t = window.setTimeout(() => setGain(null), 1300)
    return () => window.clearTimeout(t)
  }, [gain])

  // ── Panel open / close ──────────────────────────────────────────────────────
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (!isOpen || isPhone) return
    const onClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    // Attach on the next tick so the opening click cannot dismiss; `click` lets Sign out's pointerdown run first.
    const id = window.setTimeout(() => document.addEventListener('click', onClick), 0)
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, isPhone, close])

  // Other controls can still ask for today's tasks.
  useEffect(() => {
    const open = () => {
      if (isAlignmentPanelHostVisible(rootRef.current)) setIsOpen(true)
    }
    window.addEventListener(OPEN_ALIGNMENT_PANEL_EVENT, open)
    return () => window.removeEventListener(OPEN_ALIGNMENT_PANEL_EVENT, open)
  }, [])

  const wallet = useWalletBalances(isOpen ? userId : null)
  // Credits read "soon" until purchases open, unless the member already holds some.
  const creditsShown = Boolean(wallet && (wallet.creditsLive || wallet.credits > 0))

  const signOutButtonProps = useSignOutButton({ onNavigate, onBeforeSignOut: close })

  const go = (path: string) => {
    close()
    onNavigate(path)
  }

  const handleToggleTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId || t.key === taskId)
    if (task?.key === 'silent-synchronization') {
      close()
      alignment.openSilentSynchronization()
      return
    }
    void alignment.toggleTask(taskId)
  }

  const todayLabel = mounted
    ? new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : ''

  const levelSummary = progress.next
    ? `${progress.code} ${progress.shortTitle} · ${progress.xpToNext.toLocaleString()} XP to ${progress.next.code}`
    : `${progress.code} ${progress.shortTitle} · final sub-stage`
  const tasksSummary = countReady ? `${done} of ${tasks.length} tasks done today` : ''

  // The sidebar passes `avatarConfig: undefined` until the member's profile is known.
  const characterPending = user.avatarConfig === undefined
  const portrait = <UserAvatar user={user} pending={characterPending} name={displayName} size="fill" borderless />

  const requestsLabel =
    pendingFriendRequests > 0
      ? `, ${pendingFriendRequests} friend request${pendingFriendRequests === 1 ? '' : 's'} waiting`
      : ''

  const settingsButton = (
    <button
      type="button"
      onClick={() => go('/settings')}
      aria-label="Settings"
      title="Settings"
      data-testid="account-hub-settings"
      className={`shrink-0 w-11 h-11 rounded-control flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors ${focusRing}`}
    >
      <Settings className="w-5 h-5" aria-hidden="true" />
    </button>
  )

  // Who: the way into their profile. Phone shows a larger portrait.
  const identity = (
    <button
      type="button"
      onClick={() => go(pendingFriendRequests > 0 ? '/profile?tab=requests' : '/profile')}
      data-testid="account-hub-profile"
      aria-label={`View profile${requestsLabel}`}
      className={`min-w-0 flex-1 p-2 flex items-center gap-3 text-left rounded-control hover:bg-surface-2 transition-colors group ${focusRing} ${
        isPhone ? '-mx-2 w-[calc(100%+1rem)] gap-4' : '-ml-2 -my-2'
      }`}
    >
      {isPhone ? (
        <span className="shrink-0 w-20 h-20 rounded-full overflow-hidden">
          <UserAvatar user={user} pending={characterPending} name={displayName} size="fill" />
        </span>
      ) : (
        <UserAvatar user={user} pending={characterPending} name={displayName} size="xl" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`font-bold font-grotesk text-ink truncate ${isPhone ? 'text-lg' : 'text-sm'}`}>{displayName}</span>
          {effectiveRole === 'admin' && (
            <span className="text-[11px] font-sans font-extrabold tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-chip shrink-0 bg-cyan-soft border border-cyan-glow/40 text-cyan-glow">
              Admin
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1.5 mt-0.5 min-w-0 text-ink-body group-hover:text-ink ${isPhone ? 'text-sm' : 'text-xs'}`}>
          <span>View profile</span>
          {pendingFriendRequests > 0 && (
            <span
              data-testid="account-hub-requests"
              className="text-[11px] font-bold px-1.5 py-0.5 rounded-chip shrink-0 bg-cyan-soft border border-cyan-glow/40 text-cyan-glow tabular-nums"
            >
              {pendingFriendRequests > 99 ? '99+' : pendingFriendRequests}{' '}
              {pendingFriendRequests === 1 ? 'request' : 'requests'}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 shrink-0 text-ink-muted group-hover:text-ink" aria-hidden="true" />
    </button>
  )

  // Level and wallet share one card: XP on top, balances and Shop underneath.
  const statusCard = (
    <div className="rounded-control bg-surface-2 overflow-hidden divide-y divide-line-subtle">
      <button
        type="button"
        onClick={() => go(PROGRESS_PATH)}
        data-testid="account-hub-level"
        className={`block w-full text-left hover:bg-surface-3 transition-colors p-3 group focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow`}
      >
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="font-bold text-ink truncate">
            {progress.code} · {progress.shortTitle}
          </span>
          <span className="shrink-0 text-ink-muted tabular-nums">
            {alignment.xpReady
              ? progress.next
                ? `${progress.xpInto.toLocaleString()} / ${progress.xpSpan.toLocaleString()} XP`
                : `${alignment.xp.toLocaleString()} XP`
              : ''}
          </span>
        </div>
        <div className="h-1.5 rounded-chip bg-surface-3 overflow-hidden my-2" aria-hidden="true">
          <div
            className="h-full rounded-chip bg-gradient-to-r from-cyan-glow to-emerald-300 transition-[width] duration-700 motion-reduce:transition-none"
            style={{ width: `${alignment.xpReady ? Math.round(progress.ratio * 100) : 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px] text-ink-muted">
          <span className="truncate">
            {progress.next
              ? `${progress.xpToNext.toLocaleString()} XP to ${progress.next.code} · ${progress.next.shortTitle}`
              : 'Final sub-stage reached'}
          </span>
          <span className="shrink-0 inline-flex items-center gap-0.5 text-ink-body group-hover:text-cyan-glow">
            Progress
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        </div>
      </button>
      <button
        type="button"
        onClick={() => go(SHOP_PATH)}
        data-testid="account-hub-wallet"
        aria-label={
          wallet
            ? `Shop. ${wallet.gems.toLocaleString()} Chitin Gems, ${creditsShown ? `${wallet.credits.toLocaleString()} Molt Credits` : 'Molt Credits coming soon'}`
            : 'Shop'
        }
        className={`w-full flex items-center gap-3 hover:bg-surface-3 transition-colors px-3 min-h-11 text-xs group focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow`}
      >
        <WalletAmount icon="/images/chitin_gem.png" value={wallet ? wallet.gems.toLocaleString() : null} unit="gems" />
        {wallet && !creditsShown ? (
          <WalletAmount icon="/images/molt_credit.png" value={null} unit="credits soon" />
        ) : (
          <WalletAmount icon="/images/molt_credit.png" value={wallet ? wallet.credits.toLocaleString() : null} unit="credits" />
        )}
        <span className="ml-auto shrink-0 inline-flex items-center gap-0.5 text-ink-body group-hover:text-cyan-glow">
          Shop
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
      </button>
    </div>
  )

  // Quiet row at the very end. On phone it signs out on tap only, so a scroll that starts on it cannot.
  const signOutRow = (
    <div className="pt-1 border-t border-line-subtle">
      <button
        {...signOutButtonProps}
        {...(isPhone ? { onPointerDown: undefined } : {})}
        data-testid="account-hub-sign-out"
        className={`w-full min-h-11 mt-2 px-3 rounded-control text-sm font-semibold flex items-center justify-center gap-2 text-crimson-text hover:bg-crimson-soft transition-colors ${focusRing}`}
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        Sign out
      </button>
    </div>
  )

  // Phone: Settings is a plain row above Sign out, so the screen's header only holds the close button.
  const settingsRow = (
    <button
      type="button"
      onClick={() => go('/settings')}
      data-testid="account-hub-settings"
      className={`w-full min-h-12 px-3 rounded-control flex items-center gap-3 text-sm font-semibold text-ink hover:bg-surface-2 transition-colors ${focusRing}`}
    >
      <Settings className="w-5 h-5 text-ink-muted" aria-hidden="true" />
      <span className="flex-1 text-left">Settings</span>
      <ChevronRight className="w-4 h-4 text-ink-muted" aria-hidden="true" />
    </button>
  )

  const tasksList = (
    <AlignmentTodayList
      tasks={tasks}
      countReady={countReady}
      todayLabel={todayLabel}
      onToggle={handleToggleTask}
      onClose={close}
      showClose={false}
      roomy={isPhone}
    />
  )

  return (
    <div ref={rootRef} className="relative flex items-center" data-testid="account-hub">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`User account menu, level and today's tasks. ${levelSummary}. ${tasksSummary}`}
        title={`${levelSummary}${tasksSummary ? `\n${tasksSummary}` : ''}`}
        className={`relative rounded-full cursor-pointer select-none touch-manipulation transition-transform active:scale-95 ${focusRing}`}
      >
        <XpRing
          size={variant}
          portrait={portrait}
          ratio={view.ratio}
          badge={alignment.xpReady ? view.badge : null}
          instant={view.instant}
          pulseKey={view.pulseKey}
          done={done}
          total={tasks.length}
          poppedNotch={poppedNotch}
        />
        {gain && (
          <span
            key={gain.id}
            aria-hidden="true"
            data-testid="xp-gain"
            className="xp-gain-float absolute inset-x-0 top-[22%] text-center text-sm font-extrabold tabular-nums text-emerald-300 whitespace-nowrap pointer-events-none [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_8px_rgba(0,0,0,0.8)]"
          >
            +{gain.amount}
          </span>
        )}
      </button>

      {/* Desktop: dropdown under the pill */}
      {isOpen && !isPhone && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Account and today's tasks"
          data-testid="account-hub-panel"
          className="absolute top-full right-0 mt-3 w-96 max-h-[calc(100dvh-11rem)] overflow-y-auto overscroll-contain rounded-card border border-line bg-surface-1 shadow-menu p-4 z-[200] font-sans animate-in fade-in slide-in-from-top-2 duration-150 space-y-4"
        >
          <div className="flex items-center gap-2">
            {identity}
            {settingsButton}
          </div>
          {statusCard}
          {tasksList}
          {signOutRow}
        </div>
      )}

      {/* Phone: full-screen account screen */}
      {mounted && isPhone && (
        <AccountScreen isOpen={isOpen} onClose={close}>
          {identity}
          {statusCard}
          {tasksList}
          {settingsRow}
          {signOutRow}
        </AccountScreen>
      )}

      {mounted && stageCard !== null && (
        <StageReachedCard stageNum={stageCard} portrait={portrait} onClose={() => setStageCard(null)} onNavigate={onNavigate} />
      )}
    </div>
  )
}

/** Phone account screen: fills the viewport, slides up, closes from X, Escape or a swipe down on its bar. */
function AccountScreen({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  const { mounted: rendered, visible } = usePanelPresence(isOpen, 250)
  const panelRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<number | null>(null)
  const dragStart = useRef(0)

  useModalPanelFocus(isOpen && rendered, panelRef)

  useEffect(() => {
    if (!rendered) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [rendered])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) setDrag(null)
  }, [isOpen])

  if (!rendered) return null

  const offset = drag !== null ? Math.max(0, drag) : 0
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => {
      dragStart.current = e.touches[0].clientY
      setDrag(0)
    },
    onTouchMove: (e: React.TouchEvent) => setDrag(e.touches[0].clientY - dragStart.current),
    onTouchEnd: () => {
      if (offset > 80) onClose()
      setDrag(null)
    },
  }

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Account and today's tasks"
      tabIndex={-1}
      inert={!isOpen}
      data-testid="account-hub-screen"
      style={{
        transform: visible ? `translateY(${offset}px)` : 'translateY(100%)',
        transitionDuration: drag !== null ? '0ms' : undefined,
      }}
      className="fixed inset-0 z-[99990] flex flex-col bg-surface-1 font-sans transition-transform duration-250 ease-out motion-reduce:transition-none"
    >
      <div
        {...swipe}
        className="shrink-0 h-14 px-2 pt-[env(safe-area-inset-top)] box-content flex items-center gap-2 border-b border-line-subtle touch-none"
      >
        {/* Balances the close button so the title stays centred; close sits top right like every other close. */}
        <span aria-hidden className="shrink-0 w-11 h-11" />
        <h2 className="flex-1 text-center font-grotesk text-sm font-bold tracking-[0.08em] uppercase text-ink">Account</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`shrink-0 w-11 h-11 rounded-control flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors ${focusRing}`}
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <div
        data-testid="account-hub-panel"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-5"
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

/** One balance in the wallet row: icon, amount (blank while loading), unit. */
function WalletAmount({ icon, value, unit }: { icon: string; value: string | null; unit: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0" aria-hidden="true">
      <img src={getAssetUrl(icon)} alt="" className="w-4 h-4 object-contain shrink-0" />
      {value !== null && <span className="font-grotesk font-bold tabular-nums text-ink">{value}</span>}
      <span className="text-ink-muted">{unit}</span>
    </span>
  )
}

/** Shown once when a member enters a new macro stage. */
function StageReachedCard({
  stageNum,
  portrait,
  onClose,
  onNavigate,
}: {
  stageNum: number
  portrait: React.ReactNode
  onClose: () => void
  onNavigate: (path: string) => void
}) {
  const stage = STAGE_THRESHOLDS.find((s) => s.stage === stageNum)
  const info = STAGE_PIPELINE_DATA.find((s) => s.stageNum === stageNum)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    buttonRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!stage) return null

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 font-sans">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-abyss/80 backdrop-blur-sm cursor-default" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stage-reached-title"
        data-testid="stage-reached"
        className="relative w-full max-w-sm rounded-panel border border-cyan-glow/35 bg-surface-1 shadow-menu p-6 text-center animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`absolute top-3 right-3 p-1.5 rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 ${focusRing}`}
        >
          <X className="w-4 h-4" />
        </button>
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          <span aria-hidden="true" className="xp-stage-burst absolute inset-0 rounded-full border-2 border-emerald-300/50" />
          <span aria-hidden="true" className="absolute inset-0 rounded-full p-[5px] bg-gradient-to-br from-cyan-glow to-emerald-300 shadow-[0_0_28px_rgba(0,255,204,0.45)]">
            <span className="block w-full h-full rounded-full bg-surface-1" />
          </span>
          <span className="relative w-[104px] h-[104px] rounded-full overflow-hidden">{portrait}</span>
        </div>
        <div className="mt-5 text-[11px] font-bold tracking-[0.16em] uppercase text-cyan-glow">Stage {stageNum} reached</div>
        <h2 id="stage-reached-title" className="mt-1.5 text-2xl font-bold font-grotesk text-ink">
          {titleCase(stage.title)}
        </h2>
        {info?.subtitle && <p className="mt-2 text-sm text-ink-body leading-relaxed">{info.subtitle}</p>}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            onClose()
            onNavigate(PROGRESS_PATH)
          }}
          className={`mt-5 min-h-11 px-5 rounded-control bg-cyan-glow text-abyss text-xs font-bold tracking-[0.1em] uppercase hover:bg-cyan-hover transition-colors ${focusRing}`}
        >
          See your progress
        </button>
      </div>
    </div>,
    document.body,
  )
}
