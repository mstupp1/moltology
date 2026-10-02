/**
 * Race rigs. Each race lays out its body parts in the shared design space
 * (centre line x=50, ground y=185) and hands painting to the shared parts.
 */
import { taperedCurve, r2, type Pt } from './geometry'
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
import type { AvatarAccessory, AvatarAntennae, AvatarClaws, AvatarMouth, AvatarPose, AvatarRace } from './traits'

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

function lobster(spec: CharacterSpec, ctx: PaintContext): string {
  const dy = Math.round((spec.heightScale - 1) * 40)
  const top = 88 - dy

  const tail = `<g class="lobster-idle-layer lobster-idle-tail"><g transform="translate(50 154) scale(0.86) translate(-50 -154)">
    ${piece('M46,152 C30,156 12,166 4,178 C14,186 32,178 47,160 Z', ctx, { side: 'left' })}
    ${piece('M54,152 C70,156 88,166 96,178 C86,186 68,178 53,160 Z', ctx, { side: 'right' })}
    ${piece('M46,154 C38,162 28,174 26,184 C36,188 44,176 49,160 Z', ctx, { side: 'left' })}
    ${piece('M54,154 C62,162 72,174 74,184 C64,188 56,176 51,160 Z', ctx, { side: 'right' })}
    ${piece('M44,154 C42,168 44,180 50,188 C56,180 58,168 56,154 Z', ctx)}
    <path d="M12,174 Q28,168 44,158 M33,180 Q41,170 47,160 M88,174 Q72,168 56,158 M67,180 Q59,170 53,160 M50,160 V182" fill="none" stroke="${ctx.palette.deep}" stroke-width="1" opacity="0.35"/>
  </g></g>`

  const walkLeg = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, side: 'left' | 'right') =>
    piece(taperedCurve(p0, p1, p2, p3, 4.6, 1.8), ctx, { side, plain: true, noRim: true })
  const sideLegs = `<g class="lobster-idle-layer lobster-idle-flank-limbs">
    ${walkLeg([22, top + 30], [8, top + 30], [2, top + 44], [4, top + 62], 'left')}
    ${walkLeg([24, top + 42], [12, top + 46], [8, top + 60], [10, top + 76], 'left')}
    ${walkLeg([78, top + 30], [92, top + 30], [98, top + 44], [96, top + 62], 'right')}
    ${walkLeg([76, top + 42], [88, top + 46], [92, top + 60], [90, top + 76], 'right')}
  </g>`

  const leg = (side: 'left' | 'right') => {
    const m = side === 'left' ? (x: number) => x : (x: number) => 100 - x
    const limb = taperedCurve([m(38), 148], [m(36), 160], [m(32), 169], [m(30), 179], 11, 8)
    const foot = side === 'left'
      ? 'M39,186 C39,179 33,175.5 27,176 C20,176.5 13,181 10,186 Z'
      : 'M61,186 C61,179 67,175.5 73,176 C80,176.5 87,181 90,186 Z'
    return piece(limb, ctx, { side, plain: true }) + piece(foot, ctx, { side, plain: true })
  }
  const legs = `<g class="lobster-idle-layer lobster-idle-legs">${leg('left')}${leg('right')}</g>`

  const abdomen = piece(`M16,${top} C15,${top + 40} 28,158 50,158 C72,158 85,${top + 40} 84,${top} Z`, ctx, {
    attrs: 'class="lobster-idle-layer lobster-idle-abdomen"',
  })
  const bellyTop = top + 10
  const span = 152 - bellyTop
  const ridges = [0.36, 0.58, 0.8]
    .map((f) => {
      const y = r2(bellyTop + span * f)
      const half = r2(24 - f * 10)
      return `<path d="M${r2(50 - half)},${y} Q50,${r2(y + 6)} ${r2(50 + half)},${y}" fill="none" stroke="${ctx.palette.bellyShade}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M${r2(52 - half)},${r2(y + 2.6)} Q50,${r2(y + 7.6)} ${r2(48 + half)},${r2(y + 2.6)}" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>`
    })
    .join('')
  const belly = `<g class="avatar-belly">${piece(`M25,${bellyTop} C24,${bellyTop + 32} 35,152 50,152 C65,152 76,${bellyTop + 32} 75,${bellyTop} Z`, ctx, { belly: true, noRim: true })}${ridges}</g>`

  const head = 'M50,21 C71,21 85,36 86.5,60 C88,85 82,110 50,113 C18,110 12,85 13.5,60 C15,36 29,21 50,21 Z'
  const pose = resolvePose(spec.pose, LOBSTER_POSES)
  const { arms, claws } = renderArmsAndClaws(pose, spec, ctx, 0.78)

  const upper = `<g transform="translate(0 ${-dy})"><g class="lobster-idle-layer lobster-idle-carapace">
    ${arms}
    ${piece(head, ctx)}
    ${glint('M24,48 C24,36 31,28 39,25 C34,32 30,40 29,50 Z', ctx, 0.5)}
    ${renderCheeks(ctx, 24, 76, 66)}
    ${renderMouth(spec.mouth, 50, 70, ctx)}
    ${renderAntennae(spec.antennae, ctx, { left: [45, 24], right: [55, 24] })}
    ${eyes(spec, ctx, 24, 14.5, 15.5)}
    ${claws}
    ${renderAccessory(spec.accessory, ctx, { x: 50, top: 10, eyeY: 25, mouth: [50, 70] })}
  </g></g>`

  return `<g class="avatar-character" data-race="lobster">${groundShadow(ctx, 46)}${tail}${sideLegs}${legs}${abdomen}${belly}${upper}</g>`
}

