/**
 * ============================================================================
 * PUBLIC TOP NAVIGATION HEADER
 * Shared navigation bar across top-level public pages (Landing / Org).
 * Features a rounded card tab bar: the current page is a lit tile and a faint lens follows hover and focus.
 * Phones get the app's top bar (faint pill, XP-ring portrait) and a full-screen menu like the app's Account screen.
 * The new-store experiment switches opted-in admins from Etsy to /store.
 * ============================================================================
 */
import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { createPortal } from 'react-dom'
import { BrandIcon } from '@/components/ui/BrandMark'
import { useNavigate, useLocation } from '@tanstack/react-router'
import {
  ShoppingBag,
  ExternalLink,
  Newspaper,
  ListChecks,
  MessagesSquare,
  ChevronDown,
  ChevronRight,
  Info,
  Menu,
  X,
} from 'lucide-react'
import { HeaderBrand } from '@/components/ui/HeaderBrand'
import { PublicHeaderAuthSkeleton } from '@/components/PublicHeaderAuthSkeleton'
import { useIdleReady } from '@/hooks/useIdleReady'
import { useStoreDestination } from '@/components/store/useStoreDestination'
import { useRegisterPublicHeaderChrome } from '@/components/public-header-chrome'
import { PUBLIC_PHONE_PILL } from '@/components/public-header-pill'
import { usePanelPresence } from '@/hooks/usePanelPresence'
import { useModalPanelFocus } from '@/hooks/useModalPanelFocus'

const LazyPublicHeaderAuthSlot = lazy(() =>
  import('@/components/PublicHeaderAuthSlot').then((m) => ({ default: m.PublicHeaderAuthSlot }))
)

