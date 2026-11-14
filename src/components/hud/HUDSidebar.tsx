import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalPanelFocus } from '@/hooks/useModalPanelFocus'
import { useNavigate, useLocation, useRouter } from '@tanstack/react-router'
import {

  LayoutDashboard,
  BookOpen,
  Scroll,
  Shell,
  MessagesSquare,
  LifeBuoy,
  Sparkles,
  ChevronRight,
  Plus,
  Minus,
  Lock,
  EyeOff,
  ShieldCheck,

} from 'lucide-react'
import { useAccountProfile } from '@/hooks/useAccountProfile'
import { parseLobsterAvatarConfig } from '@/lib/lobster-avatar'
import { useAuthSession } from '@/hooks/useAuthSession'
import { usePendingFriendRequests } from '@/hooks/usePendingFriendRequests'
import { AuthModal } from '../AuthModal'
import { usePremiumMembership } from '@/hooks/usePremiumMembership'
import { ChromaElement, HeaderBrand } from '../ui'
import { getEffectiveRole, isAdmin } from '../../lib/permissions'
import { isHiddenPagePath } from '../../lib/hidden-pages'
import {
  isFeatureFlagEnabled,
  isFeatureFlagPreview,
  type FeatureFlagId,
} from '../../lib/feature-flags'
import { isAdminOnlyPath } from '../../lib/admin-access'
import { resolveMemberPublicName } from '../../lib/member-handle'
import { getAssetUrl } from '@/lib/assets'
import { HUDMobileTabBar } from './HUDMobileTabBar'
import { HudTopControls } from './HudTopControls'
import { useDesktopViewport } from '@/hooks/useDesktopViewport'
import { SUPPORT_PAGE_COPY } from '@/lib/support-tickets'

/**
 * Pages in the phone bottom bar; the rest go in its More sheet, in this order.
 * The Oracle is not a page tab: it sits in the middle of the bar as the synaptic core.
 */
const MOBILE_TAB_IDS = ['hub', 'character', 'forum']
const MOBILE_MORE_IDS = ['codex', 'academy']

const GUEST_LOCKED_PATHS = new Set(['/member', '/profile'])

export function computeNavItemHidden(
  item: { path: string; featureFlag?: FeatureFlagId },
  user?: { email?: string | null; role?: string | null; experiments?: unknown } | null,
  userRole?: string | null,
): boolean {
  return (
    isHiddenPagePath(item.path) ||
    Boolean(item.featureFlag && isFeatureFlagPreview(item.featureFlag, user, userRole))
  )
}

interface HUDSidebarProps {
  larvaId?: string
}

