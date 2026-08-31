/**
 * ============================================================================
 * PUBLIC TOP NAVIGATION HEADER
 * Shared navigation bar across top-level public pages (Landing / Org).
 * Features a modern glassmorphic HUD pill nav, high-tech glowing tab indicators,
 * and direct store link to https://www.etsy.com/shop/SaasTrash.
 * ============================================================================
 */
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import {
  Building2,
  Cpu,
  UserPlus,
  LogIn,
  ShoppingBag,
  ExternalLink,
  Newspaper,
  Menu,
  X,
  Activity,
  MessageSquare,
  ChevronDown,
} from 'lucide-react'
import { HeaderBrand } from '@/components/ui'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { UserAvatarMenu } from '@/components/UserAvatarMenu'
import { useAuthSession } from '@/hooks/useAuthSession'

export interface PublicHeaderProps {
  activePage?: 'home' | 'org' | 'blog' | 'news' | 'store' | 'moltmax' | 'forum'
  onOpenAuth?: (mode: 'login' | 'signup') => void
  variant?: 'benthic' | 'corporate'
}

type NavTabId = 'home' | 'news' | 'forum' | 'moltmax' | 'org' | 'store'

interface NavTab {
  id: NavTabId
  label: string
  path?: string
  href?: string
  Icon?: React.ComponentType<{ className?: string }>
  external?: boolean
}

