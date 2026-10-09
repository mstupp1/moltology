/**
 * ============================================================================
 * PUBLIC TOP NAVIGATION HEADER
 * Shared navigation bar across top-level public pages (Landing / Org).
 * Features a rounded card tab bar with a sliding highlight that follows hover and focus,
 * Members keep the Etsy store link. Admins go to /store.
 * ============================================================================
 */
import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import {
  Building2,
  ShoppingBag,
  ExternalLink,
  Newspaper,
  Activity,
  MessageSquare,
  ChevronDown,
  Info,
} from 'lucide-react'
import { HeaderBrand } from '@/components/ui/HeaderBrand'
import { AnimatedHamburger } from '@/components/ui/AnimatedHamburger'
import { PublicHeaderAuthSkeleton } from '@/components/PublicHeaderAuthSkeleton'
import { useIdleReady } from '@/hooks/useIdleReady'
import { useStoreDestination } from '@/components/store/useStoreDestination'
import { useRegisterPublicHeaderChrome } from '@/components/public-header-chrome'

const LazyPublicHeaderAuthSlot = lazy(() =>
  import('@/components/PublicHeaderAuthSlot').then((m) => ({ default: m.PublicHeaderAuthSlot }))
)

export interface PublicHeaderProps {
  activePage?: 'home' | 'org' | 'blog' | 'news' | 'store' | 'moltmax' | 'forum' | 'about'
  onOpenAuth?: (mode: 'login' | 'signup') => void
  variant?: 'benthic' | 'corporate'
}

type NavTabId = 'home' | 'news' | 'forum' | 'moltmax' | 'about' | 'org' | 'store'

interface NavTab {
  id: NavTabId
  label: string
  path?: string
  href?: string
  Icon?: React.ComponentType<{ className?: string }>
  external?: boolean
}

