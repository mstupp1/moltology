/**
 * The timeline scripts/create-longform.ts builds from an episode.json once every line is voiced:
 * where each beat starts, how long it runs, its words with timings, and the files it shows.
 * Paths are relative to the render's public folder (tmp/longform/<id>/public/).
 */
import { createContext, useContext } from 'react'

export type BeatKind = 'character' | 'motion' | 'still' | 'screen'

export interface TimedWord {
  text: string
  /** Frame the word starts on, counted from the start of its beat. */
  at: number
}

export interface Source {
  id: string
  label: string
  url: string
  supports?: string
}

export interface TimelineBeat {
  index: number
  chapter: number
  kind: BeatKind
  speaker: string
  line: string
  from: number
  duration: number
  words: TimedWord[]
  /** character: the cast clip; still: the image; screen: an image or video of the app. */
  src?: string
  /** character: the frame inside the clip where this beat starts. */
  trimBefore?: number
  /** motion: the component name and its props. */
  component?: string
  props?: Record<string, unknown>
  /** A source shown as a small lower third while this beat plays. */
  source?: Source
}

export interface TimelineAudio {
  src: string
  from: number
  /** Frames to skip at the start of the file. */
  trimBefore?: number
  duration?: number
}

export interface Timeline {
  id: string
  title: string
  fps: number
  width: number
  height: number
  durationInFrames: number
  chapters: { title: string; from: number }[]
  beats: TimelineBeat[]
  voice: TimelineAudio[]
  music?: { src: string; volume: number }
  sources: Source[]
}

/** What a beat's component knows about itself: its length and when each word is said. */
export interface BeatInfo {
  duration: number
  words: TimedWord[]
  line: string
}

export const BeatContext = createContext<BeatInfo>({ duration: 90, words: [], line: '' })

export const useBeat = () => useContext(BeatContext)

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * The frame (from the beat's start) where a word is said, so a graphic lands on its word.
 * `match` is the word or the start of it ("porcelain", "harden"); `nth` picks a repeat.
 * When the word isn't in the line (or the beat is silent) it falls back to a share of the beat.
 */
export function cueAt(beat: BeatInfo, match: string, fallback = 0, nth = 0): number {
  const want = clean(match)
  const hits = beat.words.filter((w) => clean(w.text).startsWith(want))
  const hit = hits[nth] ?? hits[0]
  return hit ? hit.at : Math.round(beat.duration * fallback)
}
