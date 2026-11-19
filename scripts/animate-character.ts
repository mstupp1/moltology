#!/usr/bin/env tsx
/**
 * Animated lessons with the site's 3D characters: voice, render, compose.
 *
 *   npm run anim:create -- --lesson tmp/anim-next/lesson.json
 *   npm run anim:create -- --lesson content/animation/examples/daily-shedding-routine.json --silent --scale 0.5
 *
 * Writes everything under tmp/anim-<lesson id>/ (or --out-dir): voice.mp3 + words.json,
 * timeline.json, frames/, scene clips, preview stills, final.mp4 and draft.json. Queue the
 * inspected final.mp4 with `npm run reel:create -- --content-json <out>/draft.json --custom-video <out>/final.mp4`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { buildTimeline, castLook, castOf, lessonProblems, reelDraftFrom, type Lesson } from './lib/character-animation/lesson'
import { voiceLesson } from './lib/character-animation/voices'
import { renderFrames } from './lib/character-animation/render'
import { defaultBackdrop, headlineOverlays, normaliseBackdrop, renderHeadlineCards, renderOutroText, renderSceneClip } from './lib/character-animation/compose'
import { tokenizeScriptText } from './lib/tts-engine'
import { setArtFiles, textureUrls } from './lib/character-animation/set-art'
import { SHOTS } from '../src/lib/avatar3d/scripted'

/** Same narrator as the reels (scripts/create-reel.ts REEL_NARRATOR_VOICE). */
const NARRATOR = 'BOOK RECORD REGULAR'
const FPS = 30
const OUTRO_SECONDS = 2.5

interface Args {
  lesson: string
  outDir?: string
  silent: boolean
  voice?: string
  scale: number
  framesOnly: boolean
  reuseFrames: boolean
  force: boolean
  maxSeconds?: number
  art: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { lesson: '', silent: false, scale: 1, framesOnly: false, reuseFrames: false, force: false, art: true }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--lesson') args.lesson = argv[++i]
    else if (a === '--out-dir') args.outDir = argv[++i]
    else if (a === '--silent') args.silent = true
    else if (a === '--voice') args.voice = argv[++i]
    else if (a === '--scale') args.scale = Number(argv[++i])
    else if (a === '--frames-only') args.framesOnly = true
    else if (a === '--reuse-frames') args.reuseFrames = true
    else if (a === '--force') args.force = true
    else if (a === '--max-seconds') args.maxSeconds = Number(argv[++i])
    else if (a === '--no-art') args.art = false
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: npm run anim:create -- --lesson <lesson.json> [options]

