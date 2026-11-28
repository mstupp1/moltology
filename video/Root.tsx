/**
 * Compositions:
 * - Episode: a voiced long-form video, from the timeline.json in the render's public folder
 *   (scripts/create-longform.ts renders it; pass --props to preview another).
 * - Draft: the same episode before anything is voiced, with word timings estimated from the
 *   script, so the motion graphics can be previewed in Studio (`npm run video:studio`).
 */
import React, { useEffect, useState } from 'react'
import { Composition, continueRender, delayRender, staticFile } from 'remotion'
import { Episode } from './Episode'
import { Thumbnail, type ThumbnailProps } from './Thumbnail'
import { Scene, type SceneSpec } from './scene/Scene'
import { BeatContext } from './timeline'
import { estimateWords } from './draft'
import { loadBrandFonts } from './theme'
import { draftTimeline, type EpisodeFile } from './draft'
import type { Timeline } from './timeline'
import whatIsMoltology from '../content/academy/videos/what-is-moltology/episode.json'

const FPS = 30

const WithFonts: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = useState(() => delayRender('Loading brand fonts'))
  useEffect(() => {
    loadBrandFonts().then(() => continueRender(handle))
  }, [handle])
  return <>{children}</>
}

const EpisodeComp: React.FC<{ timeline: Timeline }> = ({ timeline }) => (
  <WithFonts>
    <Episode timeline={timeline} />
  </WithFonts>
)

const ThumbnailComp: React.FC<ThumbnailProps> = (props) => (
  <WithFonts>
    <Thumbnail {...props} />
  </WithFonts>
)

/** One scene on its own, for style frames: the line's words are estimated, so type lands roughly on cue. */
type SceneStillProps = { spec: SceneSpec; line: string; seconds: number } & Record<string, unknown>
const SceneStill: React.FC<SceneStillProps> = ({ spec, line, seconds }) => (
  <WithFonts>
    <BeatContext.Provider value={{ duration: Math.round(seconds * FPS), line, words: estimateWords(line).map((w) => ({ text: w.text, at: Math.round((w.seconds + 0.3) * FPS) })) }}>
      <Scene spec={spec} />
    </BeatContext.Provider>
  </WithFonts>
)

const draft = draftTimeline(whatIsMoltology as EpisodeFile, FPS)

export const Root: React.FC = () => (
  <>
    <Composition
      id="Episode"
      component={EpisodeComp}
      fps={FPS}
      width={1920}
      height={1080}
      durationInFrames={draft.durationInFrames}
      defaultProps={{ timeline: draft }}
      calculateMetadata={async ({ props }) => {
        let timeline = props.timeline
        if (timeline === draft) {
          const res = await fetch(staticFile('timeline.json')).catch(() => null)
          if (res?.ok) timeline = (await res.json()) as Timeline
        }
        return { durationInFrames: timeline.durationInFrames, fps: timeline.fps, props: { timeline } }
      }}
    />
    <Composition id="Thumbnail" component={ThumbnailComp} fps={FPS} width={1280} height={720} durationInFrames={1} defaultProps={{ text: 'Why crabs?' } as ThumbnailProps} />
    <Composition
      id="SceneStill"
      component={SceneStill}
      fps={FPS}
      width={1920}
      height={1080}
      durationInFrames={240}
      defaultProps={{ spec: { layers: [] }, line: '', seconds: 8 } as SceneStillProps}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
    />
    <Composition id="Draft" component={EpisodeComp} fps={FPS} width={1920} height={1080} durationInFrames={draft.durationInFrames} defaultProps={{ timeline: draft }} />
  </>
)
