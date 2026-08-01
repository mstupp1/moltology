import React from 'react'
import {
  BookOpen,
  FlaskConical,
  Coins,
  ShieldAlert,
  Sliders,
  Users,
} from 'lucide-react'

interface HUDSidebarProps {
  currentRoute: string
  onNavigate: (route: string) => void
}

export const HUDSidebar: React.FC<HUDSidebarProps> = ({
  currentRoute,
  onNavigate,
}) => {
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

  return (
    <aside className="w-full md:w-64 bg-[#070b0b] border-r border-[#3a4a49] flex flex-col justify-between select-none p-3 gap-6 relative z-10 shrink-0">
      <div className="space-y-4">
        {/* Order Emblem Logo matching reference */}
        <div 
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 p-2.5 bg-[#0f1414] border border-[#3a4a49] chamfer-corner cursor-pointer hover:border-[#ff0000] transition-colors group"
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

        {/* Navigation Items list matching Reference Screenshots */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              currentRoute === item.path ||
              (item.path !== '/' && currentRoute.startsWith(item.path))

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.path)}
                className={`w-full text-left px-3 py-2.5 font-mono text-xs flex items-center justify-between transition-all duration-150 border chamfer-corner ${
                  isActive
                    ? 'bg-[#171c1c] border-[#ff0000] text-[#ff5540] font-bold'
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