  --silent          No voice: estimated word timings, silent audio (cloud tests, layout checks)
  --voice <name>    Narrator's Fish voice (default ${NARRATOR}, same as reels); characters use their cast voice
  --scale <0..1>    Render the 3D at a fraction of 1080x1920 (0.5 for quick tests)
  --max-seconds <n> Only render the first n seconds (motion tests)
  --frames-only     Stop after rendering frames
  --reuse-frames    Skip the 3D render and reuse frames/ from the last run
  --out-dir <dir>   Default tmp/anim-<lesson id>
  --no-art          Ignore the set's painted art kit (plain colours, drawn backdrop)
  --force           Render even if the lesson check finds problems`)
      process.exit(0)
    }
  }
  if (!args.lesson) throw new Error('Pass --lesson <lesson.json>')
  if (!(args.scale > 0 && args.scale <= 1)) throw new Error('--scale must be between 0 and 1')
  return args
}

const even = (n: number) => Math.round(n / 2) * 2

/** Stills of the finished file at the moments the reel rules ask to check. */
function previewStills(video: string, outDir: string, moments: Record<string, number>) {
  fs.mkdirSync(outDir, { recursive: true })
  for (const [name, t] of Object.entries(moments)) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', Math.max(0, t).toFixed(3), '-i', video, '-frames:v', '1', '-q:v', '3', path.join(outDir, `${name}.jpg`)])
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const lessonPath = path.resolve(args.lesson)
  const lesson: Lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf8'))
  const problems = lessonProblems(lesson)
  if (problems.length) {
    console.log(`⚠️  Lesson check:\n${problems.map((p) => `   • ${p}`).join('\n')}`)
    if (!args.force) throw new Error('Fix the lesson (or pass --force for a test render)')
  }
  const outDir = path.resolve(args.outDir ?? path.join('tmp', `anim-${lesson.id}`))
  fs.mkdirSync(outDir, { recursive: true })
  const rel = (p: string) => path.resolve(path.dirname(lessonPath), p)

  const looks = Object.fromEntries(castOf(lesson).map((c) => [c.id, castLook(c.id)]))
  const look = looks[lesson.host]
  const narratorVoice = args.voice || (process.env.FISH_VOICE_REFERENCE_ID ? '' : NARRATOR)
  const { audio, words, talkBy } = await voiceLesson(lesson, outDir, { silent: args.silent, fps: FPS, narratorVoice })
  const width = even(1080 * args.scale)
  const height = even(1920 * args.scale)
  const { timeline, windows, hookEnd } = buildTimeline(lesson, looks, words, talkBy, { width, height, fps: FPS, tail: 0.8, hookLift: 0.9 })
  if (args.maxSeconds) timeline.frames = Math.min(timeline.frames, Math.ceil(args.maxSeconds * FPS))
  // The set's painted art kit (content/animation/sets/), if it has one: textures go to the 3D set,
  // the plate becomes the default backdrop.
  const art = args.art ? await setArtFiles(lesson.set) : {}
  if (Object.keys(art).length) console.log(`🎨 Set art: ${Object.keys(art).join(', ')}`)
  timeline.setArt = textureUrls(art)
  fs.writeFileSync(path.join(outDir, 'timeline.json'), JSON.stringify({ ...timeline, talk: undefined, talkBy: undefined, setArt: Object.keys(timeline.setArt), windows, hookEnd }, null, 2))
  const setBackdrop = () =>
    lesson.backdrop
      ? normaliseBackdrop(rel(lesson.backdrop), path.join(outDir, 'backdrop.png'))
      : art.plate
        ? normaliseBackdrop(art.plate, path.join(outDir, 'backdrop.png'))
        : defaultBackdrop(path.join(outDir, 'backdrop.png'), lesson.set)

  const framesDir = path.join(outDir, 'frames')
  if (!args.reuseFrames) {
    fs.rmSync(framesDir, { recursive: true, force: true })
    console.log(`🦀 Rendering ${timeline.frames} frames at ${width}x${height} (${(timeline.frames / FPS).toFixed(1)}s)...`)
    const done = await renderFrames(timeline, {
      outDir: framesDir,
      onProgress: (n, total, ms) => console.log(`   ${n}/${total} frames · ${ms.toFixed(0)} ms/frame`),
    })
    console.log(`   done in ${done.seconds.toFixed(0)}s`)
  }
  if (args.framesOnly) return

  // Outro: the host waves goodbye under the website invitation, rendered the same way.
  const outroLines = ['Read the full passage at', 'moltology.org']
  let outroVideo: string | undefined
  const outroImage = lesson.outro ? rel(lesson.outro) : undefined
  if (!outroImage && !args.maxSeconds) {
    const outroFrames = Math.ceil(OUTRO_SECONDS * FPS)
    const outroTimeline = {
      ...timeline,
      frames: outroFrames,
      look: { ...look, pose: 'wave' as const },
      talk: [],
      talkBy: undefined,
      cast: undefined,
      cues: [{ t: 0, camera: { ...SHOTS.wide, pan: 0, lift: 0.75, cut: true }, look: { x: 0, y: 0 } }, { t: 0.9, react: { kind: 'snap' as const, side: -1 as const } }],
    }
    const outroDir = path.join(outDir, 'outro-frames')
    if (!args.reuseFrames || !fs.existsSync(outroDir)) {
      fs.rmSync(outroDir, { recursive: true, force: true })
      console.log('👋 Rendering outro...')
      await renderFrames(outroTimeline, { outDir: outroDir })
    }
    const backdrop = await setBackdrop()
    outroVideo = await renderSceneClip({
      framesDir: outroDir,
      fps: FPS,
      start: 0,
      count: outroFrames,
      backdrop,
      outPath: path.join(outDir, 'outro.mp4'),
      overlays: [{ png: renderOutroText(outroLines, path.join(outDir, 'outro-text.png')), from: 0, to: OUTRO_SECONDS }],
    })
  }

  // Scenes: backdrop, character, and the hook headline over the opening.
  console.log('🎞️  Building scene clips...')
  const defaultSet = await setBackdrop()
  const hookCount = tokenizeScriptText(lesson.hookHeadline).length
  const cards = renderHeadlineCards(lesson.hookHeadline, path.join(outDir, 'headline'))
  const clips: string[] = []
  const durations: number[] = []
  for (let i = 0; i < lesson.scenes.length; i++) {
    const w = windows[i]
    const first = Math.round(w.start * FPS)
    const last = Math.min(timeline.frames, Math.round(w.end * FPS))
    if (last <= first) break
    const scene = lesson.scenes[i]
    const backdrop = scene.backdrop ? await normaliseBackdrop(rel(scene.backdrop), path.join(outDir, `backdrop-${i + 1}.png`)) : defaultSet
    clips.push(
      await renderSceneClip({
        framesDir,
        fps: FPS,
        start: first,
        count: last - first,
        backdrop,
        outPath: path.join(outDir, `scene-${i + 1}.mp4`),
        overlays: i === 0 ? headlineOverlays(cards, words.slice(0, hookCount), hookEnd) : [],
      })
    )
    durations.push((last - first) / FPS)
  }

  const final = path.join(outDir, 'final.mp4')
  const { compositeReel } = await import('./lib/reel-compositor')
  // Regular subtitles start at the first body word: the hook is the big headline only.
  const result = await compositeReel({
    videoClips: clips,
    clipDurations: durations,
    voiceoverPath: audio,
    words: words.slice(hookCount),
    outputPath: final,
    colorGrading: 'none',
    ctaDurationSeconds: OUTRO_SECONDS,
    customOutroVideoPath: outroVideo,
    customOutroImagePath: outroImage,
    tempDir: path.join(outDir, 'composite'),
  })
  const firstBody = words[hookCount]?.startMs ?? 0
  previewStills(final, path.join(outDir, 'checks'), {
    'frame-zero': 0,
    'mid-hook': hookEnd / 2,
    'last-hook-word': Math.max(0, hookEnd - 0.1),
    'first-body-phrase': firstBody / 1000 + 0.2,
    later: result.durationSeconds * 0.6,
    outro: result.durationSeconds - 1,
  })
  fs.writeFileSync(path.join(outDir, 'draft.json'), JSON.stringify(reelDraftFrom(lesson), null, 2))
  console.log(`\n✅ ${final} (${result.durationSeconds.toFixed(1)}s)\n   checks: ${path.join(outDir, 'checks')}\n   draft:  ${path.join(outDir, 'draft.json')}`)
}

main().catch((err) => {
  console.error(`❌ ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
