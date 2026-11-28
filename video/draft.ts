/**
 * The episode file format and the layout that turns voiced (or estimated) beats into a
 * timeline. Shared by Studio (the Draft composition) and scripts/create-longform.ts, so a
 * preview and a render place every beat the same way.
 */
import type { BeatKind, Source, Timeline, TimelineBeat, TimedWord } from './timeline'

export interface EpisodeVisual {
  kind: BeatKind
  /** character */
  set?: string
  cast?: string[]
  shot?: string
  move?: string
  focus?: string
  pose?: string
  look?: string
  acting?: string
  react?: { kind: string; word?: number; side?: number }[]
  note?: string
  headline?: boolean
  /** motion */
  component?: string
  props?: Record<string, unknown>
  /** still */
  image?: string
  prompt?: string
  /** screen */
  capture?: string
  /** scene: a name from the episode's `art` map, and the type on top */
  art?: string
  type?: import('./scene/type').TypeSpec
  camera?: import('./scene/Scene').CameraMove
}

export interface EpisodeBeat {
  speaker: string
  line: string
  visual: EpisodeVisual
}

export interface EpisodeFile {
  id: string
  title: string
  format: 'long-form'
  loudness?: number
  narrator: string
  cast: string[]
  sources?: Source[]
  chapters: { title: string; beats: EpisodeBeat[] }[]
  /** Layered scenes: each a set of Codex images (in media/art/) with depths, a camera and a focus. */
  art?: Record<string, Omit<import('./scene/Scene').SceneSpec, 'type'>>
}

/** One stretch of sound: a narration take, or a character block voiced as one take. */
export interface LayoutUnit {
  speaker: string
  chapter: number
  /** False for a rendered clip that already ends on its own tail. */
  tail?: boolean
  audio?: { src: string; seconds: number }
  beats: { index: number; seconds: number; words: { text: string; seconds: number }[]; src?: string; trimSeconds?: number }[]
}

export const GAP = { sameSpeaker: 0.3, newSpeaker: 0.5, chapter: 2.2, tail: 0.6, endHold: 20 }

/** Words of a line with timings estimated at a steady pace (no voice yet). */
export function estimateWords(line: string, wordsPerSecond = 2.7) {
  return line.split(/\s+/).filter(Boolean).map((text, i) => ({ text, seconds: i / wordsPerSecond }))
}

function flatBeats(ep: EpisodeFile) {
  return ep.chapters.flatMap((c, chapter) => c.beats.map((beat) => ({ beat, chapter })))
}

/** Places units one after another, a chapter card between chapters and a held end card. */
export function layoutTimeline(ep: EpisodeFile, units: LayoutUnit[], fps: number, files: { music?: string; publicFor?: (i: number) => string | undefined } = {}): Timeline {
  const all = flatBeats(ep)
  const f = (s: number) => Math.round(s * fps)
  const sourceById = new Map((ep.sources ?? []).map((s) => [s.id, s]))
  const beats: TimelineBeat[] = []
  const voice: Timeline['voice'] = []
  const chapters: Timeline['chapters'] = []
  let t = 0
  let prev: LayoutUnit | undefined
  for (const unit of units) {
    if (!prev || unit.chapter !== prev.chapter) {
      if (prev) t += f(GAP.newSpeaker)
      if (unit.chapter > 0) t += f(GAP.chapter)
      chapters.push({ title: ep.chapters[unit.chapter].title, from: unit.chapter > 0 ? t - f(GAP.chapter) : 0 })
    } else t += f(unit.speaker === prev.speaker ? GAP.sameSpeaker : GAP.newSpeaker)
    const start = t
    if (unit.audio) voice.push({ src: unit.audio.src, from: start, duration: f(unit.audio.seconds) })
    let at = start
    unit.beats.forEach((b, j) => {
      const { beat, chapter } = all[b.index]
      const last = j === unit.beats.length - 1
      const isEnd = last && b.index === all.length - 1
      const seconds = b.seconds + (last && unit.tail !== false ? GAP.tail : 0) + (isEnd ? GAP.endHold : 0)
      const words: TimedWord[] = b.words.map((w) => ({ text: w.text, at: f(w.seconds) }))
      const props = beat.visual.props ?? {}
      const typeSource = (beat.visual.type as { source?: string } | undefined)?.source
      const sourceId = typeof props.source === 'string' ? props.source : typeSource
      beats.push({
        index: b.index,
        chapter,
        kind: beat.visual.kind,
        speaker: beat.speaker,
        line: beat.line,
        from: at,
        duration: Math.max(1, f(seconds)),
        words,
        src: b.src ?? files.publicFor?.(b.index),
        trimBefore: b.trimSeconds !== undefined ? f(b.trimSeconds) : undefined,
        component: beat.visual.component,
        scene: beat.visual.kind === 'scene' && beat.visual.art && ep.art?.[beat.visual.art] ? { ...ep.art[beat.visual.art], ...(beat.visual.camera ? { camera: beat.visual.camera } : {}), type: beat.visual.type } : undefined,
        props,
        source: sourceId ? sourceById.get(sourceId) : undefined,
      })
      at += f(seconds)
    })
    t = at
    prev = unit
  }
  // Fill the small gaps between units by stretching each beat to the next one's start.
  beats.forEach((b, i) => {
    const next = beats[i + 1]
    if (next && next.from > b.from + b.duration) b.duration = next.from - b.from
  })
  // A chapter card covers the gap before a chapter, so the beat before it ends where the card starts.
  for (const c of chapters.slice(1)) {
    const before = beats.filter((b) => b.from < c.from).at(-1)
    if (before) before.duration = c.from - before.from
  }
  return {
    id: ep.id,
    title: ep.title,
    fps,
    width: 1920,
    height: 1080,
    durationInFrames: t,
    chapters,
    beats,
    voice,
    music: files.music ? { src: files.music, volume: 0.06 } : undefined,
    sources: ep.sources ?? [],
  }
}

/** The whole episode with estimated timings and no voice: for previewing in Studio. */
export function draftTimeline(ep: EpisodeFile, fps: number): Timeline {
  const units: LayoutUnit[] = flatBeats(ep).map(({ beat, chapter }, index) => {
    const words = estimateWords(beat.line)
    const seconds = Math.max(2.5, (words.at(-1)?.seconds ?? 0) + 0.6)
    return { speaker: beat.speaker, chapter, beats: [{ index, seconds, words }] }
  })
  return layoutTimeline(ep, units, fps)
}
