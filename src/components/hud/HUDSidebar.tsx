import React, { useState } from 'react'
import {
  BookOpen,
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
} from 'lucide-react'
import { authClient } from '../../lib/auth-client'
import { AuthModal } from '../AuthModal'
import { BenthicCTAButton } from './BenthicCTAButton'

interface HUDSidebarProps {
  currentRoute: string
  onNavigate: (route: string) => void
  larvaId?: string
}

export const HUDSidebar: React.FC<HUDSidebarProps> = ({
  currentRoute,
  onNavigate,
  larvaId = 'LARVA UNIT #8971',
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user

  const handleSignOut = async () => {
    await authClient.signOut()
    onNavigate('/')
  }

  const displayName = user?.name || user?.email?.split('@')[0] || larvaId

  const handleOpenCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'))
  }

  const navItems = [
    {
      id: 'lectures',
      label: 'MOLT-CYCLE LECTURES',
      icon: BookOpen,
      path: '/dashboard',
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
    onNavigate(path)
    setIsMobileOpen(false)
  }

  return (
    <>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => onNavigate('/dashboard')}
      />

      <aside className="w-full md:w-72 h-auto md:h-full bg-[#070b0b]/45 backdrop-blur-md border-b md:border-b-0 md:border-r border-[#3a4a49]/60 flex flex-col select-none p-3.5 gap-3 relative z-30 shrink-0 md:overflow-y-auto shadow-2xl">
        {/* Mobile Accordion Top Bar */}
        <div className="flex md:hidden items-center justify-between gap-2 p-1">
          <div
            onClick={() => handleNavClick('/')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-7 h-7 rounded bg-[#171c1c] border border-[#ff453a] flex items-center justify-center p-0.5 shadow-md">
              <img
                src="/images/order_emblem.png"
                alt="Order Emblem"
                className="w-full h-full object-contain"
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

        {/* Desktop Header Logo */}
        <div
          onClick={() => handleNavClick('/')}
          className="hidden md:flex items-center gap-3 p-2.5 bg-[#0f1414]/50 border border-[#3a4a49] chamfer-corner cursor-pointer hover:border-[#ff453a] transition-colors group backdrop-blur-sm shrink-0"
        >
          <div className="w-8 h-8 rounded bg-[#171c1c] border border-[#ff453a] flex items-center justify-center p-0.5 shadow-[0_0_8px_rgba(255,69,58,0.4)]">
            <img
              src="/images/order_emblem.png"
              alt="Order Emblem"
              className="w-full h-full object-contain group-hover:scale-110 transition-transform"
            />
          </div>
          <div>
            <div className="font-grotesk font-bold text-xs text-[#dfe3e3] tracking-widest group-hover:text-[#ff5540] transition-colors">
              THE SYNAPTIC PATH
            </div>
            <div className="text-[10px] text-[#00c3ff] font-mono tracking-wider">
              BENTHIC TEMPLE HUD
            </div>
          </div>
        </div>

        {/* Main Content Container - Always visible on Desktop, toggling on Mobile */}
        <div
          className={`flex-1 flex flex-col justify-between space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto md:max-h-none ${
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
                    className={`w-full text-left px-3.5 py-3 relative flex items-center gap-3.5 transition-all duration-150 group ${
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
                        isActive ? 'text-[#ff5555]' : 'text-[#7a8e9e] group-hover:text-[#dfe3e3]'
                      }`}
                    />

                    <div className="flex flex-col min-w-0 justify-center">
                      <span
                        className={`text-xs md:text-[13px] font-sans font-medium tracking-wide uppercase leading-tight transition-colors ${
                          isActive ? 'text-white font-semibold' : 'text-[#9eb0c0] group-hover:text-[#dfe3e3]'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Bottom Visual: Biomechanical Wireframe Lobster Emblem matching reference */}
          <div className="pt-2 border-t border-[#3a4a49]/40 space-y-2 shrink-0">
            <div className="w-full aspect-square max-h-44 rounded bg-[#030606]/60 border border-[#00c3ff]/30 overflow-hidden relative group p-1 flex items-center justify-center">
              <img
                src="/images/benthic_lobster_sidebar.jpg"
                alt="Benthic Lobster"
                className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(0,195,255,0.4)] group-hover:scale-105 transition-transform"
              />
              <div className="absolute bottom-1 right-2 text-[9px] font-mono text-[#00c3ff]/70 bg-[#030606]/80 px-1 border border-[#00c3ff]/30">
                CARAPACE v4.2
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
