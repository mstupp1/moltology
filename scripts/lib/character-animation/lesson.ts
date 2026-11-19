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
import { SET_NAMES, type SetName } from '../../../src/lib/avatar3d/sets'
import { SHOTS, type AnimationTimeline, type CameraMove, type ShotName, type TimelineCue } from '../../../src/lib/avatar3d/scripted'
import { parseLobsterAvatarConfig } from '../../../src/lib/lobster-avatar'
import { tokenizeScriptText, type WordBoundaryEvent } from '../tts-engine'

export const REACTIONS: readonly Reaction[] = ['poke', 'snap', 'equip', 'celebrate']
export const LOOKS = ['camera', 'wander', 'left', 'right', 'down', 'up'] as const
export type LessonLook = (typeof LOOKS)[number]
export const FRAMES = ['center', 'left', 'right'] as const
export type LessonFrame = (typeof FRAMES)[number]
export const MOVES: readonly CameraMove[] = ['cut', 'glide', 'push-in', 'pull-out']
export const MARKS = ['left', 'center', 'right'] as const
export type Mark = (typeof MARKS)[number]
/** Where each mark stands on the floor, in world units. */
const MARK_X: Record<Mark, number> = { left: -0.75, center: 0, right: 0.75 }
/** The narrator: a voice with no body, so no mouth moves while it speaks. */
export const NARRATOR = 'narrator'

/** What one character does in a scene. */
export interface CharacterDirection {
  pose?: AvatarPose
  react?: { kind: Reaction; word?: number; side?: 1 | -1 }[]
  look?: LessonLook | 'other'
  /** Turn in degrees (positive turns to the viewer's left). */
  turn?: number
}

