/** Shared articulated SVG rig. Both species use six walking legs and two pincer arms. */
import { taperedCurve, r2, type Pt } from './geometry'
import { piece, type PaintContext } from './paint'
import {
  eyeSize,
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
import type { EquippedAppearance } from '../character-appearance'
import { getEquipmentVisual, renderEquipment } from './equipment'

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
  headShape: AvatarHeadShape
  build: AvatarBuild
  heightScale: number
  armScale: number
  equipment?: EquippedAppearance
}
export interface RigAttachment {
  x: number
  y: number
  sx: number
  sy: number
  rotation?: number
}
export interface CharacterRig {
  head: RigAttachment
  carapace: RigAttachment
  belt: RigAttachment
  antennae: RigAttachment
  legs: [RigAttachment, RigAttachment]
  claws: [RigAttachment, RigAttachment]
  shoulder: number
  half: number
  faceY: number
  mouthY: number
  crown: number
  hipY: number
}
const HEAD_WIDTH: Record<AvatarHeadShape, number> = {
  bean: 1,
  round: 1.04,
  tall: 0.87,
  wide: 1.18,
  square: 1.02,
  heart: 1.03,
}
const BUILD_WIDTH: Record<AvatarBuild, number> = {
  classic: 1,
  slim: 0.83,
  chunky: 1.13,
  barrel: 1.16,
  tapered: 0.93,
}
const HEAD_TOP: Record<AvatarHeadShape, number> = {
  bean: 23,
  round: 26,
  tall: 16,
  wide: 30,
  square: 24,
  heart: 22,
}

export function characterRig(spec: CharacterSpec): CharacterRig {
  const crab = spec.race === 'crab',
    lift = (spec.heightScale - 1) * 38
  const half = (crab ? 44 : 29) * HEAD_WIDTH[spec.headShape] * BUILD_WIDTH[spec.build]
  const crown = HEAD_TOP[spec.headShape] + (crab ? 8 : 0) - lift
  const faceY = crown + (crab ? 24 : 26),
    mouthY = faceY + 26
  const torsoY = (crab ? 101 : 93) - lift,
    hipY = 143 - lift * 0.25
  const shoulder = half * (crab ? 0.83 : 0.85)
  const poses: Record<AvatarPose, [number, number, number]> = {
    cheer: [-15, 68, -18],
    wave: [-17, 49, -23],
    rest: [-1, 122, 173],
    flex: [-20, 75, 25],
  }
  const [cx, cy, rot] = poses[spec.pose]
  const dx = (half - (crab ? 44 : 29)) * 0.55
  const a: RigAttachment = {
    x: cx - dx,
    y: cy - lift,
    sx: spec.armScale * (crab ? 0.91 : 0.82),
    sy: spec.armScale * (crab ? 0.91 : 0.82),
    rotation: rot,
  }
  const rest: RigAttachment =
    spec.pose === 'wave' ? { ...a, x: 0 - dx, y: 123 - lift, rotation: 173 } : a
  return {
    head: { x: 50, y: crown, sx: half / 32, sy: 1 },
    carapace: {
      x: 50,
      y: torsoY,
      sx: (crab ? 1.05 : 0.84) * BUILD_WIDTH[spec.build],
      sy: (hipY - torsoY) / 53,
    },
    belt: { x: 50, y: hipY - 3, sx: BUILD_WIDTH[spec.build] * (crab ? 1 : 0.77), sy: 1 },
    antennae: { x: 50, y: crown + 1, sx: crab ? 0.6 : 1, sy: crab ? 0.6 : 1 },
    legs: [
      { x: 35, y: hipY - 2, sx: -1, sy: (184 - hipY) / 48 },
      { x: 65, y: hipY - 2, sx: 1, sy: (184 - hipY) / 48 },
    ],
    claws: [rest, { ...a, x: 100 - a.x, rotation: -a.rotation!, sx: -a.sx }],
    shoulder,
    half,
    faceY,
    mouthY,
    crown,
    hipY,
  }
}
export function attachmentTransform(a: RigAttachment): string {
  return `translate(${r2(a.x)} ${r2(a.y)}) rotate(${r2(a.rotation ?? 0)}) scale(${r2(a.sx)} ${r2(a.sy)})`
}
const socket = (a: RigAttachment, body: string) =>
  `<g transform="${attachmentTransform(a)}">${body}</g>`

