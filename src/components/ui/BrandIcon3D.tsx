import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import geometry from './brand-geometry.json'
import { BrandIcon } from './BrandMark'

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
 * Features satin crimson chitin faces, metallic beveled side walls, benthic cyan rim lighting,
 * gentle orbital motion, and pointer-responsive tilt, with automatic 2D vector fallback.
 */
export function BrandIcon3D({
  size = 96,
  label = 'Order Emblem',
  'aria-hidden': ariaHidden,
  className = '',
  animate = true,
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

      // Group 0 (Front/Back caps): true Moltology crimson-aggro (#ff453a) satin chitin
      const capMaterial = new THREE.MeshStandardMaterial({
        color: 0xff3b30,
        emissive: 0xd92318,
        emissiveIntensity: 0.28,
        roughness: 0.48,
        metalness: 0.08,
      })

      // Group 1 (Extruded walls & 6-segment bevels): deep sculpted carnelian with bright specular edge catchlights
      const bevelMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x9e160d,
        emissive: 0x380502,
        emissiveIntensity: 0.2,
        roughness: 0.2,
        metalness: 0.42,
        clearcoat: 0.9,
        clearcoatRoughness: 0.12,
        reflectivity: 1.0,
      })
      materials.push(capMaterial, bevelMaterial)

      emblemGeo = createBrandEmblemGeometry()
      const emblemMesh = new THREE.Mesh(emblemGeo, [capMaterial, bevelMaterial])
      scene.add(emblemMesh)

      // Grazing multi-point lighting so the front cap stays rich #ff453a while bevels & sides pop
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.55)
      scene.add(ambientLight)

      const keyLight = new THREE.DirectionalLight(0xfff0ea, 2.1)
      keyLight.position.set(80, 95, 70)
      scene.add(keyLight)

      const bevelHighlightLight = new THREE.DirectionalLight(0xffb4a8, 1.8)
      bevelHighlightLight.position.set(-95, 55, 45)
      scene.add(bevelHighlightLight)

      const cyanRimLight = new THREE.DirectionalLight(0x00c3ff, 2.4)
      cyanRimLight.position.set(90, -55, -35)
      scene.add(cyanRimLight)

      const crimsonUnderLight = new THREE.DirectionalLight(0xff453a, 1.1)
      crimsonUnderLight.position.set(-30, -90, 40)
      scene.add(crimsonUnderLight)

      const reduceMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const shouldAnimate = animate && !reduceMotion

      // Initial angled 3D pose so extruded walls & bevels are immediately visible
      emblemMesh.rotation.set(initialRotateX, initialRotateY, 0)
      renderer.render(scene, camera)
      setWebglReady(true)

      if (shouldAnimate) {
        const startTime = performance.now()
        let currentPointerX = 0
        let currentPointerY = 0

        const tick = (now: number) => {
          const elapsed = (now - startTime) * 0.001

          currentPointerX += (pointerTargetRef.current.x - currentPointerX) * 0.08
          currentPointerY += (pointerTargetRef.current.y - currentPointerY) * 0.08

          // Smooth orbital rock that showcases the 3D extruded walls and beveled edges
          emblemMesh.rotation.y = Math.sin(elapsed * 1.15 + 0.6) * 0.38 + currentPointerX * 0.45
          emblemMesh.rotation.x = Math.cos(elapsed * 0.8) * 0.15 + 0.05 + currentPointerY * 0.35
          emblemMesh.rotation.z = Math.sin(elapsed * 0.6) * 0.04
          emblemMesh.position.y = Math.sin(elapsed * 1.5) * 1.4

          renderer?.render(scene, camera)
          frameId = window.requestAnimationFrame(tick)
        }

        frameId = window.requestAnimationFrame(tick)
      }
    } catch {
      setWebglReady(false)
    }

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      emblemGeo?.dispose()
      materials.forEach((m) => m.dispose())
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
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        aria-hidden="true"
        className={`w-full h-full block transition-opacity duration-200 motion-reduce:transition-none ${
          webglReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {!webglReady ? (
        <BrandIcon
          aria-hidden="true"
          width={Math.round(size * 0.62)}
          height={Math.round(size * 0.62)}
          className="absolute inset-0 m-auto"
        />
      ) : null}
    </div>
  )
}
