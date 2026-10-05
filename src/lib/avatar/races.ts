/**
 * Race rigs. Each race lays out its body parts in the shared design space
 * (centre line x=50, ground y=185) and hands painting to the shared parts.
 */
import { mirroredBlob, taperedCurve, r2, type Pt } from './geometry'
import { glint, ids, piece, type PaintContext } from './paint'
import {
  eyeSize,
  renderAccessory,
  renderAntennae,
  renderArm,
  renderCheeks,
  renderClaw,
  renderEye,
  renderMouth,
  type ArmCurve,
  type AvatarEyeColor,
  type Expression,
  type EyeShape,
  type PupilStyle,
} from './parts'
import type {
  AvatarAccessory,
  AvatarAntennae,
  AvatarBuild,
  AvatarClaws,
  AvatarHeadShape,
  AvatarMouth,
  AvatarPose,
  AvatarRace,
} from './traits'

export const GROUND_Y = 185

export interface CharacterSpec {
  race: AvatarRace
  eyeColor: AvatarEyeColor
  eyeShape: EyeShape
  pupil: PupilStyle
  expression: Expression
  mouth: AvatarMouth
  antennae: AvatarAntennae
  claws: AvatarClaws
  pose: AvatarPose
  accessory: AvatarAccessory
  /** Head silhouette (the shell, for crabs). */
  headShape: AvatarHeadShape
  /** Torso build (leg weight and belly depth, for crabs). */
  build: AvatarBuild
  /** 0.88 (short) to 1.25 (towering). */
  heightScale: number
  /** Claw size multiplier. */
  armScale: number
}

interface PoseSide {
  arm: ArmCurve
  claw: { x: number; y: number; rot: number }
}

const mirrorPt = (p: Pt): Pt => [100 - p[0], p[1]]

function mirrorPose(p: PoseSide): PoseSide {
  return {
    arm: { p0: mirrorPt(p.arm.p0), p1: mirrorPt(p.arm.p1), p2: mirrorPt(p.arm.p2), p3: mirrorPt(p.arm.p3) },
    claw: { x: 100 - p.claw.x, y: p.claw.y, rot: -p.claw.rot },
  }
}

function resolvePose(pose: AvatarPose, table: Record<'up' | 'down' | 'flex' | 'wave', PoseSide>): { left: PoseSide; right: PoseSide } {
  switch (pose) {
    case 'wave':
      return { left: table.down, right: mirrorPose(table.wave) }
    case 'rest':
      return { left: table.down, right: mirrorPose(table.down) }
    case 'flex':
      return { left: table.flex, right: mirrorPose(table.flex) }
    case 'cheer':
    default:
      return { left: table.up, right: mirrorPose(table.up) }
  }
}

/** Move a pose table sideways (and down) so arms clear wider or narrower bodies. */
function shiftPoses(table: Record<'up' | 'down' | 'flex' | 'wave', PoseSide>, dx: number, dy = 0) {
  const mv = (p: Pt): Pt => [p[0] + dx, p[1] + dy]
  const out = {} as Record<'up' | 'down' | 'flex' | 'wave', PoseSide>
  for (const [k, v] of Object.entries(table) as [keyof typeof table, PoseSide][]) {
    out[k] = {
      // The shoulder stays put so the arm still meets the body.
      arm: { p0: [v.arm.p0[0] + dx * 0.4, v.arm.p0[1] + dy], p1: mv(v.arm.p1), p2: mv(v.arm.p2), p3: mv(v.arm.p3) },
      claw: { x: v.claw.x + dx, y: v.claw.y + dy, rot: v.claw.rot },
    }
  }
  return out
}

function renderArmsAndClaws(
  pose: { left: PoseSide; right: PoseSide },
  spec: CharacterSpec,
  ctx: PaintContext,
  clawScale: number
): { arms: string; claws: string } {
  const arms = renderArm(pose.left.arm, 'left', ctx) + renderArm(pose.right.arm, 'right', ctx)
  const claws =
    renderClaw({ ...pose.left.claw, scale: clawScale * spec.armScale, side: 'left' }, spec.claws, ctx) +
    renderClaw({ ...pose.right.claw, scale: clawScale * spec.armScale, side: 'right' }, spec.claws, ctx)
  return { arms, claws }
}

