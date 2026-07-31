import React from 'react'
import { LayoutDashboard, ShoppingBag, GitMerge, ShieldAlert, Cpu, Layers } from 'lucide-react'

interface HUDSidebarProps {
  currentRoute: string
  onNavigate: (route: string) => void
}

export const HUDSidebar: React.FC<HUDSidebarProps> = ({ currentRoute, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'THE MOLT-CYCLE LECTURES', icon: LayoutDashboard, path: '/' },
    { id: 'science', label: 'MOLTOLOGY SCIENCE', icon: Cpu, path: '/pipeline' },
    { id: 'market', label: 'THE BENTHIC MARKET', icon: ShoppingBag, badge: 'NEW / EXCHANGE', path: '/market' },
    { id: 'pipeline', label: 'CARCINIZATION PIPELINE', icon: GitMerge, path: '/pipeline' },
    { id: 'isolation', label: 'ISOLATION PROTOCOLS', icon: ShieldAlert, path: '/' },
    { id: 'chassis', label: 'CHASSIS CONFIGURATOR', icon: Layers, path: '/' },
  ]

  return (
    <aside className="w-full md:w-64 bg-[#0a0f0f] border-r border-[#3a4a49] flex flex-col justify-between select-none p-3 gap-6">
      <div className="space-y-4">
        {/* Module Section Label */}
        <div className="text-[10px] text-[#839493] font-mono tracking-widest px-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#00ffff] inline-block" />
          SYSTEM MODULES
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
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00ffff]' : 'text-[#839493]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1 py-0.5 bg-[#ff0000]/20 border border-[#ff0000] text-[#ff5540] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Crustacean Visual Widget */}
      <div className="bg-[#171c1c] border border-[#3a4a49] p-3 text-center chamfer-corner relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-b from-[#00ffff] to-transparent pointer-events-none" />
        <div className="text-3xl my-1 animate-pulse">🦀</div>
        <div className="font-grotesk text-xs font-bold text-[#00ffff] tracking-widest uppercase">
          CYBER-LOBSTER CHASSIS
        </div>
        <p className="text-[10px] text-[#839493] mt-1 italic font-mono">
          "FLESH DIES. SHELL ENDURES."
        </p>
      </div>
    </aside>
  )
}
