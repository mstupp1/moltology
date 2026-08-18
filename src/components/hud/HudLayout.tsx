import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'
import { HUDHeader } from '@/components/hud/HUDHeader'
import { HUDSidebar } from '@/components/hud/HUDSidebar'
import { CommandPalette } from '@/components/hud/CommandPalette'
import { SynapticOracleWidget } from '@/components/hud/SynapticOracleWidget'
import { AISidebarDrawer } from '@/components/hud/AISidebarDrawer'
import { UnderwaterBubblesCanvas } from '@/components/hud/UnderwaterBubblesCanvas'
import { OracleProvider, useSafeOracle } from '@/components/hud/OracleContext'
import { authClient } from '@/lib/auth-client'
import { WelcomeSplash } from '@/components/hud/WelcomeSplash'
import { useHeavyVfx } from '@/hooks/useHeavyVfx'
import { getAssetUrl } from '@/lib/assets'

function HudContent() {
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const oracle = useSafeOracle()
  const location = useLocation()
  const isSubterranean = location.pathname.startsWith('/subterranean')
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const userId = user?.id || user?.sub || null
  const { heavyVfxDisabled } = useHeavyVfx()

  const isPending = sessionRes?.isPending
  const targetId = isPending ? null : userId || 'guest'

  // Show welcome splash once per user or guest on first visit
  useEffect(() => {
    if (!targetId) return
    const key = `moltology:welcomed:${targetId}`
    if (!localStorage.getItem(key)) {
      setShowWelcome(true)
    }
  }, [targetId])

  const handleDismissWelcome = () => {
    const activeId = userId || 'guest'
    localStorage.setItem(`moltology:welcomed:${activeId}`, '1')
    setShowWelcome(false)
  }

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

  // Replay Initiation Broadcast (lobster click) — relaunch welcome splash
  useEffect(() => {
    const handleRelaunch = () => setShowWelcome(true)
    window.addEventListener('launch-welcome-splash', handleRelaunch)
    return () => window.removeEventListener('launch-welcome-splash', handleRelaunch)
  }, [])

  // Preload background images so transitions happen instantly without network delay
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const img1 = new Image()
      img1.src = getAssetUrl('/images/subterranean_vats_bg.jpg')
      const img2 = new Image()
      img2.src = getAssetUrl('/images/underwater_looking_up.jpg')
    }
  }, [])

  return (
    <div
      className={`h-screen w-full text-[#dfe3e3] flex flex-col font-mono relative overflow-hidden bg-[#030708] ${
        isSubterranean ? 'theme-subterranean' : ''
      }`}
    >
      {/* First-time welcome splash */}
      {showWelcome && (
        <WelcomeSplash
          userName={user?.name || user?.email || 'Guest'}
          onDismiss={handleDismissWelcome}
        />
      )}
      {/* Dedicated Portal CRT Screen Background (Behind UI) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#030708]">
        {/* Full-Bleed Default Aqua Underwater Background */}
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat mix-blend-screen filter drop-shadow-[0_0_45px_rgba(0,255,255,0.65)] transition-opacity duration-150 ${
            isSubterranean ? 'opacity-0' : 'opacity-95'
          }`}
          style={{ backgroundImage: `url('${getAssetUrl('/images/underwater_looking_up.jpg')}')` }}
        />

        {/* Full-Bleed Nuclear Subterranean Vats Background */}
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat mix-blend-screen filter drop-shadow-[0_0_55px_rgba(57,255,20,0.8)] transition-opacity duration-150 ${
            isSubterranean ? 'opacity-95' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${getAssetUrl('/images/subterranean_vats_bg.jpg')}')` }}
        />

        {/* 3D Hydro Dynamic Bubbling Effect with Custom Chroma-Keyed Bubble Variants */}
        <UnderwaterBubblesCanvas
          bubbleCount={90}
          customBubbleSrcs={[
            '/images/bubble_variant_1.jpg',
            '/images/bubble_variant_2.jpg',
            '/images/bubble_variant_3.jpg',
          ]}
          chromaKeyMode="black"
          disabled={heavyVfxDisabled}
          className="absolute inset-0 pointer-events-none z-[1] opacity-85"
        />

        {/* Phosphor Ambient Radial Glow (Electric Cyan or Nuclear Scary Green) */}
        <div
          className={`absolute inset-0 z-[2] transition-opacity duration-150 ${
            isSubterranean
              ? 'bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.45)_0%,rgba(16,185,129,0.22)_55%,transparent_85%)]'
              : 'bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.45)_0%,rgba(0,195,255,0.2)_55%,transparent_85%)]'
          }`}
        />

        {/* High-Contrast CRT Scanlines Overlay on Background Image */}
        <div className="absolute inset-0 crt-scanlines opacity-90" />

        {/* Micro-Grain Noise Texture on Background Image */}
        <div className="absolute inset-0 crt-grain opacity-75 mix-blend-overlay" />

        {/* Sacred Grid Overlay */}
        <div className="absolute inset-0 bg-sacred-grid opacity-35" />

        {/* Deep Benthic Blue Pro Vignette Overlay */}
        <div className="absolute inset-0 bg-benthic-vignette opacity-70" />

        {/* Smooth Bottom Fade Gradient into Deep Benthic Teal (#030708) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030708]/80" />
      </div>

      {/* Experimental Navigation Command Palette */}
      <CommandPalette />

      {/* Main Full-Height Layout with Sidebar extending to the top of screen */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative">
        {/* Full Height Glassmorphic Sidebar spanning top-to-bottom */}
        <HUDSidebar />

        {/* Workspace Column & Optional Right AI Drawer */}
        <div className="flex-1 min-w-0 flex h-full overflow-hidden">
          {/* Main Workspace */}
          <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
            {/* Portal Top Bar */}
            <HUDHeader />

            {/* Main Panel Content Workspace with Ultra-Translucent Glass Backdrop */}
            <main className="flex-1 min-h-0 p-4 md:p-6 overflow-y-auto bg-[#070b0b]/10 backdrop-blur-[1px] border-t md:border-t-0 md:border-l border-[#3a4a49]/40 shadow-2xl">
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

export function HudLayout() {
  return (
    <OracleProvider>
      <HudContent />
    </OracleProvider>
  )
}