const NAV_TABS: NavTab[] = [
  // The brand beside the nav already reads "The Synaptic Path", so the tab stays short.
  { id: 'home', label: 'HOME', path: '/' },
  { id: 'news', label: 'NEWS', path: '/news', Icon: Newspaper },
  { id: 'forum', label: 'FORUM', path: '/forum', Icon: MessageSquare },
  { id: 'moltmax', label: 'MOLTMAX', path: '/moltmax', Icon: Activity },
  { id: 'about', label: 'ABOUT', path: '/what-is-moltology', Icon: Info },
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
  const authReady = useIdleReady()
  const storeDestination = useStoreDestination()
  const navTabs = useMemo(() => {
    return NAV_TABS.map((tab) => {
      if (tab.id !== 'store') return tab
      if (storeDestination.external) {
        return { ...tab, href: storeDestination.href, path: undefined, external: true }
      }
      return { ...tab, href: undefined, path: storeDestination.href, external: false }
    })
  }, [storeDestination.external, storeDestination.href])

  const currentTab = useMemo(() => {
    if (locationPathname.startsWith('/news') || locationPathname.startsWith('/blog')) return 'news'
    if (locationPathname.startsWith('/forum')) return 'forum'
    if (locationPathname.startsWith('/moltmax')) return 'moltmax'
    if (locationPathname.startsWith('/what-is-moltology')) return 'about'
    if (locationPathname.startsWith('/org')) return 'org'
    if (locationPathname.startsWith('/store')) return 'store'
    if (locationPathname === '/') return 'home'
    if (activePage === 'blog') return 'news'
    return activePage
  }, [activePage, locationPathname])

  const onNavigate = (path: string) => {
    navigate({ to: path })
    setMobileOpen(false)
    setOverflowOpen(false)
    setPreviewTab(null)
  }

  // Internal tabs are real links (so they can be opened in a new tab) that route client-side on a plain click.
  const onInternalLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (event.defaultPrevented || event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    onNavigate(path)
  }

  // The lens follows hover and keyboard focus; the current page keeps its highlight either way.
  const [previewTab, setPreviewTab] = useState<string | null>(null)
  const targetTab = previewTab || currentTab

  const [mobileOpen, setMobileOpen] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [headerHeight, setHeaderHeight] = useState(0)
  const lastScrollY = React.useRef(0)
  const mobileOpenRef = React.useRef(false)
  const headerRef = React.useRef<HTMLElement>(null)
  mobileOpenRef.current = mobileOpen
  const headerShown = isVisible || mobileOpen
  const navRef = React.useRef<HTMLDivElement>(null)
  const tabRefs = React.useRef<Record<string, HTMLElement | null>>({})
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number } | null>(null)
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

      if (mobileOpenRef.current || currentScrollY <= 60) {
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

  useEffect(() => {
    if (!mobileOpen) return
    setIsVisible(true)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  useIsomorphicLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    const measure = () => {
      const next = Math.round(el.getBoundingClientRect().height)
      setHeaderHeight((prev) => (prev === next ? prev : next))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useRegisterPublicHeaderChrome({ height: headerHeight, visible: headerShown })

  useIsomorphicLayoutEffect(() => {
    const navContainer = navRef.current
    const updatePill = () => {
      const activeEl = tabRefs.current[targetTab]
      // offsetLeft/offsetWidth ignore transforms, so the lens never inherits a mid-animation size.
      if (!activeEl || !navContainer || activeEl.offsetWidth === 0) {
        setPillStyle(null)
        return
      }
      const next = { left: activeEl.offsetLeft, width: activeEl.offsetWidth }
      setPillStyle((prev) => (prev && prev.left === next.left && prev.width === next.width ? prev : next))
      if (!hasMounted) {
        requestAnimationFrame(() => setHasMounted(true))
      }
    }

    updatePill()
    // Web fonts and the overflow fold change tab widths after first paint; re-measure when they settle.
    let observer: ResizeObserver | undefined
    if (navContainer && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updatePill)
      observer.observe(navContainer)
    }
    let cancelled = false
    document.fonts?.ready.then(() => {
      if (!cancelled) updatePill()
    })
    window.addEventListener('resize', updatePill)
    return () => {
      cancelled = true
      observer?.disconnect()
      window.removeEventListener('resize', updatePill)
    }
  }, [targetTab, overflowIds])

  const measureOverflow = React.useCallback(() => {
    const measureNav = navMeasureRef.current
    if (!measureNav) return
    const available = measureNav.clientWidth
    if (available <= 0) return
    for (const tab of navTabs) {
      const el = tabRefs.current[tab.id]
      if (el && el.offsetWidth > 0) tabWidthsRef.current[tab.id] = el.offsetWidth
    }
    if (navTabs.some((tab) => !tabWidthsRef.current[tab.id])) return
    if (moreBtnRef.current && moreBtnRef.current.offsetWidth > 0) {
      tabWidthsRef.current.__more__ = moreBtnRef.current.offsetWidth
    }
    const moreWidth = tabWidthsRef.current.__more__ || 84
    const widthWith = (folded: Set<string>) => {
      let total = 8
      let count = 0
      for (const tab of navTabs) {
        if (folded.has(tab.id)) continue
        if (count > 0) total += 4
        total += tabWidthsRef.current[tab.id] || 0
        count += 1
      }
      if (folded.size > 0) total += 4 + moreWidth
      return total
    }
    const foldOrder = navTabs.map((tab) => tab.id).filter((id) => id !== currentTab).reverse()
    const folded = new Set<string>()
    while (folded.size < foldOrder.length && widthWith(folded) > available) {
      folded.add(foldOrder[folded.size])
    }
    const next = navTabs.map((tab) => tab.id).filter((id) => folded.has(id))
    setOverflowIds((prev) =>
      prev.length === next.length && prev.every((id, index) => id === next[index]) ? prev : next
    )
  }, [currentTab, navTabs])

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

  const tabTextCls = (id: NavTabId, current: boolean, previewed: boolean) => {
    if (id === 'store') {
      return current
        ? isCorporate
          ? 'text-amber-700'
          : 'text-amber-300'
        : previewed
          ? isCorporate
            ? 'text-amber-700'
            : 'text-amber-300'
          : isCorporate
            ? 'text-amber-600/90'
            : 'text-amber-400/80'
    }
    if (current) return isCorporate ? 'text-sky-700' : 'text-ink'
    if (previewed) return isCorporate ? 'text-slate-800' : 'text-ink'
    return isCorporate ? 'text-slate-500' : 'text-ink-muted'
  }

  const tabIconCls = (id: NavTabId, active: boolean) => {
    if (id === 'store') return isCorporate ? 'text-amber-600' : 'text-amber-400'
    return active
      ? isCorporate
        ? 'text-sky-600'
        : 'text-cyan-glow'
      : isCorporate
        ? 'text-slate-400 group-hover:text-sky-600'
        : 'text-ink-muted group-hover:text-ink-body'
  }

  const tabFocusCls = isCorporate
    ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'
    : 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

  // Before the lens is measured (server render, first paint) the current tab carries a plain fill instead.
  // On dark grounds the current tab always keeps its own surface-2 fill, so the lens only adds the hover preview.
  const lensFallbackCls = isCorporate ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]' : ''
  const currentTabCls = isCorporate ? '' : 'bg-surface-2'

  // Current item in a menu list: a 2px cyan left edge.
  const activeEdgeCls =
    "before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-chip before:bg-cyan-glow"

  const previewHandlers = (id: NavTabId) => ({
    onMouseEnter: () => setPreviewTab(id),
    onFocus: () => setPreviewTab(id),
    onBlur: () => setPreviewTab((prev) => (prev === id ? null : prev)),
  })

  const renderNavTab = (tab: NavTab) => {
    const isCurrent = currentTab === tab.id
    const isPreviewed = targetTab === tab.id
    const cls = `relative z-10 px-3 2xl:px-3.5 py-1.5 rounded-control text-xs font-grotesk font-bold tracking-wider transition-colors duration-300 flex items-center justify-center group select-none whitespace-nowrap shrink-0 ${tabTextCls(tab.id, isCurrent, isPreviewed)} ${tabFocusCls} ${
      isCurrent ? currentTabCls : ''
    } ${isCurrent && !pillStyle ? lensFallbackCls : ''}`
    // Dark grounds mark the current page with a short cyan underline instead of a glowing pill.
    const currentMark =
      isCurrent && !isCorporate ? (
        <span
          aria-hidden="true"
          data-testid="public-header-current-mark"
          className="pointer-events-none absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-chip bg-cyan-glow"
        />
      ) : null
    const inner = (
      <span className="flex items-center gap-1.5">
        {tab.id === 'home' ? (
          <img
            src="/images/order_emblem.webp"
            alt=""
            width={14}
            height={14}
            className={`w-3.5 h-3.5 object-contain transition-all duration-300 ${
              isCurrent || isPreviewed
                ? 'grayscale-0 opacity-100'
                : isCorporate
                  ? 'grayscale opacity-50'
                  : 'grayscale opacity-60'
            }`}
          />
        ) : (
          tab.Icon && (
            <tab.Icon
              aria-hidden="true"
              className={`w-3.5 h-3.5 transition-colors duration-300 ${tabIconCls(tab.id, isCurrent || isPreviewed)}`}
            />
          )
        )}
        <span>{tab.label}</span>
        {tab.external && (
          <ExternalLink
            aria-hidden="true"
            className={`w-3 h-3 opacity-70 group-hover:opacity-100 ${isCorporate ? 'text-amber-600' : 'text-amber-500'}`}
          />
        )}
        {currentMark}
      </span>
    )
    if (tab.href) {
      return (
        <a
          key={tab.id}
          ref={(el) => { tabRefs.current[tab.id] = el }}
          href={tab.href}
          target="_blank"
          rel="noopener noreferrer"
          {...previewHandlers(tab.id)}
          className={cls}
        >
          {inner}
        </a>
      )
    }
    return (
      <a
        key={tab.id}
        ref={(el) => { tabRefs.current[tab.id] = el }}
        href={tab.path}
        aria-current={isCurrent ? 'page' : undefined}
        onClick={(event) => onInternalLinkClick(event, tab.path!)}
        {...previewHandlers(tab.id)}
        className={cls}
      >
        {inner}
      </a>
    )
  }

  const renderOverflowItem = (tab: NavTab) => {
    const isActive = currentTab === tab.id
    const itemCls = `relative w-full flex items-center gap-3 px-4 py-2.5 rounded-control text-xs font-grotesk font-bold tracking-wider transition-colors whitespace-nowrap ${tabFocusCls} ${
      isActive
        ? isCorporate
          ? 'text-sky-700 bg-sky-50'
          : `text-ink bg-surface-3 ${activeEdgeCls}`
        : tab.id === 'store'
          ? isCorporate
            ? 'text-amber-600/90 hover:text-amber-700 hover:bg-sky-50/50'
            : 'text-amber-400/80 hover:text-amber-300 hover:bg-surface-3'
          : isCorporate
            ? 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/50'
            : 'text-ink-body hover:text-ink hover:bg-surface-3'
    }`
    const content = (
      <>
        {tab.id === 'home' ? (
          <img
            src="/images/order_emblem.webp"
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
      <a
        key={tab.id}
        role="menuitem"
        href={tab.path}
        aria-current={isActive ? 'page' : undefined}
        onClick={(event) => onInternalLinkClick(event, tab.path!)}
        className={itemCls}
      >
        {content}
      </a>
    )
  }

  const renderMobileItem = (tab: NavTab) => {
    const isActive = currentTab === tab.id
    const isStore = tab.id === 'store'
    const itemCls = `relative w-full flex items-center gap-3 px-4 py-3 rounded-control text-sm font-grotesk font-bold tracking-wider transition-colors ${tabFocusCls} ${
      isStore
        ? isCorporate
          ? `text-amber-700 hover:bg-amber-50 ${isActive ? 'bg-amber-50' : ''}`
          : `text-amber-300 hover:bg-surface-2 ${isActive ? `bg-surface-2 ${activeEdgeCls}` : ''}`
        : isActive
          ? isCorporate
            ? 'text-sky-700 bg-sky-50'
            : `text-ink bg-surface-2 ${activeEdgeCls}`
          : isCorporate
            ? 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/50'
            : 'text-ink-body hover:text-ink hover:bg-surface-2'
    }`
    const icon =
      tab.id === 'home' ? (
        <img src="/images/order_emblem.webp" alt="" width={16} height={16} className="w-4 h-4 object-contain" />
      ) : (
        tab.Icon && (
          <tab.Icon
            aria-hidden="true"
            className={`w-4 h-4 ${
              isStore
                ? isCorporate
                  ? 'text-amber-600'
                  : 'text-amber-400'
                : isCorporate
                  ? 'text-sky-600'
                  : isActive
                    ? 'text-cyan-glow'
                    : 'text-ink-muted'
            }`}
          />
        )
      )
    if (tab.href) {
      return (
        <a
          key={tab.id}
          href={tab.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMobileOpen(false)}
          className={`${itemCls} justify-between`}
        >
          <span className="flex items-center gap-3">
            {icon}
            <span>{tab.label}</span>
          </span>
          <ExternalLink
            aria-hidden="true"
            className={`w-3.5 h-3.5 opacity-70 ${isCorporate ? 'text-amber-600' : 'text-amber-500'}`}
          />
        </a>
      )
    }
    return (
      <a
        key={tab.id}
        href={tab.path}
        aria-current={isActive ? 'page' : undefined}
        onClick={(event) => onInternalLinkClick(event, tab.path!)}
        className={itemCls}
      >
        {icon}
        <span>{tab.label}</span>
      </a>
    )
  }

  return (
    <header
      ref={headerRef}
      className={`w-full px-4 sm:px-8 lg:px-12 py-3 fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        headerShown ? 'translate-y-0' : '-translate-y-full pointer-events-none'
      } ${
        isCorporate
          ? isScrolled
            ? 'bg-white/95 backdrop-blur-2xl border-b border-sky-200/80 shadow-md'
            : 'bg-white/85 backdrop-blur-xl border-b border-sky-100 shadow-sm'
          : isScrolled
            ? 'bg-abyss/90 backdrop-blur-2xl border-b border-line-subtle shadow-xl'
            : 'bg-abyss/75 backdrop-blur-xl border-b border-line-subtle shadow-md'
      }`}
    >
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Shared Brand Logo & Emblem */}
        <HeaderBrand
          subtext="MOLTOLOGY.ORG FOUNDATION"
          variant={isCorporate ? 'corporate' : 'benthic'}
          onClick={() => onNavigate('/')}
        />

        {/* Central navigation bar */}
        <nav
          ref={navMeasureRef}
          aria-label="Main Navigation"
          className="relative hidden xl:flex flex-1 min-w-0 items-center justify-center"
        >
          <div
            ref={navRef}
            onMouseLeave={() => setPreviewTab(null)}
            className={`relative flex items-center gap-1 p-1 rounded-card backdrop-blur-2xl transition-all duration-300 shrink-0 ${
              isCorporate
                ? 'bg-slate-200/50 border border-slate-300/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]'
                : 'bg-surface-1 hud-sheen border border-line-subtle shadow-sheen-inset'
            }`}
          >
          {/* Sliding highlight lens: follows hover and keyboard focus */}
          <div
            aria-hidden="true"
            className={`absolute top-1 bottom-1 left-0 rounded-control pointer-events-none z-0 ${
              hasMounted
                ? 'transition-[transform,width] duration-300 ease-[cubic-bezier(0.2,1,0.3,1)]'
                : 'transition-none'
            }`}
            style={{
              transform: `translate3d(${pillStyle?.left ?? 0}px, 0, 0)`,
              width: `${pillStyle?.width ?? 0}px`,
              opacity: pillStyle ? 1 : 0,
            }}
          >
            <div
              className={`relative w-full h-full rounded-control overflow-hidden transition-all duration-300 ${
                isCorporate
                  ? 'bg-gradient-to-b from-white/95 via-white/85 to-white/75 border border-white shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(0,0,0,0.04)] backdrop-blur-2xl'
                  : 'bg-surface-2 border border-line-subtle shadow-sheen-inset'
              }`}
            />
          </div>

            {navTabs.filter((tab) => !overflowIds.includes(tab.id)).map(renderNavTab)}

            {overflowIds.length > 0 && (
              <div className="relative flex items-center">
                <button
                  ref={moreBtnRef}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={overflowOpen}
                  onClick={() => setOverflowOpen((open) => !open)}
                  onMouseEnter={() => setPreviewTab(null)}
                  onFocus={() => setPreviewTab(null)}
                  className={`relative z-10 px-3 2xl:px-3.5 py-1.5 rounded-control text-xs font-grotesk font-bold tracking-wider transition-colors duration-300 flex items-center justify-center select-none whitespace-nowrap shrink-0 ${tabFocusCls} ${
                    overflowOpen
                      ? isCorporate
                        ? 'text-sky-700'
                        : 'text-ink bg-surface-2'
                      : isCorporate
                        ? 'text-slate-500 hover:text-sky-700'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-2'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>MORE</span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${overflowOpen ? 'rotate-180' : ''}`}
                    />
                  </span>
                </button>

                {overflowOpen && (
                  <div
                    role="menu"
                    aria-label="More pages"
                    className={`absolute right-0 top-full mt-3 w-56 rounded-card border p-2 backdrop-blur-xl z-50 ${
                      isCorporate
                        ? 'bg-white/95 border border-sky-100 shadow-2xl shadow-sky-100'
                        : 'bg-surface-2 border border-line-subtle shadow-menu'
                    }`}
                  >
                    {navTabs.filter((tab) => overflowIds.includes(tab.id)).map(renderOverflowItem)}
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
            className={`xl:hidden flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-control active:scale-95 transition-all duration-300 ${
              isCorporate
                ? mobileOpen
                  ? 'bg-rose-50/80 border border-rose-200 text-rose-500 hover:bg-rose-100/70 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60'
                  : 'bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'
                : `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                    mobileOpen
                      ? 'bg-crimson-soft border border-crimson-aggro/55 text-crimson-text hover:border-crimson-aggro'
                      : 'bg-surface-1 hud-sheen border border-line text-ink hover:bg-surface-2 hover:border-line-strong'
                  }`
            }`}
          >
            <AnimatedHamburger isOpen={mobileOpen} />
          </button>

          <div className="hidden xl:flex items-center gap-3 sm:gap-4">
            {authReady ? (
              <Suspense fallback={<PublicHeaderAuthSkeleton isCorporate={isCorporate} layout="desktop" />}>
                <LazyPublicHeaderAuthSlot
                  isCorporate={isCorporate}
                  layout="desktop"
                  onNavigate={onNavigate}
                  onOpenAuth={onOpenAuth}
                />
              </Suspense>
            ) : (
              <PublicHeaderAuthSkeleton isCorporate={isCorporate} layout="desktop" />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Backdrop & Menu */}
      <div
        style={headerHeight ? { top: headerHeight } : undefined}
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
            ? 'max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain opacity-100 translate-y-0'
            : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div
          className={`mt-3 p-3 space-y-2 rounded-card backdrop-blur-md ${
            isCorporate
              ? 'bg-white/95 border border-sky-100 shadow-2xl shadow-sky-100'
              : 'bg-surface-1 border border-line-subtle shadow-menu'
          }`}
        >
          {navTabs.map(renderMobileItem)}

          {/* Divider */}
          <div
            className={`border-t pt-2 mt-1 ${
              isCorporate ? 'border-sky-100' : 'border-line-subtle'
            }`}
          />

          {authReady ? (
            <Suspense fallback={<PublicHeaderAuthSkeleton isCorporate={isCorporate} layout="mobile" />}>
              <LazyPublicHeaderAuthSlot
                isCorporate={isCorporate}
                layout="mobile"
                onNavigate={onNavigate}
                onOpenAuth={onOpenAuth}
                onMobileClose={() => setMobileOpen(false)}
              />
            </Suspense>
          ) : (
            <PublicHeaderAuthSkeleton isCorporate={isCorporate} layout="mobile" />
          )}
        </div>
      </div>
    </header>
  )
}
