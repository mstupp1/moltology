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

interface Disposable {
  dispose: () => void
}

interface SharedUniforms {
  uTime: { value: number }
  uStreamVelocity: { value: number }
  uPulseEnergy: { value: number }
  uThinkingTension: { value: number }
  uTypingIntensity: { value: number }
  uSynapseFlash: { value: number }
  uColorShift: { value: number }
  uReducedMotion: { value: number }
  uPixelRatio: { value: number }
  uColor: { value: THREE.Color }
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

function createMulberry32(seed = 0x594e) {
  let s = seed >>> 0
  return function random(): number {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createRadialGlowTexture(type: 'corona' | 'wide'): THREE.Texture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  if (type === 'corona') {
    gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)')
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.85)')
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)')
    gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)')
  } else {
    gradient.addColorStop(0.0, 'rgba(255, 255, 255, 0.7)')
    gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.35)')
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)')
    gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)')
  }
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// ---------------------------------------------------------------------------
// SHADERS
// ---------------------------------------------------------------------------

const ASHIMA_SIMPLEX_NOISE_3D = `
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

float simplex2(vec3 p, float t) {
  float n = snoise(p + vec3(0.0, 0.0, t * 0.35));
  n += 0.5 * snoise(p * 2.08 - vec3(0.0, t * 0.55, 0.0));
  return n;
}
`

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

${ASHIMA_SIMPLEX_NOISE_3D}

void main() {
  vNormal = normalize(normalMatrix * normal);
  
  float motionScale = mix(1.0, 0.15, uReducedMotion);
  
  float baseWave = simplex2(position * 1.15, uTime * 0.85 * motionScale);
  
  // High-frequency radial contraction & tremor during thinking
  float thinkingTremor = sin(uTime * 32.0 * motionScale + position.x * 14.0 + position.y * 16.0) * uThinkingTension * 0.045;
  float thinkingContract = -uThinkingTension * 0.12;
  
  // Streaming outward ripple with token energy
  float streamWave = sin(length(position) * 6.5 - uTime * 6.5 * motionScale);
  float streamRipple = streamWave * (uStreamVelocity * 0.08 + uPulseEnergy * 0.14);
  
  // Typing gentle hum
  float typingHum = sin(position.y * 5.5 + uTime * 3.2 * motionScale) * uTypingIntensity * 0.035;
  
  float disp = (baseWave * 0.08 + streamRipple + thinkingTremor + thinkingContract + typingHum) * motionScale;
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
uniform float uStreamVelocity;
uniform float uSynapseFlash;
uniform vec3 uColor;

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
  
  // (b) Iridescent thin-film rim: fresnel-driven hue shift towards complementary tint
  vec3 iridTint = vec3(activeHue.b * 0.85 + 0.15, activeHue.r * 0.4 + 0.1, activeHue.g * 0.8 + 0.2);
  vec3 rimColor = mix(activeHue, iridTint, fresnel * 0.75);
  
  float creviceDepth = smoothstep(0.06, -0.06, vDisplacement);
  vec3 creviceColor = mix(abyssalTrench, abyssalDeep, creviceDepth);
  
  // (a) Veins that carry traveling energy pulses (speed rises with streamVelocity)
  float veins = synapticVeins(vPosition, uTime * 0.5);
  float pulseTravel = fract(dot(vPosition, vec3(1.3, 1.7, 1.1)) * 2.0 - uTime * (1.5 + uStreamVelocity * 5.0));
  float travelingPulse = smoothstep(0.7, 1.0, pulseTravel) * veins * (0.6 + uStreamVelocity * 0.9 + uPulseEnergy * 0.5);
  
  // (c) Fake subsurface inner glow
  float innerGlow = pow(NdotV, 2.2) * (0.35 + uPulseEnergy * 0.35);
  
  // (d) SynapseFlash makes veins flare white-hot
  vec3 hotWhite = vec3(0.96, 0.98, 1.0);
  float hotSpot = veins * (uSynapseFlash * 2.2 + uPulseEnergy * 0.4) + travelingPulse * 0.85;
  
  vec3 bodyColor = mix(creviceColor, activeHue, 0.28 + veins * 0.42 + fresnel * 0.55);
  bodyColor += activeHue * (innerGlow * 0.7 + travelingPulse * 0.6);
  bodyColor += rimColor * (fresnel * (0.75 + uSynapseFlash * 0.6));
  bodyColor += hotWhite * hotSpot;
  
  float alpha = clamp(0.92 + fresnel * 0.08, 0.0, 1.0);
  gl_FragColor = vec4(bodyColor, alpha);
}
`

const SYNAPSE_LINE_VERTEX_SHADER = `
attribute float aT;
attribute float aPhase;

