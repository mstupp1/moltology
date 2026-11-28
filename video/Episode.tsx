/**
 * A whole long-form episode: every beat in its slot, the voice takes, a quiet music bed,
 * chapter cards and source credits. Built from the timeline create-longform writes.
 */
import React from 'react'
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { TitleCard, ChapterCard, WordReveal, EndCard } from './motion/cards'
import { FamilyTree, FourMoves, MeltDay, MeltVsMolt, MoltCycle, PingWaves, StageLadder, ThreePanels } from './motion/diagrams'
import { ShellSplit, ShellTurntable } from './motion/shell3d'
import { BeatContext, type Timeline, type TimelineBeat } from './timeline'
import { C } from './theme'
import { DeepWater, SourceTag } from './ui/primitives'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MOTION: Record<string, React.FC<any>> = {
  TitleCard,
  ChapterCard,
  WordReveal,
  EndCard,
  FamilyTree,
  FourMoves,
  MeltDay,
  MeltVsMolt,
  MoltCycle,
  PingWaves,
  StageLadder,
  ThreePanels,
  ShellTurntable,
  ShellSplit,
}

/** A painted still with a slow push-in and drift. */
const StillBeat: React.FC<{ src: string; duration: number }> = ({ src, duration }) => {
  const frame = useCurrentFrame()
  const scale = interpolate(frame, [0, duration], [1.02, 1.1], { extrapolateRight: 'clamp' })
  const x = interpolate(frame, [0, duration], [0, -24], { extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ background: C.abyss }}>
      <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', scale: String(scale), translate: `${x}px 0` }} />
    </AbsoluteFill>
  )
}

/** The real app, in a quiet browser frame on deep water. Images drift down slowly; videos play. */
const ScreenBeat: React.FC<{ src: string; duration: number }> = ({ src, duration }) => {
  const frame = useCurrentFrame()
  const isVideo = /\.(mp4|webm|mov)$/i.test(src)
  const scroll = interpolate(frame, [0, duration], [0, -12], { extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill>
      <DeepWater snow={false} />
      <div style={{ position: 'absolute', left: 200, top: 90, width: 1520, height: 900, borderRadius: 24, overflow: 'hidden', border: `1px solid ${C.line}`, background: C.surface1, boxShadow: '0 40px 120px rgba(0,0,0,0.55)' }}>
        <div style={{ height: 44, background: C.surface2, display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 20 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 12, height: 12, borderRadius: 6, background: C.surface3 }} />
          ))}
        </div>
        {isVideo ? (
          <OffthreadVideo src={staticFile(src)} muted style={{ width: '100%' }} />
        ) : (
          <Img src={staticFile(src)} style={{ width: '100%', translate: `0 ${scroll}%` }} />
        )}
      </div>
    </AbsoluteFill>
  )
}

/** Placeholder for a beat whose picture isn't made yet, so a draft still plays end to end. */
const Missing: React.FC<{ beat: TimelineBeat }> = ({ beat }) => (
  <AbsoluteFill>
    <DeepWater />
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', fontFamily: 'Inter', fontSize: 36, color: C.inkMuted }}>
      {beat.kind} beat {beat.index + 1}: not made yet
    </AbsoluteFill>
  </AbsoluteFill>
)

export const BeatView: React.FC<{ beat: TimelineBeat }> = ({ beat }) => {
  let body: React.ReactNode
  if (beat.kind === 'motion') {
    const Component = beat.component ? MOTION[beat.component] : undefined
    body = Component ? <Component {...(beat.props ?? {})} /> : <Missing beat={beat} />
  } else if (beat.kind === 'character' && beat.src) {
    body = <OffthreadVideo src={staticFile(beat.src)} trimBefore={beat.trimBefore ?? 0} muted />
  } else if (beat.kind === 'still' && beat.src) {
    body = <StillBeat src={beat.src} duration={beat.duration} />
  } else if (beat.kind === 'screen' && beat.src) {
    body = <ScreenBeat src={beat.src} duration={beat.duration} />
  } else body = <Missing beat={beat} />
  return (
    <BeatContext.Provider value={{ duration: beat.duration, words: beat.words, line: beat.line }}>
      <AbsoluteFill>{body}</AbsoluteFill>
      {beat.source ? <SourceTag source={beat.source} /> : null}
    </BeatContext.Provider>
  )
}

/** Fades the music down under speech and back up in the gaps. */
function musicVolume(frame: number, t: Timeline, base: number) {
  const speaking = t.voice.some((v) => frame >= v.from - 6 && frame <= v.from + (v.duration ?? 0) + 6)
  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })
  const fadeOut = interpolate(frame, [t.durationInFrames - 60, t.durationInFrames], [1, 0], { extrapolateLeft: 'clamp' })
  return base * (speaking ? 1 : 2.2) * fadeIn * fadeOut
}

export const Episode: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  const { fps } = useVideoConfig()
  return (
    <AbsoluteFill style={{ background: C.abyss }}>
      {timeline.beats.map((beat) => (
        <Sequence key={beat.index} from={beat.from} durationInFrames={beat.duration} name={`${beat.index + 1} ${beat.kind}: ${beat.line.slice(0, 40)}`}>
          <BeatView beat={beat} />
        </Sequence>
      ))}
      {timeline.chapters.map((chapter, i) =>
        i === 0 ? null : (
          <Sequence key={chapter.title} from={chapter.from} durationInFrames={Math.round(2.2 * fps)} name={`Chapter ${i + 1}`}>
            <ChapterCard number={i + 1} title={chapter.title} />
          </Sequence>
        ),
      )}
      {timeline.voice.map((take, i) => (
        <Sequence key={i} from={take.from} durationInFrames={take.duration} name={`Voice ${i + 1}`} layout="none">
          <Audio src={staticFile(take.src)} trimBefore={take.trimBefore} />
        </Sequence>
      ))}
      {timeline.music ? <Audio src={staticFile(timeline.music.src)} loop volume={(f) => musicVolume(f, timeline, timeline.music!.volume)} /> : null}
    </AbsoluteFill>
  )
}