function groundShadow(ctx: PaintContext, rx: number): string {
  return `<ellipse cx="50" cy="${GROUND_Y + 1}" rx="${rx}" ry="7" fill="url(#${ids(ctx).softShadow})"/>`
}

function eyes(spec: CharacterSpec, ctx: PaintContext, y: number, spread: number, base: number): string {
  const size = eyeSize(spec.eyeShape, base)
  const common = { ...size, color: spec.eyeColor, pupil: spec.pupil, expression: spec.expression }
  return `<g class="lobster-idle-layer lobster-idle-eyes">${renderEye({ ...common, cx: 50 - spread, cy: y, side: 'left' }, ctx, 'left')}${renderEye({ ...common, cx: 50 + spread, cy: y, side: 'right' }, ctx, 'right')}</g>`
}

// ---------------------------------------------------------------------------
// Lobster: tall upright bean body, eyes perched on top, pale ribbed belly, fan tail
// ---------------------------------------------------------------------------

const LOBSTER_POSES: Record<'up' | 'down' | 'flex' | 'wave', PoseSide> = {
  up: { arm: { p0: [22, 96], p1: [8, 98], p2: [-4, 82], p3: [0, 62] }, claw: { x: 0, y: 64, rot: -16 } },
  wave: { arm: { p0: [22, 96], p1: [6, 96], p2: [-6, 70], p3: [-2, 46] }, claw: { x: -2, y: 48, rot: -26 } },
  down: { arm: { p0: [22, 98], p1: [12, 102], p2: [6, 112], p3: [6, 124] }, claw: { x: 6, y: 122, rot: 194 } },
  flex: { arm: { p0: [22, 96], p1: [-4, 102], p2: [-12, 86], p3: [-4, 68] }, claw: { x: -4, y: 70, rot: 30 } },
}

interface LobsterHead {
  path: string
  /** Widest half-width, used to push the arms out. */
  half: number
  eyeY: number
  eyeSpread: number
  mouthY: number
  cheekX: number
  cheekY: number
}

const LOBSTER_HEADS: Record<AvatarHeadShape, LobsterHead> = {
  bean: {
    path: 'M50,21 C71,21 85,36 86.5,60 C88,85 82,110 50,113 C18,110 12,85 13.5,60 C15,36 29,21 50,21 Z',
    half: 36.5, eyeY: 24, eyeSpread: 14.5, mouthY: 70, cheekX: 24, cheekY: 66,
  },
  round: {
    path: mirroredBlob([[0, 31], [27, 35], [39, 58], [38.5, 84], [26, 104], [0, 109]]),
    half: 39, eyeY: 33, eyeSpread: 15.5, mouthY: 76, cheekX: 22, cheekY: 72,
  },
  tall: {
    path: mirroredBlob([[0, 6], [21, 13], [30, 44], [31, 82], [21, 107], [0, 113]]),
    half: 31, eyeY: 10, eyeSpread: 13, mouthY: 68, cheekX: 29, cheekY: 64,
  },
  wide: {
    path: mirroredBlob([[0, 40], [34, 42], [49, 63], [46, 90], [28, 106], [0, 109]]),
    half: 49, eyeY: 41, eyeSpread: 19, mouthY: 80, cheekX: 14, cheekY: 76,
  },
  square: {
    path: mirroredBlob([[0, 21], [25, 21.5], [35, 29], [37, 58], [36.5, 92], [29, 108], [0, 112]]),
    half: 37, eyeY: 24, eyeSpread: 15, mouthY: 72, cheekX: 24, cheekY: 68,
  },
  heart: {
    path: mirroredBlob([[0, 20], [14, 23], [23, 42], [41, 84], [33, 105], [0, 113]]),
    half: 41, eyeY: 22, eyeSpread: 12.5, mouthY: 80, cheekX: 18, cheekY: 76,
  },
}

