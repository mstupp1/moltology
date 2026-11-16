import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildTimeline, castLook, estimateWords, lessonProblems, narrationOf, reelDraftFrom, sceneWindows, talkFromWords, type Lesson } from './lesson'
import { talkFromSamples } from './talk'

const example: Lesson = JSON.parse(fs.readFileSync(path.resolve('content/animation/examples/daily-shedding-routine.json'), 'utf8'))

describe('animated lessons', () => {
  it('accepts the example lesson and resolves its host from the cast', () => {
    expect(lessonProblems(example)).toEqual([])
    const look = castLook(example.host)
    expect(look.race).toBe('crab')
    expect(look.temperament).toBe('lively')
  })

  it('flags lessons that would make a bad short', () => {
    const bad = { ...example, hookHeadline: 'Something else entirely.', scenes: example.scenes.slice(0, 5) }
    const problems = lessonProblems(bad)
    expect(problems).toContain('a short has exactly six scenes')
    expect(problems).toContain('hookHeadline must be the exact start of scene 1')
    const wrongWord = { ...example, scenes: example.scenes.map((s, i) => (i === 0 ? { ...s, react: [{ kind: 'snap' as const, word: 40 }] } : s)) }
    expect(lessonProblems(wrongWord).some((p) => p.includes('reaction word 40'))).toBe(true)
  })

  it('times scenes from where their first word is spoken', () => {
    const words = estimateWords(narrationOf(example))
    const windows = sceneWindows(example, words, 30)
    expect(windows).toHaveLength(6)
    expect(windows[0].start).toBe(0)
    expect(windows[1].firstWord).toBe(6)
    for (let i = 1; i < windows.length; i++) {
      expect(windows[i].start).toBeLessThan(words[windows[i].firstWord].startMs / 1000)
      expect(windows[i - 1].end).toBe(windows[i].start)
    }
    expect(() => sceneWindows(example, words.slice(1), 30)).toThrow(/re-run the voice step/)
  })

  it('builds cues on the voice timings and a speech level per frame', () => {
    const words = estimateWords(narrationOf(example))
    const fps = 30
    const frames = Math.ceil(((words.at(-1)!.endMs) / 1000 + 0.8) * fps)
    const talk = talkFromWords(words, fps, frames)
    expect(talk.some((v) => v > 0.5)).toBe(true)
    expect(talk[0]).toBe(0)
    const { timeline, hookEnd } = buildTimeline(example, castLook(example.host), words, talk, { width: 540, height: 960, fps, hookLift: 0.5 })
    expect(timeline.frames).toBe(frames)
    expect(timeline.look.pose).toBe('point')
    // The hook opens on a cut with the camera aimed high, then lets the character back up after it.
    expect(timeline.cues[0]).toMatchObject({ t: 0, camera: { cut: true, lift: 0.5 } })
    expect(timeline.cues.some((c) => c.t === hookEnd && c.camera?.lift === 0)).toBe(true)
    // The snap on "first" in scene three lands as that word is spoken.
    const first = words.findIndex((w) => w.word === 'first.')
    expect(timeline.cues.some((c) => c.react?.kind === 'snap' && c.t === words[first].startMs / 1000)).toBe(true)
    expect(timeline.cues.map((c) => c.t)).toEqual([...timeline.cues.map((c) => c.t)].sort((a, b) => a - b))
  })

  it('writes a reel draft that reel:create accepts', () => {
    const draft = reelDraftFrom(example)
    expect(draft.scenePrompts).toHaveLength(6)
    expect(draft.narrationScript).toBe(narrationOf(example))
    expect(String(draft.narrationScript).startsWith(example.hookHeadline)).toBe(true)
  })

  it('reads a speech level from audio samples', () => {
    const rate = 16000
    const fps = 30
    // Half a second of silence, then half a second of a loud tone.
    const samples = new Int16Array(rate)
    for (let i = rate / 2; i < rate; i++) samples[i] = Math.round(Math.sin(i / 5) * 12000)
    const talk = talkFromSamples(samples, fps, rate)
    expect(talk).toHaveLength(30)
    expect(Math.max(...talk.slice(0, 14))).toBe(0)
    expect(talk[29]).toBeGreaterThan(0.8)
  })
})
