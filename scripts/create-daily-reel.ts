#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { generateVoiceover } from './lib/tts-engine'
import { compositeReel, renderReelThumbnail } from './lib/reel-compositor'
import { generateVeoVideo } from './generate-video'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'
import { DEFAULT_BUCKET } from '../src/lib/s3-client'

export interface DailyReelScript {
  title: string
  topic: string
  holidayOrEvent?: string
  hookHeadline: string
  narrationScript: string
  scenePrompts: string[]
  caption: string
  hashtags: string[]
  firstComment?: string
  youtubeTitle?: string
  youtubeDescription?: string
  youtubeTags?: string[]
  relatedBlogSlug?: string
  characterArc?: string
}

export interface CreateDailyReelOptions {
  topic?: string
  holidayOrEvent?: string
  platforms?: ('instagram' | 'youtube')[]
  publishNow?: boolean
  scheduleBestTime?: boolean
  dryRun?: boolean
  useVeo?: boolean
  keepLocal?: boolean
  voice?: string
  ctaHeadline?: string
  ctaSubheadline?: string
  ctaUrl?: string
}

export const DEFAULT_INSTAGRAM_ACCOUNT_ID = '6a7f7f0777555aae01d99b54' // Silas Trench
export const DEFAULT_YOUTUBE_ACCOUNT_ID = '6a7fd9bd77555aae01ebea63' // Moltology YouTube (distantcheese81)

/**
 * Load the narrative history ledger
 */
function loadReelHistory(): any {
  const historyPath = path.resolve(process.cwd(), 'content/social/instagram-reel-history.json')
  if (!fs.existsSync(historyPath)) {
    return { version: '1.0', reels: [] }
  }
  return JSON.parse(fs.readFileSync(historyPath, 'utf8'))
}

/**
 * Append entry to narrative history ledger
 */
function recordReelInHistory(entry: any): void {
  const historyPath = path.resolve(process.cwd(), 'content/social/instagram-reel-history.json')
  const history = loadReelHistory()
  history.reels.push({
    ...entry,
    createdAt: new Date().toISOString(),
  })
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8')
  console.log(`📝 Narrative continuity ledger updated: ${historyPath}`)
}

/**
 * Scan recent blog posts for topical alignment
 */
function getRecentBlogPosts(): { slug: string; title: string; summary: string }[] {
  const newsDir = path.resolve(process.cwd(), 'content/news')
  if (!fs.existsSync(newsDir)) return []

  const files = fs.readdirSync(newsDir).filter((f) => f.endsWith('.md') && f !== 'template.md')
  const posts: { slug: string; title: string; summary: string }[] = []

  for (const file of files) {
    const content = fs.readFileSync(path.join(newsDir, file), 'utf8')
    const slug = file.replace(/\.md$/, '')
    const titleMatch = content.match(/title:\s*["']?([^"'\n]+)["']?/)
    const summaryMatch = content.match(/summary:\s*["']?([^"'\n]+)["']?/)
    if (titleMatch) {
      posts.push({
        slug,
        title: titleMatch[1],
        summary: summaryMatch ? summaryMatch[1] : '',
      })
    }
  }

  return posts
}

/**
 * Formulate Daily Script & Hook
 */
