import React, { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'
import { HUDSidebar } from '@/components/hud/HUDSidebar'
import { CommandPalette } from '@/components/hud/CommandPalette'
import { SynapticOracleWidget } from '@/components/hud/SynapticOracleWidget'
import { AISidebarDrawer } from '@/components/hud/AISidebarDrawer'
import { UnderwaterBubblesCanvas } from '@/components/hud/UnderwaterBubblesCanvas'
import { OracleProvider, useSafeOracle } from '@/components/hud/OracleContext'
import { AlignmentProvider } from '@/hooks/useDailyAlignment'
import { HudPersistProvider } from '@/hooks/useHudPersist'
import { NotificationsProvider } from '@/hooks/useNotifications'
import { HudPersistIndicator } from '@/components/hud/HudPersistIndicator'
import { OnboardingFlow } from '@/components/hud/onboarding/OnboardingFlow'
import { PwaInstallBanner } from '@/components/hud/PwaInstallBanner'
import { PwaNotificationBridge } from '@/components/hud/PwaNotificationBridge'
import '@/styles/crt.css'
import '@/styles/hud-chrome.css'
import '@/styles/scene.css'
import { useBackdropCovered } from '@/hooks/useBackdropCovered'
import { useHeavyVfx } from '@/hooks/useHeavyVfx'
import { useSceneDive } from '@/hooks/useSceneDive'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAssetUrl } from '@/lib/assets'

const UNDERWATER_BACKGROUND = '/images/hud/underwater-looking-up-hq-v2.webp'
const SCENE_CAUSTICS = '/images/scene-caustics.webp'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) return
    setReduced(query.matches)
    const onChange = () => setReduced(query.matches)
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [])
  return reduced
}

