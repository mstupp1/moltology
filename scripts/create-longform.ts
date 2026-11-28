#!/usr/bin/env tsx
/**
 * Long-form Academy videos: voice an episode.json, render its cast scenes at 16:9 with
 * anim:create, lay every beat on one timeline and render the whole thing with Remotion.
 *
 *   npm run longform:create -- --episode content/academy/videos/what-is-moltology/episode.json
 *   npm run longform:create -- --episode <file> --chapters 1 --scale 0.5     # quick sample
 *   npm run longform:create -- --episode <file> --silent --no-render         # plan only
 *
 * Writes tmp/longform/<id>/: voice/ takes, blocks/ cast clips, public/ (everything the render
 * reads, plus timeline.json), final.mp4, captions.srt, chapters.txt and checks/ stills.
 * See .agents/skills/long-form-video-creator/SKILL.md.
 */
import 'dotenv/config'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { layoutTimeline, type EpisodeBeat, type EpisodeFile, type LayoutUnit, estimateWords } from '../video/draft'
import type { Timeline } from '../video/timeline'
import { GEAR_SURFACES, TEXTURE_MARKINGS, TEXTURE_PREFIX, TEXTURE_VERSION } from '../src/lib/avatar3d/textures'
import { S3_BASE_URL } from '../src/lib/assets'
import { SET_NAMES } from '../src/lib/avatar3d/sets'
import { SHOTS } from '../src/lib/avatar3d/scripted'
import { loadCast } from './lib/character-animation/lesson'
import { FISH_VOICE_CATALOG } from './lib/tts-providers/fish-audio'

/** A voice's Fish model id, so caches change when a name is pointed at another voice. */
const voiceId = (name: string) => FISH_VOICE_CATALOG[name as keyof typeof FISH_VOICE_CATALOG] ?? name

const FPS = 30
const NARRATOR_VOICE = 'Oracle'
/** Long-form is unhurried: no speed-up on any take (shorts use +12%). */
const RATE = '+0%'
const MOTION = ['TitleCard', 'ChapterCard', 'WordReveal', 'EndCard', 'FamilyTree', 'FourMoves', 'MeltDay', 'MeltVsMolt', 'MoltCycle', 'PingWaves', 'StageLadder', 'ThreePanels', 'ShellTurntable', 'ShellSplit']

interface Args {
  episode: string
  outDir?: string
  silent: boolean
  scale: number
  chapters?: number[]
  render: boolean
  voice: string
  draft: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { episode: '', silent: false, scale: 1, render: true, voice: NARRATOR_VOICE, draft: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--episode') args.episode = argv[++i]
    else if (a === '--out-dir') args.outDir = argv[++i]
    else if (a === '--silent') args.silent = true
    else if (a === '--scale') args.scale = Number(argv[++i])
    else if (a === '--chapters') args.chapters = argv[++i].split(',').map(Number)
    else if (a === '--no-render') args.render = false
    else if (a === '--voice') args.voice = argv[++i]
    else if (a === '--draft') args.draft = true
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: npm run longform:create -- --episode <episode.json> [options]

  --chapters 1,2    Only these chapters (1-based): a quick sample
  --scale <0..1>    Render the cast at a fraction of 1920x1080 (0.5 for drafts)
  --draft           Remotion renders at half size, faster (checks the edit, not the finish)
  --silent          No voice: estimated timings (layout checks, no Fish cost)
  --no-render       Voice, cast clips and timeline only; preview with npm run video:studio
  --voice <name>    Narrator's Fish voice (default ${NARRATOR_VOICE})
  --out-dir <dir>   Default tmp/longform/<episode id>`)
      process.exit(0)
    }
  }
  if (!args.episode) throw new Error('Pass --episode <episode.json>')
  return args
}

const hash = (v: unknown) => crypto.createHash('sha1').update(JSON.stringify(v)).digest('hex').slice(0, 12)

function audioSeconds(file: string): number {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim())
}

/** Problems that would make a broken render. Empty means it can be made. */
export function episodeProblems(ep: EpisodeFile, castIds: string[]): string[] {
  const problems: string[] = []
  if (!ep.id || !ep.title || !Array.isArray(ep.chapters) || !ep.chapters.length) problems.push('needs id, title and chapters')
  const sourceIds = new Set((ep.sources ?? []).map((s) => s.id))
  ep.chapters?.forEach((chapter, c) => {
    chapter.beats.forEach((beat, b) => {
      const at = `chapter ${c + 1} beat ${b + 1}`
      if (!beat.line?.trim()) problems.push(`${at} has no line`)
      const speaker = beat.speaker
      if (speaker !== 'narrator' && !castIds.includes(speaker)) problems.push(`${at}: speaker "${speaker}" is not the narrator or in the cast`)
      const v = beat.visual
      if (!['character', 'motion', 'still', 'screen', 'scene'].includes(v?.kind)) problems.push(`${at}: visual kind must be character, motion, still, screen or scene`)
      if (v.kind === 'scene' && (!v.art || !ep.art?.[v.art])) problems.push(`${at}: scene art "${v.art}" is not in the episode's art map`)
      if (v.kind === 'scene' && !v.type) problems.push(`${at}: a scene needs its type`)
      const typeSource = (v.type as { source?: string } | undefined)?.source
      if (typeSource && !sourceIds.has(typeSource)) problems.push(`${at}: source "${typeSource}" is not in sources`)
      if (v.kind === 'character') {
        if (!v.set || !SET_NAMES.includes(v.set as (typeof SET_NAMES)[number])) problems.push(`${at}: set "${v.set}" is not one of ${SET_NAMES.join(', ')}`)
        if (!v.cast?.length) problems.push(`${at}: a character beat lists its cast`)
        if (speaker !== 'narrator' && !v.cast?.includes(speaker)) problems.push(`${at}: ${speaker} speaks but is not in this beat's cast`)
        if (v.shot && !(v.shot in SHOTS)) problems.push(`${at}: shot "${v.shot}" is not one of ${Object.keys(SHOTS).join(', ')}`)
      }
      if (v.kind === 'motion' && !MOTION.includes(v.component ?? '')) problems.push(`${at}: motion component "${v.component}" is not one of ${MOTION.join(', ')}`)
      if (v.kind === 'still' && !v.image) problems.push(`${at}: a still names its image`)
      if (v.kind === 'screen' && !v.capture) problems.push(`${at}: a screen names its capture`)
      const src = v.props?.source
      if (typeof src === 'string' && !sourceIds.has(src)) problems.push(`${at}: source "${src}" is not in sources`)
    })
  })
  return problems
}

