/**
 * The molt in 3D with the real cast character (src/lib/avatar3d): the crab inside a snug,
 * glassy copy of its own shell, turning; then the crab backs out and the empty shell stays.
 * Poses hold still and every move comes from useCurrentFrame() (never useFrame), so renders
 * match the preview frame for frame.
 */
import React, { useEffect, useMemo, useState } from 'react'
import { ThreeCanvas } from '@remotion/three'
import { useThree } from '@react-three/fiber'
import { AbsoluteFill, Easing, continueRender, delayRender, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { Mesh, MeshPhysicalMaterial, type Group, type Material } from 'three'
import castFile from '../../content/characters/cast.json'
import { buildCharacter, preloadTextures, lookFromConfig } from '@/lib/avatar3d'
import { GEAR_SURFACES, TEXTURE_MARKINGS } from '@/lib/avatar3d/textures'
import { parseLobsterAvatarConfig } from '@/lib/lobster-avatar'
import { staticFile } from 'remotion'
import { cueAt, useBeat } from '../timeline'
import { DeepWater } from '../ui/primitives'

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = Easing.bezier(0.33, 0, 0.2, 1)

/**
 * Shell textures come from the render's public folder (create-longform copies them to
 * avatar-textures/), the same files anim:create hands its player.
 */
const TEXTURE_NAMES = ['shell-detail', ...TEXTURE_MARKINGS.map((m) => `marking-${m}`), ...GEAR_SURFACES.map((g) => `gear-${g}`), 'gear-engraving']
const g = globalThis as { __avatar3dTextures?: Record<string, string> }
g.__avatar3dTextures ??= Object.fromEntries(TEXTURE_NAMES.map((n) => [n, staticFile(`avatar-textures/${n}.webp`)]))

type CastFile = { cast: Record<string, { config: Record<string, unknown> }> }

function lookOf(id: string) {
  const member = (castFile as CastFile).cast[id]
  const config = parseLobsterAvatarConfig({ ...member.config, pose: 'rest' })
  if (!config) throw new Error(`Cast member ${id} has no valid config`)
  return lookFromConfig(config)
}

/** The crab and a glassy copy of its shell, built once per character. */
function useMoltPair(castId: string) {
  const [handle] = useState(() => delayRender(`Building ${castId}`))
  const look = useMemo(() => lookOf(castId), [castId])
  const pair = useMemo(() => {
    const crab = buildCharacter(look)
    crab.setPose('rest', true)
    const husk = crab.root.clone(true) as Group
    const glass = new MeshPhysicalMaterial({ color: '#f3c08a', roughness: 0.25, transmission: 0.55, thickness: 0.4, transparent: true, opacity: 0.55, clearcoat: 1 })
    husk.traverse((o) => {
      if (o instanceof Mesh) o.material = glass as Material
    })
    return { crab, husk, glass }
  }, [look])
  useEffect(() => {
    preloadTextures(look).finally(() => continueRender(handle))
  }, [look, handle])
  return pair
}

/** Points the camera at the middle of the crab (no useFrame: set once per render). */
const Aim: React.FC<{ y: number }> = ({ y }) => {
  const camera = useThree((s) => s.camera)
  camera.lookAt(0, y, 0)
  return null
}

const Lights: React.FC = () => (
  <>
    <ambientLight intensity={0.5} />
    <directionalLight position={[2, 6, 4]} intensity={2.4} color="#d6f6ff" />
    <pointLight position={[-4, 1.5, 3]} intensity={20} color="#00c3ff" />
    <pointLight position={[4, 0, 2]} intensity={12} color="#ff9a6a" />
  </>
)

/** "A crab's shell doesn't grow with the crab": the pair turns; the shell glints tight around it. */
export const ShellTurntable: React.FC<{ cast?: string }> = ({ cast = 'crab_juno_marsh' }) => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const { crab, husk, glass } = useMoltPair(cast)
  const h = crab.height
  const beat = useBeat()
  const tight = interpolate(frame, [cueAt(beat, 'grow', 0.6), cueAt(beat, 'grow', 0.6) + 20], [0, 1], clamp)
  glass.opacity = 0.35 + 0.3 * tight
  return (
    <AbsoluteFill>
      <DeepWater />
      <ThreeCanvas width={width} height={height} camera={{ position: [0, h * 0.7, h * 2.6], fov: 32 }}>
        <Lights />
        <Aim y={0} />
        <group rotation={[0, -0.6 + frame * 0.01, 0]} position={[0, -h * 0.45, 0]}>
          <primitive object={crab.root} />
          <primitive object={husk} scale={1.03} />
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  )
}

/** "It splits the old shell open and climbs out": the crab backs out; the empty shell stays. */
export const ShellSplit: React.FC<{ cast?: string }> = ({ cast = 'crab_juno_marsh' }) => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const { crab, husk, glass } = useMoltPair(cast)
  const h = crab.height
  const beat = useBeat()
  const outAt = cueAt(beat, 'climbs', 0.45)
  const out = interpolate(frame, [cueAt(beat, 'splits', 0.25), outAt + 36], [0, 1], { ...clamp, easing: ease })
  glass.opacity = 0.55
  return (
    <AbsoluteFill>
      <DeepWater />
      <ThreeCanvas width={width} height={height} camera={{ position: [h * 1.2, h * 0.9, h * 3.2], fov: 32 }}>
        <Lights />
        <Aim y={h * 0.1} />
        <group position={[0, -h * 0.45, 0]} rotation={[0, -0.35, 0]}>
          <primitive object={husk} scale={1.03} rotation={[0.08 * out, 0, 0]} />
          <group position={[0, h * 0.25 * Math.sin(out * Math.PI), -h * 1.25 * out]} rotation={[-0.25 * Math.sin(out * Math.PI), 0, 0]}>
            <primitive object={crab.root} />
          </group>
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  )
}
