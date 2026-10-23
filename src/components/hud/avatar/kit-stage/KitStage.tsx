import React, { useEffect, useRef } from 'react'
import { decodeSvgDataUri } from '@/lib/lobster-avatar-idle'
import { parseKitStageScene, wornHrefs } from './layers'
import { rasterizeScene } from './raster'
import { KitStageRenderer } from './renderer'

export interface KitStageProps {
  /** The painted-kit full-body SVG data URI the SVG avatar would show. */
  src: string
  /** Idle phase seed, so characters don't all breathe in step. */
  animationSeed?: string
  /** The first frame is on screen. */
  onReady?: () => void
  /** The stage can't run here (no WebGL 2, lost context, slow device, art failed to load). */
  onFail?: () => void
}

/** Wait this long after the last change before re-rasterizing, so sliders don't thrash. */
const REBUILD_DELAY_MS = 140
const MAX_DPR_FINE = 2
const MAX_DPR_COARSE = 1.5

function phaseOf(seed: string | undefined): number {
  if (!seed) return 0
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return ((h >>> 0) % 1000) / 1000
}

/**
 * The live WebGL stage for painted-kit characters. Draws over the SVG avatar (which stays as
 * the fallback underneath) and never takes pointer events, so drop targets keep working; the
 * pointer is read from the window instead.
 */
const KitStage: React.FC<KitStageProps> = ({ src, animationSeed, onReady, onFail }) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<KitStageRenderer | null>(null)
  const wornRef = useRef<Set<string> | null>(null)
  const callbacks = useRef({ onReady, onFail })
  callbacks.current = { onReady, onFail }

  // Renderer, sizing, pointer, tilt and pausing live for the component's lifetime.
  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    let renderer: KitStageRenderer
    try {
      renderer = new KitStageRenderer({
        canvas,
        phase: phaseOf(animationSeed),
        onFirstFrame: () => callbacks.current.onReady?.(),
        onSlow: () => callbacks.current.onFail?.(),
        onLost: () => callbacks.current.onFail?.(),
      })
    } catch {
      callbacks.current.onFail?.()
      return
    }
    rendererRef.current = renderer
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false

    const resize = () => {
      const rect = host.getBoundingClientRect()
      renderer.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, coarse ? MAX_DPR_COARSE : MAX_DPR_FINE))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    const onPointer = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1
      // Follow the pointer near the stage; let go once it wanders off across the page.
      if (Math.abs(x) > 1.8 || Math.abs(y) > 1.8) renderer.setPointer(null, null)
      else renderer.setPointer(x, y)
    }
    const onTilt = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return
      renderer.setPointer(event.gamma / 30, (event.beta - 45) / 30)
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('pointerdown', onPointer, { passive: true })
    if (coarse) window.addEventListener('deviceorientation', onTilt)

    let visible = true
    let onScreen = true
    const sync = () => (visible && onScreen ? renderer.start() : renderer.stop())
    const onVisibility = () => {
      visible = !document.hidden
      sync()
    }
    document.addEventListener('visibilitychange', onVisibility)
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true
      sync()
    })
    io.observe(host)

    return () => {
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('deviceorientation', onTilt)
      document.removeEventListener('visibilitychange', onVisibility)
      renderer.destroy()
      rendererRef.current = null
      wornRef.current = null
    }
  }, [animationSeed])

  // Rebuild the layers whenever the avatar changes, keeping the old ones until the new are ready.
  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(async () => {
      const renderer = rendererRef.current
      const host = hostRef.current
      const svg = decodeSvgDataUri(src)
      const scene = svg ? parseKitStageScene(svg) : null
      if (!renderer || !host || !scene) {
        if (!cancelled && !scene) callbacks.current.onFail?.()
        return
      }
      try {
        const rect = host.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR_FINE)
        const px = Math.round(Math.min(1400, Math.max(384, Math.min(rect.width, rect.height) * dpr * 1.1)))
        const raster = await rasterizeScene(scene, px)
        if (cancelled || rendererRef.current !== renderer) return
        const worn = wornHrefs(scene)
        const previous = wornRef.current
        const equipped = new Set(previous ? [...worn].filter((h) => !previous.has(h)) : [])
        wornRef.current = worn
        renderer.setScene(scene, raster, equipped)
        renderer.start()
      } catch {
        if (!cancelled) callbacks.current.onFail?.()
      }
    }, wornRef.current ? REBUILD_DELAY_MS : 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // A new seed makes a new renderer, which needs the layers again.
  }, [src, animationSeed])

  return (
    <div ref={hostRef} className="absolute inset-0 pointer-events-none" data-testid="kit-stage" aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}

export default KitStage
