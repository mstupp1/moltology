/**
 * Auth-dependent chrome for PublicHeader.
 * Isolated so Neon Auth / Better Auth stay out of the eager public shell chunk.
 *
 * The public site borrows the app's own pieces: the faint top pill, the XP-ring portrait
 * and the Account panel, so signing in feels like one product on both sides.
 */
import React from 'react'
import { ChevronRight, LogIn, UserPlus } from 'lucide-react'
import { UserAvatar } from '@/components/UserAvatar'
import { AccountHub } from '@/components/hud/AccountHub'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { xpRingGeometry } from '@/components/hud/XpRing'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useAccountProfile } from '@/hooks/useAccountProfile'
import { parseLobsterAvatarConfig } from '@/lib/lobster-avatar'
import { getEffectiveRole } from '@/lib/permissions'
import { resolveMemberPublicName } from '@/lib/member-handle'
import { PUBLIC_PHONE_PILL } from '@/components/public-header-pill'

export interface PublicHeaderAuthSlotProps {
  /** desktop: right of the tab bar. bar: the phone top bar. menu: the foot of the phone menu. */
  layout: 'desktop' | 'bar' | 'menu'
  onNavigate: (path: string) => void
  onOpenAuth?: (mode: 'login' | 'signup') => void
  onMobileClose?: () => void
  /** The menu toggle, placed inside the phone pill (bar layout only). */
  menuButton?: React.ReactNode
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'


/** Same member details the app's top bar uses, from the shared cached profile. */
function useMemberChrome() {
  const session = useAuthSession()
  const user = session.user
  const { profile } = useAccountProfile(user?.id)
  const userRole = profile ? getEffectiveRole(user, profile.role) : null
  // `undefined` means the character is still loading (placeholder, not a letter).
  const avatarConfig = profile === undefined ? undefined : parseLobsterAvatarConfig(profile?.avatarConfig)
  const displayName = user
    ? resolveMemberPublicName({ userId: user.id, handle: profile?.handle ?? null, larvaId: profile?.larvaId ?? null })
    : null
  return {
    user: user ? { ...user, avatarConfig } : null,
    isPending: session.isPending,
    userRole: getEffectiveRole(user, userRole),
    displayName,
  }
}

export function PublicHeaderAuthSlot({
  layout,
  onNavigate,
  onOpenAuth,
  onMobileClose,
  menuButton,
}: PublicHeaderAuthSlotProps) {
  const { user, isPending, userRole, displayName } = useMemberChrome()

  if (layout === 'bar') {
    const ring = xpRingGeometry('phone')
    return (
      <div className="flex items-center gap-1.5 shrink-0 -mr-1.5">
        <div className={PUBLIC_PHONE_PILL}>
          {!user && !isPending && (
            <button
              type="button"
              onClick={() => onOpenAuth?.('signup')}
              className={`h-9 px-3.5 mx-0.5 inline-flex items-center rounded-full bg-cyan-glow text-abyss text-sm font-bold hover:bg-cyan-hover transition-colors active:scale-95 ${focusRing}`}
            >
              Join
            </button>
          )}
          {menuButton}
        </div>
        {isPending ? (
          <span
            className="flex items-center justify-center shrink-0"
            style={{ width: ring.box, height: ring.box }}
            data-testid="public-header-bar-auth-skeleton"
          >
            <HudGhostSkeleton variant="neutral" preset="avatar" width={ring.portrait} height={ring.portrait} />
          </span>
        ) : user ? (
          <span className="relative shrink-0 flex">
            <AccountHub
              variant="phone"
              user={user}
              userRole={userRole}
              displayName={displayName}
              onNavigate={onNavigate}
            />
          </span>
        ) : null}
      </div>
    )
  }

  if (layout === 'desktop') {
    if (user) {
      return (
        <div className="flex items-center gap-2">
          <div className={PUBLIC_PHONE_PILL}>
            <button
              onClick={() => onNavigate('/dashboard')}
              className={`h-9 px-4 rounded-full text-sm font-grotesk font-semibold text-ink-body hover:text-ink hover:bg-surface-2 transition-colors ${focusRing}`}
            >
              Dashboard
            </button>
          </div>
          <AccountHub
            variant="desktop"
            user={user}
            userRole={userRole}
            displayName={displayName}
            onNavigate={onNavigate}
          />
        </div>
      )
    }

    if (isPending) {
      return (
        <div className="flex items-center gap-2.5" data-testid="public-header-auth-skeleton">
          <div className="h-9 w-16 rounded-control bg-surface-1 border border-line-subtle animate-pulse" />
          <div className="h-9 w-20 rounded-full bg-surface-1 border border-line-subtle animate-pulse" />
        </div>
      )
    }

    return (
      <div className={PUBLIC_PHONE_PILL}>
        <button
          onClick={() => onOpenAuth?.('login')}
          className={`h-9 px-4 rounded-full text-sm font-grotesk font-semibold text-ink-body hover:text-ink hover:bg-surface-2 transition-colors ${focusRing}`}
        >
          Log in
        </button>
        <button
          onClick={() => onOpenAuth?.('signup')}
          className={`h-9 px-4 mx-0.5 inline-flex items-center gap-1.5 rounded-full bg-cyan-glow text-abyss text-sm font-bold hover:bg-cyan-hover transition-colors active:scale-95 ${focusRing}`}
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          <span>Join</span>
        </button>
      </div>
    )
  }

  // Foot of the phone menu
  if (user) {
    return (
      <button
        type="button"
        onClick={() => {
          onMobileClose?.()
          onNavigate('/dashboard')
        }}
        className={`w-full flex items-center gap-3.5 p-3.5 rounded-card bg-surface-2 border border-line-subtle hover:border-line text-left transition-colors ${focusRing}`}
      >
        <UserAvatar user={user} pending={user.avatarConfig === undefined} name={displayName ?? undefined} size="md" />
        <span className="min-w-0 flex-1">
          <span className="block font-grotesk font-semibold text-base text-ink truncate">{displayName}</span>
          <span className="block text-sm text-ink-muted">Open dashboard</span>
        </span>
        <ChevronRight className="w-5 h-5 text-ink-muted shrink-0" aria-hidden="true" />
      </button>
    )
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-2.5" data-testid="public-header-mobile-auth-skeleton">
        <div className="h-12 w-full rounded-control bg-surface-2 border border-line-subtle animate-pulse" />
        <div className="h-12 w-full rounded-control bg-surface-2 border border-line-subtle animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={() => {
          onMobileClose?.()
          onOpenAuth?.('signup')
        }}
        className={`h-12 w-full inline-flex items-center justify-center gap-2 rounded-control bg-cyan-glow text-abyss font-grotesk font-bold text-base hover:bg-cyan-hover transition-colors active:scale-[0.99] ${focusRing}`}
      >
        <UserPlus className="w-5 h-5" aria-hidden="true" />
        <span>Join Moltology</span>
      </button>
      <button
        type="button"
        onClick={() => {
          onMobileClose?.()
          onOpenAuth?.('login')
        }}
        className={`h-12 w-full inline-flex items-center justify-center gap-2 rounded-control border border-line text-ink font-grotesk font-semibold text-base hover:bg-surface-2 hover:border-line-hover transition-colors active:scale-[0.99] ${focusRing}`}
      >
        <LogIn className="w-5 h-5" aria-hidden="true" />
        <span>Log in</span>
      </button>
    </div>
  )
}
