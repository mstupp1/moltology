import React, { useEffect, useRef } from 'react'
import { getAssetUrl } from '@/lib/assets'

/**
 * Bubbles for the in-app underwater scene.
 *
 * Each bubble is a small image that the browser's compositor slides upward on the
 * graphics card (Web Animations on transform and opacity only). Nothing runs per
 * frame on the main thread: JavaScript only picks a new start point once each time
 * a bubble finishes rising (every 8 to 25 seconds). Most bubbles rise in streams from
 * the vents and the little sub in the painting, far ones are softer and dimmer, and
 * bubbles in the light shafts are brighter.
 */

export interface UnderwaterBubblesProps {
  bubbleCount?: number
  className?: string
  /** Renders nothing when true. */
  disabled?: boolean
  /**
   * Holds every bubble where it is while the scene is hidden behind an opaque page or a
   * full-screen overlay. Resumes where it left off.
   */
  paused?: boolean
}

/**
 * Where bubbles come from, in the painting's own coordinates (0..1). The scene image
 * is drawn with background-size: cover, centred, so these map the same way.
 */
export const SCENE_IMAGE_SIZE = { width: 1672, height: 941 }
export const BUBBLE_VENTS = [
  { x: 0.262, y: 0.7, weight: 2.2 },
  { x: 0.282, y: 0.75, weight: 1.4 },
  { x: 0.752, y: 0.66, weight: 2 },
  { x: 0.51, y: 0.84, weight: 0.8 }, // the little sub
]
const VENT_SHARE = 0.65

/**
 * Bubble sprites. The glass bubble comes pre-lit three ways (scripts/brand/bake-bubble-light.py):
 * `glassLit` in the light shafts, `glass` in open water, `glassShade` at the dark edges.
 */
export const BUBBLE_SPRITES = {
  glass: '/images/bubbles/glass.webp',
  glassLit: '/images/bubbles/glass-lit.webp',
  glassShade: '/images/bubbles/glass-shade.webp',
  soft: '/images/bubbles/glass-soft.webp',
  bead: '/images/bubbles/bead.webp',
} as const

/** Maps a point in the painting to the screen, matching background-size: cover. */
export function mapScenePoint(u: number, v: number, width: number, height: number): [number, number] {
  const scale = Math.max(width / SCENE_IMAGE_SIZE.width, height / SCENE_IMAGE_SIZE.height)
  const drawnW = SCENE_IMAGE_SIZE.width * scale
  const drawnH = SCENE_IMAGE_SIZE.height * scale
  return [(width - drawnW) / 2 + u * drawnW, (height - drawnH) / 2 + v * drawnH]
}

/** How much surface light reaches a point: strongest in the shafts at the top centre. */
export function sceneLightAt(x: number, y: number, width: number, height: number): number {
  const dx = x / Math.max(width, 1) - 0.5
  const across = Math.exp(-(dx * dx) / 0.06)
  const down = 1 - Math.min(1, Math.max(0, y / Math.max(height, 1))) * 0.7
  return across * down
}

// ---------------------------------------------------------------------------
// BUBBLE BUDGET
// ---------------------------------------------------------------------------
// Phones get fewer bubbles than desktop, and low-power or data-saver phones fewer again.

export interface BubbleDeviceHints {
  viewportWidth: number
  saveData?: boolean
  hardwareConcurrency?: number
  deviceMemory?: number
}

const PHONE_MAX_WIDTH = 768
const PHONE_BUBBLES = 16
const LOW_POWER_PHONE_BUBBLES = 10

export function isLowPowerDevice(hints: BubbleDeviceHints): boolean {
  return (
    hints.saveData === true ||
    (hints.hardwareConcurrency ?? 8) <= 4 ||
    (hints.deviceMemory ?? 8) <= 4
  )
}

export function pickBubbleCount(bubbleCount: number, hints: BubbleDeviceHints): number {
  if (hints.viewportWidth >= PHONE_MAX_WIDTH) return bubbleCount
  return Math.min(bubbleCount, isLowPowerDevice(hints) ? LOW_POWER_PHONE_BUBBLES : PHONE_BUBBLES)
}

export function readDeviceHints(): BubbleDeviceHints {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number }
  return {
    viewportWidth: window.innerWidth,
    saveData: nav.connection?.saveData,
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
  }
}

// ---------------------------------------------------------------------------
// ONE RISE
// ---------------------------------------------------------------------------

export interface BubbleRise {
  /** Start centre, in px from the top left of the scene. */
  x: number
  y: number
  /** Diameter in px. */
  size: number
  sprite: keyof typeof BUBBLE_SPRITES
  /** Peak opacity while rising. */
  opacity: number
  /** Distance travelled upward, in px. */
  distance: number
  durationMs: number
  /** Side-to-side sway, in px each way, and how long one sway takes. */
  sway: number
  swayMs: number
}

