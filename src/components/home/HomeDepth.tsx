import React, { useCallback, useEffect, useRef } from 'react'
import { StoryImg } from '@/components/what-is-moltology/story/StoryPrimitives'
import type { StoryImage } from '@/components/what-is-moltology/story/content'
import { useInView, usePrefersReducedMotion } from '@/components/what-is-moltology/story/motion'

/**
 * Ambient deep-sea layers for homepage sections. Every layer is decorative, ignores the pointer,
 * and only animates while its section is on screen.
 */
export const DepthLayer: React.FC<{ kind: 'snow' | 'caustics' | 'shafts'; className?: string }> = ({
  kind,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const live = useInView(ref, '120px')
  return <div ref={ref} className={`home-${kind} ${live ? 'is-live' : ''} ${className}`} aria-hidden="true" />
}

const FADES = {
  both: 'linear-gradient(to bottom, #020408, transparent 25%, transparent 70%, #020408)',
  top: 'linear-gradient(to bottom, transparent 30%, #020408)',
  bottom: 'linear-gradient(to bottom, #020408, transparent 50%)',
} as const

/**
 * A photo from the deep, laid low behind a section and faded into the page at its edges.
 * Where the browser supports scroll-driven animation it drifts a little slower than the page,
 * on the compositor with no script. The fades are painted gradients rather than masks.
 */
export const SectionBackdrop: React.FC<{
  image: StoryImage
  fade?: keyof typeof FADES
  position?: string
  drift?: number
  className?: string
}> = ({ image, fade = 'both', position = '50% 50%', drift = 10, className = '' }) => (
  <div className={`absolute inset-0 -z-10 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
    <div
      className={`absolute -inset-y-[12%] inset-x-0 ${drift ? 'home-drift' : ''}`}
      style={{ ['--drift' as string]: `${drift / 2}%` }}
    >
      <StoryImg image={image} className="h-full w-full object-cover" style={{ objectPosition: position }} />
    </div>
    <div className="absolute inset-0" style={{ background: FADES[fade] }} />
  </div>
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
