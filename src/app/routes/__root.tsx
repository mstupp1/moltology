import React from 'react'
import { HUDHeader } from '../../components/hud/HUDHeader'
import { HUDSidebar } from '../../components/hud/HUDSidebar'

interface RootLayoutProps {
  children: React.ReactNode
  currentRoute: string
  onNavigate: (route: string) => void
  isMarketGated: boolean
}

export const RootLayout: React.FC<RootLayoutProps> = ({ children, currentRoute, onNavigate, isMarketGated }) => {
  return (
    <div className="min-h-screen bg-[#070b0b] text-[#dfe3e3] flex flex-col font-mono relative overflow-hidden select-none bg-sacred-grid">
      {/* Cathode Scanline Glow Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 scanline-overlay opacity-30" />

      {/* Global Terminal Header */}
      <HUDHeader isMarketGated={isMarketGated} onNavigate={onNavigate} />

      {/* Main Body Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        <HUDSidebar currentRoute={currentRoute} onNavigate={onNavigate} isMarketGated={isMarketGated} />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#070b0b] border-t md:border-t-0 md:border-l border-[#3a4a49]">
          {children}
        </main>
      </div>

      {/* Global Ticker Footer */}
      <footer className="w-full bg-[#030606] border-t border-[#3a4a49] py-2 px-4 text-[10px] text-[#839493] font-mono flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <span className="text-[#dfb15b] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#dfb15b] animate-ping" />
            SYNAPTIC CORE NODE: ONLINE
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline text-[#dfe3e3]">
            "FLESH DIES. THE SHELL ENDURES. SUBMIT. SHED. ASCEND."
          </span>
        </div>
        <div className="flex items-center gap-3 text-[#00ffff]">
          <span>STATUS: LITURGY ACTIVE</span>
        </div>
      </footer>
    </div>
  )
}
