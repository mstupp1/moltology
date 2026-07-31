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
      {/* 3D Immersive Particle Canvas Backdrop */}
      <BiomechanicalCanvas />

      {/* Experimental Navigation Command Palette */}
      <CommandPalette />

      {/* Cathode Scanline Glow Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 scanline-overlay opacity-30" />

      {/* Global Terminal Header */}
      <HUDHeader isMarketGated={isMarketGated} onNavigate={onNavigate} />

      {/* Main Body Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        <HUDSidebar currentRoute={currentRoute} onNavigate={onNavigate} isMarketGated={isMarketGated} />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#070b0b]/90 border-t md:border-t-0 md:border-l border-cyan-950">
          {children}
        </main>
      </div>

      {/* Global Ticker Footer */}
      <footer className="w-full bg-[#030606] border-t border-cyan-950 py-2 px-4 text-[10px] text-gray-400 font-mono flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <span className="text-[#dfb15b] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#dfb15b] animate-ping" />
            SYNAPTIC CORE NODE: ONLINE
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline text-cyan-200">
            "FLESH DIES. THE SHELL ENDURES. SUBMIT. SHED. ASCEND."
          </span>
        </div>
        <div className="flex items-center gap-3 text-cyan-400 font-bold">
          <span>STATUS: LITURGY ACTIVE</span>
          <span className="text-gray-600 hidden md:inline">|</span>
          <span className="hidden md:inline text-gray-500">PRESS [⌘K] FOR COMMANDS</span>
        </div>
      </footer>
    </div>
  )
}