// ---------------------------------------------------------------------------
// Crab: wide rounded shell, eyes up on stalks, six pointed legs
// ---------------------------------------------------------------------------

const CRAB_DROP = 30

const CRAB_POSES: Record<'up' | 'down' | 'flex' | 'wave', PoseSide> = {
  up: { arm: { p0: [8, 86], p1: [-6, 86], p2: [-14, 70], p3: [-10, 52] }, claw: { x: -10, y: 54, rot: -14 } },
  wave: { arm: { p0: [8, 86], p1: [-8, 84], p2: [-18, 60], p3: [-12, 38] }, claw: { x: -12, y: 40, rot: -24 } },
  down: { arm: { p0: [8, 90], p1: [-2, 96], p2: [-6, 104], p3: [-6, 112] }, claw: { x: -6, y: 110, rot: 168 } },
  flex: { arm: { p0: [8, 86], p1: [-14, 94], p2: [-22, 76], p3: [-12, 58] }, claw: { x: -12, y: 60, rot: 32 } },
}

function crab(spec: CharacterSpec, ctx: PaintContext): string {
  // The crab is drawn high, then the whole body drops onto shorter legs (CRAB_DROP).
  const dy = Math.round((spec.heightScale - 1) * 30) - CRAB_DROP

  const leg = (hip: Pt, knee: Pt, tip: Pt, side: 'left' | 'right') => {
    const m = (p: Pt): Pt => (side === 'left' ? p : [100 - p[0], p[1]])
    const h = m([hip[0], hip[1] - dy])
    const k = m([knee[0], knee[1] - dy * 0.6])
    const t = m(tip)
    const upperSeg = taperedCurve(h, [h[0] + (k[0] - h[0]) * 0.4, h[1] - 5], [k[0] + (h[0] - k[0]) * 0.3, k[1] - 4], k, 8.5, 6.8)
    const lowerSeg = taperedCurve(k, [k[0] - 2, k[1] + (t[1] - k[1]) * 0.4], [t[0], t[1] - 18], t, 6.8, 2)
    return piece(lowerSeg, ctx, { side, plain: true, noRim: true }) + piece(upperSeg, ctx, { side, plain: true })
  }
  const legSet = (side: 'left' | 'right') =>
    leg([14, 98], [-16, 100], [-26, 184], side) + leg([20, 106], [-6, 112], [-10, 185], side) + leg([30, 111], [8, 124], [6, 185], side)
  const legs = `<g class="lobster-idle-layer lobster-idle-legs">${legSet('left')}${legSet('right')}</g>`

  const shell = 'M50,50 C78,50 99,62 100.5,80 C102,101 84,119 50,119 C16,119 -2,101 -0.5,80 C1,62 22,50 50,50 Z'
  const spikes = [
    piece('M6,63 L-4,58 L3,71 Z', ctx, { side: 'left', plain: true, noRim: true }),
    piece('M1,73 L-8,72 L0,81 Z', ctx, { side: 'left', plain: true, noRim: true }),
    piece('M94,63 L104,58 L97,71 Z', ctx, { side: 'right', plain: true, noRim: true }),
    piece('M99,73 L108,72 L100,81 Z', ctx, { side: 'right', plain: true, noRim: true }),
  ].join('')
  const underside = piece('M18,108 C24,126 76,126 82,108 C70,116 30,116 18,108 Z', ctx, { belly: true, noRim: true })
  const stalk = (side: 'left' | 'right') => {
    const m = side === 'left' ? (x: number) => x : (x: number) => 100 - x
    return piece(taperedCurve([m(44), 58], [m(43), 48], [m(40), 40], [m(38.5), 30], 7.5, 6), ctx, { side, plain: true })
  }
  const pose = resolvePose(spec.pose, CRAB_POSES)
  const { arms, claws } = renderArmsAndClaws(pose, spec, ctx, 0.9)

  const upper = `<g transform="translate(0 ${-dy})"><g class="lobster-idle-layer lobster-idle-carapace">
    ${arms}
    ${renderAntennae(spec.antennae, ctx, { left: [46, 54], right: [54, 54] }, 0.42)}
    ${stalk('left')}${stalk('right')}
    ${spikes}
    ${underside}
    ${piece(shell, ctx)}
    ${glint('M10,76 C12,66 20,58 30,55 C24,61 18,68 15,78 Z', ctx, 0.5)}
    <path d="M30,62 Q50,56 70,62" fill="none" stroke="${ctx.palette.deep}" stroke-width="1.2" opacity="0.25" stroke-linecap="round"/>
    ${renderCheeks(ctx, 24, 76, 86)}
    ${renderMouth(spec.mouth, 50, 88, ctx, 1.05)}
    ${eyes(spec, ctx, 25, 13, 14)}
    ${claws}
    ${renderAccessory(spec.accessory, ctx, { x: 50, top: 11, eyeY: 25, mouth: [50, 88] })}
  </g></g>`

  return `<g class="avatar-character" data-race="crab">${groundShadow(ctx, 56)}${legs}${upper}</g>`
}

export function renderCharacter(spec: CharacterSpec, ctx: PaintContext): string {
  return spec.race === 'crab' ? crab(spec, ctx) : lobster(spec, ctx)
}
