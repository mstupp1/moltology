/**
 * Scripted animation: a timeline of camera moves, poses, reactions and speech that a manual stage
 * plays frame by frame. Content tooling renders it headlessly into video (scripts/animate-character.ts);
 * nothing in the app plays timelines. Framework free and DOM free apart from the stage it drives.
 */
import type { AvatarPose } from '../avatar/traits'
import type { Avatar3DLook } from './look'
import type { Gesture, Reaction } from './motion'
import { isMouthShape } from './mouth-shapes'
import { buildSet, type SetArt, type SetName } from './sets'
import type { Stage } from './stage'

/** Named camera setups, so scripts say "close" rather than numbers. */
export const SHOTS = {
  /** The whole figure, feet to antennae. */
  wide: { zoom: 1, tilt: 0.04 },
  /** Two or three characters side by side, all in frame. */
  two: { zoom: 0.56, tilt: 0.05 },
  /** Knees up: the everyday talking shot. */
  medium: { zoom: 1.35, tilt: 0.06 },
  /** Head and shoulders. */
  close: { zoom: 1.9, tilt: 0.05 },
  /** The face fills the frame: for one punchline, not a whole scene. */
  extreme: { zoom: 2.5, tilt: 0.03 },
  /** From below: the character looks big and sure of itself. */
  low: { zoom: 1.25, tilt: -0.1 },
  /** From above: the character looks small, or the viewer looks down at a problem. */
  high: { zoom: 1.3, tilt: 0.42 },
} as const
export type ShotName = keyof typeof SHOTS

/** How the camera gets to the shot: a cut, a slow glide, or a push in or pull out across the scene. */
export type CameraMove = 'cut' | 'glide' | 'push-in' | 'pull-out'

export interface CameraCue {
  zoom: number
  tilt: number
  /** Sideways offset in world units: positive puts the character left of centre. */
  pan: number
  /** Vertical aim offset in world units: positive puts the character lower in the frame. */
  lift?: number
  /** How quickly the camera glides there (6 snappy, 1 a slow creep). */
  rate?: number
  cut?: boolean
  /** Cast index the shot is on; close shots aim at that member's head (default 0). */
  subject?: number
}

export interface TimelineCue {
  /** Seconds from the start of the video. */
  t: number
  /** Which cast member pose, react, yaw and look apply to (index into `cast`; default 0). */
  who?: number
  camera?: CameraCue
  pose?: AvatarPose
  /** Land the pose at once instead of blending (on a camera cut, where a blend would only show as a sweep). */
  snap?: boolean
  react?: { kind: Reaction; side?: 1 | -1 }
  /** A talking gesture over the pose; `amount` scales it (1 full). */
  gesture?: { kind: Gesture; side?: 1 | -1; amount?: number }
  /** Added by the acting pass rather than written by hand, so the clipping guard may tone it down. */
  auto?: boolean
  /** Turn of the whole character in radians (0 faces the viewer). */
  yaw?: number
  /** Slow turntable speed in radians per second (0 stops it). */
  spin?: number
  /** Where the eyes look, in half-widths from the middle of the frame; null lets them wander. */
  look?: { x: number; y: number } | null
}

export interface AnimationTimeline {
  width: number
  height: number
  fps: number
  /** Total frames to draw. */
  frames: number
  look: Avatar3DLook
  /** Cues in time order. */
  cues: TimelineCue[]
  /** Speech level per frame, 0..1. Shorter than `frames` means silent after it ends. */
  talk: number[]
  lighting?: 'studio' | 'cinematic'
  /**
   * Several characters: replaces `look` (the first member is the stage's own character) and
   * `talk` (one speech track per member, in the same order).
   */
  cast?: { look: Avatar3DLook; x: number; z?: number; yaw?: number }[]
  talkBy?: number[][]
  /**
   * Cartoon mouth shapes per frame for each member, in cast order: one letter a frame from
   * MOUTH_SHAPES (X rest). Without a track a member's mouth just opens with its speech level.
   */
  mouthBy?: string[]
  /** Set dressing in front of the backdrop. */
  set?: SetName
  /** Painted textures and the cut-out layer for the set (see sets.ts). */
  setArt?: SetArt
}

/**
 * Plays a timeline on a manual stage: `seek(frame)` must be called with frames in order. Cues
 * fire on the first frame at or after their time. The stage needs to be made with `manual: true`
 * and `preserveDrawingBuffer: true` so each frame can be read back.
 */
/** What a timeline needs from a stage: the real one draws, a rehearsal (rehearse.ts) only moves. */
export type TimelineStage = Pick<Stage, 'setCast' | 'setLook' | 'setProps' | 'member' | 'setCamera' | 'setMemberYaw' | 'setSpin' | 'step'>

export function timelinePlayer(stage: TimelineStage, timeline: AnimationTimeline, options: { set?: boolean } = {}) {
  const cues = [...timeline.cues].sort((a, b) => a.t - b.t)
  const dt = 1 / timeline.fps
  let next = 0
  let drawn = -1
  const members = timeline.cast?.length ?? 1
  if (timeline.cast?.length) stage.setCast(timeline.cast)
  else stage.setLook(timeline.look, true)
  // Claws stay out of bodies, their own and each other's.
  const everyone = Array.from({ length: members }, (_, m) => stage.member(m)).filter((c): c is NonNullable<typeof c> => Boolean(c))
  for (const c of everyone) c.avoidContacts(true, everyone.filter((o) => o !== c).flatMap((o) => o.contacts()))
  const set = timeline.set && options.set !== false ? buildSet(timeline.set, timeline.setArt) : null
  if (set) stage.setProps(set.root)
  const apply = (cue: TimelineCue) => {
    const who = cue.who ?? 0
    const character = stage.member(who)
    if (cue.camera) stage.setCamera(cue.camera)
    if (cue.pose) character?.setPose(cue.pose, cue.snap)
    if (cue.react) character?.react(cue.react.kind, cue.react.side)
    if (cue.gesture) character?.gesture(cue.gesture.kind, cue.gesture.side, cue.gesture.amount)
    if (cue.yaw !== undefined) stage.setMemberYaw(who, cue.yaw)
    if (cue.spin !== undefined) stage.setSpin(cue.spin)
    if (cue.look !== undefined) character?.lookAt(cue.look)
  }
  return {
    /** Resolves when the set's art has loaded; wait for it before the first frame. */
    ready: set?.ready ?? Promise.resolve(),
    /** Draw frame `index` (the next one in order); frames skipped over are moved through, not drawn. */
    seek(index: number) {
      if (index <= drawn) throw new Error(`Frames must be drawn in order (asked for ${index} after ${drawn})`)
      while (drawn < index) {
        drawn++
        const t = drawn * dt
        while (next < cues.length && cues[next].t <= t + 1e-6) apply(cues[next++])
        for (let m = 0; m < members; m++) {
          const track = timeline.talkBy ? timeline.talkBy[m] : m === 0 ? timeline.talk : undefined
          const shape = timeline.mouthBy?.[m]?.[drawn]
          stage.member(m)?.setTalk(track?.[drawn] ?? 0, isMouthShape(shape) ? shape : null)
        }
        set?.update(t)
        stage.step(dt, drawn === index)
      }
    },
  }
}
