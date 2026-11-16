/**
 * Animated lessons: a reviewed lesson script (scenes of narration plus direction) turned into a
 * frame-accurate timeline for the 3D character. Pure functions, so they are unit tested; the
 * renderer and compositor live in render.ts and compose.ts.
 */
import fs from 'node:fs'
import path from 'node:path'
import { AVATAR_POSES, type AvatarPose } from '../../../src/lib/avatar/traits'
import { lookFromConfig, type Avatar3DLook } from '../../../src/lib/avatar3d/look'
import type { Reaction } from '../../../src/lib/avatar3d/motion'
import { SHOTS, type AnimationTimeline, type CameraMove, type ShotName, type TimelineCue } from '../../../src/lib/avatar3d/scripted'
import { parseLobsterAvatarConfig } from '../../../src/lib/lobster-avatar'
import { tokenizeScriptText, type WordBoundaryEvent } from '../tts-engine'

export const REACTIONS: readonly Reaction[] = ['poke', 'snap', 'equip', 'celebrate']
export const LOOKS = ['camera', 'wander', 'left', 'right', 'down', 'up'] as const
export type LessonLook = (typeof LOOKS)[number]
export const FRAMES = ['center', 'left', 'right'] as const
export type LessonFrame = (typeof FRAMES)[number]
export const MOVES: readonly CameraMove[] = ['cut', 'glide', 'push-in', 'pull-out']

export interface LessonScene {
  /** What the narrator says during this scene. The scenes' lines joined make the narration. */
  line: string
  shot: ShotName
  /** How the camera reaches the shot. The first scene always starts on it. Default glide. */
  move?: CameraMove
  /** Where the character stands in the frame. Default center. */
  frame?: LessonFrame
  /** Pose for the scene (the character blends into it). Default: keep the last one. */
  pose?: AvatarPose
  /** Reactions, each on a word of this scene's line (0-based), or at the start without one. */
  react?: { kind: Reaction; word?: number; side?: 1 | -1 }[]
  /** Where the eyes go. Default camera: the host talks to the viewer. */
  look?: LessonLook
  /** Turn of the whole character in degrees (positive turns to the viewer's left). */
  turn?: number
  /** Slow turntable across the scene, in degrees per second. */
  spin?: number
  /** Backdrop image for this scene; default the lesson's. */
  backdrop?: string
  /** What the scene shows, for the reel ledger and review (one sentence). */
  description: string
}

export interface Lesson {
  id: string
  title: string
  topic: string
  series: string
  episode: number
  format: 'short'
  /** Cast id from content/animation/cast.json. */
  host: string
  /** The Codex passage taught, when there is one. */
  codex?: { id: string; title: string; url: string }
  /** The exact first sentence of the first scene's line. Shown big during the spoken hook. */
  hookHeadline: string
  /** Default backdrop image (1080x1920 or larger), relative to the lesson file. */
  backdrop?: string
  scenes: LessonScene[]
  caption: string
  hashtags: string[]
  firstComment: string
  youtubeTitle: string
  youtubeDescription: string
  youtubeTags?: string[]
  ctaGoal?: string
  /** Outro card image (ImageGen), relative to the lesson file. */
  outro?: string
}

export interface CastMember {
  name?: string
  role: string
  /** A saved character config, exactly as the site stores it. */
  config: Record<string, unknown>
}

export const CAST_PATH = path.resolve(process.cwd(), 'content/animation/cast.json')

export function loadCast(file = CAST_PATH): Record<string, CastMember> {
  return JSON.parse(fs.readFileSync(file, 'utf8')).cast
}

/** The 3D look for a cast member, resolved the way the site resolves a saved character. */
export function castLook(id: string, cast = loadCast()): Avatar3DLook {
  const member = cast[id]
  if (!member) throw new Error(`No cast member "${id}" in content/animation/cast.json (have: ${Object.keys(cast).join(', ')})`)
  const config = parseLobsterAvatarConfig(member.config)
  if (!config) throw new Error(`Cast member "${id}" has an invalid character config`)
  return lookFromConfig(config)
}

/** Words as the voice step counts them (hyphenated words split, spoken domains joined). */
const wordsOf = (text: string) => tokenizeScriptText(text.trim())

/** The full narration: every scene's line, in order. */
export function narrationOf(lesson: Pick<Lesson, 'scenes'>): string {
  return lesson.scenes.map((s) => s.line.trim()).join(' ')
}