interface LobsterBuild {
  /** Half-width where the torso meets the head. */
  half: number
  /** Half-width of the side curve's control point; above `half` bulges out. */
  bulge: number
  /** Half-width of the curve near the hips; small values make a V shape. */
  hips: number
  bottom: number
  /** Hip x of the left walking leg. */
  legX: number
  legWidth: number
  tail: number
}

const LOBSTER_BUILDS: Record<AvatarBuild, LobsterBuild> = {
  classic: { half: 34, bulge: 35, hips: 22, bottom: 158, legX: 38, legWidth: 11, tail: 0.86 },
  slim: { half: 26, bulge: 27, hips: 15, bottom: 158, legX: 41, legWidth: 9.5, tail: 0.74 },
  chunky: { half: 41, bulge: 44, hips: 31, bottom: 161, legX: 34, legWidth: 13, tail: 0.98 },
  barrel: { half: 30, bulge: 56, hips: 30, bottom: 163, legX: 36, legWidth: 12, tail: 0.9 },
  tapered: { half: 38, bulge: 31, hips: 8, bottom: 161, legX: 42, legWidth: 10, tail: 0.8 },
}

const lobsterLift = (spec: CharacterSpec) => Math.round((spec.heightScale - 1) * 40)

function lobster(spec: CharacterSpec, ctx: PaintContext): string {
  const dy = lobsterLift(spec)
  const top = 88 - dy
  const head = LOBSTER_HEADS[spec.headShape] ?? LOBSTER_HEADS.bean
  const build = LOBSTER_BUILDS[spec.build] ?? LOBSTER_BUILDS.classic
  const bottom = build.bottom

  const tailY = bottom - 4
  const tail = `<g class="lobster-idle-layer lobster-idle-tail"><g transform="translate(50 ${tailY}) scale(${build.tail}) translate(-50 -154)">
    ${piece('M46,152 C30,156 12,166 4,178 C14,186 32,178 47,160 Z', ctx, { side: 'left' })}
    ${piece('M54,152 C70,156 88,166 96,178 C86,186 68,178 53,160 Z', ctx, { side: 'right' })}
    ${piece('M46,154 C38,162 28,174 26,184 C36,188 44,176 49,160 Z', ctx, { side: 'left' })}
    ${piece('M54,154 C62,162 72,174 74,184 C64,188 56,176 51,160 Z', ctx, { side: 'right' })}
    ${piece('M44,154 C42,168 44,180 50,188 C56,180 58,168 56,154 Z', ctx)}
    <path d="M12,174 Q28,168 44,158 M33,180 Q41,170 47,160 M88,174 Q72,168 56,158 M67,180 Q59,170 53,160 M50,160 V182" fill="none" stroke="${ctx.palette.deep}" stroke-width="1" opacity="0.35"/>
  </g></g>`

  // Side legs ride the torso edge, so they follow the build's width.
  const sx = 34 - build.half
  const walkLeg = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, side: 'left' | 'right') => {
    const m = (p: Pt): Pt => (side === 'left' ? [p[0] + sx, p[1]] : [100 - p[0] - sx, p[1]])
    return piece(taperedCurve(m(p0), m(p1), m(p2), m(p3), 4.6, 1.8), ctx, { side, plain: true, noRim: true })
  }
  const sideLegs = `<g class="lobster-idle-layer lobster-idle-flank-limbs">
    ${walkLeg([22, top + 30], [8, top + 30], [2, top + 44], [4, top + 62], 'left')}
    ${walkLeg([24, top + 42], [12, top + 46], [8, top + 60], [10, top + 76], 'left')}
    ${walkLeg([22, top + 30], [8, top + 30], [2, top + 44], [4, top + 62], 'right')}
    ${walkLeg([24, top + 42], [12, top + 46], [8, top + 60], [10, top + 76], 'right')}
  </g>`

  const lx = build.legX - 38
  const leg = (side: 'left' | 'right') => {
    const m = side === 'left' ? (x: number) => x + lx : (x: number) => 100 - x - lx
    const limb = taperedCurve([m(38), 148], [m(36), 160], [m(32), 169], [m(30), 179], build.legWidth, build.legWidth * 0.73)
    const foot = `M${m(39)},186 C${m(39)},179 ${m(33)},175.5 ${m(27)},176 C${m(20)},176.5 ${m(13)},181 ${m(10)},186 Z`
    return piece(limb, ctx, { side, plain: true }) + piece(foot, ctx, { side, plain: true })
  }
  const legs = `<g class="lobster-idle-layer lobster-idle-legs">${leg('left')}${leg('right')}</g>`

  const torso = (half: number, bulge: number, hips: number, y0: number, y1: number, curve: number) =>
    `M${r2(50 - half)},${y0} C${r2(50 - bulge)},${y0 + curve} ${r2(50 - hips)},${y1} 50,${y1} C${r2(50 + hips)},${y1} ${r2(50 + bulge)},${y0 + curve} ${r2(50 + half)},${y0} Z`
  const abdomen = piece(torso(build.half, build.bulge, build.hips, top, bottom, 40), ctx, {
    attrs: 'class="lobster-idle-layer lobster-idle-abdomen"',
  })
  const bellyTop = top + 10
  const bellyBottom = bottom - 6
  const span = bellyBottom - bellyTop
  const k = build.half / 34
  const ridges = [0.36, 0.58, 0.8]
    .map((f) => {
      const y = r2(bellyTop + span * f)
      // Ridges narrow toward the hips, following the build's taper.
      const half = r2((24 - f * 10) * k * (1 - f * (1 - build.hips / 22) * 0.35))
      return `<path d="M${r2(50 - half)},${y} Q50,${r2(y + 6)} ${r2(50 + half)},${y}" fill="none" stroke="${ctx.palette.bellyShade}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M${r2(52 - half)},${r2(y + 2.6)} Q50,${r2(y + 7.6)} ${r2(48 + half)},${r2(y + 2.6)}" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>`
    })
    .join('')
  const bellyPath = torso(build.half - 9, build.bulge - 9, Math.max(build.hips - 7, 4), bellyTop, bellyBottom, 32)
  const belly = `<g class="avatar-belly">${piece(bellyPath, ctx, { belly: true, noRim: true })}${ridges}</g>`

  const hx = 36.5 - head.half
  const pose = resolvePose(spec.pose, shiftPoses(LOBSTER_POSES, hx * 0.9))
  const { arms, claws } = renderArmsAndClaws(pose, spec, ctx, 0.78)
  const glintMove = `translate(${r2(hx * 0.8)} ${head.eyeY - 24})`

  const upper = `<g transform="translate(0 ${-dy})"><g class="lobster-idle-layer lobster-idle-carapace">
    ${arms}
    ${piece(head.path, ctx)}
    <g transform="${glintMove}">${glint('M24,48 C24,36 31,28 39,25 C34,32 30,40 29,50 Z', ctx, 0.5)}</g>
    ${renderCheeks(ctx, head.cheekX, 100 - head.cheekX, head.cheekY)}
    ${renderMouth(spec.mouth, 50, head.mouthY, ctx)}
    ${renderAntennae(spec.antennae, ctx, { left: [45, head.eyeY], right: [55, head.eyeY] })}
    ${eyes(spec, ctx, head.eyeY, head.eyeSpread, 15.5)}
    ${claws}
    ${renderAccessory(spec.accessory, ctx, { x: 50, top: head.eyeY - 14, eyeY: head.eyeY + 1, mouth: [50, head.mouthY] })}
  </g></g>`

  return `<g class="avatar-character" data-race="lobster">${groundShadow(ctx, 46 + (build.half - 34) * 0.6)}${tail}${sideLegs}${legs}${abdomen}${belly}${upper}</g>`
}

