import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

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
  uViewport: { value: THREE.Vector2 }
  uColor: { value: THREE.Color }
  uCompColor: { value: THREE.Color }
  uRipples: { value: THREE.Vector4[] }
  uFlare: { value: number }
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
    gradient.addColorStop(0.28, 'rgba(255, 255, 255, 0.82)')
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.28)')
    gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)')
  } else {
    gradient.addColorStop(0.0, 'rgba(255, 255, 255, 0.68)')
    gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.34)')
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.09)')
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
uniform vec4 uRipples[3];

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying float vDisplacement;
varying float vRipple;
varying vec3 vSphereNormal;

${ASHIMA_SIMPLEX_NOISE_3D}

// Light ripple fronts: each chunk of a streamed reply launches a ring that
// travels across the body from a random point (xyz = origin, w = age in s).
float rippleFronts(vec3 p) {
  vec3 n = normalize(p);
  float total = 0.0;
  for (int i = 0; i < 3; i++) {
    vec4 r = uRipples[i];
    if (r.w < 0.0 || r.w > 1.6) continue;
    float dist = acos(clamp(dot(n, r.xyz), -1.0, 1.0));
    float front = r.w * 2.6;
    float band = exp(-pow((dist - front) * 5.5, 2.0));
    total += band * (1.0 - r.w / 1.6);
  }
  return total;
}

float coreDisplacement(vec3 p, float motionScale) {
  // Flowing domain-warped organic waves
  vec3 warp = vec3(
    sin(p.y * 2.4 + uTime * 0.65 * motionScale),
    cos(p.z * 2.4 - uTime * 0.55 * motionScale),
    sin(p.x * 2.4 + uTime * 0.7 * motionScale)
  ) * 0.22;
  float baseWave = simplex2(p * 1.18 + warp, uTime * 0.85 * motionScale);

  // High-frequency radial contraction & tremor during thinking
  float thinkingTremor = sin(uTime * 32.0 * motionScale + p.x * 14.0 + p.y * 16.0) * uThinkingTension * 0.045;
  float thinkingContract = -uThinkingTension * 0.11;

  // Streaming outward ripple with token energy
  float streamWave = sin(length(p + warp * 0.5) * 6.5 - uTime * 6.5 * motionScale);
  float streamRipple = streamWave * (uStreamVelocity * 0.085 + uPulseEnergy * 0.14);

  // Typing gentle hum
  float typingHum = sin(p.y * 5.2 + uTime * 3.2 * motionScale) * uTypingIntensity * 0.038;

  float chunkSwell = rippleFronts(p) * 0.05;

  return (baseWave * 0.095 + streamRipple + thinkingTremor + thinkingContract + typingHum + chunkSwell) * motionScale;
}

void main() {
  float motionScale = mix(1.0, 0.15, uReducedMotion);

  vec3 n = normalize(normal);
  float disp = coreDisplacement(position, motionScale);
  vDisplacement = disp;
  vRipple = rippleFronts(position);

  // Rebuild the normal from the displaced surface so light follows the
  // ripples instead of the undistorted sphere (smooth glossy liquid).
  vec3 helper = abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(n, helper));
  vec3 bitangent = normalize(cross(n, tangent));
  float eps = 0.012;
  vec3 pA = position + tangent * eps;
  vec3 pB = position + bitangent * eps;
  vec3 dA = pA + normalize(pA) * coreDisplacement(pA, motionScale);
  vec3 dB = pB + normalize(pB) * coreDisplacement(pB, motionScale);
  vec3 displacedPosition = position + n * disp;
  vec3 displacedNormal = normalize(cross(dA - displacedPosition, dB - displacedPosition));
  if (dot(displacedNormal, n) < 0.0) displacedNormal = -displacedNormal;

  vNormal = normalize(normalMatrix * displacedNormal);
  vSphereNormal = normalize(normalMatrix * n);
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
uniform float uThinkingTension;
uniform float uTypingIntensity;
uniform float uSynapseFlash;
uniform vec3 uColor;
uniform vec3 uCompColor;
uniform float uFlare;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying float vDisplacement;
varying float vRipple;
varying vec3 vSphereNormal;

float wispyCurrents(vec3 p, float t) {
  vec3 w1 = p * 2.6 + vec3(sin(t * 0.45 + p.y * 1.8), cos(t * 0.5 + p.z * 1.8), sin(t * 0.38 + p.x * 1.8)) * 0.65;
  vec3 w2 = w1 * 1.75 + vec3(cos(w1.y * 1.6 - t * 0.7), sin(w1.z * 1.6 + t * 0.6), cos(w1.x * 1.6 - t * 0.5)) * 0.55;
  float ribbon1 = abs(sin(w1.x + cos(w1.y * 1.3) + sin(w1.z * 1.1)));
  float ribbon2 = abs(cos(w2.y - sin(w2.z * 1.4) + cos(w2.x * 1.2)));
  float mainStream = smoothstep(0.38, 0.02, ribbon1 * 0.58 + ribbon2 * 0.42);
  float fineFilament = smoothstep(0.16, 0.0, abs(ribbon1 - ribbon2));
  return clamp(mainStream * 0.78 + fineFilament * 0.55, 0.0, 1.0);
}

float surfaceLightning(vec3 p, float t) {
  vec3 lp = p * 5.2 + vec3(
    sin(p.y * 7.5 + t * 9.0) * 0.35 + cos(p.z * 13.0 - t * 14.0) * 0.14,
    cos(p.z * 7.5 - t * 8.5) * 0.35 + sin(p.x * 13.0 + t * 15.0) * 0.14,
    sin(p.x * 7.5 + t * 10.0) * 0.35 + cos(p.y * 13.0 - t * 13.0) * 0.14
  );
  float bolt = abs(sin(lp.x + lp.y * 0.8 - lp.z * 0.6));
  float gate = smoothstep(0.55, 0.96, sin(t * 4.7 + p.x * 2.5 - p.y * 2.1) * 0.5 + 0.5);
  return smoothstep(0.065, 0.004, bolt) * gate;
}