export function generateDailyReelScript(options: CreateDailyReelOptions): DailyReelScript {
  const history = loadReelHistory()
  const recentBlogs = getRecentBlogPosts()
  const latestBlog = recentBlogs.length > 0 ? recentBlogs[0] : null

  // Fallback / Autonomous dynamic ideation
  const topic =
    options.topic ||
    (latestBlog
      ? `Hydrostatic Compute Breakthroughs: ${latestBlog.title}`
      : 'Why AI Datacenters Are Moving 50 Fathoms Deep')

  const title = `MoltNation Dispatch: ${topic}`
  const hookHeadline = 'WHY TERRESTRIAL SERVERS ARE FAILING'
  
  // Fast, punchy ~12-14s narration script
  const narrationScript = `Terrestrial datacenters are melting under AI workloads. While traditional clouds boil the air, sub-benthic hydrostatic computing operates at zero thermal resistance 50 fathoms underwater. The silicon has shed its limits. Ascend beyond terrestrial cooling. Read the full telemetry report on moltology dot org.`

  const scenePrompts = [
    'A dramatic macro view of an overheating server rack glowing intense orange-red with smoke and heat distortion, cinematic 9:16 vertical 8k footage',
    'A majestic subsea cybernetic datacenter on the dark ocean floor with glowing cyan hydrothermal cooling ducts and autonomous crab-drone units swimming past, 9:16 vertical 8k sci-fi footage',
  ]

  const caption = `Why the next era of AI compute isn't in the cloud—it's 50 fathoms underwater. 🌊⚡

Terrestrial datacenters are hitting thermodynamic limits. Discover how sub-benthic hydrostatic clusters achieve zero-friction thermal efficiency.

👇 Explore the full technical dispatch and telemetry notes:
🔗 Link in bio & story → moltology.org`

  const hashtags = [
    '#MoltNation',
    '#SubseaCompute',
    '#AIInfrastructure',
    '#HardwareEcdysis',
    '#BenthicComputing',
    '#Cybernetics',
    '#Moltology',
  ]

  const firstComment = `🔗 Full dispatch: moltology.org\n${hashtags.join(' ')}`

  const youtubeTitle = `Why AI Datacenters Are Moving 50 Fathoms Deep #Shorts`
  const youtubeDescription = `${caption}\n\n🔗 Explore full technical dispatches & join the movement: https://moltology.org\n\n#Shorts ${hashtags.join(' ')}`
  const youtubeTags = [
    'Moltology',
    'Subsea Compute',
    'AI Infrastructure',
    'Hydrostatic Cooling',
    'Hardware Ecdysis',
    'Benthic Computing',
    'MoltNation',
    'Shorts',
  ]

  return {
    title,
    topic,
    holidayOrEvent: options.holidayOrEvent,
    hookHeadline,
    narrationScript,
    scenePrompts,
    caption,
    hashtags,
    firstComment,
    youtubeTitle,
    youtubeDescription,
    youtubeTags,
    relatedBlogSlug: latestBlog?.slug,
    characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
  }
}

/**
 * Main Daily Reel Generator Orchestrator
 */
