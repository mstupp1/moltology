import React from 'react'
import { Search, UserPlus } from 'lucide-react'
import { BrandIcon } from '@/components/ui/BrandMark'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { type UserAvatarMenuProps } from '../UserAvatarMenu'
import { AccountHub } from './AccountHub'
import { xpRingGeometry } from './XpRing'
import { HUDTaskBar } from './HUDTaskBar'
import { NotificationsBell } from './NotificationsBell'

/** Frosted pill shared by the phone top bar and the desktop top-right controls. */
export const HUD_GLASS_PILL =
  'rounded-full bg-surface-1/85 backdrop-blur-xl backdrop-saturate-150 border border-line-subtle shadow-menu'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

export interface HudTopControlsProps {
  variant: 'phone' | 'desktop'
  user: UserAvatarMenuProps['user'] | null
  userRole?: string | null
  displayName?: string | null
  isSessionPending: boolean
  onNavigate: (path: string) => void
  onSignUp: () => void
}

function openSearch() {
  window.dispatchEvent(new CustomEvent('open-command-palette'))
}

/**
 * Search, notifications, today's tasks and the account menu as one floating pill.
 * Phone: a slim solid bar with the emblem on the left (it goes to the public home page)
 * and a faint pill on the right. Desktop: a glass pill in the top-right of the workspace.
 */
export function HudTopControls({
  variant,
  user,
  userRole,
  displayName,
  isSessionPending,
  onNavigate,
  onSignUp,
}: HudTopControlsProps) {
  const ring = xpRingGeometry(variant)
  // Members: one portrait medallion (XP ring + today's task notches) that opens account and tasks.
  // Guests: today's tasks keep their own button next to Sign up.
  const account = isSessionPending ? (
    <span
      className="flex items-center justify-center"
      style={{ width: ring.box, height: ring.box }}
      data-testid="top-controls-auth-skeleton"
    >
      <HudGhostSkeleton variant="neutral" preset="avatar" width={ring.portrait} height={ring.portrait} />
    </span>
  ) : user ? (
    <AccountHub
      variant={variant}
      user={user}
      userRole={userRole}
      displayName={displayName}
      onNavigate={onNavigate}
    />
  ) : (
    <button
      type="button"
      onClick={onSignUp}
      aria-label="Sign up"
      title="Sign up"
      className={`h-9 px-3 mx-1 inline-flex items-center gap-1.5 rounded-full bg-cyan-glow text-abyss text-xs font-bold hover:bg-cyan-hover transition-colors active:scale-95 ${focusRing}`}
    >
      <UserPlus className="w-4 h-4" aria-hidden="true" />
      <span>Sign up</span>
    </button>
  )

  // The portrait medallion sits beside the pill as its own piece; its rings stay see-through.
  const medallion = Boolean(user) || isSessionPending
  const medallionLayer = medallion ? (
    <span data-testid="top-controls-medallion" className="relative shrink-0 flex">
      {account}
    </span>
  ) : null

  const controls = (
    <>
      <button
        type="button"
        onClick={openSearch}
        aria-label="Search"
        title="Search pages and members"
        className={`w-11 h-11 -my-1 inline-flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors active:scale-95 shrink-0 ${focusRing}`}
      >
        <Search className="w-5 h-5" aria-hidden="true" />
      </button>
      <NotificationsBell variant="header" />
      {!user && !isSessionPending && <HUDTaskBar variant="header" />}
      {!medallion && account}
    </>
  )

  if (variant === 'desktop') {
    return (
      <div data-testid="top-controls" className="flex items-center gap-2 font-sans">
        <div className={`${HUD_GLASS_PILL} flex items-center h-14 px-1`}>
          {controls}
        </div>
        {medallionLayer}
      </div>
    )
  }

  return (
    <div data-testid="top-controls" className="flex items-center justify-between gap-2 w-full min-w-0 font-sans">
      <button
        type="button"
        onClick={() => onNavigate('/')}
        aria-label="Moltology home"
        title="Moltology home"
        className={`w-10 h-10 -ml-1 shrink-0 inline-flex items-center justify-center rounded-full hover:bg-surface-2 transition-colors active:scale-95 ${focusRing}`}
      >
        <BrandIcon className="w-7 h-7" />
      </button>
      {/* A faint, low pill: echoes the desktop pill without the glass bulk */}
      <div className="flex items-center gap-1.5 shrink-0 -mr-1.5">
        <div className="flex items-center h-11 px-0.5 shrink-0 rounded-full bg-surface-2/50 border border-line-subtle">
          {controls}
        </div>
        {medallionLayer}
      </div>
    </div>
  )
}