void main() {
  vec3 viewDir = normalize(vViewPosition);
  vec3 norm = normalize(vNormal);

  float NdotV = max(0.0, dot(norm, viewDir));
  float fresnel = pow(1.0 - NdotV, 2.6);

  // Dark metallic liquid-chrome base
  vec3 abyssalChrome = vec3(0.014, 0.032, 0.042);
  vec3 brushedTitanium = vec3(0.055, 0.115, 0.155);

  vec3 activeHue = uColor;
  vec3 compHue = uCompColor;

  // Dual-light studio metallic specular highlights
  vec3 lightDir1 = normalize(vec3(0.65, 0.75, 0.85));
  vec3 lightDir2 = normalize(vec3(-0.75, -0.45, 0.55));
  vec3 halfVec1 = normalize(lightDir1 + viewDir);
  vec3 halfVec2 = normalize(lightDir2 + viewDir);

  // Highlights mix the smooth sphere (keeps the big lit hotspot) with the
  // rippled surface (glossy liquid glints that follow the waves)
  vec3 sphereNorm = normalize(vSphereNormal);
  float specChrome = pow(max(0.0, dot(sphereNorm, halfVec1)), 42.0) * 0.8
                   + pow(max(0.0, dot(norm, halfVec1)), 60.0) * 0.7;
  float specSheen = pow(max(0.0, dot(sphereNorm, halfVec1)), 9.0);
  float specComp = pow(max(0.0, dot(norm, halfVec2)), 20.0);

  // Anisotropic metallic contour bands across displaced shell
  float metalContour = 0.5 + 0.5 * sin((norm.y * 5.0 + norm.x * 3.0 + vDisplacement * 14.0) * 3.14159);
  vec3 metalBase = mix(abyssalChrome, brushedTitanium, metalContour * 0.55 + specSheen * 0.45);

  // Wispy bioluminescent internal currents + complementary secondary currents
  float veins = wispyCurrents(vPosition, uTime * 0.55);
  float compVeins = wispyCurrents(vPosition.yzx * 1.12 + vec3(1.7, -0.9, 2.3), -uTime * 0.42);

  float pulseTravel = fract(dot(vPosition, vec3(1.1, 1.5, 0.9)) * 1.6 - uTime * (1.2 + uStreamVelocity * 4.5));
  float travelingPulse = smoothstep(0.62, 1.0, pulseTravel) * veins * (0.65 + uStreamVelocity * 0.95 + uPulseEnergy * 0.55);

  // Surface arc lightning tendrils
  float arcIntensity = 0.28 + uPulseEnergy * 0.65 + uThinkingTension * 0.8 + uStreamVelocity * 0.55 + uSynapseFlash * 1.3;
  float arc = surfaceLightning(vPosition, uTime) * arcIntensity;

  float innerGlow = pow(NdotV, 2.0) * (0.38 + uPulseEnergy * 0.38 + uTypingIntensity * 0.2);
  vec3 hotWhite = vec3(0.95, 0.98, 1.0);

  // Combine metallic base + primary state hue + complementary state harmonic
  vec3 bodyColor = mix(metalBase, activeHue * 0.85, 0.24 + veins * 0.44);
  bodyColor = mix(bodyColor, compHue * 0.9, compVeins * 0.28 + fresnel * 0.36);

  // Add subsurface glow, traveling synaptic streams, and metallic specular reflections
  bodyColor += activeHue * (innerGlow * 0.68 + travelingPulse * 0.65 + specSheen * 0.35);
  bodyColor += compHue * (specComp * 0.58 + compVeins * (0.22 + uThinkingTension * 0.25 + uTypingIntensity * 0.2));
  bodyColor += mix(activeHue, compHue, 0.48) * (fresnel * (0.85 + uSynapseFlash * 0.6));
  bodyColor += mix(hotWhite, activeHue, 0.25) * (specChrome * 0.95);
  bodyColor += hotWhite * (veins * (uSynapseFlash * 1.8 + uPulseEnergy * 0.35) + travelingPulse * 0.75 + arc * 1.15);

  // Glowing nucleus seen through the liquid (gives the body depth)
  float nucleus = pow(NdotV, 6.0) * (0.3 + uPulseEnergy * 0.2 + uStreamVelocity * 0.12 + uFlare * 0.8);
  bodyColor += mix(activeHue, hotWhite, 0.55) * nucleus;

  // Chunk ripple fronts and the finishing flare
  bodyColor += mix(activeHue, hotWhite, 0.35) * vRipple * (0.35 + veins * 0.45);
  bodyColor += mix(activeHue, hotWhite, 0.5) * uFlare * (0.15 + fresnel * 0.7 + veins * 0.4);

  // Compress hot spots so the liquid detail survives the bloom pass
  float peak = max(bodyColor.r, max(bodyColor.g, bodyColor.b));
  bodyColor *= 1.0 / (1.0 + max(0.0, peak - 0.85) * 0.55);

  float alpha = clamp(0.94 + fresnel * 0.06, 0.0, 1.0);
  gl_FragColor = vec4(bodyColor, alpha);
}
`

const TENDRIL_VERTEX_SHADER = `
uniform float uTime;
uniform float uStreamVelocity;
uniform float uPulseEnergy;
uniform float uThinkingTension;
uniform float uReducedMotion;

attribute float aT;
attribute float aPhase;
attribute float aColorMix;

varying float vT;
varying float vPhase;
varying float vColorMix;