// ---------------------------------------------------------------------------
// Crab: wide rounded shell, eyes up on stalks, six pointed legs
// ---------------------------------------------------------------------------

const CRAB_DROP = 30

interface CrabShell {
  path: string
  half: number
  /** y of the widest point, where the side spikes sit. */
  widestY: number
  /** Highest point of the shell's rim. */
  crown: number
  bottom: number
  eyeY: number
}

const CRAB_SHELLS: Record<AvatarHeadShape, CrabShell> = {
  bean: {
    path: 'M50,50 C78,50 99,62 100.5,80 C102,101 84,119 50,119 C16,119 -2,101 -0.5,80 C1,62 22,50 50,50 Z',
    half: 50.5, widestY: 80, crown: 50, bottom: 119, eyeY: 25,
  },
  round: {
    path: mirroredBlob([[0, 42], [30, 46], [45.5, 70], [44, 98], [27, 117], [0, 121]]),
    half: 45.5, widestY: 76, crown: 42, bottom: 121, eyeY: 18,
  },
  tall: {
    path: mirroredBlob([[0, 34], [26, 40], [40.5, 68], [41, 100], [26, 119], [0, 123]]),
    half: 41.5, widestY: 82, crown: 34, bottom: 123, eyeY: 11,
  },
  wide: {
    path: mirroredBlob([[0, 58], [36, 59], [58, 75], [55, 96], [36, 113], [0, 117]]),
    half: 58, widestY: 82, crown: 58, bottom: 117, eyeY: 32,
  },
  square: {
    path: mirroredBlob([[0, 50], [34, 50.5], [47, 56], [50.5, 80], [48, 106], [34, 117], [0, 119]]),
    half: 50.5, widestY: 80, crown: 50, bottom: 119, eyeY: 25,
  },
  heart: {
    path: mirroredBlob([[0, 57], [16, 50], [38, 51], [52, 68], [44, 98], [22, 116], [0, 125]]),
    half: 52, widestY: 70, crown: 50, bottom: 125, eyeY: 25,
  },
}

