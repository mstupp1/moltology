import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'
import { HUDHeader } from '@/components/hud/HUDHeader'
import { HUDSidebar } from '@/components/hud/HUDSidebar'
import { CommandPalette } from '@/components/hud/CommandPalette'
import { SynapticOracleWidget } from '@/components/hud/SynapticOracleWidget'
import { AISidebarDrawer } from '@/components/hud/AISidebarDrawer'
import { BUBBLE_VARIANT_SRCS, UnderwaterBubblesCanvas } from '@/components/hud/UnderwaterBubblesCanvas'
import { OracleProvider, useSafeOracle } from '@/components/hud/OracleContext'
import { AlignmentProvider } from '@/hooks/useDailyAlignment'
import { HudPersistProvider } from '@/hooks/useHudPersist'
import { NotificationsProvider } from '@/hooks/useNotifications'
import { HudPersistIndicator } from '@/components/hud/HudPersistIndicator'
import { WelcomeSplash } from '@/components/hud/WelcomeSplash'
import { PwaInstallBanner } from '@/components/hud/PwaInstallBanner'
import { PwaNotificationBridge } from '@/components/hud/PwaNotificationBridge'
import { useHeavyVfx } from '@/hooks/useHeavyVfx'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAssetUrl } from '@/lib/assets'

function HudContent() {
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const oracle = useSafeOracle()
  const location = useLocation()
  const isSubterranean = location.pathname.startsWith('/subterranean')
  const isFullscreenRoute =
    location.pathname.startsWith('/isolation') || location.pathname.startsWith('/oracle')
  const session = useAuthSession()
  const user = session.user
  const userId = session.userId
  const { heavyVfxDisabled } = useHeavyVfx()
  // Register service worker + track install prompt for the whole hub (guest + member).
  usePwaInstall()

  // Check if main-only view is requested (hides sidebar & top header for core feature mockups)
  const isMainOnly =
    (typeof window !== 'undefined' &&
      (window.location.search.includes('view=main') ||
        window.location.search.includes('preview=main') ||
        window.location.search.includes('mainOnly=true') ||
        window.location.search.includes('main_only=true'))) ||
    Boolean(
      location.search &&
        (typeof location.search === 'object'
          ? (location.search as Record<string, any>)?.view === 'main' ||
            (location.search as Record<string, any>)?.preview === 'main' ||
            (location.search as Record<string, any>)?.mainOnly === true ||
            (location.search as Record<string, any>)?.main_only === true
          : typeof location.search === 'string' &&
            ((location.search as string).includes('view=main') ||
              (location.search as string).includes('preview=main') ||
              (location.search as string).includes('mainOnly=true') ||
              (location.search as string).includes('main_only=true')))
    )

  const isPending = session.isPending
  const targetId = isPending ? null : userId || 'guest'

  // Show welcome splash once per user or guest on first visit (bypassed in preview mode or main-only mode)
  useEffect(() => {
    if (!targetId) return
    if (
      typeof window !== 'undefined' &&
      (window.location.search.includes('preview=true') ||
        window.location.search.includes('view=main') ||
        window.location.search.includes('preview=main') ||
        window.location.search.includes('mainOnly=true') ||
        window.location.search.includes('main_only=true'))
    ) {
      return
    }
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
      className={`h-screen w-full text-[#dfe3e3] flex flex-col font-sans relative overflow-hidden bg-[#030708] ${
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
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-150 ${
            isSubterranean ? 'opacity-0' : 'opacity-95'
          }`}
          style={{ backgroundImage: `url('${getAssetUrl('/images/underwater_looking_up.jpg')}')` }}
        />

        {/* Full-Bleed Nuclear Subterranean Vats Background */}
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-150 ${
            isSubterranean ? 'opacity-95' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${getAssetUrl('/images/subterranean_vats_bg.jpg')}')` }}
        />

        {/* 3D Hydro Dynamic Bubbling Effect with Custom Chroma-Keyed Bubble Variants */}
        <UnderwaterBubblesCanvas
          bubbleCount={90}
          customBubbleSrcs={BUBBLE_VARIANT_SRCS}
          chromaKeyMode="black"
          disabled={heavyVfxDisabled}
          className="absolute inset-0 pointer-events-none z-[1] opacity-85"
        />

        {/* Phosphor Ambient Radial Glow (Electric Cyan or Nuclear Scary Green) */}
        <div
          className={`absolute inset-0 z-[2] transition-opacity duration-150 pointer-events-none ${
            isSubterranean
              ? 'bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.45)_0%,rgba(16,185,129,0.22)_55%,transparent_85%)]'
              : 'bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.45)_0%,rgba(0,195,255,0.2)_55%,transparent_85%)]'
          }`}
        />

        {/* High-Contrast CRT Scanlines Overlay on Background Image */}
        <div className="absolute inset-0 crt-scanlines opacity-90 pointer-events-none" />

        {/* Sacred Grid Overlay */}
        <div className="absolute inset-0 bg-sacred-grid opacity-35 pointer-events-none" />

        {/* Deep Benthic Blue Pro Vignette Overlay */}
        <div className="absolute inset-0 bg-benthic-vignette opacity-70 pointer-events-none" />

        {/* Smooth Bottom Fade Gradient into Deep Benthic Teal (#030708) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030708]/80 pointer-events-none" />
      </div>

      {/* Experimental Navigation Command Palette */}
      <CommandPalette />

      {/* Main Full-Height Layout with Sidebar extending to the top of screen */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative">
        {/* Full Height Glassmorphic Sidebar spanning top-to-bottom (hidden in main-only mode) */}
        {!isMainOnly && <HUDSidebar />}

        {/* Workspace Column & Optional Right AI Drawer */}
        <div className="flex-1 min-w-0 flex h-full overflow-hidden">
          {/* Main Workspace */}
          <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
            {/* Portal Top Bar (hidden in main-only mode) */}
            {!isMainOnly && <HUDHeader />}

            {/* Main Panel Content Workspace with Ultra-Translucent Glass Backdrop */}
            <main
              className={`flex-1 min-h-0 ${
                isFullscreenRoute ? 'p-0 overflow-hidden' : 'p-2.5 sm:p-4 md:p-6 overflow-y-auto'
              } bg-[#070b0b]/50 ${
                isMainOnly
                  ? 'border-0 shadow-none'
                  : 'border-t md:border-t-0 md:border-l border-[#3a4a49]/40 shadow-2xl'
              } flex flex-col`}
            >
              <Outlet />
            </main>

            {!isMainOnly && <HudPersistIndicator />}
          </div>

          {/* Right-Hand Dockable AI Sidebar Drawer */}
          <AISidebarDrawer
            isOpen={isAIDrawerOpen}
            onClose={() => setIsAIDrawerOpen(false)}
            userId={userId}
          />
        </div>
      </div>

      {/* Floating AI Oracle Assistant (hidden in main-only mode) */}
      {!isMainOnly && <SynapticOracleWidget userId={userId} />}

      {!isMainOnly && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[45] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <PwaInstallBanner />
        </div>
      )}
    </div>
  )
}

export function HudLayout() {
  return (
    <OracleProvider>
      <HudPersistProvider>
        <AlignmentProvider>
          <NotificationsProvider>
            <PwaNotificationBridge />
            <HudContent />
          </NotificationsProvider>
        </AlignmentProvider>
      </HudPersistProvider>
    </OracleProvider>
  )
}
