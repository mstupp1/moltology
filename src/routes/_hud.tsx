import React, { useState, useEffect } from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { HUDHeader } from '@/components/hud/HUDHeader'
import { HUDSidebar } from '@/components/hud/HUDSidebar'
import { CommandPalette } from '@/components/hud/CommandPalette'
import { SynapticOracleWidget } from '@/components/hud/SynapticOracleWidget'
import { AISidebarDrawer } from '@/components/hud/AISidebarDrawer'
import { OracleProvider, useSafeOracle } from '@/components/hud/OracleContext'
import { authClient } from '@/lib/auth-client'

function HudContent() {
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false)
  const oracle = useSafeOracle()
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const userId = user?.id || user?.sub || null

  useEffect(() => {
    const handleToggle = () => {
      if (oracle) {
        oracle.toggleMode('sidebar')
      } else {
        setIsAIDrawerOpen((prev) => !prev)
      }
    }
    window.addEventListener('toggle-ai-drawer', handleToggle)
    return () => window.removeEventListener('toggle-ai-drawer', handleToggle)
  }, [oracle])

  return (
    <div className="h-screen w-full text-[#dfe3e3] flex flex-col font-mono relative overflow-hidden select-none bg-[#030708]">
      {/* Full-Bleed Underwater Background Image with high visibility */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-80 pointer-events-none"
        style={{ backgroundImage: `url('/images/underwater_looking_up.jpg')` }}
      />

      {/* Sacred Grid Overlay */}
      <div className="absolute inset-0 bg-sacred-grid opacity-40 z-0 pointer-events-none" />

      {/* Pro Micro-Grain Noise Texture */}
      <div className="absolute inset-0 bg-pro-noise opacity-60 z-0 pointer-events-none" />

      {/* Deep Benthic Blue Pro Vignette & Top Ambient Lighting Overlay */}
      <div className="absolute inset-0 bg-benthic-vignette z-0 pointer-events-none" />

      {/* Smooth Bottom Fade Gradient into Deep Benthic Teal (#030708) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030708]/80 z-0 pointer-events-none" />

      {/* Matrix Digital Code Rain & Particle Canvas Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" />

      {/* Experimental Navigation Command Palette */}
      <CommandPalette />

      {/* Main Full-Height Layout with Sidebar extending to the top of screen */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative z-10">
        {/* Full Height Glassmorphic Sidebar spanning top-to-bottom */}
        <HUDSidebar />

        {/* Workspace Column & Optional Right AI Drawer */}
        <div className="flex-1 min-w-0 flex h-full overflow-hidden">
          {/* Main Workspace */}
          <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
            {/* Portal Top Bar */}
            <HUDHeader />

            {/* Main Panel Content Workspace with Translucent Glass Backdrop */}
            <main className="flex-1 min-h-0 p-4 md:p-6 overflow-y-auto bg-[#070b0b]/35 backdrop-blur-sm border-t md:border-t-0 md:border-l border-[#3a4a49]/40 shadow-2xl">
              <Outlet />
            </main>
          </div>

          {/* Right-Hand Dockable AI Sidebar Drawer */}
          <AISidebarDrawer
            isOpen={isAIDrawerOpen}
            onClose={() => setIsAIDrawerOpen(false)}
            userId={userId}
          />
        </div>
      </div>

      {/* Floating AI Oracle Assistant */}
      <SynapticOracleWidget userId={userId} />
    </div>
  )
}

function HudLayout() {
  return (
    <OracleProvider>
      <HudContent />
    </OracleProvider>
  )
}

export const Route = createFileRoute('/_hud')({
  component: HudLayout,
})
