import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { SynapticCoreFallback } from './SynapticCoreFallback'

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

/*
 * The synaptic core: one calm, glassy deep-sea body with a handful of fine
 * filaments. Light travels out along the filaments as reply text arrives,
 * gathers toward the centre while the Oracle is thinking, and the rim cools to
 * crimson on an error. The body leans gently toward the pointer. Nothing spins
 * on its own.
 *
 * Cost: four draw calls (halo, body, filaments, marine snow), ~30fps while
 * idle, a near-still frame for reduced motion, and paused when hidden.
 */

interface Disposable {
  dispose: () => void
}

const PULSE_SLOTS = 4

const CYAN = new THREE.Color('#00c3ff')
const CYAN_PALE = new THREE.Color('#9be7ff')
const CYAN_DEEP = new THREE.Color('#0a6f93')
const TEAL = new THREE.Color('#3fd8f2')
const CRIMSON = new THREE.Color('#ff453a')
const BODY_DEEP = new THREE.Color('#04202e')
const AQUA = new THREE.Color('#2ee6d6')

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

function createMulberry32(seed = 0x594e) {
  let s = seed >>> 0
  return function random(): number {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const damp = (current: number, target: number, rate: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-rate * dt))

// ---------------------------------------------------------------------------
// SHADERS
// ---------------------------------------------------------------------------

const SIMPLEX_NOISE_3D = `
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), vec4(0.0));
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

const BODY_VERTEX_SHADER = `
uniform float uTime;
uniform float uBreath;
uniform float uThink;
uniform float uEnergy;
uniform float uRipple;

varying vec3 vNormal;
varying vec3 vView;
varying vec3 vObject;
varying float vSwell;

${SIMPLEX_NOISE_3D}

void main() {
  // Liquid surface: slow, smooth swells, held tighter while thinking.
  vec3 warp = vec3(
    sin(position.y * 2.2 + uTime * 0.55),
    cos(position.z * 2.2 - uTime * 0.45),
    sin(position.x * 2.2 + uTime * 0.6)
  ) * 0.18;
  float swell = snoise(position * 1.15 + warp + vec3(0.0, 0.0, uTime * 0.22));
  float amp = 0.036 * (1.0 - uThink * 0.55) + uEnergy * 0.018;

  // A ripple rolls across the surface each time a chunk of the reply lands.
  float ripple = sin(dot(position, vec3(0.35, 0.8, 0.45)) * 7.0 - uTime * 7.5) * uRipple * 0.028;

  float disp = swell * amp + ripple;
  vSwell = swell * 0.5 + 0.5 + ripple * 10.0;
  vec3 displaced = position * uBreath + normal * disp;

  vObject = position;
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vView = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`

const BODY_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uEnergy;
uniform float uThink;
uniform float uFlash;
uniform float uError;
uniform vec3 uColor;
uniform vec3 uAccent;
uniform vec3 uRimColor;
uniform vec3 uDeep;
uniform vec3 uLight;

varying vec3 vNormal;
varying vec3 vView;
varying vec3 vObject;
varying float vSwell;

// Flowing ribbons of light inside the body (cheap domain-warped sines).
float currents(vec3 p, float t) {
  vec3 w1 = p * 2.4 + vec3(sin(t * 0.45 + p.y * 1.8), cos(t * 0.5 + p.z * 1.8), sin(t * 0.38 + p.x * 1.8)) * 0.6;
  vec3 w2 = w1 * 1.7 + vec3(cos(w1.y * 1.6 - t * 0.7), sin(w1.z * 1.6 + t * 0.6), cos(w1.x * 1.6 - t * 0.5)) * 0.5;
  float r1 = abs(sin(w1.x + cos(w1.y * 1.3) + sin(w1.z * 1.1)));
  float r2 = abs(cos(w2.y - sin(w2.z * 1.4) + cos(w2.x * 1.2)));
  float stream = smoothstep(0.34, 0.02, r1 * 0.58 + r2 * 0.42);
  float filament = smoothstep(0.12, 0.0, abs(r1 - r2));
  return clamp(stream * 0.7 + filament * 0.5, 0.0, 1.0);
}

void main() {
  vec3 V = normalize(vView);
  vec3 N = normalize(vNormal);
  float facing = clamp(dot(N, V), 0.0, 1.0);
  float edge = 1.0 - facing;

  float flowSpeed = 0.5 + uEnergy * 0.6 + uThink * 0.5;
  // Sampled a little inside the surface, so the light sits behind the glass.
  vec3 inside = vObject * 0.9;
  float veins = currents(inside, uTime * flowSpeed);
  float deepVeins = currents(inside.yzx * 0.8 + vec3(1.7, -0.9, 2.3), -uTime * flowSpeed * 0.7);

  // Light runs along the currents, faster while replying.
  float travel = fract(dot(vObject, vec3(1.1, 1.5, 0.9)) * 1.4 - uTime * (0.7 + uEnergy * 2.6));
  float runner = smoothstep(0.7, 1.0, travel) * veins * (0.35 + uEnergy * 0.9);

  // A bright nucleus held inside the body; it gathers while thinking.
  float nucleus = pow(facing, 3.2) * (0.42 + uThink * 0.55 + uEnergy * 0.35 + uFlash * 0.25);

  vec3 H = normalize(normalize(uLight) + V);
  float NdotH = max(dot(N, H), 0.0);
  float spec = pow(NdotH, 48.0) * 0.45;
  float sheen = pow(NdotH, 8.0) * 0.12;

  float rim = pow(edge, 5.0) * (1.25 + uEnergy * 0.5 + uFlash * 0.3 - uThink * 0.3)
            + pow(edge, 2.0) * (0.22 + uEnergy * 0.1);

  float above = N.y * 0.5 + 0.5;
  vec3 pale = vec3(0.78, 0.97, 1.0);
  float calm = 1.0 - uError;

  vec3 col = uDeep * (0.7 + above * 0.6) * (0.8 + vSwell * 0.4);
  col += mix(uColor, uAccent, 0.35 * calm) * deepVeins * (0.16 + uThink * 0.12) * (0.4 + 0.6 * facing);
  col += uColor * veins * (0.42 + uEnergy * 0.35) * (0.35 + 0.65 * facing);
  col += mix(uColor, pale, 0.55 * calm) * (nucleus + runner);
  col += uColor * sheen;
  col += uRimColor * rim;
  col += pale * (spec + veins * uFlash * 0.5);

  gl_FragColor = vec4(col, 1.0);
}
`

const FILAMENT_VERTEX_SHADER = `
uniform float uTime;
uniform float uBreath;
uniform float uThink;

attribute float aT;
attribute float aSeed;

varying float vT;
varying float vSeed;

void main() {
  vT = aT;
  vSeed = aSeed;

  // Tips drift like something resting in a slow current; the root stays put.
  float reach = aT * aT;
  vec3 drift = vec3(
    sin(uTime * 0.32 + aSeed * 6.2831 + aT * 1.8),
    cos(uTime * 0.27 + aSeed * 4.1 + aT * 1.5),
    sin(uTime * 0.23 + aSeed * 2.3)
  ) * 0.07 * reach;

  // Draw in slightly while thinking.
  vec3 pos = position * uBreath * (1.0 - uThink * 0.07 * aT) + drift;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`

const FILAMENT_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uEnergy;
uniform vec3 uColor;
uniform vec4 uPulseBirth;
uniform vec4 uPulseSeed;
uniform vec4 uPulseGain;

varying float vT;
varying float vSeed;

float pulse(float birth, float seed, float gain) {
  float age = uTime - birth;
  if (age < 0.0 || age > 2.0) return 0.0;
  // Each pulse lights about half of the filaments.
  float chosen = step(0.5, fract(vSeed * 13.71 + seed));
  float head = age * 1.05;
  float d = vT - head;
  return exp(-d * d * 60.0) * chosen * gain * (1.0 - smoothstep(0.8, 1.1, head));
}

void main() {
  float lit = pulse(uPulseBirth.x, uPulseSeed.x, uPulseGain.x)
            + pulse(uPulseBirth.y, uPulseSeed.y, uPulseGain.y)
            + pulse(uPulseBirth.z, uPulseSeed.z, uPulseGain.z)
            + pulse(uPulseBirth.w, uPulseSeed.w, uPulseGain.w);
  lit = min(lit, 1.0);

  // A soft stream always flows outward along each filament.
  float flow = fract(vT * 1.3 - uTime * (0.22 + uEnergy * 0.5) + vSeed * 7.0);
  float stream = smoothstep(0.0, 0.5, flow) * smoothstep(1.0, 0.5, flow);

  float fade = 1.0 - smoothstep(0.1, 1.0, vT);
  float alpha = (0.2 + stream * (0.32 + uEnergy * 0.3)) * fade + lit * (1.0 - vT * 0.3);
  vec3 col = mix(uColor, vec3(0.9, 0.99, 1.0), lit * 0.55 + stream * fade * 0.15);

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`

const SNOW_VERTEX_SHADER = `
uniform float uTime;
uniform float uPixelRatio;
uniform float uSizeScale;
uniform float uEnergy;

attribute float aSeed;

varying float vAlpha;
varying float vNear;

void main() {
  vec3 p = position;

  // Motes drift in a slow current around the core...
  float drift = uTime * (0.05 + aSeed * 0.05);
  float c = cos(drift), s = sin(drift);
  p = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
  p += vec3(sin(uTime * 0.3 + aSeed * 30.0), cos(uTime * 0.26 + aSeed * 21.0), sin(uTime * 0.22 + aSeed * 13.0)) * 0.08;

  // ...and are drawn in toward it while the Oracle replies.
  float cycle = fract(uTime * 0.18 + aSeed);
  float pull = uEnergy * cycle * 0.5;
  p *= 1.0 - pull;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float r = length(p);
  vNear = smoothstep(3.2, 1.3, r);
  gl_PointSize = (1.6 + aSeed * 3.4) * (1.0 + vNear * 0.6) * uPixelRatio * uSizeScale * (4.6 / -mvPosition.z);

  float twinkle = 0.65 + 0.35 * sin(uTime * 1.4 + aSeed * 40.0);
  float wrap = mix(1.0, smoothstep(1.0, 0.85, cycle) * smoothstep(0.0, 0.1, cycle), uEnergy);
  vAlpha = (0.14 + aSeed * 0.3 + vNear * 0.25) * twinkle * wrap;
}
`

const SNOW_FRAGMENT_SHADER = `
uniform vec3 uColor;
varying float vAlpha;
varying float vNear;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  float core = smoothstep(0.22, 0.0, d);
  float glow = smoothstep(0.5, 0.05, d) * 0.45;
  float a = (core + glow) * vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(mix(uColor, vec3(1.0), core * 0.4), a);
}
`

const HALO_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const HALO_FRAGMENT_SHADER = `
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;

void main() {
  float d = length(vUv - vec2(0.5)) * 2.0;
  float falloff = clamp(1.0 - d, 0.0, 1.0);
  // Wide soft bloom plus a tighter corona just outside the body.
  float a = (pow(falloff, 2.2) * 0.55 + pow(falloff, 7.0) * 0.9) * uIntensity;
  // Dither so the faint gradient doesn't band on 8-bit displays.
  a += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  gl_FragColor = vec4(uColor, a);
}
`

const MEMBRANE_VERTEX_SHADER = `
uniform float uBreath;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vObject;

void main() {
  vObject = position;
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position * uBreath, 1.0);
  vView = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`

const MEMBRANE_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uEnergy;
uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vObject;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  float edge = 1.0 - abs(dot(N, V));
  // Brightest just inside the silhouette, fading at the very edge so it never reads as a disc.
  float fresnel = pow(edge, 2.6) * (1.0 - pow(edge, 14.0));

  // Faint interference bands drifting over the outer membrane.
  vec3 q = normalize(vObject);
  float bands = sin(q.y * 9.0 + sin(q.x * 3.0 + uTime * 0.4) * 1.6 - uTime * 0.3) * 0.5 + 0.5;
  float lines = smoothstep(0.92, 1.0, bands) * 0.5;

  float alpha = fresnel * (0.07 + uEnergy * 0.06) + lines * fresnel * 0.3;
  gl_FragColor = vec4(uColor, alpha);
}
`

// ---------------------------------------------------------------------------
// BUILDERS
// ---------------------------------------------------------------------------

/** Evenly spread directions on a sphere (no clumping). */
function fibonacciDirections(count: number, rng: () => number): THREE.Vector3[] {
  const dirs: THREE.Vector3[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  const offset = rng() * Math.PI * 2
  for (let i = 0; i < count; i++) {
    const y = 1 - ((i + 0.5) / count) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i + offset
    // Flatten toward the screen plane so filaments read in silhouette, not as dots.
    dirs.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r * 0.45).normalize())
  }
  return dirs
}

/** All filaments as one tapered tube mesh, so they draw in a single call. */
function buildFilamentGeometry(count: number, rng: () => number): THREE.BufferGeometry {
  const lengthSegments = 36
  const radialSegments = 4
  const ringVerts = radialSegments + 1
  const vertsPerFilament = (lengthSegments + 1) * ringVerts

  const positions = new Float32Array(count * vertsPerFilament * 3)
  const tValues = new Float32Array(count * vertsPerFilament)
  const seeds = new Float32Array(count * vertsPerFilament)
  const indices: number[] = []

  const dirs = fibonacciDirections(count, rng)
  const up = new THREE.Vector3(0, 1, 0)
  const side = new THREE.Vector3()
  const tangent = new THREE.Vector3()
  const normal = new THREE.Vector3()
  const binormal = new THREE.Vector3()
  const point = new THREE.Vector3()

  let v = 0
  dirs.forEach((dir, f) => {
    const seed = rng()
    side.crossVectors(dir, Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up).normalize()
    const sweep = side.clone().applyAxisAngle(dir, rng() * Math.PI * 2)
    const reach = 0.6 + rng() * 0.45
    const curl = 0.35 + rng() * 0.35

    const curve = new THREE.CatmullRomCurve3([
      dir.clone().multiplyScalar(0.97),
      dir.clone().multiplyScalar(1.0 + 0.3 * reach).addScaledVector(sweep, curl * 0.25),
      dir.clone().multiplyScalar(1.0 + 0.62 * reach).addScaledVector(sweep, curl * 0.7),
      dir.clone().multiplyScalar(1.0 + 0.85 * reach).addScaledVector(sweep, curl * 1.15).addScaledVector(side, curl * 0.15),
      dir.clone().multiplyScalar(1.0 + 1.0 * reach).addScaledVector(sweep, curl * 1.6).addScaledVector(side, curl * 0.4),
    ])
    const frames = curve.computeFrenetFrames(lengthSegments, false)

    for (let s = 0; s <= lengthSegments; s++) {
      const t = s / lengthSegments
      curve.getPointAt(t, point)
      tangent.copy(frames.tangents[s])
      normal.copy(frames.normals[s])
      binormal.copy(frames.binormals[s])
      const radius = 0.015 * Math.pow(1 - t, 1.4) + 0.0015

      for (let r = 0; r <= radialSegments; r++) {
        const a = (r / radialSegments) * Math.PI * 2
        const cx = Math.cos(a) * radius
        const cy = Math.sin(a) * radius
        positions[v * 3 + 0] = point.x + normal.x * cx + binormal.x * cy
        positions[v * 3 + 1] = point.y + normal.y * cx + binormal.y * cy
        positions[v * 3 + 2] = point.z + normal.z * cx + binormal.z * cy
        tValues[v] = t
        seeds[v] = seed
        v++
      }
    }

    const base = f * vertsPerFilament
    for (let s = 0; s < lengthSegments; s++) {
      for (let r = 0; r < radialSegments; r++) {
        const a = base + s * ringVerts + r
        const b = base + (s + 1) * ringVerts + r
        indices.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aT', new THREE.BufferAttribute(tValues, 1))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setIndex(indices)
  return geometry
}

function buildSnowGeometry(count: number, rng: () => number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const theta = rng() * Math.PI * 2
    const phi = Math.acos(2 * rng() - 1)
    const r = 1.35 + Math.pow(rng(), 1.6) * 2.4
    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.8
    positions[i * 3 + 2] = r * Math.cos(phi) * 0.7
    seeds[i] = rng()
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  return geometry
}

/** Camera distance that keeps a sphere of `radius` inside both view axes. */
function fitDistance(radius: number, fovDeg: number, aspect: number): number {
  const halfV = THREE.MathUtils.degToRad(fovDeg) / 2
  const halfH = Math.atan(Math.tan(halfV) * aspect)
  return radius / Math.sin(Math.min(halfV, halfH))
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export function SynapticEntityCanvas({
  bridge,
  isCompact = false,
  className = '',
}: SynapticEntityCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
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
    const cleanups: Array<() => void> = []
    const disposables: Disposable[] = []

    try {
      const prCap = isCompact ? 1.25 : 1.5
      let currentPr = Math.min(window.devicePixelRatio || 1, prCap)

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: currentPr < 1.5,
        powerPreference: 'default',
      })
      renderer.setPixelRatio(currentPr)
      renderer.setClearColor(0x000000, 0)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40)
      const rootGroup = new THREE.Group()
      scene.add(rootGroup)

      const rng = createMulberry32(0x594e)

      // Live colours, mutated in place each frame.
      const coreColor = CYAN.clone()
      const rimColor = CYAN.clone()
      const lightDir = new THREE.Vector3(0.5, 0.65, 1)

      const time = { value: 0 }
      const breath = { value: 1 }
      const energy = { value: 0 }
      const think = { value: 0 }
      const flash = { value: 0 }
      const pixelRatio = { value: currentPr }
      const errorUniform = { value: 0 }
      const ripple = { value: 0 }

      // Halo: a soft light behind the body, sized to it (not the whole canvas).
      const haloMaterial = new THREE.ShaderMaterial({
        vertexShader: HALO_VERTEX_SHADER,
        fragmentShader: HALO_FRAGMENT_SHADER,
        uniforms: { uColor: { value: coreColor }, uIntensity: { value: 0.18 } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      })
      const haloGeometry = new THREE.PlaneGeometry(6.4, 6.4)
      const halo = new THREE.Mesh(haloGeometry, haloMaterial)
      halo.position.z = -1.4
      halo.renderOrder = -1
      scene.add(halo)
      disposables.push(haloMaterial, haloGeometry)

      // Body
      const bodyGeometry = new THREE.IcosahedronGeometry(1, isCompact ? 8 : 12)
      const bodyMaterial = new THREE.ShaderMaterial({
        vertexShader: BODY_VERTEX_SHADER,
        fragmentShader: BODY_FRAGMENT_SHADER,
        uniforms: {
          uTime: time,
          uBreath: breath,
          uEnergy: energy,
          uThink: think,
          uFlash: flash,
          uError: errorUniform,
          uRipple: ripple,
          uColor: { value: coreColor },
          uAccent: { value: AQUA.clone() },
          uRimColor: { value: rimColor },
          uDeep: { value: BODY_DEEP.clone() },
          uLight: { value: lightDir },
        },
      })
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
      rootGroup.add(body)
      disposables.push(bodyGeometry, bodyMaterial)

      // Outer membrane: a faint glassy skin that gives the body depth.
      const membraneGeometry = new THREE.IcosahedronGeometry(1.28, isCompact ? 5 : 7)
      const membraneMaterial = new THREE.ShaderMaterial({
        vertexShader: MEMBRANE_VERTEX_SHADER,
        fragmentShader: MEMBRANE_FRAGMENT_SHADER,
        uniforms: { uTime: time, uBreath: breath, uEnergy: energy, uColor: { value: rimColor } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const membrane = new THREE.Mesh(membraneGeometry, membraneMaterial)
      rootGroup.add(membrane)
      disposables.push(membraneGeometry, membraneMaterial)

      // Filaments
      const pulseBirth = new THREE.Vector4(-99, -99, -99, -99)
      const pulseSeed = new THREE.Vector4(0, 0.25, 0.5, 0.75)
      const pulseGain = new THREE.Vector4(0, 0, 0, 0)
      const filamentGeometry = buildFilamentGeometry(isCompact ? 14 : 22, rng)
      const filamentMaterial = new THREE.ShaderMaterial({
        vertexShader: FILAMENT_VERTEX_SHADER,
        fragmentShader: FILAMENT_FRAGMENT_SHADER,
        uniforms: {
          uTime: time,
          uBreath: breath,
          uThink: think,
          uEnergy: energy,
          uColor: { value: rimColor },
          uPulseBirth: { value: pulseBirth },
          uPulseSeed: { value: pulseSeed },
          uPulseGain: { value: pulseGain },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const filaments = new THREE.Mesh(filamentGeometry, filamentMaterial)
      rootGroup.add(filaments)
      disposables.push(filamentGeometry, filamentMaterial)

      // Drifting motes (outside the tilting group, so they read as depth)
      const snowGeometry = buildSnowGeometry(isCompact ? 120 : 260, rng)
      const snowMaterial = new THREE.ShaderMaterial({
        vertexShader: SNOW_VERTEX_SHADER,
        fragmentShader: SNOW_FRAGMENT_SHADER,
        uniforms: {
          uTime: time,
          uPixelRatio: pixelRatio,
          uEnergy: energy,
          uSizeScale: { value: 1 },
          uColor: { value: CYAN_PALE.clone() },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const snow = new THREE.Points(snowGeometry, snowMaterial)
      scene.add(snow)
      disposables.push(snowGeometry, snowMaterial)

      // Sizing: keep the body and filament tips in view on any aspect ratio.
      const fitRadius = 1.8
      const updateDimensions = () => {
        if (!renderer) return
        const width = container.clientWidth || 300
        const height = container.clientHeight || 300
        camera.aspect = width / height
        camera.position.set(0, 0, fitDistance(fitRadius, camera.fov, camera.aspect))
        camera.lookAt(0, 0, 0)
        camera.updateProjectionMatrix()
        renderer.setSize(width, height, false)
        // Snow stays a fixed on-screen size relative to the canvas height.
        snowMaterial.uniforms.uSizeScale.value = Math.min(1.4, Math.max(0.6, height / 700))
        if (!isRunning) renderFrame(0)
      }

      // Pointer tilt: the body leans toward the pointer and its light follows.
      const pointer = { x: 0, y: 0, active: false }
      const tilt = { x: 0, y: 0 }
      const handlePointerMove = (event: PointerEvent) => {
        if (event.pointerType === 'touch') return
        const rect = container.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return
        const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
        const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1
        pointer.x = Math.max(-1, Math.min(1, nx))
        pointer.y = Math.max(-1, Math.min(1, ny))
        pointer.active = true
      }
      const handlePointerLeave = () => {
        pointer.active = false
      }
      window.addEventListener('pointermove', handlePointerMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', handlePointerLeave)
      cleanups.push(() => {
        window.removeEventListener('pointermove', handlePointerMove)
        document.documentElement.removeEventListener('pointerleave', handlePointerLeave)
      })

      // Reduced motion
      let reducedMotion = false
      const mql = typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null
      if (mql) {
        reducedMotion = mql.matches
        const onChange = (e: MediaQueryListEvent) => {
          reducedMotion = e.matches
        }
        mql.addEventListener?.('change', onChange)
        cleanups.push(() => mql.removeEventListener?.('change', onChange))
      }

      // State smoothing
      let elapsed = 0
      let errorMix = 0
      let pulseSlot = 0
      let lastPulseAt = -99
      let lastChars = 0
      let wasStreaming = false

      const launchPulse = (gain: number) => {
        const slot = pulseSlot % PULSE_SLOTS
        pulseSlot++
        const seed = rng()
        if (slot === 0) { pulseBirth.x = elapsed; pulseSeed.x = seed; pulseGain.x = gain }
        if (slot === 1) { pulseBirth.y = elapsed; pulseSeed.y = seed; pulseGain.y = gain }
        if (slot === 2) { pulseBirth.z = elapsed; pulseSeed.z = seed; pulseGain.z = gain }
        if (slot === 3) { pulseBirth.w = elapsed; pulseSeed.w = seed; pulseGain.w = gain }
        lastPulseAt = elapsed
        if (gain > 0.6) ripple.value = Math.min(1, ripple.value + 0.6)
      }

      const renderFrame = (dt: number) => {
        const snapshot = bridge.stepFrame(dt)
        const motion = reducedMotion ? 0 : 1
        elapsed += dt * motion
        time.value = elapsed

        const streaming = snapshot.lifecycle === 'streaming'
        const activity = Math.min(1, snapshot.streamVelocity * 0.7 + snapshot.pulseEnergy * 0.5)
        energy.value = damp(energy.value, activity, 4, dt)
        think.value = damp(think.value, snapshot.thinkingTension, 3, dt)
        flash.value = damp(flash.value, snapshot.synapseFlash, 10, dt)
        errorMix = damp(errorMix, snapshot.lifecycle === 'error' ? 1 : 0, 2.5, dt)
        errorUniform.value = errorMix
        ripple.value *= Math.exp(-2.2 * dt)

        // One colour family. Brighter while replying, deeper while thinking,
        // crimson only for errors.
        coreColor.copy(CYAN).lerp(CYAN_DEEP, think.value * 0.35).lerp(CYAN_PALE, energy.value * 0.25)
        rimColor.copy(CYAN).lerp(TEAL, 0.4).lerp(CYAN_PALE, energy.value * 0.3 + snapshot.typingIntensity * 0.1)
        coreColor.lerp(CRIMSON, errorMix * 0.85)
        rimColor.lerp(CRIMSON, errorMix * 0.8)

        // Breath: slow at rest, held smaller while thinking.
        const breathe = Math.sin(elapsed * (Math.PI * 2) / 5.5) * 0.012
        breath.value = 1 + breathe * (1 - think.value * 0.6) - think.value * 0.03 + energy.value * 0.012

        // Light travels out along the filaments as text arrives.
        if (motion > 0) {
          const chars = snapshot.totalCharsStreamed
          if (streaming && (!wasStreaming || chars < lastChars)) lastChars = 0
          if (streaming && chars > lastChars && elapsed - lastPulseAt > 0.22) {
            launchPulse(0.7 + Math.min(0.3, snapshot.pulseEnergy * 0.5))
            lastChars = chars
          } else if (!streaming && snapshot.lifecycle !== 'error' && elapsed - lastPulseAt > 4.5) {
            launchPulse(0.5)
          }
        }
        wasStreaming = streaming

        haloMaterial.uniforms.uIntensity.value =
          0.42 + energy.value * 0.3 + think.value * 0.12 + flash.value * 0.15

        // Pointer tilt and light (eased; returns to centre when the pointer leaves).
        const tx = pointer.active ? pointer.x : 0
        const ty = pointer.active ? pointer.y : 0
        const ease = reducedMotion ? 1 : 1 - Math.exp(-3 * dt)
        tilt.x += (tx - tilt.x) * ease
        tilt.y += (ty - tilt.y) * ease
        // The body turns slowly so its currents roll past; faster while replying.
        body.rotation.y += dt * motion * (0.07 + energy.value * 0.18)
        body.rotation.x += dt * motion * 0.025
        membrane.rotation.y -= dt * motion * 0.03

        const lean = reducedMotion ? 0.08 : 0.22
        rootGroup.rotation.y = tilt.x * lean
        rootGroup.rotation.x = tilt.y * lean * 0.75
        lightDir.set(0.45 + tilt.x * 0.9, 0.6 - tilt.y * 0.9, 1)

        renderer?.render(scene, camera)
      }

      // Frame pacing: full rate while the Oracle is active, ~30fps at rest,
      // ~6fps for reduced motion (colour changes only).
      let isIntersecting = true
      let isVisible = !document.hidden
      let isRunning = false
      let lastMs = performance.now()
      let pendingDt = 0
      let slowSeconds = 0
      let rollingMs = 16.6

      const tick = (nowMs: number) => {
        frameId = window.requestAnimationFrame(tick)
        const rawMs = nowMs - lastMs
        lastMs = nowMs
        pendingDt += Math.min(0.1, Math.max(0, rawMs * 0.001))

        const snapshot = bridge.getSnapshot()
        const busy =
          snapshot.lifecycle === 'streaming' ||
          snapshot.lifecycle === 'thinking' ||
          energy.value > 0.02 ||
          think.value > 0.02
        const minStep = reducedMotion ? 1 / 6 : busy ? 0 : 1 / 31
        if (pendingDt < minStep) return

        const dt = Math.min(0.1, Math.max(0.001, pendingDt))
        pendingDt = 0

        // Step resolution down if frames stay slow.
        rollingMs = rollingMs * 0.9 + Math.min(rawMs, 50) * 0.1
        if (busy && rollingMs > 22 && currentPr > 1) {
          slowSeconds += dt
          if (slowSeconds > 1.5) {
            currentPr = Math.max(1, currentPr - 0.25)
            renderer?.setPixelRatio(currentPr)
            pixelRatio.value = currentPr
            slowSeconds = 0
          }
        } else {
          slowSeconds = Math.max(0, slowSeconds - dt * 0.5)
        }

        renderFrame(dt)
      }

      const checkLoop = () => {
        const shouldRun = isIntersecting && isVisible
        if (shouldRun && !isRunning) {
          isRunning = true
          lastMs = performance.now()
          pendingDt = 1
          frameId = window.requestAnimationFrame(tick)
        } else if (!shouldRun && isRunning) {
          isRunning = false
          window.cancelAnimationFrame(frameId)
          frameId = 0
        }
      }

      updateDimensions()
      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(updateDimensions)
        resizeObserver.observe(container)
        cleanups.push(() => resizeObserver.disconnect())
      } else {
        window.addEventListener('resize', updateDimensions)
        cleanups.push(() => window.removeEventListener('resize', updateDimensions))
      }

      if (typeof IntersectionObserver !== 'undefined') {
        const intersectionObserver = new IntersectionObserver(
          (entries) => {
            isIntersecting = entries[0]?.isIntersecting ?? true
            checkLoop()
          },
          { threshold: 0.05 }
        )
        intersectionObserver.observe(container)
        cleanups.push(() => intersectionObserver.disconnect())
      }

      const handleVisibilityChange = () => {
        isVisible = !document.hidden
        checkLoop()
      }
      document.addEventListener('visibilitychange', handleVisibilityChange)
      cleanups.push(() => document.removeEventListener('visibilitychange', handleVisibilityChange))

      checkLoop()
      setWebglUnavailable(false)
    } catch {
      setWebglUnavailable(true)
    }

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      cleanups.forEach((fn) => fn())
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

  return (
    <div
      ref={containerRef}
      data-testid="synaptic-entity-canvas"
      className={`relative w-full h-full min-h-[140px] flex items-center justify-center overflow-hidden select-none ${className}`}
    >
      {webglUnavailable ? <SynapticCoreFallback /> : (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="block w-full h-full"
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      )}
    </div>
  )
}

export default SynapticEntityCanvas
