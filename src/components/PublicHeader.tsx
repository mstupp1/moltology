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
  ShoppingBag,
  ExternalLink,
  Newspaper,
  Menu,
  X,
  Activity,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { HeaderBrand } from '@/components/ui'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { UserAvatarMenu } from '@/components/UserAvatarMenu'

export interface PublicHeaderProps {
  activePage?: 'home' | 'org' | 'blog' | 'news' | 'store' | 'moltmax'
  onOpenAuth?: (mode: 'login' | 'signup') => void
}

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
  } catch (e) {
    // Fallback if router context is missing
  }

  const currentTab = useMemo(() => {
    if (locationPathname.startsWith('/moltmax')) return 'moltmax'
    if (locationPathname.startsWith('/news') || locationPathname.startsWith('/blog')) return 'news'
    if (locationPathname.startsWith('/org')) return 'org'
    if (locationPathname === '/') return 'home'
    if (activePage === 'blog') return 'news'
    return activePage
  }, [activePage, locationPathname])

  const onNavigate = (path: string) => {
    navigate({ to: path })
    setMobileOpen(false)
  }
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user

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
  }, [targetTab])

  return (
    <header
      className={`w-full px-4 sm:px-8 lg:px-12 py-3 fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
      } ${
        isScrolled
          ? 'bg-[#030606]/90 backdrop-blur-2xl border-b border-[#121c1d]/80 shadow-xl'
          : 'bg-[#030606]/75 backdrop-blur-xl border-b border-cyan-950/40 shadow-md'
      }`}
    >
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">


        {/* Shared Brand Logo & Emblem */}
        <HeaderBrand
          subtext="MOLTOLOGY.ORG FOUNDATION"
          onClick={() => onNavigate('/')}
        />

        {/* Central Modern Pill Navigation Capsule */}
        <nav
          ref={navRef}
          onMouseLeave={() => setHoveredTab(null)}
          aria-label="Main Navigation"
          className="relative hidden lg:flex items-center gap-0.5 bg-[#080d0e]/80 border border-cyan-950/80 p-1 rounded-full backdrop-blur-md"
        >
          {/* Smooth Continuous Sliding Active Pill Background */}
          <div
            aria-hidden="true"
            className={`absolute top-1 bottom-1 left-0 rounded-full bg-cyan-950/80 border border-cyan-500/40 pointer-events-none z-0 shadow-sm ${
              hasMounted
                ? 'transition-[transform,width] duration-300 ease-[cubic-bezier(0.2,1,0.3,1)]'
                : 'transition-none'
            }`}
            style={{
              transform: `translate3d(${pillStyle.left}px, 0, 0)`,
              width: `${pillStyle.width}px`,
              opacity: pillStyle.opacity,
            }}
          />

          <button
            ref={(el) => { tabRefs.current['home'] = el }}
            onClick={() => onNavigate('/')}
            onMouseEnter={() => setHoveredTab('home')}
            className={`relative z-10 px-3 py-1.5 rounded-full text-xs font-grotesk font-bold tracking-wider transition-colors duration-300 flex items-center gap-1.5 group ${
              targetTab === 'home'
                ? 'text-cyan-300'
                : 'text-gray-400'
            }`}
          >
            <img
              src="/images/order_emblem.png"
              alt="The Synaptic Path Logo"
              className={`w-3.5 h-3.5 object-contain transition-all duration-300 ${
                targetTab === 'home'
                  ? 'grayscale-0'
                  : 'grayscale opacity-60'
              }`}
            />
            <span>THE SYNAPTIC PATH</span>
          </button>

          <button
            ref={(el) => { tabRefs.current['news'] = el }}
            onClick={() => onNavigate('/news')}
            onMouseEnter={() => setHoveredTab('news')}
            className={`relative z-10 px-3 py-1.5 rounded-full text-xs font-grotesk font-bold tracking-wider transition-colors duration-300 flex items-center gap-1.5 group ${
              targetTab === 'news'
                ? 'text-cyan-300'
                : 'text-gray-400'
            }`}
          >
            <Newspaper className={`w-3.5 h-3.5 transition-colors duration-300 ${targetTab === 'news' ? 'text-cyan-300' : 'text-gray-400'}`} />
            <span>NEWS</span>
          </button>

          <button
            ref={(el) => { tabRefs.current['moltmax'] = el }}
            onClick={() => onNavigate('/moltmax')}
            onMouseEnter={() => setHoveredTab('moltmax')}
            className={`relative z-10 px-3 py-1.5 rounded-full text-xs font-grotesk font-bold tracking-wider transition-colors duration-300 flex items-center gap-1.5 group ${
              targetTab === 'moltmax'
                ? 'text-cyan-300'
                : 'text-gray-400'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 transition-colors duration-300 ${targetTab === 'moltmax' ? 'text-cyan-300' : 'text-gray-400'}`} />
            <span>MOLTMAX</span>
          </button>

          <button
            ref={(el) => { tabRefs.current['org'] = el }}
            onClick={() => onNavigate('/org')}
            onMouseEnter={() => setHoveredTab('org')}
            className={`relative z-10 px-3 py-1.5 rounded-full text-xs font-grotesk font-bold tracking-wider transition-colors duration-300 flex items-center gap-1.5 group ${
              targetTab === 'org'
                ? 'text-cyan-300'
                : 'text-gray-400'
            }`}
          >
            <Building2 className={`w-3.5 h-3.5 transition-colors duration-300 ${targetTab === 'org' ? 'text-cyan-300' : 'text-gray-400'}`} />
            <span>ORGANIZATION</span>
          </button>

          <a
            ref={(el) => { tabRefs.current['store'] = el }}
            href="https://www.etsy.com/shop/SaasTrash"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHoveredTab('store')}
            className={`relative z-10 px-3 py-1.5 rounded-full text-xs font-grotesk font-bold tracking-wider transition-colors duration-300 flex items-center gap-1.5 group ${
              targetTab === 'store' ? 'text-amber-300' : 'text-amber-400/80'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400 group-hover:scale-105 transition-transform" />
            <span>STORE</span>
            <ExternalLink className="w-3 h-3 text-amber-500 opacity-70 group-hover:opacity-100" />
          </a>
        </nav>

        {/* Header Action Items */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            className="lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg bg-[#080d0e]/90 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900/60 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            {mobileOpen ? <X className="w-5 h-5 text-red-400" /> : <Menu className="w-5 h-5 text-cyan-300" />}
          </button>

          <div className="hidden lg:flex items-center gap-3 sm:gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('/dashboard')}
                className="px-5 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center gap-2 transition-all hover:scale-105 shadow-hud-cyan"
              >
                <Cpu className="w-4 h-4" />
                <span>DASHBOARD</span>
              </button>
              <UserAvatarMenu user={user} onNavigate={onNavigate} />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenAuth?.('login')}
                className="px-4 py-2 text-gray-300 hover:text-cyan-400 text-xs font-bold tracking-wider transition-colors"
              >
                LOG IN
              </button>
              <BenthicCTAButton
                size="sm"
                onClick={() => onOpenAuth?.('signup')}
              >
                <span className="flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>JOIN PATH</span>
                </span>
              </BenthicCTAButton>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Backdrop & Menu */}
      <div
        className={`lg:hidden fixed inset-0 top-[60px] bg-black/60 backdrop-blur-sm -z-10 transition-opacity duration-300 ease-in-out ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen
            ? 'max-h-[calc(100vh-5rem)] overflow-y-auto opacity-100 translate-y-0'
            : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="mt-3 p-3 space-y-2 bg-[#080d0e]/95 border border-cyan-950/80 rounded-xl backdrop-blur-md shadow-2xl">
          <button
            onClick={() => onNavigate('/')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-grotesk font-bold tracking-wider transition-colors ${
              currentTab === 'home' ? 'text-cyan-300 bg-cyan-950/40' : 'text-gray-300 hover:text-cyan-400 hover:bg-cyan-950/30'
            }`}
          >
            <img src="/images/order_emblem.png" alt="" className="w-4 h-4 object-contain" />
            <span>THE SYNAPTIC PATH</span>
          </button>

          <button
            onClick={() => onNavigate('/news')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-grotesk font-bold tracking-wider transition-colors ${
              currentTab === 'news' ? 'text-cyan-300 bg-cyan-950/40' : 'text-gray-300 hover:text-cyan-400 hover:bg-cyan-950/30'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>NEWS</span>
          </button>

          <button
            onClick={() => onNavigate('/moltmax')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-grotesk font-bold tracking-wider transition-colors ${
              currentTab === 'moltmax' ? 'text-cyan-300 bg-cyan-950/40' : 'text-gray-300 hover:text-cyan-400 hover:bg-cyan-950/30'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>MOLTMAX</span>
          </button>

          <button
            onClick={() => onNavigate('/org')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-grotesk font-bold tracking-wider transition-colors ${
              currentTab === 'org' ? 'text-cyan-300 bg-cyan-950/40' : 'text-gray-300 hover:text-cyan-400 hover:bg-cyan-950/30'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>ORGANIZATION</span>
          </button>

          <a
            href="https://www.etsy.com/shop/SaasTrash"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-grotesk font-bold tracking-wider text-amber-300 hover:bg-cyan-950/30 transition-colors"
          >
            <span className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>STORE</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-500 opacity-70" />
          </a>

          {/* Divider */}
          <div className="border-t border-cyan-950/80 pt-2 mt-1" />

          {user ? (
            <div className="space-y-2 pt-1">
              <button
                onClick={() => onNavigate('/dashboard')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-sm uppercase tracking-wider transition-colors shadow-[0_0_12px_rgba(0,195,255,0.15)] active:scale-[0.99]"
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>DASHBOARD</span>
              </button>
              <UserAvatarMenu user={user} onNavigate={onNavigate} inline />
            </div>
          ) : (
            <div className="flex items-stretch gap-2">
              <button
                onClick={() => { setMobileOpen(false); onOpenAuth?.('login') }}
                className="flex-1 px-4 py-3 text-gray-300 hover:text-cyan-400 text-sm font-bold tracking-wider transition-colors border border-cyan-950/60 rounded-lg bg-[#080d0e]/60"
              >
                LOG IN
              </button>
              <div className="flex-1">
                <BenthicCTAButton
                  size="sm"
                  fullWidth
                  onClick={() => { setMobileOpen(false); onOpenAuth?.('signup') }}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>JOIN PATH</span>
                  </span>
                </BenthicCTAButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}