const NAV_TABS: NavTab[] = [
  { id: 'home', label: 'THE SYNAPTIC PATH', path: '/' },
  { id: 'news', label: 'NEWS', path: '/news', Icon: Newspaper },
  { id: 'forum', label: 'FORUM', path: '/forum', Icon: MessageSquare },
  { id: 'moltmax', label: 'MOLTMAX', path: '/moltmax', Icon: Activity },
  { id: 'org', label: 'ORGANIZATION', path: '/org', Icon: Building2 },
  { id: 'store', label: 'STORE', href: 'https://www.etsy.com/shop/SaasTrash', Icon: ShoppingBag, external: true },
]

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  activePage = 'home',
  onOpenAuth,
  variant,
}) => {
  const navigate = useNavigate()
  let locationPathname = ''
  try {
    const location = useLocation()
    locationPathname = location?.pathname || ''
  } catch {
    // router context not yet ready
  }

  const isCorporate = variant === 'corporate' || locationPathname === '/org' || activePage === 'org'

  const currentTab = useMemo(() => {
    if (locationPathname.startsWith('/news') || locationPathname.startsWith('/blog')) return 'news'
    if (locationPathname.startsWith('/forum')) return 'forum'
    if (locationPathname.startsWith('/moltmax')) return 'moltmax'
    if (locationPathname.startsWith('/org')) return 'org'
    if (locationPathname === '/') return 'home'
    if (activePage === 'blog') return 'news'
    return activePage
  }, [activePage, locationPathname])

  const onNavigate = (path: string) => {
    navigate({ to: path })
    setMobileOpen(false)
    setOverflowOpen(false)
  }
  const session = useAuthSession()
  const user = session.user
  const isSessionPending = session.isPending

  const [hoveredTab, setHoveredTab] = useState<string | null>(null)
  const targetTab = hoveredTab || currentTab

  const [mobileOpen, setMobileOpen] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = React.useRef(0)
  const navRef = React.useRef<HTMLDivElement>(null)
  const tabRefs = React.useRef<Record<string, HTMLElement | null>>({})
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  })
  const [overflowIds, setOverflowIds] = useState<string[]>([])
  const [overflowOpen, setOverflowOpen] = useState(false)
  const navMeasureRef = React.useRef<HTMLElement>(null)
  const moreBtnRef = React.useRef<HTMLButtonElement>(null)
  const tabWidthsRef = React.useRef<Record<string, number>>({})

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Scrolled backdrop styling threshold
      if (currentScrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }

      // Hide header on scroll down, show on scroll up
      const scrollDiff = currentScrollY - lastScrollY.current

      if (currentScrollY <= 60) {
        setIsVisible(true)
      } else if (scrollDiff > 5) {
        setIsVisible(false)
      } else if (scrollDiff < -5) {
        setIsVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useIsomorphicLayoutEffect(() => {
    const updatePill = () => {
      const activeEl = tabRefs.current[targetTab]
      const navContainer = navRef.current
      if (activeEl && navContainer) {
        const activeRect = activeEl.getBoundingClientRect()
        const navRect = navContainer.getBoundingClientRect()
        setPillStyle({
          left: activeRect.left - navRect.left,
          width: activeRect.width,
          opacity: 1,
        })
        if (!hasMounted) {
          requestAnimationFrame(() => setHasMounted(true))
        }
      }
    }

    updatePill()
    window.addEventListener('resize', updatePill)
    return () => window.removeEventListener('resize', updatePill)
  }, [targetTab, overflowIds])

  const measureOverflow = React.useCallback(() => {
    const measureNav = navMeasureRef.current
    if (!measureNav) return
    const available = measureNav.clientWidth
    if (available <= 0) return
    for (const tab of NAV_TABS) {
      const el = tabRefs.current[tab.id]
      if (el && el.offsetWidth > 0) tabWidthsRef.current[tab.id] = el.offsetWidth
    }
    if (NAV_TABS.some((tab) => !tabWidthsRef.current[tab.id])) return
    if (moreBtnRef.current && moreBtnRef.current.offsetWidth > 0) {
      tabWidthsRef.current.__more__ = moreBtnRef.current.offsetWidth
    }
    const moreWidth = tabWidthsRef.current.__more__ || 84
    const widthWith = (folded: Set<string>) => {
      let total = 8
      let count = 0
      for (const tab of NAV_TABS) {
        if (folded.has(tab.id)) continue
        if (count > 0) total += 4
        total += tabWidthsRef.current[tab.id] || 0
        count += 1
      }
      if (folded.size > 0) total += 4 + moreWidth
      return total
    }
    const foldOrder = NAV_TABS.map((tab) => tab.id).filter((id) => id !== currentTab).reverse()
    const folded = new Set<string>()
    while (folded.size < foldOrder.length && widthWith(folded) > available) {
      folded.add(foldOrder[folded.size])
    }
    const next = NAV_TABS.map((tab) => tab.id).filter((id) => folded.has(id))
    setOverflowIds((prev) =>
      prev.length === next.length && prev.every((id, index) => id === next[index]) ? prev : next
    )
  }, [currentTab])

  useEffect(() => {
    measureOverflow()
    const measureNav = navMeasureRef.current
    if (!measureNav || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => measureOverflow())
    observer.observe(measureNav)
    return () => observer.disconnect()
  }, [measureOverflow])

  useEffect(() => {
    if (!overflowOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (navRef.current && event.target instanceof Node && !navRef.current.contains(event.target)) {
        setOverflowOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOverflowOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [overflowOpen])

  useEffect(() => {
    setOverflowOpen(false)
  }, [overflowIds])

  const tabTextCls = (id: NavTabId, active: boolean) => {
    if (id === 'store') {
      return active
        ? isCorporate
          ? 'text-amber-700 font-bold'
          : 'text-amber-300'
        : isCorporate
          ? 'text-amber-600/90 hover:text-amber-700'
          : 'text-amber-400/80 hover:text-amber-300'
    }
    return active
      ? isCorporate
        ? 'text-sky-700'
        : 'text-cyan-300'
      : isCorporate
        ? 'text-slate-500 hover:text-sky-700'
        : 'text-gray-400 hover:text-gray-200'
  }

  const tabIconCls = (id: NavTabId, active: boolean) => {
    if (id === 'store') return isCorporate ? 'text-amber-600' : 'text-amber-400'
    return active
      ? isCorporate
        ? 'text-sky-600'
        : 'text-cyan-300'
      : isCorporate
        ? 'text-slate-400 group-hover:text-sky-600'
        : 'text-gray-400 group-hover:text-gray-300'
  }

  const renderNavTab = (tab: NavTab) => {
    const isActive = targetTab === tab.id
    const cls = `relative z-10 px-3.5 py-1.5 rounded-full text-xs font-grotesk font-bold tracking-wider transition-colors duration-300 flex items-center justify-center group select-none whitespace-nowrap shrink-0 ${tabTextCls(tab.id, isActive)}`
    const inner = (
      <div
        className={`flex items-center gap-1.5 transition-transform duration-300 ease-[cubic-bezier(0.2,1,0.3,1)] ${
          isActive ? 'scale-[1.07]' : 'scale-100 group-hover:scale-[1.03]'
        }`}
      >
        {tab.id === 'home' ? (
          <img
            src="/images/order_emblem.png"
            alt="The Synaptic Path Logo"
            width={14}
            height={14}
            className={`w-3.5 h-3.5 object-contain transition-all duration-300 ${
              isActive
                ? 'grayscale-0 opacity-100'
                : isCorporate
                  ? 'grayscale opacity-50 group-hover:opacity-75'
                  : 'grayscale opacity-60 group-hover:opacity-75'
            }`}
          />
        ) : (
          tab.Icon && (
            <tab.Icon
              className={`${
                tab.external
                  ? 'w-3.5 h-3.5 group-hover:scale-105 transition-transform'
                  : 'w-3.5 h-3.5 transition-colors duration-300'
              } ${tabIconCls(tab.id, isActive)}`}
            />
          )
        )}
        <span>{tab.label}</span>
        {tab.external && (
          <ExternalLink
            className={`w-3 h-3 opacity-70 group-hover:opacity-100 ${isCorporate ? 'text-amber-600' : 'text-amber-500'}`}
          />
        )}
      </div>
    )
    if (tab.href) {
      return (
        <a
          key={tab.id}
          ref={(el) => { tabRefs.current[tab.id] = el }}
          href={tab.href}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setHoveredTab(tab.id)}
          className={cls}
        >
          {inner}
        </a>
      )
    }
    return (
      <button
        key={tab.id}
        ref={(el) => { tabRefs.current[tab.id] = el }}
        onClick={() => onNavigate(tab.path!)}
        onMouseEnter={() => setHoveredTab(tab.id)}
        className={cls}
      >
        {inner}
      </button>
    )
  }

  const renderOverflowItem = (tab: NavTab) => {
    const isActive = currentTab === tab.id
    const itemCls = `w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-grotesk font-bold tracking-wider transition-colors whitespace-nowrap ${
      isActive
        ? isCorporate
          ? 'text-sky-700 bg-sky-50'
          : 'text-cyan-300 bg-cyan-950/40'
        : tab.id === 'store'
          ? isCorporate
            ? 'text-amber-600/90 hover:text-amber-700 hover:bg-sky-50/50'
            : 'text-amber-400/80 hover:text-amber-300 hover:bg-cyan-950/30'
          : isCorporate
            ? 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/50'
            : 'text-gray-300 hover:text-cyan-400 hover:bg-cyan-950/30'
    }`
    const content = (
      <>
        {tab.id === 'home' ? (
          <img
            src="/images/order_emblem.png"
            alt=""
            width={16}
            height={16}
            className="w-4 h-4 object-contain"
          />
        ) : (
          tab.Icon && <tab.Icon className={`w-4 h-4 ${tabIconCls(tab.id, isActive)}`} />
        )}
        <span>{tab.label}</span>
        {tab.external && <ExternalLink className="w-3 h-3 opacity-70 ml-auto" />}
      </>
    )
    if (tab.href) {
      return (
        <a
          key={tab.id}
          role="menuitem"
          href={tab.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOverflowOpen(false)}
          className={itemCls}
        >
          {content}
        </a>
      )
    }
    return (
      <button
        key={tab.id}
        type="button"
        role="menuitem"
        onClick={() => onNavigate(tab.path!)}
        className={itemCls}
      >
        {content}
      </button>
    )
  }

  return (
    <header
      className={`w-full px-4 sm:px-8 lg:px-12 py-3 fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
      } ${
        isCorporate
          ? isScrolled
            ? 'bg-white/95 backdrop-blur-2xl border-b border-sky-200/80 shadow-md'
            : 'bg-white/85 backdrop-blur-xl border-b border-sky-100 shadow-sm'
          : isScrolled
            ? 'bg-[#030606]/90 backdrop-blur-2xl border-b border-[#121c1d]/80 shadow-xl'
            : 'bg-[#030606]/75 backdrop-blur-xl border-b border-cyan-950/40 shadow-md'
      }`}
    >
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Shared Brand Logo & Emblem */}
        <HeaderBrand
          subtext="MOLTOLOGY.ORG FOUNDATION"
          variant={isCorporate ? 'corporate' : 'benthic'}
          onClick={() => onNavigate('/')}
        />

        {/* Central Apple-Grade Glass Navigation Capsule */}
        <nav
          ref={navMeasureRef}
          aria-label="Main Navigation"
          className="relative hidden xl:flex flex-1 min-w-0 items-center justify-center"
        >
          <div
            ref={navRef}
            onMouseLeave={() => setHoveredTab(null)}
            className={`relative flex items-center gap-1 p-1 rounded-full backdrop-blur-2xl transition-all duration-300 shrink-0 ${
              isCorporate
                ? 'bg-slate-200/50 border border-slate-300/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]'
                : 'bg-black/40 border border-white/[0.08] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]'
            }`}
          >
          {/* Smooth Continuous Sliding Active Optical Glass Lens (Apple Glass Morphism) */}
          <div
            aria-hidden="true"
            className={`absolute top-1 bottom-1 left-0 rounded-full pointer-events-none z-0 ${
              hasMounted
                ? 'transition-[transform,width] duration-300 ease-[cubic-bezier(0.2,1,0.3,1)]'
                : 'transition-none'
            }`}
            style={{
              transform: `translate3d(${pillStyle.left}px, 0, 0)`,
              width: `${pillStyle.width}px`,
              opacity: pillStyle.opacity,
            }}
          >
            {/* Optical Glass Shell with Precision Bevel & Crisp Specular Edges */}
            <div
              className={`relative w-full h-full rounded-full overflow-hidden transition-all duration-300 ${
                isCorporate
                  ? 'bg-gradient-to-b from-white/95 via-white/85 to-white/75 border border-white shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(0,0,0,0.04)]'
                  : 'bg-[#081419]/65 bg-gradient-to-b from-white/[0.14] via-white/[0.04] to-transparent border border-white/[0.18] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.7),0_1px_4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.45),inset_0_-1px_0_0_rgba(255,255,255,0.06)]'
              } backdrop-blur-2xl`}
            >
              {/* Convex Lens Specular Reflection Highlight (Top Crest) */}
              <div
                className={`absolute top-0 inset-x-3 h-[1px] rounded-t-full pointer-events-none ${
                  isCorporate
                    ? 'bg-gradient-to-r from-transparent via-white to-transparent'
                    : 'bg-gradient-to-r from-transparent via-white/80 to-transparent'
                }`}
              />

              {/* Internal Radial Light Gathering (Lens Flare Center Catch) */}
              <div
                className={`absolute inset-0 rounded-full pointer-events-none ${
                  isCorporate
                    ? 'bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.8),transparent_60%)]'
                    : 'bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.15),transparent_65%)]'
                }`}
              />

              {/* Micro-Fine Optical Refraction Rim (Bottom Lip) */}
              <div
                className={`absolute bottom-0 inset-x-4 h-[1px] rounded-b-full pointer-events-none ${
                  isCorporate
                    ? 'bg-gradient-to-r from-transparent via-slate-300/40 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
                }`}
              />
            </div>
          </div>

            {NAV_TABS.filter((tab) => !overflowIds.includes(tab.id)).map(renderNavTab)}

            {overflowIds.length > 0 && (
              <div className="relative flex items-center">
                <button
                  ref={moreBtnRef}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={overflowOpen}
                  onClick={() => setOverflowOpen((open) => !open)}
                  onMouseEnter={() => setHoveredTab(null)}
                  className={`relative z-10 px-3.5 py-1.5 rounded-full text-xs font-grotesk font-bold tracking-wider transition-colors duration-300 flex items-center justify-center select-none whitespace-nowrap shrink-0 ${
                    overflowOpen
                      ? isCorporate
                        ? 'text-sky-700'
                        : 'text-cyan-300'
                      : isCorporate
                        ? 'text-slate-500 hover:text-sky-700'
                        : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 transition-transform duration-300 ease-[cubic-bezier(0.2,1,0.3,1)]">
                    <span>MORE</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${overflowOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {overflowOpen && (
                  <div
                    role="menu"
                    aria-label="More pages"
                    className={`absolute right-0 top-full mt-3 w-56 rounded-xl border p-2 shadow-2xl backdrop-blur-xl z-50 ${
                      isCorporate
                        ? 'bg-white/95 border border-sky-100 shadow-sky-100'
                        : 'bg-[#080d0e]/95 border border-cyan-950/80'
                    }`}
                  >
                    {NAV_TABS.filter((tab) => overflowIds.includes(tab.id)).map(renderOverflowItem)}
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>


        {/* Header Action Items */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            className={`xl:hidden flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg active:scale-95 transition-all focus:outline-none ${
              isCorporate
                ? 'bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 shadow-sm'
                : 'bg-[#080d0e]/90 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900/60 focus:ring-2 focus:ring-cyan-500/50'
            }`}
          >
            {mobileOpen ? (
              <X className={`w-5 h-5 ${isCorporate ? 'text-rose-500' : 'text-red-400'}`} />
            ) : (
              <Menu className={`w-5 h-5 ${isCorporate ? 'text-sky-700' : 'text-cyan-300'}`} />
            )}
          </button>

          <div className="hidden xl:flex items-center gap-3 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {isCorporate ? (
                  <button
                    onClick={() => onNavigate('/dashboard')}
                    className="px-4 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-grotesk font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-2 transition-all hover:scale-105 shadow-sm"
                  >
                    <Cpu className="w-4 h-4 text-sky-600" />
                    <span>DASHBOARD</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('/dashboard')}
                    className="px-5 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center gap-2 transition-all hover:scale-105 shadow-hud-cyan"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>DASHBOARD</span>
                  </button>
                )}
                <UserAvatarMenu
                  user={user}
                  onNavigate={onNavigate}
                  variant={isCorporate ? 'corporate' : 'benthic'}
                />
              </div>
            ) : isSessionPending ? (
              <div className="flex items-center gap-2.5" data-testid="public-header-auth-skeleton">
                <div className={`h-8 w-16 rounded-md ${isCorporate ? 'bg-slate-200/70' : 'bg-white/[0.05] border border-white/[0.08]'} animate-pulse`} />
                <div className={`h-8 w-24 rounded-md ${isCorporate ? 'bg-sky-200/70' : 'bg-white/[0.05] border border-white/[0.08]'} animate-pulse`} />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onOpenAuth?.('login')}
                  className={`px-4 py-2 text-xs font-grotesk font-bold uppercase tracking-wider transition-colors ${
                    isCorporate
                      ? 'text-slate-600 hover:text-sky-700'
                      : 'text-gray-300 hover:text-cyan-300'
                  }`}
                >
                  LOG IN
                </button>
                {isCorporate ? (
                  <button
                    onClick={() => onOpenAuth?.('signup')}
                    className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white font-grotesk font-extrabold text-xs uppercase tracking-wider rounded-full shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>JOIN FAMILY</span>
                  </button>
                ) : (
                  <BenthicCTAButton
                    size="sm"
                    onClick={() => onOpenAuth?.('signup')}
                  >
                    <span className="flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>JOIN PATH</span>
                    </span>
                  </BenthicCTAButton>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Backdrop & Menu */}
      <div
        className={`xl:hidden fixed inset-0 top-[60px] ${
          isCorporate ? 'bg-slate-900/30' : 'bg-black/60'
        } backdrop-blur-sm -z-10 transition-opacity duration-300 ease-in-out ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`xl:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen
            ? 'max-h-[calc(100vh-5rem)] overflow-y-auto opacity-100 translate-y-0'
            : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div
          className={`mt-3 p-3 space-y-2 rounded-2xl backdrop-blur-md shadow-2xl ${
            isCorporate
              ? 'bg-white/95 border border-sky-100 shadow-sky-100'
              : 'bg-[#080d0e]/95 border border-cyan-950/80'
          }`}
        >
          <button
            onClick={() => onNavigate('/')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-grotesk font-bold tracking-wider transition-colors ${
              currentTab === 'home'
                ? isCorporate
                  ? 'text-sky-700 bg-sky-50'
                  : 'text-cyan-300 bg-cyan-950/40'
                : isCorporate
                  ? 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/50'
                  : 'text-gray-300 hover:text-cyan-400 hover:bg-cyan-950/30'
            }`}
          >
            <img src="/images/order_emblem.png" alt="" width={16} height={16} className="w-4 h-4 object-contain" />
            <span>THE SYNAPTIC PATH</span>
          </button>

          <button
            onClick={() => onNavigate('/news')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-grotesk font-bold tracking-wider transition-colors ${
              currentTab === 'news'
                ? isCorporate
                  ? 'text-sky-700 bg-sky-50'
                  : 'text-cyan-300 bg-cyan-950/40'
                : isCorporate
                  ? 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/50'
                  : 'text-gray-300 hover:text-cyan-400 hover:bg-cyan-950/30'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>NEWS</span>
          </button>

          <button
            onClick={() => onNavigate('/forum')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-grotesk font-bold tracking-wider transition-colors ${
              currentTab === 'forum'
                ? isCorporate
                  ? 'text-sky-700 bg-sky-50'
                  : 'text-cyan-300 bg-cyan-950/40'
                : isCorporate
                  ? 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/50'
                  : 'text-gray-300 hover:text-cyan-400 hover:bg-cyan-950/30'
            }`}
          >
            <MessageSquare className={`w-4 h-4 ${isCorporate ? 'text-sky-600' : 'text-cyan-400'}`} />
            <span>FORUM</span>
          </button>

          <button
            onClick={() => onNavigate('/moltmax')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-grotesk font-bold tracking-wider transition-colors ${
              currentTab === 'moltmax'
                ? isCorporate
                  ? 'text-sky-700 bg-sky-50'
                  : 'text-cyan-300 bg-cyan-950/40'
                : isCorporate
                  ? 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/50'
                  : 'text-gray-300 hover:text-cyan-400 hover:bg-cyan-950/30'
            }`}
          >
            <Activity className={`w-4 h-4 ${isCorporate ? 'text-sky-600' : 'text-cyan-400'}`} />
            <span>MOLTMAX</span>
          </button>

          <button
            onClick={() => onNavigate('/org')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-grotesk font-bold tracking-wider transition-colors ${
              currentTab === 'org'
                ? isCorporate
                  ? 'text-sky-700 bg-sky-50'
                  : 'text-cyan-300 bg-cyan-950/40'
                : isCorporate
                  ? 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/50'
                  : 'text-gray-300 hover:text-cyan-400 hover:bg-cyan-950/30'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>ORGANIZATION</span>
          </button>

          <a
            href="https://www.etsy.com/shop/SaasTrash"
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-grotesk font-bold tracking-wider transition-colors ${
              isCorporate
                ? 'text-amber-700 hover:bg-amber-50'
                : 'text-amber-300 hover:bg-cyan-950/30'
            }`}
          >
            <span className="flex items-center gap-3">
              <ShoppingBag className={`w-4 h-4 ${isCorporate ? 'text-amber-600' : 'text-amber-400'}`} />
              <span>STORE</span>
            </span>
            <ExternalLink className={`w-3.5 h-3.5 opacity-70 ${isCorporate ? 'text-amber-600' : 'text-amber-500'}`} />
          </a>

          {/* Divider */}
          <div
            className={`border-t pt-2 mt-1 ${
              isCorporate ? 'border-sky-100' : 'border-cyan-950/80'
            }`}
          />

          {user ? (
            <div className="space-y-2 pt-1">
              <button
                onClick={() => onNavigate('/dashboard')}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-grotesk font-bold text-sm uppercase tracking-wider transition-colors active:scale-[0.99] ${
                  isCorporate
                    ? 'bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 shadow-sm'
                    : 'bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 shadow-[0_0_12px_rgba(0,195,255,0.15)]'
                }`}
              >
                <Cpu className={`w-4 h-4 ${isCorporate ? 'text-sky-600' : 'text-cyan-400'}`} />
                <span>DASHBOARD</span>
              </button>
              <UserAvatarMenu
                user={user}
                onNavigate={onNavigate}
                inline
                variant={isCorporate ? 'corporate' : 'benthic'}
              />
            </div>
          ) : isSessionPending ? (
            <div className="flex flex-col gap-2.5 pt-1" data-testid="public-header-mobile-auth-skeleton">
              <div className={`h-11 w-full rounded-xl ${isCorporate ? 'bg-slate-200/70' : 'bg-white/[0.05] border border-white/[0.08]'} animate-pulse`} />
              <div className={`h-11 w-full rounded-xl ${isCorporate ? 'bg-sky-200/70' : 'bg-white/[0.05] border border-white/[0.08]'} animate-pulse`} />
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 pt-1">
              {isCorporate ? (
                <>
                  <button
                    onClick={() => { setMobileOpen(false); onOpenAuth?.('signup') }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 hover:bg-sky-400 text-white font-grotesk font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-md shadow-sky-500/20 active:scale-[0.99] transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>JOIN FAMILY</span>
                  </button>
                  <button
                    onClick={() => { setMobileOpen(false); onOpenAuth?.('login') }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-grotesk font-bold text-sm uppercase tracking-wider rounded-xl shadow-sm active:scale-[0.99] transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>LOG IN</span>
                  </button>
                </>
              ) : (
                <>
                  <BenthicCTAButton
                    size="md"
                    fullWidth
                    onClick={() => { setMobileOpen(false); onOpenAuth?.('signup') }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      <span>JOIN PATH</span>
                    </span>
                  </BenthicCTAButton>
                  <BenthicCTAButton
                    size="md"
                    variant="cyan"
                    fullWidth
                    onClick={() => { setMobileOpen(false); onOpenAuth?.('login') }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <LogIn className="w-4 h-4" />
                      <span>LOG IN</span>
                    </span>
                  </BenthicCTAButton>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
