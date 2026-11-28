/**
 * A 2.5D scene: a Codex painting split into layers, each set at its own depth in CSS 3D space,
 * with a camera that pushes, drifts, rises or descends through it, depth of field that follows
 * the camera's focus, kinetic type on top and a finishing pass (glow, grain, vignette).
 * The way a motion designer builds a parallax shot in a 3D compositor, driven by the frame.
 */
import React from 'react'
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { useBeat } from '../timeline'
import { Finish } from './Finish'
import { TypeLayer, type TypeSpec } from './type'

export interface SceneLayer {
  /** Image path in the render's public folder. */
  src: string
  /** 0 is the far background, 1 sits right in front of the camera. */
  depth: number
  /** Centre of the layer as a share of the frame (default 0.5, 0.5). */
  x?: number
  y?: number
  /** Width as a share of the frame (default: covers the frame). */
  width?: number
  /** Slow float for a hero object, in pixels. */
  float?: number
  /** Turn the hero slowly, in degrees over the beat. */
  turn?: number
  /** A soft light glow behind this layer (hero objects). */
  glow?: string
}

export type CameraMove = 'push' | 'pull' | 'drift-left' | 'drift-right' | 'rise' | 'descend' | 'orbit' | 'hold'

export interface SceneSpec {
  layers: SceneLayer[]
  camera?: CameraMove
  /** Depth the lens is focused on (0 to 1); `focusTo` racks to another depth across the beat. */
  focus?: number
  focusTo?: number
  /** Darken the frame under the type (0 to 1). */
  shade?: number
  /** Light tint for the glow pass. */
  light?: string
  type?: TypeSpec
}

const ease = Easing.bezier(0.45, 0, 0.2, 1)
const PERSPECTIVE = 1400
/** How far apart the depths sit, in pixels of Z. */
const DEPTH_RANGE = 900

export const Scene: React.FC<{ spec: SceneSpec }> = ({ spec }) => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const beat = useBeat()
  const t = interpolate(frame, [0, Math.max(1, beat.duration)], [0, 1], { extrapolateRight: 'clamp', easing: ease })
  const move = spec.camera ?? 'push'
  // Camera position in px: x/y pan, z dolly. The scene moves the opposite way.
  const cam = {
    push: { x: 0, y: 0, z: 260 * t },
    pull: { x: 0, y: 0, z: 260 * (1 - t) },
    'drift-left': { x: -160 * t, y: 0, z: 80 * t },
    'drift-right': { x: 160 * t, y: 0, z: 80 * t },
    rise: { x: 0, y: -140 * t, z: 100 * t },
    descend: { x: 0, y: 220 * t, z: 120 * t },
    orbit: { x: 220 * Math.sin(t * 1.2), y: 0, z: 140 * t },
    hold: { x: 0, y: 0, z: 30 * t },
  }[move]
  const focus = spec.focusTo !== undefined ? interpolate(t, [0, 1], [spec.focus ?? 0.5, spec.focusTo]) : (spec.focus ?? 0.6)
  const layers = [...spec.layers].sort((a, b) => a.depth - b.depth)
  return (
    <AbsoluteFill style={{ background: '#030708', overflow: 'hidden' }}>
      <AbsoluteFill style={{ perspective: PERSPECTIVE, perspectiveOrigin: '50% 50%' }}>
        <AbsoluteFill style={{ transformStyle: 'preserve-3d', transform: `translate3d(${-cam.x}px, ${-cam.y}px, ${cam.z}px)` }}>
          {layers.map((layer, i) => {
            const z = (layer.depth - 0.5) * DEPTH_RANGE
            // Bigger the further back, so a background still covers the frame at its depth.
            const cover = (PERSPECTIVE - z) / PERSPECTIVE
            const w = (layer.width ?? 1.15) * width * cover
            const cx = (layer.x ?? 0.5) * width
            const cy = (layer.y ?? 0.5) * height
            const blur = Math.min(14, Math.abs(layer.depth - focus) * 18)
            const float = layer.float ? Math.sin((frame / 30) * 0.9 + i) * layer.float : 0
            const turn = layer.turn ? interpolate(t, [0, 1], [-layer.turn / 2, layer.turn / 2]) : 0
            const full = layer.width === undefined
            return (
              <div
                key={layer.src + i}
                style={{
                  position: 'absolute',
                  left: full ? (width - w) / 2 : cx - w / 2,
                  top: full ? (height - w * (9 / 16)) / 2 : cy - w / 2,
                  width: w,
                  height: full ? w * (9 / 16) : w,
                  transform: `translateZ(${z}px) translateY(${float}px) rotateY(${turn}deg)`,
                  filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined,
                }}
              >
                {layer.glow ? (
                  <div style={{ position: 'absolute', inset: '-20%', background: `radial-gradient(closest-side, ${layer.glow}, transparent 70%)`, mixBlendMode: 'screen', opacity: 0.55 }} />
                ) : null}
                <Img src={staticFile(layer.src)} style={{ width: '100%', height: '100%', objectFit: full ? 'cover' : 'contain', position: 'relative' }} />
              </div>
            )
          })}
        </AbsoluteFill>
      </AbsoluteFill>
      {spec.shade ? <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(3,7,8,${spec.shade}) 0%, rgba(3,7,8,${spec.shade * 0.5}) 45%, rgba(3,7,8,0) 70%)` }} /> : null}
      {spec.type ? <TypeLayer spec={spec.type} /> : null}
      <Finish light={spec.light} />
    </AbsoluteFill>
  )
}
