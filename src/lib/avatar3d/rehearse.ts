/**
 * A rehearsal of a scripted timeline with no renderer: the same characters, cues and clock as
 * the real stage, moved frame by frame in Node, so problems show up before the slow part. It
 * reports every frame where body parts pass through each other (collide.ts).
 */
import { buildCharacter, type Character3D } from './character'
import { findClips, type Clip } from './collide'
import type { Avatar3DLook } from './look'
import { timelinePlayer, type AnimationTimeline, type TimelineStage } from './scripted'

interface Member {
  character: Character3D
  x: number
  z: number
  yaw: number
}

/** Stands in for the stage: places and moves the cast exactly as stage.ts does, and draws nothing. */
function rehearsalStage(): TimelineStage & { members: Member[] } {
  let members: Member[] = []
  let spin = 0
  let clock = 0
  const clear = () => {
    for (const m of members) m.character.dispose()
    members = []
  }
  const stage = {
    get members() {
      return members
    },
    setLook(look: Avatar3DLook) {
      clear()
      members = [{ character: buildCharacter(look), x: 0, z: 0, yaw: 0 }]
    },
    setCast(cast: readonly { look: Avatar3DLook; x: number; z?: number; yaw?: number }[]) {
      clear()
      members = cast.map((m) => ({ character: buildCharacter(m.look), x: m.x, z: m.z ?? 0, yaw: m.yaw ?? 0 }))
    },
    setProps() {},
    setCamera() {},
    member: (index: number) => members[index]?.character ?? null,
    setMemberYaw(index: number, yaw: number) {
      if (members[index]) members[index].yaw = yaw
    },
    setSpin(speed: number) {
      spin = speed
    },
    step(dt: number) {
      clock += dt
      if (members[0]) members[0].yaw += spin * dt
      for (const m of members) {
        m.character.root.rotation.y = m.yaw
        m.character.root.position.set(m.x, (m.character.root.userData.seatY as number | undefined) ?? 0, m.z)
        m.character.update(dt, clock, true)
      }
      // As stage.ts does: once everyone has moved, claws settle out of each other.
      for (let pass = 0; members.length > 1 && pass < 3; pass++) for (const m of members) m.character.settleContacts()
    },
  }
  return stage as TimelineStage & { members: Member[] }
}

export interface FrameClip extends Clip {
  frame: number
}

/** Plays the whole timeline without drawing and lists every frame where parts cross. */
export function rehearse(timeline: AnimationTimeline): FrameClip[] {
  const stage = rehearsalStage()
  const player = timelinePlayer(stage, timeline, { set: false })
  const bodies = stage.members.map((m) => ({ spheres: m.character.contacts() }))
  const out: FrameClip[] = []
  try {
    for (let f = 0; f < timeline.frames; f++) {
      player.seek(f)
      for (const clip of findClips(bodies)) out.push({ frame: f, ...clip })
    }
  } finally {
    for (const m of stage.members) m.character.dispose()
  }
  return out
}
