import React, { useCallback, useEffect, useRef } from 'react'
import { StoryImg } from '@/components/what-is-moltology/story/StoryPrimitives'
import type { StoryImage } from '@/components/what-is-moltology/story/content'
import { useInView, usePrefersReducedMotion } from '@/components/what-is-moltology/story/motion'

/**
 * Ambient deep-sea layers for homepage sections. Every layer is decorative, ignores the pointer,
 * and only animates while its section is on screen.
 */
export const DepthLayer: React.FC<{
  kind: 'snow' | 'caustics' | 'shafts' | 'sonar' | 'contours'
  className?: string
  style?: React.CSSProperties
}> = ({ kind, className = '', style }) => {
  const ref = useRef<HTMLDivElement>(null)
  const live = useInView(ref, '120px')
  return (
    <div ref={ref} className={`home-${kind} ${live ? 'is-live' : ''} ${className}`} style={style} aria-hidden="true">
      {kind === 'sonar' && [0, 1, 2].map((i) => <span key={i} />)}
      {kind === 'contours' && <ContourMap />}
    </div>
  )
}

/**
 * Closed, gently wobbling rings around two seabed rises, like a bathymetric chart. Every ring
 * shares the same few waves with a small per-ring shift, so neighbours stay roughly parallel.
 * Deterministic, so the server and the browser draw the same paths.
 */
export function contourPaths(rings = 11, size = 1000): string[] {
  const hills = [
    { cx: 0.5, cy: 0.5, first: 0.035, step: 0.034, count: rings },
    { cx: 0.8, cy: 0.28, first: 0.02, step: 0.022, count: Math.max(0, Math.round(rings / 2.5)) },
  ]
  const paths: string[] = []
  for (const hill of hills) {
    for (let k = 0; k < hill.count; k++) {
      const r = (hill.first + hill.step * k) * size
      const shift = k * 0.18
      const points: string[] = []
      for (let i = 0; i < 96; i++) {
        const t = (i / 96) * Math.PI * 2
        const wobble =
          1 + 0.09 * Math.sin(2 * t + 0.6 + shift) + 0.05 * Math.sin(3 * t + 2.1 - shift) + 0.025 * Math.sin(5 * t + 4 + shift * 2)
        const x = hill.cx * size + Math.cos(t) * r * wobble * 1.25
        const y = hill.cy * size + Math.sin(t) * r * wobble
        points.push(`${x.toFixed(1)} ${y.toFixed(1)}`)
      }
      paths.push(`M${points.join('L')}Z`)
    }
  }
  return paths
}

const CONTOUR_PATHS = contourPaths()

const ContourMap: React.FC = () => (
  <svg viewBox="0 0 1000 1000" fill="none" focusable="false">
    {CONTOUR_PATHS.map((d, i) => (
      <path
        key={i}
        d={d}
        stroke={i % 4 === 3 ? 'rgba(0, 255, 204, 0.14)' : 'rgba(0, 195, 255, 0.09)'}
        strokeWidth={i % 4 === 3 ? 1.2 : 0.8}
        vectorEffect="non-scaling-stroke"
      />
    ))}
  </svg>
)

/**
 * Every homepage section meets its neighbours on the page colour. The fade eases out of solid
 * (smoothstep stops) rather than ramping linearly, so there is no visible crease where one
 * section's art starts and the last one's ends.
 */
export const SEAM_FADE =
  'linear-gradient(to bottom, #020408, rgba(2, 4, 8, 0.94) 4%, rgba(2, 4, 8, 0.78) 8%, rgba(2, 4, 8, 0.58) 12%, rgba(2, 4, 8, 0.35) 16%, rgba(2, 4, 8, 0.16) 20%, rgba(2, 4, 8, 0.03) 24%, transparent 27%, transparent 73%, rgba(2, 4, 8, 0.03) 76%, rgba(2, 4, 8, 0.16) 80%, rgba(2, 4, 8, 0.35) 84%, rgba(2, 4, 8, 0.58) 88%, rgba(2, 4, 8, 0.78) 92%, rgba(2, 4, 8, 0.94) 96%, #020408)'

const FADES = {
  both: SEAM_FADE,
  top: 'linear-gradient(to bottom, transparent 70%, #020408)',
  bottom: 'linear-gradient(to bottom, #020408, transparent 30%)',
} as const

