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
  HelpCircle,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
} from 'lucide-react'
import { authClient } from '../../lib/auth-client'
import { AuthModal } from '../AuthModal'
import { BenthicCTAButton } from './BenthicCTAButton'
import { ChromaElement } from '../ui'

interface HUDSidebarProps {
  larvaId?: string
}

export const HUDSidebar: React.FC<HUDSidebarProps> = ({
  larvaId = 'LARVA UNIT #8971',
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const currentRoute = location.pathname
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

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate({ to: '/' })
  }

  const displayName = user?.name || user?.email?.split('@')[0] || larvaId

  const handleOpenCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'))
  }

  const navItems = [
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
      id: 'science',
      label: 'MOLTOLOGY SCIENCE',
      icon: Atom,
      path: '/pipeline',
    },
    {
      id: 'market',
      label: 'THE MARKET',
      icon: ShoppingCart,
      path: '/market',
    },
    {
      id: 'chassis',
      label: 'CHASSIS CONFIGURATOR',
      icon: Atom,
      path: '/chassis',
    },
    {
      id: 'isolation',
      label: 'ISOLATION PROTOCOLS',
      icon: ShieldAlert,
      path: '/isolation',
    },
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
  ]

  const activeItem =
    navItems.find(
      (item) =>
        currentRoute === item.path ||
        (item.path !== '/' && currentRoute.startsWith(item.path))
    ) || navItems[0]

  const handleNavClick = (path: string) => {
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
          isCollapsed ? 'md:w-[72px] md:p-2' : 'md:w-72 md:p-3.5'
        } h-auto md:h-full bg-[#060a0b]/70 backdrop-blur-md border-b md:border-b-0 md:border-r border-[#3a4a49]/65 flex flex-col select-none p-3.5 gap-3 relative z-30 shrink-0 shadow-2xl transition-all duration-300 ease-in-out group/sidebar`}
      >
        {/* Mobile Accordion Top Bar */}
        <div className="flex md:hidden items-center justify-between gap-2 p-1">
          <div
            onClick={() => handleNavClick('/')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <img
                src="/images/order_emblem.png"
                alt="Order Emblem"
                className="w-full h-full object-contain [image-rendering:pixelated]"
              />
            </div>
            <div>
              <div className="font-grotesk font-bold text-xs text-[#dfe3e3] tracking-wider">
                THE SYNAPTIC PATH
              </div>
              <div className="text-[10px] text-[#00c3ff] font-mono flex items-center gap-1">
                <span>ACTIVE:</span>
                <span className="text-[#ff5540] truncate max-w-[130px] font-bold">
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

        {/* Desktop Header Logo & Toggle Button */}
        <div
          className={`hidden md:flex items-center border border-[#3a4a49] chamfer-corner backdrop-blur-sm shrink-0 transition-all duration-300 relative group/brand ${
            isCollapsed
              ? 'flex-col p-2 gap-2 bg-[#0f1414]/70 justify-center'
              : 'justify-between p-2.5 bg-[#0f1414]/50 hover:border-[#ff453a]/60'
          }`}
        >
          <div
            onClick={() => handleNavClick('/')}
            className={`flex items-center gap-2.5 cursor-pointer group/logo ${
              isCollapsed ? 'justify-center w-full' : 'min-w-0'
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0 transition-transform group-hover/logo:scale-105">
              <img
                src="/images/order_emblem.png"
                alt="Order Emblem"
                className="w-full h-full object-contain [image-rendering:pixelated]"
              />
            </div>

            {!isCollapsed && (
              <div className="overflow-hidden whitespace-nowrap transition-all duration-300 min-w-0">
                <div className="font-grotesk font-bold text-xs text-[#dfe3e3] tracking-widest group-hover/logo:text-[#ff5540] transition-colors truncate">
                  THE SYNAPTIC PATH
                </div>
                <div className="text-[10px] text-[#00c3ff] font-mono tracking-wider truncate">
                  BENTHIC TEMPLE HUD
                </div>
              </div>
            )}
          </div>

          {/* Toggle Collapse Button */}
          <button
            onClick={toggleCollapse}
            className={`p-1.5 bg-[#030606]/80 hover:bg-[#00c3ff]/15 border border-[#3a4a49] hover:border-[#00c3ff] text-[#00c3ff] transition-all chamfer-corner active:scale-95 shrink-0 flex items-center justify-center shadow-md ${
              isCollapsed ? 'w-full py-1' : ''
            }`}
            title={isCollapsed ? 'Expand Sidebar (⌘B)' : 'Collapse Sidebar (⌘B)'}
          >
            {isCollapsed ? (
              <ChevronsRight className="w-4 h-4 text-[#00c3ff] animate-pulse" />
            ) : (
              <ChevronsLeft className="w-4 h-4 text-[#7a8e9e] hover:text-[#00c3ff]" />
            )}
          </button>

          {/* Brand Tooltip when collapsed */}
          {isCollapsed && (
            <div className="absolute left-full ml-3 top-2 z-50 pointer-events-none opacity-0 group-hover/brand:opacity-100 transition-all duration-200">
              <div className="bg-[#060a0b]/95 border border-[#00c3ff]/70 text-[#dfe3e3] px-2.5 py-1 text-xs font-mono font-bold shadow-[0_0_12px_rgba(0,195,255,0.4)] whitespace-nowrap chamfer-corner">
                <span className="text-[#00c3ff]">THE SYNAPTIC PATH</span>
                <span className="block text-[9px] text-[#7a8e9e] font-sans">BENTHIC TEMPLE HUD</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Container - Always visible on Desktop, toggling on Mobile */}
        <div
          className={`flex-1 flex flex-col justify-between space-y-4 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-6rem)] md:max-h-none ${
            isMobileOpen ? 'block' : 'hidden md:flex'
          }`}
        >
          <div className="space-y-3.5">
            {/* Navigation Items List */}
            <nav className="divide-y divide-[#1e2d37]/80 border-y border-[#1e2d37]/80 bg-[#080d10]/40 overflow-hidden">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  currentRoute === item.path ||
                  (item.path !== '/' && currentRoute.startsWith(item.path))

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full text-left relative flex items-center transition-all duration-150 group/navitem ${
                      isCollapsed
                        ? 'justify-center px-0 py-3'
                        : 'px-3.5 py-3 gap-3.5'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-[#ff3b30]/20 via-[#ff3b30]/06 to-transparent'
                        : 'bg-transparent hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* Active Red Vertical Accent Bar */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#ff3b30] shadow-[0_0_10px_rgba(255,59,48,0.8)]" />
                    )}

                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-[#ff5555]'
                          : 'text-[#7a8e9e] group-hover/navitem:text-[#dfe3e3]'
                      }`}
                    />

                    {!isCollapsed && (
                      <div className="flex flex-col min-w-0 justify-center overflow-hidden whitespace-nowrap transition-all duration-300">
                        <span
                          className={`text-xs md:text-[13px] font-sans font-medium tracking-wide uppercase leading-tight transition-colors ${
                            isActive
                              ? 'text-white font-semibold'
                              : 'text-[#9eb0c0] group-hover/navitem:text-[#dfe3e3]'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    )}

                    {/* Cybernetic Floating Tooltip when collapsed */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/navitem:opacity-100 transition-all duration-200 translate-x-1 group-hover/navitem:translate-x-0">
                        <div className="bg-[#060a0b]/95 border border-[#00c3ff]/70 text-[#dfe3e3] px-2.5 py-1.5 text-xs font-mono font-bold shadow-[0_0_15px_rgba(0,195,255,0.4)] whitespace-nowrap flex items-center gap-2 chamfer-corner">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00c3ff] shadow-[0_0_6px_#00c3ff]" />
                          <span className="tracking-wider uppercase">
                            {item.label}
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Bottom Visual: Biomechanical Wireframe Lobster Emblem matching reference */}
          <div className="pt-2 mt-auto shrink-0 px-2">
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
        </div>
      </aside>
    </>
  )
}

