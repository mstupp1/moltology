import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import geometry from './brand-geometry.json'
import { BrandIcon } from './BrandMark'
import { EMBLEM_MATCAP } from '@/lib/emblem-light'

export interface BrandIcon3DProps {
  /** Square display size in CSS pixels. */
  size?: number
  /** Accessible label when the emblem is not decorative. */
  label?: string
  /** Mark decorative when paired with adjacent heading text. */
  'aria-hidden'?: boolean | 'true' | 'false'
  /** Optional className on the wrapper container. */
  className?: string
  /** Whether to animate a gentle continuous 3D tilt/rotation when motion is allowed. */
  animate?: boolean
  /** The emblem in its own light, as GlowEmblem: a soft red halo and glow behind the mark. */
  glow?: boolean
  /** Initial yaw angle in radians (used for static or reduced-motion renders). */
  initialRotateY?: number
  /** Initial pitch angle in radians (used for static or reduced-motion renders). */
  initialRotateX?: number
  'data-testid'?: string
}

const TRANSFORM_RE =
  /translate\(([-\d.]+)\s+([-\d.]+)\)\s*scale\(([-\d.]+)\)\s*translate\(([-\d.]+)\s+([-\d.]+)\)/

/**
 * Parses the canonical Synaptic Path emblem vector (`brand-geometry.json`) into
 * centered `THREE.Shape` contours in a `[-50, 50]` coordinate space with `+Y` up.
 */
export function parseBrandIconShapes(): THREE.Shape[] {
  const { d, transform, viewBox } = geometry.parts.icon
  const [, , vbW = 100, vbH = 100] = viewBox.split(/\s+/).map(Number)
  const match = transform.match(TRANSFORM_RE)
  const [tx1 = 0, ty1 = 0, scale = 1, tx2 = 0, ty2 = 0] = match ? match.slice(1).map(Number) : []

  const toX = (x: number) => tx1 + (x + tx2) * scale - vbW / 2
  const toY = (y: number) => vbH / 2 - (ty1 + (y + ty2) * scale)

  const tokens = d.match(/[MCLz]|[-+]?\d*\.?\d+/g) ?? []
  const shapes: THREE.Shape[] = []
  let current: THREE.Shape | null = null
  let cmd = ''
  let i = 0

  while (i < tokens.length) {
    const token = tokens[i]
    if (/[MCLz]/.test(token)) {
      cmd = token
      i += 1
      if (cmd === 'z') {
        if (current) {
          current.closePath()
          shapes.push(current)
          current = null
        }
        continue
      }
    }

    if (cmd === 'M') {
      const x = toX(Number(tokens[i++]))
      const y = toY(Number(tokens[i++]))
      current = new THREE.Shape()
      current.moveTo(x, y)
      cmd = 'L'
    } else if (cmd === 'L' && current) {
      const x = toX(Number(tokens[i++]))
      const y = toY(Number(tokens[i++]))
      current.lineTo(x, y)
    } else if (cmd === 'C' && current) {
      const x1 = toX(Number(tokens[i++]))
      const y1 = toY(Number(tokens[i++]))
      const x2 = toX(Number(tokens[i++]))
      const y2 = toY(Number(tokens[i++]))
      const x = toX(Number(tokens[i++]))
      const y = toY(Number(tokens[i++]))
      current.bezierCurveTo(x1, y1, x2, y2, x, y)
    } else {
      i += 1
    }
  }

  return shapes
}

/**
 * Builds the beveled 3D `ExtrudeGeometry` for the Synaptic Path emblem,
 * centered on all three axes so orbital rotation pivots cleanly around `(0, 0, 0)`.
 */
export function createBrandEmblemGeometry(): THREE.ExtrudeGeometry {
  const shapes = parseBrandIconShapes()
  const extrudeDepth = 12
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelThickness: 2.8,
    bevelSize: 1.4,
    bevelOffset: -0.35,
    bevelSegments: 6,
    curveSegments: 28,
  })
  geo.translate(0, 0, -extrudeDepth / 2)
  return geo
}

function canUseWebGL(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) return false
  return typeof WebGLRenderingContext !== 'undefined' || typeof WebGL2RenderingContext !== 'undefined'
}

/**
 * Interactive Three.js 3D Synaptic Path emblem extruded directly from `brand-geometry.json`.
 * Features satin crimson chitin faces and glossy beveled side walls, shaded from baked matcaps,
 * gentle orbital motion, and pointer-responsive tilt, with automatic 2D vector fallback.
 */
