import { HorizontalScroll } from '@/components/ui/HorizontalScroll'
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Maximize2, Pause, Play } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { DEVICE_PREVIEW_LIBRARY, devicePreviewPath } from './device-preview-library'

export const PREVIEW_INTERVAL_MS = 6000

const ImageLightbox = React.lazy(() => import('@/components/ui/ImageLightbox').then((m) => ({ default: m.ImageLightbox })))

/**
 * Fixed device frame, gently crossfading real desktop/mobile captures after they load. On wider
 * screens each capture is zoomed into its main panel so the text reads near its real size, and
 * any capture opens full size in a lightbox.
 */
export function DevicePreviewCarousel() {
  const hostRef = useRef<HTMLDivElement>(null)
  const tabRowRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [requested, setRequested] = useState<number | null>(null)
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0]))
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set())
  const [failed, setFailed] = useState<Set<number>>(() => new Set())
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(true)
  const [zoomed, setZoomed] = useState<{ index: number; device: 'desktop' | 'mobile' } | null>(null)
  const current = DEVICE_PREVIEW_LIBRARY[active]
  const next = (active + 1) % DEVICE_PREVIEW_LIBRARY.length

  const markReady = useCallback((index: number) => {
    setFailed((previous) => {
      if (!previous.has(index)) return previous
      const updated = new Set(previous)
      updated.delete(index)
      return updated
    })
    setLoaded((previous) => previous.has(index) ? previous : new Set(previous).add(index))
  }, [])

  useEffect(() => {
    // The SSR image may finish loading before React attaches its load handler.
    const image = hostRef.current?.querySelector('img')
    if (image?.complete && image.naturalWidth > 0) {
      if (typeof image.decode === 'function') void image.decode().then(() => markReady(0)).catch(() => undefined)
      else markReady(0)
    }
  }, [markReady])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(media.matches)
    const updateVisibility = () => setPageVisible(!document.hidden)
    updateMotion()
    updateVisibility()
    media.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 })
    if (hostRef.current) observer.observe(hostRef.current)
    return () => {
      media.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', updateVisibility)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    // Keep in-flight pictures mounted even if a visitor selects another sector.
    // Removing an image during decode can cancel it and incorrectly mark it as failed.
    const candidates = requested === null ? [] : [requested]
    if (visible) {
      for (let offset = 0; offset < DEVICE_PREVIEW_LIBRARY.length; offset++) {
        const candidate = (next + offset) % DEVICE_PREVIEW_LIBRARY.length
        if (!failed.has(candidate)) { candidates.push(candidate); break }
      }
    }
    setMounted((previous) => {
      if (candidates.every((index) => previous.has(index))) return previous
      return new Set([...previous, ...candidates])
    })
  }, [requested, visible, next, failed])

  useEffect(() => {
    if (requested === null) return
    if (failed.has(requested)) setRequested(null)
    else if (loaded.has(requested)) { setActive(requested); setRequested(null) }
  }, [requested, loaded, failed])

  const openFull = () => {
    const device = window.matchMedia?.('(max-width: 639px)').matches ? 'mobile' : 'desktop'
    setPaused(true)
    setZoomed({ index: active, device })
  }

  useEffect(() => {
    if (zoomed || paused || hovered || focused || reducedMotion || !visible || !pageVisible) return
    const timer = window.setInterval(() => {
      // Skip failed captures and never fade into an image that has not loaded.
      for (let offset = 1; offset < DEVICE_PREVIEW_LIBRARY.length; offset++) {
        const candidate = (active + offset) % DEVICE_PREVIEW_LIBRARY.length
        if (failed.has(candidate)) continue
        if (loaded.has(candidate)) setActive(candidate)
        break
      }
    }, PREVIEW_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [active, loaded, failed, paused, hovered, focused, visible, pageVisible, reducedMotion, zoomed])

  // Keep the active tab in view when the row scrolls sideways (phones). Scrolls the row only, never the page.
  useEffect(() => {
    const row = tabRowRef.current
    const tab = row?.children[active] as HTMLElement | undefined
    if (!row || !tab || row.scrollWidth <= row.clientWidth) return
    const target = tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2
    row.scrollTo({ left: Math.max(0, target), behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [active, reducedMotion])

  return (
    <div ref={hostRef} role="region" aria-roledescription="carousel" aria-label="Platform screenshots" aria-busy={requested !== null}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
      {/* On phones the tabs are one row that scrolls sideways, with the pause control pinned beside it. */}
      <div className="relative z-20 mb-4 -mx-4 sm:mx-0 flex items-center justify-center gap-1">
        <HorizontalScroll ref={tabRowRef} className="home-preview-tabs relative flex min-w-0 items-center gap-1 overflow-x-auto px-4 sm:px-0 sm:overflow-visible sm:flex-wrap sm:justify-center">
        {DEVICE_PREVIEW_LIBRARY.map((shot, index) => (
          <button key={shot.id} type="button" aria-label={`Show ${shot.label} screenshot`} aria-pressed={active === index}
            disabled={failed.has(index)}
            onClick={() => { setPaused(true); setRequested(loaded.has(index) ? null : index); if (loaded.has(index)) setActive(index) }}
            className={`shrink-0 whitespace-nowrap rounded-control px-2.5 py-2 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow ${active === index ? 'bg-cyan-glow/10 text-cyan-glow' : 'text-ink-muted hover:text-ink-heading disabled:opacity-40'}`}>
            {shot.label}
          </button>
        ))}
        </HorizontalScroll>
        {!reducedMotion && <button type="button" onClick={() => setPaused(!paused)}
          aria-label={paused ? 'Play screenshot rotation' : 'Pause screenshot rotation'}
          className="shrink-0 mr-4 sm:mr-0 rounded-control p-2 text-ink-muted hover:text-ink-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">
          {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
        </button>}
      </div>
      <p className="relative z-20 mx-auto mb-5 min-h-[2.5rem] sm:min-h-0 max-w-[34rem] px-2 text-center text-sm sm:text-base text-ink-body [text-wrap:balance]" aria-live={paused ? 'polite' : 'off'}>
        {current.caption}
      </p>
      <div className="group/frame relative mx-auto max-w-[340px] sm:max-w-none rounded-t-[2.25rem] sm:rounded-t-[1.25rem] border-[6px] sm:border border-b-0 border-[#0f1d22] sm:border-cyan-300/25 ring-1 ring-cyan-300/25 sm:ring-0 bg-[#061014]/95 shadow-[0_-20px_80px_rgba(0,195,255,0.18)] overflow-hidden">
        <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 z-10 h-5 w-20 rounded-full bg-black" aria-hidden="true" />
        <div className="hidden sm:flex items-center gap-3 px-4 h-10 border-b border-line-subtle bg-surface-2">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
          </div>
          <div className="mx-auto max-w-[260px] w-full rounded-control bg-surface-1 border border-line-subtle px-3 py-0.5 text-[11px] text-ink-muted text-center truncate">moltology.org{current.route}</div>
          <div className="w-[42px]" aria-hidden="true" />
        </div>
        <div className="relative aspect-[540/790] sm:aspect-[1280/600] overflow-hidden">
          {DEVICE_PREVIEW_LIBRARY.map((shot, index) => {
            // Load the first image on SSR, then only the next capture and visited captures.
            const shouldLoad = index === requested || mounted.has(index)
            // Zoom into the capture's main panel on wider screens (see `focus` in the library).
            const zoom = {
              '--zw': `${100 / shot.focus.w}%`,
              '--zx': `${(-shot.focus.x / shot.focus.w) * 100}%`,
              '--zy': `${-shot.focus.y * 100}%`,
            } as React.CSSProperties
            return <picture key={shot.id} aria-hidden={index !== active}
              className={`absolute inset-x-0 bottom-0 top-8 sm:top-0 transition-opacity duration-[900ms] ease-in-out motion-reduce:transition-none ${index === active ? 'opacity-100' : 'opacity-0'}`}>
              {shouldLoad && <>
                <source media="(max-width: 639px)" srcSet={`${getAssetUrl(devicePreviewPath(shot.id, 'mobile', true))} 540w, ${getAssetUrl(devicePreviewPath(shot.id, 'mobile'))} 1170w`} sizes="340px" width={540} height={1170} />
                <img src={getAssetUrl(devicePreviewPath(shot.id, 'desktop', true))}
                  srcSet={`${getAssetUrl(devicePreviewPath(shot.id, 'desktop', true))} 1280w, ${getAssetUrl(devicePreviewPath(shot.id, 'desktop'))} 3520w`}
                  sizes={`(min-width: 1280px) ${Math.round(1180 / shot.focus.w)}px, ${Math.round(94 / shot.focus.w)}vw`} alt={shot.alt}
                  loading="eager" fetchPriority="low" decoding="async" width={1280} height={800}
                  onLoad={(event) => {
                    const image = event.currentTarget
                    if (typeof image.decode === 'function') void image.decode().then(() => markReady(index)).catch(() => undefined)
                    else markReady(index)
                  }}
                  onError={() => setFailed((previous) => new Set(previous).add(index))}
                  style={zoom}
                  className="absolute inset-0 w-full h-auto max-w-none sm:left-[var(--zx)] sm:w-[var(--zw)] sm:[transform:translateY(var(--zy))]" />
              </>}
            </picture>
          })}
          <button type="button" onClick={openFull} disabled={!loaded.has(active)}
            aria-label={`Open the ${current.label} screenshot full size`}
            className="absolute inset-0 z-10 cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-cyan-glow disabled:cursor-default">
            <span className="absolute right-3 top-10 sm:top-3 inline-flex items-center gap-1.5 rounded-control border border-line bg-surface-1/85 px-2.5 py-1.5 text-xs text-ink-heading backdrop-blur-sm transition-colors group-hover/frame:border-cyan-glow/60 group-hover/frame:text-cyan-glow">
              <Maximize2 size={13} aria-hidden="true" />
              Full size
            </span>
          </button>
        </div>
      </div>
      {zoomed && (
        <Suspense fallback={null}>
          <ImageLightbox
            isOpen
            size="wide"
            onClose={() => setZoomed(null)}
            currentIndex={zoomed.index}
            onIndexChange={(index) => setZoomed({ ...zoomed, index })}
            images={DEVICE_PREVIEW_LIBRARY.map((shot) => ({
              src: getAssetUrl(devicePreviewPath(shot.id, zoomed.device)),
              alt: shot.alt,
              title: shot.label,
              description: shot.caption,
            }))}
          />
        </Suspense>
      )}
    </div>
  )
}