/** Picks where a bubble starts, how big it is and how it rises. Pure, given a random source. */
export function planBubbleRise(width: number, height: number, random: () => number = Math.random): BubbleRise {
  const phone = width < PHONE_MAX_WIDTH
  let x: number
  let y: number
  let z: number // depth: 0 far .. 1 near
  if (random() < VENT_SHARE) {
    const totalWeight = BUBBLE_VENTS.reduce((sum, vent) => sum + vent.weight, 0)
    let pick = random() * totalWeight
    let vent = BUBBLE_VENTS[0]
    for (const candidate of BUBBLE_VENTS) {
      pick -= candidate.weight
      if (pick <= 0) {
        vent = candidate
        break
      }
    }
    ;[x, y] = mapScenePoint(vent.x, vent.y, width, height)
    x += (random() - 0.5) * 18
    z = 0.2 + random() * 0.45 // vents sit in the middle distance
  } else {
    x = random() * width
    y = height + 30
    z = random()
  }

  // Mostly small and medium bubbles, a few big near ones.
  const roll = random()
  let size = roll < 0.4 ? 10 + random() * 10 : roll < 0.82 ? 22 + random() * 32 : 52 + random() * 50
  size *= (0.6 + z * 0.6) * (phone ? 0.85 : 1)

  const light = sceneLightAt(x, y * 0.5, width, height)
  // A bubble rises straight up, so the shaft it starts in is the light it carries: pick the
  // glass baked for that light once, here, and nothing changes while it moves.
  const glass: BubbleRise['sprite'] = light > 0.55 ? 'glassLit' : light < 0.12 ? 'glassShade' : 'glass'
  const sprite: BubbleRise['sprite'] = z < 0.3 || size > 70 ? 'soft' : size < 14 ? 'bead' : glass
  const opacity = Math.min(0.9, 0.36 + z * 0.42 + light * 0.35)
  const speed = (26 + size * 1.1 + random() * 20) * (0.55 + z * 0.6) // px per second
  const distance = y + size + 20

  return {
    x,
    y,
    size,
    sprite,
    opacity,
    distance,
    durationMs: (distance / speed) * 1000,
    sway: 2 + z * 7 + (size < 14 ? 2 : 0),
    swayMs: 1400 + random() * 1800,
  }
}

interface BubbleNode {
  wrap: HTMLDivElement
  img: HTMLImageElement
  rise?: Animation
  sway?: Animation
}

export function UnderwaterBubbles({
  bubbleCount = 32,
  className = 'absolute inset-0 pointer-events-none z-0',
  disabled = false,
  paused = false,
}: UnderwaterBubblesProps) {
  const layerRef = useRef<HTMLDivElement | null>(null)
  const nodesRef = useRef<BubbleNode[]>([])
  const pausedRef = useRef(paused)

  useEffect(() => {
    pausedRef.current = paused
    for (const node of nodesRef.current) {
      if (paused) {
        node.rise?.pause()
        node.sway?.pause()
      } else {
        node.rise?.play()
        node.sway?.play()
      }
    }
  }, [paused])

  useEffect(() => {
    if (disabled) return
    const layer = layerRef.current
    if (!layer || typeof layer.animate !== 'function') return

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    let width = layer.clientWidth || window.innerWidth
    let height = layer.clientHeight || window.innerHeight

    const launch = (node: BubbleNode, midway: boolean) => {
      const plan = planBubbleRise(width, height)
      const { wrap, img } = node
      wrap.style.width = wrap.style.height = `${plan.size.toFixed(1)}px`
      wrap.style.left = `${(plan.x - plan.size / 2).toFixed(1)}px`
      wrap.style.top = `${(plan.y - plan.size / 2).toFixed(1)}px`
      const src = getAssetUrl(BUBBLE_SPRITES[plan.sprite])
      if (img.getAttribute('src') !== src) img.src = src

      node.rise?.cancel()
      node.sway?.cancel()
      if (reduceMotion) {
        wrap.style.opacity = String(plan.opacity)
        wrap.style.transform = `translate3d(0,${(-Math.random() * plan.y).toFixed(1)}px,0)`
        return
      }

      // Fade in leaving the vent, fade out just under the surface.
      const fadeOut = Math.min(0.97, 1 - 110 / plan.distance)
      node.rise = wrap.animate(
        [
          { transform: 'translate3d(0,0,0)', opacity: 0 },
          { transform: `translate3d(0,${-plan.distance * 0.06}px,0)`, opacity: plan.opacity, offset: 0.06 },
          { transform: `translate3d(0,${-plan.distance * fadeOut}px,0)`, opacity: plan.opacity, offset: fadeOut },
          { transform: `translate3d(0,${-plan.distance}px,0)`, opacity: 0 },
        ],
        { duration: plan.durationMs, easing: 'linear', fill: 'both' },
      )
      if (midway) node.rise.currentTime = Math.random() * plan.durationMs * 0.95
      node.rise.onfinish = () => launch(node, false)

      node.sway = img.animate(
        [{ transform: `translate3d(${-plan.sway}px,0,0)` }, { transform: `translate3d(${plan.sway}px,0,0)` }],
        {
          duration: plan.swayMs,
          direction: 'alternate',
          iterations: Infinity,
          easing: 'ease-in-out',
          delay: -Math.random() * plan.swayMs,
        },
      )
      if (pausedRef.current) {
        node.rise.pause()
        node.sway.pause()
      }
    }

    const count = pickBubbleCount(bubbleCount, readDeviceHints())
    const nodes: BubbleNode[] = []
    for (let i = 0; i < count; i++) {
      const wrap = document.createElement('div')
      wrap.className = 'scene-bubble'
      const img = document.createElement('img')
      img.alt = ''
      img.decoding = 'async'
      img.draggable = false
      wrap.appendChild(img)
      layer.appendChild(wrap)
      const node = { wrap, img }
      nodes.push(node)
      launch(node, true)
    }
    nodesRef.current = nodes

    let resizeTimeout: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        width = layer.clientWidth || window.innerWidth
        height = layer.clientHeight || window.innerHeight
        for (const node of nodes) launch(node, true)
      }, 150)
    }
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      clearTimeout(resizeTimeout)
      window.removeEventListener('resize', handleResize)
      for (const node of nodes) {
        if (node.rise) node.rise.onfinish = null
        node.rise?.cancel()
        node.sway?.cancel()
        node.wrap.remove()
      }
      nodesRef.current = []
    }
  }, [bubbleCount, disabled])

  if (disabled) return null

  return <div ref={layerRef} className={`scene-bubbles ${className}`} aria-hidden="true" data-testid="underwater-bubbles" />
}