/** Problems that would make a bad render or a bad short. Empty means it can be produced. */
export function lessonProblems(lesson: Lesson): string[] {
  const problems: string[] = []
  for (const key of ['id', 'title', 'topic', 'series', 'host', 'hookHeadline', 'caption', 'firstComment', 'youtubeTitle', 'youtubeDescription'] as const) {
    if (typeof lesson[key] !== 'string' || !lesson[key].trim()) problems.push(`needs ${key}`)
  }
  if (lesson.format !== 'short') problems.push('format must be "short" (long form is not built yet)')
  if (!Array.isArray(lesson.scenes) || lesson.scenes.length !== 6) problems.push('a short has exactly six scenes')
  if (!Array.isArray(lesson.hashtags) || lesson.hashtags.length > 3) problems.push('at most three hashtags')
  const scenes = Array.isArray(lesson.scenes) ? lesson.scenes : []
  scenes.forEach((scene, i) => {
    const at = `scene ${i + 1}`
    if (!scene.line?.trim()) problems.push(`${at} has no line`)
    if (!scene.description?.trim()) problems.push(`${at} has no description`)
    if (!(scene.shot in SHOTS)) problems.push(`${at} shot "${scene.shot}" is not one of ${Object.keys(SHOTS).join(', ')}`)
    if (scene.move && !MOVES.includes(scene.move)) problems.push(`${at} move "${scene.move}" is not one of ${MOVES.join(', ')}`)
    if (scene.frame && !FRAMES.includes(scene.frame)) problems.push(`${at} frame "${scene.frame}" is not one of ${FRAMES.join(', ')}`)
    if (scene.look && !LOOKS.includes(scene.look)) problems.push(`${at} look "${scene.look}" is not one of ${LOOKS.join(', ')}`)
    if (scene.pose && !AVATAR_POSES.includes(scene.pose)) problems.push(`${at} pose "${scene.pose}" is not one of ${AVATAR_POSES.join(', ')}`)
    const count = wordsOf(scene.line ?? '').length
    for (const r of scene.react ?? []) {
      if (!REACTIONS.includes(r.kind)) problems.push(`${at} reaction "${r.kind}" is not one of ${REACTIONS.join(', ')}`)
      if (r.word !== undefined && (r.word < 0 || r.word >= count)) problems.push(`${at} reaction word ${r.word} is outside its ${count}-word line`)
    }
  })
  const first = scenes[0]?.line?.trim() ?? ''
  if (lesson.hookHeadline && !first.startsWith(lesson.hookHeadline.trim())) problems.push('hookHeadline must be the exact start of scene 1')
  if (lesson.hookHeadline && wordsOf(lesson.hookHeadline).length >= 14) problems.push('hookHeadline must be under 14 words')
  const words = wordsOf(narrationOf({ scenes })).length
  if (words < 40 || words > 75) problems.push(`narration is ${words} words; aim for 50 to 65`)
  return problems
}

/**
 * Word timings for a silent test render: about 2.6 words a second with pauses at punctuation,
 * so cues and mouth movement land roughly where a real voice would put them.
 */