export interface PublicHeaderProps {
  activePage?: 'home' | 'org' | 'blog' | 'news' | 'store' | 'moltmax' | 'forum' | 'about'
  onOpenAuth?: (mode: 'login' | 'signup') => void
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
  // The brand beside the nav reads "Moltology", so the tab stays short.
  { id: 'home', label: 'Home', path: '/' },
  { id: 'news', label: 'News', path: '/news', Icon: Newspaper },
  { id: 'forum', label: 'Forum', path: '/forum', Icon: MessagesSquare },
  { id: 'moltmax', label: 'Quiz', path: '/moltmax', Icon: ListChecks },
  { id: 'about', label: 'About', path: '/what-is-moltology', Icon: Info },
  { id: 'store', label: 'Store', href: 'https://www.etsy.com/shop/SaasTrash', Icon: ShoppingBag, external: true },
]

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  activePage = 'home',
  onOpenAuth,
}) => {
  const navigate = useNavigate()
  let locationPathname = ''
  try {
    const location = useLocation()
    locationPathname = location?.pathname || ''
  } catch {
    // router context not yet ready
  }

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
  const menuPanelRef = React.useRef<HTMLDivElement>(null)
  const menuButtonRef = React.useRef<HTMLButtonElement>(null)
  const menuPresence = usePanelPresence(mobileOpen, 250)
  const [portalReady, setPortalReady] = useState(false)
  useEffect(() => setPortalReady(true), [])
  useModalPanelFocus(mobileOpen && menuPresence.mounted, menuPanelRef, menuButtonRef)
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
    // The sheet fills the screen, so the page behind it should not scroll.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
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
        ? 'text-amber-300'
        : previewed
          ? 'text-amber-300'
          : 'text-amber-400/80'
    }
    if (current) return 'text-ink'
    if (previewed) return 'text-ink'
    return 'text-ink-muted'
  }

  const tabIconCls = (id: NavTabId, active: boolean) => {
    if (id === 'store') return 'text-amber-400'
    return active
      ? 'text-cyan-glow'
      : 'text-ink-muted group-hover:text-ink-body'
  }

  const tabFocusCls = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

  // The current page is a lit tile drawn on the tab itself, so it shows from the first server render.
  // The lens rests underneath it and slides out to preview whatever is hovered or focused.
  const currentTabCls = 'bg-surface-3 shadow-nav-current'

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
    const cls = `relative z-10 px-3 2xl:px-3.5 py-2 rounded-control text-[13px] leading-none font-grotesk font-semibold tracking-[0.03em] transition-[color,background-color,box-shadow] duration-300 flex items-center justify-center group select-none whitespace-nowrap shrink-0 ${tabTextCls(tab.id, isCurrent, isPreviewed)} ${tabFocusCls} ${
      isCurrent ? currentTabCls : ''
    }`
    const inner = (
      <span className="flex items-center gap-2">
        {tab.id === 'home' ? (
          <BrandIcon
            aria-hidden="true"
            width={14}
            height={14}
            className={`w-4 h-4 object-contain transition-all duration-300 ${
              isCurrent || isPreviewed
                ? 'grayscale-0 opacity-100'
                : 'grayscale opacity-60'
            }`}
          />
        ) : (
          tab.Icon && (
            <tab.Icon
              aria-hidden="true"
              className={`w-4 h-4 transition-colors duration-300 ${tabIconCls(tab.id, isCurrent || isPreviewed)}`}
            />
          )
        )}
        <span>{tab.label}</span>
        {tab.external && (
          <ExternalLink
            aria-hidden="true"
            className="w-3 h-3 opacity-70 group-hover:opacity-100 text-amber-500"
          />
        )}
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
    const itemCls = `relative w-full flex items-center gap-3 px-4 py-2.5 rounded-control text-[13px] font-grotesk font-semibold tracking-[0.03em] transition-colors whitespace-nowrap ${tabFocusCls} ${
      isActive
        ? `text-ink bg-surface-3 ${activeEdgeCls}`
        : tab.id === 'store'
          ? 'text-amber-400/80 hover:text-amber-300 hover:bg-surface-3'
          : 'text-ink-body hover:text-ink hover:bg-surface-3'
    }`
    const content = (
      <>
        {tab.id === 'home' ? (
          <BrandIcon
            aria-hidden="true"
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

  // Phone menu rows match the app's menus: full-width rows with thin dividers; the current page is the lit tile.
  const renderMobileItem = (tab: NavTab) => {
    const isActive = currentTab === tab.id
    const isStore = tab.id === 'store'
    const itemCls = `relative w-full flex items-center gap-3.5 px-5 h-14 border-b border-line-subtle font-grotesk font-semibold text-base transition-colors ${tabFocusCls} ${
      isActive ? 'bg-surface-3 shadow-nav-current' : 'hover:bg-surface-2 active:bg-surface-2'
    } ${isStore ? 'text-amber-300' : 'text-ink'}`
    const icon =
      tab.id === 'home' ? (
        <BrandIcon aria-hidden="true" width={20} height={20} className="w-5 h-5 object-contain shrink-0" />
      ) : (
        tab.Icon && (
          <tab.Icon
            aria-hidden="true"
            className={`w-5 h-5 shrink-0 ${isStore ? 'text-amber-400' : isActive ? 'text-cyan-glow' : 'text-ink-muted'}`}
          />
        )
      )
    const content = (
      <>
        {icon}
        <span className="min-w-0 flex-1">{tab.label}</span>
        {tab.external ? (
          <ExternalLink aria-hidden="true" className="w-4 h-4 shrink-0 text-amber-500/80" />
        ) : (
          <ChevronRight
            aria-hidden="true"
            className={`w-4 h-4 shrink-0 ${isStore ? 'text-amber-400/80' : isActive ? 'text-cyan-glow' : 'text-ink-muted'}`}
          />
        )}
      </>
    )
    if (tab.href) {
      return (
        <a
          key={tab.id}
          href={tab.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMobileOpen(false)}
          className={itemCls}
        >
          {content}
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
        {content}
      </a>
    )
  }

  const menuButton = (
    <button
      ref={menuButtonRef}
      type="button"
      onClick={() => setMobileOpen(true)}
      aria-label="Open menu"
      aria-expanded={mobileOpen}
      aria-controls="public-header-mobile-menu"
      className={`w-11 h-11 -my-1 inline-flex items-center justify-center rounded-full text-ink hover:bg-surface-2 transition-colors active:scale-95 shrink-0 ${tabFocusCls}`}
    >
      <Menu className="w-[22px] h-[22px]" aria-hidden="true" />
    </button>
  )

  // Full-screen phone menu, shaped like the app's Account screen: X · MENU bar, rows, account at the foot.
  const mobileMenu =
    portalReady && menuPresence.mounted
      ? createPortal(
          <div
            ref={menuPanelRef}
            id="public-header-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            tabIndex={-1}
            inert={!mobileOpen}
            style={{ transform: menuPresence.visible ? 'translateY(0)' : 'translateY(100%)' }}
            className="lg:hidden fixed inset-0 z-[99980] flex flex-col bg-surface-1 font-sans transition-transform duration-250 ease-out motion-reduce:transition-none"
          >
            <div className="shrink-0 h-14 px-2 pt-[env(safe-area-inset-top)] box-content flex items-center gap-2 border-b border-line-subtle">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className={`shrink-0 w-11 h-11 rounded-control flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors ${tabFocusCls}`}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
              <h2 className="flex-1 text-center font-grotesk text-sm font-bold tracking-[0.08em] uppercase text-ink">Menu</h2>
              <span className="w-11 shrink-0" aria-hidden="true" />
            </div>
            <nav aria-label="Mobile Navigation" className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div className="max-w-xl mx-auto">{navTabs.map(renderMobileItem)}</div>
            </nav>
            <div className="shrink-0 border-t border-line-subtle px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="max-w-xl mx-auto">
                {authReady ? (
                  <Suspense fallback={<PublicHeaderAuthSkeleton layout="mobile" />}>
                    <LazyPublicHeaderAuthSlot
                      layout="menu"
                      onNavigate={onNavigate}
                      onOpenAuth={onOpenAuth}
                      onMobileClose={() => setMobileOpen(false)}
                    />
                  </Suspense>
                ) : (
                  <PublicHeaderAuthSkeleton layout="mobile" />
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <header
      ref={headerRef}
      className={`w-full px-4 sm:px-8 xl:px-12 py-0 lg:py-3 fixed top-0 left-0 right-0 z-50 border-b border-line-subtle transition-transform duration-300 ease-in-out ${
        headerShown ? 'translate-y-0' : '-translate-y-full pointer-events-none'
      } ${
        // Phones get the app's solid bar; wide screens keep the frosted strip over the hero art.
        isScrolled
          ? 'bg-surface-1 lg:bg-abyss/90 lg:backdrop-blur-2xl shadow-xl'
          : 'bg-surface-1 lg:bg-abyss/75 lg:backdrop-blur-xl lg:shadow-md'
      }`}
    >
      <div className="max-w-[1700px] mx-auto h-14 lg:h-auto flex items-center justify-between gap-4">
        {/* Shared Brand Logo & Emblem */}
        <HeaderBrand logoSize="lg" onClick={() => onNavigate('/')} />

        {/* Central navigation bar */}
        <nav
          ref={navMeasureRef}
          aria-label="Main Navigation"
          className="relative hidden lg:flex flex-1 min-w-0 items-center justify-center"
        >
          <div
            ref={navRef}
            onMouseLeave={() => setPreviewTab(null)}
            className="relative flex items-center gap-1 p-1 rounded-card backdrop-blur-2xl transition-all duration-300 shrink-0 bg-surface-1 hud-sheen border border-line-subtle shadow-sheen-inset"
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
              className="relative w-full h-full rounded-control overflow-hidden transition-all duration-300 bg-white/[0.06] border border-line-subtle"
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
                  className={`relative z-10 px-3 2xl:px-3.5 py-2 rounded-control text-[13px] leading-none font-grotesk font-semibold tracking-[0.03em] transition-colors duration-300 flex items-center justify-center select-none whitespace-nowrap shrink-0 ${tabFocusCls} ${
                    overflowOpen
                      ? 'text-ink bg-surface-2'
                      : 'text-ink-muted hover:text-ink hover:bg-surface-2'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>More</span>
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
                    className="absolute right-0 top-full mt-3 w-56 rounded-card border p-2 backdrop-blur-xl z-50 bg-surface-2 border border-line-subtle shadow-menu"
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
          {/* Phone: the app's faint pill (Join or menu) and the member's XP-ring portrait */}
          <div className="lg:hidden flex items-center">
            {authReady ? (
              <Suspense fallback={<div className="flex items-center -mr-1.5"><div className={PUBLIC_PHONE_PILL}>{menuButton}</div></div>}>
                <LazyPublicHeaderAuthSlot
                  layout="bar"
                  onNavigate={onNavigate}
                  onOpenAuth={onOpenAuth}
                  menuButton={menuButton}
                />
              </Suspense>
            ) : (
              <div className="flex items-center -mr-1.5"><div className={PUBLIC_PHONE_PILL}>{menuButton}</div></div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3 sm:gap-4">
            {authReady ? (
              <Suspense fallback={<PublicHeaderAuthSkeleton layout="desktop" />}>
                <LazyPublicHeaderAuthSlot
                  layout="desktop"
                  onNavigate={onNavigate}
                  onOpenAuth={onOpenAuth}
                />
              </Suspense>
            ) : (
              <PublicHeaderAuthSkeleton layout="desktop" />
            )}
          </div>
        </div>
      </div>

      {mobileMenu}
    </header>
  )
}
