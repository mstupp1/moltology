/**
 * The 3D emblem's baked light (made by `npm run emblem:bake`, see scripts/brand/).
 *
 * - Matcaps: one lit ball per material. BrandIcon3D shades the mesh from these instead of
 *   lighting it with five lights and a clear-coat material every frame.
 * - Turntable: the emblem rocking through one loop, `frames` frames side by side in one WebP.
 *   GlowEmblem steps through it with CSS, so hero marks get the 3D look with no WebGL.
 */
/** Bump after re-baking: /images/* is cached for a year. */
const BAKE_VERSION = 1

export const EMBLEM_MATCAP = {
  cap: `/images/emblem/matcap-cap.webp?v=${BAKE_VERSION}`,
  bevel: `/images/emblem/matcap-bevel.webp?v=${BAKE_VERSION}`,
} as const

export const EMBLEM_TURNTABLE = {
  src: `/images/emblem/turntable.webp?v=${BAKE_VERSION}`,
  /** Frames in the strip, one loop of the rock. */
  frames: 36,
  /** Each frame's square size in pixels (2x the 56px sign-in mark; the 72px 404 mark is close enough). */
  frameSize: 112,
  /** Seconds for one loop. */
  seconds: 6,
} as const

/** The emblem's pose at `t` (0..1) through one loop: a gentle rock that shows the bevels. */
export function emblemTurntablePose(t: number): { x: number; y: number; z: number } {
  const a = t * Math.PI * 2
  return {
    y: -0.12 + Math.sin(a) * 0.3,
    x: 0.08 + Math.cos(a) * 0.1,
    z: Math.sin(a) * 0.03,
  }
}
