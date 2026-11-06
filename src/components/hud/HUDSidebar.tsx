import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useModalPanelFocus } from '@/hooks/useModalPanelFocus'
import { useNavigate, useLocation, useRouter } from '@tanstack/react-router'
import {

  LayoutDashboard,
  BookOpen,
  Scroll,
  Sliders,
  Users,
  Atom,
  Search,
  LogOut,
  UserPlus,
  LifeBuoy,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  Lock,
  EyeOff,
  ShieldCheck,

  CircleUser,
} from 'lucide-react'
import { getUserProfileFn } from '../../lib/server/api'
import { getAuthJWTToken } from '../../lib/jwt'
import { useAuthSession } from '@/hooks/useAuthSession'
import { usePendingFriendRequests } from '@/hooks/usePendingFriendRequests'
import { AuthModal } from '../AuthModal'
import { BenthicCTAButton } from './BenthicCTAButton'
import { ChromaElement, HeaderBrand, AnimatedHamburger } from '../ui'
import { usePremiumMembership } from '@/hooks/usePremiumMembership'
import { getEffectiveRole, isAdmin } from '../../lib/permissions'
import { isHiddenPagePath } from '../../lib/hidden-pages'
import {
  isFeatureFlagEnabled,
  isFeatureFlagPreview,
  type FeatureFlagId,
} from '../../lib/feature-flags'
import { isAdminOnlyPath } from '../../lib/admin-access'
import { resolveMemberPublicName } from '../../lib/member-handle'
import { UserAvatar } from '../UserAvatar'
import { UserAvatarMenu } from '../UserAvatarMenu'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { getAssetUrl } from '@/lib/assets'
import { HUDMobileTabBar } from './HUDMobileTabBar'
import { HUDTaskBar } from './HUDTaskBar'
import { NotificationsBell } from './NotificationsBell'
import { SUPPORT_PAGE_COPY } from '@/lib/support-tickets'

/** Pages in the phone bottom bar; the rest go in its More sheet, in this order. */
const MOBILE_TAB_IDS = ['hub', 'oracle', 'character', 'forum']
const MOBILE_MORE_IDS = ['profile', 'codex', 'academy']