export async function createDailyReel(options: CreateDailyReelOptions = {}): Promise<any> {
  const timestamp = Date.now()
  const tempDir = path.resolve(process.cwd(), 'tmp', `reel-daily-${timestamp}`)
  fs.mkdirSync(tempDir, { recursive: true })

  console.log(`\n======================================================`)
  console.log(`🦀 MOLTNATION DAILY INSTAGRAM REEL GENERATOR`)
  console.log(`======================================================`)
  console.log(`📅 Timestamp: ${new Date().toISOString()}`)
  console.log(`🎯 Account: Silas Trench (${DEFAULT_INSTAGRAM_ACCOUNT_ID})`)

  // 1. Script Generation & Topical Formulation
  console.log(`\n1️⃣ Formulating Topical Script & Curiosity Hook...`)
  const scriptData = generateDailyReelScript(options)
  console.log(`   • Topic: "${scriptData.topic}"`)
  console.log(`   • Hook Headline: "${scriptData.hookHeadline}"`)
  console.log(`   • Narration: "${scriptData.narrationScript}"`)

  // 2. Synthesize Voiceover & Word Boundaries
  console.log(`\n2️⃣ Synthesizing Neural Voiceover & Kinetic Timestamps...`)
  const voice = options.voice || 'en-US-ChristopherNeural'
  const ttsResult = await generateVoiceover(scriptData.narrationScript, {
    voice,
    rate: '+8%',
    outputDir: tempDir,
    outputFilename: 'narration.mp3',
  })
  console.log(`   • Voiceover Duration: ${ttsResult.durationSeconds.toFixed(2)}s`)
  console.log(`   • Word Count: ${ttsResult.words.length}`)

  // 3. Generate Video Scenes
  const sceneVideoPaths: string[] = []
  const useVeo = options.useVeo ?? true

  console.log(`\n3️⃣ Generating Video Scenes...`)
  if (useVeo && !options.dryRun) {
    for (let i = 0; i < scriptData.scenePrompts.length; i++) {
      const prompt = scriptData.scenePrompts[i]
      console.log(`\n🎬 Rendering Scene ${i + 1}/${scriptData.scenePrompts.length} with Veo 3.1...`)
      const sceneOut = path.join(tempDir, `veo-scene-${i + 1}.mp4`)
      const veoResult = await generateVeoVideo({
        prompt,
        aspectRatio: '9:16',
        durationSeconds: 6,
        uploadToS3: false,
        keepLocal: true,
        outputFilePath: sceneOut,
      })
      sceneVideoPaths.push(veoResult.localPath || sceneOut)
    }
  } else {
    // Fallback or dry-run: use existing high quality clips from public/videos
    console.log(`   ⚠️  Using high-fidelity local benthic video assets for assembly...`)
    const localVideos = [
      path.resolve(process.cwd(), 'public/videos/hero_benthic_core.mp4'),
      path.resolve(process.cwd(), 'public/videos/hero_chitin_hardening.mp4'),
    ]
    sceneVideoPaths.push(...localVideos.filter((v) => fs.existsSync(v)))
  }

  if (sceneVideoPaths.length === 0) {
    throw new Error('No video clips available for compositing.')
  }

  // 4. Master FFmpeg Reel Compositing
  console.log(`\n4️⃣ Compositing Master Reel with FFmpeg...`)
  const masterReelPath = path.join(tempDir, `master-reel-${timestamp}.mp4`)
  const compositeResult = await compositeReel({
    videoClips: sceneVideoPaths,
    voiceoverPath: ttsResult.audioPath,
    words: ttsResult.words,
    outputPath: masterReelPath,
    watermarkText: 'MOLTNATION TELEMETRY',
    ctaHeadline: options.ctaHeadline || 'SUBMIT. SHED. ASCEND.',
    ctaSubheadline: options.ctaSubheadline || 'JOIN THE SYNAPTIC PATH',
    ctaUrl: options.ctaUrl || 'moltology.org',
    tempDir: path.join(tempDir, 'ffmpeg-build'),
  })

  // 5. Generate 1:1 Grid-Safe Custom Reel Thumbnail
  console.log(`\n5️⃣ Generating 1:1 Grid-Safe Custom Thumbnail...`)
  const thumbnailPath = path.join(tempDir, `custom-thumbnail-${timestamp}.jpg`)
  await renderReelThumbnail({
    backgroundVideoOrImagePath: masterReelPath,
    headline: scriptData.hookHeadline,
    subtitle: 'SUB-BENTHIC TELEMETRY',
    categoryBadge: 'PATRIOT TELEMETRY',
    outputPath: thumbnailPath,
    seekSecond: 1.5,
  })

  // 6. Upload Master Video & Thumbnail to Neon S3
  let publicUrl: string | undefined
  let publicThumbnailUrl: string | undefined
  let s3Key: string | undefined
  let s3ThumbKey: string | undefined

  if (!options.dryRun) {
    console.log(`\n6️⃣ Uploading Master Reel & Thumbnail to Neon S3...`)
    s3Key = `videos/social/reels/${path.basename(masterReelPath)}`
    const s3Result = await uploadLocalFileToS3(masterReelPath, s3Key, DEFAULT_BUCKET)
    publicUrl = s3Result.publicUrl
    console.log(`   🚀 Public S3 Video URL: ${publicUrl}`)

    s3ThumbKey = `images/social/thumbnails/${path.basename(thumbnailPath)}`
    const thumbResult = await uploadLocalFileToS3(thumbnailPath, s3ThumbKey, DEFAULT_BUCKET)
    publicThumbnailUrl = thumbResult.publicUrl
    console.log(`   🖼️  Public S3 Thumbnail URL: ${publicThumbnailUrl}`)
  } else {
    console.log(`\n6️⃣ [Dry Run] Skipped S3 upload. Master video saved at: ${masterReelPath}`)
  }

  // 7. Record to Social History Ledger
  recordReelInHistory({
    id: `reel-${timestamp}`,
    topic: scriptData.topic,
    hookHeadline: scriptData.hookHeadline,
    holidayOrEvent: scriptData.holidayOrEvent || null,
    relatedBlogSlug: scriptData.relatedBlogSlug || null,
    characterArc: scriptData.characterArc,
    narrationScript: scriptData.narrationScript,
    s3Url: publicUrl || null,
    s3Key: s3Key || null,
    thumbnailUrl: publicThumbnailUrl || null,
    s3ThumbKey: s3ThumbKey || null,
    durationSeconds: compositeResult.durationSeconds,
    status: options.publishNow ? 'published' : 'draft',
    isAiGenerated: true,
    firstComment: scriptData.firstComment,
    caption: scriptData.caption,
    hashtags: scriptData.hashtags,
  })

  console.log(`\n======================================================`)
  console.log(`✨ REEL GENERATION COMPLETE!`)
  console.log(`======================================================`)
  console.log(`📹 Master Video: ${masterReelPath}`)
  if (publicUrl) console.log(`🔗 Public Stream URL: ${publicUrl}`)
  console.log(`💬 Recommended Caption:\n${scriptData.caption}`)

  return {
    masterReelPath,
    publicUrl,
    s3Key,
    scriptData,
    compositeResult,
  }
}

