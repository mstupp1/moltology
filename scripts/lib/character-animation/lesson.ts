/**
 * Animated lessons: a reviewed lesson script (scenes of narration plus direction) turned into a
 * frame-accurate timeline for the 3D character. Pure functions, so they are unit tested; the
 * renderer and compositor live in render.ts and compose.ts.
 */
import fs from 'node:fs'
import path from 'node:path'
import { AVATAR_POSES, type AvatarPose } from '../../../src/lib/avatar/traits'
import { lookFromConfig, type Avatar3DLook } from '../../../src/lib/avatar3d/look'
import { GESTURES, GESTURE_SECONDS, jitter, type Gesture, type Reaction } from '../../../src/lib/avatar3d/motion'
import { SET_NAMES, type SetName } from '../../../src/lib/avatar3d/sets'
import { SHOTS, type AnimationTimeline, type CameraMove, type ShotName, type TimelineCue } from '../../../src/lib/avatar3d/scripted'
import { parseLobsterAvatarConfig } from '../../../src/lib/lobster-avatar'
import { tokenizeScriptText, type WordBoundaryEvent } from '../tts-engine'

/** How far a podcast-desk speaker shot aims below the default, in world units (see buildTimeline). */
const DESK_SHOT_DROP = 0.16
/** Keeps non-hook, non-monitor podcast-studio two-shots anchored in the lower frame instead of floating mid-screen. */
const PODCAST_TWO_LIFT = 0.65

export const MIN_CLIP_SECONDS = 1.5
export const MAX_CLIP_SECONDS = 9.5
export const MAX_TOTAL_CLIP_SECONDS = 16.0
export const MAX_CLIP_RATIO = 0.35

export interface SourceClip {
  /** Path to the trimmed ephemeral clip inside tmp/ (relative to lesson file or repo root). */
  path: string
  /** Offset in seconds inside `path` (usually 0 after `anim:clip fetch`). */
  start: number
  /** Duration in seconds (1.5s–9.5s). */
  duration: number
  /** Shown on the studio monitor attribution bar ("Channel · Video Title"). */
  attribution: string
  url?: string
  publishedAt?: string
  volume?: number
  layout?: 'monitor' | 'inset-only'
  transcript?: string
}

export type ClipWindowMap = Record<number, { start: number; end: number }>

export const REACTIONS: readonly Reaction[] = ['poke', 'snap', 'equip', 'celebrate']
export const LOOKS = ['camera', 'wander', 'left', 'right', 'down', 'up'] as const
export type LessonLook = (typeof LOOKS)[number]
export const FRAMES = ['center', 'left', 'right'] as const
export type LessonFrame = (typeof FRAMES)[number]
export const MOVES: readonly CameraMove[] = ['cut', 'glide', 'push-in', 'pull-out']
export const MARKS = ['left', 'center', 'right'] as const
export type Mark = (typeof MARKS)[number]
/** Where each mark stands on the floor, in world units. */
const MARK_X: Record<Mark, number> = { left: -1.05, center: 0, right: 1.05 }

/** Stage coordinates for a cast member: 3-character casts pull center slightly back in a shallow V so feet never clip. */
export function markPosition(mark: Mark, castCount: number): { x: number; z: number } {
  if (castCount >= 3) {
    if (mark === 'left') return { x: -1.15, z: 0.15 }
    if (mark === 'right') return { x: 1.15, z: 0.15 }
    return { x: 0, z: -0.85 }
  }
  return { x: MARK_X[mark], z: 0 }
}
/** The narrator: a voice with no body, so no mouth moves while it speaks. */
export const NARRATOR = 'narrator'

/**
 * How much a character acts on its own while it talks and listens: gestures on stressed words,
 * nods, head tilts on questions, weight shifts (see actingCues). "calm" is smaller and rarer.
 */
export const ACTING = ['auto', 'calm', 'none'] as const
export type Acting = (typeof ACTING)[number]

/** What one character does in a scene. */
export interface CharacterDirection {
  pose?: AvatarPose
  react?: { kind: Reaction; word?: number; side?: 1 | -1 }[]
  /** Hand-placed talking gestures, each on a word of the line. Any here replace the automatic ones. */
  gesture?: { kind: Gesture; word?: number; side?: 1 | -1 }[]
  /** Automatic acting for this character in this scene (default: the lesson's). */
  acting?: Acting
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
  /** Hand-placed talking gestures on words of the line; any here replace the automatic ones. */
  gesture?: { kind: Gesture; word?: number; side?: 1 | -1 }[]
  /** Automatic acting for the scene's subject (default: the lesson's). */
  acting?: Acting
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
  /** A full-frame 1080x1920 transparent PNG laid over this scene (a title card, a greeting), relative to the lesson file. */
  overlay?: string
  /** Third-party YouTube clip shown inside the Molt Pod studio monitor while the cast watches. */
  sourceClip?: SourceClip
}

