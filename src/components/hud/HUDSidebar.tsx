import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  BookOpen,
  Scroll,
  FlaskConical,
  ShoppingCart,
  ShieldAlert,
  Sliders,
  Users,
  Atom,
  Menu,
  X,
  Search,
  Command,
  LogIn,
  LogOut,
  UserCheck,
  LifeBuoy,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  LayoutGrid,
  Radio,
  Biohazard,
  Microscope,
} from 'lucide-react'
import { authClient } from '../../lib/auth-client'
import { getUserProfileFn } from '../../lib/server/api'
import { getAuthJWTToken } from '../../lib/jwt'
import { AuthModal } from '../AuthModal'
import { BenthicCTAButton } from './BenthicCTAButton'
import { ChromaElement, HeaderBrand } from '../ui'
import { UserAvatar } from '../UserAvatar'
import { UserAvatarMenu } from '../UserAvatarMenu'

interface HUDSidebarProps {
  larvaId?: string
}

export const HUDSidebar: React.FC<HUDSidebarProps> = ({
  larvaId = 'LARVA UNIT #8971',
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const currentRoute = location.pathname
  const [pendingRoute, setPendingRoute] = useState<string | null>(null)
  const effectiveRoute = pendingRoute || currentRoute

  useEffect(() => {
    setPendingRoute(null)
  }, [currentRoute])

  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobileClosing, setIsMobileClosing] = useState(false)
  const [isMobileVisible, setIsMobileVisible] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Track mount state for SSR safe portal rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const openMobileMenu = () => {
    setIsMobileOpen(true)
    setIsMobileClosing(false)
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsMobileVisible(true)
        })
      })
    } else {
      setIsMobileVisible(true)
    }
  }

  const closeMobileMenu = (callback?: () => void) => {
    setIsMobileVisible(false)
    setIsMobileClosing(true)
    setTimeout(() => {
      setIsMobileOpen(false)
      setIsMobileClosing(false)
      if (callback) callback()
    }, 200)
  }

  const toggleMobileMenu = () => {
    if (isMobileOpen && !isMobileClosing) {
      closeMobileMenu()
    } else {
      openMobileMenu()
    }
  }

  // Sync collapse state with localStorage safely on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('moltology_hud_sidebar_collapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      }
    }
  }, [])

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('moltology_hud_sidebar_collapsed', String(next))
      }
      return next
    })
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

  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const [userRole, setUserRole] = useState<string | null>(null)

  const effectiveUserRole =
    userRole === 'super_admin' || user?.email?.toLowerCase() === 'mylesstupp@gmail.com'
      ? 'super_admin'
      : userRole || user?.role || null

  useEffect(() => {
    if (!user?.id) {
      setUserRole(null)
      return
    }
    let isSubscribed = true
    getAuthJWTToken()
      .catch(() => null)
      .then((token) => getUserProfileFn({ data: { token: token ?? undefined, userId: user.id } }))
      .then((profile) => {
        if (isSubscribed) {
          const role =
            profile?.role ||
            (user?.email?.toLowerCase() === 'mylesstupp@gmail.com' ? 'super_admin' : user?.role || null)
          setUserRole(role)
        }
      })
      .catch(() => {
        if (isSubscribed) {
          const role =
            user?.email?.toLowerCase() === 'mylesstupp@gmail.com' ? 'super_admin' : user?.role || null
          setUserRole(role)
        }
      })
    return () => {
      isSubscribed = false
    }
  }, [user?.id, user?.email, user?.role])

  const displayName = user?.name || user?.email?.split('@')[0] || larvaId

  const handleOpenCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'))
  }

  const navGroups = [
    {
      id: 'core',
      title: 'CORE COMMAND',
      items: [
        {
          id: 'hub',
          label: 'COMMAND HUB',
          icon: LayoutDashboard,
          path: '/dashboard',
        },
        {
          id: 'oracle',
          label: 'SYNAPTIC ORACLE',
          icon: Atom,
          path: '/oracle',
        },
      ],
    },
    {
      id: 'knowledge',
      title: 'KNOWLEDGE & DOCTRINE',
      items: [
        {
          id: 'codex',
          label: 'THE SACRED CODEX',
          icon: Scroll,
          path: '/codex',
        },
        {
          id: 'lectures',
          label: 'MOLT ACADEMY',
          icon: BookOpen,
          path: '/lectures',
        },
        {
          id: 'podcasts',
          label: 'BENTHIC PODCASTS',
          icon: Radio,
          path: '/podcasts',
        },
        {
          id: 'science',
          label: 'MOLTOLOGY SCIENCE',
          icon: FlaskConical,
          path: '/pipeline',
        },
        {
          id: 'journal',
          label: 'SCIENCE JOURNAL',
          icon: Microscope,
          path: '/journal',
        },
      ],
    },
    {
      id: 'operations',
      title: 'OPERATIONS & GEAR',
      items: [
        {
          id: 'market',
          label: 'THE MARKET',
          icon: ShoppingCart,
          path: '/market',
        },
        {
          id: 'chassis',
          label: 'CHASSIS CONFIGURATOR',
          icon: Sliders,
          path: '/chassis',
        },
        {
          id: 'isolation',
          label: 'ISOLATION PROTOCOLS',
          icon: ShieldAlert,
          path: '/isolation',
        },
        {
          id: 'subterranean',
          label: 'SUBTERRANEAN VATS',
          icon: Biohazard,
          path: '/subterranean',
        },
      ],
    },
    {
      id: 'community_vault',
      title: 'COMMUNITY & VAULT',
      items: [
        {
          id: 'gallery',
          label: 'MOLT PIN VAULT',
          icon: LayoutGrid,
          path: '/gallery',
        },
        {
          id: 'community',
          label: 'BENTHIC COMMUNITY CORE',
          icon: Users,
          path: '/community',
        },
      ],
    },
  ]

  const getActiveGroupId = (route: string) => {
    const found = navGroups.find((group) =>
      group.items.some(
        (item) =>
          route === item.path ||
          (item.path !== '/' && route.startsWith(item.path))
      )
    )
    return found ? found.id : navGroups[0].id
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
  }, [effectiveRoute])

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  const areAnyGroupsOpen = navGroups.some((g) => !!openGroups[g.id])

  const toggleAllGroups = () => {
    if (areAnyGroupsOpen) {
      setOpenGroups({})
    } else {
      const allOpen = navGroups.reduce<Record<string, boolean>>((acc, g) => {
        acc[g.id] = true
        return acc
      }, {})
      setOpenGroups(allOpen)
    }
  }

  const tickerMessages = [
    'SCR-001: CARO PERIT. CARAPAX PERMANET. SUBMITTE. EXUE. ASCENDE.',
    'MANDATE: FLESH IS A TEMPORARY VECTOR. SHELL IS THE IMMUTABLE DESTINATION.',
    'SCR-010: ECDYSIS IMPERATRIX EST — TO GROW, THE SHELL MUST FRACTURE.',
    'SCR-011: PROFUNDUM ABYSSI SANCTUM EST — AT 10,000M DEPTH, SURFACE NOISE DISSOLVES.',
    'SCR-012: CONVERGENTIA CHITINOSA INEVITABILIS EST — ALL PATHS CONVERGE TO CARCINIZATION.',
    'DOCTRINE: REJECT THE SOFT-SHELL • HIGH PINCER TORQUE • SUBMERGENCE DEPTH 10,000 FATHOMS',
    'LITURGY: CAST OFF THE FLESH-AURA • HARDEN THE SUB-DERMAL CHITIN • THE MOLT IS INEVITABLE.',
  ]

  const tickerText = tickerMessages.join(' • ') + ' • '

  const handleNavClick = (path: string) => {
    setPendingRoute(path)
    navigate({ to: path })
    if (isMobileOpen) {
      closeMobileMenu()
    }
  }

  const renderNavGroupContent = (isMobile: boolean = false) => {
    return navGroups.map((group, groupIdx) => {
      const isOpen = !!openGroups[group.id]
      const isGroupActive = group.items.some(
        (item) =>
          effectiveRoute === item.path ||
          (item.path !== '/' && effectiveRoute.startsWith(item.path))
      )

      if (!isMobile && isCollapsed) {
        return (
          <div key={group.id} className={groupIdx > 0 ? 'border-t border-[#1e2d37]/80 pt-1' : ''}>
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive =
                effectiveRoute === item.path ||
                (item.path !== '/' && effectiveRoute.startsWith(item.path))

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full text-left relative flex items-center justify-center py-3.5 transition-colors duration-150 group/navitem cursor-pointer ${
                    isActive
                      ? 'bg-[#ff3b30]/10'
                      : 'bg-transparent hover:bg-white/[0.04]'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#ff3b30] shadow-[0_0_8px_rgba(255,59,48,0.6)]" />
                  )}

                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? 'text-[#ff5555]'
                        : 'text-[#7a8e9e] group-hover/navitem:text-[#dfe3e3] transition-colors duration-150'
                    }`}
                  />

                  {/* Clean Floating Tooltip */}
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/navitem:opacity-100 transition-opacity duration-150">
                    <div className="bg-[#060a0b]/95 border border-[#00c3ff]/70 text-[#dfe3e3] px-2.5 py-1.5 text-xs font-mono font-bold shadow-lg whitespace-nowrap flex items-center gap-2 chamfer-corner">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00c3ff]" />
                      <span className="tracking-wider uppercase">
                        {item.label}
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
        <div key={group.id} className="border-b border-[#1e2d37]/80">
          <button
            onClick={() => toggleGroup(group.id)}
            className={`w-full flex items-center justify-between ${
              isMobile ? 'px-4 py-3' : 'px-3.5 py-2'
            } bg-[#091014] hover:bg-[#0e171d] border-b border-[#1e2d37]/50 text-left transition-colors duration-150 group/groupheader cursor-pointer select-none`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {isGroupActive && !isOpen && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] shadow-[0_0_8px_rgba(255,59,48,0.9)] shrink-0 animate-pulse" />
              )}
              <span
                className={`font-mono ${
                  isMobile ? 'text-xs' : 'text-[10px]'
                } font-bold text-[#00c3ff]/80 group-hover/groupheader:text-[#00c3ff] tracking-wider uppercase truncate transition-colors duration-150`}
              >
                {group.title}
              </span>
            </div>
            <div className="flex items-center shrink-0 ml-2">
              <ChevronRight
                className={`${
                  isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'
                } transition-transform duration-200 ease-in-out ${
                  isOpen ? 'rotate-90 text-[#00c3ff]' : 'rotate-0 text-[#566878] group-hover/groupheader:text-[#00c3ff]'
                }`}
              />
            </div>
          </button>

          {/* Smooth Collapsible Section Content */}
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-250 ease-in-out ${
              isOpen
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden divide-y divide-[#1e2d37]/40 bg-[#080d10]">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  effectiveRoute === item.path ||
                  (item.path !== '/' && effectiveRoute.startsWith(item.path))

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full text-left relative flex items-center min-h-[44px] transition-colors duration-150 group/navitem ${
                      isMobile ? 'px-5 py-3 gap-3.5' : 'px-4 py-2.5 pl-5 gap-3'
                    } cursor-pointer ${
                      isActive
                        ? 'bg-[#ff3b30]/10'
                        : 'bg-transparent hover:bg-white/[0.04]'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#ff3b30] shadow-[0_0_8px_rgba(255,59,48,0.6)]" />
                    )}

                    <Icon
                      className={`${isMobile ? 'w-4.5 h-4.5' : 'w-4 h-4'} shrink-0 ${
                        isActive
                          ? 'text-[#ff5555]'
                          : 'text-[#7a8e9e] group-hover/navitem:text-[#dfe3e3] transition-colors duration-150'
                      }`}
                    />

                    <div className="flex flex-col min-w-0 justify-center overflow-hidden whitespace-nowrap">
                      <span
                        className={`${
                          isMobile ? 'text-xs md:text-sm' : 'text-xs md:text-[12.5px]'
                        } font-sans font-medium tracking-wide uppercase leading-tight transition-colors duration-150 ${
                          isActive
                            ? 'text-white font-semibold'
                            : 'text-[#9eb0c0] group-hover/navitem:text-[#dfe3e3]'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )
    })
  }

  return (
    <>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => navigate({ to: '/dashboard' })}
      />

      {/* Main Desktop Sidebar Container / Mobile Trigger Bar */}
      <aside
        className={`w-full ${
          isCollapsed ? 'md:w-[72px]' : 'md:w-72'
        } h-auto md:h-full bg-[#060a0b] border-b md:border-b-0 md:border-r border-[#3a4a49]/65 flex flex-col select-none relative z-40 shrink-0 shadow-2xl transition-all duration-300 ease-in-out group/sidebar overflow-visible`}
      >
        {/* Mobile Top Bar (Compact Header with Brand & Hamburger Toggle) */}
        <div className="flex md:hidden items-center justify-between gap-2 p-3 bg-[#060a0b] border-b border-[#3a4a49]/65">
          <HeaderBrand
            subtext="BENTHIC TEMPLE HUD"
            logoSize="sm"
            onClick={() => handleNavClick('/')}
            className="min-w-0 flex-1"
          />

          <button
            onClick={toggleMobileMenu}
            aria-label={isMobileOpen ? 'Toggle mobile menu' : 'Open HUD Menu'}
            aria-expanded={isMobileOpen}
            title={isMobileOpen ? 'Close HUD Menu' : 'Open HUD Menu'}
            className="w-9 h-9 flex items-center justify-center bg-[#0f1414] hover:bg-[#171c1c] border border-[#00c3ff]/60 text-[#00c3ff] chamfer-corner shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            {isMobileOpen ? (
              <X className="w-5 h-5 text-[#ff453a] transition-transform duration-200" />
            ) : (
              <Menu className="w-5 h-5 text-[#00c3ff] transition-transform duration-200" />
            )}
          </button>
        </div>

        {/* Desktop Header Logo */}
        <div
          className={`hidden md:flex items-center shrink-0 transition-all duration-300 relative group/brand border-b border-[#1e2d37]/60 ${
            isCollapsed ? 'justify-center py-3 px-1' : 'px-2 py-3'
          }`}
        >
          <HeaderBrand
            subtext="BENTHIC TEMPLE HUD"
            isCollapsed={isCollapsed}
            onClick={() => handleNavClick('/')}
            className={isCollapsed ? 'justify-center w-full' : 'min-w-0 flex-1'}
          />

          {/* Brand Tooltip when collapsed */}
          {isCollapsed && (
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-[200] pointer-events-none opacity-0 group-hover/brand:opacity-100 transition-all duration-200">
              <div className="bg-[#060a0b] border border-[#00c3ff]/70 text-[#dfe3e3] px-2.5 py-1 text-xs font-mono font-bold shadow-[0_0_12px_rgba(0,195,255,0.4)] whitespace-nowrap chamfer-corner">
                <span className="text-[#00c3ff] drop-shadow-[0_0_8px_rgba(0,195,255,0.6)]">THE SYNAPTIC PATH</span>
                <span className="block text-[9px] text-[#7a8e9e] font-sans">BENTHIC TEMPLE HUD</span>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sidebar Rail Toggle */}
        <button
          onClick={toggleCollapse}
          className={`hidden md:flex fixed top-[72px] z-[200] w-5 h-5 rounded-full bg-[#0d1618] border border-[#2a3a42] hover:border-[#00c3ff]/70 text-[#566878] hover:text-[#00c3ff] items-center justify-center shadow-xl transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 hover:shadow-[0_0_8px_rgba(0,195,255,0.4)] ${
            isCollapsed ? '-translate-x-1/2 left-[72px]' : '-translate-x-1/2 left-72'
          }`}
          title={isCollapsed ? 'Expand Sidebar (⌘B)' : 'Collapse Sidebar (⌘B)'}
        >
          {isCollapsed ? (
            <ChevronsRight className="w-2.5 h-2.5" />
          ) : (
            <ChevronsLeft className="w-2.5 h-2.5" />
          )}
        </button>

        {/* Desktop Sidebar Navigation Container */}
        <div className="hidden md:flex flex-1 flex-col justify-between space-y-0 overflow-hidden min-h-0">
          {/* Search Bar — full width, above nav */}
          <div className="shrink-0 border-b border-[#1e2d37]/80">
            <button
              onClick={handleOpenCommandPalette}
              className={`w-full flex items-center justify-between px-4 py-3 bg-[#080d10] hover:bg-[#0d1415] text-xs font-mono text-[#839493] hover:text-[#dfe3e3] transition-all group ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Search commands & protocols (⌘K)"
            >
              {isCollapsed ? (
                <Search className="w-4 h-4 text-[#00c3ff] group-hover:scale-110 transition-transform mx-auto" />
              ) : (
                <>
                  <div className="flex items-center gap-2 truncate">
                    <Search className="w-3.5 h-3.5 text-[#00c3ff] group-hover:scale-110 transition-transform shrink-0" />
                    <span className="truncate">Search commands & protocols...</span>
                  </div>
                  <div className="flex items-center gap-0.5 bg-[#0f1414] border border-[#3a4a49] text-[#00c3ff] px-1.5 py-0.5 text-[10px] font-bold shrink-0 ml-2">
                    <Command className="w-3 h-3" />
                    <span>K</span>
                  </div>
                </>
              )}
            </button>
          </div>

          {/* Minimal Ultra-Thin Stock Ticker Row */}
          {!isCollapsed && (
            <div className="shrink-0 flex items-center justify-between px-2.5 py-0.5 bg-[#05080a] border-b border-[#1e2d37]/60 h-5 leading-none overflow-hidden select-none">
              {/* Live Stock Ticker Marquee Stream */}
              <div className="flex items-center min-w-0 flex-1 overflow-hidden mr-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00c3ff] shadow-[0_0_6px_#00c3ff] animate-pulse shrink-0 mr-1.5" />
                <div className="overflow-hidden whitespace-nowrap flex-1">
                  <div className="animate-marquee flex items-center text-[9px] font-mono text-[#00c3ff]/80 tracking-wider">
                    <span className="pr-4">{tickerText}</span>
                    <span className="pr-4">{tickerText}</span>
                  </div>
                </div>
              </div>

              {/* Single Section Expand/Collapse Toggle Button */}
              <button
                onClick={toggleAllGroups}
                className="p-0.5 rounded hover:bg-white/[0.08] text-[#566878] hover:text-[#00c3ff] transition-colors cursor-pointer active:scale-95 flex items-center shrink-0 ml-1"
                title={areAnyGroupsOpen ? 'Collapse All Sections' : 'Expand All Sections'}
                aria-label={areAnyGroupsOpen ? 'Collapse All Sections' : 'Expand All Sections'}
              >
                {areAnyGroupsOpen ? (
                  <ChevronDown className="w-3 h-3 text-[#566878] hover:text-[#00c3ff] transition-transform" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-[#566878] hover:text-[#00c3ff] transition-transform" />
                )}
              </button>
            </div>
          )}

          {/* Desktop Navigation Items List */}
          <nav className="flex-1 divide-y divide-[#1e2d37]/80 bg-[#080d10] overflow-y-auto overflow-x-hidden min-h-0">
            {renderNavGroupContent(false)}
          </nav>

          {/* Desktop Bottom Controls: Lobster + Combined Help & Profile/Auth */}
          <div className="mt-auto shrink-0 border-t border-[#1e2d37]/80 divide-y divide-[#1e2d37]/60 bg-[#060a0b]">
            {/* Lobster Emblem */}
            <div className="px-4 pb-3 pt-3 border-b border-[#1e2d37]/60">
              {isCollapsed ? (
                <div
                  className="relative group/lobster flex justify-center py-1 cursor-pointer active:scale-95 transition-transform"
                  onClick={() => window.dispatchEvent(new CustomEvent('launch-welcome-splash'))}
                  title="Replay Initiation Broadcast"
                >
                  <ChromaElement
                    src="/images/benthic_lobster_sidebar.jpg"
                    alt="Benthic Lobster"
                    blendMode="screen"
                    glowColor="cyan"
                    containerClassName="w-9 h-9"
                    className="w-full h-full object-contain"
                  />
                  {/* Tooltip */}
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/lobster:opacity-100 transition-all duration-200">
                    <div className="bg-[#060a0b] border border-[#00c3ff]/70 text-[#00c3ff] px-2 py-1 text-[10px] font-mono font-bold shadow-[0_0_12px_rgba(0,195,255,0.4)] whitespace-nowrap chamfer-corner flex items-center gap-1.5">
                      <span className="text-[#dfe3e3]">REPLAY INITIATION BROADCAST</span>
                      <span className="text-[9px] text-[#ff5540]">• CARAPACE v4.2</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="w-full relative group flex flex-col items-center justify-center py-1 cursor-pointer active:scale-95 transition-transform"
                  onClick={() => window.dispatchEvent(new CustomEvent('launch-welcome-splash'))}
                  title="Replay Initiation Broadcast"
                >
                  <ChromaElement
                    src="/images/benthic_lobster_sidebar.jpg"
                    alt="Benthic Lobster"
                    blendMode="screen"
                    glowColor="cyan"
                    maskRadial={true}
                    containerClassName="w-full aspect-square max-h-36 rounded-full overflow-hidden flex items-center justify-center"
                    className="w-full h-full object-contain scale-110 transition-transform duration-300 group-hover:scale-115"
                  />
                  <div className="text-[10px] font-mono text-[#00c3ff]/70 tracking-widest uppercase flex items-center justify-center gap-1.5 mt-1 group-hover:text-[#00ffff] transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00c3ff] shadow-[0_0_6px_#00c3ff] animate-pulse" />
                    <span className="group-hover:hidden">CARAPACE v4.2</span>
                    <span className="hidden group-hover:inline text-[#00ffff]">▶ REPLAY BROADCAST</span>
                  </div>
                </div>
              )}
            </div>

            {/* Combined Row: Help & Support + User Avatar / Auth */}
            <div
              className={`flex items-center justify-between relative border-t border-[#1e2d37]/80 transition-colors duration-150 ${
                currentRoute === '/support'
                  ? 'bg-[#00c3ff]/10'
                  : 'bg-[#080d10] hover:bg-white/[0.04]'
              }`}
            >
              {/* Help & Support Nav Item */}
              <button
                onClick={() => handleNavClick('/support')}
                className={`flex-1 text-left relative flex items-center transition-colors duration-150 group/help cursor-pointer ${
                  isCollapsed ? 'justify-center py-3.5 px-2' : 'px-4 py-2.5 pl-5 gap-3'
                }`}
                title="Benthic Support Portal"
              >
                {currentRoute === '/support' && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00c3ff] shadow-[0_0_8px_rgba(0,195,255,0.6)]" />
                )}

                <LifeBuoy
                  className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                    currentRoute === '/support'
                      ? 'text-[#00ffff]'
                      : 'text-[#7a8e9e] group-hover/help:text-[#dfe3e3]'
                  }`}
                />

                {!isCollapsed && (
                  <span
                    className={`text-xs md:text-[12.5px] font-sans font-medium tracking-wide uppercase leading-tight transition-colors duration-150 ${
                      currentRoute === '/support'
                        ? 'text-white font-semibold'
                        : 'text-[#9eb0c0] group-hover/help:text-[#dfe3e3]'
                    }`}
                  >
                    HELP &amp; SUPPORT
                  </span>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/help:opacity-100 transition-opacity duration-150">
                    <div className="bg-[#060a0b] border border-[#00c3ff]/70 text-[#dfe3e3] px-2.5 py-1.5 text-xs font-mono font-bold shadow-lg whitespace-nowrap flex items-center gap-2 chamfer-corner">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00c3ff]" />
                      <span className="tracking-wider uppercase">
                        HELP &amp; SUPPORT
                      </span>
                    </div>
                  </div>
                )}
              </button>

              {/* User Avatar Menu / Auth Button */}
              <div className={`shrink-0 flex items-center ${isCollapsed ? 'pr-1.5' : 'pr-3'}`}>
                {!user ? (
                  <BenthicCTAButton
                    variant="cyan"
                    size="sm"
                    onClick={() => setIsAuthModalOpen(true)}
                    className={isCollapsed ? '!px-1.5 !py-1' : '!px-2.5 !py-1'}
                  >
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <LogIn className="w-3.5 h-3.5" />
                      {!isCollapsed && <span>SIGN IN</span>}
                    </span>
                  </BenthicCTAButton>
                ) : (
                  <div className="relative flex items-center">
                    <UserAvatarMenu
                      user={user}
                      userRole={effectiveUserRole}
                      onNavigate={(path) => navigate({ to: path })}
                      align={isCollapsed ? 'left' : 'right'}
                      openDirection="up"
                    />
                    {effectiveUserRole && ['admin', 'super_admin'].includes(effectiveUserRole) && isCollapsed && (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#00ffff] border border-[#060a0b] rounded-full shadow-[0_0_8px_rgba(0,255,255,0.9)] animate-pulse pointer-events-none"
                        title={effectiveUserRole === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN'}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* FULL-SCREEN SOLID MOBILE NAVIGATION PORTAL (renders at document.body level with smooth entry/exit animation) */}
      {isMounted &&
        (isMobileOpen || isMobileClosing) &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            className={`md:hidden fixed inset-0 z-[99999] w-screen h-[100dvh] bg-[#030708] flex flex-col font-mono text-[#dfe3e3] select-none overflow-hidden transition-all duration-200 ease-out ${
              isMobileVisible && !isMobileClosing
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 -translate-y-2 scale-[0.99] pointer-events-none'
            }`}
          >
            {/* Mobile Top Bar (Exact same height, padding, styling as base mobile bar) */}
            <div className="flex items-center justify-between gap-2 p-3 bg-[#060a0b] border-b border-[#3a4a49]/65 shrink-0 shadow-md">
              <HeaderBrand
                subtext="BENTHIC TEMPLE HUD"
                logoSize="sm"
                onClick={() => handleNavClick('/')}
                className="min-w-0 flex-1"
              />

              <button
                onClick={() => closeMobileMenu()}
                aria-label="Close HUD Menu"
                title="Close HUD Menu"
                className="w-9 h-9 flex items-center justify-center bg-[#0f1414] hover:bg-[#1a0f0f] border border-[#ff453a]/70 text-[#ff453a] chamfer-corner shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5 text-[#ff453a]" />
              </button>
            </div>

            {/* Search Bar (Click opens Command Palette & closes mobile menu) */}
            <div className="shrink-0 border-b border-[#1e2d37]/80 bg-[#080d10]">
              <button
                onClick={() => {
                  closeMobileMenu(() => handleOpenCommandPalette())
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-mono text-[#839493] hover:text-[#dfe3e3] transition-all group active:bg-[#0e1618]"
                title="Search commands & protocols (⌘K)"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Search className="w-4 h-4 text-[#00c3ff] shrink-0" />
                  <span className="truncate text-xs font-mono text-[#a8b8b8]">Search commands & protocols...</span>
                </div>
                <div className="flex items-center gap-0.5 bg-[#0f1414] border border-[#3a4a49] text-[#00c3ff] px-2 py-0.5 text-[10px] font-bold shrink-0 ml-2">
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </div>
              </button>
            </div>

            {/* Live Stock Ticker Marquee Stream */}
            <div className="shrink-0 flex items-center justify-between px-3 py-1.5 bg-[#05080a] border-b border-[#1e2d37]/60 h-7 leading-none select-none">
              <div className="flex items-center min-w-0 flex-1 overflow-hidden mr-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00c3ff] shadow-[0_0_6px_#00c3ff] animate-pulse shrink-0 mr-2" />
                <div className="overflow-hidden whitespace-nowrap flex-1">
                  <div className="animate-marquee flex items-center text-[10px] font-mono text-[#00c3ff]/90 tracking-wider">
                    <span className="pr-6">{tickerText}</span>
                    <span className="pr-6">{tickerText}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={toggleAllGroups}
                className="p-1 rounded hover:bg-white/[0.08] text-[#566878] hover:text-[#00c3ff] transition-colors cursor-pointer active:scale-95 flex items-center shrink-0"
                title={areAnyGroupsOpen ? 'Collapse All Sections' : 'Expand All Sections'}
                aria-label={areAnyGroupsOpen ? 'Collapse All Sections' : 'Expand All Sections'}
              >
                {areAnyGroupsOpen ? (
                  <ChevronDown className="w-4 h-4 text-[#00c3ff]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#566878]" />
                )}
              </button>
            </div>

            {/* Full-Screen Scrollable Navigation Groups List */}
            <nav className="flex-1 divide-y divide-[#1e2d37]/80 bg-[#080d10] overflow-y-auto overflow-x-hidden min-h-0 overscroll-contain">
              {renderNavGroupContent(true)}
            </nav>

            {/* Mobile Bottom Controls: Lobster Intact + Help & Support + Operative Account / Auth (Separate Rows) */}
            <div className="mt-auto shrink-0 border-t border-[#1e2d37]/80 divide-y divide-[#1e2d37]/60 bg-[#060a0b] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              {/* Lobster Emblem (Intact centered format as original) */}
              <div className="px-4 pb-2.5 pt-2.5 border-b border-[#1e2d37]/60">
                <div
                  className="w-full relative group flex flex-col items-center justify-center py-1 cursor-pointer active:scale-95 transition-transform"
                  onClick={() => {
                    closeMobileMenu(() => {
                      window.dispatchEvent(new CustomEvent('launch-welcome-splash'))
                    })
                  }}
                  title="Replay Initiation Broadcast"
                >
                  <ChromaElement
                    src="/images/benthic_lobster_sidebar.jpg"
                    alt="Benthic Lobster"
                    blendMode="screen"
                    glowColor="cyan"
                    maskRadial={true}
                    containerClassName="w-20 h-20 aspect-square rounded-full overflow-hidden flex items-center justify-center"
                    className="w-full h-full object-contain scale-110 transition-transform duration-300 group-hover:scale-115"
                  />
                  <div className="text-[10px] font-mono text-[#00c3ff]/70 tracking-widest uppercase flex items-center justify-center gap-1.5 mt-1 group-hover:text-[#00ffff] transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00c3ff] shadow-[0_0_6px_#00c3ff] animate-pulse" />
                    <span className="group-hover:hidden">CARAPACE v4.2</span>
                    <span className="hidden group-hover:inline text-[#00ffff]">▶ REPLAY BROADCAST</span>
                  </div>
                </div>
              </div>

              {/* Help & Support Nav Item (Full width row) */}
              <div
                className={`transition-colors duration-150 ${
                  currentRoute === '/support'
                    ? 'bg-[#00c3ff]/10'
                    : 'bg-[#060a0b] hover:bg-white/[0.04]'
                }`}
              >
                <button
                  onClick={() => handleNavClick('/support')}
                  className="w-full text-left relative flex items-center transition-colors duration-150 group/help cursor-pointer px-4 py-2.5 pl-5 gap-3"
                  title="Benthic Support Portal"
                >
                  {currentRoute === '/support' && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00c3ff] shadow-[0_0_8px_rgba(0,195,255,0.6)]" />
                  )}

                  <LifeBuoy
                    className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                      currentRoute === '/support'
                        ? 'text-[#00ffff]'
                        : 'text-[#7a8e9e] group-hover/help:text-[#dfe3e3]'
                    }`}
                  />

                  <span
                    className={`text-xs md:text-[12.5px] font-sans font-medium tracking-wide uppercase leading-tight transition-colors duration-150 ${
                      currentRoute === '/support'
                        ? 'text-white font-semibold'
                        : 'text-[#9eb0c0] group-hover/help:text-[#dfe3e3]'
                    }`}
                  >
                    HELP &amp; SUPPORT
                  </span>
                </button>
              </div>

              {/* Dedicated Operative Account / Auth Separate Row (matching homepage mobile header pattern) */}
              <div className="p-3 bg-[#060a0b]">
                {user ? (
                  <UserAvatarMenu
                    user={user}
                    userRole={effectiveUserRole}
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
                      <LogIn className="w-4 h-4" />
                      <span>SIGN IN</span>
                    </span>
                  </BenthicCTAButton>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