function headPath(crab: boolean, shape: AvatarHeadShape): string {
  if (crab)
    return shape === 'square'
      ? 'M0,0 C-17,0 -25,5 -29,15 L-34,37 Q-36,51 -20,61 Q0,69 20,61 Q36,51 34,37 L29,15 C25,5 17,0 0,0 Z'
      : 'M0,0 C-10,-3 -17,3 -20,10 L-26,13 L-25,19 L-32,23 L-29,29 L-36,35 Q-33,56 -13,63 Q0,67 13,63 Q33,56 36,35 L29,29 L32,23 L25,19 L26,13 L20,10 C17,3 10,-3 0,0 Z'
  if (shape === 'square')
    return 'M-17,0 Q0,-3 17,0 Q30,3 31,23 L31,48 Q29,65 0,65 Q-29,65 -31,48 L-31,23 Q-30,3 -17,0 Z'
  if (shape === 'heart')
    return 'M0,3 C-25,-10 -35,13 -30,34 C-30,57 -10,65 0,67 C10,65 30,57 30,34 C35,13 25,-10 0,3 Z'
  return 'M0,0 C21,0 31,14 32,32 C36,51 25,66 0,66 C-25,66 -36,51 -32,32 C-31,14 -21,0 0,0 Z'
}

export function renderCharacter(spec: CharacterSpec, ctx: PaintContext): string {
  const rig = characterRig(spec),
    crab = spec.race === 'crab'
  const eq = spec.equipment ?? {}
  const worn = (slot: keyof EquippedAppearance, a: RigAttachment) =>
    eq[slot] ? socket(a, renderEquipment(eq[slot]!.visualKey, ctx)) : ''
  const limb = (d: string, side: 'left' | 'right') => piece(d, ctx, { side, plain: true })
  const sideLegs = ([-1, 1] as const)
    .map((side) =>
      [0, 1]
        .map((i) => {
          const x = 50 + side * (crab ? rig.half * 0.65 : 21 * BUILD_WIDTH[spec.build]),
            y = rig.carapace.y + 15 + i * 13
          const knee: Pt = [x + side * (19 + i * 2), y + 9],
            tip: Pt = [x + side * (25 + i * 2), y + 27]
          return `<g data-walking-leg="side-${side}-${i}">${limb(taperedCurve([x, y], [x + side * 8, y], knee, knee, 6, 4), side < 0 ? 'left' : 'right')}${limb(taperedCurve(knee, [knee[0] + side * 4, knee[1] + 6], [tip[0], tip[1] - 6], tip, 4, 1.6), side < 0 ? 'left' : 'right')}</g>`
        })
        .join(''),
    )
    .join('')
  const legs = rig.legs
    .map((a, i) =>
      socket(
        a,
        `<g data-walking-leg="lower-${i}">${piece('M-5,-1 C-12,9 -9,19 -7,25 L-9,42 L-2,47 L6,42 L4,23 C9,16 9,7 5,-1 Z', ctx, { plain: true })}${piece('M-8,40 Q-3,36 5,41 L14,47 Q17,51 10,52 L-11,52 Q-16,47 -8,40 Z', ctx, { plain: true })}<ellipse cx="0" cy="23" rx="5" ry="4" fill="none" stroke="${ctx.palette.deep}" stroke-width="1" opacity=".35"/>${eq.legs ? renderEquipment(eq.legs.visualKey, { ...ctx, uid: `${ctx.uid}-leg-${i}` }) : ''}</g>`,
      ),
    )
    .join('')
  const tail = crab
    ? ''
    : `<g class="lobster-idle-layer lobster-idle-tail" transform="translate(67 ${rig.hipY - 5}) rotate(-28) scale(.8)">${piece('M-8,-17 Q0,-21 8,-17 L10,-4 Q0,0 -10,-4 Z', ctx, { plain: true })}${piece('M-10,-5 Q-27,0 -29,23 Q-11,29 0,14 Q11,29 29,23 Q27,0 10,-5 Z', ctx, { plain: true })}<path d="M0,2 V20 M-9,3 L-19,20 M9,3 L19,20" stroke="${ctx.palette.deep}" opacity=".3"/></g>`
  const torsoPath = 'M-28,0 Q0,-9 28,0 L22,32 Q18,53 0,56 Q-18,53 -22,32 Z'
  const abdomen = socket(
    rig.carapace,
    `${piece(torsoPath, ctx)}${piece('M-19,1 Q0,-2 19,1 L15,32 Q10,49 0,50 Q-10,49 -15,32 Z', ctx, { belly: true, noRim: true })}${[10, 21, 32, 41].map((y) => `<path d="M-${19 - y * 0.18},${y} Q0,${y + 7} ${19 - y * 0.18},${y}" stroke="${ctx.palette.bellyShade}" stroke-width="1.5" fill="none"/>`).join('')}${eq.carapace ? renderEquipment(eq.carapace.visualKey, ctx) : ''}`,
  )
  const arms = rig.claws
    .map((a, i) => {
      const shoulder: Pt = [50 + (i === 0 ? -rig.shoulder : rig.shoulder), rig.carapace.y + 4]
      const arm: ArmCurve = {
        p0: shoulder,
        p1: [shoulder[0] + (i === 0 ? -18 : 18), shoulder[1] + 9],
        p2: [a.x, a.y + 24],
        p3: [a.x, a.y + 2],
      }
      return renderArm(arm, i === 0 ? 'left' : 'right', ctx, 11)
    })
    .join('')
  const claws = rig.claws
    .map((a, i) => {
      const side = i === 0 ? 'left' : 'right',
        slot = i === 0 ? 'claws-1' : 'claws-2',
        visual = eq[slot]?.visualKey
      const isHammer = visual && getEquipmentVisual(visual)?.motif === 'hammer'
      const natural = renderClaw(
        { x: 0, y: 0, rot: 0, scale: 1, side: 'left', gripping: Boolean(isHammer) },
        'classic',
        ctx,
      ).replace('class="lobster-idle-layer lobster-idle-claw-left"', '')
      const transform = isHammer ? { ...a, rotation: i === 0 ? -8 : 8 } : a
      return `<g class="lobster-idle-layer lobster-idle-claw-${side}">${socket(transform, `${natural}${visual ? renderEquipment(visual, { ...ctx, uid: `${ctx.uid}-${side}` }) : ''}`)}</g>`
    })
    .join('')
  const eyeSpread = (crab ? 14 : 12.5) * Math.min(1.15, HEAD_WIDTH[spec.headShape])
  const eyes = ([-1, 1] as const)
    .map((side, i) =>
      renderEye(
        {
          ...eyeSize(spec.eyeShape, 11),
          cx: 50 + side * eyeSpread,
          cy: rig.faceY,
          color: spec.eyeColor,
          pupil: spec.pupil,
          expression: spec.expression,
          side: i === 0 ? 'left' : 'right',
        },
        ctx,
        i === 0 ? 'left' : 'right',
      ),
    )
    .join('')
  const face =
    socket(rig.head, piece(headPath(crab, spec.headShape), ctx)) +
    renderCheeks(ctx, 50 - rig.half * 0.55, 50 + rig.half * 0.55, rig.mouthY - 4) +
    renderMouth(spec.mouth, 50, rig.mouthY, ctx, 0.76) +
    `<g class="lobster-idle-layer lobster-idle-eyes">${eyes}</g>`
  const antennae = renderAntennae(
    spec.antennae,
    ctx,
    { left: [43, rig.crown + 3], right: [57, rig.crown + 3] },
    crab ? 0.3 : 0.8,
  )
  const headGear = eq.head
    ? socket({ ...rig.head, sx: rig.head.sx * 0.95 }, renderEquipment(eq.head.visualKey, ctx))
    : ''
  return `<g class="avatar-character" data-race="${spec.race}"><ellipse cx="50" cy="190" rx="48" ry="5" fill="#030b10" opacity=".25"/>${tail}<g class="lobster-idle-layer lobster-idle-flank-limbs">${sideLegs}</g><g class="lobster-idle-layer lobster-idle-legs">${legs}</g>${arms}<g class="lobster-idle-layer lobster-idle-abdomen">${abdomen}${worn('belt', rig.belt)}</g><g class="lobster-idle-layer lobster-idle-carapace">${antennae}${face}${worn('antennae', rig.antennae)}${headGear}</g>${claws}</g>`
}
export function headShapeOutline(race: AvatarRace, shape: AvatarHeadShape): string {
  // Local silhouette for the head and shell shape picker.
  return headPath(race === 'crab', shape)
}
export function portraitViewBox(spec: CharacterSpec): string {
  const rig = characterRig(spec)
  return `-9 ${r2(rig.faceY - 43)} 118 118`
}