export function estimateWords(text: string, wordsPerSecond = 2.6): WordBoundaryEvent[] {
  const out: WordBoundaryEvent[] = []
  let t = 150
  for (const word of wordsOf(text)) {
    const ms = Math.max(160, (1000 / wordsPerSecond) * (0.55 + 0.09 * word.replace(/[^a-z0-9]/gi, '').length))
    const sentence = /[.!?]["')\]]?$/.test(word)
    const clause = /[,;:]$/.test(word)
    out.push({ word, startMs: Math.round(t), endMs: Math.round(t + ms), durationMs: Math.round(ms), isSentenceEnd: sentence, isClauseEnd: clause })
    t += ms + (sentence ? 380 : clause ? 180 : 40)
  }
  return out
}

/**
 * A speech level per frame from word timings, for when there is no audio to measure (silent
 * tests): each word opens and closes the mouth about once per syllable.
 */
export function talkFromWords(words: WordBoundaryEvent[], fps: number, frames: number): number[] {
  const talk = new Array<number>(frames).fill(0)
  for (const w of words) {
    const syllables = Math.max(1, (w.word.toLowerCase().match(/[aeiouy]+/g) ?? []).length)
    const from = Math.floor((w.startMs / 1000) * fps)
    const to = Math.ceil((w.endMs / 1000) * fps)
    for (let f = Math.max(0, from); f < Math.min(frames, to); f++) {
      const p = (f / fps - w.startMs / 1000) / Math.max(w.durationMs / 1000, 1e-3)
      talk[f] = Math.max(talk[f], 0.35 + 0.6 * Math.abs(Math.sin(p * Math.PI * syllables)))
    }
  }
  return talk
}

/** When each scene starts and ends, in seconds, from where its first word is spoken. */
export function sceneWindows(lesson: Pick<Lesson, 'scenes'>, words: WordBoundaryEvent[], total: number): { start: number; end: number; firstWord: number }[] {
  let index = 0
  const firsts = lesson.scenes.map((scene) => {
    const first = index
    index += wordsOf(scene.line).length
    return first
  })
  if (index !== words.length) {
    throw new Error(`Voice has ${words.length} words but the scenes have ${index}; re-run the voice step after editing lines`)
  }
  // A scene cuts in a little before its first word, as an editor would.
  const LEAD = 0.12
  const starts = firsts.map((w, i) => (i === 0 ? 0 : Math.max(0, words[w].startMs / 1000 - LEAD)))
  return starts.map((start, i) => ({ start, end: i + 1 < starts.length ? starts[i + 1] : total, firstWord: firsts[i] }))
}

const PAN = { center: 0, left: 0.22, right: -0.22 } as const
const LOOK_AT: Record<LessonLook, { x: number; y: number } | null> = {
  camera: { x: 0, y: 0 },
  wander: null,
  left: { x: 1.4, y: 0 },
  right: { x: -1.4, y: 0 },
  down: { x: 0, y: -1.2 },
  up: { x: 0, y: 1.2 },
}
const deg = (d: number) => (d * Math.PI) / 180

export interface TimelineOptions {
  width: number
  height: number
  fps: number
  /** Seconds of picture after the last word. */
  tail?: number
  /** Aim this far higher (world units) during the spoken hook so the character sits below the headline. */
  hookLift?: number
}

/**
 * The frame-by-frame plan for one lesson: camera, pose, reactions, gaze and turn cues on the
 * timings of the actual voice, plus the speech level per frame.
 */
export function buildTimeline(lesson: Lesson, look: Avatar3DLook, words: WordBoundaryEvent[], talk: number[], options: TimelineOptions): { timeline: AnimationTimeline; windows: ReturnType<typeof sceneWindows>; hookEnd: number } {
  const fps = options.fps
  const lastWord = words.length ? words[words.length - 1].endMs / 1000 : 0
  const duration = Math.max(lastWord + (options.tail ?? 0.8), talk.length / fps)
  const frames = Math.ceil(duration * fps)
  const windows = sceneWindows(lesson, words, duration)
  const hookWords = wordsOf(lesson.hookHeadline).length
  const hookEnd = hookWords && words[hookWords - 1] ? words[hookWords - 1].endMs / 1000 : 0
  const cues: TimelineCue[] = []
  // The first scene opens on the character's pose with no blend in.
  const opening = lesson.scenes[0]
  const start: Avatar3DLook = { ...look, pose: opening.pose ?? look.pose }

  lesson.scenes.forEach((scene, i) => {
    const { start: t0, end: t1, firstWord } = windows[i]
    const shot = SHOTS[scene.shot]
    const pan = PAN[scene.frame ?? 'center']
    const move = i === 0 ? 'cut' : (scene.move ?? 'glide')
    // During the spoken hook the camera looks a little higher, so the character stands lower in
    // the frame and the headline has room above it.
    const lift = i === 0 && options.hookLift ? options.hookLift : 0
    const camera = { zoom: shot.zoom, tilt: shot.tilt, pan, lift }
    if (move === 'push-in') {
      cues.push({ t: t0, camera: { ...camera, zoom: shot.zoom * 0.82, cut: true } })
      cues.push({ t: t0 + 0.04, camera: { ...camera, rate: 0.9 } })
    } else if (move === 'pull-out') {
      cues.push({ t: t0, camera: { ...camera, zoom: shot.zoom * 1.22, cut: true } })
      cues.push({ t: t0 + 0.04, camera: { ...camera, rate: 0.9 } })
    } else cues.push({ t: t0, camera: { ...camera, cut: move === 'cut' } })
    if (i === 0 && lift && hookEnd) cues.push({ t: hookEnd, camera: { zoom: shot.zoom, tilt: shot.tilt, pan, lift: 0, rate: 3 } })
    if (scene.pose && i > 0) cues.push({ t: t0, pose: scene.pose })
    cues.push({ t: t0, look: LOOK_AT[scene.look ?? 'camera'] })
    cues.push({ t: t0, yaw: deg(scene.turn ?? 0), spin: deg(scene.spin ?? 0) })
    for (const r of scene.react ?? []) {
      const at = r.word === undefined ? t0 : words[firstWord + r.word].startMs / 1000
      cues.push({ t: Math.min(at, t1), react: { kind: r.kind, side: r.side } })
    }
  })
  cues.sort((a, b) => a.t - b.t)
  return { timeline: { width: options.width, height: options.height, fps, frames, look: start, cues, talk: talk.slice(0, frames), lighting: 'cinematic' }, windows, hookEnd }
}

/** The reel draft `npm run reel:create -- --custom-video` needs to archive and queue the finished file. */
export function reelDraftFrom(lesson: Lesson): Record<string, unknown> {
  return {
    title: lesson.title,
    topic: lesson.topic,
    series: lesson.series,
    episode: lesson.episode,
    format: 'animated-lesson',
    hookHeadline: lesson.hookHeadline,
    narrationScript: narrationOf(lesson),
    scenePrompts: lesson.scenes.map((s) => s.description),
    caption: lesson.caption,
    hashtags: lesson.hashtags,
    firstComment: lesson.firstComment,
    youtubeTitle: lesson.youtubeTitle,
    youtubeDescription: lesson.youtubeDescription,
    youtubeTags: lesson.youtubeTags ?? [],
    ctaGoal: lesson.ctaGoal,
    characterArc: `${lesson.host} (animated 3D host)`,
  }
}