/** Character beats in a row, on the same set with the same cast, render as one clip. */
function sameStage(a: EpisodeBeat, b: EpisodeBeat) {
  return a.visual.kind === 'character' && b.visual.kind === 'character' && a.visual.set === b.visual.set && [...(a.visual.cast ?? [])].sort().join() === [...(b.visual.cast ?? [])].sort().join()
}

const MARKS: Record<number, string[]> = { 1: ['center'], 2: ['left', 'right'], 3: ['left', 'center', 'right'] }

function blockLesson(ep: EpisodeFile, n: number, beats: EpisodeBeat[], backdrop?: string) {
  const cast = beats[0].visual.cast!
  const speakers = beats.map((b) => b.speaker).filter((s) => s !== 'narrator')
  const host = speakers[0] ?? cast[0]
  return {
    id: `${ep.id}-block-${n}`,
    title: ep.title,
    format: 'clip',
    aspect: '16:9',
    host,
    cast: cast.map((id, i) => ({ id, at: MARKS[cast.length]?.[i] ?? 'center' })),
    set: beats[0].visual.set,
    tail: 1.0,
    turnGap: 0.45,
    ...(backdrop ? { backdrop } : {}),
    scenes: beats.map((b) => {
      const v = b.visual
      const speaker = b.speaker === 'narrator' ? 'narrator' : b.speaker
      const direction = { pose: v.pose, look: v.look, acting: v.acting, react: v.react }
      return {
        speaker,
        line: b.line,
        shot: v.shot ?? 'medium',
        ...(v.move ? { move: v.move } : {}),
        ...(v.focus ? { focus: v.focus } : {}),
        ...Object.fromEntries(Object.entries(direction).filter(([, x]) => x !== undefined)),
        description: v.note ?? b.line,
      }
    }),
  }
}

async function copyTextures(dir: string) {
  fs.mkdirSync(dir, { recursive: true })
  const names = ['shell-detail', ...TEXTURE_MARKINGS.map((m) => `marking-${m}`), ...GEAR_SURFACES.map((g) => `gear-${g}`), 'gear-engraving']
  for (const name of names) {
    const out = path.join(dir, `${name}.webp`)
    if (fs.existsSync(out)) continue
    const local = path.resolve(`tmp/avatar-textures/out/v${TEXTURE_VERSION}/${name}.webp`)
    if (fs.existsSync(local)) fs.copyFileSync(local, out)
    else {
      const res = await fetch(`${S3_BASE_URL}/${TEXTURE_PREFIX}/${name}.webp`).catch(() => null)
      if (res?.ok) fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()))
    }
  }
}