void main() {
  vT = aT;
  vPhase = aPhase;
  vColorMix = aColorMix;

  float motionScale = mix(1.0, 0.2, uReducedMotion);
  float envelope = sin(aT * 3.14159265);

  // Organic wispy undulation along each curved filament
  float swayFreq = 6.2831853 * 1.5;
  float waveSpeed = (1.6 + uStreamVelocity * 2.8 + uThinkingTension * 2.2) * motionScale;
  vec3 sway = vec3(
    sin(aT * swayFreq - uTime * waveSpeed + aPhase),
    cos(aT * swayFreq * 1.2 + uTime * waveSpeed * 0.85 + aPhase * 1.3),
    sin(aT * swayFreq * 0.9 - uTime * waveSpeed * 1.1 + aPhase * 0.7)
  ) * envelope * (0.045 + uPulseEnergy * 0.035 + uThinkingTension * 0.03);

  vec3 pos = position + sway;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`

const TENDRIL_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uStreamVelocity;
uniform float uPulseEnergy;
uniform float uThinkingTension;
uniform float uSynapseFlash;
uniform float uReducedMotion;
uniform vec3 uColor;
uniform vec3 uCompColor;

varying float vT;
varying float vPhase;
varying float vColorMix;

void main() {
  float motionScale = mix(1.0, 0.2, uReducedMotion);
  float speed = 0.85 + uStreamVelocity * 2.8 + uPulseEnergy * 1.4;
  float flow = fract(vT - uTime * speed * 0.42 * motionScale + vPhase);

  // Smooth wispy comet-stream along the curve (no dots or dashes)
  float streamGlow = smoothstep(0.0, 0.35, flow) * smoothstep(1.0, 0.35, flow);
  float headHighlight = pow(smoothstep(0.55, 0.98, flow), 3.0);

  // Smooth tapered ends so curves melt into space organically
  float endTaper = sin(vT * 3.14159265);

  vec3 baseHue = mix(uColor, uCompColor, vColorMix);
  vec3 col = mix(baseHue, vec3(0.96, 0.99, 1.0), headHighlight * 0.65 + uSynapseFlash * 0.45);

  float alpha = endTaper * (0.14 + streamGlow * (0.42 + uPulseEnergy * 0.35 + uStreamVelocity * 0.3) + headHighlight * (0.45 + uSynapseFlash * 0.5));
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`

const LIGHTNING_VERTEX_SHADER = `
uniform float uTime;
uniform float uStreamVelocity;
uniform float uPulseEnergy;
uniform float uThinkingTension;
uniform float uSynapseFlash;
uniform float uReducedMotion;
uniform float uPixelRatio;
uniform vec2 uViewport;

// Each bolt segment is a screen-facing quad so arcs have real thickness.
attribute vec3 aStart;
attribute vec3 aEnd;
attribute float aT0;
attribute float aT1;
attribute float aWhich;
attribute float aSide;
attribute float aSeed;
attribute vec3 aOrtho1;
attribute vec3 aOrtho2;

varying float vT;
varying float vBoltIntensity;
varying float vSeed;
varying float vSide;

vec3 boltPoint(vec3 base, float t, float snapTime) {
  float envelope = sin(t * 3.14159265);
  // Quantized time steps so arcs snap & crackle like high-voltage plasma
  float jag1 = sin(t * 17.0 + snapTime * 4.7 + aSeed * 31.0)
             + 0.3 * cos(t * 41.0 - snapTime * 7.3 + aSeed * 17.0);
  float jag2 = cos(t * 19.0 - snapTime * 5.9 + aSeed * 43.0)
             + 0.3 * sin(t * 45.0 + snapTime * 8.1 + aSeed * 23.0);
  float amp = envelope * (0.07 + uPulseEnergy * 0.04 + uThinkingTension * 0.04 + uSynapseFlash * 0.05);
  return base + (aOrtho1 * jag1 + aOrtho2 * jag2) * amp;
}

void main() {
  float motionScale = mix(1.0, 0.2, uReducedMotion);
  float snapRate = (11.0 + uStreamVelocity * 10.0 + uThinkingTension * 12.0) * motionScale;
  float snapTime = floor(uTime * snapRate + aSeed * 19.0);

  vec4 clipA = projectionMatrix * modelViewMatrix * vec4(boltPoint(aStart, aT0, snapTime), 1.0);
  vec4 clipB = projectionMatrix * modelViewMatrix * vec4(boltPoint(aEnd, aT1, snapTime), 1.0);
  vec4 clip = aWhich < 0.5 ? clipA : clipB;
  float t = aWhich < 0.5 ? aT0 : aT1;
  vT = t;
  vSeed = aSeed;
  vSide = aSide;

  vec2 screenA = clipA.xy / clipA.w * uViewport;
  vec2 screenB = clipB.xy / clipB.w * uViewport;
  vec2 dir = screenB - screenA;
  dir = length(dir) > 0.0001 ? normalize(dir) : vec2(1.0, 0.0);
  vec2 perp = vec2(-dir.y, dir.x);

  float widthPx = (1.6 + uSynapseFlash * 1.2 + uThinkingTension * 0.6) * uPixelRatio * sin(t * 3.14159265 * 0.92 + 0.12);
  clip.xy += perp * aSide * widthPx / uViewport * clip.w;

  // Intermittent firing gate per bolt
  float cycle = sin(uTime * (2.8 + fract(aSeed * 7.3) * 3.2) * motionScale + aSeed * 40.0);
  float threshold = 0.72 - uPulseEnergy * 0.32 - uThinkingTension * 0.42 - uStreamVelocity * 0.25 - uSynapseFlash * 0.6;
  float activeGate = smoothstep(threshold, threshold + 0.22, cycle);
  vBoltIntensity = clamp(activeGate + uSynapseFlash * 0.85, 0.0, 1.0);

  gl_Position = clip;
}
`

const LIGHTNING_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uSynapseFlash;
uniform vec3 uColor;
uniform vec3 uCompColor;

varying float vT;
varying float vBoltIntensity;
varying float vSeed;
varying float vSide;

void main() {
  if (vBoltIntensity < 0.01) discard;
  float profile = 1.0 - abs(vSide);
  float coreLine = smoothstep(0.0, 0.7, profile);

  float endPinch = sin(vT * 3.14159265);
  float surge = 0.65 + 0.35 * sin(vT * 18.0 - uTime * 28.0 + vSeed * 20.0);

  vec3 arcTint = mix(uColor, uCompColor, fract(vSeed * 3.7));
  vec3 hotCore = mix(arcTint, vec3(0.96, 0.99, 1.0), 0.6 + uSynapseFlash * 0.3);

  // Bright enough to feed the bloom pass, which turns the thin line into a glowing arc
  float alpha = vBoltIntensity * surge * (0.35 + 0.65 * endPinch) * coreLine;
  gl_FragColor = vec4(hotCore * 1.6, clamp(alpha, 0.0, 1.0));
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
varying float vAngle;

void main() {
  float motionScale = mix(1.0, 0.15, uReducedMotion);

  // Curl-like 3D helical flow + inward token-stream vortex
  float spiralCycle = fract(uTime * 0.24 * motionScale + aSeed);
  float ingest = uStreamVelocity * spiralCycle;

  float orbitAngle = uTime * (0.14 + fract(aSeed * 3.1) * 0.28) * motionScale + ingest * 2.2;
  float cosA = cos(orbitAngle);
  float sinA = sin(orbitAngle);

  vec3 p = position;
  vec3 orbitedPos = vec3(
    p.x * cosA - p.z * sinA,
    p.y,
    p.x * sinA + p.z * cosA
  );

  // Fluid wavy drift (wispy underwater / cyber currents)
  float driftPhase = uTime * 0.75 * motionScale + aSeed * 18.0;
  vec3 fluidCurl = vec3(
    sin(orbitedPos.y * 2.2 + driftPhase) * 0.16,
    cos(orbitedPos.x * 1.9 - driftPhase * 0.85) * 0.18,
    sin(orbitedPos.z * 2.2 + driftPhase * 1.1) * 0.16
  );
  orbitedPos += fluidCurl;

  float spiralFactor = 1.0 - 0.45 * ingest;
  orbitedPos *= spiralFactor;

  float wrapFade = mix(1.0, smoothstep(1.0, 0.82, spiralCycle) * smoothstep(0.0, 0.08, spiralCycle), uStreamVelocity);

  vec4 mvPosition = modelViewMatrix * vec4(orbitedPos, 1.0);
  float scaleFactor = 1.0 + uPulseEnergy * 0.45 + uSynapseFlash * 0.55 + uThinkingTension * 0.2;
  gl_PointSize = (aSize * scaleFactor * uPixelRatio) / -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;

  float breathe = 0.55 + 0.45 * sin(uTime * 2.1 * motionScale + aSeed * 25.0);
  vAlpha = (0.38 + 0.45 * breathe + uStreamVelocity * 0.25 + uSynapseFlash * 0.35) * wrapFade;
  vSeed = aSeed;
  vAngle = orbitAngle + aSeed * 6.2831853;
}
`

const HALO_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uSynapseFlash;
uniform vec3 uColor;
uniform vec3 uCompColor;

varying float vAlpha;
varying float vSeed;
varying float vAngle;

void main() {
  vec2 centered = gl_PointCoord - vec2(0.5);
  float r = length(centered);
  if (r > 0.5) discard;

  // Rotate local coordinates into a curvy S-shaped wispy wisp instead of a flat round dot
  float c = cos(vAngle);
  float s = sin(vAngle);
  vec2 rot = vec2(centered.x * c - centered.y * s, centered.x * s + centered.y * c);

  // S-curve spine distortion
  float sCurve = rot.y - 0.24 * sin(rot.x * 6.5 + vSeed * 12.0);
  float wispDist = length(vec2(rot.x * 0.68, sCurve * 1.85));

  float wispCore = smoothstep(0.36, 0.01, wispDist);
  float softHalo = smoothstep(0.5, 0.08, r) * 0.35;
  float shape = clamp(wispCore + softHalo, 0.0, 1.0);

  vec3 particleHue = mix(uColor, uCompColor, fract(vSeed * 2.7));
  vec3 col = mix(particleHue, vec3(0.98, 0.99, 1.0), wispCore * (0.48 + uSynapseFlash * 0.45));

  gl_FragColor = vec4(col, shape * vAlpha);
}
`

const RIBBON_RING_VERTEX_SHADER = `
uniform float uTime;
uniform float uStreamVelocity;
uniform float uPulseEnergy;
uniform float uThinkingTension;
uniform float uReducedMotion;
uniform float uRingSpeed;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vWave;

void main() {
  vUv = uv;
  float motionScale = mix(1.0, 0.2, uReducedMotion);
  float angle = uv.x * 6.2831853;

  // Subtle organic undulation along the metallic cyber ribbon
  float wave = sin(angle * 3.0 + uTime * uRingSpeed * 1.4 * motionScale) * 0.045
             + cos(angle * 5.0 - uTime * uRingSpeed * 0.9 * motionScale) * 0.025;
  vWave = wave;

  vec3 displaced = position;
  displaced.z += wave * (1.0 + uPulseEnergy * 0.5 + uThinkingTension * 0.4);

  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`

const RIBBON_RING_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uStreamVelocity;
uniform float uPulseEnergy;
uniform float uSynapseFlash;
uniform float uReducedMotion;
uniform vec3 uColor;
uniform vec3 uCompColor;
uniform float uRingSpeed;
uniform float uScanDir;
uniform float uColorMix;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vWave;

void main() {
  float motionScale = mix(1.0, 0.2, uReducedMotion);
  float normAngle = vUv.x;

  // Smooth continuous liquid-metal + plasma stream along the ring (zero dashes/dots)
  float speed = (0.18 + uStreamVelocity * 0.55) * motionScale * uRingSpeed;
  float phase1 = fract(normAngle * uScanDir - uTime * speed);
  float phase2 = fract(normAngle * uScanDir - uTime * speed + 0.5);

  // Soft head (no hard cut where the comet wraps around)
  float comet1 = pow(smoothstep(0.0, 0.95, 1.0 - phase1), 3.5) * smoothstep(0.0, 0.06, phase1);
  float comet2 = pow(smoothstep(0.0, 0.95, 1.0 - phase2), 4.5) * 0.65 * smoothstep(0.0, 0.06, phase2);

  // Metallic specular sheen along the ribbon
  vec3 viewDir = normalize(vViewPosition);
  vec3 norm = normalize(vNormal);
  float spec = pow(max(0.0, abs(dot(norm, viewDir))), 6.0);

  // Soft cross-sectional filament profile with bright center spine
  float crossCenter = 1.0 - abs(vUv.y * 2.0 - 1.0);
  float crossProfile = smoothstep(0.0, 0.6, crossCenter);
  float coreSpine = pow(crossCenter, 3.0);

  vec3 ringHue = mix(uColor, uCompColor, uColorMix + 0.25 * sin(normAngle * 6.2831853 + uTime * 0.5));
  vec3 metallicSheen = mix(vec3(0.18, 0.26, 0.32), ringHue, 0.65);

  float energyFlow = 0.22 + comet1 * 1.15 + comet2 * 0.8;
  float alpha = crossProfile * energyFlow * (0.34 + uPulseEnergy * 0.32 + uSynapseFlash * 0.4 + spec * 0.25);

  vec3 col = mix(metallicSheen, ringHue, 0.6 + comet1 * 0.4);
  col = mix(col, vec3(0.96, 0.99, 1.0), coreSpine * (comet1 * 0.65 + spec * 0.35 + uSynapseFlash * 0.45));

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`

const AEGIS_SHELL_VERTEX_SHADER = `
uniform float uTime;
uniform float uStreamVelocity;
uniform float uPulseEnergy;
uniform float uThinkingTension;
uniform float uReducedMotion;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;

void main() {
  float motionScale = mix(1.0, 0.2, uReducedMotion);

  // Subtle organic breathing & helical twist on the outer containment shell
  float twistAngle = position.y * 0.35 * sin(uTime * 0.5 * motionScale);
  float c = cos(twistAngle);
  float s = sin(twistAngle);
  vec3 twisted = vec3(
    position.x * c - position.z * s,
    position.y,
    position.x * s + position.z * c
  );

  vNormal = normalize(normalMatrix * normal);
  vPosition = twisted;
  vec4 mvPosition = modelViewMatrix * vec4(twisted, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`

const AEGIS_SHELL_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uPulseEnergy;
uniform float uStreamVelocity;
uniform float uThinkingTension;
uniform float uSynapseFlash;
uniform float uReducedMotion;
uniform vec3 uColor;
uniform vec3 uCompColor;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;

// Volumetric curved interference lens replacing the flat icosahedron wireframe grid
float causticInterference(vec3 p, float t) {
  // Warped spherical coordinates for curved cyber-chitin contours
  vec3 q = normalize(p);
  float phi = atan(q.z, q.x);
  float theta = acos(clamp(q.y, -1.0, 1.0));

  float warp = sin(phi * 3.0 + theta * 4.0 - t * 0.9) * 0.38
             + cos(phi * 5.0 - theta * 3.0 + t * 0.7) * 0.24;

  // Intersecting helical wave ribbons
  float waveA = abs(sin((theta * 5.0 + phi * 2.0 + warp) - t * 0.8));
  float waveB = abs(sin((theta * 4.0 - phi * 3.0 - warp * 0.8) + t * 0.65));

  float caustic = smoothstep(0.14, 0.008, waveA * waveB);
  float secondary = smoothstep(0.045, 0.0, abs(waveA - 0.45)) * 0.45;
  return clamp(caustic + secondary, 0.0, 1.0);
}

void main() {
  vec3 viewDir = normalize(vViewPosition);
  vec3 norm = normalize(vNormal);
  float NdotV = max(0.0, abs(dot(norm, viewDir)));
  float fresnel = pow(1.0 - NdotV, 2.2);

  float motionScale = mix(1.0, 0.2, uReducedMotion);
  float speed = (0.75 + uStreamVelocity * 1.4 + uThinkingTension * 0.9) * motionScale;

  float field = causticInterference(vPosition, uTime * speed);

  // Travelling cyber-pulse wave sweeping across the curved lens
  float sweep = sin(vPosition.y * 2.4 - uTime * (1.3 + uStreamVelocity * 2.0) * motionScale) * 0.5 + 0.5;
  float sweepBand = pow(sweep, 4.0);

  // Chromatic iridescence between primary state color and complementary state shade
  float iridFactor = clamp(fresnel * 0.75 + sweepBand * 0.35, 0.0, 1.0);
  vec3 shellColor = mix(uColor, uCompColor, iridFactor);

  // Metallic rim reflection
  vec3 lightDir = normalize(vec3(-0.5, 0.8, 0.6));
  vec3 halfV = normalize(lightDir + viewDir);
  float rimSpec = pow(max(0.0, abs(dot(norm, halfV))), 18.0);

  vec3 col = mix(shellColor, vec3(0.95, 0.99, 1.0), field * 0.42 + rimSpec * 0.5 + uSynapseFlash * 0.45);

  // Center stays ultra-clear so the core shines unobstructed; edges and caustic filaments glow
  float edgeMask = 0.22 + fresnel * 0.78;
  float baseAlpha = (field * 0.36 + fresnel * 0.24 + rimSpec * 0.2 + sweepBand * field * 0.25) * edgeMask;
  float alpha = baseAlpha * (0.55 + uPulseEnergy * 0.38 + uStreamVelocity * 0.25 + uSynapseFlash * 0.45);

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.78));
}
`

// Final pass: soft highlight roll-off and an alpha that keeps glow visible on
// the transparent canvas (the page background shows through everywhere else).
const OUTPUT_FRAGMENT_SHADER = `
uniform sampler2D tDiffuse;
varying vec2 vUv;

vec3 softClip(vec3 c) {
  vec3 over = max(c - 0.78, 0.0);
  return min(c, 0.78) + (1.0 - exp(-over * 4.0)) * 0.22;
}

void main() {
  vec4 texel = texture2D(tDiffuse, vUv);
  vec3 col = softClip(max(texel.rgb, 0.0));
  float alpha = clamp(max(texel.a, max(col.r, max(col.g, col.b))), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`

const OUTPUT_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
  const coreDetail = isCompact ? 14 : 24
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
  const coronaScale = isCompact ? 2.75 : 3.2
  coronaSprite.scale.set(coronaScale, coronaScale, 1.0)
  group.add(coronaSprite)
  disposables.push(coronaMaterial)

  const wideMaterial = new THREE.SpriteMaterial({
    map: wideTex ?? undefined,
    color: 0x6366f1,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const wideSprite = new THREE.Sprite(wideMaterial)
  wideSprite.renderOrder = -2
  const wideScale = isCompact ? 5.4 : 6.6
  wideSprite.scale.set(wideScale, wideScale, 1.0)
  group.add(wideSprite)
  disposables.push(wideMaterial)

  return { group, coronaSprite, wideSprite, coronaMaterial, wideMaterial }
}

function sampleSphericalPoint(rng: () => number, radius: number): THREE.Vector3 {
  const u = rng()
  const v = rng()
  const theta = u * 2.0 * Math.PI
  const phi = Math.acos(2.0 * v - 1.0)
  const sinPhi = Math.sin(phi)
  return new THREE.Vector3(
    radius * sinPhi * Math.cos(theta),
    radius * sinPhi * Math.sin(theta),
    radius * Math.cos(phi)
  )
}

function buildWispySynapseAndLightning(
  isCompact: boolean,
  rng: () => number,
  sharedUniforms: SharedUniforms,
  disposables: Disposable[]
): THREE.Group {
  const group = new THREE.Group()

  // 1. Curved Wispy Synaptic Tendrils (smooth cubic/Catmull-Rom splines, zero straight segments or dots)
  const tendrilCount = isCompact ? 26 : 48
  const subdivisions = isCompact ? 20 : 28
  const totalTendrilSegments = tendrilCount * subdivisions

  const tendrilPos = new Float32Array(totalTendrilSegments * 2 * 3)
  const tendrilT = new Float32Array(totalTendrilSegments * 2)
  const tendrilPhase = new Float32Array(totalTendrilSegments * 2)
  const tendrilColorMix = new Float32Array(totalTendrilSegments * 2)

  let segIdx = 0
  for (let i = 0; i < tendrilCount; i++) {
    const startR = 1.16 + rng() * 0.14
    const p0 = sampleSphericalPoint(rng, startR)

    // Create a sweeping tangential arc around the core
    const randomAxis = sampleSphericalPoint(rng, 1.0).normalize()
    const tangent1 = new THREE.Vector3().crossVectors(p0, randomAxis).normalize()
    const tangent2 = new THREE.Vector3().crossVectors(p0, tangent1).normalize()

    const arcScale = 0.65 + rng() * 0.75
    const mid1R = 1.38 + rng() * 0.42
    const mid2R = 1.42 + rng() * 0.48
    const endR = 1.18 + rng() * 0.25

    const p1 = p0
      .clone()
      .addScaledVector(tangent1, arcScale * 0.6)
      .addScaledVector(tangent2, (rng() - 0.5) * 0.5)
      .normalize()
      .multiplyScalar(mid1R)

    const p2 = p1
      .clone()
      .addScaledVector(tangent1, arcScale * 0.65)
      .addScaledVector(tangent2, (rng() - 0.5) * 0.65)
      .normalize()
      .multiplyScalar(mid2R)

    const p3 = p2
      .clone()
      .addScaledVector(tangent1, arcScale * 0.5)
      .addScaledVector(tangent2, (rng() - 0.5) * 0.4)
      .normalize()
      .multiplyScalar(endR)

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3])
    const pts = curve.getPoints(subdivisions)
    const phase = rng() * 10.0
    const colorMix = rng()

    for (let s = 0; s < subdivisions; s++) {
      const a = pts[s]
      const b = pts[s + 1]
      const t0 = s / subdivisions
      const t1 = (s + 1) / subdivisions

      tendrilPos[segIdx * 6 + 0] = a.x
      tendrilPos[segIdx * 6 + 1] = a.y
      tendrilPos[segIdx * 6 + 2] = a.z
      tendrilT[segIdx * 2 + 0] = t0
      tendrilPhase[segIdx * 2 + 0] = phase
      tendrilColorMix[segIdx * 2 + 0] = colorMix

      tendrilPos[segIdx * 6 + 3] = b.x
      tendrilPos[segIdx * 6 + 4] = b.y
      tendrilPos[segIdx * 6 + 5] = b.z
      tendrilT[segIdx * 2 + 1] = t1
      tendrilPhase[segIdx * 2 + 1] = phase
      tendrilColorMix[segIdx * 2 + 1] = colorMix

      segIdx++
    }
  }

  const tendrilGeo = new THREE.BufferGeometry()
  tendrilGeo.setAttribute('position', new THREE.BufferAttribute(tendrilPos, 3))
  tendrilGeo.setAttribute('aT', new THREE.BufferAttribute(tendrilT, 1))
  tendrilGeo.setAttribute('aPhase', new THREE.BufferAttribute(tendrilPhase, 1))
  tendrilGeo.setAttribute('aColorMix', new THREE.BufferAttribute(tendrilColorMix, 1))

  const tendrilMat = new THREE.ShaderMaterial({
    vertexShader: TENDRIL_VERTEX_SHADER,
    fragmentShader: TENDRIL_FRAGMENT_SHADER,
    uniforms: {
      ...sharedUniforms,
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const tendrilMesh = new THREE.LineSegments(tendrilGeo, tendrilMat)
  group.add(tendrilMesh)
  disposables.push(tendrilGeo, tendrilMat)

  // 2. High-Voltage Synaptic Lightning Arcs (branching/snapping electrical bolts between core and outer field)
  const boltCount = isCompact ? 8 : 14
  const boltSteps = isCompact ? 20 : 28
  const totalBoltSegments = boltCount * boltSteps

  // 4 vertices per segment (quad), 6 indices
  const vCount = totalBoltSegments * 4
  const boltStart = new Float32Array(vCount * 3)
  const boltEnd = new Float32Array(vCount * 3)
  const boltT0 = new Float32Array(vCount)
  const boltT1 = new Float32Array(vCount)
  const boltWhich = new Float32Array(vCount)
  const boltSide = new Float32Array(vCount)
  const boltSeed = new Float32Array(vCount)
  const boltOrtho1 = new Float32Array(vCount * 3)
  const boltOrtho2 = new Float32Array(vCount * 3)
  const boltIndex: number[] = []

  let vIdx = 0
  for (let b = 0; b < boltCount; b++) {
    const start = sampleSphericalPoint(rng, 1.12)
    const dir = start.clone().normalize()
    // Arc either outward to outer shell or across to an adjacent quadrant
    const isBridgeBolt = rng() > 0.45
    const end = isBridgeBolt
      ? sampleSphericalPoint(rng, 1.68 + rng() * 0.35)
      : dir
          .clone()
          .add(sampleSphericalPoint(rng, 0.75))
          .normalize()
          .multiplyScalar(1.15)

    const mid = start
      .clone()
      .add(end)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(1.45 + rng() * 0.35)

    const baseCurve = new THREE.QuadraticBezierCurve3(start, mid, end)
    const pts = baseCurve.getPoints(boltSteps)

    const chord = end.clone().sub(start).normalize()
    const up = Math.abs(chord.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
    const ortho1 = new THREE.Vector3().crossVectors(chord, up).normalize()
    const ortho2 = new THREE.Vector3().crossVectors(chord, ortho1).normalize()
    const seed = rng()

    for (let s = 0; s < boltSteps; s++) {
      const pA = pts[s]
      const pB = pts[s + 1]
      const t0 = s / boltSteps
      const t1 = (s + 1) / boltSteps
      const corners: Array<[number, number]> = [
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 1],
      ]
      for (const [which, side] of corners) {
        boltStart.set([pA.x, pA.y, pA.z], vIdx * 3)
        boltEnd.set([pB.x, pB.y, pB.z], vIdx * 3)
        boltOrtho1.set([ortho1.x, ortho1.y, ortho1.z], vIdx * 3)
        boltOrtho2.set([ortho2.x, ortho2.y, ortho2.z], vIdx * 3)
        boltT0[vIdx] = t0
        boltT1[vIdx] = t1
        boltWhich[vIdx] = which
        boltSide[vIdx] = side
        boltSeed[vIdx] = seed
        vIdx++
      }
      const base = vIdx - 4
      boltIndex.push(base, base + 2, base + 1, base + 1, base + 2, base + 3)
    }
  }

  const boltGeo = new THREE.BufferGeometry()
  boltGeo.setAttribute('position', new THREE.BufferAttribute(boltStart, 3))
  boltGeo.setAttribute('aStart', new THREE.BufferAttribute(boltStart, 3))
  boltGeo.setAttribute('aEnd', new THREE.BufferAttribute(boltEnd, 3))
  boltGeo.setAttribute('aT0', new THREE.BufferAttribute(boltT0, 1))
  boltGeo.setAttribute('aT1', new THREE.BufferAttribute(boltT1, 1))
  boltGeo.setAttribute('aWhich', new THREE.BufferAttribute(boltWhich, 1))
  boltGeo.setAttribute('aSide', new THREE.BufferAttribute(boltSide, 1))
  boltGeo.setAttribute('aSeed', new THREE.BufferAttribute(boltSeed, 1))
  boltGeo.setAttribute('aOrtho1', new THREE.BufferAttribute(boltOrtho1, 3))
  boltGeo.setAttribute('aOrtho2', new THREE.BufferAttribute(boltOrtho2, 3))
  boltGeo.setIndex(boltIndex)
  // Vertices are moved in the shader; keep the bolts from being culled
  boltGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3)

  const boltMat = new THREE.ShaderMaterial({
    vertexShader: LIGHTNING_VERTEX_SHADER,
    fragmentShader: LIGHTNING_FRAGMENT_SHADER,
    uniforms: {
      ...sharedUniforms,
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const boltMesh = new THREE.Mesh(boltGeo, boltMat)
  group.add(boltMesh)
  disposables.push(boltGeo, boltMat)

  return group
}

function buildParticleHalo(
  isCompact: boolean,
  rng: () => number,
  sharedUniforms: SharedUniforms,
  disposables: Disposable[]
): THREE.Points {
  const particleCount = isCompact ? 260 : 580
  const positions = new Float32Array(particleCount * 3)
  const seeds = new Float32Array(particleCount)
  const sizes = new Float32Array(particleCount)

  const baseSize = isCompact ? 15.0 : 20.0
  for (let i = 0; i < particleCount; i++) {
    const u = rng()
    const v = rng()
    const theta = u * 2.0 * Math.PI
    const phi = Math.acos(2.0 * v - 1.0)
    const r = 1.48 + rng() * 1.42
    const sinPhi = Math.sin(phi)

    positions[i * 3 + 0] = r * sinPhi * Math.cos(theta)
    positions[i * 3 + 1] = r * sinPhi * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)

    seeds[i] = rng()
    sizes[i] = baseSize * (0.65 + rng() * 0.85)
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

function buildCyberRibbonRings(
  isCompact: boolean,
  sharedUniforms: SharedUniforms,
  disposables: Disposable[]
): {
  group: THREE.Group
  ring1: THREE.Mesh
  ring2: THREE.Mesh
  ring3: THREE.Mesh
} {
  const group = new THREE.Group()
  const tubularSegments = isCompact ? 128 : 220

  const createRibbonMaterial = (ringSpeed: number, scanDir: number, colorMix: number) => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: RIBBON_RING_VERTEX_SHADER,
      fragmentShader: RIBBON_RING_FRAGMENT_SHADER,
      uniforms: {
        ...sharedUniforms,
        uRingSpeed: { value: ringSpeed },
        uScanDir: { value: scanDir },
        uColorMix: { value: colorMix },
      },
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    disposables.push(mat)
    return mat
  }

  const ring1Geo = new THREE.TorusGeometry(1.7, 0.022, 12, tubularSegments)
  const ring1Mat = createRibbonMaterial(1.0, 1.0, 0.15)
  const ring1 = new THREE.Mesh(ring1Geo, ring1Mat)
  ring1.rotation.x = Math.PI * 0.35
  ring1.rotation.y = Math.PI * 0.15
  group.add(ring1)
  disposables.push(ring1Geo)

  const ring2Geo = new THREE.TorusGeometry(1.9, 0.018, 12, tubularSegments)
  const ring2Mat = createRibbonMaterial(-1.25, -1.0, 0.55)
  const ring2 = new THREE.Mesh(ring2Geo, ring2Mat)
  ring2.rotation.x = -Math.PI * 0.4
  ring2.rotation.y = -Math.PI * 0.25
  group.add(ring2)
  disposables.push(ring2Geo)

  const ring3Geo = new THREE.TorusGeometry(2.1, 0.016, 12, tubularSegments)
  const ring3Mat = createRibbonMaterial(1.45, 1.0, 0.85)
  const ring3 = new THREE.Mesh(ring3Geo, ring3Mat)
  ring3.rotation.x = Math.PI * 0.6
  ring3.rotation.z = Math.PI * 0.3
  group.add(ring3)
  disposables.push(ring3Geo)

  return { group, ring1, ring2, ring3 }
}

function buildAegisContainmentShell(
  isCompact: boolean,
  sharedUniforms: SharedUniforms,
  disposables: Disposable[]
): THREE.Mesh {
  const detail = isCompact ? 6 : 10
  const shellGeo = new THREE.IcosahedronGeometry(1.42, detail)
  const shellMaterial = new THREE.ShaderMaterial({
    vertexShader: AEGIS_SHELL_VERTEX_SHADER,
    fragmentShader: AEGIS_SHELL_FRAGMENT_SHADER,
    uniforms: {
      ...sharedUniforms,
    },
    side: THREE.DoubleSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const shellMesh = new THREE.Mesh(shellGeo, shellMaterial)
  disposables.push(shellGeo, shellMaterial)
  return shellMesh
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
    let resizeObserver: ResizeObserver | null = null
    let handleWindowResize: (() => void) | null = null
    let intersectionObserver: IntersectionObserver | null = null
    let mql: MediaQueryList | null = null
    let handleMqlChange: ((e: MediaQueryListEvent) => void) | null = null
    let handleVisibilityChange: (() => void) | null = null
    let handlePointerMove: ((event: PointerEvent) => void) | null = null
    let handlePointerLeave: (() => void) | null = null

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
        antialias: false,
        powerPreference: 'high-performance',
      })
      renderer.setPixelRatio(currentPr)
      renderer.setClearColor(0x000000, 0)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50)
      camera.position.set(0, 0, isCompact ? 5.1 : 4.65)
      camera.lookAt(0, 0, 0)

      const rootGroup = new THREE.Group()
      scene.add(rootGroup)

      // Primary state palette
      const cyanColor = new THREE.Color(0x00c3ff)
      const emeraldColor = new THREE.Color(0x00f5d4)
      const crimsonColor = new THREE.Color(0xff453a)
      const coralColor = new THREE.Color(0xff6a60)

      // Complementary / harmonic state shades from our abyssal cyber palette
      const indigoCompColor = new THREE.Color(0x6366f1) // Electric Cyber Indigo-Violet (pairs with Cyan)
      const magentaCompColor = new THREE.Color(0xc026d3) // Bioluminescent Orchid-Magenta (pairs with Bio-Aqua)
      const goldCompColor = new THREE.Color(0xffb703) // Molten Amber-Gold (pairs with Sacred Crimson)
      const cyanShockCompColor = new THREE.Color(0x38bdf8) // High-voltage Electric Ice-Cyan (accent during error/max)

      const activeColor = new THREE.Color(0x00c3ff)
      const compColor = new THREE.Color(0x6366f1)
      const crimsonShiftColor = new THREE.Color()
      const compShiftColor = new THREE.Color()

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
        uViewport: { value: new THREE.Vector2(150, 150) },
        uColor: { value: activeColor },
        uCompColor: { value: compColor },
        uRipples: {
          value: [
            new THREE.Vector4(0, 0, 1, -1),
            new THREE.Vector4(0, 0, 1, -1),
            new THREE.Vector4(0, 0, 1, -1),
          ],
        },
        uFlare: { value: 0 },
      }

      const rng = createMulberry32(0x594e)

      // Layer 2 Bloom sprites (renderOrder -1, -2 behind core)
      const glow = buildGlowSprites(isCompact, disposables)
      rootGroup.add(glow.group)

      // Layer 1: Metallic & Bioluminescent Liquid-Chitin Core
      const coreMesh = buildCore(isCompact, sharedUniforms, disposables)
      rootGroup.add(coreMesh)

      // Layer 6: Holographic Caustic & Chromatic Interference Aegis Field (replaces wireframe grid)
      const aegisShellMesh = buildAegisContainmentShell(isCompact, sharedUniforms, disposables)
      rootGroup.add(aegisShellMesh)

      // Layer 3: Curved Wispy Synaptic Tendrils & High-Voltage Lightning Arcs
      const synapseGroup = buildWispySynapseAndLightning(isCompact, rng, sharedUniforms, disposables)
      rootGroup.add(synapseGroup)

      // Layer 4: Curvy S-Wisp Particle Halo
      const haloPoints = buildParticleHalo(isCompact, rng, sharedUniforms, disposables)
      rootGroup.add(haloPoints)

      // Layer 5: Continuous Metallic & Plasma Cyber Ribbon Rings
      const rings = buildCyberRibbonRings(isCompact, sharedUniforms, disposables)
      rootGroup.add(rings.group)

      // Post-processing: real bloom so the core, rings and arcs give off light.
      // Multisampled HDR target keeps edges clean (the canvas itself has no MSAA).
      const composerTarget = new THREE.WebGLRenderTarget(1, 1, {
        type: THREE.HalfFloatType,
        samples: renderer.capabilities.isWebGL2 ? 4 : 0,
      })
      const composer = new EffectComposer(renderer, composerTarget)
      composer.setPixelRatio(currentPr)
      const renderPass = new RenderPass(scene, camera)
      renderPass.clearAlpha = 0
      composer.addPass(renderPass)
      const bloomStrengthBase = isCompact ? 0.42 : 0.5
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(256, 256),
        bloomStrengthBase,
        isCompact ? 0.4 : 0.5,
        0.78
      )
      composer.addPass(bloomPass)
      const outputPass = new ShaderPass(
        new THREE.ShaderMaterial({
          uniforms: { tDiffuse: { value: null } },
          vertexShader: OUTPUT_VERTEX_SHADER,
          fragmentShader: OUTPUT_FRAGMENT_SHADER,
        })
      )
      composer.addPass(outputPass)
      disposables.push(composerTarget, bloomPass, outputPass, { dispose: () => composer.dispose() })

      const updateDimensions = () => {
        if (!container || !renderer || !camera) return
        const width = container.clientWidth || 300
        const height = container.clientHeight || 300
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height, false)
        composer.setSize(width, height)
        // Half the drawing-buffer size, for clip-space to pixel conversion
        sharedUniforms.uViewport.value.set((width * currentPr) / 2, (height * currentPr) / 2)
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

      // Pointer lean: the core turns slightly toward the cursor
      const pointerTarget = { x: 0, y: 0 }
      const pointerCurrent = { x: 0, y: 0 }
      handlePointerMove = (event: PointerEvent) => {
        if (!container) return
        const rect = container.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return
        const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
        const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1
        pointerTarget.x = Math.max(-1, Math.min(1, nx))
        pointerTarget.y = Math.max(-1, Math.min(1, ny))
      }
      handlePointerLeave = () => {
        pointerTarget.x = 0
        pointerTarget.y = 0
      }
      window.addEventListener('pointermove', handlePointerMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', handlePointerLeave)

      // Chunk ripples (3 slots, recycled) and the end-of-reply flare
      const rippleSlots = sharedUniforms.uRipples.value
      const rippleOrigin = new THREE.Vector3()
      const coreInverse = new THREE.Quaternion()
      let nextRippleSlot = 0
      let lastRippleAt = -10
      let lastCharsSeen = 0
      let lastLifecycle: EntityBridgeFrameSnapshot['lifecycle'] = 'idle'
      let flare = 0

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

        // Adaptive resolution step down (sustained >20ms for ~1.5s)
        rollingFrameTimeMs = rollingFrameTimeMs * 0.9 + Math.min(rawDtMs, 50) * 0.1
        if (rollingFrameTimeMs > 20.0 && currentPr > 1.0) {
          slowAccumulatorSeconds += dtSeconds
          if (slowAccumulatorSeconds >= 1.5) {
            currentPr = Math.max(1.0, currentPr - 0.25)
            renderer?.setPixelRatio(currentPr)
            composer.setPixelRatio(currentPr)
            sharedUniforms.uPixelRatio.value = currentPr
            updateDimensions()
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

        // Age ripples; launch a new one when fresh text arrives (at most ~5/s)
        for (const slot of rippleSlots) {
          if (slot.w >= 0) slot.w = slot.w > 1.6 ? -1 : slot.w + dtSeconds * motionScale
        }
        if (snapshot.totalCharsStreamed > lastCharsSeen && elapsedTotal - lastRippleAt > 0.2) {
          // Pick a random point on the visible face, expressed in the core's local space
          rippleOrigin
            .set(Math.random() * 1.4 - 0.7, Math.random() * 1.4 - 0.7, 0.8)
            .normalize()
          coreInverse.copy(coreMesh.quaternion).invert()
          rippleOrigin.applyQuaternion(coreInverse)
          rippleSlots[nextRippleSlot].set(rippleOrigin.x, rippleOrigin.y, rippleOrigin.z, 0)
          nextRippleSlot = (nextRippleSlot + 1) % rippleSlots.length
          lastRippleAt = elapsedTotal
        }
        lastCharsSeen = snapshot.totalCharsStreamed

        // Short flare when a reply finishes cleanly
        if (lastLifecycle === 'streaming' && snapshot.lifecycle === 'idle') flare = 1
        lastLifecycle = snapshot.lifecycle
        flare *= Math.exp(-2.4 * dtSeconds)
        sharedUniforms.uFlare.value = flare

        bloomPass.strength =
          bloomStrengthBase *
          (1.0 +
            snapshot.pulseEnergy * 0.18 +
            snapshot.synapseFlash * 0.3 +
            snapshot.thinkingTension * 0.2 +
            flare * 0.8)

        // Primary + Complementary Palette Blending across Entity Lifecycle States
        if (snapshot.colorShift < 0.45) {
          const t = snapshot.colorShift / 0.45
          activeColor.lerpColors(cyanColor, emeraldColor, t)
          compColor.lerpColors(indigoCompColor, magentaCompColor, t)
        } else {
          const f = Math.min(1.0, (snapshot.colorShift - 0.45) / 0.45)
          const highEnd = Math.max(0.0, Math.min(1.0, (snapshot.colorShift - 0.88) * 8.0))
          crimsonShiftColor.lerpColors(crimsonColor, coralColor, highEnd)
          compShiftColor.lerpColors(goldCompColor, cyanShockCompColor, highEnd * 0.65)
          activeColor.lerpColors(emeraldColor, crimsonShiftColor, f)
          compColor.lerpColors(magentaCompColor, compShiftColor, f)
        }

        // Bloom billboards breathing (corona carries primary hue, wide halo carries complementary blend)
        const coronaBaseScale = isCompact ? 2.75 : 3.2
        const coronaScale =
          coronaBaseScale *
          (1.0 +
            snapshot.pulseEnergy * 0.18 +
            snapshot.synapseFlash * 0.35 +
            snapshot.streamVelocity * 0.12 +
            flare * 0.3)
        glow.coronaSprite.scale.set(coronaScale, coronaScale, 1.0)
        glow.coronaMaterial.color.copy(activeColor)
        glow.coronaMaterial.opacity = Math.min(
          1.0,
          0.62 +
            snapshot.pulseEnergy * 0.25 +
            snapshot.synapseFlash * 0.38 +
            snapshot.streamVelocity * 0.15
        )

        const wideBaseScale = isCompact ? 5.4 : 6.6
        const wideScale =
          wideBaseScale *
          (1.0 + snapshot.pulseEnergy * 0.22 + snapshot.synapseFlash * 0.3)
        glow.wideSprite.scale.set(wideScale, wideScale, 1.0)
        glow.wideMaterial.color.copy(compColor).lerp(activeColor, 0.45)
        glow.wideMaterial.opacity = Math.min(
          0.85,
          0.28 + snapshot.pulseEnergy * 0.22 + snapshot.synapseFlash * 0.35
        )

        // Core mesh orbital breathing rotation
        const coreSpeed =
          (0.26 + snapshot.streamVelocity * 0.62 + snapshot.thinkingTension * 0.35) * motionScale
        coreMesh.rotation.y += dtSeconds * coreSpeed
        coreMesh.rotation.x += dtSeconds * coreSpeed * 0.38

        // Holographic Aegis containment shell dynamics
        const shellScale = 1.0 - snapshot.thinkingTension * 0.08 + snapshot.pulseEnergy * 0.12
        aegisShellMesh.scale.setScalar(shellScale)
        const shellSpeed =
          (0.22 + snapshot.streamVelocity * 0.65 + snapshot.thinkingTension * 0.45) * motionScale
        aegisShellMesh.rotation.y -= dtSeconds * shellSpeed
        aegisShellMesh.rotation.x += dtSeconds * shellSpeed * 0.52
        aegisShellMesh.rotation.z += dtSeconds * shellSpeed * 0.28

        // Wispy tendrils & lightning network rotation
        const synapseSpeed =
          (0.18 + snapshot.streamVelocity * 0.48 + snapshot.pulseEnergy * 0.22) * motionScale
        synapseGroup.rotation.y += dtSeconds * synapseSpeed
        synapseGroup.rotation.x += dtSeconds * synapseSpeed * 0.32

        // Continuous cyber ribbon rings gyroscopic precession
        const ringPrecessionSpeed =
          (0.42 + snapshot.streamVelocity * 1.4 + snapshot.thinkingTension * 0.75) * motionScale
        rings.ring1.rotation.z += dtSeconds * ringPrecessionSpeed
        rings.ring1.rotation.y += dtSeconds * ringPrecessionSpeed * 0.55
        rings.ring2.rotation.z -= dtSeconds * ringPrecessionSpeed * 0.82
        rings.ring2.rotation.x += dtSeconds * ringPrecessionSpeed * 0.48
        rings.ring3.rotation.y += dtSeconds * ringPrecessionSpeed * 0.7
        rings.ring3.rotation.z += dtSeconds * ringPrecessionSpeed * 0.35

        // Autonomous subtle sinusoidal idle drift (no mouse/pointer movement)
        const idleSwayX = Math.sin(elapsedTotal * 0.55) * 0.045 * motionScale
        const idleSwayY = Math.cos(elapsedTotal * 0.42) * 0.035 * motionScale
        const lean = prefersReducedMotion ? 0 : 1 - Math.exp(-3 * dtSeconds)
        pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * lean
        pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * lean
        rootGroup.rotation.y = idleSwayX + pointerCurrent.x * 0.22
        rootGroup.rotation.x = idleSwayY + pointerCurrent.y * 0.16

        composer.render(dtSeconds)
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
      if (handlePointerMove && typeof window !== 'undefined') {
        window.removeEventListener('pointermove', handlePointerMove)
      }
      if (handlePointerLeave && typeof document !== 'undefined') {
        document.documentElement.removeEventListener('pointerleave', handlePointerLeave)
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

  return (
    <div
      ref={containerRef}
      data-testid="synaptic-entity-canvas"
      className={`relative w-full h-full min-h-[140px] flex items-center justify-center overflow-hidden select-none ${className}`}
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
                'radial-gradient(circle at 38% 36%, rgba(0, 245, 212, 0.9) 0%, rgba(0, 195, 255, 0.75) 32%, rgba(99, 102, 241, 0.55) 64%, rgba(3, 7, 8, 0) 100%)',
              boxShadow: '0 0 48px rgba(0, 195, 255, 0.5), inset 0 0 24px rgba(192, 38, 211, 0.35)',
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
