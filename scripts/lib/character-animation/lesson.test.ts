import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildTimeline, castLook, castOf, estimateWords, lessonProblems, narrationOf, reelDraftFrom, sceneWindows, talkFromWords, type Lesson } from './lesson'
import { segmentsOf } from './voices'
import { talkFromSamples } from './talk'

const example: Lesson = JSON.parse(fs.readFileSync(path.resolve('content/animation/examples/daily-shedding-routine.json'), 'utf8'))
const dialogue: Lesson = JSON.parse(fs.readFileSync(path.resolve('content/animation/examples/nightly-molt-audit.json'), 'utf8'))
const sketch: Lesson = JSON.parse(fs.readFileSync(path.resolve('content/animation/examples/walking-forward.json'), 'utf8'))

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
    expect(problems).toContain('a short has six to ten scenes')
    expect(problems).toContain('scene 1 must be exactly the hookHeadline (put the rest of the line in scene 2)')
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
    const { timeline, hookEnd } = buildTimeline(example, { [example.host]: castLook(example.host) }, words, [talk], { width: 540, height: 960, fps, hookLift: 0.5 })
    expect(timeline.frames).toBe(frames)
    expect(timeline.look.pose).toBe('point')
    // The hook opens on a cut with the camera aimed high, then lets the character back up after it.
    expect(timeline.cues[0]).toMatchObject({ t: 0, camera: { cut: true, lift: 0.5 } })
    // The lift holds through the first scene and goes on a cut, never a slide.
    expect(timeline.cues.some((c) => c.t > 0 && c.t <= hookEnd && c.camera)).toBe(false)
    const second = timeline.cues.find((c) => c.t > 0 && c.camera)
    expect(second?.camera).toMatchObject({ lift: 0, cut: true })
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

  it('accepts the dialogue example and puts the host first', () => {
    expect(lessonProblems(dialogue)).toEqual([])
    expect(castOf(dialogue).map((c) => c.id)).toEqual(['juno', 'kit'])
    const bad = { ...dialogue, scenes: dialogue.scenes.map((s, i) => (i === 0 ? { ...s, speaker: 'nobody' } : s)) }
    expect(lessonProblems(bad)).toContain('scene 1 speaker "nobody" is not in the cast')
  })

  it('voices runs of lines by one speaker as one take, in their own voice', () => {
    const segments = segmentsOf(dialogue, 'BOOK RECORD REGULAR')
    expect(segments.map((s) => s.speaker)).toEqual(['kit', 'juno', 'kit', 'juno', 'kit', 'juno'])
    expect(segments[0].scenes).toEqual([0, 1]) // hook and the next line: one take
    expect(segments[3].scenes).toEqual([4, 5])
    expect(segments[0].voice).toBe('Friendly Young Female')
    expect(segments[1].voice).toBe('BOOK RECORD REGULAR')
    const narrated = { ...dialogue, scenes: dialogue.scenes.map((s) => ({ ...s, speaker: 'narrator' })) }
    expect(segmentsOf(narrated, 'Laura')).toEqual([expect.objectContaining({ speaker: 'narrator', voice: 'Laura' })])
  })

  it('stages a dialogue: two-shots take in everyone, cuts go to the speaker, listeners turn to them', () => {
    const words = estimateWords(narrationOf(dialogue))
    const looks = Object.fromEntries(castOf(dialogue).map((c) => [c.id, castLook(c.id)]))
    const { timeline, windows } = buildTimeline(dialogue, looks, words, [[], []], { width: 540, height: 960, fps: 30 })
    expect(timeline.cast?.map((c) => c.x)).toEqual([1.05, -1.05])
    expect(timeline.set).toBe('codex-study')
    const cameraAt = (t: number) => timeline.cues.find((c) => c.t === t && c.camera)!.camera!
    expect(cameraAt(windows[0].start).pan).toBe(0) // two-shot of both
    expect(cameraAt(windows[1].start).pan).toBe(-1.05) // the junior, still speaking
    expect(cameraAt(windows[2].start).pan).toBe(1.05) // the host speaking
    // While the host speaks in scene 3, the junior (cast index 1) looks toward it, to the viewer's right.
    const junior = timeline.cues.find((c) => c.t === windows[2].start && c.who === 1 && c.look)!
    expect(junior.look!.x).toBeGreaterThan(0)
    expect(timeline.cues.find((c) => c.t === windows[2].start && c.who === 1 && c.yaw !== undefined)!.yaw).toBeGreaterThan(0)
  })

  it('folds a longer dialogue into the six scene prompts reel:create stores', () => {
    const draft = reelDraftFrom(dialogue)
    expect(draft.scenePrompts).toHaveLength(6)
    expect((draft.scenePrompts as string[]).join(' ')).toContain('Both face camera')
  })

  it('adds acting from the voice timing: speaker gestures, listener nods, the same every time', () => {
    const looks = Object.fromEntries(castOf(dialogue).map((c) => [c.id, castLook(c.id)]))
    const words = estimateWords(narrationOf(dialogue))
    const plan = () => buildTimeline(dialogue, looks, words, [[], []], { width: 540, height: 960, fps: 30 }).timeline
    const gestures = plan().cues.filter((c) => c.gesture)
    expect(gestures.length).toBeGreaterThan(8)
    expect(gestures.every((c) => c.auto)).toBe(true)
    // Listeners nod; speakers do more than nod.
    expect(new Set(gestures.map((c) => c.gesture!.kind)).size).toBeGreaterThanOrEqual(3)
    expect(gestures.some((c) => c.gesture!.kind === 'nod')).toBe(true)
    expect(plan().cues.filter((c) => c.gesture)).toEqual(gestures)
    // Nothing automatic lands on top of a hand-written reaction.
    for (const g of gestures) {
      const near = plan().cues.filter((c) => c.react && (c.who ?? 0) === (g.who ?? 0) && Math.abs(c.t - g.t) < 0.5)
      expect(near, `gesture at ${g.t}`).toEqual([])
    }
    // acting: none turns it off; a hand-placed gesture replaces the automatic ones in its scene.
    const still = buildTimeline({ ...dialogue, acting: 'none' }, looks, words, [[], []], { width: 540, height: 960, fps: 30 }).timeline
    expect(still.cues.filter((c) => c.gesture)).toEqual([])
    const placed = { ...dialogue, acting: 'none' as const, scenes: dialogue.scenes.map((s, i) => (i === 2 ? { ...s, gesture: [{ kind: 'open' as const, word: 1 }] } : s)) }
    expect(lessonProblems(placed)).toEqual([])
    const one = buildTimeline(placed, looks, words, [[], []], { width: 540, height: 960, fps: 30 }).timeline.cues.filter((c) => c.gesture)
    expect(one).toHaveLength(1)
    expect(one[0].auto).toBeUndefined()
  })

  it('passes mouth shape tracks through to the timeline, trimmed to its length', () => {
    const looks = Object.fromEntries(castOf(dialogue).map((c) => [c.id, castLook(c.id)]))
    const words = estimateWords(narrationOf(dialogue))
    const { timeline } = buildTimeline(dialogue, looks, words, [[], []], { width: 540, height: 960, fps: 30, mouthBy: ['XAB'.repeat(5000), 'D'] })
    expect(timeline.mouthBy?.[0]).toHaveLength(timeline.frames)
    expect(timeline.mouthBy?.[1]).toBe('D')
  })

  it('validates comedy sketch lessons with 3 characters and hard-cut draft metadata', () => {
    expect(lessonProblems(sketch)).toEqual([])
    expect(castOf(sketch).map((c) => c.id)).toEqual(['vera', 'sol', 'moss'])
    const draft = reelDraftFrom(sketch)
    expect(draft.format).toBe('animated-sketch')
    expect(draft.cast).toEqual(['vera', 'sol', 'moss'])
    expect(draft.loudness).toBe(4)
    expect(draft.queueId).toBe('6b00c2052c18af30956c81c9')
    expect(draft.scenePrompts).toHaveLength(6)

    // Sketch allows 4 scenes and shorter word counts, while short keeps 6-scene / 40-word minimums
    const shortSketch: Lesson = {
      ...sketch,
      scenes: sketch.scenes.slice(0, 4),
    }
    expect(lessonProblems(shortSketch)).toEqual([])
    const tooFewForShort: Lesson = { ...shortSketch, format: 'short' }
    expect(lessonProblems(tooFewForShort)).toContain('a short has six to ten scenes')
    expect(lessonProblems({ ...sketch, scenes: sketch.scenes.slice(0, 3) })).toContain('a sketch has four to ten scenes')

    const looks = Object.fromEntries(castOf(sketch).map((c) => [c.id, castLook(c.id)]))
    const words = estimateWords(narrationOf(sketch))
    const { timeline } = buildTimeline(sketch, looks, words, [[], [], []], { width: 540, height: 960, fps: 30, tail: 0.3 })
    expect(timeline.cast?.map((c) => ({ x: c.x, z: c.z ?? 0 }))).toEqual([
      { x: 1.15, z: 0.15 },
      { x: -1.15, z: 0.15 },
      { x: 0, z: -0.85 },
    ])
  })
})
