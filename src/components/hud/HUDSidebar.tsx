import React, { useState, useEffect } from 'react'
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Sync state with localStorage safely on client side
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
    let isMounted = true
    getAuthJWTToken()
      .catch(() => null)
      .then((token) => getUserProfileFn({ data: { token: token ?? undefined, userId: user.id } }))
      .then((profile) => {
        if (isMounted) {
          const role = profile?.role || (user?.email?.toLowerCase() === 'mylesstupp@gmail.com' ? 'super_admin' : user?.role || null)
          setUserRole(role)
        }
      })
      .catch(() => {
        if (isMounted) {
          const role = user?.email?.toLowerCase() === 'mylesstupp@gmail.com' ? 'super_admin' : (user?.role || null)
          setUserRole(role)
        }
      })
    return () => {
      isMounted = false
    }
  }, [user?.id, user?.email, user?.role])

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate({ to: '/' })
  }

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

  const expandAllGroups = () => {
    const allOpen = navGroups.reduce<Record<string, boolean>>((acc, g) => {
      acc[g.id] = true
      return acc
    }, {})
    setOpenGroups(allOpen)
  }

  const collapseAllGroups = () => {
    setOpenGroups({})
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

  const allNavItems = navGroups.flatMap((g) => g.items)

  const activeItem =
    allNavItems.find(
      (item) =>
        effectiveRoute === item.path ||
        (item.path !== '/' && effectiveRoute.startsWith(item.path))
    ) || allNavItems[0]

  const handleNavClick = (path: string) => {
    setPendingRoute(path)
    navigate({ to: path })
    setIsMobileOpen(false)
  }

  return (
    <>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => navigate({ to: '/dashboard' })}
      />

      <aside
        className={`w-full ${
          isCollapsed ? 'md:w-[72px]' : 'md:w-72'
        } h-auto md:h-full bg-[#060a0b]/70 backdrop-blur-md border-b md:border-b-0 md:border-r border-[#3a4a49]/65 flex flex-col select-none relative z-40 shrink-0 shadow-2xl transition-all duration-300 ease-in-out group/sidebar overflow-visible`}
      >
        {/* Mobile Accordion Top Bar */}
        <div className="flex md:hidden items-center justify-between gap-2 p-3">
          <div
            onClick={() => handleNavClick('/')}
            className="flex items-center gap-2 cursor-pointer group/mobilebrand"
          >
            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <img
                src="/images/order_emblem.png"
                alt="Order Emblem"
                className="w-full h-full object-contain filter drop-shadow-[0_2px_5px_rgba(0,195,255,0.35)] transition-all"
              />
            </div>
            <div>
              <div className="font-grotesk font-extrabold text-xs text-white tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] [text-shadow:0_0_10px_rgba(0,195,255,0.4)]">
                THE SYNAPTIC PATH
              </div>
              <div className="text-[10px] text-[#00c3ff] font-mono font-bold flex items-center gap-1">
                <span className="text-[#00c3ff]/80">ACTIVE:</span>
                <span className="text-[#ff5540] truncate max-w-[130px] font-bold drop-shadow-[0_0_6px_rgba(255,85,64,0.6)]">
                  {activeItem.label}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="px-3 py-1.5 bg-[#0f1414]/90 hover:bg-[#171c1c] border border-[#00c3ff]/60 text-[#00c3ff] font-mono font-bold text-xs flex items-center gap-1.5 chamfer-corner shadow-md active:scale-95 transition-all"
          >
            {isMobileOpen ? (
              <X className="w-4 h-4 text-[#ff453a]" />
            ) : (
              <Menu className="w-4 h-4 text-[#00c3ff]" />
            )}
            <span>{isMobileOpen ? 'CLOSE' : 'HUD MENU'}</span>
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
              <div className="bg-[#060a0b]/95 border border-[#00c3ff]/70 text-[#dfe3e3] px-2.5 py-1 text-xs font-mono font-bold shadow-[0_0_12px_rgba(0,195,255,0.4)] whitespace-nowrap chamfer-corner">
                <span className="text-[#00c3ff] drop-shadow-[0_0_8px_rgba(0,195,255,0.6)]">THE SYNAPTIC PATH</span>
                <span className="block text-[9px] text-[#7a8e9e] font-sans">BENTHIC TEMPLE HUD</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Rail Toggle — fixed so it always renders above all stacking contexts */}
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

        {/* Main Content Container - Always visible on Desktop, toggling smoothly on Mobile */}
        <div
          className={`flex-1 flex flex-col justify-between space-y-0 overflow-hidden min-h-0 transition-all duration-300 ease-in-out ${
            isMobileOpen
              ? 'max-h-[calc(100vh-4rem)] opacity-100 flex'
              : 'max-h-0 opacity-0 hidden md:max-h-none md:opacity-100 md:flex'
          }`}
        >
            {/* Search Bar — full width, above nav */}
            <div className="shrink-0 border-b border-[#1e2d37]/80">
              <button
                onClick={handleOpenCommandPalette}
                className={`w-full flex items-center justify-between px-4 py-3 bg-[#080d10]/60 hover:bg-[#0d1415] text-xs font-mono text-[#839493] hover:text-[#dfe3e3] transition-all group ${
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
              <div className="shrink-0 flex items-center justify-between px-2.5 py-0.5 bg-[#05080a]/95 border-b border-[#1e2d37]/60 h-5 leading-none overflow-hidden select-none">
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

            {/* Navigation Items List */}
            <nav className="flex-1 divide-y divide-[#1e2d37]/80 bg-[#080d10]/40 overflow-y-auto overflow-x-hidden min-h-0">
              {navGroups.map((group, groupIdx) => {
                const isOpen = !!openGroups[group.id]
                const isGroupActive = group.items.some(
                  (item) =>
                    effectiveRoute === item.path ||
                    (item.path !== '/' && effectiveRoute.startsWith(item.path))
                )

                if (isCollapsed) {
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
                      className="w-full flex items-center justify-between px-3.5 py-2 bg-[#091014]/90 hover:bg-[#0e171d] border-b border-[#1e2d37]/50 text-left transition-colors duration-150 group/groupheader cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isGroupActive && !isOpen && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] shadow-[0_0_8px_rgba(255,59,48,0.9)] shrink-0 animate-pulse" />
                        )}
                        <span className="font-mono text-[10px] font-bold text-[#00c3ff]/80 group-hover/groupheader:text-[#00c3ff] tracking-wider uppercase truncate transition-colors duration-150">
                          {group.title}
                        </span>
                      </div>
                      <div className="flex items-center shrink-0 ml-2">
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform duration-200 ease-in-out ${
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
                      <div className="overflow-hidden divide-y divide-[#1e2d37]/40 bg-[#080d10]/40">
                        {group.items.map((item) => {
                          const Icon = item.icon
                          const isActive =
                            effectiveRoute === item.path ||
                            (item.path !== '/' && effectiveRoute.startsWith(item.path))

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleNavClick(item.path)}
                              className={`w-full text-left relative flex items-center transition-colors duration-150 group/navitem px-4 py-2.5 pl-5 gap-3 cursor-pointer ${
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

                              <div className="flex flex-col min-w-0 justify-center overflow-hidden whitespace-nowrap">
                                <span
                                  className={`text-xs md:text-[12.5px] font-sans font-medium tracking-wide uppercase leading-tight transition-colors duration-150 ${
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
              })}
            </nav>

          {/* Bottom Controls: Lobster + Combined Help & Profile/Auth */}
          <div className="mt-auto shrink-0 border-t border-[#1e2d37]/80 divide-y divide-[#1e2d37]/60">
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
                    <div className="bg-[#060a0b]/95 border border-[#00c3ff]/70 text-[#00c3ff] px-2 py-1 text-[10px] font-mono font-bold shadow-[0_0_12px_rgba(0,195,255,0.4)] whitespace-nowrap chamfer-corner flex items-center gap-1.5">
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

            {/* Combined Row: Help & Support (styled identical to sidebar nav items with blue tab) + User Avatar / Auth */}
            <div
              className={`flex items-center justify-between relative border-t border-[#1e2d37]/80 transition-colors duration-150 ${
                currentRoute === '/support'
                  ? 'bg-[#00c3ff]/10'
                  : 'bg-[#080d10]/40 hover:bg-white/[0.04]'
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
                    <div className="bg-[#060a0b]/95 border border-[#00c3ff]/70 text-[#dfe3e3] px-2.5 py-1.5 text-xs font-mono font-bold shadow-lg whitespace-nowrap flex items-center gap-2 chamfer-corner">
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
    </>
  )
}