export interface Lesson {
  id: string
  title: string
  topic: string
  series: string
  episode: number
  /** `clip`: a block of scenes for a long-form video (create-longform), no hook, outro or captions. */
  format: 'short' | 'sketch' | 'reaction' | 'clip'
  /** Frame shape; long-form clips are 16:9. */
  aspect?: '9:16' | '16:9'
  /** Cast id from content/characters/cast.json: the main character. */
  host: string
  /**
   * Everyone on stage, with their marks. Default: just the host, centre. The camera's framing is
   * built around the host's size.
   */
  cast?: CastSpot[]
  /** Set dressing in front of the backdrop: codex-study, reef-office, open-water or podcast-studio. */
  set?: SetName
  /** A small tag on every scene, e.g. "Molt Pod · Ep. 3" (show-style series). */
  tag?: string
  /** How much the cast acts on their own while talking and listening. Default auto. */
  acting?: Acting
  /** The Codex passage taught, when there is one. */
  codex?: { id: string; title: string; url: string }
  /** The exact first sentence of the first scene's line. Shown big during the spoken hook. */
  hookHeadline: string
  /** Default backdrop image (1080x1920 or larger), relative to the lesson file. */
  backdrop?: string
  /** A floor texture tile that replaces the set's floor (e.g. snow under a winter backdrop), relative to the lesson file. */
  floor?: string
  scenes: LessonScene[]
  caption: string
  hashtags: string[]
  firstComment: string
  youtubeTitle: string
  youtubeDescription: string
  youtubeTags?: string[]
  ctaGoal?: string
  /** Outro card image (ImageGen), relative to the lesson file, or 'none' for a hard cut on the punchline. */
  outro?: string
  /** Playbook loudness (1-5) for the continuity ledger. */
  loudness?: number
  /** Pause between speakers in seconds (default 0.35 for lessons, 0.14 for comedy sketches). */
  turnGap?: number
  /** Seconds of picture after the last word (default 0.8 for lessons, 0.3 for comedy sketches). */
  tail?: number
  /** Ambient music volume (default 0.14 for lessons, 0 for dry comedy sketches). */
  bgVolume?: number
  /** Optional Zernio queue ID override saved into draft.json. */
  queueId?: string
}

/**
 * A character on stage. `equipment` dresses them for this lesson only (a holiday outfit, a
 * costume), slot by slot over their usual gear, in the saved config's shape:
 * `{ "head": { "visualKey": "pilgrim-hat", "rarity": "rare" } }`.
 */
export interface CastSpot {
  id: string
  at: Mark
  equipment?: Record<string, { visualKey: string; rarity: string }>
}

export interface CastMember {
  name?: string
  role: string
  /** The character's Fish voice (catalog name), used whenever it speaks. */
  voice?: string
  /** A saved character config, exactly as the site stores it. */
  config: Record<string, unknown>
}

/** The shared content cast (also used by the composite studio and `npm run cast:render`). */
export const CAST_PATH = path.resolve(process.cwd(), 'content/characters/cast.json')

/**
 * The cast by key, with every alias and first name as another key for the same member, so a
 * lesson can say `juno`, `host-crab` or `crab_juno_marsh`.
 */
export function loadCast(file = CAST_PATH): Record<string, CastMember> {
  const cast: Record<string, CastMember & { aliases?: string[] }> = JSON.parse(fs.readFileSync(file, 'utf8')).cast
  const out: Record<string, CastMember> = {}
  for (const [key, member] of Object.entries(cast)) {
    out[key] = member
    out[key.replace(/^(lobster|crab)_/, '')] = member
    for (const alias of member.aliases ?? []) out[alias] = member
  }
  return out
}

/** The 3D look for a cast member, resolved the way the site resolves a saved character. */
export function castLook(id: string, cast = loadCast(), equipment?: CastSpot['equipment']): Avatar3DLook {
  const member = cast[id]
  if (!member) throw new Error(`No cast member "${id}" in content/characters/cast.json (have: ${Object.keys(cast).join(', ')})`)
  // Lessons start everyone at rest; poses come from the scene cues.
  const own = (member.config.equipment ?? {}) as Record<string, unknown>
  const config = parseLobsterAvatarConfig({ pose: 'rest', ...member.config, ...(equipment ? { equipment: { ...own, ...equipment } } : {}) })
  if (!config) throw new Error(`Cast member "${id}" has an invalid character config`)
  for (const [slot, piece] of Object.entries(equipment ?? {})) {
    if (config.equipment?.[slot as keyof typeof config.equipment]?.visualKey !== piece.visualKey) throw new Error(`Cast member "${id}": "${piece.visualKey}" does not fit slot "${slot}" (or is not a gear key)`)
  }
  return lookFromConfig(config)
}