const GUEST_LOCKED_PATHS = new Set(['/academy', '/character', '/member', '/profile'])

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

  useEffect(() => {
    setPendingRoute(null)
  }, [currentRoute])

  const mobileCloseTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const mobileFrames = React.useRef<number[]>([])
  const mobileTriggerRef = React.useRef<HTMLButtonElement>(null)
  const mobileDialogRef = React.useRef<HTMLDivElement>(null)
  const [isNavAnimating, setIsNavAnimating] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobileClosing, setIsMobileClosing] = useState(false)
  const [isMobileVisible, setIsMobileVisible] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  // Starts expanded to match the server render; the saved choice is applied
  // before first paint in the layout effect below.
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = React.useRef<{ startX: number; hasMoved: boolean }>({
    startX: 0,
    hasMoved: false,
  })

  // Apply the saved collapsed state before paint so there is no visible jump.
  useLayoutEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('moltology_hud_sidebar_collapsed')
      if (savedCollapsed !== null) {
        setIsCollapsed(savedCollapsed === 'true')
      }
    } catch {
      // Fallback for localStorage access restrictions
    }
  }, [])

  // Track mount state for SSR safe portal rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const cancelMobileTransition = () => {
    if (mobileCloseTimer.current) clearTimeout(mobileCloseTimer.current)
    mobileFrames.current.forEach(cancelAnimationFrame)
    mobileFrames.current = []
  }
  useEffect(() => () => cancelMobileTransition(), [])

  useEffect(() => {
    setIsNavAnimating(true)
    const timer = setTimeout(() => setIsNavAnimating(false), window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 200)
    return () => clearTimeout(timer)
  }, [isCollapsed])

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

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('moltology_hud_sidebar_collapsed', String(next))
      }
      return next
    })
  }

  const handleRailMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Left click only
    e.preventDefault()

    dragStartRef.current = {
      startX: e.clientX,
      hasMoved: false,
    }
    setIsDragging(true)
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.startX
      if (Math.abs(deltaX) > 8) {
        dragStartRef.current.hasMoved = true
      }

      if (isCollapsed) {
        // Dragging right from collapsed state to expand
        if (deltaX > 25 || moveEvent.clientX > 110) {
          setIsCollapsed(false)
          if (typeof window !== 'undefined') {
            localStorage.setItem('moltology_hud_sidebar_collapsed', 'false')
          }
        }
      } else {
        // Dragging left from expanded state to collapse
        if (deltaX < -25 || moveEvent.clientX < 220) {
          setIsCollapsed(true)
          if (typeof window !== 'undefined') {
            localStorage.setItem('moltology_hud_sidebar_collapsed', 'true')
          }
        }
      }
    }

    const handleMouseUp = () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
      if (typeof document !== 'undefined') {
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      setIsDragging(false)

      if (!dragStartRef.current.hasMoved) {
        // Click without dragging -> toggle collapse/expand
        toggleCollapse()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
  }

  // Keyboard shortcut (⌘B / Ctrl+B) to toggle collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggleCollapse()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
  const requestBadgeLabel = `, ${pendingFriendRequests} friend request${pendingFriendRequests === 1 ? '' : 's'} waiting`
  const isSessionPending = session.isPending
  const [memberAvatar, setMemberAvatar] = useState<import('@/lib/lobster-avatar').LobsterAvatarConfig | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [memberHandle, setMemberHandle] = useState<string | null>(null)
  const [memberLarvaId, setMemberLarvaId] = useState(larvaId)
  const effectiveUserRole = getEffectiveRole(user, userRole)

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const token = await getAuthJWTToken().catch(() => null)
      return await getUserProfileFn({ data: { token: token ?? undefined, userId } })
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setMemberAvatar(null)
      setUserRole(null)
      setMemberHandle(null)
      setMemberLarvaId(larvaId)
      return
    }
    const profileUserId = user.id
    if (!profileUserId) return
    let isSubscribed = true
    const applyProfile = (profile: { avatarConfig?: import('@/lib/lobster-avatar').LobsterAvatarConfig | null; role?: string | null; handle?: string | null; larvaId?: string | null } | null) => {
      if (!isSubscribed) return
      const role = getEffectiveRole(user, profile?.role)
      setMemberAvatar(profile?.avatarConfig ?? null)
      setUserRole(role)
      setMemberHandle(profile?.handle ?? null)
      setMemberLarvaId(profile?.larvaId ?? larvaId)
    }
    loadUserProfile(profileUserId)
      .then(applyProfile)
      .catch(() => applyProfile(null))
    const onHandleChanged = () => {
      loadUserProfile(profileUserId).then(applyProfile).catch(() => applyProfile(null))
    }
    window.addEventListener('profile-avatar-changed', onHandleChanged)
    window.addEventListener('member-handle-changed', onHandleChanged)
    return () => {
      isSubscribed = false
      window.removeEventListener('profile-avatar-changed', onHandleChanged)
      window.removeEventListener('member-handle-changed', onHandleChanged)
    }
  }, [user?.id, user?.email, user?.role, loadUserProfile, larvaId])

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
        { id: 'oracle', label: 'ORACLE', shortLabel: 'ORACLE', icon: Atom, path: '/oracle' },
        { id: 'character', label: 'CHARACTER', shortLabel: 'CHARACTER', icon: Sliders, path: '/character' },
        { id: 'profile', label: 'PROFILE', shortLabel: 'PROFILE', icon: CircleUser, path: '/profile' },
        { id: 'codex', label: 'CODEX', shortLabel: 'CODEX', icon: Scroll, path: '/codex' },
        { id: 'academy', label: 'ACADEMY', shortLabel: 'ACADEMY', icon: BookOpen, path: '/academy' },
        { id: 'forum', label: 'FORUM', shortLabel: 'FORUM', icon: Users, path: '/forum' },
      ],
    },
  ]

  const canViewHiddenPages = isAdmin(user, userRole)
  const canViewAdmin = canViewHiddenPages
  const { membership: premiumMembership, canViewPremium } = usePremiumMembership()
  const showGoPremium = canViewPremium && premiumMembership !== null && !premiumMembership.isPremium
  const accountSubtitle = premiumMembership
    ? premiumMembership.isPremium
      ? 'Oracle MAX member'
      : 'Free plan'
    : 'Account and settings'
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
                  title={hidden ? 'Hidden page' : undefined}
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
                    {item.id === 'profile' && pendingFriendRequests > 0 && (
                      <span
                        data-testid="profile-requests-dot"
                        className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-cyan-glow ring-2 ring-abyss"
                      />
                    )}
                  </span>
                  {item.id === 'profile' && pendingFriendRequests > 0 && (
                    <span className="sr-only">{requestBadgeLabel}</span>
                  )}

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
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/navitem:opacity-100 transition-opacity duration-150">
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

                    {item.id === 'profile' && pendingFriendRequests > 0 && (
                      <span className="ml-auto min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-cyan-glow text-[11px] font-sans font-bold text-abyss tabular-nums shrink-0">
                        <span aria-hidden="true">{pendingFriendRequests > 99 ? '99+' : pendingFriendRequests}</span>
                        <span className="sr-only">{requestBadgeLabel}</span>
                      </span>
                    )}

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

  const desktopContentAnimation = isMounted
    ? `${isCollapsed ? 'animate-[sidebar-content-compact_200ms_ease-out]' : 'animate-[sidebar-content-expanded_200ms_ease-out]'} motion-reduce:animate-none`
    : ''
  const isMobileHeaderOpen = isMobileOpen && !isMobileClosing
  const allNavItems = visibleNavGroups.flatMap((group) => group.items)
  const mobileTabs = MOBILE_TAB_IDS.map((id) => allNavItems.find((item) => item.id === id))
    .filter((item): item is NavItem => Boolean(item))
    .map((item) => ({ id: item.id, label: item.shortLabel ?? item.label, icon: item.icon, path: item.path }))
  const isOnPath = (path: string) => effectiveRoute === path || (path !== '/' && effectiveRoute.startsWith(path))
  const mobileActiveId =
    mobileTabs.find((tab) => isOnPath(tab.path))?.id ??
    (MOBILE_MORE_IDS.some((id) => {
      const item = allNavItems.find((navItem) => navItem.id === id)
      return item ? isOnPath(item.path) : false
    }) || isOnPath('/support') || isOnPath('/settings')
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
        } h-auto md:h-full md:min-h-0 md:max-h-full bg-surface-1 border-b-0 md:border-r border-line-subtle flex flex-col select-none relative z-40 md:z-50 shrink-0 shadow-2xl ${
          isMounted ? 'transition-[width] duration-200 ease-out motion-reduce:transition-none' : ''
        } group/sidebar ${isNavAnimating ? 'md:overflow-hidden' : 'overflow-visible'}`}
      >
        {/* Mobile Top Bar (Transitions between HeaderBrand and Progress Bar when hamburger menu is toggled) */}
        <div className="flex md:hidden items-center justify-between gap-2 px-2.5 py-2 h-14 bg-surface-1 border-b border-line-subtle relative z-50 shrink-0 overflow-hidden">
          {/* HUD scanline overlay in mobile header */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.5) 2px, rgba(0,255,255,0.5) 3px)',
              }}
            />
          </div>

          {/* Brand */}
          <div className="flex items-center min-w-0 z-10 relative flex-1">
            <HeaderBrand
              logoSize="sm"
              onClick={() => handleNavClick('/dashboard')}
            />
          </div>

          {/* Search and today's tasks; pages live in the bottom bar */}
          <div className="flex items-center gap-1.5 shrink-0 z-10">
            <button
              type="button"
              onClick={() => (isMobileOpen ? closeMobileMenu(() => handleOpenCommandPalette()) : handleOpenCommandPalette())}
              aria-label="Search"
              title="Search pages and members"
              className="w-9 h-9 flex items-center justify-center rounded-control border border-line bg-surface-1 text-cyan-glow hover:bg-surface-2 hover:border-line-strong transition-colors active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow shrink-0 cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
            <NotificationsBell variant="header" />
            <HUDTaskBar variant="header" />
          </div>
        </div>

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
            onClick={() => handleNavClick('/dashboard')}
          />

          {/* Brand Tooltip when collapsed */}
          {isCollapsed && (
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-[200] pointer-events-none opacity-0 group-hover/brand:opacity-100 transition-all duration-200">
              <div className="rounded-control bg-surface-1 border border-line text-ink px-2.5 py-1 text-xs font-sans font-bold shadow-menu whitespace-nowrap">
                <span className="text-cyan-glow">Moltology</span>
                <span className="block text-[11px] text-ink-muted font-sans">Click or drag edge to expand (⌘B)</span>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Interactive Edge-Grab Rail (Drag or click to collapse/expand) */}
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Click or drag edge right to expand (⌘B)' : 'Click or drag edge left to collapse (⌘B)'}
          onMouseDown={handleRailMouseDown}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggleCollapse()
            }
          }}
          className="hidden md:block absolute top-0 bottom-0 -right-1.5 w-3 z-50 cursor-col-resize select-none group/rail transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"
        >
          {/* Glowing Vertical Cyber Rail Line */}
          <div
            className={`absolute top-0 bottom-0 left-[5px] w-[2px] transition-all duration-200 ${
              isDragging
                ? 'bg-cyan-glow shadow-[0_0_10px_rgba(0,195,255,0.9)] opacity-100'
                : 'bg-transparent group-hover/rail:bg-cyan-glow/80 opacity-0 group-hover/rail:opacity-100'
            }`}
          />
        </div>

        {/* Desktop Sidebar Navigation Container */}
        <div className={`hidden md:flex flex-1 flex-col justify-between space-y-0 overflow-visible min-h-0 shrink-0 ${desktopContentAnimation} ${isCollapsed ? 'w-20' : 'w-56'}`}>
          {/* Search Bar — full width, above nav */}
          <div className="shrink-0 border-b border-line-subtle">
            <button
              onClick={handleOpenCommandPalette}
              className={`w-full flex items-center justify-between px-4 py-3 bg-surface-1 hover:bg-surface-2 text-xs font-sans text-ink-muted hover:text-ink transition-all group focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Search pages and members"
            >
              {isCollapsed ? (
                <Search className="w-4 h-4 text-cyan-glow group-hover:scale-110 transition-transform mx-auto" />
              ) : (
                <div className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5 text-cyan-glow group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">Search…</span>
                </div>
              )}
            </button>
          </div>

          {/* Desktop Navigation Items List */}
          <nav className="flex-1 divide-y divide-line-subtle bg-surface-1 overflow-y-auto overflow-x-hidden min-h-0 overscroll-y-contain">
            {renderNavGroupContent(false)}
          </nav>

          {/* Desktop Bottom Controls: Notifications, Daily alignment, Admin, Help & Support, Profile/Auth */}
          <div className="mt-auto shrink-0 border-t border-line-subtle divide-y divide-line-subtle bg-surface-1 relative z-40 overflow-visible">
            <NotificationsBell variant="sidebar" collapsed={isCollapsed} />
            <HUDTaskBar variant="sidebar" collapsed={isCollapsed} />
            {/* Desktop Bottom Controls: Help & Support + User Avatar / Auth */}
            {isCollapsed ? (
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
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[200] pointer-events-none opacity-0 group-hover/admin:opacity-100 transition-opacity duration-150">
                        <div className="rounded-control bg-surface-1 border border-line text-ink px-2.5 py-1.5 text-xs font-sans font-bold shadow-menu whitespace-nowrap flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow" />
                          <span className="tracking-[0.08em] uppercase">ADMIN</span>
                        </div>
                      </div>
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
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[200] pointer-events-none opacity-0 group-hover/help:opacity-100 transition-opacity duration-150">
                      <div className="rounded-control bg-surface-1 border border-line text-ink px-2.5 py-1.5 text-xs font-sans font-bold shadow-menu whitespace-nowrap flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow" />
                        <span className="tracking-[0.08em] uppercase">
                          HELP &amp; SUPPORT
                        </span>
                      </div>
                    </div>
                  </button>
                </div>

                {/* User Avatar Menu / Auth Button (Stacked on Bottom) */}
                <div className="bg-surface-1 py-2 px-1 flex items-center justify-center relative overflow-visible">
                  {isSessionPending ? (
                    <div className="flex items-center justify-center p-1" data-testid="sidebar-auth-skeleton">
                      <HudGhostSkeleton variant="neutral" preset="avatar" width={28} height={28} />
                    </div>
                  ) : !user ? (
                    <div className="relative group/auth flex justify-center overflow-visible">
                      <BenthicCTAButton
                        variant="cyan"
                        size="sm"
                        onClick={() => setIsAuthModalOpen(true)}
                        className="!px-2.5 !py-1.5 flex items-center justify-center active:scale-95"
                        title="Sign Up / Initialize Operative"
                      >
                        <span className="flex items-center gap-1 text-[11px]">
                          <UserPlus className="w-3.5 h-3.5" />
                        </span>
                      </BenthicCTAButton>
                      {/* Tooltip */}
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[200] pointer-events-none opacity-0 group-hover/auth:opacity-100 transition-opacity duration-150">
                        <div className="rounded-control bg-surface-1 border border-line text-ink px-2.5 py-1.5 text-xs font-sans font-bold shadow-menu whitespace-nowrap flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow" />
                          <span className="tracking-[0.08em] uppercase">SIGN UP</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-50 flex items-center justify-center overflow-visible">
                      <UserAvatarMenu
                        user={{...user, avatarConfig:memberAvatar}}
                        userRole={effectiveUserRole}
                        displayName={displayName}
                        onNavigate={(path) => navigate({ to: path })}
                        align="left"
                        openDirection="up"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-line-subtle relative overflow-visible">
                {/* Admin Nav Item (Above Help & Support, Expanded) */}
                {canViewAdmin && (
                  <div
                    className={`relative transition-colors duration-150 overflow-visible min-h-[44px] ${
                      isAdminActive
                        ? 'bg-surface-2'
                        : 'bg-surface-1 hover:bg-surface-2'
                    }`}
                  >
                    <button
                      onClick={() => handleNavClick('/admin')}
                      onMouseEnter={() => handlePrefetch('/admin')}
                      onFocus={() => handlePrefetch('/admin')}
                      className="w-full text-left relative flex items-center min-h-[44px] px-4 py-2.5 pl-5 gap-3 transition-colors duration-150 group/admin cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
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

                      <div className="flex flex-col min-w-0 justify-center overflow-hidden whitespace-nowrap flex-1">
                        <span
                          className={`text-xs md:text-[12.5px] font-sans font-medium tracking-wide uppercase leading-tight transition-colors duration-150 ${
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

                {/* Help & Support Nav Item (Expanded) */}
                <div
                  className={`relative transition-colors duration-150 overflow-visible min-h-[44px] ${
                    currentRoute === '/support'
                      ? 'bg-surface-2'
                      : 'bg-surface-1 hover:bg-surface-2'
                  }`}
                >
                  <button
                    onClick={() => handleNavClick('/support')}
                    onMouseEnter={() => handlePrefetch('/support')}
                    onFocus={() => handlePrefetch('/support')}
                    className="w-full text-left relative flex items-center min-h-[44px] px-4 py-2.5 pl-5 gap-3 transition-colors duration-150 group/help cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
                    title={SUPPORT_PAGE_COPY.pageTitle}
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

                    <div className="flex flex-col min-w-0 justify-center overflow-hidden whitespace-nowrap flex-1">
                      <span
                        className={`text-xs md:text-[12.5px] font-sans font-medium tracking-wide uppercase leading-tight transition-colors duration-150 ${
                          currentRoute === '/support'
                            ? 'text-ink font-semibold'
                            : 'text-ink-body group-hover/help:text-ink'
                        }`}
                      >
                        HELP &amp; SUPPORT
                      </span>
                    </div>
                  </button>
                </div>

                {/* Go Oracle MAX (free members only, Expanded) */}
                {showGoPremium && (
                  <div
                    className={`relative transition-colors duration-150 min-h-[44px] ${
                      effectiveRoute === '/premium'
                        ? 'bg-surface-2'
                        : 'bg-surface-1 hover:bg-surface-2'
                    }`}
                  >
                    <button
                      onClick={() => handleNavClick('/premium')}
                      onMouseEnter={() => handlePrefetch('/premium')}
                      onFocus={() => handlePrefetch('/premium')}
                      className="w-full text-left relative flex items-center min-h-[44px] px-4 py-2.5 pl-5 gap-3 transition-colors duration-150 group/premium cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
                    >
                      {effectiveRoute === '/premium' && (
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-glow" />
                      )}
                      <Sparkles className="w-4 h-4 shrink-0 text-cyan-glow" />
                      <span className="flex-1 min-w-0 truncate text-xs md:text-[12.5px] font-sans font-semibold tracking-wide uppercase leading-tight text-cyan-glow">
                        Go Oracle MAX
                      </span>
                    </button>
                  </div>
                )}

                {/* Account Row: avatar, name and plan / Auth (Expanded) */}
                <div className="relative bg-surface-1 overflow-visible">
                  {isSessionPending ? (
                    <div className="flex items-center gap-3 min-h-[56px] px-4" data-testid="sidebar-auth-skeleton">
                      <HudGhostSkeleton variant="neutral" preset="avatar" width={32} height={32} />
                    </div>
                  ) : !user ? (
                    <div className="p-3">
                      <BenthicCTAButton
                        variant="cyan"
                        size="sm"
                        fullWidth
                        onClick={() => setIsAuthModalOpen(true)}
                      >
                        <span className="flex items-center justify-center gap-1.5 text-[11px]">
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>SIGN UP</span>
                        </span>
                      </BenthicCTAButton>
                    </div>
                  ) : (
                    <div className="relative z-50 overflow-visible">
                      <UserAvatarMenu
                        user={{...user, avatarConfig:memberAvatar}}
                        userRole={effectiveUserRole}
                        displayName={displayName}
                        onNavigate={(path) => navigate({ to: path })}
                        align="left"
                        openDirection="up"
                        trigger="row"
                        subtitle={accountSubtitle}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <HUDMobileTabBar
        tabs={mobileTabs}
        activeId={mobileActiveId}
        moreOpen={isMobileHeaderOpen}
        moreBadge={pendingFriendRequests}
        onNavigate={(path) => handleNavClick(path)}
        onToggleMore={toggleMobileMenu}
        moreButtonRef={mobileTriggerRef}
      />

      {/* Phone More sheet: sized to its rows and sitting on the bottom bar, over a dimmed page */}
      {isMounted &&
        (isMobileOpen || isMobileClosing) &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
          <div
            aria-hidden
            data-testid="more-backdrop"
            onClick={() => closeMobileMenu()}
            className={`md:hidden fixed inset-x-0 top-14 bottom-[calc(var(--hud-tabbar-height)+env(safe-area-inset-bottom,0px))] z-[99989] bg-abyss/70 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
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
            className={`md:hidden fixed inset-x-0 bottom-[calc(var(--hud-tabbar-height)+env(safe-area-inset-bottom,0px))] max-h-[calc(100dvh-3.5rem-var(--hud-tabbar-height)-env(safe-area-inset-bottom,0px))] z-[99990] w-screen bg-surface-1 border-t border-line rounded-t-card shadow-menu flex flex-col font-sans text-ink select-none overflow-hidden transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
              isMobileVisible && !isMobileClosing
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            {/* Pages that are not in the bottom bar */}
            <nav className="divide-y divide-line-subtle bg-surface-1 overflow-y-auto overflow-x-hidden min-h-0 overscroll-contain">
              {renderNavGroupContent(true)}
            </nav>

            {/* Mobile Bottom Controls: Admin + Help & Support + Operative Account / Auth */}
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
                      HELP &amp; SUPPORT
                    </span>
                  </div>
                </button>
              </div>

              {/* Dedicated Operative Account / Auth Separate Row (matching homepage mobile header pattern) */}
              <div className="p-3 bg-surface-1">
                {isSessionPending ? (
                  <div className="flex items-center justify-center py-2" data-testid="mobile-sidebar-auth-skeleton">
                    <HudGhostSkeleton variant="neutral" preset="avatar" width={32} height={32} />
                  </div>
                ) : user ? (
                  <UserAvatarMenu
                    user={{...user, avatarConfig:memberAvatar}}
                    userRole={effectiveUserRole}
                    displayName={displayName}
                    onNavigate={(path) => handleNavClick(path)}
                    inline={true}
                  />
                ) : (
                  <BenthicCTAButton
                    variant="cyan"
                    size="md"
                    fullWidth
                    onClick={() => {
                      closeMobileMenu(() => setIsAuthModalOpen(true))
                    }}
                  >
                    <span className="flex items-center justify-center gap-2 text-xs font-bold font-grotesk tracking-wider">
                      <UserPlus className="w-4 h-4" />
                      <span>SIGN UP</span>
                    </span>
                  </BenthicCTAButton>
                )}
              </div>
            </div>
          </div>
          </>,
          document.body
        )}
    </>
  )
}