/** Captions for YouTube and the Academy player: short cues that follow the voice. */
export function buildSrt(t: Timeline): string {
  const cues: { from: number; to: number; text: string }[] = []
  for (const beat of t.beats) {
    if (!beat.words.length) continue
    let cue: { from: number; to: number; text: string } | null = null
    beat.words.forEach((w, i) => {
      const at = beat.from + w.at
      const next = beat.words[i + 1]
      const end = next ? beat.from + next.at : beat.from + beat.duration
      if (!cue || cue.text.length + w.text.length > 64 || at - cue.from > 4.5 * t.fps) {
        if (cue) cues.push(cue)
        cue = { from: at, to: end, text: w.text }
      } else {
        cue.text += ` ${w.text}`
        cue.to = end
      }
      if (/[.!?]$/.test(w.text) && cue) {
        cues.push(cue)
        cue = null
      }
    })
    if (cue) cues.push(cue)
  }
  const ts = (f: number) => {
    const ms = Math.round((f / t.fps) * 1000)
    const h = Math.floor(ms / 3600000)
    const m = Math.floor(ms / 60000) % 60
    const s = Math.floor(ms / 1000) % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`
  }
  return cues.map((c, i) => `${i + 1}\n${ts(c.from)} --> ${ts(Math.min(c.to, c.from + 6 * t.fps))}\n${c.text}\n`).join('\n')
}

export function buildChapters(t: Timeline): string {
  const ts = (f: number) => {
    const s = Math.floor(f / t.fps)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }
  return t.chapters.map((c) => `${ts(c.from)} ${c.title}`).join('\n') + '\n'
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const episodePath = path.resolve(args.episode)
  const episodeDir = path.dirname(episodePath)
  const full: EpisodeFile = JSON.parse(fs.readFileSync(episodePath, 'utf8'))
  const cast = loadCast()
  const resolve = (id: string) => (cast[id] ? id : Object.keys(cast).find((k) => k.split('_')[1] === id || (cast[k].aliases ?? []).includes(id)) ?? id)
  const ep: EpisodeFile = {
    ...full,
    chapters: full.chapters
      .map((c, i) => ({ ...c, n: i }))
      .filter((c) => !args.chapters || args.chapters.includes(c.n + 1))
      .map(({ n: _n, ...c }) => ({
        ...c,
        beats: c.beats.map((b) => ({
          ...b,
          speaker: b.speaker === 'narrator' ? 'narrator' : resolve(b.speaker),
          visual: { ...b.visual, cast: b.visual.cast?.map(resolve), focus: b.visual.focus ? resolve(b.visual.focus) : undefined },
        })),
      })),
  }
  const problems = episodeProblems(ep, Object.keys(cast))
  if (problems.length) {
    console.log(`⚠️  Episode check:\n${problems.map((p) => `   • ${p}`).join('\n')}`)
    throw new Error('Fix the episode file')
  }
  const outDir = path.resolve(args.outDir ?? path.join('tmp', 'longform', ep.id + (args.chapters ? `-ch${args.chapters.join('-')}` : '')))
  const pub = path.join(outDir, 'public')
  const voiceDir = path.resolve('tmp', 'longform', ep.id, 'voice') // shared by samples and the full run
  for (const d of [pub, voiceDir, path.join(pub, 'voice'), path.join(pub, 'clips'), path.join(pub, 'stills'), path.join(pub, 'screens'), path.join(pub, 'fonts'), path.join(pub, 'plates')]) fs.mkdirSync(d, { recursive: true })
  for (const font of ['inter-latin.woff2', 'space-grotesk-latin.woff2']) fs.copyFileSync(path.resolve('public/fonts', font), path.join(pub, 'fonts', font))
  fs.copyFileSync(path.resolve('assets/audio/benthic-ambient-loop.mp3'), path.join(pub, 'music.mp3'))
  await copyTextures(path.join(pub, 'avatar-textures'))
  const media = (p: string) => path.join(episodeDir, 'media', p)

  const flat = ep.chapters.flatMap((c, chapter) => c.beats.map((beat) => ({ beat, chapter })))
  const units: LayoutUnit[] = []
  let block = 0
  for (let i = 0; i < flat.length; ) {
    const { beat, chapter } = flat[i]
    if (beat.visual.kind === 'character') {
      // The whole run of beats on this stage, in this chapter, becomes one clip.
      let j = i + 1
      while (j < flat.length && flat[j].chapter === chapter && sameStage(beat, flat[j].beat)) j++
      const beats = flat.slice(i, j).map((x) => x.beat)
      block++
      // A set's 16:9 plate: this episode's own, or one painted for an earlier episode.
      const plate = [media(`plates/${beat.visual.set}.png`), ...fs.readdirSync(path.dirname(episodeDir)).map((d) => path.join(path.dirname(episodeDir), d, 'media', 'plates', `${beat.visual.set}.png`))].find((f) => fs.existsSync(f)) ?? media(`plates/${beat.visual.set}.png`)
      const lesson = blockLesson(ep, block, beats, fs.existsSync(plate) ? plate : undefined)
      const blockDir = path.join(outDir, 'blocks', `b${block}`)
      fs.mkdirSync(blockDir, { recursive: true })
      const lessonFile = path.join(blockDir, 'lesson.json')
      const key = hash([lesson, args.scale, args.silent, voiceId(args.voice), RATE])
      const done = path.join(blockDir, `done-${key}`)
      fs.writeFileSync(lessonFile, JSON.stringify(lesson, null, 2))
      if (!fs.existsSync(done)) {
        console.log(`🦀 Cast clip ${block}: ${beats.length} beats on ${beat.visual.set}`)
        execFileSync('npx', ['tsx', 'scripts/animate-character.ts', '--lesson', lessonFile, '--out-dir', blockDir, '--scale', String(args.scale), '--voice', args.voice, '--rate', RATE, '--allow-clipping', ...(args.silent ? ['--silent'] : [])], { stdio: 'inherit' })
        fs.writeFileSync(done, '')
      } else console.log(`🦀 Cast clip ${block}: reused`)
      const clip = JSON.parse(fs.readFileSync(path.join(blockDir, 'clip.json'), 'utf8')) as { clip: string; audio: string; scenes: { start: number; seconds: number }[]; words: { word: string; startMs: number }[] }
      fs.copyFileSync(clip.clip, path.join(pub, 'clips', `b${block}.mp4`))
      fs.copyFileSync(clip.audio, path.join(pub, 'voice', `b${block}${path.extname(clip.audio)}`))
      units.push({
        speaker: `block-${block}`,
        chapter,
        tail: false,
        audio: { src: `voice/b${block}${path.extname(clip.audio)}`, seconds: audioSeconds(clip.audio) },
        beats: clip.scenes.map((s, k) => ({
          index: i + k,
          seconds: s.seconds,
          src: `clips/b${block}.mp4`,
          trimSeconds: s.start,
          words: clip.words.filter((w) => w.startMs / 1000 >= s.start - 0.05 && w.startMs / 1000 < s.start + s.seconds - 0.05).map((w) => ({ text: w.word, seconds: w.startMs / 1000 - s.start })),
        })),
      })
      i = j
      continue
    }
    // Narration over a graphic, a still or the app: one take in the narrator's voice.
    let words: { text: string; seconds: number }[]
    let audio: LayoutUnit['audio']
    if (args.silent) {
      words = estimateWords(beat.line)
    } else {
      const voice = beat.speaker === 'narrator' ? args.voice : (cast[beat.speaker]?.voice ?? args.voice)
      const key = hash([beat.line, voiceId(voice), RATE])
      const file = path.join(voiceDir, `take-${key}.mp3`)
      const wordsFile = path.join(voiceDir, `take-${key}.json`)
      if (!fs.existsSync(file) || !fs.existsSync(wordsFile)) {
        const { generateVoiceover } = await import('./lib/tts-engine')
        console.log(`🎙️  Beat ${i + 1}: ${beat.speaker} (${voice})`)
        const result = await generateVoiceover(beat.line, { voice, rate: RATE, outputDir: voiceDir, outputFilename: `take-${key}.mp3` })
        if (path.resolve(result.audioPath) !== file) fs.copyFileSync(result.audioPath, file)
        fs.writeFileSync(wordsFile, JSON.stringify({ text: beat.line, voice, words: result.words }, null, 2))
      }
      const saved = JSON.parse(fs.readFileSync(wordsFile, 'utf8')) as { words: { word: string; startMs: number }[] }
      words = saved.words.map((w) => ({ text: w.word, seconds: w.startMs / 1000 }))
      fs.copyFileSync(file, path.join(pub, 'voice', `n${i + 1}.mp3`))
      audio = { src: `voice/n${i + 1}.mp3`, seconds: audioSeconds(file) }
    }
    const v = beat.visual
    let src: string | undefined
    if (v.kind === 'still' && v.image) {
      const file = media(v.image)
      if (fs.existsSync(file)) {
        src = `stills/${path.basename(file)}`
        fs.copyFileSync(file, path.join(pub, src))
      } else console.log(`⚠️  Beat ${i + 1}: still ${path.relative(process.cwd(), file)} is not made yet`)
    }
    if (v.kind === 'screen' && v.capture) {
      const found = ['png', 'jpg', 'mp4', 'webm'].map((ext) => media(`screens/${v.capture}.${ext}`)).find((f) => fs.existsSync(f))
      if (found) {
        src = `screens/${path.basename(found)}`
        fs.copyFileSync(found, path.join(pub, src))
      } else console.log(`⚠️  Beat ${i + 1}: screen capture "${v.capture}" is not made yet (media/screens/)`)
    }
    if (v.kind === 'motion' && typeof v.props?.plate === 'string' && !/\./.test(v.props.plate)) {
      const plate = media(`plates/${v.props.plate}.png`)
      if (fs.existsSync(plate)) {
        fs.copyFileSync(plate, path.join(pub, 'plates', `${v.props.plate}.png`))
        beat.visual = { ...v, props: { ...v.props, plate: `plates/${v.props.plate}.png` } }
      } else beat.visual = { ...v, props: { ...v.props, plate: undefined } }
    }
    const seconds = Math.max(audio?.seconds ?? (words.at(-1)?.seconds ?? 0) + 0.5, v.kind === 'motion' || v.kind === 'scene' ? 3 : 2.5)
    units.push({ speaker: beat.speaker, chapter, audio, beats: [{ index: i, seconds, words, src }] })
    i++
  }

  // Scene art: every layer image the episode's art map uses, from media/art/ into the render.
  fs.mkdirSync(path.join(pub, 'art'), { recursive: true })
  for (const [name, spec] of Object.entries(ep.art ?? {})) {
    for (const layer of spec.layers) {
      const file = media(layer.src)
      if (fs.existsSync(file)) fs.copyFileSync(file, path.join(pub, layer.src))
      else console.log(`⚠️  Art "${name}": ${path.relative(process.cwd(), file)} is not painted yet`)
    }
  }

  const timeline = layoutTimeline(ep, units, FPS, { music: 'music.mp3' })
  fs.writeFileSync(path.join(pub, 'timeline.json'), JSON.stringify(timeline, null, 2))
  fs.writeFileSync(path.join(outDir, 'captions.srt'), buildSrt(timeline))
  fs.writeFileSync(path.join(outDir, 'chapters.txt'), buildChapters(timeline))
  console.log(`🗺️  Timeline: ${timeline.beats.length} beats, ${(timeline.durationInFrames / FPS).toFixed(1)}s, ${timeline.chapters.length} chapters`)
  if (!args.render) return

  const { bundle } = await import('@remotion/bundler')
  const { renderMedia, selectComposition } = await import('@remotion/renderer')
  console.log('📦 Bundling the video...')
  const serveUrl = await bundle({
    entryPoint: path.resolve('video/index.ts'),
    publicDir: pub,
    webpackOverride: (config) => ({ ...config, resolve: { ...config.resolve, alias: { ...(config.resolve?.alias ?? {}), '@': path.resolve('src') } } }),
  })
  const inputProps = { timeline }
  const composition = await selectComposition({ serveUrl, id: 'Episode', inputProps })
  const final = path.join(outDir, 'final.mp4')
  console.log(`🎬 Rendering ${composition.durationInFrames} frames...`)
  let last = 0
  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    codec: 'h264',
    crf: 18,
    scale: args.draft ? 0.5 : 1,
    outputLocation: final,
    chromiumOptions: { gl: 'angle' },
    // Cast clips and the 3D molt can take a while to seek on a busy machine.
    timeoutInMilliseconds: 180_000,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 100)
      if (pct >= last + 10) {
        last = pct
        console.log(`   ${pct}%`)
      }
    },
  })
  const checks = path.join(outDir, 'checks')
  fs.mkdirSync(checks, { recursive: true })
  for (const beat of timeline.beats) {
    const t = (beat.from + beat.duration * 0.6) / FPS
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', t.toFixed(2), '-i', final, '-frames:v', '1', '-vf', 'scale=640:-1', '-q:v', '4', path.join(checks, `beat-${String(beat.index + 1).padStart(2, '0')}.jpg`)])
  }
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-pattern_type', 'glob', '-i', path.join(checks, 'beat-*.jpg'), '-filter_complex', `tile=5x${Math.ceil(timeline.beats.length / 5)}:padding=4`, '-frames:v', '1', path.join(outDir, 'contact-sheet.jpg')])
  console.log(`✅ ${path.relative(process.cwd(), final)} · captions.srt · chapters.txt · contact-sheet.jpg`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main().catch((err) => {
    console.error(`❌ ${err instanceof Error ? (process.env.DEBUG ? err.stack : err.message) : err}`)
    process.exit(1)
  })
}