export const HUDSidebar: React.FC<HUDSidebarProps> = ({
  larvaId = 'LARVA UNIT #8971',
}) => {
  const router = typeof useRouter === 'function' ? useRouter() : null
  const navigate = useNavigate()
  const location = useLocation()

  const currentRoute = location.pathname

  const [pendingRoute, setPendingRoute] = useState<string | null>(null)
  const effectiveRoute = pendingRoute || currentRoute
  // Fullscreen Oracle is a focus view: no top bar or pill, so its own header controls sit at the top.
  const isOracleFullscreen = currentRoute.startsWith('/oracle')

  useEffect(() => {
    setPendingRoute(null)
  }, [currentRoute])

  const mobileCloseTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const mobileFrames = React.useRef<number[]>([])
  const mobileTriggerRef = React.useRef<HTMLButtonElement>(null)
  const mobileDialogRef = React.useRef<HTMLDivElement>(null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobileClosing, setIsMobileClosing] = useState(false)
  const [isMobileVisible, setIsMobileVisible] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  // Desktop is always the compact rail; search, notifications, tasks and the
  // account menu live in the floating top-right pill (HudTopControls).
  const isCollapsed = true
  const [isMounted, setIsMounted] = useState(false)
  const isDesktop = useDesktopViewport()
  const [topControlsSlot, setTopControlsSlot] = useState<HTMLElement | null>(null)

  // Track mount state for SSR safe portal rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // The desktop pill renders into a slot HudLayout keeps at the top of the workspace.
  useEffect(() => {
    if (!isDesktop) return
    setTopControlsSlot(document.getElementById('hud-top-controls-slot'))
  }, [isDesktop])

  const cancelMobileTransition = () => {
    if (mobileCloseTimer.current) clearTimeout(mobileCloseTimer.current)
    mobileFrames.current.forEach(cancelAnimationFrame)
    mobileFrames.current = []
  }
  useEffect(() => () => cancelMobileTransition(), [])

  const openMobileMenu = () => {
    cancelMobileTransition()
    setIsMobileOpen(true)
    setIsMobileClosing(false)
    mobileFrames.current.push(requestAnimationFrame(() => {
      mobileFrames.current.push(requestAnimationFrame(() => setIsMobileVisible(true)))
    }))
  }

  const closeMobileMenu = (callback?: () => void) => {
    cancelMobileTransition()
    setIsMobileVisible(false)
    setIsMobileClosing(true)
    mobileTriggerRef.current?.focus()
    mobileCloseTimer.current = setTimeout(() => {
      setIsMobileOpen(false)
      setIsMobileClosing(false)
      callback?.()
    }, window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 200)
  }

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) return
      cancelMobileTransition()
      setIsMobileOpen(false)
      setIsMobileClosing(false)
      setIsMobileVisible(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const toggleMobileMenu = () => {
    if (isMobileOpen && !isMobileClosing) {
      closeMobileMenu()
    } else {
      openMobileMenu()
    }
  }


  // Lock body scroll and handle Escape key when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      const prevOverflow = document.body.style.overflow
      const prevTouchAction = document.body.style.touchAction
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeMobileMenu()
        }
      }

      window.addEventListener('keydown', handleEscape)
      return () => {
        document.body.style.overflow = prevOverflow
        document.body.style.touchAction = prevTouchAction
        window.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isMobileOpen])

  const session = useAuthSession()
  const user = session.user
  const pendingFriendRequests = usePendingFriendRequests(user?.id)
  const isSessionPending = session.isPending
  // Shared, cached profile read (also refreshes on profile/handle/experiment change events).
  const { profile } = useAccountProfile(user?.id)
  const userRole = profile ? getEffectiveRole(user, profile.role) : null
  const memberHandle = profile?.handle ?? null
  const memberLarvaId = profile?.larvaId ?? larvaId
  const effectiveUserRole = getEffectiveRole(user, userRole)
  // `undefined` tells the top controls the character is still loading (placeholder, not a letter).
  const memberAvatar = profile === undefined ? undefined : parseLobsterAvatarConfig(profile?.avatarConfig)

  const displayName = resolveMemberPublicName({
    userId: user?.id,
    handle: memberHandle,
    larvaId: memberLarvaId,
  })

  const handleOpenCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'))
  }

  interface NavItem {
    id: string
    label: string
    shortLabel?: string
    icon: React.ComponentType<{ className?: string }>
    path: string
    featureFlag?: FeatureFlagId
  }

  interface NavGroup {
    id: string
    title: string
    items: NavItem[]
  }

  // One flat list: with six pages, section headings only added clicks.
  // A group with an empty title renders without a header and never collapses.
  const navGroups: NavGroup[] = [
    {
      id: 'core',
      title: '',
      items: [
        { id: 'hub', label: 'DASHBOARD', shortLabel: 'DASHBOARD', icon: LayoutDashboard, path: '/dashboard' },
        { id: 'character', label: 'CHARACTER', shortLabel: 'CHARACTER', icon: Shell, path: '/character' },
        { id: 'codex', label: 'CODEX', shortLabel: 'CODEX', icon: Scroll, path: '/codex' },
        { id: 'academy', label: 'ACADEMY', shortLabel: 'ACADEMY', icon: BookOpen, path: '/academy' },
        { id: 'forum', label: 'FORUM', shortLabel: 'FORUM', icon: MessagesSquare, path: '/forum' },
      ],
    },
  ]

  const canViewHiddenPages = isAdmin(user, userRole)
  const canViewAdmin = canViewHiddenPages
  const { membership: premiumMembership, canViewPremium } = usePremiumMembership()
  const showGoPremium = canViewPremium && premiumMembership !== null && !premiumMembership.isPremium
  const isAdminActive =
    effectiveRoute === '/admin' ||
    (effectiveRoute !== '/' && effectiveRoute.startsWith('/admin'))

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.featureFlag && !isFeatureFlagEnabled(item.featureFlag, user, userRole)) {
          return false
        }
        if (isAdminOnlyPath(item.path)) return canViewHiddenPages
        return canViewHiddenPages || !isHiddenPagePath(item.path)
      }),
    }))
    .filter((group) => group.items.length > 0)

  const getActiveGroupId = (route: string) => {
    const found = visibleNavGroups.find((group) =>
      group.items.some(
        (item) =>
          route === item.path ||
          (item.path !== '/' && route.startsWith(item.path))
      )
    )
    return found ? found.id : visibleNavGroups[0]?.id ?? 'core'
  }

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    [getActiveGroupId(effectiveRoute)]: true,
  }))

  // Ensure section containing active route is open without closing other sections
  useEffect(() => {
    const activeId = getActiveGroupId(effectiveRoute)
    setOpenGroups((prev) => {
      if (prev[activeId]) return prev
      return { ...prev, [activeId]: true }
    })
  }, [effectiveRoute, canViewHiddenPages])

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  const handlePrefetch = (path: string) => {
    try {
      router?.preloadRoute?.({ to: path as any })
    } catch {
      // ignore
    }
  }

  const handleNavClick = (path: string) => {
    setPendingRoute(path.split('?')[0])
    navigate(path.includes('?') ? { href: path } : { to: path })
    if (isMobileOpen) {
      closeMobileMenu()
    }
  }

  const renderNavGroupContent = (isMobile: boolean = false) => {
    // On phones the bottom bar holds the main pages; the More sheet lists the rest.
    const groups = isMobile
      ? visibleNavGroups.map((group) => ({
          ...group,
          items: MOBILE_MORE_IDS.map((id) => group.items.find((item) => item.id === id)).filter(
            (item): item is NavItem => Boolean(item),
          ),
        }))
      : visibleNavGroups
    return groups.map((group, groupIdx) => {
      const isFlat = !group.title
      const isOpen = isFlat || !!openGroups[group.id]
      const isGroupActive = group.items.some(
        (item) =>
          effectiveRoute === item.path ||
          (item.path !== '/' && effectiveRoute.startsWith(item.path))
      )

      if (!isMobile && isCollapsed) {
        return (
          <div key={group.id} className={groupIdx > 0 ? 'border-t border-line-subtle pt-1' : ''}>
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive =
                effectiveRoute === item.path ||
                (item.path !== '/' && effectiveRoute.startsWith(item.path))
              const hidden = computeNavItemHidden(item, user, userRole)

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  onMouseEnter={() => handlePrefetch(item.path)}
                  onFocus={() => handlePrefetch(item.path)}
                  data-hidden={hidden ? 'true' : undefined}
                  title={
                    hidden
                      ? 'Hidden page'
                      : !isSessionPending && !user?.id && GUEST_LOCKED_PATHS.has(item.path)
                        ? 'Needs an account'
                        : undefined
                  }
                  className={`w-full text-left relative flex flex-col items-center justify-center py-2 px-1 gap-1 transition-colors duration-150 group/navitem cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow ${
                    isActive
                      ? 'bg-surface-2'
                      : 'bg-transparent hover:bg-surface-2'
                  }`}
                >


                  {isActive && (
                    <div className={`absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-glow ${hidden ? 'opacity-45' : ''}`} />
                  )}

                  <span className="relative inline-flex">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${hidden ? 'opacity-40' : ''} ${
                        isActive
                          ? 'text-cyan-glow'
                          : 'text-ink-muted group-hover/navitem:text-ink transition-colors duration-150'
                      }`}
                    />
                    {!isSessionPending && !user?.id && GUEST_LOCKED_PATHS.has(item.path) && (
                      <Lock
                        data-testid="guest-lock-icon"
                        aria-hidden
                        className="absolute -top-1 -right-2 w-2.5 h-2.5 text-crimson-text/80"
                      />
                    )}
                  </span>


                  <span
                    className={`inline-flex items-center justify-center gap-0.5 text-[11px] font-sans font-bold tracking-normal uppercase leading-none text-center max-w-full transition-colors duration-150 ${
                      isActive
                        ? 'text-ink'
                        : 'text-ink-muted group-hover/navitem:text-ink'
                    }`}
                  >
                    <span className={`truncate ${hidden ? 'opacity-40' : ''}`}>
                      {item.shortLabel || item.label}
                    </span>
                    {hidden && (
                      <EyeOff
                        data-testid="hidden-page-icon"
                        aria-hidden
                        className="w-2.5 h-2.5 shrink-0 text-ink-muted"
                      />
                    )}
                  </span>
                  {hidden && <span className="sr-only">Hidden</span>}

                  {/* Clean Floating Tooltip */}
                  <div aria-hidden className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/navitem:opacity-100 transition-opacity duration-150">
                    <div className="rounded-control bg-surface-1 border border-line text-ink px-2.5 py-1.5 text-xs font-sans font-bold shadow-menu whitespace-nowrap flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow" />
                      <span className="tracking-[0.08em] uppercase">
                        {item.label}
                        {hidden ? ' · Hidden' : ''}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )
      }

      return (
        <div key={group.id} className="border-b border-line-subtle">
          {!isFlat && (
          <button
            onClick={() => toggleGroup(group.id)}
            className={`w-full flex items-center justify-between ${
              isMobile ? 'px-4 py-3' : 'px-3.5 py-2'
            } bg-surface-1 hover:bg-surface-2 border-b border-line-subtle text-left transition-colors duration-150 group/groupheader cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {isGroupActive && !isOpen && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow shrink-0 animate-pulse" />
              )}
              <span
                className={`font-sans ${
                  isMobile ? 'text-xs' : 'text-[11px]'
                } font-bold text-ink-muted group-hover/groupheader:text-ink tracking-[0.08em] uppercase truncate transition-colors duration-150`}
              >
                {group.title}
              </span>
            </div>
            <div className="flex items-center shrink-0 ml-2">
              <ChevronRight
                className={`${
                  isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'
                } transition-transform duration-200 ease-in-out ${
                  isOpen ? 'rotate-90 text-ink' : 'rotate-0 text-ink-muted group-hover/groupheader:text-ink'
                }`}
              />
            </div>
          </button>
          )}

          {/* Smooth Collapsible Section Content */}
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-250 ease-in-out ${
              isOpen
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden divide-y divide-line-subtle bg-surface-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  effectiveRoute === item.path ||
                  (item.path !== '/' && effectiveRoute.startsWith(item.path))
                const hidden = computeNavItemHidden(item, user, userRole)

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.path)}
                    onMouseEnter={() => handlePrefetch(item.path)}
                    onFocus={() => handlePrefetch(item.path)}
                    data-hidden={hidden ? 'true' : undefined}
                    title={hidden ? 'Hidden page' : undefined}
                    className={`w-full text-left relative flex items-center min-h-[44px] transition-colors duration-150 group/navitem ${
                      isMobile ? 'px-5 py-3 gap-3.5' : 'px-4 py-2.5 pl-5 gap-3'
                    } cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow ${
                      isActive
                        ? 'bg-surface-2'
                        : 'bg-transparent hover:bg-surface-2'
                    }`}
                  >


                    {isActive && (
                      <div className={`absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-glow ${hidden ? 'opacity-45' : ''}`} />
                    )}

                    <Icon
                      className={`${isMobile ? 'w-4.5 h-4.5' : 'w-4 h-4'} shrink-0 ${hidden ? 'opacity-40' : ''} ${
                        isActive
                          ? 'text-cyan-glow'
                          : 'text-ink-muted group-hover/navitem:text-ink transition-colors duration-150'
                      }`}
                    />

                    <div className={`flex flex-col min-w-0 justify-center overflow-hidden whitespace-nowrap flex-1 ${hidden ? 'opacity-40' : ''}`}>
                      <span
                        className={`${
                          isMobile ? 'text-xs md:text-sm' : 'text-xs md:text-[12.5px]'
                        } font-sans font-medium tracking-wide uppercase leading-tight transition-colors duration-150 ${
                          isActive
                            ? 'text-ink font-semibold'
                            : 'text-ink-body group-hover/navitem:text-ink'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {hidden && (
                      <EyeOff
                        data-testid="hidden-page-icon"
                        aria-hidden
                        className="w-3.5 h-3.5 text-ink-muted shrink-0"
                      />
                    )}
                    {hidden && <span className="sr-only">Hidden</span>}


                    {!isSessionPending && !user?.id && GUEST_LOCKED_PATHS.has(item.path) && (
                      <Lock className="w-3.5 h-3.5 text-crimson-text/80 shrink-0 ml-auto" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )
    })
  }

  useModalPanelFocus(isMobileOpen && !isMobileClosing && isMounted, mobileDialogRef, mobileTriggerRef)

  const desktopContentAnimation = ''
  const isMobileHeaderOpen = isMobileOpen && !isMobileClosing
  const allNavItems = visibleNavGroups.flatMap((group) => group.items)
  const mobileTabs = MOBILE_TAB_IDS.map((id) => allNavItems.find((item) => item.id === id))
    .filter((item): item is NavItem => Boolean(item))
    .map((item) => ({
      id: item.id,
      label: item.shortLabel ?? item.label,
      icon: item.icon,
      path: item.path,
      locked: !isSessionPending && !user?.id && GUEST_LOCKED_PATHS.has(item.path),
    }))
  const isOnPath = (path: string) => effectiveRoute === path || (path !== '/' && effectiveRoute.startsWith(path))
  const mobileActiveId =
    mobileTabs.find((tab) => isOnPath(tab.path))?.id ??
    (MOBILE_MORE_IDS.some((id) => {
      const item = allNavItems.find((navItem) => navItem.id === id)
      return item ? isOnPath(item.path) : false
    }) || isOnPath('/support') || isOnPath('/settings') || isOnPath('/max')
      ? 'more'
      : null)

  return (
    <>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => navigate({ to: '/dashboard' })}
      />

      {/* Main Desktop Sidebar Container / Mobile Trigger Bar */}
      <aside
        suppressHydrationWarning
        className={`w-full ${
          isCollapsed ? 'md:w-20' : 'md:w-56'
        } h-auto md:h-full md:min-h-0 md:max-h-full md:bg-surface-1 border-b-0 md:border-r border-line-subtle flex flex-col select-none relative z-40 md:z-50 shrink-0 md:shadow-2xl group/sidebar overflow-visible`}
      >
        {/* Phone top bar: emblem, then a pill with search, bell, today's ring and avatar; pages live in the bottom bar */}
        <div
          className={`${isOracleFullscreen ? 'hidden' : 'flex'} md:hidden items-center px-3 h-14 bg-surface-1 border-b border-line-subtle relative z-50 shrink-0`}
        >
          {!isDesktop && !isOracleFullscreen && (
            <HudTopControls
              variant="phone"
              user={user ? { ...user, avatarConfig: memberAvatar } : null}
              userRole={effectiveUserRole}
              displayName={displayName}
              isSessionPending={isSessionPending}
              pendingFriendRequests={pendingFriendRequests}
              onNavigate={(path) => (isMobileOpen ? closeMobileMenu(() => handleNavClick(path)) : handleNavClick(path))}
              onSignUp={() => setIsAuthModalOpen(true)}
            />
          )}
        </div>

        {/* Desktop: the same controls as one floating pill at the top-right of the workspace */}
        {isMounted &&
          isDesktop &&
          !isOracleFullscreen &&
          topControlsSlot &&
          createPortal(
            <HudTopControls
              variant="desktop"
              user={user ? { ...user, avatarConfig: memberAvatar } : null}
              userRole={effectiveUserRole}
              displayName={displayName}
              isSessionPending={isSessionPending}
              pendingFriendRequests={pendingFriendRequests}
              onNavigate={(path) => handleNavClick(path)}
              onSignUp={() => setIsAuthModalOpen(true)}
            />,
            topControlsSlot,
          )}

        {/* Desktop Header Logo */}
        <div
          className={`hidden md:flex items-center shrink-0 relative group/brand border-b border-line-subtle h-16 overflow-visible ${
            desktopContentAnimation
          } ${
            isCollapsed ? 'w-20 justify-center px-2' : 'w-56 justify-start px-3'
          }`}
        >
          <HeaderBrand
            isCollapsed={isCollapsed}
            onClick={() => handleNavClick('/')}
          />

          {/* Brand Tooltip when collapsed */}
          {isCollapsed && (
            <div aria-hidden className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-[200] pointer-events-none opacity-0 group-hover/brand:opacity-100 transition-all duration-200">
              <div className="rounded-control bg-surface-1 border border-line text-ink px-2.5 py-1 text-xs font-sans font-bold shadow-menu whitespace-nowrap">
                <span className="text-cyan-glow">Moltology home</span>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sidebar Navigation Container */}
        <div className={`hidden md:flex flex-1 flex-col justify-between space-y-0 overflow-visible min-h-0 shrink-0 ${desktopContentAnimation} ${isCollapsed ? 'w-20' : 'w-56'}`}>
          {/* Desktop Navigation Items List */}
          <nav className="flex-1 divide-y divide-line-subtle bg-surface-1 overflow-y-auto overflow-x-hidden min-h-0 overscroll-y-contain">
            {renderNavGroupContent(false)}
          </nav>

          {/* Desktop Bottom Controls: Admin and Help & Support (account lives in the top-right pill) */}
          <div className="mt-auto shrink-0 border-t border-line-subtle divide-y divide-line-subtle bg-surface-1 relative z-40 overflow-visible">
            {/* Desktop Bottom Controls: Admin and Help & Support */}
              <div className="flex flex-col divide-y divide-line-subtle relative overflow-visible">
                {/* Admin Nav Item (Stacked on Top of Support) */}
                {canViewAdmin && (
                  <div
                    className={`relative transition-colors duration-150 overflow-visible ${
                      isAdminActive
                        ? 'bg-surface-2'
                        : 'bg-surface-1 hover:bg-surface-2'
                    }`}
                  >
                    <button
                      onClick={() => handleNavClick('/admin')}
                      onMouseEnter={() => handlePrefetch('/admin')}
                      onFocus={() => handlePrefetch('/admin')}
                      aria-label="ADMIN"
                      className="w-full text-left relative flex flex-col items-center justify-center py-2 px-1 gap-1 transition-colors duration-150 group/admin cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
                    >
                      {isAdminActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-glow" />
                      )}

                      <ShieldCheck
                        className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                          isAdminActive
                            ? 'text-cyan-glow'
                            : 'text-ink-muted group-hover/admin:text-ink'
                        }`}
                      />

                      <span
                        className={`text-[11px] font-sans font-bold tracking-normal uppercase leading-none text-center truncate max-w-full transition-colors duration-150 ${
                          isAdminActive
                            ? 'text-cyan-glow'
                            : 'text-ink-muted group-hover/admin:text-ink'
                        }`}
                      >
                        ADMIN
                      </span>

                      {/* Tooltip */}
                      <div aria-hidden className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[200] pointer-events-none opacity-0 group-hover/admin:opacity-100 transition-opacity duration-150">
                        <div className="rounded-control bg-surface-1 border border-line text-ink px-2.5 py-1.5 text-xs font-sans font-bold shadow-menu whitespace-nowrap flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow" />
                          <span className="tracking-[0.08em] uppercase">ADMIN</span>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Go Oracle MAX (free members who can see the premium experiment) */}
                {showGoPremium && (
                  <div className={`relative transition-colors duration-150 ${effectiveRoute === '/max' ? 'bg-surface-2' : 'bg-surface-1 hover:bg-surface-2'}`}>
                    <button
                      onClick={() => handleNavClick('/max')}
                      onMouseEnter={() => handlePrefetch('/max')}
                      onFocus={() => handlePrefetch('/max')}
                      aria-label="Go Oracle MAX"
                      title="Go Oracle MAX"
                      className="w-full relative flex flex-col items-center justify-center py-2 px-1 gap-1 transition-colors duration-150 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
                    >
                      {effectiveRoute === '/max' && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-glow" />}
                      <Sparkles className="w-4 h-4 shrink-0 text-cyan-glow" />
                      <span className="text-[11px] font-sans font-bold tracking-normal uppercase leading-none text-center text-cyan-glow">MAX</span>
                    </button>
                  </div>
                )}

                {/* Help & Support Nav Item */}
                <div
                  className={`relative transition-colors duration-150 overflow-visible ${
                    currentRoute === '/support'
                      ? 'bg-surface-2'
                      : 'bg-surface-1 hover:bg-surface-2'
                  }`}
                >
                  <button
                    onClick={() => handleNavClick('/support')}
                    onMouseEnter={() => handlePrefetch('/support')}
                    onFocus={() => handlePrefetch('/support')}
                    className="w-full text-left relative flex flex-col items-center justify-center py-2 px-1 gap-1 transition-colors duration-150 group/help cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
                  >
                    {currentRoute === '/support' && (
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-glow" />
                    )}

                    <LifeBuoy
                      className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                        currentRoute === '/support'
                          ? 'text-cyan-glow'
                          : 'text-ink-muted group-hover/help:text-ink'
                      }`}
                    />

                    <span
                      className={`text-[11px] font-sans font-bold tracking-normal uppercase leading-none text-center truncate max-w-full transition-colors duration-150 ${
                        currentRoute === '/support'
                          ? 'text-cyan-glow'
                          : 'text-ink-muted group-hover/help:text-ink'
                      }`}
                    >
                      SUPPORT
                    </span>

                    {/* Tooltip */}
                    <div aria-hidden className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[200] pointer-events-none opacity-0 group-hover/help:opacity-100 transition-opacity duration-150">
                      <div className="rounded-control bg-surface-1 border border-line text-ink px-2.5 py-1.5 text-xs font-sans font-bold shadow-menu whitespace-nowrap flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow" />
                        <span className="tracking-[0.08em] uppercase">
                          SUPPORT
                        </span>
                      </div>
                    </div>
                  </button>
                </div>

              </div>
          </div>
        </div>
      </aside>

      <HUDMobileTabBar
        tabs={mobileTabs}
        activeId={mobileActiveId}
        moreOpen={isMobileHeaderOpen}
        onNavigate={(path) => handleNavClick(path)}
        onToggleMore={toggleMobileMenu}
        moreButtonRef={mobileTriggerRef}
        core={{ current: isOnPath('/oracle'), onPress: () => handleNavClick('/oracle') }}
      />

      {/* Phone More sheet: sized to its rows and sitting on the bottom bar, over a dimmed page.
          Rendered beside the bottom bar (not portalled to body) so the bar's raised Oracle core,
          one z-index step higher, stays on top of the sheet. */}
      {isMounted &&
        (isMobileOpen || isMobileClosing) && (
          <>
          <div
            aria-hidden
            data-testid="more-backdrop"
            onClick={() => closeMobileMenu()}
            className={`md:hidden fixed inset-x-0 ${isOracleFullscreen ? 'top-0' : 'top-14'} bottom-[calc(var(--hud-tabbar-height)+env(safe-area-inset-bottom,0px))] z-[99989] bg-abyss/70 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
              isMobileVisible && !isMobileClosing ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
          <div
            ref={mobileDialogRef}
            tabIndex={-1}
            inert={isMobileClosing}
            aria-hidden={isMobileClosing}
            role="dialog"
            aria-modal="true"
            aria-label="More pages"
            className={`md:hidden fixed inset-x-0 bottom-[calc(var(--hud-tabbar-height)+env(safe-area-inset-bottom,0px))] ${isOracleFullscreen ? 'max-h-[calc(100dvh-var(--hud-tabbar-height)-env(safe-area-inset-bottom,0px))]' : 'max-h-[calc(100dvh-3.5rem-var(--hud-tabbar-height)-env(safe-area-inset-bottom,0px))]'} z-[99990] w-screen bg-surface-1 border-t border-line rounded-t-card shadow-menu flex flex-col font-sans text-ink select-none overflow-hidden transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
              isMobileVisible && !isMobileClosing
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            {/* Pages that are not in the bottom bar */}
            <nav className="divide-y divide-line-subtle bg-surface-1 overflow-y-auto overflow-x-hidden min-h-0 overscroll-contain">
              {renderNavGroupContent(true)}
            </nav>

            {/* Mobile Bottom Controls: Admin + Help & Support (account lives in the top bar) */}
            <div className="mt-auto shrink-0 border-t border-line-subtle divide-y divide-line-subtle bg-surface-1">
              {/* Admin Nav Item (Mobile) */}
              {canViewAdmin && (
                <div
                  className={`transition-colors duration-150 ${
                    isAdminActive
                      ? 'bg-surface-2'
                      : 'bg-surface-1 hover:bg-surface-2'
                  }`}
                >
                  <button
                    onClick={() => handleNavClick('/admin')}
                    onMouseEnter={() => handlePrefetch('/admin')}
                    onFocus={() => handlePrefetch('/admin')}
                    className="w-full text-left relative flex items-center min-h-[44px] transition-colors duration-150 group/admin cursor-pointer px-5 py-3 gap-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
                  >
                    {isAdminActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-glow" />
                    )}

                    <ShieldCheck
                      className={`w-4.5 h-4.5 shrink-0 transition-colors duration-150 ${
                        isAdminActive
                          ? 'text-cyan-glow'
                          : 'text-ink-muted group-hover/admin:text-ink'
                      }`}
                    />

                    <div className="flex flex-col min-w-0 justify-center overflow-hidden whitespace-nowrap flex-1">
                      <span
                        className={`text-xs md:text-sm font-sans font-medium tracking-wide uppercase leading-tight transition-colors duration-150 ${
                          isAdminActive
                            ? 'text-ink font-semibold'
                            : 'text-ink-body group-hover/admin:text-ink'
                        }`}
                      >
                        ADMIN
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {/* Go Oracle MAX (Mobile): the same entry as the desktop rail's MAX item */}
              {showGoPremium && (
                <div className={`transition-colors duration-150 ${effectiveRoute === '/max' ? 'bg-surface-2' : 'bg-surface-1 hover:bg-surface-2'}`}>
                  <button
                    onClick={() => handleNavClick('/max')}
                    onMouseEnter={() => handlePrefetch('/max')}
                    onFocus={() => handlePrefetch('/max')}
                    className="w-full text-left relative flex items-center min-h-[44px] transition-colors duration-150 cursor-pointer px-5 py-3 gap-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
                  >
                    {effectiveRoute === '/max' && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-glow" />}
                    <Sparkles className="w-4.5 h-4.5 shrink-0 text-cyan-glow" />
                    <span className="text-xs font-sans font-semibold tracking-wide uppercase leading-tight text-cyan-glow">
                      ORACLE MAX
                    </span>
                  </button>
                </div>
              )}

              {/* Help & Support Nav Item (Full width row) */}
              <div
                className={`transition-colors duration-150 ${
                  currentRoute === '/support'
                    ? 'bg-surface-2'
                    : 'bg-surface-1 hover:bg-surface-2'
                }`}
              >
                <button
                  onClick={() => handleNavClick('/support')}
                  onMouseEnter={() => handlePrefetch('/support')}
                  onFocus={() => handlePrefetch('/support')}
                  className="w-full text-left relative flex items-center min-h-[44px] transition-colors duration-150 group/help cursor-pointer px-5 py-3 gap-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
                  title={SUPPORT_PAGE_COPY.pageTitle}
                >
                  {currentRoute === '/support' && (
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-glow" />
                  )}

                  <LifeBuoy
                    className={`w-4.5 h-4.5 shrink-0 transition-colors duration-150 ${
                      currentRoute === '/support'
                        ? 'text-cyan-glow'
                        : 'text-ink-muted group-hover/help:text-ink'
                    }`}
                  />

                  <div className="flex flex-col min-w-0 justify-center overflow-hidden whitespace-nowrap flex-1">
                    <span
                      className={`text-xs md:text-sm font-sans font-medium tracking-wide uppercase leading-tight transition-colors duration-150 ${
                        currentRoute === '/support'
                          ? 'text-ink font-semibold'
                          : 'text-ink-body group-hover/help:text-ink'
                      }`}
                    >
                      SUPPORT
                    </span>
                  </div>
                </button>
              </div>

            </div>
          </div>
          </>
        )}
    </>
  )
}