interface CrabBuild {
  /** Shell stretch: width and height. */
  sx: number
  sy: number
  legWidth: number
  /** Extra depth for the pale underside. */
  belly: number
  /** Lower-leg taper end width. */
  tip: number
}

const CRAB_BUILDS: Record<AvatarBuild, CrabBuild> = {
  classic: { sx: 1, sy: 1, legWidth: 1, belly: 0, tip: 2 },
  slim: { sx: 0.84, sy: 0.96, legWidth: 0.62, belly: -2, tip: 1.2 },
  chunky: { sx: 1.12, sy: 1.02, legWidth: 1.6, belly: 3, tip: 4 },
  barrel: { sx: 0.96, sy: 1.18, legWidth: 1.25, belly: 10, tip: 2.6 },
  tapered: { sx: 1.06, sy: 0.88, legWidth: 0.95, belly: 0, tip: 0.6 },
}

const CRAB_POSES: Record<'up' | 'down' | 'flex' | 'wave', PoseSide> = {
  up: { arm: { p0: [8, 86], p1: [-6, 86], p2: [-14, 70], p3: [-10, 52] }, claw: { x: -10, y: 54, rot: -14 } },
  wave: { arm: { p0: [8, 86], p1: [-8, 84], p2: [-18, 60], p3: [-12, 38] }, claw: { x: -12, y: 40, rot: -24 } },
  down: { arm: { p0: [8, 90], p1: [-2, 96], p2: [-6, 104], p3: [-6, 112] }, claw: { x: -6, y: 110, rot: 168 } },
  flex: { arm: { p0: [8, 86], p1: [-14, 94], p2: [-22, 76], p3: [-12, 58] }, claw: { x: -12, y: 60, rot: 32 } },
}