function HudContent() {
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const oracle = useSafeOracle()
  const location = useLocation()
  const isFullscreenRoute = location.pathname.startsWith('/oracle')
  const session = useAuthSession()
  const user = session.user
  const userId = session.userId
  const { heavyVfxDisabled } = useHeavyVfx()
  // Full-screen overlays and the phone Oracle cover the backdrop.
  const backdropCovered = useBackdropCovered()
  const reducedMotion = usePrefersReducedMotion()
  // Scrolling a page sinks the scene deeper; off for reduced motion and the effects switch.
  const mainRef = useRef<HTMLElement | null>(null)
  const sceneRef = useRef<HTMLDivElement | null>(null)
  const depthRef = useRef<HTMLDivElement | null>(null)
  useSceneDive(mainRef, sceneRef, depthRef, !isFullscreenRoute && !heavyVfxDisabled && !reducedMotion, location.pathname)
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
  const isDashboardRoute =
    location.pathname === '/dashboard' || location.pathname === '/dashboard/'

  // Show welcome splash once per member on first visit anywhere in the hub,
  // and once per guest only on the dashboard (bypassed in preview or main-only mode).
  // A shared forum link should not cover the page for a guest's first visit.
  useEffect(() => {
    if (!targetId) return
    if (targetId === 'guest' && !isDashboardRoute) return
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
  }, [targetId, isDashboardRoute])

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

  // "Replay the welcome tour" in Settings reopens the flow from the start
  useEffect(() => {
    const handleRelaunch = () => setShowWelcome(true)
    window.addEventListener('launch-welcome-splash', handleRelaunch)
    return () => window.removeEventListener('launch-welcome-splash', handleRelaunch)
  }, [])

  // Preload background image so transitions happen instantly without network delay
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const img = new Image()
      img.src = getAssetUrl(UNDERWATER_BACKGROUND)
    }
  }, [])

  return (
    <div
      className="hud-layout fixed inset-0 w-full h-full text-ink flex flex-col font-sans overflow-hidden bg-abyss overscroll-none select-none"
    >
      {/* First-visit onboarding */}
      {showWelcome && (
        <OnboardingFlow
          userName={user?.name || user?.email || 'Guest'}
          onDismiss={handleDismissWelcome}
        />
      )}
      {/* Dedicated Portal CRT Screen Background (Behind UI) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-abyss">
        {/* The water: painting, moving surface light and bubbles. Sinks as the page scrolls. */}
        <div ref={sceneRef} className="scene-water absolute inset-0">
          <div
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat opacity-95 ${heavyVfxDisabled ? '' : 'scene-breathe'}`}
            style={{ backgroundImage: `url('${getAssetUrl(UNDERWATER_BACKGROUND)}')` }}
          />

          {/* Light shafts sway and the surface shimmers. Hidden on phones, where the page tint covers it. */}
          {!heavyVfxDisabled && !isFullscreenRoute && (
            <div
              className="absolute inset-0 hidden md:block overflow-hidden"
              style={{ '--scene-caustics': `url('${getAssetUrl(SCENE_CAUSTICS)}')` } as React.CSSProperties}
            >
              <div className="scene-rays scene-rays--b" />
              <div className="scene-rays scene-rays--a" />
              <div className="scene-caustics">
                <i />
                <i />
              </div>
              <div className="scene-surface-glow" />
            </div>
          )}

          {/* Clear glass bubbles rising from the vents in the painting */}
          {!isFullscreenRoute && (
            <UnderwaterBubblesCanvas
              bubbleCount={48}
              disabled={heavyVfxDisabled}
              paused={backdropCovered}
              className="absolute inset-0 pointer-events-none z-[1]"
            />
          )}
        </div>

        {/* Phosphor Ambient Radial Glow (Electric Cyan) */}
        <div
          className="absolute inset-0 z-[2] transition-opacity duration-150 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.21)_0%,rgba(0,195,255,0.1)_55%,transparent_85%)]"
        />

        {/* High-Tech CRT Scanlines Overlay on Background Image */}
        <div className="absolute inset-0 crt-scanlines opacity-55 sm:opacity-65 pointer-events-none" />

        {/* Sacred Grid Overlay */}
        <div className="absolute inset-0 bg-sacred-grid opacity-35 pointer-events-none" />

        {/* Deep Benthic Blue Pro Vignette Overlay */}
        <div className="absolute inset-0 bg-benthic-vignette opacity-70 pointer-events-none" />

        {/* Smooth Bottom Fade Gradient into Deep Benthic Teal (#030708) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030708]/80 pointer-events-none" />

        {/* Darkens the water as the page scrolls deeper */}
        <div ref={depthRef} className="scene-depth absolute inset-0 pointer-events-none" />

        {/* Phone: the page panel goes full width, so its tint sits over the whole scene. */}
        <div className="md:hidden absolute inset-0 bg-surface-1/[0.82] pointer-events-none" />
      </div>

      {/* Experimental Navigation Command Palette */}
      <CommandPalette />

      {/* Main Full-Height Layout with Sidebar extending to the top of screen */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative pt-[env(safe-area-inset-top,0px)]">
        {/* Full Height Glassmorphic Sidebar spanning top-to-bottom (hidden in main-only mode) */}
        {!isMainOnly && <HUDSidebar />}

        {/* Workspace Column & Optional Right AI Drawer */}
        <div className="flex-1 min-w-0 flex h-full overflow-hidden">
          {/* Main Workspace */}
          <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
            {/* Main Panel Content Workspace with Ultra-Translucent Glass Backdrop */}
            <main
              ref={mainRef}
              className={`flex-1 min-h-0 ${
                isFullscreenRoute
                  ? 'p-0 overflow-hidden'
                  : 'p-2.5 sm:p-4 md:px-2 md:py-6 overflow-y-auto overscroll-y-contain'
              } ${
                // Desktop standard pages keep the scene bright around one see-through page panel.
                // Phones get the full-width panel tint from the backdrop layer above, so main stays clear there.
                isFullscreenRoute ? 'md:bg-surface-1/[0.62]' : 'md:bg-surface-1/[0.45]'
              } ${
                // The phone top bar draws its own bottom border, so main never adds a top one:
                // two stacked translucent lines read as a gap above full-width page bars.
                isMainOnly ? 'border-0 shadow-none' : 'md:border-l border-line-subtle shadow-2xl'
              } flex flex-col`}
            >
              {/* Desktop top-right pill (search, notifications, today's tasks, account), filled by HUDSidebar */}
              {!isMainOnly && (
                <div
                  className={`hidden md:flex justify-end pointer-events-none z-30 ${
                    isFullscreenRoute
                      ? 'absolute top-1 right-2'
                      : // The pill (74px with the XP ring) straddles the page panel's top edge and sits
                        // in the panel's top padding, so content starts right under it, not under a bar.
                        'sticky -top-6 -mt-6 -mx-2 px-2 pt-2.5 -mb-[44px] shrink-0'
                  }`}
                >
                  <div id="hud-top-controls-slot" className="pointer-events-auto" />
                </div>
              )}
              {isFullscreenRoute ? (
                <Outlet />
              ) : (
                // Desktop gutters: main 8px + panel border 1px + panel 15px = the 24px pages had before
                // the panel, and 1312px max leaves 1280px of content, so page layouts keep their width.
                <div
                  data-hud-page-panel
                  data-hud-main-only={isMainOnly ? '' : undefined}
                  className={`mx-auto flex w-full min-w-0 flex-1 shrink-0 flex-col md:max-w-[1312px] md:px-[15px] md:pb-6 ${
                    isMainOnly ? 'md:pt-6' : 'md:pt-[54px]'
                  } md:rounded-panel md:border md:border-line-subtle md:bg-surface-1/[0.68] md:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]`}
                >
                  <Outlet />
                </div>
              )}
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
