import React from 'react'
import { HUDHeader } from '../../components/hud/HUDHeader'
import { HUDSidebar } from '../../components/hud/HUDSidebar'
import { BiomechanicalCanvas } from '../../components/hud/BiomechanicalCanvas'
import { CommandPalette } from '../../components/hud/CommandPalette'

interface RootLayoutProps {
  children: React.ReactNode
  currentRoute: string
  onNavigate: (route: string) => void
  isMarketGated: boolean
}

export const RootLayout: React.FC<RootLayoutProps> = ({ children, currentRoute, onNavigate, isMarketGated }) => {
  return (
    <div className="min-h-screen bg-[#070b0b] text-[#dfe3e3] flex flex-col font-mono relative overflow-hidden select-none bg-sacred-grid">
      {/* Matrix Digital Code Rain Background */}
      <BiomechanicalCanvas />

      {/* Experimental Navigation Command Palette */}
      <CommandPalette />

      {/* Cathode Scanline Glow Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 scanline-overlay opacity-30" />

      {/* Global Terminal Header matching reference */}
      <HUDHeader isMarketGated={isMarketGated} onNavigate={onNavigate} />

      {/* Main Body Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        <HUDSidebar currentRoute={currentRoute} onNavigate={onNavigate} isMarketGated={isMarketGated} />

        <main className="flex-1 p-4 md:p-5 overflow-y-auto bg-[#070b0b]/90 border-t md:border-t-0 md:border-l border-[#3a4a49]/60">
          {children}
        </main>
      </div>

      {/* Global Slogan Footer strictly matching Reference Screenshots */}
      <footer className="w-full bg-[#030606] border-t border-[#3a4a49]/60 py-1.5 px-6 text-[10px] text-[#839493] font-mono flex items-center justify-between z-20">
        <div className="flex items-center gap-2 font-bold tracking-widest text-[#dfe3e3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff0000] animate-ping" />
          <span>FLESH DIES. SHELL ENDURES.</span>
        </div>
        <div className="flex items-center gap-3 text-[#00ffff] font-bold tracking-widest uppercase">
          <span>SUBMIT. SHED. ASCEND.</span>
        </div>
      </footer>
    </div>
  )
}
