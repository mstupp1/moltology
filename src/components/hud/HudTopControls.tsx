import React from 'react'
import { Search, UserPlus } from 'lucide-react'
import { BrandIcon } from '@/components/ui/BrandMark'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { UserAvatarMenu, type UserAvatarMenuProps } from '../UserAvatarMenu'
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
  const account = isSessionPending ? (
    <span className="w-11 h-11 flex items-center justify-center" data-testid="top-controls-auth-skeleton">
      <HudGhostSkeleton variant="neutral" preset="avatar" width={32} height={32} />
    </span>
  ) : user ? (
    <span className="w-11 h-11 flex items-center justify-center">
      <UserAvatarMenu
        user={user}
        userRole={userRole}
        displayName={displayName}
        onNavigate={onNavigate}
        align="right"
        openDirection="down"
        size="pill"
      />
    </span>
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
      <HUDTaskBar variant="header" />
      {account}
    </>
  )

  if (variant === 'desktop') {
    return (
      <div data-testid="top-controls" className={`${HUD_GLASS_PILL} flex items-center h-12 px-0.5 font-sans`}>
        {controls}
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
      <div className="flex items-center h-11 px-0.5 shrink-0 rounded-full bg-surface-2/50 border border-line-subtle">
        {controls}
      </div>
    </div>
  )
}