/** Everyone on stage, with marks; a lesson without a cast list has only its host, centre. */
export function castOf(lesson: Pick<Lesson, 'host' | 'cast'>): CastSpot[] {
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

/** The full narration: every spoken scene's line, in order. */
export function narrationOf(lesson: Pick<Lesson, 'scenes'>): string {
  return lesson.scenes
    .map((s) => s.line.trim())
    .filter(Boolean)
    .join(' ')
}

/**
 * A long-form clip is a run of scenes cut into a longer video by create-longform: it needs a cast
 * and scenes the renderer can direct, but no hook, platform copy or word budget of a short.
 */
function clipProblems(lesson: Lesson): string[] {
  const problems: string[] = []
  if (!lesson.id?.trim() || !lesson.host?.trim()) problems.push('a clip needs an id and a host')
  if (!Array.isArray(lesson.scenes) || lesson.scenes.length < 1 || lesson.scenes.length > 16) problems.push('a clip has one to sixteen scenes')
  const ids = castOf(lesson).map((c) => c.id)
  if (!ids.includes(lesson.host)) problems.push('cast must include the host')
  if (lesson.set && !SET_NAMES.includes(lesson.set)) problems.push(`set "${lesson.set}" is not one of ${SET_NAMES.join(', ')}`)
  lesson.scenes?.forEach((scene, i) => {
    const at = `scene ${i + 1}`
    if (!scene.line?.trim()) problems.push(`${at} has no line`)
    if (!(scene.shot in SHOTS)) problems.push(`${at} shot "${scene.shot}" is not one of ${Object.keys(SHOTS).join(', ')}`)
    if (scene.speaker && scene.speaker !== NARRATOR && !ids.includes(scene.speaker)) problems.push(`${at} speaker "${scene.speaker}" is not in the cast`)
  })
  return problems
}

/** Problems that would make a bad render or a bad short. Empty means it can be produced. */
export function lessonProblems(lesson: Lesson): string[] {
  const problems: string[] = []
  if (lesson.format === 'clip') return clipProblems(lesson)
  for (const key of ['id', 'title', 'topic', 'series', 'host', 'hookHeadline', 'caption', 'firstComment', 'youtubeTitle', 'youtubeDescription'] as const) {
    if (typeof lesson[key] !== 'string' || !lesson[key].trim()) problems.push(`needs ${key}`)
  }
  if (lesson.format !== 'short' && lesson.format !== 'sketch' && lesson.format !== 'reaction') {
    problems.push('format must be "short", "sketch", "reaction" or "clip"')
  }
  const isSketch = lesson.format === 'sketch'
  const isReaction = lesson.format === 'reaction'
  const minScenes = isSketch ? 4 : isReaction ? 5 : 6
  const maxScenes = isReaction ? 12 : 10
  if (!Array.isArray(lesson.scenes) || lesson.scenes.length < minScenes || lesson.scenes.length > maxScenes) {
    problems.push(
      isSketch
        ? 'a sketch has four to ten scenes'
        : isReaction
          ? 'a reaction has five to twelve scenes'
          : 'a short has six to ten scenes',
    )
  }
  const cast = castOf(lesson)
  const ids = cast.map((c) => c.id)
  if (!ids.includes(lesson.host)) problems.push('cast must include the host')
  if (new Set(cast.map((c) => c.at)).size !== cast.length) problems.push('each cast member needs their own mark')
  if (cast.some((c) => !MARKS.includes(c.at))) problems.push(`cast marks are ${MARKS.join(', ')}`)
  if (lesson.acting && !ACTING.includes(lesson.acting)) problems.push(`acting "${lesson.acting}" is not one of ${ACTING.join(', ')}`)
  if (lesson.tag !== undefined && (typeof lesson.tag !== 'string' || lesson.tag.length > 32)) problems.push('tag is a short label of at most 32 characters')
  if (lesson.set && !SET_NAMES.includes(lesson.set)) problems.push(`set "${lesson.set}" is not one of ${SET_NAMES.join(', ')}`)
  if (!Array.isArray(lesson.hashtags) || lesson.hashtags.length > 3) problems.push('at most three hashtags')
  const scenes = Array.isArray(lesson.scenes) ? lesson.scenes : []
  let clipCount = 0
  let totalClipDuration = 0
  scenes.forEach((scene, i) => {
    const at = `scene ${i + 1}`
    if (scene.sourceClip) {
      clipCount++
      if (!isReaction) problems.push(`${at}: sourceClip is only supported on "reaction" episodes`)
      if (i === 0) problems.push('scene 1 cannot be a sourceClip (put the spoken hookHeadline first)')
      if (scene.line?.trim()) problems.push(`${at} has a sourceClip so line must be empty`)
      const sc = scene.sourceClip
      if (typeof sc.path !== 'string' || !sc.path.trim()) {
        problems.push(`${at} sourceClip needs a path`)
      } else {
        const norm = sc.path.replace(/\\/g, '/').replace(/^\.\//, '')
        if (norm.startsWith('public/') || norm.startsWith('src/') || norm === 'public' || norm === 'src') {
          problems.push(`${at} sourceClip path must stay outside public/ and src/`)
        }
      }
      if (typeof sc.start !== 'number' || !Number.isFinite(sc.start) || sc.start < 0) {
        problems.push(`${at} sourceClip start must be >= 0`)
      }
      if (typeof sc.duration !== 'number' || !Number.isFinite(sc.duration) || sc.duration < MIN_CLIP_SECONDS || sc.duration > MAX_CLIP_SECONDS) {
        problems.push(`${at} sourceClip duration must be between ${MIN_CLIP_SECONDS}s and ${MAX_CLIP_SECONDS}s`)
      } else {
        totalClipDuration += sc.duration
      }
      if (typeof sc.attribution !== 'string' || !sc.attribution.trim() || sc.attribution.trim().length > 90) {
        problems.push(`${at} sourceClip needs attribution of at most 90 characters`)
      }
      if (sc.layout !== undefined && sc.layout !== 'monitor' && sc.layout !== 'inset-only') {
        problems.push(`${at} sourceClip layout must be "monitor" or "inset-only"`)
      }
    } else if (!scene.line?.trim()) {
      problems.push(`${at} has no line`)
    }
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
      // The think pose holds a claw at the chin, right over the mouth: fine for a listener, but it
      // hides the lip sync on a character who is talking.
      const talking = !scene.sourceClip && (who === 'scene' ? speakerOf(lesson, scene) !== NARRATOR : who === speakerOf(lesson, scene))
      if (talking && d.pose === 'think') problems.push(`${at}: the speaker can't use the think pose (its claw covers the mouth); give it to a listener`)
      if (d.acting && !ACTING.includes(d.acting)) problems.push(`${at} acting "${d.acting}" is not one of ${ACTING.join(', ')}`)
      for (const g of d.gesture ?? []) {
        if (!GESTURES.includes(g.kind)) problems.push(`${at} gesture "${g.kind}" is not one of ${GESTURES.join(', ')}`)
        if (scene.sourceClip || (g.word !== undefined && (g.word < 0 || g.word >= count))) {
          problems.push(`${at} gesture word ${g.word ?? '(none)'} is outside its ${count}-word line`)
        }
      }
      for (const r of d.react ?? []) {
        if (!REACTIONS.includes(r.kind)) problems.push(`${at} reaction "${r.kind}" is not one of ${REACTIONS.join(', ')}`)
        if (scene.sourceClip || (r.word !== undefined && (r.word < 0 || r.word >= count))) {
          problems.push(`${at} reaction word ${r.word ?? '(none)'} is outside its ${count}-word line`)
        }
      }
    }
  })
  if (isReaction && (clipCount < 1 || clipCount > 3)) {
    problems.push('a reaction needs 1 to 3 sourceClip scenes')
  }
  if (totalClipDuration > MAX_TOTAL_CLIP_SECONDS) {
    problems.push(`total sourceClip duration is ${totalClipDuration.toFixed(1)}s; keep under ${MAX_TOTAL_CLIP_SECONDS}s`)
  }
  const first = scenes[0]?.line?.trim() ?? ''
  // Scene 1 is the hook alone: its framing leaves room for the headline, and body subtitles would
  // land on the cast in that framing.
  if (lesson.hookHeadline && first.trim() !== lesson.hookHeadline.trim()) problems.push('scene 1 must be exactly the hookHeadline (put the rest of the line in scene 2)')
  if (lesson.hookHeadline && wordsOf(lesson.hookHeadline).length >= 14) problems.push('hookHeadline must be under 14 words')
  const words = wordsOf(narrationOf({ scenes })).length
  if (isSketch ? words < 18 || words > 65 : isReaction ? words < 45 || words > 115 : words < 40 || words > 80) {
    problems.push(
      isSketch
        ? `narration is ${words} words; aim for 25 to 55 for a comedy sketch`
        : isReaction
          ? `narration is ${words} words; aim for 45 to 115 for a reaction`
          : `narration is ${words} words; aim for 50 to 65 (up to 75 for a dialogue)`,
    )
  }
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

/** When each scene starts and ends, in seconds, from where its first word is spoken or clip plays. */
export function sceneWindows(
  lesson: Pick<Lesson, 'scenes'>,
  words: WordBoundaryEvent[],
  total: number,
  clipWindows?: ClipWindowMap,
): { start: number; end: number; firstWord: number }[] {
  let index = 0
  const firsts = lesson.scenes.map((scene) => {
    const first = index
    index += wordsOf(scene.line).length
    return first
  })
  if (index !== words.length) {
    throw new Error(`Voice has ${words.length} words but the scenes have ${index}; re-run the voice step after editing lines`)
  }
  const LEAD = 0.12
  if (!clipWindows) {
    // A scene cuts in a little before its first word, as an editor would.
    const starts = firsts.map((w, i) => (i === 0 ? 0 : Math.max(0, words[w].startMs / 1000 - LEAD)))
    return starts.map((start, i) => ({ start, end: i + 1 < starts.length ? starts[i + 1] : total, firstWord: firsts[i] }))
  }
  const windows: { start: number; end: number; firstWord: number }[] = []
  for (let i = 0; i < lesson.scenes.length; i++) {
    const prevFloor = i === 0 ? 0 : clipWindows[i - 1] ? clipWindows[i - 1].end : windows[i - 1].start
    const clip = clipWindows[i]
    let start: number
    if (i === 0) {
      start = 0
    } else if (clip) {
      start = clip.start
    } else if (clipWindows[i - 1]) {
      // Snap cleanly back to the studio right as the preceding source clip ends.
      start = clipWindows[i - 1].end
    } else {
      const w = words[firsts[i]]
      start = w ? Math.max(prevFloor, w.startMs / 1000 - LEAD) : prevFloor
    }
    if (i > 0 && start < prevFloor) start = prevFloor
    windows.push({ start, end: total, firstWord: firsts[i] })
  }
  for (let i = 0; i < windows.length; i++) {
    const clip = clipWindows[i]
    if (clip) {
      windows[i].end = clip.end
      if (i + 1 < windows.length && windows[i + 1].start < clip.end) {
        windows[i + 1].start = clip.end
      }
    } else if (i + 1 < windows.length) {
      windows[i].end = windows[i + 1].start
    }
  }
  return windows
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
  options: TimelineOptions & {
    set?: SetName
    mouthBy?: string[]
    emphasisBy?: number[][]
    accentBy?: number[][]
    clipWindows?: ClipWindowMap
  },
): { timeline: AnimationTimeline; windows: ReturnType<typeof sceneWindows>; hookEnd: number } {
  const fps = options.fps
  const cast = castOf(lesson)
  const index = new Map(cast.map((c, i) => [c.id, i]))
  const xOf = (id: string) => markPosition(cast[index.get(id)!].at, cast.length).x
  const lastWord = words.length ? words[words.length - 1].endMs / 1000 : 0
  const lastClipEnd = options.clipWindows ? Math.max(0, ...Object.values(options.clipWindows).map((w) => w.end)) : 0
  const longest = Math.max(0, ...talkBy.map((t) => t.length))
  const duration = Math.max(Math.max(lastWord, lastClipEnd) + (options.tail ?? 0.8), longest / fps)
  const frames = Math.ceil(duration * fps)
  const windows = sceneWindows(lesson, words, duration, options.clipWindows)
  const hookWords = lesson.hookHeadline ? wordsOf(lesson.hookHeadline).length : 0
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
    const isClipScene = Boolean(scene.sourceClip)
    const afterClipScene = i > 0 && Boolean(lesson.scenes[i - 1]?.sourceClip)
    const monitorLayout = isClipScene && scene.sourceClip?.layout !== 'inset-only'
    const speaker = isClipScene ? NARRATOR : speakerOf(lesson, scene)
    const subject = speaker === NARRATOR ? lesson.host : speaker
    // A two-shot takes in everyone; other shots go to whoever is talking.
    const focus = scene.focus ?? (scene.shot === 'two' && !solo ? 'all' : speaker !== NARRATOR ? speaker : solo ? lesson.host : 'all')
    const shot = SHOTS[scene.shot]
    // Centre the camera on its subject (or between everyone), then nudge for the frame setting.
    const centre = focus === 'all' ? cast.reduce((sum, c) => sum + markPosition(c.at, cast.length).x, 0) / cast.length : xOf(focus)
    const pan = centre + PAN[scene.frame ?? 'center']
    // The opening shot looks a little higher, so the characters stand lower in the frame and the
    // hook headline has room above them. It holds for the whole first scene and goes on the cut to
    // the second (a glide there becomes a cut), so the frame never visibly slides.
    // Source-clip monitor scenes also cut cleanly in and out so the camera never slides past the monitor.
    const move =
      i === 0 || isClipScene || afterClipScene || (i === 1 && options.hookLift && (scene.move ?? 'glide') === 'glide')
        ? 'cut'
        : (scene.move ?? 'glide')
    // A two-shot is framed wider, so it needs less lift to clear the headline; more would strand the
    // pair high above an empty floor.
    const hook = i === 0 && options.hookLift ? options.hookLift * (scene.shot === 'two' ? 0.8 : 1) : 0
    // While the studio monitor plays above (y 288..920), aim higher so the cast & desk sit below it.
    const monitorLift = monitorLayout ? (scene.shot === 'two' ? 1.02 : 1.05) : 0
    const isPodcastTwo = (options.set ?? lesson.set) === 'podcast-studio' && i > 0 && !monitorLayout && scene.shot === 'two'
    const podcastTwoLift = isPodcastTwo ? PODCAST_TWO_LIFT : 0
    // At the podcast desk a single-speaker shot aims lower, so the mouth sits above the subtitle band
    // (centred at 61% of the height) instead of under it; the desk fills the bottom of the frame.
    const deskDrop = (options.set ?? lesson.set) === 'podcast-studio' && i > 0 && !monitorLayout && scene.shot !== 'two' && focus !== 'all' ? DESK_SHOT_DROP : 0
    const lift = hook + monitorLift + podcastTwoLift - deskDrop
    // The hook's two-shot comes in a step closer so the pair reads big under the headline. It holds
    // a resting pose there; later two-shots keep the wider frame so pointing and cheering claws stay in.
    const zoom = (i === 0 && options.hookLift && scene.shot === 'two') || (monitorLayout && scene.shot === 'two') || isPodcastTwo ? 0.56 : shot.zoom
    const camera = { zoom, tilt: shot.tilt, pan, lift, subject: focus === 'all' ? 0 : index.get(focus)! }
    if (move === 'push-in') {
      cues.push({ t: t0, camera: { ...camera, zoom: zoom * 0.82, cut: true } })
      cues.push({ t: t0 + 0.04, camera: { ...camera, rate: 0.9 } })
    } else if (move === 'pull-out' && scene.shot === 'two') {
      // A two-shot is already as wide as the pair: starting closer would crop the outer claws, so it
      // opens at the plain two-shot and eases a step wider (the stage's widest).
      cues.push({ t: t0, camera: { ...camera, cut: true } })
      cues.push({ t: t0 + 0.04, camera: { ...camera, zoom: zoom * 0.9, rate: 0.9 } })
    } else if (move === 'pull-out') {
      cues.push({ t: t0, camera: { ...camera, zoom: zoom * 1.22, cut: true } })
      cues.push({ t: t0 + 0.04, camera: { ...camera, rate: 0.9 } })
    } else cues.push({ t: t0, camera: { ...camera, cut: move === 'cut' } })

    for (const member of cast) {
      const who = index.get(member.id)!
      const own: CharacterDirection = member.id === subject ? scene : (scene.act?.[member.id] ?? {})
      const partner = member.id === subject ? (others(subject)[0]?.id ?? null) : speaker !== NARRATOR ? speaker : subject
      // While watching a source clip, cast members default to looking up at the studio monitor.
      const defaultLook: CharacterDirection['look'] = isClipScene
        ? 'up'
        : solo
          ? 'camera'
          : member.id === speaker
            ? 'other'
            : speaker !== NARRATOR
              ? 'other'
              : 'camera'
      const look = own.look ?? defaultLook
      // Listeners (and anyone told to look at the other) turn a little toward who they look at.
      const facing = look === 'other' && partner ? Math.sign(xOf(partner) - xOf(member.id)) * 18 : 0
      // On a cut the new shot opens already in its pose: a blend there only shows as a limb sweeping
      // across the frame (and through whoever stands beside it).
      if (own.pose && i > 0) cues.push({ t: t0, who, pose: own.pose, ...(move === 'cut' ? { snap: true } : {}) })
      cues.push({ t: t0, who, look: lookFor(member.id, look, partner) })
      cues.push({ t: t0, who, yaw: deg(own.turn ?? facing) })
      if (!isClipScene) {
        for (const r of own.react ?? []) {
          const at = r.word === undefined ? t0 : words[firstWord + r.word].startMs / 1000
          cues.push({ t: Math.min(at, t1), who, react: { kind: r.kind, side: r.side } })
        }
        for (const g of own.gesture ?? []) {
          // A gesture starts a moment before its word so the hit lands on it.
          const at = g.word === undefined ? t0 : words[firstWord + g.word].startMs / 1000 - GESTURE_LEAD
          cues.push({ t: Math.max(t0, Math.min(at, t1)), who, gesture: { kind: g.kind, side: g.side ?? 1 } })
        }
      }
    }
    cues.push({ t: t0, spin: deg(scene.spin ?? 0) })
  })
  cues.push(...actingCues(lesson, words, windows, cues, xOf))
  cues.sort((a, b) => a.t - b.t)
  const castLooks = cast.map((c) => {
    const pos = markPosition(c.at, cast.length)
    return { look: { ...looks[c.id], pose: firstPose(c.id) }, x: pos.x, ...(pos.z ? { z: pos.z } : {}) }
  })
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
      mouthBy: options.mouthBy?.map((m) => m.slice(0, frames)),
      emphasisBy: options.emphasisBy?.map((m) => m.slice(0, frames)),
      accentBy: options.accentBy?.map((m) => m.slice(0, frames)),
      cast: solo ? undefined : castLooks,
      set: options.set ?? lesson.set,
      lighting: 'cinematic',
    },
    windows,
    hookEnd,
  }
}

