import React, { useState } from 'react'
import {
  BookOpen,
  FlaskConical,
  Coins,
  ShieldAlert,
  Sliders,
  Users,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react'

interface HUDSidebarProps {
  currentRoute: string
  onNavigate: (route: string) => void
}

export const HUDSidebar: React.FC<HUDSidebarProps> = ({
  currentRoute,
  onNavigate,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const navItems = [
    {
      id: 'lectures',
      label: 'THE MOLT-CYCLE LECTURES',
      icon: BookOpen,
      path: '/dashboard',
    },
    {
      id: 'science',
      label: 'MOLTOLOGY SCIENCE',
      icon: FlaskConical,
      path: '/pipeline',
    },
    {
      id: 'market',
      label: 'THE MARKET',
      sublabel: '(NEW / EXCHANGE)',
      icon: Coins,
      path: '/market',
      isNew: true,
    },
    {
      id: 'isolation',
      label: 'ISOLATION PROTOCOLS',
      icon: ShieldAlert,
      path: '/isolation',
    },
    {
      id: 'chassis',
      label: 'CHASSIS CONFIGURATOR',
      icon: Sliders,
      path: '/chassis',
    },
    {
      id: 'community',
      label: 'BENTHIC COMMUNITY CORE',
      icon: Users,
      path: '/community',
    },
  ]

  const activeItem = navItems.find(
    (item) =>
      currentRoute === item.path ||
      (item.path !== '/' && currentRoute.startsWith(item.path))
  ) || navItems[0]

  const handleNavClick = (path: string) => {
    onNavigate(path)
    setIsMobileOpen(false)
  }

  return (
    <aside className="w-full md:w-64 bg-[#070b0b] border-b md:border-b-0 md:border-r border-[#3a4a49] flex flex-col select-none p-3 gap-3 md:gap-6 relative z-30 shrink-0 md:overflow-y-auto">
      {/* Mobile Accordion Header Bar */}
      <div className="flex md:hidden items-center justify-between gap-2 p-1">
        <div 
          onClick={() => handleNavClick('/')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-7 h-7 rounded bg-[#171c1c] border border-[#ff0000] flex items-center justify-center p-0.5 shadow-md">
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
            <div className="text-[10px] text-[#00ffff] font-mono flex items-center gap-1">
              <span>ACTIVE:</span>
              <span className="text-[#ff5540] truncate max-w-[130px] font-bold">{activeItem.label}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="px-3 py-1.5 bg-[#0f1414] hover:bg-[#171c1c] border border-[#00ffff]/60 text-[#00ffff] font-mono font-bold text-xs flex items-center gap-1.5 chamfer-corner shadow-md active:scale-95 transition-all"
        >
          {isMobileOpen ? <X className="w-4 h-4 text-[#ff0000]" /> : <Menu className="w-4 h-4 text-[#00ffff]" />}
          <span>{isMobileOpen ? 'CLOSE' : 'HUD MENU'}</span>
        </button>
      </div>

      {/* Main Container - Desktop always visible, Mobile conditionally visible */}
      <div className={`space-y-4 ${isMobileOpen ? 'block' : 'hidden md:block'}`}>
        {/* Order Emblem Logo (Desktop View) */}
        <div 
          onClick={() => handleNavClick('/')}
          className="hidden md:flex items-center gap-3 p-2.5 bg-[#0f1414] border border-[#3a4a49] chamfer-corner cursor-pointer hover:border-[#ff0000] transition-colors group"
        >
          <div className="w-8 h-8 rounded bg-[#171c1c] border border-[#ff0000] flex items-center justify-center p-0.5 shadow-md">
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
            <div className="text-xs text-[#00ffff] font-mono">BENTHIC TEMPLE</div>
          </div>
        </div>

        {/* Navigation Items list */}
        <nav className="space-y-1.5 pt-1 md:pt-0">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              currentRoute === item.path ||
              (item.path !== '/' && currentRoute.startsWith(item.path))

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`w-full text-left px-3.5 py-3 md:py-2.5 font-mono text-xs flex items-center justify-between transition-all duration-150 border chamfer-corner min-h-[44px] md:min-h-0 ${
                  isActive
                    ? 'bg-[#171c1c] border-[#ff0000] text-[#ff5540] font-bold shadow-[0_0_8px_rgba(255,0,0,0.3)]'
                    : 'bg-[#0f1414] border-[#3a4a49] text-[#839493] hover:text-[#dfe3e3] hover:border-[#00ffff] hover:bg-[#171c1c]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#ff0000]' : 'text-[#839493]'
                    }`}
                  />
                  <span className="truncate text-xs tracking-wide">
                    {item.label}
                  </span>
                </div>
                {item.sublabel && (
                  <span className="text-xs text-[#ff5540] font-bold shrink-0 ml-1">
                    {item.sublabel}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