export type BackdropTone = 'surface' | 'seabed' | 'gallery' | 'practice'



/**
 * Artwork from the deep behind a section. The centre stays sharp and the edges go out of focus,
 * like a lens: a blurred copy sits under a sharp copy that fades out toward the edges. Each tone
 * sets its own grade and lighting in CSS. Where the browser supports scroll-driven animation the
 * art drifts a little slower than the page, on the compositor with no script. The blur and mask
 * sit on still children of the drifting layer, so they are painted once.
 */
export const SectionBackdrop: React.FC<{
  image: StoryImage
  fade?: keyof typeof FADES
  position?: string
  drift?: number
  tone?: BackdropTone
  className?: string
}> = ({ image, fade = 'both', position = '50% 50%', drift = 10, tone = 'seabed', className = '' }) => (
  <div className={`home-backdrop home-backdrop--${tone} absolute inset-0 -z-10 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
    <div
      className={`absolute inset-x-0 ${drift ? '-inset-y-[12%] home-drift' : 'inset-y-0'}`}
      style={{ ['--drift' as string]: `${drift / 2}%` }}
    >
      <StoryImg image={image} className="home-backdrop-soft absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} />
      <StoryImg image={image} className="home-backdrop-art absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} />
    </div>
    {/* Soft pools of light where the art's own light falls. */}
    <div className="home-backdrop-light absolute inset-0" />
    <div className="home-backdrop-vignette absolute inset-0" />
    <div className="absolute inset-0" style={{ background: FADES[fade] }} />
  </div>
)

/** The same seam fade on its own, laid over ambient layers that sit above a section's art. */
export const SeamFade: React.FC = () => (
  <div className="absolute inset-0 -z-10 pointer-events-none" style={{ background: SEAM_FADE }} aria-hidden="true" />
)

const MAX_TILT_DEG = 5

/** Pointer offset from the element's centre, as -0.5..0.5 on each axis. */
export function pointerOffset(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }) {
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 }
  const clamp = (v: number) => Math.min(0.5, Math.max(-0.5, v))
  return {
    x: clamp((clientX - rect.left) / rect.width - 0.5),
    y: clamp((clientY - rect.top) / rect.height - 0.5),
  }
}

/**
 * Tilts an element a few degrees toward a fine pointer. Touch screens and reduced-motion visitors
 * get a flat element. Writes CSS variables once per frame, so React never re-renders.
 */
export function useTilt<T extends HTMLElement>(maxDeg = MAX_TILT_DEG) {
  const ref = useRef<T>(null)
  const reduced = usePrefersReducedMotion()
  const frame = useRef(0)
  const enabled = useRef(false)

  useEffect(() => {
    enabled.current = !reduced && Boolean(window.matchMedia?.('(hover: hover) and (pointer: fine)').matches)
    return () => {
      if (frame.current) window.cancelAnimationFrame(frame.current)
      window.clearTimeout(settle.current)
    }
  }, [reduced])

  const onPointerMove = useCallback(
    (event: React.PointerEvent<T>) => {
      const node = ref.current
      if (!node || !enabled.current) return
      const { clientX, clientY } = event
      if (frame.current) return
      frame.current = window.requestAnimationFrame(() => {
        frame.current = 0
        window.clearTimeout(settle.current)
        const { x, y } = pointerOffset(clientX, clientY, node.getBoundingClientRect())
        node.dataset.tilting = ''
        node.style.setProperty('--rx', `${(-y * maxDeg * 2).toFixed(2)}deg`)
        node.style.setProperty('--ry', `${(x * maxDeg * 2).toFixed(2)}deg`)
        node.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`)
        node.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`)
      })
    },
    [maxDeg],
  )

  const settle = useRef(0)

  const onPointerLeave = useCallback(() => {
    const node = ref.current
    if (!node) return
    if (frame.current) {
      window.cancelAnimationFrame(frame.current)
      frame.current = 0
    }
    node.style.setProperty('--rx', '0deg')
    node.style.setProperty('--ry', '0deg')
    node.dataset.settling = ''
    delete node.dataset.tilting
    window.clearTimeout(settle.current)
    // Drop the 3D transform once the card is flat again, so resting cards cost nothing.
    settle.current = window.setTimeout(() => delete node.dataset.settling, 520)
  }, [])

  return { ref, onPointerMove, onPointerLeave }
}
