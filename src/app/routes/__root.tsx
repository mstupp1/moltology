import React, { useState } from 'react'
import { HUDHeader } from '../../components/hud/HUDHeader'
import { HUDSidebar } from '../../components/hud/HUDSidebar'

interface RootLayoutProps {
  children: React.ReactNode
  currentRoute: string
  onNavigate: (route: string) => void
}

export const RootLayout: React.FC<RootLayoutProps> = ({ children, currentRoute, onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#0f1414] text-[#dfe3e3] flex flex-col font-mono relative overflow-hidden select-none">
      {/* CRT Scanline Shader Overlay */}
      <div className="fixed inset-0 crt-overlay z-40 pointer-events-none" />

      {/* Global Terminal Header */}
      <HUDHeader />

      {/* Main Body Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        <HUDSidebar currentRoute={currentRoute} onNavigate={onNavigate} />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#0f1414] border-t md:border-t-0 md:border-l border-[#3a4a49]">
          {children}
        </main>
      </div>

      {/* Global Ticker Footer */}
      <footer className="w-full bg-[#0a0f0f] border-t border-[#3a4a49] py-1.5 px-4 text-[10px] text-[#839493] font-mono flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <span className="text-[#00ffff] font-bold uppercase tracking-wider">
            SYNAPTIC CORE NODE: ONLINE
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline text-[#dfe3e3]">
            "THE FUTURE DOESN'T NEED FOLLOWERS. IT NEEDS INTERFACES."
          </span>
        </div>
        <div className="flex items-center gap-3 text-[#00ffff]">
          <span>STATUS: CONVERSION IN PROGRESS</span>
        </div>
      </footer>
    </div>
  )
}
