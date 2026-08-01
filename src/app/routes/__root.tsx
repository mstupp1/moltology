import React from 'react'
import { HUDHeader } from '../../components/hud/HUDHeader'
import { HUDSidebar } from '../../components/hud/HUDSidebar'
import { BiomechanicalCanvas } from '../../components/hud/BiomechanicalCanvas'
import { CommandPalette } from '../../components/hud/CommandPalette'
import { SynapticOracleWidget } from '../../components/hud/SynapticOracleWidget'

interface RootLayoutProps {
  children: React.ReactNode
  currentRoute: string
  onNavigate: (route: string) => void
}

export const RootLayout: React.FC<RootLayoutProps> = ({ children, currentRoute, onNavigate }) => {
  return (
    <div className="h-screen w-full bg-[#070b0b] text-[#dfe3e3] flex flex-col font-mono relative overflow-hidden select-none bg-sacred-grid">
      {/* Matrix Digital Code Rain Background */}
      <BiomechanicalCanvas />

      {/* Experimental Navigation Command Palette */}
      <CommandPalette />

      {/* Global Terminal Header matching reference */}
      <HUDHeader onNavigate={onNavigate} />

      {/* Main Body Workspace */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative z-10">
        <HUDSidebar currentRoute={currentRoute} onNavigate={onNavigate} />

        <main className="flex-1 min-h-0 p-4 md:p-5 overflow-y-auto bg-[#070b0b] border-t md:border-t-0 md:border-l border-[#3a4a49]">
          {children}
        </main>
      </div>

      {/* Floating AI Oracle Assistant */}
      <SynapticOracleWidget />

      {/* Global Slogan Footer */}
      <footer className="w-full bg-[#030606] border-t border-[#3a4a49] py-1 px-4 text-[10px] md:text-xs text-[#839493] font-mono flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-1.5 font-bold tracking-widest text-[#dfe3e3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff0000]" />
          <span>FLESH DIES. SHELL ENDURES.</span>
        </div>
        <div className="flex items-center gap-2 text-[#00ffff] font-bold tracking-widest uppercase">
          <span>SUBMIT. SHED. ASCEND.</span>
        </div>
      </footer>
    </div>
  )
}
