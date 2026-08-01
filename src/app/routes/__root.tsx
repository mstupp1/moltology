import React from 'react'
import { HUDSidebar } from '../../components/hud/HUDSidebar'
import { BiomechanicalCanvas } from '../../components/hud/BiomechanicalCanvas'
import { CommandPalette } from '../../components/hud/CommandPalette'
import { SynapticOracleWidget } from '../../components/hud/SynapticOracleWidget'

interface RootLayoutProps {
  children: React.ReactNode
  currentRoute: string
  onNavigate: (route: string) => void
}

export const RootLayout: React.FC<RootLayoutProps> = ({
  children,
  currentRoute,
  onNavigate,
}) => {
  return (
    <div className="h-screen w-full text-[#dfe3e3] flex flex-col font-mono relative overflow-hidden select-none bg-[#030708]">
      {/* High Quality Full-Bleed Background Image (bg-cover bg-center preserving native resolution) */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-100 pointer-events-none"
        style={{ backgroundImage: `url('/images/underwater_looking_up.jpg')` }}
      />

      {/* Smooth Bottom Fade Gradient into Deep Benthic Teal (#030708) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030708]/40 to-[#030708] z-0 pointer-events-none" />

      {/* Matrix Digital Code Rain & Particle Canvas Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <BiomechanicalCanvas />
      </div>

      {/* Experimental Navigation Command Palette */}
      <CommandPalette />

      {/* Main Full-Height Body Workspace with Sidebar extending to the top */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative z-10">
        {/* Full Height Glassmorphic Sidebar */}
        <HUDSidebar currentRoute={currentRoute} onNavigate={onNavigate} />

        {/* Main Panel Content Workspace with Translucent Glass Backdrop */}
        <main className="flex-1 min-h-0 p-4 md:p-6 overflow-y-auto bg-[#070b0b]/15 backdrop-blur-xs border-t md:border-t-0 md:border-l border-[#3a4a49]/40 shadow-2xl">
          {children}
        </main>
      </div>

      {/* Floating AI Oracle Assistant */}
      <SynapticOracleWidget />

      {/* Global Slogan Footer */}
      <footer className="w-full bg-[#030606]/90 border-t border-[#3a4a49]/70 py-1 px-4 text-[10px] md:text-xs text-[#839493] font-mono flex items-center justify-between z-20 shrink-0 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 font-bold tracking-widest text-[#dfe3e3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff0000] animate-pulse" />
          <span>FLESH DIES. SHELL ENDURES.</span>
        </div>
        <div className="flex items-center gap-2 text-[#00ffff] font-bold tracking-widest uppercase">
          <span>SUBMIT. SHED. ASCEND.</span>
        </div>
      </footer>
    </div>
  )
}