export function BrandIcon3D({
  size = 96,
  label = 'Order Emblem',
  'aria-hidden': ariaHidden,
  className = '',
  animate = true,
  glow = false,
  initialRotateY = -0.32,
  initialRotateX = 0.12,
  'data-testid': testId = 'brand-icon-3d',
}: BrandIcon3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pointerTargetRef = useRef({ x: 0, y: 0 })
  const [webglReady, setWebglReady] = useState(false)

  const decorative = ariaHidden === true || ariaHidden === 'true'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canUseWebGL()) return

    let renderer: THREE.WebGLRenderer | null = null
    let emblemGeo: THREE.ExtrudeGeometry | null = null
    const materials: THREE.Material[] = []
    let frameId = 0
    let disposed = false
    const textures: THREE.Texture[] = []
    let stopWatching: (() => void) | null = null

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 2))
      renderer.setSize(size, size, false)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.05

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(32, 1, 1, 500)
      camera.position.set(0, 0, 198)
      camera.lookAt(0, 0, 0)

      // Baked light (npm run emblem:bake): each material is shaded from a lit ball rendered once
      // with the old five-light rig plus a dark studio for reflections, so no lights run per frame.
      // Group 0 is the satin crimson face, group 1 the glossy carnelian walls and bevels.
      const capMaterial = new THREE.MeshMatcapMaterial({ color: 0xffffff })
      const bevelMaterial = new THREE.MeshMatcapMaterial({ color: 0xffffff })
      materials.push(capMaterial, bevelMaterial)

      emblemGeo = createBrandEmblemGeometry()
      const emblemMesh = new THREE.Mesh(emblemGeo, [capMaterial, bevelMaterial])
      scene.add(emblemMesh)

      const reduceMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const shouldAnimate = animate && !reduceMotion

      // Initial angled 3D pose so extruded walls & bevels are immediately visible
      emblemMesh.rotation.set(initialRotateX, initialRotateY, 0)

      // Only draw while the emblem is on screen and the tab is visible.
      let onScreen = true
      let loaded = false
      let tick: ((now: number) => void) | null = null
      const resume = () => {
        if (!tick || frameId || !loaded || !onScreen || document.hidden) return
        frameId = window.requestAnimationFrame(tick)
      }
      const observer =
        typeof IntersectionObserver === 'function'
          ? new IntersectionObserver(([entry]) => {
              onScreen = entry?.isIntersecting ?? true
              resume()
            })
          : null
      observer?.observe(canvas)
      document.addEventListener('visibilitychange', resume)
      stopWatching = () => {
        observer?.disconnect()
        document.removeEventListener('visibilitychange', resume)
      }

      const loader = new THREE.TextureLoader()
      const load = (url: string, material: THREE.MeshMatcapMaterial) =>
        new Promise<void>((resolve, reject) => {
          loader.load(
            url,
            (texture) => {
              texture.colorSpace = THREE.SRGBColorSpace
              material.matcap = texture
              material.needsUpdate = true
              textures.push(texture)
              resolve()
            },
            undefined,
            reject,
          )
        })
      Promise.all([load(EMBLEM_MATCAP.cap, capMaterial), load(EMBLEM_MATCAP.bevel, bevelMaterial)])
        .then(() => {
          if (disposed || !renderer) return
          loaded = true
          renderer.render(scene, camera)
          setWebglReady(true)
          resume()
        })
        .catch(() => {
          // Keeps the flat vector emblem.
        })

      if (shouldAnimate) {
        const startTime = performance.now()
        let currentPointerX = 0
        let currentPointerY = 0

        tick = (now: number) => {
          const elapsed = (now - startTime) * 0.001

          currentPointerX += (pointerTargetRef.current.x - currentPointerX) * 0.08
          currentPointerY += (pointerTargetRef.current.y - currentPointerY) * 0.08

          // Smooth orbital rock that showcases the 3D extruded walls and beveled edges
          emblemMesh.rotation.y = Math.sin(elapsed * 1.15 + 0.6) * 0.38 + currentPointerX * 0.45
          emblemMesh.rotation.x = Math.cos(elapsed * 0.8) * 0.15 + 0.05 + currentPointerY * 0.35
          emblemMesh.rotation.z = Math.sin(elapsed * 0.6) * 0.04
          emblemMesh.position.y = Math.sin(elapsed * 1.5) * 1.4

          renderer?.render(scene, camera)
          frameId = 0
          resume()
        }
      }
    } catch {
      setWebglReady(false)
    }

    return () => {
      disposed = true
      if (frameId) window.cancelAnimationFrame(frameId)
      stopWatching?.()
      emblemGeo?.dispose()
      materials.forEach((m) => m.dispose())
      textures.forEach((t) => t.dispose())
      renderer?.dispose()
    }
  }, [size, animate, initialRotateX, initialRotateY])

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    pointerTargetRef.current = {
      x: Math.max(-1, Math.min(1, nx)),
      y: Math.max(-1, Math.min(1, ny)),
    }
  }

  const handlePointerLeave = () => {
    pointerTargetRef.current = { x: 0, y: 0 }
  }

  return (
    <div
      ref={containerRef}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? 'true' : undefined}
      data-testid={testId}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, ['--glow-emblem-size' as string]: `${Math.round(size * 0.62)}px` }}
    >
      {glow ? <span aria-hidden="true" className="glow-emblem-halo pointer-events-none absolute rounded-full" /> : null}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        aria-hidden="true"
        className={`relative w-full h-full block ${glow ? 'glow-emblem-mark' : ''} transition-opacity duration-200 motion-reduce:transition-none ${
          webglReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {!webglReady ? (
        <BrandIcon
          aria-hidden="true"
          width={Math.round(size * 0.62)}
          height={Math.round(size * 0.62)}
          className={`absolute inset-0 m-auto ${glow ? 'glow-emblem-mark' : ''}`}
        />
      ) : null}
    </div>
  )
}
