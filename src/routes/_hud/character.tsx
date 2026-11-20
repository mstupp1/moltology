import React from 'react'
import { Outlet, createFileRoute, useLocation } from '@tanstack/react-router'
import { CharacterBand } from '@/components/hud/chassis/CharacterBand'
import type { CharacterSection } from '@/components/hud/chassis/CharacterSectionNav'
import { loadCustomizePage, loadProgressPage, loadShopPage } from '@/components/hud/chassis/character-pages'

function sectionFor(pathname: string): CharacterSection {
  if (pathname.startsWith('/character/shop')) return 'shop'
  if (pathname.startsWith('/character/progress')) return 'progress'
  return 'customize'
}

/**
 * One Character page for /character, /character/shop and /character/progress: the header band
 * (title, wallet, XP, stage, tabs) is drawn once here, and switching tabs swaps only the outlet.
 * On phones Customize pins the band with its character stage, so the band is sticky there.
 */
function CharacterLayout() {
  const section = sectionFor(useLocation({ select: (location) => location.pathname }))
  const rootRef = React.useRef<HTMLDivElement>(null)
  useBandHeight(rootRef)
  React.useEffect(() => {
    // Warm the other tabs' code once the page is idle.
    const warm = () => {
      void loadCustomizePage()
      void loadShopPage()
      void loadProgressPage()
    }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm, { timeout: 3000 })
      return () => window.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(warm, 1500)
    return () => window.clearTimeout(id)
  }, [])
  return (
    <div ref={rootRef} className="character-area space-y-2 sm:space-y-4 lg:space-y-5 font-sans" data-section={section}>
      <CharacterBand current={section} className={section === 'customize' ? 'character-band-pinned' : undefined} />
      <Outlet />
    </div>
  )
}

/** Publishes the band's height as --character-band-h, so the pinned Customize stage sits under it. */
function useBandHeight(rootRef: React.RefObject<HTMLDivElement | null>) {
  React.useEffect(() => {
    const root = rootRef.current
    const band = root?.querySelector<HTMLElement>('[data-testid="character-band"]')
    if (!root || !band || typeof ResizeObserver === 'undefined') return
    const update = () => root.style.setProperty('--character-band-h', `${band.offsetHeight}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(band)
    return () => observer.disconnect()
  }, [rootRef])
}

export const Route = createFileRoute('/_hud/character')({
  component: CharacterLayout,
})
