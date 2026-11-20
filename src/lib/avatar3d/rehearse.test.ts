import { describe, expect, it } from 'vitest'
import { AVATAR_POSES, AVATAR_RACES } from '../avatar/traits'
import { baselineLook } from './look'
import { GESTURES } from './motion'
import { rehearse } from './rehearse'
import type { TimelineCue } from './scripted'

describe('rehearsal and clipping', () => {
  it('keeps every pose, reaction and gesture out of its own body', () => {
    for (const race of AVATAR_RACES) {
      const look = baselineLook(race)
      const cues: TimelineCue[] = []
      let t = 0
      for (const pose of AVATAR_POSES) {
        cues.push({ t, pose })
        t += 0.7
        for (const kind of GESTURES) {
          cues.push({ t, gesture: { kind, side: kind === 'offer' ? -1 : 1 } })
          t += 0.4
        }
        cues.push({ t, react: { kind: 'poke' } })
        t += 0.8
      }
      const clips = rehearse({ width: 4, height: 4, fps: 30, frames: Math.ceil(t * 30), look, cues, talk: [] })
      expect(clips.map((c) => `${race} f${c.frame} ${c.parts.join('/')}`)).toEqual([])
    }
  })

  it('keeps two characters side by side out of each other while they gesture at each other', () => {
    const crab = baselineLook('crab')
    const lobster = baselineLook('lobster')
    const cues: TimelineCue[] = [
      { t: 0, who: 0, yaw: 0.31 },
      { t: 0, who: 1, yaw: -0.31 },
    ]
    let t = 0.2
    for (const pose of ['point', 'shrug', 'think', 'rest'] as const) {
      cues.push({ t, who: 0, pose }, { t, who: 1, pose })
      cues.push({ t: t + 0.7, who: 0, gesture: { kind: 'offer', side: 1 } }, { t: t + 0.7, who: 1, gesture: { kind: 'offer', side: -1 } })
      t += 2
    }
    const clips = rehearse({ width: 4, height: 4, fps: 30, frames: Math.ceil(t * 30), look: crab, cues, talk: [], cast: [{ look: crab, x: -0.75 }, { look: lobster, x: 0.75 }] })
    expect(clips.map((c) => `f${c.frame} ${c.who}/${c.other} ${c.parts.join('/')} ${c.depth.toFixed(2)}`)).toEqual([])
  })
})
