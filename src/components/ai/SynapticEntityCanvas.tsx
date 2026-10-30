import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export interface EntityBridgeFrameSnapshot {
  lifecycle: 'idle' | 'typing' | 'thinking' | 'streaming' | 'error'
  contentMode: 'prose' | 'code' | 'directive'
  typingIntensity: number
  thinkingTension: number
  streamVelocity: number
  pulseEnergy: number
  synapseFlash: number
  colorShift: number
  totalCharsStreamed: number
  lastChunkDelta: string
}

export interface EntityBridgeReader {
  stepFrame: (dtSeconds: number, nowMs?: number) => Readonly<EntityBridgeFrameSnapshot>
  getSnapshot: () => Readonly<EntityBridgeFrameSnapshot>
}

export interface SynapticEntityCanvasProps {
  bridge: EntityBridgeReader
  isCompact?: boolean
  className?: string
}

function canUseWebGL(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

function createPointGlowTexture(): THREE.Texture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
  gradient.addColorStop(0.35, 'rgba(0, 195, 255, 0.85)')
  gradient.addColorStop(0.7, 'rgba(7, 36, 66, 0.35)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 32, 32)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

const CORE_VERTEX_SHADER = `
uniform float uTime;
uniform float uStreamVelocity;
uniform float uPulseEnergy;
uniform float uThinkingTension;
uniform float uTypingIntensity;
uniform float uReducedMotion;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying float vDisplacement;

float organicNoise(vec3 p, float t) {
  float n = sin(p.x * 2.3 + t * 1.1) * cos(p.y * 2.7 - t * 0.9) * sin(p.z * 2.5 + t * 1.2);
  n += 0.5 * sin(p.y * 4.6 + t * 2.0) * cos(p.z * 4.9 - t * 1.7) * sin(p.x * 4.3 + t * 2.2);
  n += 0.25 * sin(p.z * 8.5 + t * 3.3) * cos(p.x * 8.8 + t * 2.9) * sin(p.y * 8.2 - t * 3.5);
  return n;
}

void main() {
  vNormal = normalize(normalMatrix * normal);
  
  float motionScale = mix(1.0, 0.15, uReducedMotion);
  
  float baseWave = organicNoise(position * 1.15, uTime * 0.85 * motionScale);
  
  // High-frequency radial contraction & tremor during thinking
  float thinkingTremor = sin(uTime * 32.0 * motionScale + position.x * 14.0 + position.y * 16.0) * uThinkingTension * 0.045;
  float thinkingContract = -uThinkingTension * 0.12;
  
  // Streaming outward ripple with token energy
  float streamWave = sin(length(position) * 6.5 - uTime * 6.5 * motionScale);
  float streamRipple = streamWave * (uStreamVelocity * 0.08 + uPulseEnergy * 0.14);
  
  // Typing gentle hum
  float typingHum = sin(position.y * 5.5 + uTime * 3.2 * motionScale) * uTypingIntensity * 0.035;
  
  float disp = (baseWave * 0.09 + streamRipple + thinkingTremor + thinkingContract + typingHum) * motionScale;
  vDisplacement = disp;
  
  vec3 displacedPosition = position + normal * disp;
  vPosition = displacedPosition;
  
  vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}
`

const CORE_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uColorShift;
uniform float uPulseEnergy;
uniform float uSynapseFlash;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying float vDisplacement;

float synapticVeins(vec3 p, float t) {
  vec3 q = p * 4.0 + vec3(sin(t * 0.5), cos(t * 0.6), sin(t * 0.4));
  float v1 = sin(q.x + sin(q.y * 1.5)) * cos(q.y + sin(q.z * 1.4));
  float v2 = sin(q.z * 2.0 + cos(q.x * 1.8)) * cos(q.x * 2.2 + sin(q.y * 2.0));
  float raw = abs(v1 * 0.6 + v2 * 0.4);
  return smoothstep(0.42, 0.04, raw);
}

void main() {
  vec3 viewDir = normalize(vViewPosition);
  vec3 norm = normalize(vNormal);
  
  float NdotV = max(0.0, dot(norm, viewDir));
  float fresnel = pow(1.0 - NdotV, 2.8);
  
  vec3 abyssalDeep = vec3(0.012, 0.027, 0.031);
  vec3 abyssalTrench = vec3(0.027, 0.141, 0.259);
  
  vec3 cyan = vec3(0.0, 0.765, 1.0);
  vec3 bioAqua = vec3(0.0, 0.961, 0.831);
  vec3 sacredCrimson = vec3(1.0, 0.271, 0.227);
  vec3 sacredCoral = vec3(1.0, 0.416, 0.376);
  
  vec3 activeHue;
  if (uColorShift < 0.45) {
    float f = clamp(uColorShift / 0.45, 0.0, 1.0);
    activeHue = mix(cyan, bioAqua, f);
  } else {
    float f = clamp((uColorShift - 0.45) / 0.45, 0.0, 1.0);
    vec3 crimsonShift = mix(sacredCrimson, sacredCoral, clamp((uColorShift - 0.88) * 8.0, 0.0, 1.0));
    activeHue = mix(bioAqua, crimsonShift, f);
  }
  
  float creviceDepth = smoothstep(0.06, -0.06, vDisplacement);
  vec3 creviceColor = mix(abyssalTrench, abyssalDeep, creviceDepth);
  
  float veins = synapticVeins(vPosition, uTime);
  
  vec3 bodyColor = mix(creviceColor, activeHue, 0.28 + veins * 0.45 + fresnel * 0.65);
  bodyColor += activeHue * (uPulseEnergy * 0.35);
  
  vec3 hotWhite = vec3(0.92, 0.98, 1.0);
  float hotSpot = veins * (uSynapseFlash * 1.6 + uPulseEnergy * 0.4);
  bodyColor += hotWhite * hotSpot;
  bodyColor += activeHue * (fresnel * uSynapseFlash * 0.8);
  
  float alpha = clamp(0.9 + fresnel * 0.1, 0.0, 1.0);
  gl_FragColor = vec4(bodyColor, alpha);
}
`

export function SynapticEntityCanvas({
  bridge,
  isCompact = false,
  className = '',
}: SynapticEntityCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pointerTargetRef = useRef({ x: 0, y: 0 })
  const [webglUnavailable, setWebglUnavailable] = useState<boolean>(() => !canUseWebGL())

  useEffect(() => {
    if (!canUseWebGL()) {
      setWebglUnavailable(true)
      return
    }

    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    let renderer: THREE.WebGLRenderer | null = null
    let frameId = 0
    let resizeObserver: ResizeObserver | null = null
    let handleWindowResize: (() => void) | null = null
    const disposables: { dispose: () => void }[] = []

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })

      const pr = Math.min(window.devicePixelRatio || 1, isCompact ? 1.5 : 2)
      renderer.setPixelRatio(pr)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.1

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50)
      camera.position.set(0, 0, isCompact ? 5.1 : 4.65)
      camera.lookAt(0, 0, 0)

      const rootGroup = new THREE.Group()
      scene.add(rootGroup)

      // Layer 1: Organic Bioluminescent Neural Core
      const coreDetail = isCompact ? 3 : 5
      const coreGeo = new THREE.IcosahedronGeometry(1.15, coreDetail)
      const coreMaterial = new THREE.ShaderMaterial({
        vertexShader: CORE_VERTEX_SHADER,
        fragmentShader: CORE_FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uStreamVelocity: { value: 0 },
          uPulseEnergy: { value: 0 },
          uThinkingTension: { value: 0 },
          uTypingIntensity: { value: 0 },
          uSynapseFlash: { value: 0 },
          uColorShift: { value: 0 },
          uReducedMotion: { value: 0 },
        },
        transparent: true,
        depthWrite: true,
      })
      const coreMesh = new THREE.Mesh(coreGeo, coreMaterial)
      rootGroup.add(coreMesh)
      disposables.push(coreGeo, coreMaterial)

      // Layer 2: Chitin Exoskeleton Lattice
      const exoskeletonGeo = new THREE.IcosahedronGeometry(1.38, 2)
      const exoskeletonMaterial = new THREE.MeshBasicMaterial({
        color: 0x00c3ff,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const exoskeletonMesh = new THREE.Mesh(exoskeletonGeo, exoskeletonMaterial)
      rootGroup.add(exoskeletonMesh)
      disposables.push(exoskeletonGeo, exoskeletonMaterial)

      // Layer 3: Synaptic Particle Halo & Orbital Neural Rings
      const particleCount = isCompact ? 220 : 480
      const positions = new Float32Array(particleCount * 3)
      for (let i = 0; i < particleCount; i++) {
        const u = Math.random()
        const v = Math.random()
        const theta = u * 2.0 * Math.PI
        const phi = Math.acos(2.0 * v - 1.0)
        const r = 1.5 + Math.random() * 1.3
        const sinPhi = Math.sin(phi)
        positions[i * 3] = r * sinPhi * Math.cos(theta)
        positions[i * 3 + 1] = r * sinPhi * Math.sin(theta)
        positions[i * 3 + 2] = r * Math.cos(phi)
      }
      const haloGeo = new THREE.BufferGeometry()
      haloGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

      const pointTexture = createPointGlowTexture()
      if (pointTexture) disposables.push(pointTexture)

      const haloMaterial = new THREE.PointsMaterial({
        size: isCompact ? 0.08 : 0.11,
        map: pointTexture ?? undefined,
        color: 0x00c3ff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const haloPoints = new THREE.Points(haloGeo, haloMaterial)
      rootGroup.add(haloPoints)
      disposables.push(haloGeo, haloMaterial)

      // Orbital Neural Rings
      const ring1Geo = new THREE.TorusGeometry(1.75, 0.008, 8, 96)
      const ring1Material = new THREE.MeshBasicMaterial({
        color: 0x00c3ff,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const ring1 = new THREE.Mesh(ring1Geo, ring1Material)
      ring1.rotation.x = Math.PI * 0.35
      ring1.rotation.y = Math.PI * 0.15
      rootGroup.add(ring1)
      disposables.push(ring1Geo, ring1Material)

      const ring2Geo = new THREE.TorusGeometry(1.75, 0.008, 8, 96)
      const ring2Material = new THREE.MeshBasicMaterial({
        color: 0x00c3ff,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const ring2 = new THREE.Mesh(ring2Geo, ring2Material)
      ring2.rotation.x = -Math.PI * 0.4
      ring2.rotation.y = -Math.PI * 0.25
      rootGroup.add(ring2)
      disposables.push(ring2Geo, ring2Material)

      const updateDimensions = () => {
        if (!container || !renderer || !camera) return
        const width = container.clientWidth || 300
        const height = container.clientHeight || 300
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height, false)
        const updatedPr = Math.min(window.devicePixelRatio || 1, isCompact ? 1.5 : 2)
        renderer.setPixelRatio(updatedPr)
      }
      updateDimensions()

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          updateDimensions()
        })
        resizeObserver.observe(container)
      } else if (typeof window !== 'undefined') {
        handleWindowResize = updateDimensions
        window.addEventListener('resize', handleWindowResize)
      }

      const cyanColor = new THREE.Color(0x00c3ff)
      const emeraldColor = new THREE.Color(0x00f5d4)
      const crimsonColor = new THREE.Color(0xff453a)
      const activeColor = new THREE.Color()

      let currentPointerX = 0
      let currentPointerY = 0
      let lastTimeMs = performance.now()
      let elapsedTotal = 0

      const tick = (nowMs: number) => {
        const dtSeconds = Math.min(0.1, Math.max(0.001, (nowMs - lastTimeMs) * 0.001))
        lastTimeMs = nowMs

        const snapshot = bridge.stepFrame(dtSeconds, nowMs)

        const reduceMotion =
          typeof window !== 'undefined' &&
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches

        const motionScale = reduceMotion ? 0.2 : 1.0
        elapsedTotal += dtSeconds * motionScale

        // Update Layer 1 uniforms
        coreMaterial.uniforms.uTime.value = elapsedTotal
        coreMaterial.uniforms.uStreamVelocity.value = snapshot.streamVelocity
        coreMaterial.uniforms.uPulseEnergy.value = snapshot.pulseEnergy
        coreMaterial.uniforms.uThinkingTension.value = snapshot.thinkingTension
        coreMaterial.uniforms.uTypingIntensity.value = snapshot.typingIntensity
        coreMaterial.uniforms.uSynapseFlash.value = snapshot.synapseFlash
        coreMaterial.uniforms.uColorShift.value = snapshot.colorShift
        coreMaterial.uniforms.uReducedMotion.value = reduceMotion ? 1.0 : 0.0

        // Palette blending
        if (snapshot.colorShift < 0.45) {
          activeColor.lerpColors(cyanColor, emeraldColor, snapshot.colorShift / 0.45)
        } else {
          activeColor.lerpColors(
            emeraldColor,
            crimsonColor,
            Math.min(1.0, (snapshot.colorShift - 0.45) / 0.45)
          )
        }

        // Core mesh orbital breathing rotation
        const coreSpeed = (0.28 + snapshot.streamVelocity * 0.65 + snapshot.thinkingTension * 0.35) * motionScale
        coreMesh.rotation.y += dtSeconds * coreSpeed
        coreMesh.rotation.x += dtSeconds * coreSpeed * 0.4

        // Layer 2: Exoskeleton lattice dynamics
        const exoScale = 1.0 - snapshot.thinkingTension * 0.12 + snapshot.pulseEnergy * 0.16
        exoskeletonMesh.scale.setScalar(exoScale)
        const exoSpeed = (0.36 + snapshot.streamVelocity * 0.85 + snapshot.thinkingTension * 0.6) * motionScale
        exoskeletonMesh.rotation.y -= dtSeconds * exoSpeed * 1.15
        exoskeletonMesh.rotation.x -= dtSeconds * exoSpeed * 0.8
        exoskeletonMesh.rotation.z += dtSeconds * exoSpeed * 0.35
        exoskeletonMaterial.color.copy(activeColor)
        exoskeletonMaterial.opacity = Math.min(
          0.85,
          0.28 + snapshot.pulseEnergy * 0.35 + snapshot.synapseFlash * 0.25
        )

        // Layer 3: Particle Halo dynamics
        const haloSpeed = (0.22 + snapshot.streamVelocity * 0.95 + snapshot.thinkingTension * 0.4) * motionScale
        haloPoints.rotation.y += dtSeconds * haloSpeed
        haloPoints.rotation.x += dtSeconds * haloSpeed * 0.35
        haloMaterial.color.copy(activeColor)
        haloMaterial.opacity = Math.min(
          1.0,
          0.45 + snapshot.streamVelocity * 0.35 + snapshot.synapseFlash * 0.5
        )
        haloMaterial.size =
          (isCompact ? 0.075 : 0.11) *
          (1.0 + snapshot.pulseEnergy * 0.45 + snapshot.synapseFlash * 0.6)

        // Layer 3: Gyroscopic Orbital Rings
        const ringPrecessionSpeed =
          (0.5 + snapshot.streamVelocity * 1.6 + snapshot.thinkingTension * 0.85) * motionScale
        ring1.rotation.z += dtSeconds * ringPrecessionSpeed
        ring1.rotation.y += dtSeconds * ringPrecessionSpeed * 0.55
        ring2.rotation.z -= dtSeconds * ringPrecessionSpeed * 0.82
        ring2.rotation.x += dtSeconds * ringPrecessionSpeed * 0.48

        ring1Material.color.copy(activeColor)
        ring2Material.color.copy(activeColor)
        ring1Material.opacity = Math.min(
          0.9,
          0.4 + snapshot.pulseEnergy * 0.4 + snapshot.synapseFlash * 0.3
        )
        ring2Material.opacity = Math.min(
          0.9,
          0.35 + snapshot.pulseEnergy * 0.4 + snapshot.synapseFlash * 0.3
        )

        // Pointer parallax dampening
        currentPointerX += (pointerTargetRef.current.x - currentPointerX) * 0.07
        currentPointerY += (pointerTargetRef.current.y - currentPointerY) * 0.07
        rootGroup.rotation.y = currentPointerX * 0.32
        rootGroup.rotation.x = -currentPointerY * 0.22

        renderer?.render(scene, camera)
        frameId = window.requestAnimationFrame(tick)
      }

      frameId = window.requestAnimationFrame(tick)
      setWebglUnavailable(false)
    } catch {
      setWebglUnavailable(true)
    }

    return () => {
      if (frameId && typeof window !== 'undefined') {
        window.cancelAnimationFrame(frameId)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      } else if (handleWindowResize && typeof window !== 'undefined') {
        window.removeEventListener('resize', handleWindowResize)
      }

      disposables.forEach((item) => {
        try {
          item.dispose()
        } catch {
          // Ignore disposal errors during teardown
        }
      })
      renderer?.dispose()
    }
  }, [bridge, isCompact])

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
      data-testid="synaptic-entity-canvas"
      className={`relative w-full h-full min-h-[140px] flex items-center justify-center overflow-hidden select-none ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {webglUnavailable ? (
        <div
          data-testid="synaptic-entity-fallback"
          className="w-full h-full min-h-[140px] flex items-center justify-center relative overflow-hidden select-none"
        >
          <div
            className="w-28 h-28 rounded-full animate-pulse"
            style={{
              background:
                'radial-gradient(circle at 40% 40%, rgba(0, 245, 212, 0.85) 0%, rgba(0, 195, 255, 0.7) 35%, rgba(7, 36, 66, 0.5) 70%, rgba(3, 7, 8, 0) 100%)',
              boxShadow: '0 0 45px rgba(0, 195, 255, 0.45)',
            }}
          />
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      )}
    </div>
  )
}

export default SynapticEntityCanvas
