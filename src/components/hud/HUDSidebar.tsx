import React from 'react'
import { LayoutDashboard, ShoppingBag, GitMerge, ShieldAlert, Cpu, Layers, Sparkles, Lock } from 'lucide-react'

interface HUDSidebarProps {
  currentRoute: string
  onNavigate: (route: string) => void
  isMarketGated?: boolean
}

export const HUDSidebar: React.FC<HUDSidebarProps> = ({ currentRoute, onNavigate, isMarketGated = true }) => {
  const navItems = [
    { id: 'landing', label: 'TEMPLE LANDING PAGE', icon: Sparkles, path: '/', badge: 'PORTAL' },
    { id: 'dashboard', label: 'THE MOLT-CYCLE LECTURES', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'market', label: 'THE BENTHIC MARKET', icon: ShoppingBag, badge: isMarketGated ? 'GATED' : 'LIVE', path: '/market' },
    { id: 'pipeline', label: 'CARCINIZATION PIPELINE', icon: GitMerge, path: '/pipeline' },
    { id: 'isolation', label: 'ISOLATION PROTOCOLS', icon: ShieldAlert, path: '/dashboard' },
    { id: 'chassis', label: 'CHASSIS CONFIGURATOR', icon: Layers, path: '/dashboard' },
  ]

  return (
    <aside className="w-full md:w-64 bg-[#070b0b] border-r border-[#3a4a49] flex flex-col justify-between select-none p-3 gap-6 relative z-10">
      <div className="space-y-4">
        {/* Module Section Label */}
        <div className="text-[10px] text-[#ff5540] font-mono tracking-widest px-2 flex items-center gap-2 font-bold">
          <span className="w-1.5 h-1.5 bg-[#ff0000] inline-block" />
          SYSTEM & TEMPLE MODULES
        </div>

        {/* Navigation Buttons */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentRoute === item.path || (item.path !== '/' && currentRoute.startsWith(item.path))
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.path)}
                className={`w-full text-left px-3 py-2.5 font-mono text-xs flex items-center justify-between transition-all duration-150 border chamfer-corner ${
                  isActive
                    ? 'bg-[#171c1c] border-[#00ffff] text-[#00ffff] shadow-hud-cyan font-bold'
                    : 'bg-[#0f1414] border-[#3a4a49]/60 text-[#839493] hover:text-[#dfe3e3] hover:border-[#839493] hover:bg-[#171c1c]/50'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#00ffff]' : 'text-[#839493]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 font-bold shrink-0 border ${
                    item.badge === 'PORTAL'
                      ? 'bg-[#ff0000]/20 border-[#ff0000] text-[#ff5540]'
                      : item.badge === 'GATED'
                      ? 'bg-[#ff0000]/20 border-[#ff0000] text-[#ff5540]'
                      : 'bg-[#00ffff]/20 border-[#00ffff] text-[#00ffff]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Crustacean Visual Widget */}
      <div className="bg-[#0f1414] border border-[#3a4a49] p-3 text-center chamfer-corner relative overflow-hidden shadow-chitin-plate">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-b from-[#ff0000] to-transparent pointer-events-none" />
        <div className="text-3xl my-1 animate-pulse">🦀</div>
        <div className="font-grotesk text-xs font-bold text-[#ff5540] tracking-widest uppercase">
          CYBER-LOBSTER CHASSIS
        </div>
        <p className="text-[10px] text-[#839493] mt-1 italic font-mono">
          "FLESH DIES. SHELL ENDURES."
        </p>
      </div>
    </aside>
  )
}