function stretchShell(shell: CrabShell, build: CrabBuild): CrabShell {
  const cy = shell.widestY
  const crown = r2(cy - (cy - shell.crown) * build.sy)
  return {
    ...shell,
    half: r2(shell.half * build.sx),
    crown,
    bottom: r2(cy + (shell.bottom - cy) * build.sy),
    eyeY: r2(shell.eyeY + (crown - shell.crown)),
  }
}

/** Height mostly stretches the legs: short crabs squat, towering crabs stand tall on stilts. */
const crabLift = (spec: CharacterSpec) => Math.round((spec.heightScale - 1) * 95) - CRAB_DROP

function crab(spec: CharacterSpec, ctx: PaintContext): string {
  const dy = crabLift(spec)
  const base = CRAB_SHELLS[spec.headShape] ?? CRAB_SHELLS.bean
  const build = CRAB_BUILDS[spec.build] ?? CRAB_BUILDS.classic
  // The build stretches the shell around its widest point; everything outside the shell
  // (legs, arms, eyes, face) is laid out against the stretched size.
  const shell = stretchShell(base, build)
  const hs = shell.half / 50.5
  const wx = shell.half - 50.5
  const by = shell.bottom - 119

  const leg = (hip: Pt, knee: Pt, tip: Pt, side: 'left' | 'right') => {
    const m = (p: Pt): Pt => (side === 'left' ? p : [100 - p[0], p[1]])
    const h = m([50 - (50 - hip[0]) * hs, hip[1] + by - dy])
    const k = m([knee[0] - wx, knee[1] + by - dy * 0.6])
    const t = m([tip[0] - wx * 0.6, tip[1]])
    const w = build.legWidth
    const upperSeg = taperedCurve(h, [h[0] + (k[0] - h[0]) * 0.4, h[1] - 5], [k[0] + (h[0] - k[0]) * 0.3, k[1] - 4], k, 8.5 * w, 6.8 * w)
    const lowerSeg = taperedCurve(k, [k[0] - 2, k[1] + (t[1] - k[1]) * 0.4], [t[0], t[1] - 18], t, 6.8 * w, build.tip)
    return piece(lowerSeg, ctx, { side, plain: true, noRim: true }) + piece(upperSeg, ctx, { side, plain: true })
  }
  const legSet = (side: 'left' | 'right') =>
    leg([14, 98], [-16, 100], [-26, 184], side) + leg([20, 106], [-6, 112], [-10, 185], side) + leg([30, 111], [8, 124], [6, 185], side)
  const legs = `<g class="lobster-idle-layer lobster-idle-legs">${legSet('left')}${legSet('right')}</g>`

  const spike = (bx: number, y: number, pts: [number, number][], side: 'left' | 'right') => {
    const m = (x: number) => (side === 'left' ? x : 100 - x)
    const d = `M${r2(m(bx))},${r2(y)} ` + pts.map(([x, py]) => `L${r2(m(bx + x))},${r2(y + py)}`).join(' ') + ' Z'
    return piece(d, ctx, { side, plain: true, noRim: true })
  }
  const s1x = 50 - (base.half - 6.5)
  const s2x = 50 - (base.half - 1.5)
  const spikes = (['left', 'right'] as const)
    .map(
      (side) =>
        spike(s1x, base.widestY - 17, [[-10, -5], [-3, 8]], side) +
        spike(s2x, base.widestY - 7, [[-9, -1], [-1, 8]], side) +
        (spec.build === 'tapered' ? spike(s2x + 1, base.widestY + 5, [[-8, 3], [1, 8]], side) + spike(s1x + 9, base.widestY - 27, [[-6, -8], [2, 2]], side) : '')
    )
    .join('')

  const ux = 32 * hs
  const uy = shell.bottom - 11
  const deep = 18 + build.belly
  const underside = piece(
    `M${r2(50 - ux)},${uy} C${r2(50 - ux + 6)},${uy + deep} ${r2(50 + ux - 6)},${uy + deep} ${r2(50 + ux)},${uy} C${r2(50 + ux - 12)},${uy + 8} ${r2(50 - ux + 12)},${uy + 8} ${r2(50 - ux)},${uy} Z`,
    ctx,
    { belly: true, noRim: true }
  )
  const stalkBase = shell.crown + 8
  const stalk = (side: 'left' | 'right') => {
    const m = side === 'left' ? (x: number) => x : (x: number) => 100 - x
    const e = shell.eyeY + 5
    const mid = (stalkBase + e) / 2
    return piece(taperedCurve([m(44), stalkBase], [m(43), mid + 4], [m(40), mid - 4], [m(38.5), e], 7.5, 6), ctx, { side, plain: true })
  }
  const pose = resolvePose(spec.pose, shiftPoses(CRAB_POSES, -wx, shell.widestY - 80))
  const { arms, claws } = renderArmsAndClaws(pose, spec, ctx, 0.9)
  const mouthY = r2((shell.crown + shell.bottom) / 2 + 3.5)
  const stretch =
    build.sx === 1 && build.sy === 1
      ? ''
      : ` transform="translate(50 ${base.widestY}) scale(${build.sx} ${build.sy}) translate(-50 ${-base.widestY})"`

  const upper = `<g transform="translate(0 ${-dy})"><g class="lobster-idle-layer lobster-idle-carapace">
    ${arms}
    ${renderAntennae(spec.antennae, ctx, { left: [46, stalkBase - 4], right: [54, stalkBase - 4] }, 0.42)}
    ${stalk('left')}${stalk('right')}
    ${underside}
    <g${stretch}>
      ${spikes}
      ${piece(base.path, ctx)}
      <g transform="translate(${r2(-(base.half - 50.5) * 0.9)} ${base.crown - 50})">${glint('M10,76 C12,66 20,58 30,55 C24,61 18,68 15,78 Z', ctx, 0.5)}</g>
      <path d="M${r2(50 - 20 * (base.half / 50.5))},${base.crown + 12} Q50,${base.crown + 6} ${r2(50 + 20 * (base.half / 50.5))},${base.crown + 12}" fill="none" stroke="${ctx.palette.deep}" stroke-width="1.2" opacity="0.25" stroke-linecap="round"/>
    </g>
    ${renderCheeks(ctx, r2(50 - 26 * hs), r2(50 + 26 * hs), mouthY - 2)}
    ${renderMouth(spec.mouth, 50, mouthY, ctx, 1.05)}
    ${eyes(spec, ctx, shell.eyeY, 13, 14)}
    ${claws}
    ${renderAccessory(spec.accessory, ctx, { x: 50, top: shell.eyeY - 14, eyeY: shell.eyeY, mouth: [50, mouthY] })}
  </g></g>`

  return `<g class="avatar-character" data-race="crab">${groundShadow(ctx, 56 + wx * 0.6)}${legs}${upper}</g>`
}

/** Head (lobster) and shell (crab) outlines, for shape pickers in the creator. */
export function headShapeOutline(race: AvatarRace, shape: AvatarHeadShape): string {
  return race === 'crab' ? CRAB_SHELLS[shape].path : LOBSTER_HEADS[shape].path
}

/**
 * Portrait crop for this character. The crop follows the eyes, so tall heads,
 * low crabs, and every height still frame the face the same way.
 */
export function portraitViewBox(spec: CharacterSpec): string {
  if (spec.race === 'crab') {
    const shell = stretchShell(CRAB_SHELLS[spec.headShape] ?? CRAB_SHELLS.bean, CRAB_BUILDS[spec.build] ?? CRAB_BUILDS.classic)
    return `-9 ${r2(shell.eyeY - crabLift(spec) - 36)} 118 118`
  }
  const head = LOBSTER_HEADS[spec.headShape] ?? LOBSTER_HEADS.bean
  return `-9 ${r2(head.eyeY - lobsterLift(spec) - 35)} 118 118`
}

export function renderCharacter(spec: CharacterSpec, ctx: PaintContext): string {
  return spec.race === 'crab' ? crab(spec, ctx) : lobster(spec, ctx)
}
