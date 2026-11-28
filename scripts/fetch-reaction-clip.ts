#!/usr/bin/env tsx
/**
 * YouTube discovery, transcript inspection, and fair-use clip extraction for Molt Pod Reacts.
 *
 *   npm run anim:clip -- search "Bryan Johnson 2026" --limit 6
 *   npm run anim:clip -- transcript https://www.youtube.com/watch?v=coU8aHzTvpk --from 150 --to 270
 *   npm run anim:clip -- fetch https://www.youtube.com/watch?v=coU8aHzTvpk --start 166.5 --duration 8.6 --out tmp/molt-pod-ep01/clip-1.mp4
 *
 * Guardrails:
 *   - Clips must be 1.5s to 9.5s long (single fair-use commentary beat).
 *   - Output must stay strictly inside tmp/ (never tracked in git or uploaded raw to S3).
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const MIN_CLIP_SECONDS = 1.5
const MAX_CLIP_SECONDS = 9.5
const MAX_BUFFER = 1024 * 1024 * 64

function usage(): never {
  console.log(`Usage: npm run anim:clip -- <subcommand> [options]

Subcommands:
  search <query> [--limit 6]
      Search YouTube and tag freshness (FRESH <=90d, RECENT <=1yr, CLASSIC >1yr).

  transcript <url> [--from 0] [--to 300]
      Print timestamped English captions inside [from, to] seconds.

  fetch <url> --start <sec> --duration <sec> --out <tmp/.../clip.mp4> [--attribution "Channel · Title"]
      Download a short fair-use clip (1.5s–9.5s) strictly inside tmp/, normalize to 30fps MP4,
      probe video/audio/volume, and print a ready-to-paste sourceClip JSON block.`)
  process.exit(0)
}

function formatUploadDate(raw?: string): { date: string; freshness: string } {
  if (!raw || !/^\d{8}$/.test(raw)) return { date: 'unknown', freshness: 'UNKNOWN' }
  const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  const ms = Date.parse(`${iso}T12:00:00Z`)
  if (!Number.isFinite(ms)) return { date: iso, freshness: 'UNKNOWN' }
  const days = Math.max(0, Math.round((Date.now() - ms) / 86_400_000))
  const freshness = days <= 90 ? 'FRESH <=90d' : days <= 365 ? 'RECENT <=1yr' : 'CLASSIC >1yr'
  return { date: iso, freshness }
}

function flagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag)
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined
}

async function cmdSearch(args: string[]) {
  const limit = Math.max(1, Math.min(20, Number(flagValue(args, '--limit') ?? 6)))
  const queryParts: string[] = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit') {
      i++
      continue
    }
    queryParts.push(args[i])
  }
  const query = queryParts.join(' ').trim()
  if (!query) throw new Error('Pass a search query: npm run anim:clip -- search "<query>"')

  const { stdout } = await execFileAsync(
    'yt-dlp',
    ['--dump-json', '--no-warnings', '--skip-download', '--playlist-end', String(limit), `ytsearch${limit}:${query}`],
    { maxBuffer: MAX_BUFFER }
  )

  const lines = stdout.trim().split('\n').filter(Boolean)
  if (!lines.length) {
    console.log('No videos found.')
    return
  }

  for (const line of lines) {
    let d: Record<string, any>
    try {
      d = JSON.parse(line)
    } catch {
      continue
    }
    const { date, freshness } = formatUploadDate(d.upload_date)
    const views = typeof d.view_count === 'number' ? d.view_count.toLocaleString('en-US') : '?'
    const dur = typeof d.duration === 'number' ? `${Math.round(d.duration)}s` : '?'
    const channel = d.channel || d.uploader || 'Unknown'
    const url = d.webpage_url || (d.id ? `https://www.youtube.com/watch?v=${d.id}` : '')
    console.log(`[${date} | ${freshness} | ${views} views | ${dur}] ${channel} — ${d.title}`)
    console.log(`  ${url}`)
  }
}

async function fetchMetadata(url: string): Promise<Record<string, any>> {
  const { stdout } = await execFileAsync('yt-dlp', ['-J', '--no-warnings', '--no-playlist', url], {
    maxBuffer: MAX_BUFFER,
  })
  return JSON.parse(stdout)
}

function pickEnglishJson3(meta: Record<string, any>): string | undefined {
  const buckets = [meta.subtitles, meta.automatic_captions]
  const langs = ['en', 'en-US', 'en-GB', 'en-orig']
  for (const bucket of buckets) {
    if (!bucket || typeof bucket !== 'object') continue
    for (const lang of langs) {
      const list = bucket[lang]
      if (!Array.isArray(list)) continue
      const match = list.find((s: any) => s?.ext === 'json3' && typeof s?.url === 'string')
      if (match) return match.url
    }
  }
  return undefined
}

async function cmdTranscript(args: string[]) {
  const from = Number(flagValue(args, '--from') ?? 0)
  const to = Number(flagValue(args, '--to') ?? 300)
  const url = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--from' && args[args.indexOf(a) - 1] !== '--to')
  if (!url) throw new Error('Pass a YouTube URL: npm run anim:clip -- transcript <url>')

  const meta = await fetchMetadata(url)
  const { date, freshness } = formatUploadDate(meta.upload_date)
  const views = typeof meta.view_count === 'number' ? meta.view_count.toLocaleString('en-US') : '?'
  console.log(`${meta.channel || meta.uploader} — ${meta.title}`)
  console.log(`Published: ${date} (${freshness}) | Views: ${views} | Duration: ${meta.duration ?? '?'}s\n`)

  const subUrl = pickEnglishJson3(meta)
  if (!subUrl) {
    console.log('No English json3 captions found on this video.')
    return
  }

  const res = await fetch(subUrl)
  if (!res.ok) throw new Error(`Failed to fetch captions (HTTP ${res.status})`)
  const data = (await res.json()) as { events?: Array<{ tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8?: string }> }> }

  for (const ev of data.events ?? []) {
    if (!ev.segs?.length) continue
    const text = ev.segs
      .map((s) => s.utf8 ?? '')
      .join('')
      .replace(/\s+/g, ' ')
      .trim()
    if (!text) continue
    const start = (ev.tStartMs ?? 0) / 1000
    const end = start + (ev.dDurationMs ?? 0) / 1000
    if (end < from || start > to) continue
    console.log(`[${start.toFixed(2).padStart(6, ' ')}s -> ${end.toFixed(2).padStart(6, ' ')}s] ${text}`)
  }
}

function assertTmpPath(outArg: string): string {
  const tmpRoot = path.resolve(process.cwd(), 'tmp')
  const resolved = path.resolve(outArg)
  const rel = path.relative(tmpRoot, resolved)
  if (!rel || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error(`--out must stay inside tmp/ (got "${outArg}"). Raw third-party clips must never be placed in public/, content/, or src/.`)
  }
  return resolved
}

function buildAttribution(channel: string, title: string, custom?: string): string {
  if (custom?.trim()) return custom.trim().slice(0, 90)
  const full = `${channel} · ${title}`.replace(/\s+/g, ' ').trim()
  if (full.length <= 85) return full
  return `${full.slice(0, 82).trimEnd()}...`
}

async function cmdFetch(args: string[]) {
  const url = args.find((a, i) => !a.startsWith('--') && !['--start', '--duration', '--out', '--attribution'].includes(args[i - 1] ?? ''))
  const start = Number(flagValue(args, '--start'))
  const duration = Number(flagValue(args, '--duration'))
  const outArg = flagValue(args, '--out')
  const customAttribution = flagValue(args, '--attribution')

  if (!url) throw new Error('Pass a YouTube URL: npm run anim:clip -- fetch <url> --start <sec> --duration <sec> --out <tmp/.../clip.mp4>')
  if (!Number.isFinite(start) || start < 0) throw new Error('--start must be a non-negative number of seconds')
  if (!Number.isFinite(duration) || duration < MIN_CLIP_SECONDS || duration > MAX_CLIP_SECONDS) {
    throw new Error(`--duration must be between ${MIN_CLIP_SECONDS}s and ${MAX_CLIP_SECONDS}s for fair-use commentary beats (got ${duration})`)
  }
  if (!outArg) throw new Error('Pass --out <tmp/.../clip.mp4>')

  const outPath = assertTmpPath(outArg)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })

  const meta = await fetchMetadata(url)
  const { date, freshness } = formatUploadDate(meta.upload_date)
  if (typeof meta.duration === 'number' && start + duration > meta.duration + 0.5) {
    throw new Error(`Requested clip (${start}s + ${duration}s) exceeds video duration (${meta.duration}s)`)
  }

  const padStart = Math.max(0, start - 2)
  const padEnd = start + duration + 2
  const trimOffset = start - padStart
  const rawPath = path.join(path.dirname(outPath), `.raw-${path.basename(outPath, path.extname(outPath))}-${Date.now()}.mp4`)
  if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)

  console.log(`📥 Fetching section ${padStart.toFixed(2)}s–${padEnd.toFixed(2)}s (${freshness}, published ${date})...`)
  try {
    const baseArgs = [
      '--no-warnings',
      '--no-playlist',
      '--download-sections',
      `*${padStart.toFixed(2)}-${padEnd.toFixed(2)}`,
      '--force-keyframes-at-cuts',
      '-f',
      'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best',
      '--merge-output-format',
      'mp4',
      '-o',
      rawPath,
    ]
    try {
      await execFileAsync('yt-dlp', [...baseArgs, url], { maxBuffer: MAX_BUFFER })
    } catch {
      if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
      console.log(`   ↪ Default client blocked; retrying with android progressive client...`)
      await execFileAsync(
        'yt-dlp',
        ['--extractor-args', 'youtube:player_client=android', ...baseArgs, url],
        { maxBuffer: MAX_BUFFER }
      )
    }

    if (!fs.existsSync(rawPath)) {
      throw new Error('yt-dlp completed without creating the temporary clip file')
    }

    console.log(`✂️  Trimming exact window (+${trimOffset.toFixed(2)}s for ${duration.toFixed(2)}s) to 30fps H.264/AAC...`)
    await execFileAsync(
      'ffmpeg',
      [
        '-v',
        'error',
        '-y',
        '-i',
        rawPath,
        '-ss',
        trimOffset.toFixed(3),
        '-t',
        duration.toFixed(3),
        '-r',
        '30',
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '18',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-ar',
        '44100',
        '-ac',
        '2',
        '-b:a',
        '192k',
        outPath,
      ],
      { maxBuffer: MAX_BUFFER }
    )
  } finally {
    if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
  }

  const { stdout: probeRaw } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration:stream=codec_type,width,height,r_frame_rate',
    '-of',
    'json',
    outPath,
  ])
  const probe = JSON.parse(probeRaw) as {
    format?: { duration?: string }
    streams?: Array<{ codec_type?: string; width?: number; height?: number; r_frame_rate?: string }>
  }
  const actualDuration = Number(parseFloat(probe.format?.duration ?? String(duration)).toFixed(3))
  const vStream = probe.streams?.find((s) => s.codec_type === 'video')
  const aStream = probe.streams?.find((s) => s.codec_type === 'audio')
  if (!vStream) throw new Error(`Clip has no video stream: ${outPath}`)
  if (!aStream) throw new Error(`Clip has no audio stream: ${outPath}`)

  const volRes = await execFileAsync('ffmpeg', ['-i', outPath, '-af', 'volumedetect', '-f', 'null', '-'])
  const volLog = `${volRes.stdout}\n${volRes.stderr}`
  const meanVol = volLog.match(/mean_volume:\s*([-\d.]+\s*dB)/)?.[1] ?? 'unknown'
  const maxVol = volLog.match(/max_volume:\s*([-\d.]+\s*dB)/)?.[1] ?? 'unknown'

  const relOut = path.relative(process.cwd(), outPath)
  const channel = String(meta.channel || meta.uploader || 'YouTube').trim()
  const title = String(meta.title || 'Source Video').trim()
  const sourceClip = {
    path: relOut,
    start: 0,
    duration: actualDuration,
    attribution: buildAttribution(channel, title, customAttribution),
    url: meta.webpage_url || url,
    publishedAt: date !== 'unknown' ? date : undefined,
  }

  console.log(`\n✅ Saved clip: ${relOut}`)
  console.log(`   Video: ${vStream.width}x${vStream.height} @ ${vStream.r_frame_rate} | Duration: ${actualDuration}s`)
  console.log(`   Audio: mean ${meanVol}, max ${maxVol}`)
  console.log(`\nPaste into lesson scene "sourceClip":\n${JSON.stringify(sourceClip, null, 2)}`)
}

async function main() {
  const [sub, ...rest] = process.argv.slice(2)
  if (!sub || sub === '-h' || sub === '--help') usage()
  if (sub === 'search') await cmdSearch(rest)
  else if (sub === 'transcript') await cmdTranscript(rest)
  else if (sub === 'fetch') await cmdFetch(rest)
  else throw new Error(`Unknown subcommand "${sub}". Use search, transcript, or fetch.`)
}

main().catch((err) => {
  console.error(`❌ ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