export interface LessonScene {
  /** What is said during this scene. The scenes' lines joined make the narration. */
  line: string
  /**
   * Who says it: a cast id (that character's mouth moves, in its own voice) or "narrator" (an
   * unseen voice; nobody's mouth moves). Default: the host.
   */
  speaker?: string
  /** Who the camera is on: a cast id, or "all" for everyone. Default: everyone in a two-shot, else the speaker. */
  focus?: string
  shot: ShotName
  /** How the camera reaches the shot. The first scene always starts on it. Default glide. */
  move?: CameraMove
  /** Where the character stands in the frame. Default center. */
  frame?: LessonFrame
  /** Pose for the scene (the character blends into it). Default: keep the last one. */
  pose?: AvatarPose
  /** Reactions, each on a word of this scene's line (0-based), or at the start without one. */
  react?: { kind: Reaction; word?: number; side?: 1 | -1 }[]
  /** Where the eyes go. Default camera alone; in a dialogue the speaker looks at the other ("other"). */
  look?: LessonLook | 'other'
  /** Turn of the whole character in degrees (positive turns to the viewer's left). */
  turn?: number
  /** Slow turntable across the scene, in degrees per second. */
  spin?: number
  /** Backdrop image for this scene; default the lesson's. */
  backdrop?: string
  /**
   * Direction for the other characters, by cast id. The scene's own pose, react, look and turn
   * apply to its subject (the speaking character, or the host when the narrator speaks).
   * Listeners turn to the speaker on their own unless told otherwise here.
   */
  act?: Record<string, CharacterDirection>
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
  /** Cast id from content/animation/cast.json: the main character. */
  host: string
  /**
   * Everyone on stage, with their marks. Default: just the host, centre. The camera's framing is
   * built around the host's size.
   */
  cast?: { id: string; at: Mark }[]
  /** Set dressing in front of the backdrop: codex-study, reef-office or open-water. */
  set?: SetName
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
  /** The character's Fish voice (catalog name), used whenever it speaks. */
  voice?: string
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

/** Everyone on stage, with marks; a lesson without a cast list has only its host, centre. */
export function castOf(lesson: Pick<Lesson, 'host' | 'cast'>): { id: string; at: Mark }[] {
  if (!lesson.cast?.length) return [{ id: lesson.host, at: 'center' }]
  // The host comes first: the camera's framing is built around it.
  return [...lesson.cast].sort((a, b) => Number(b.id === lesson.host) - Number(a.id === lesson.host))
}

/** Who speaks a scene: a cast id or the narrator. */
export function speakerOf(lesson: Pick<Lesson, 'host'>, scene: Pick<LessonScene, 'speaker'>): string {
  return scene.speaker ?? lesson.host
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
  if (!Array.isArray(lesson.scenes) || lesson.scenes.length < 6 || lesson.scenes.length > 10) problems.push('a short has six to ten scenes')
  const cast = castOf(lesson)
  const ids = cast.map((c) => c.id)
  if (!ids.includes(lesson.host)) problems.push('cast must include the host')
  if (new Set(cast.map((c) => c.at)).size !== cast.length) problems.push('each cast member needs their own mark')
  if (cast.some((c) => !MARKS.includes(c.at))) problems.push(`cast marks are ${MARKS.join(', ')}`)
  if (lesson.set && !SET_NAMES.includes(lesson.set)) problems.push(`set "${lesson.set}" is not one of ${SET_NAMES.join(', ')}`)
  if (!Array.isArray(lesson.hashtags) || lesson.hashtags.length > 3) problems.push('at most three hashtags')
  const scenes = Array.isArray(lesson.scenes) ? lesson.scenes : []
  scenes.forEach((scene, i) => {
    const at = `scene ${i + 1}`
    if (!scene.line?.trim()) problems.push(`${at} has no line`)
    if (!scene.description?.trim()) problems.push(`${at} has no description`)
    if (!(scene.shot in SHOTS)) problems.push(`${at} shot "${scene.shot}" is not one of ${Object.keys(SHOTS).join(', ')}`)
    if (scene.move && !MOVES.includes(scene.move)) problems.push(`${at} move "${scene.move}" is not one of ${MOVES.join(', ')}`)
    if (scene.frame && !FRAMES.includes(scene.frame)) problems.push(`${at} frame "${scene.frame}" is not one of ${FRAMES.join(', ')}`)
    if (scene.speaker && scene.speaker !== NARRATOR && !ids.includes(scene.speaker)) problems.push(`${at} speaker "${scene.speaker}" is not in the cast`)
    if (scene.focus && scene.focus !== 'all' && !ids.includes(scene.focus)) problems.push(`${at} focus "${scene.focus}" is not in the cast`)
    const count = wordsOf(scene.line ?? '').length
    const directions: [string, CharacterDirection][] = [['scene', scene], ...Object.entries(scene.act ?? {})]
    for (const [who, d] of directions) {
      if (who !== 'scene' && !ids.includes(who)) problems.push(`${at} directs "${who}", who is not in the cast`)
      if (d.look && d.look !== 'other' && !LOOKS.includes(d.look)) problems.push(`${at} look "${d.look}" is not one of ${LOOKS.join(', ')}, other`)
      if (d.pose && !AVATAR_POSES.includes(d.pose)) problems.push(`${at} pose "${d.pose}" is not one of ${AVATAR_POSES.join(', ')}`)
      for (const r of d.react ?? []) {
        if (!REACTIONS.includes(r.kind)) problems.push(`${at} reaction "${r.kind}" is not one of ${REACTIONS.join(', ')}`)
        if (r.word !== undefined && (r.word < 0 || r.word >= count)) problems.push(`${at} reaction word ${r.word} is outside its ${count}-word line`)
      }
    }
  })
  const first = scenes[0]?.line?.trim() ?? ''
  // Scene 1 is the hook alone: its framing leaves room for the headline, and body subtitles would
  // land on the cast in that framing.
  if (lesson.hookHeadline && first.trim() !== lesson.hookHeadline.trim()) problems.push('scene 1 must be exactly the hookHeadline (put the rest of the line in scene 2)')
  if (lesson.hookHeadline && wordsOf(lesson.hookHeadline).length >= 14) problems.push('hookHeadline must be under 14 words')
  const words = wordsOf(narrationOf({ scenes })).length
  if (words < 40 || words > 80) problems.push(`narration is ${words} words; aim for 50 to 65 (up to 75 for a dialogue)`)
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
 * timings of the actual voice, plus each character's speech level per frame (`talkBy`, in cast
 * order; a character that never speaks gets an empty track).
 */
export function buildTimeline(
  lesson: Lesson,
  looks: Record<string, Avatar3DLook>,
  words: WordBoundaryEvent[],
  talkBy: number[][],
  options: TimelineOptions & { set?: SetName },
): { timeline: AnimationTimeline; windows: ReturnType<typeof sceneWindows>; hookEnd: number } {
  const fps = options.fps
  const cast = castOf(lesson)
  const index = new Map(cast.map((c, i) => [c.id, i]))
  const xOf = (id: string) => MARK_X[cast[index.get(id)!].at]
  const lastWord = words.length ? words[words.length - 1].endMs / 1000 : 0
  const longest = Math.max(0, ...talkBy.map((t) => t.length))
  const duration = Math.max(lastWord + (options.tail ?? 0.8), longest / fps)
  const frames = Math.ceil(duration * fps)
  const windows = sceneWindows(lesson, words, duration)
  const hookWords = wordsOf(lesson.hookHeadline).length
  const hookEnd = hookWords && words[hookWords - 1] ? words[hookWords - 1].endMs / 1000 : 0
  const cues: TimelineCue[] = []
  const solo = cast.length === 1
  const others = (id: string) => cast.filter((c) => c.id !== id)
  /** The eyes of `from` turned toward `to`, as a pointer offset (viewer's right is +x). */
  const toward = (from: string, to: string) => ({ x: Math.sign(xOf(to) - xOf(from)) * 1.5, y: 0 })
  const lookFor = (who: string, look: CharacterDirection['look'], partner: string | null) =>
    look === 'other' ? (partner ? toward(who, partner) : LOOK_AT.camera) : LOOK_AT[(look ?? 'camera') as LessonLook]

  // Everyone opens on their first pose with no blend in.
  const firstPose = (id: string) => {
    const s0 = lesson.scenes[0]
    const subject0 = speakerOf(lesson, s0) === NARRATOR ? lesson.host : speakerOf(lesson, s0)
    return (id === subject0 ? s0.pose : s0.act?.[id]?.pose) ?? looks[id].pose
  }

  lesson.scenes.forEach((scene, i) => {
    const { start: t0, end: t1, firstWord } = windows[i]
    const speaker = speakerOf(lesson, scene)
    const subject = speaker === NARRATOR ? lesson.host : speaker
    // A two-shot takes in everyone; other shots go to whoever is talking.
    const focus = scene.focus ?? (scene.shot === 'two' && !solo ? 'all' : speaker !== NARRATOR ? speaker : solo ? lesson.host : 'all')
    const shot = SHOTS[scene.shot]
    // Centre the camera on its subject (or between everyone), then nudge for the frame setting.
    const centre = focus === 'all' ? cast.reduce((sum, c) => sum + MARK_X[c.at], 0) / cast.length : xOf(focus)
    const pan = centre + PAN[scene.frame ?? 'center']
    // The opening shot looks a little higher, so the characters stand lower in the frame and the
    // hook headline has room above them. It holds for the whole first scene and goes on the cut to
    // the second (a glide there becomes a cut), so the frame never visibly slides.
    const move = i === 0 || (i === 1 && options.hookLift && (scene.move ?? 'glide') === 'glide') ? 'cut' : (scene.move ?? 'glide')
    const lift = i === 0 && options.hookLift ? options.hookLift : 0
    const camera = { zoom: shot.zoom, tilt: shot.tilt, pan, lift }
    if (move === 'push-in') {
      cues.push({ t: t0, camera: { ...camera, zoom: shot.zoom * 0.82, cut: true } })
      cues.push({ t: t0 + 0.04, camera: { ...camera, rate: 0.9 } })
    } else if (move === 'pull-out') {
      cues.push({ t: t0, camera: { ...camera, zoom: shot.zoom * 1.22, cut: true } })
      cues.push({ t: t0 + 0.04, camera: { ...camera, rate: 0.9 } })
    } else cues.push({ t: t0, camera: { ...camera, cut: move === 'cut' } })

    for (const member of cast) {
      const who = index.get(member.id)!
      const own: CharacterDirection = member.id === subject ? scene : (scene.act?.[member.id] ?? {})
      const partner = member.id === subject ? (others(subject)[0]?.id ?? null) : speaker !== NARRATOR ? speaker : subject
      // A speaker in a dialogue talks to the other character; alone, or to the narrator, they face us.
      const defaultLook: CharacterDirection['look'] = solo ? 'camera' : member.id === speaker ? 'other' : speaker !== NARRATOR ? 'other' : 'camera'
      const look = own.look ?? defaultLook
      // Listeners (and anyone told to look at the other) turn a little toward who they look at.
      const facing = look === 'other' && partner ? Math.sign(xOf(partner) - xOf(member.id)) * 18 : 0
      if (own.pose && i > 0) cues.push({ t: t0, who, pose: own.pose })
      cues.push({ t: t0, who, look: lookFor(member.id, look, partner) })
      cues.push({ t: t0, who, yaw: deg(own.turn ?? facing) })
      for (const r of own.react ?? []) {
        const at = r.word === undefined ? t0 : words[firstWord + r.word].startMs / 1000
        cues.push({ t: Math.min(at, t1), who, react: { kind: r.kind, side: r.side } })
      }
    }
    cues.push({ t: t0, spin: deg(scene.spin ?? 0) })
  })
  cues.sort((a, b) => a.t - b.t)
  const castLooks = cast.map((c) => ({ look: { ...looks[c.id], pose: firstPose(c.id) }, x: MARK_X[c.at] }))
  const tracks = cast.map((_, i) => (talkBy[i] ?? []).slice(0, frames))
  return {
    timeline: {
      width: options.width,
      height: options.height,
      fps,
      frames,
      look: castLooks[0].look,
      cues,
      talk: tracks[0],
      talkBy: tracks,
      cast: solo ? undefined : castLooks,
      set: options.set ?? lesson.set,
      lighting: 'cinematic',
    },
    windows,
    hookEnd,
  }
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
    // reel:create stores exactly six scene prompts; longer dialogues fold neighbouring scenes together.
    scenePrompts: Array.from({ length: 6 }, (_, k) => {
      const from = Math.floor((k * lesson.scenes.length) / 6)
      const to = Math.floor(((k + 1) * lesson.scenes.length) / 6)
      return lesson.scenes.slice(from, Math.max(to, from + 1)).map((s) => s.description).join(' ')
    }),
    caption: lesson.caption,
    hashtags: lesson.hashtags,
    firstComment: lesson.firstComment,
    youtubeTitle: lesson.youtubeTitle,
    youtubeDescription: lesson.youtubeDescription,
    youtubeTags: lesson.youtubeTags ?? [],
    ctaGoal: lesson.ctaGoal,
    characterArc: `${castOf(lesson).map((c) => c.id).join(', ')} (animated 3D cast)`,
  }
}
