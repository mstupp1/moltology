/**
 * The YouTube thumbnail: a set's wide plate, one cast member in 3D with a clear emotion, and at
 * most four words. Rendered as a still at 1280x720 by create-longform.
 */
import React from 'react'
import { ThreeCanvas } from '@remotion/three'
import { AbsoluteFill, Img, staticFile } from 'remotion'
import { useThree } from '@react-three/fiber'
import { C, FONT } from './theme'
import { useMoltPair } from './motion/shell3d'
import { Emblem } from './motion/cards'

export type ThumbnailProps = {
  text: string
  plate?: string
  cast?: string
  /** Show the empty glassy shell beside the character. */
  husk?: boolean
} & Record<string, unknown>

const Aim: React.FC<{ y: number }> = ({ y }) => {
  const camera = useThree((s) => s.camera)
  camera.lookAt(0, y, 0)
  return null
}

export const Thumbnail: React.FC<ThumbnailProps> = ({ text, plate, cast = 'crab_juno_marsh', husk = true }) => {
  const { crab, husk: shell } = useMoltPair(cast)
  const h = crab.height
  return (
    <AbsoluteFill style={{ background: C.abyss }}>
      {plate ? <Img src={staticFile(plate)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
      <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(3,7,8,0.85) 0%, rgba(3,7,8,0.55) 45%, rgba(3,7,8,0) 75%)' }} />
      <div style={{ position: 'absolute', right: -40, top: 0, width: 760, height: 720 }}>
        <ThreeCanvas width={760} height={720} camera={{ position: [h * 0.9, h * 0.75, h * 2.6], fov: 30 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 6, 4]} intensity={2.6} color="#e6f8ff" />
          <pointLight position={[-4, 1.5, 3]} intensity={18} color="#00c3ff" />
          <pointLight position={[4, 0, 2]} intensity={12} color="#ff9a6a" />
          <Aim y={h * 0.05} />
          <group position={[0.15 * h, -h * 0.5, 0]} rotation={[0, -0.45, 0]}>
            <primitive object={crab.root} />
            {husk ? <primitive object={shell} position={[-h * 1.15, 0, -h * 0.35]} rotation={[0, 0.7, 0.04]} scale={0.98} /> : null}
          </group>
        </ThreeCanvas>
      </div>
      <div style={{ position: 'absolute', left: 64, top: 64, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Emblem size={52} />
        <div style={{ fontFamily: FONT.text, fontSize: 26, color: C.inkBody, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Molt Academy</div>
      </div>
      <div style={{ position: 'absolute', left: 60, bottom: 90, width: 600, fontFamily: FONT.title, fontSize: 132, fontWeight: 500, lineHeight: 0.95, color: C.ink, letterSpacing: '-0.03em', textShadow: '0 6px 30px rgba(0,0,0,0.6)' }}>
        {text}
      </div>
    </AbsoluteFill>
  )
}