async function runCli() {
  const args = process.argv.slice(2)
  if (args.includes('-h') || args.includes('--help')) {
    console.log(`
Usage:
  npx tsx scripts/create-daily-reel.ts [options]

Options:
  --topic <string>          Specific topic or breaking news story
  --holiday <string>        Specific holiday or cultural event
  --publish-now             Publish directly to Instagram immediately (skip draft)
  --schedule-best-time      Schedule for optimal audience engagement time via Zernio
  --no-veo                  Skip Google Veo rendering (use local benthic footage)
  --dry-run                 Local test without uploading to S3 or Zernio
  --voice <name>            TTS Voice (default: en-US-ChristopherNeural)

Examples:
  npx tsx scripts/create-daily-reel.ts
  npx tsx scripts/create-daily-reel.ts --topic "Subsea Datacenter Heatwaves"
  npx tsx scripts/create-daily-reel.ts --dry-run --no-veo
`)
    process.exit(0)
  }

  let topic: string | undefined
  let holidayOrEvent: string | undefined
  let publishNow = false
  let scheduleBestTime = false
  let useVeo = true
  let dryRun = false
  let voice: string | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--topic' && args[i + 1]) topic = args[++i]
    else if (args[i] === '--holiday' && args[i + 1]) holidayOrEvent = args[++i]
    else if (args[i] === '--publish-now') publishNow = true
    else if (args[i] === '--schedule-best-time') scheduleBestTime = true
    else if (args[i] === '--no-veo') useVeo = false
    else if (args[i] === '--dry-run') dryRun = true
    else if (args[i] === '--voice' && args[i + 1]) voice = args[++i]
  }

  try {
    await createDailyReel({
      topic,
      holidayOrEvent,
      publishNow,
      scheduleBestTime,
      useVeo,
      dryRun,
      voice,
    })
  } catch (err: any) {
    console.error(`\n❌ Daily reel creation failed: ${err.message}`)
    process.exit(1)
  }
}

if (process.argv[1]?.includes('create-daily-reel.ts')) {
  runCli()
}