varying float vT;
varying float vPhase;

void main() {
  vT = aT;
  vPhase = aPhase;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`

const SYNAPSE_LINE_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uStreamVelocity;
uniform float uPulseEnergy;
uniform float uThinkingTension;
uniform float uSynapseFlash;
uniform float uReducedMotion;
uniform vec3 uColor;

varying float vT;
varying float vPhase;

void main() {
  float motionScale = mix(1.0, 0.2, uReducedMotion);
  float speed = 1.0 + uStreamVelocity * 3.5 + uPulseEnergy * 1.5;
  float pulseHead = fract(uTime * speed * 0.35 * motionScale + vPhase);
  
  float dist = abs(vT - pulseHead);
  float pulse = smoothstep(0.18, 0.0, dist);
  
  float flicker = 1.0 - uThinkingTension * 0.45 * sin(uTime * 32.0 * motionScale + vPhase * 8.0);
  
  float baseAlpha = 0.12;
  float pulseBrightness = (0.55 + uPulseEnergy * 0.45 + uStreamVelocity * 0.35 + uSynapseFlash * 0.8) * flicker;
  
  vec3 col = mix(uColor * 0.8, vec3(1.0), pulse * 0.65 + uSynapseFlash * 0.5);
  float alpha = baseAlpha + pulse * pulseBrightness;
  
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`

const SYNAPSE_POINT_VERTEX_SHADER = `
uniform float uPixelRatio;
uniform float uTime;
uniform float uReducedMotion;
uniform float uPulseEnergy;
uniform float uSynapseFlash;

attribute float aPhase;
varying float vTwinkle;

void main() {
  float motionScale = mix(1.0, 0.2, uReducedMotion);
  float tw = 0.65 + 0.35 * sin(uTime * 3.0 * motionScale + aPhase);
  vTwinkle = tw;
  
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float pSize = (11.0 + uPulseEnergy * 6.0 + uSynapseFlash * 10.0) * tw;
  gl_PointSize = (pSize * uPixelRatio) / -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
`

const SYNAPSE_POINT_FRAGMENT_SHADER = `
uniform vec3 uColor;
uniform float uSynapseFlash;
varying float vTwinkle;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float d = length(coord);
  if (d > 0.5) discard;
  
  float falloff = smoothstep(0.5, 0.0, d);
  vec3 col = mix(uColor, vec3(1.0), falloff * (0.6 + uSynapseFlash * 0.4));
  float alpha = falloff * vTwinkle * (0.75 + uSynapseFlash * 0.25);
  gl_FragColor = vec4(col, alpha);
}
`

const HALO_VERTEX_SHADER = `
uniform float uTime;
uniform float uStreamVelocity;
uniform float uPulseEnergy;
uniform float uThinkingTension;
uniform float uSynapseFlash;
uniform float uReducedMotion;
uniform float uPixelRatio;

attribute float aSeed;
attribute float aSize;

varying float vAlpha;
varying float vSeed;

void main() {
  float motionScale = mix(1.0, 0.15, uReducedMotion);
  
  // Spiral inward with streamVelocity for an 'ingesting tokens' feel:
  // radius contracts over each cycle and the particle twists as it falls.
  float spiralCycle = fract(uTime * 0.35 * motionScale + aSeed);
  float ingest = uStreamVelocity * spiralCycle;

  float angle = uTime * (0.1 + aSeed * 0.3) * motionScale + ingest * 2.4;
  float cosA = cos(angle);
  float sinA = sin(angle);
  
  vec3 p = position;
  vec3 orbitedPos = vec3(
    p.x * cosA - p.z * sinA,
    p.y,
    p.x * sinA + p.z * cosA
  );
  
  float spiralFactor = 1.0 - 0.5 * ingest;
  orbitedPos *= spiralFactor;
  // Fade out near the end of each cycle so the reset to the outer shell is invisible
  float wrapFade = mix(1.0, smoothstep(1.0, 0.8, spiralCycle) * smoothstep(0.0, 0.08, spiralCycle), uStreamVelocity);
  
  // Thinking adds jitter
  float jitter = sin(uTime * 28.0 * motionScale + aSeed * 50.0) * uThinkingTension * 0.08;
  orbitedPos += vec3(jitter, -jitter * 0.5, jitter * 0.7);
  
  vec4 mvPosition = modelViewMatrix * vec4(orbitedPos, 1.0);
  float scaleFactor = 1.0 + uPulseEnergy * 0.45 + uSynapseFlash * 0.6;
  gl_PointSize = (aSize * scaleFactor * uPixelRatio) / -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
  
  float twinkle = 0.5 + 0.5 * sin(uTime * 2.5 * motionScale + aSeed * 25.0);
  vAlpha = (0.35 + 0.45 * twinkle + uStreamVelocity * 0.25 + uSynapseFlash * 0.35) * wrapFade;
  vSeed = aSeed;
}
`

const HALO_FRAGMENT_SHADER = `
uniform vec3 uColor;
uniform float uSynapseFlash;

varying float vAlpha;
varying float vSeed;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  float falloff = smoothstep(0.5, 0.04, dist);
  vec3 col = mix(uColor, vec3(1.0), falloff * (0.35 + uSynapseFlash * 0.65));
  gl_FragColor = vec4(col, falloff * vAlpha);
}
`

const RING_VERTEX_SHADER = `
varying vec2 vLocalPos;

void main() {
  vLocalPos = position.xy;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`

const RING_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uStreamVelocity;
uniform float uPulseEnergy;
uniform float uSynapseFlash;
uniform float uReducedMotion;
uniform vec3 uColor;
uniform float uDashCount;
uniform float uRingSpeed;
uniform float uScanDir;

varying vec2 vLocalPos;

void main() {
  float angle = atan(vLocalPos.y, vLocalPos.x);
  float normAngle = (angle + 3.14159265) / 6.2831853;
  
  float motionScale = mix(1.0, 0.2, uReducedMotion);
  float scroll = uTime * (0.1 + uStreamVelocity * 0.4) * motionScale * uRingSpeed;
  
  float dash = step(0.4, fract(normAngle * uDashCount + scroll));
  
  float scanHead = fract(normAngle * uScanDir - uTime * (0.25 + uStreamVelocity * 0.7) * motionScale);
  float scanGlow = pow(max(0.0, 1.0 - scanHead), 5.0);
  
  float pattern = dash * 0.45 + scanGlow * 1.6;
  float baseAlpha = 0.25 + uPulseEnergy * 0.35 + uSynapseFlash * 0.4;
  
  vec3 col = mix(uColor, vec3(1.0), scanGlow * 0.7 + uSynapseFlash * 0.4);
  gl_FragColor = vec4(col, clamp(pattern * baseAlpha, 0.0, 1.0));
}
`

const EXOSKELETON_VERTEX_SHADER = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`

const EXOSKELETON_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uPulseEnergy;
uniform float uStreamVelocity;
uniform float uSynapseFlash;
uniform float uReducedMotion;
uniform vec3 uColor;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;

void main() {
  vec3 viewDir = normalize(vViewPosition);
  vec3 norm = normalize(vNormal);
  float NdotV = max(0.0, dot(norm, viewDir));
  float fresnel = pow(1.0 - NdotV, 2.5);
  
  float motionScale = mix(1.0, 0.2, uReducedMotion);
  float scanY = sin(uTime * (1.2 + uStreamVelocity * 2.0) * motionScale) * 1.4;
  float scanDist = abs(vPosition.y - scanY);
  float scanBand = smoothstep(0.35, 0.0, scanDist);
  
  float baseAlpha = 0.18 + fresnel * 0.45 + scanBand * 0.4;
  float alpha = baseAlpha * (0.5 + uPulseEnergy * 0.35 + uSynapseFlash * 0.4);
  
  vec3 col = mix(uColor, vec3(1.0), scanBand * 0.5 + uSynapseFlash * 0.5);
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`

// ---------------------------------------------------------------------------
// BUILDER HELPERS
// ---------------------------------------------------------------------------

function buildCore(
  isCompact: boolean,
  sharedUniforms: SharedUniforms,
  disposables: Disposable[]
): THREE.Mesh {
  // PolyhedronGeometry detail N => 20 * (N + 1)^2 faces (14 => ~4.5k tris, 8 => ~1.6k tris)
  const coreDetail = isCompact ? 8 : 14
  const coreGeo = new THREE.IcosahedronGeometry(1.15, coreDetail)
  const coreMaterial = new THREE.ShaderMaterial({
    vertexShader: CORE_VERTEX_SHADER,
    fragmentShader: CORE_FRAGMENT_SHADER,
    uniforms: {
      ...sharedUniforms,
    },
    transparent: true,
    depthWrite: true,
  })
  const coreMesh = new THREE.Mesh(coreGeo, coreMaterial)
  disposables.push(coreGeo, coreMaterial)
  return coreMesh
}

function buildGlowSprites(
  isCompact: boolean,
  disposables: Disposable[]
): {
  group: THREE.Group
  coronaSprite: THREE.Sprite
  wideSprite: THREE.Sprite
  coronaMaterial: THREE.SpriteMaterial
  wideMaterial: THREE.SpriteMaterial
} {
  const group = new THREE.Group()

  const coronaTex = createRadialGlowTexture('corona')
  const wideTex = createRadialGlowTexture('wide')
  if (coronaTex) disposables.push(coronaTex)
  if (wideTex) disposables.push(wideTex)

  const coronaMaterial = new THREE.SpriteMaterial({
    map: coronaTex ?? undefined,
    color: 0x00c3ff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const coronaSprite = new THREE.Sprite(coronaMaterial)
  coronaSprite.renderOrder = -1
  const coronaScale = isCompact ? 2.6 : 3.0
  coronaSprite.scale.set(coronaScale, coronaScale, 1.0)
  group.add(coronaSprite)
  disposables.push(coronaMaterial)

  const wideMaterial = new THREE.SpriteMaterial({
    map: wideTex ?? undefined,
    color: 0x00c3ff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const wideSprite = new THREE.Sprite(wideMaterial)
  wideSprite.renderOrder = -2
  const wideScale = isCompact ? 5.2 : 6.4
  wideSprite.scale.set(wideScale, wideScale, 1.0)
  group.add(wideSprite)
  disposables.push(wideMaterial)

  return { group, coronaSprite, wideSprite, coronaMaterial, wideMaterial }
}

function buildSynapseNetwork(
  isCompact: boolean,
  rng: () => number,
  sharedUniforms: SharedUniforms,
  disposables: Disposable[]
): THREE.Group {
  const group = new THREE.Group()
  const nodeCount = isCompact ? 45 : 90
  const nodePositions: THREE.Vector3[] = []

  for (let i = 0; i < nodeCount; i++) {
    const u = rng()
    const v = rng()
    const theta = u * 2.0 * Math.PI
    const phi = Math.acos(2.0 * v - 1.0)
    const r = 1.28 + rng() * 0.28
    const sinPhi = Math.sin(phi)
    nodePositions.push(
      new THREE.Vector3(
        r * sinPhi * Math.cos(theta),
        r * sinPhi * Math.sin(theta),
        r * Math.cos(phi)
      )
    )
  }

  // Connect each node to 2-3 nearest neighbors, dedupe edges
  const edgeSet = new Set<string>()
  const edges: { from: number; to: number; phase: number }[] = []

  for (let i = 0; i < nodeCount; i++) {
    const dists: { index: number; distSq: number }[] = []
    for (let j = 0; j < nodeCount; j++) {
      if (i === j) continue
      dists.push({ index: j, distSq: nodePositions[i].distanceToSquared(nodePositions[j]) })
    }
    dists.sort((a, b) => a.distSq - b.distSq)

    const kNeighbors = rng() > 0.4 ? 3 : 2
    for (let k = 0; k < Math.min(kNeighbors, dists.length); k++) {
      const target = dists[k].index
      const minIdx = Math.min(i, target)
      const maxIdx = Math.max(i, target)
      const key = `${minIdx}_${maxIdx}`
      if (!edgeSet.has(key)) {
        edgeSet.add(key)
        edges.push({ from: minIdx, to: maxIdx, phase: rng() * 100.0 })
      }
    }
  }

  // Build LineSegments
  const segmentCount = edges.length
  const linePos = new Float32Array(segmentCount * 2 * 3)
  const lineT = new Float32Array(segmentCount * 2)
  const linePhase = new Float32Array(segmentCount * 2)

  for (let e = 0; e < segmentCount; e++) {
    const edge = edges[e]
    const p1 = nodePositions[edge.from]
    const p2 = nodePositions[edge.to]

    linePos[e * 6 + 0] = p1.x
    linePos[e * 6 + 1] = p1.y
    linePos[e * 6 + 2] = p1.z
    lineT[e * 2 + 0] = 0.0
    linePhase[e * 2 + 0] = edge.phase

    linePos[e * 6 + 3] = p2.x
    linePos[e * 6 + 4] = p2.y
    linePos[e * 6 + 5] = p2.z
    lineT[e * 2 + 1] = 1.0
    linePhase[e * 2 + 1] = edge.phase
  }

  const lineGeo = new THREE.BufferGeometry()
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3))
  lineGeo.setAttribute('aT', new THREE.BufferAttribute(lineT, 1))
  lineGeo.setAttribute('aPhase', new THREE.BufferAttribute(linePhase, 1))

  const lineMaterial = new THREE.ShaderMaterial({
    vertexShader: SYNAPSE_LINE_VERTEX_SHADER,
    fragmentShader: SYNAPSE_LINE_FRAGMENT_SHADER,
    uniforms: {
      ...sharedUniforms,
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const linesMesh = new THREE.LineSegments(lineGeo, lineMaterial)
  group.add(linesMesh)
  disposables.push(lineGeo, lineMaterial)

  // Build Node Points
  const pointPos = new Float32Array(nodeCount * 3)
  const pointPhase = new Float32Array(nodeCount)
  for (let i = 0; i < nodeCount; i++) {
    pointPos[i * 3 + 0] = nodePositions[i].x
    pointPos[i * 3 + 1] = nodePositions[i].y
    pointPos[i * 3 + 2] = nodePositions[i].z
    pointPhase[i] = rng() * 6.2831853
  }
  const pointGeo = new THREE.BufferGeometry()
  pointGeo.setAttribute('position', new THREE.BufferAttribute(pointPos, 3))
  pointGeo.setAttribute('aPhase', new THREE.BufferAttribute(pointPhase, 1))

  const pointMaterial = new THREE.ShaderMaterial({
    vertexShader: SYNAPSE_POINT_VERTEX_SHADER,
    fragmentShader: SYNAPSE_POINT_FRAGMENT_SHADER,
    uniforms: {
      ...sharedUniforms,
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const pointsMesh = new THREE.Points(pointGeo, pointMaterial)
  group.add(pointsMesh)
  disposables.push(pointGeo, pointMaterial)

  return group
}

function buildParticleHalo(
  isCompact: boolean,
  rng: () => number,
  sharedUniforms: SharedUniforms,
  disposables: Disposable[]
): THREE.Points {
  const particleCount = isCompact ? 300 : 700
  const positions = new Float32Array(particleCount * 3)
  const seeds = new Float32Array(particleCount)
  const sizes = new Float32Array(particleCount)

  const baseSize = isCompact ? 10.0 : 13.5
  for (let i = 0; i < particleCount; i++) {
    const u = rng()
    const v = rng()
    const theta = u * 2.0 * Math.PI
    const phi = Math.acos(2.0 * v - 1.0)
    const r = 1.6 + rng() * 1.3
    const sinPhi = Math.sin(phi)

    positions[i * 3 + 0] = r * sinPhi * Math.cos(theta)
    positions[i * 3 + 1] = r * sinPhi * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)

    seeds[i] = rng()
    sizes[i] = baseSize * (0.65 + rng() * 0.7)
  }

  const haloGeo = new THREE.BufferGeometry()
  haloGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  haloGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  haloGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))

  const haloMaterial = new THREE.ShaderMaterial({
    vertexShader: HALO_VERTEX_SHADER,
    fragmentShader: HALO_FRAGMENT_SHADER,
    uniforms: {
      ...sharedUniforms,
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  const haloPoints = new THREE.Points(haloGeo, haloMaterial)
  disposables.push(haloGeo, haloMaterial)
  return haloPoints
}

function buildDataRings(
  sharedUniforms: SharedUniforms,
  disposables: Disposable[]
): {
  group: THREE.Group
  ring1: THREE.Mesh
  ring2: THREE.Mesh
  ring3: THREE.Mesh
} {
  const group = new THREE.Group()

  const createRingMaterial = (dashCount: number, ringSpeed: number, scanDir: number) => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: RING_VERTEX_SHADER,
      fragmentShader: RING_FRAGMENT_SHADER,
      uniforms: {
        ...sharedUniforms,
        uDashCount: { value: dashCount },
        uRingSpeed: { value: ringSpeed },
        uScanDir: { value: scanDir },
      },
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    disposables.push(mat)
    return mat
  }

  const ring1Geo = new THREE.RingGeometry(1.68, 1.72, 128)
  const ring1Mat = createRingMaterial(36.0, 1.0, 1.0)
  const ring1 = new THREE.Mesh(ring1Geo, ring1Mat)
  ring1.rotation.x = Math.PI * 0.35
  ring1.rotation.y = Math.PI * 0.15
  group.add(ring1)
  disposables.push(ring1Geo)

  const ring2Geo = new THREE.RingGeometry(1.88, 1.92, 128)
  const ring2Mat = createRingMaterial(48.0, -1.2, -1.0)
  const ring2 = new THREE.Mesh(ring2Geo, ring2Mat)
  ring2.rotation.x = -Math.PI * 0.4
  ring2.rotation.y = -Math.PI * 0.25
  group.add(ring2)
  disposables.push(ring2Geo)

  const ring3Geo = new THREE.RingGeometry(2.08, 2.12, 128)
  const ring3Mat = createRingMaterial(60.0, 1.5, 1.0)
  const ring3 = new THREE.Mesh(ring3Geo, ring3Mat)
  ring3.rotation.x = Math.PI * 0.6
  ring3.rotation.z = Math.PI * 0.3
  group.add(ring3)
  disposables.push(ring3Geo)

  return { group, ring1, ring2, ring3 }
}

function buildExoskeleton(
  sharedUniforms: SharedUniforms,
  disposables: Disposable[]
): THREE.Mesh {
  const exoGeo = new THREE.IcosahedronGeometry(1.38, 2)
  const exoMaterial = new THREE.ShaderMaterial({
    vertexShader: EXOSKELETON_VERTEX_SHADER,
    fragmentShader: EXOSKELETON_FRAGMENT_SHADER,
    uniforms: {
      ...sharedUniforms,
    },
    wireframe: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const exoMesh = new THREE.Mesh(exoGeo, exoMaterial)
  disposables.push(exoGeo, exoMaterial)
  return exoMesh
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
    let intersectionObserver: IntersectionObserver | null = null
    let mql: MediaQueryList | null = null
    let handleMqlChange: ((e: MediaQueryListEvent) => void) | null = null
    let handleVisibilityChange: (() => void) | null = null

    const disposables: Disposable[] = []

    try {
      const initialCap = isCompact ? 1.5 : 1.75
      const initialPr = Math.min(
        typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
        initialCap
      )
      let currentPr = initialPr

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: initialPr < 1.5,
        powerPreference: 'high-performance',
      })
      renderer.setPixelRatio(currentPr)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.1

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50)
      camera.position.set(0, 0, isCompact ? 5.1 : 4.65)
      camera.lookAt(0, 0, 0)

      const rootGroup = new THREE.Group()
      scene.add(rootGroup)

      const cyanColor = new THREE.Color(0x00c3ff)
      const emeraldColor = new THREE.Color(0x00f5d4)
      const crimsonColor = new THREE.Color(0xff453a)
      const coralColor = new THREE.Color(0xff6a60)
      const activeColor = new THREE.Color(0x00c3ff)
      const crimsonShiftColor = new THREE.Color()

      const sharedUniforms: SharedUniforms = {
        uTime: { value: 0 },
        uStreamVelocity: { value: 0 },
        uPulseEnergy: { value: 0 },
        uThinkingTension: { value: 0 },
        uTypingIntensity: { value: 0 },
        uSynapseFlash: { value: 0 },
        uColorShift: { value: 0 },
        uReducedMotion: { value: 0 },
        uPixelRatio: { value: currentPr },
        uColor: { value: activeColor },
      }

      const rng = createMulberry32(0x594e)

      // Layer 2 Bloom sprites (renderOrder -1, -2 behind core)
      const glow = buildGlowSprites(isCompact, disposables)
      rootGroup.add(glow.group)

      // Layer 1: Organic Bioluminescent Core
      const coreMesh = buildCore(isCompact, sharedUniforms, disposables)
      rootGroup.add(coreMesh)

      // Layer 6: Chitin Exoskeleton Lattice
      const exoskeletonMesh = buildExoskeleton(sharedUniforms, disposables)
      rootGroup.add(exoskeletonMesh)

      // Layer 3: Synapse Network (lines + glowing points)
      const synapseGroup = buildSynapseNetwork(isCompact, rng, sharedUniforms, disposables)
      rootGroup.add(synapseGroup)

      // Layer 4: Particle Halo
      const haloPoints = buildParticleHalo(isCompact, rng, sharedUniforms, disposables)
      rootGroup.add(haloPoints)

      // Layer 5: Data Rings
      const rings = buildDataRings(sharedUniforms, disposables)
      rootGroup.add(rings.group)

      const updateDimensions = () => {
        if (!container || !renderer || !camera) return
        const width = container.clientWidth || 300
        const height = container.clientHeight || 300
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height, false)
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

      // Prefers-reduced-motion caching
      let prefersReducedMotion = false
      if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        mql = window.matchMedia('(prefers-reduced-motion: reduce)')
        prefersReducedMotion = mql.matches
        handleMqlChange = (e: MediaQueryListEvent) => {
          prefersReducedMotion = e.matches
        }
        if (typeof mql.addEventListener === 'function') {
          mql.addEventListener('change', handleMqlChange)
        } else if (
          typeof (mql as unknown as { addListener: (cb: (e: MediaQueryListEvent) => void) => void })
            .addListener === 'function'
        ) {
          ;(
            mql as unknown as { addListener: (cb: (e: MediaQueryListEvent) => void) => void }
          ).addListener(handleMqlChange)
        }
      }

      let currentPointerX = 0
      let currentPointerY = 0
      let lastTimeMs = performance.now()
      let elapsedTotal = 0
      let rollingFrameTimeMs = 16.6
      let slowAccumulatorSeconds = 0

      let isIntersecting = true
      let isVisible = typeof document !== 'undefined' ? !document.hidden : true
      let isRunning = false

      const tick = (nowMs: number) => {
        const rawDtMs = nowMs - lastTimeMs
        const dtSeconds = Math.min(0.1, Math.max(0.001, rawDtMs * 0.001))
        lastTimeMs = nowMs

        // Adaptive resolution step down (sustained >20ms for ~1.5s).
        // Samples are clamped so one long frame (GC, tab switch) can't trigger a downgrade.
        rollingFrameTimeMs = rollingFrameTimeMs * 0.9 + Math.min(rawDtMs, 50) * 0.1
        if (rollingFrameTimeMs > 20.0 && currentPr > 1.0) {
          slowAccumulatorSeconds += dtSeconds
          if (slowAccumulatorSeconds >= 1.5) {
            currentPr = Math.max(1.0, currentPr - 0.25)
            renderer?.setPixelRatio(currentPr)
            sharedUniforms.uPixelRatio.value = currentPr
            slowAccumulatorSeconds = 0
          }
        } else {
          slowAccumulatorSeconds = Math.max(0, slowAccumulatorSeconds - dtSeconds * 0.5)
        }

        const snapshot = bridge.stepFrame(dtSeconds, nowMs)
        const motionScale = prefersReducedMotion ? 0.15 : 1.0
        elapsedTotal += dtSeconds * motionScale

        // Shared uniform updates
        sharedUniforms.uTime.value = elapsedTotal
        sharedUniforms.uStreamVelocity.value = snapshot.streamVelocity
        sharedUniforms.uPulseEnergy.value = snapshot.pulseEnergy
        sharedUniforms.uThinkingTension.value = snapshot.thinkingTension
        sharedUniforms.uTypingIntensity.value = snapshot.typingIntensity
        sharedUniforms.uSynapseFlash.value = snapshot.synapseFlash
        sharedUniforms.uColorShift.value = snapshot.colorShift
        sharedUniforms.uReducedMotion.value = prefersReducedMotion ? 1.0 : 0.0

        // Palette blending
        if (snapshot.colorShift < 0.45) {
          activeColor.lerpColors(cyanColor, emeraldColor, snapshot.colorShift / 0.45)
        } else {
          const f = Math.min(1.0, (snapshot.colorShift - 0.45) / 0.45)
          crimsonShiftColor.lerpColors(
            crimsonColor,
            coralColor,
            Math.max(0.0, Math.min(1.0, (snapshot.colorShift - 0.88) * 8.0))
          )
          activeColor.lerpColors(emeraldColor, crimsonShiftColor, f)
        }

        // Bloom billboards breathing
        const coronaBaseScale = isCompact ? 2.6 : 3.0
        const coronaScale =
          coronaBaseScale *
          (1.0 +
            snapshot.pulseEnergy * 0.18 +
            snapshot.synapseFlash * 0.35 +
            snapshot.streamVelocity * 0.12)
        glow.coronaSprite.scale.set(coronaScale, coronaScale, 1.0)
        glow.coronaMaterial.color.copy(activeColor)
        glow.coronaMaterial.opacity = Math.min(
          1.0,
          0.6 +
            snapshot.pulseEnergy * 0.25 +
            snapshot.synapseFlash * 0.4 +
            snapshot.streamVelocity * 0.15
        )

        const wideBaseScale = isCompact ? 5.2 : 6.4
        const wideScale =
          wideBaseScale *
          (1.0 + snapshot.pulseEnergy * 0.22 + snapshot.synapseFlash * 0.3)
        glow.wideSprite.scale.set(wideScale, wideScale, 1.0)
        glow.wideMaterial.color.copy(activeColor)
        glow.wideMaterial.opacity = Math.min(
          0.8,
          0.25 + snapshot.pulseEnergy * 0.2 + snapshot.synapseFlash * 0.35
        )

        // Core mesh orbital breathing rotation
        const coreSpeed =
          (0.28 + snapshot.streamVelocity * 0.65 + snapshot.thinkingTension * 0.35) * motionScale
        coreMesh.rotation.y += dtSeconds * coreSpeed
        coreMesh.rotation.x += dtSeconds * coreSpeed * 0.4

        // Exoskeleton lattice dynamics
        const exoScale = 1.0 - snapshot.thinkingTension * 0.12 + snapshot.pulseEnergy * 0.16
        exoskeletonMesh.scale.setScalar(exoScale)
        const exoSpeed =
          (0.32 + snapshot.streamVelocity * 0.8 + snapshot.thinkingTension * 0.55) * motionScale
        exoskeletonMesh.rotation.y -= dtSeconds * exoSpeed * 1.15
        exoskeletonMesh.rotation.x -= dtSeconds * exoSpeed * 0.8
        exoskeletonMesh.rotation.z += dtSeconds * exoSpeed * 0.35

        // Synapse network rotation
        const synapseSpeed =
          (0.18 + snapshot.streamVelocity * 0.45 + snapshot.pulseEnergy * 0.2) * motionScale
        synapseGroup.rotation.y += dtSeconds * synapseSpeed
        synapseGroup.rotation.x += dtSeconds * synapseSpeed * 0.3

        // Orbital rings gyroscopic precession
        const ringPrecessionSpeed =
          (0.45 + snapshot.streamVelocity * 1.5 + snapshot.thinkingTension * 0.8) * motionScale
        rings.ring1.rotation.z += dtSeconds * ringPrecessionSpeed
        rings.ring1.rotation.y += dtSeconds * ringPrecessionSpeed * 0.55
        rings.ring2.rotation.z -= dtSeconds * ringPrecessionSpeed * 0.82
        rings.ring2.rotation.x += dtSeconds * ringPrecessionSpeed * 0.48
        rings.ring3.rotation.y += dtSeconds * ringPrecessionSpeed * 0.7
        rings.ring3.rotation.z += dtSeconds * ringPrecessionSpeed * 0.35

        // Pointer parallax + subtle sinusoidal idle drift
        const idleSwayX = Math.sin(elapsedTotal * 0.6) * 0.04 * motionScale
        const idleSwayY = Math.cos(elapsedTotal * 0.45) * 0.03 * motionScale

        currentPointerX += (pointerTargetRef.current.x - currentPointerX) * 0.07
        currentPointerY += (pointerTargetRef.current.y - currentPointerY) * 0.07

        rootGroup.rotation.y = (currentPointerX + idleSwayX) * 0.32
        rootGroup.rotation.x = (-currentPointerY + idleSwayY) * 0.22

        renderer?.render(scene, camera)
        frameId = window.requestAnimationFrame(tick)
      }

      const checkLoop = () => {
        if (isIntersecting && isVisible) {
          if (!isRunning) {
            isRunning = true
            lastTimeMs = performance.now()
            frameId = window.requestAnimationFrame(tick)
          }
        } else {
          if (isRunning) {
            isRunning = false
            if (frameId && typeof window !== 'undefined') {
              window.cancelAnimationFrame(frameId)
              frameId = 0
            }
          }
        }
      }

      if (typeof IntersectionObserver !== 'undefined' && container) {
        intersectionObserver = new IntersectionObserver(
          (entries) => {
            const entry = entries[0]
            isIntersecting = entry ? entry.isIntersecting : true
            checkLoop()
          },
          { threshold: 0.05 }
        )
        intersectionObserver.observe(container)
      }

      handleVisibilityChange = () => {
        isVisible = typeof document !== 'undefined' ? !document.hidden : true
        checkLoop()
      }
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange)
      }

      isRunning = true
      lastTimeMs = performance.now()
      frameId = window.requestAnimationFrame(tick)
      setWebglUnavailable(false)
    } catch {
      setWebglUnavailable(true)
    }

    return () => {
      if (frameId && typeof window !== 'undefined') {
        window.cancelAnimationFrame(frameId)
      }
      if (intersectionObserver) {
        intersectionObserver.disconnect()
      }
      if (handleVisibilityChange && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      } else if (handleWindowResize && typeof window !== 'undefined') {
        window.removeEventListener('resize', handleWindowResize)
      }
      if (mql && handleMqlChange) {
        if (typeof mql.removeEventListener === 'function') {
          mql.removeEventListener('change', handleMqlChange)
        } else if (
          typeof (mql as unknown as { removeListener: (cb: (e: MediaQueryListEvent) => void) => void })
            .removeListener === 'function'
        ) {
          ;(
            mql as unknown as { removeListener: (cb: (e: MediaQueryListEvent) => void) => void }
          ).removeListener(handleMqlChange)
        }
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