/** How far ahead of its word a gesture starts, so the hit lands on the word. */
const GESTURE_LEAD = 0.12

const strip = (word: string) => word.replace(/[^a-z0-9']/gi, '')
/** Words worth a gesture: long ones, numbers and anything said with an exclamation. */
const stressed = (word: string) => strip(word).length >= 5 || /\d/.test(word) || /!$/.test(word)
/** Tiny function words never carry a beat, however they are spelled. */
const LIGHT = new Set(['because', 'through', 'without', 'another', 'something', 'anything', 'everything', 'really', 'should', 'would', 'could'])

/**
 * The cast acting on their own, so nobody stands frozen through a line: the speaker beats a claw
 * on stressed words, opens both claws out or offers one to whoever is listening, tilts the head
 * on a question and shifts weight between thoughts; listeners nod at the ends of sentences and
 * tilt at questions. Choices come from a fixed hash of the scene and word, so a re-render acts
 * the same way. Nothing lands near a hand-written reaction, gesture or pose change.
 */
export function actingCues(
  lesson: Lesson,
  words: WordBoundaryEvent[],
  windows: ReturnType<typeof sceneWindows>,
  written: TimelineCue[],
  xOf: (id: string) => number,
): TimelineCue[] {
  const cast = castOf(lesson)
  const out: TimelineCue[] = []
  const busy = (who: number, t: number, before: number, after: number) =>
    written.some((c) => (c.who ?? 0) === who && (c.react || c.gesture || (c.pose && c.t > 0.01)) && t > c.t - before && t < c.t + after)
  const last = new Map<string, number>()
  const lastKind = new Map<string, Gesture>()
  const add = (who: number, t: number, kind: Gesture, side: 1 | -1, amount: number) => {
    out.push({ t, who, gesture: { kind, side, amount: Math.round(amount * 100) / 100 }, auto: true })
    last.set(`${who}`, t)
    lastKind.set(`${who}`, kind)
  }
  lesson.scenes.forEach((scene, i) => {
    if (scene.sourceClip) return
    const { start: t0, end: t1, firstWord } = windows[i]
    const count = wordsOf(scene.line).length
    const speaker = speakerOf(lesson, scene)
    const sceneWords = words.slice(firstWord, firstWord + count)
    // Close shots crop the claws, so gestures there are smaller and mostly in the head.
    const close = scene.shot === 'close' || scene.shot === 'extreme'
    cast.forEach((member, who) => {
      const subject = speaker === NARRATOR ? lesson.host : speaker
      const own: CharacterDirection = member.id === subject ? scene : (scene.act?.[member.id] ?? {})
      const acting = own.acting ?? lesson.acting ?? 'auto'
      if (acting === 'none' || own.gesture?.length) return
      const calm = acting === 'calm'
      const scale = (calm ? 0.6 : 1) * (close ? 0.75 : 1)
      const partner = cast.find((c) => c.id !== member.id)
      // The side facing the other character (1 is the character's own left, the viewer's right).
      const near: 1 | -1 = partner ? (xOf(partner.id) > xOf(member.id) ? 1 : -1) : 1
      const gap = calm ? 2.2 : 0.95
      const key = `${who}`
      const free = (t: number) => t - (last.get(key) ?? -10) >= gap && !busy(who, t, 0.5, 0.8) && t >= t0 + 0.15 && t <= t1 - 0.35

      if (member.id === speaker) {
        let beats = 0
        sceneWords.forEach((w, k) => {
          const t = w.startMs / 1000 - GESTURE_LEAD
          const sentenceEnd = sceneWords.slice(k).find((x) => /[.!?]["')\]]?$/.test(x.word))
          const question = sentenceEnd ? /\?["')\]]?$/.test(sentenceEnd.word) : false
          const isLast = w === sentenceEnd
          if (question && isLast && free(t)) {
            add(who, t, 'tilt', jitter(i * 31 + k) > 0.5 ? 1 : -1, scale)
            return
          }
          if (!stressed(w.word) || LIGHT.has(strip(w.word).toLowerCase()) || !free(t)) return
          const roll = jitter(i * 97 + k * 13 + who)
          let kind: Gesture
          if (close) kind = roll < 0.55 ? 'beat' : roll < 0.8 ? 'tilt' : 'nod'
          else if (roll < 0.45) kind = 'beat'
          // Both claws out needs room on both sides, so only a character alone on stage opens up.
          else if (roll < 0.7) kind = partner ? 'offer' : lastKind.get(key) === 'open' ? 'beat' : 'open'
          else if (roll < 0.85) kind = partner ? 'beat' : 'offer'
          else kind = beats % 2 ? 'shift' : 'beat'
          if (kind === 'tilt' && w === sceneWords[0]) kind = 'beat'
          // Beats use the claw away from a neighbour, alternating when alone; offers reach toward them.
          const side: 1 | -1 = kind === 'offer' ? near : partner ? (-near as 1 | -1) : beats % 2 ? -1 : 1
          add(who, t, kind, side, scale * (kind === 'beat' ? 0.8 + 0.3 * jitter(k + i) : 1))
          beats++
        })
        return
      }
      // Listening: a nod at the end of most sentences, a tilt at a question, and a shift of weight
      // now and then on a long line, all a beat after the words that prompt them.
      sceneWords.forEach((w, k) => {
        if (!/[.!?]["')\]]?$/.test(w.word)) return
        const t = w.endMs / 1000 + 0.08
        if (!free(t)) return
        const roll = jitter(i * 53 + k * 7 + who * 3)
        if (/\?/.test(w.word)) add(who, t, 'tilt', near, scale * 0.8)
        else if (roll < 0.6) add(who, t, 'nod', 1, scale * (/!/.test(w.word) ? 1 : 0.7))
        else if (roll < 0.8) add(who, t, 'shift', jitter(k) > 0.5 ? 1 : -1, scale * 0.8)
      })
    })
  })
  return out
}

/**
 * Tones down automatic gestures that make parts pass through each other: each one playing on a
 * clipping frame for a character involved is halved, and dropped once it would be too small to
 * read. Returns how many were changed; hand-written direction is never touched.
 */
export function softenClippingGestures(timeline: AnimationTimeline, clips: { frame: number; who: number; other: number }[]): number {
  let changed = 0
  const hit = new Set<TimelineCue>()
  for (const clip of clips) {
    const t = clip.frame / timeline.fps
    for (const cue of timeline.cues) {
      if (!cue.auto || !cue.gesture) continue
      const who = cue.who ?? 0
      if (who !== clip.who && who !== clip.other) continue
      if (t >= cue.t && t <= cue.t + GESTURE_SECONDS[cue.gesture.kind]) hit.add(cue)
    }
  }
  for (const cue of hit) {
    const amount = (cue.gesture!.amount ?? 1) * 0.5
    if (amount < 0.3) {
      timeline.cues.splice(timeline.cues.indexOf(cue), 1)
    } else cue.gesture!.amount = Math.round(amount * 100) / 100
    changed++
  }
  return changed
}

/** The reel draft `npm run reel:create -- --custom-video` needs to archive and queue the finished file. */
export function reelDraftFrom(lesson: Lesson): Record<string, unknown> {
  const sourceClips = lesson.scenes
    .filter((s) => s.sourceClip)
    .map((s) => ({
      ...(s.sourceClip!.url ? { url: s.sourceClip!.url } : {}),
      attribution: s.sourceClip!.attribution,
      ...(s.sourceClip!.publishedAt ? { publishedAt: s.sourceClip!.publishedAt } : {}),
      start: s.sourceClip!.start,
      duration: s.sourceClip!.duration,
      ...(s.sourceClip!.transcript ? { transcript: s.sourceClip!.transcript } : {}),
    }))
  return {
    title: lesson.title,
    topic: lesson.topic,
    series: lesson.series,
    episode: lesson.episode,
    format:
      lesson.format === 'sketch'
        ? 'animated-sketch'
        : lesson.format === 'reaction'
          ? 'molt-pod-reaction'
          : 'animated-lesson',
    cast: castOf(lesson).map((c) => c.id),
    ...(lesson.loudness !== undefined ? { loudness: lesson.loudness } : {}),
    ...(lesson.queueId ? { queueId: lesson.queueId } : {}),
    ...(sourceClips.length ? { sourceClips } : {}),
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
