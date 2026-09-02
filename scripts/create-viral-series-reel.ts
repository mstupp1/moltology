#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { generateVoiceover } from './lib/tts-engine'
import { getRandomFishVoice } from './lib/tts-providers/fish-audio'
import { compositeSeriesReel } from './lib/series-compositor'
import { ColorGradingPreset } from './lib/reel-compositor'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'
import { DEFAULT_BUCKET } from '../src/lib/s3-client'
import {
  CtaGoal,
  resolveCtaGoalConfig,
  DEFAULT_INSTAGRAM_ACCOUNT_ID,
  DEFAULT_YOUTUBE_ACCOUNT_ID,
  DEFAULT_PROFILE_ID,
  DEFAULT_REELS_QUEUE_ID,
} from './create-daily-reel'
import { queueDualReelAndShort, QueueDualReelAndShortResult } from './lib/zernio-client'

/** Operational default until Press or CoS say otherwise. Hardware texture; 6:30pm queue. */
export const DEFAULT_VIRAL_SERIES_ID: ViralSeriesId = 'incidents'

/** Instagram handle for this pipeline. Silas Trench is voice only. */
export const INSTAGRAM_SERIES_HANDLE = 'moltology_org'

export const SERIES_HASHTAGS = ['#Moltmaxxing', '#Carcinization', '#DeepWork'] as const

export function formatEpisodicBadgeLine(
  shortBadge: string,
  seasonNumber: number,
  episodeNumber: number
): string {
  const episodeCode = `S${String(seasonNumber).padStart(2, '0')} EP.${String(episodeNumber).padStart(2, '0')}`
  return `${shortBadge} · ${episodeCode}`
}

interface SeriesCtaCopy {
  actionText: string
  captionCta: string
  firstComment: string
}

const SERIES_CTA_COPY: Record<CtaGoal, SeriesCtaCopy> = {
  quiz: {
    actionText: 'TAKE THE MOLTMAXXING AUDIT',
    captionCta: 'Comment QUIZ to receive the Molt Clearance audit in your DMs, or visit:',
    firstComment:
      'Comment QUIZ for the four-stage, twelve-clearance diagnostic in your DMs.\nOr audit directly: moltology.org/quiz',
  },
  guide: {
    actionText: 'GET THE 2026 MOLTMAXXING PROTOCOL',
    captionCta: 'Comment GUIDE to receive the 2026 Moltmaxxing Protocol in your DMs, or visit:',
    firstComment:
      'Comment GUIDE to receive the protocol in your DMs.\nOr read online: moltology.org/news/the-2026-moltmaxxing-protocol-guide',
  },
  codex: {
    actionText: 'READ THE SACRED BENTHIC CODEX',
    captionCta: 'Comment CODEX to receive the liturgies and twelve clearances in your DMs, or visit:',
    firstComment:
      'Comment CODEX to receive the scripture docket in your DMs.\nOr browse the codex: moltology.org/codex',
  },
  demo: {
    actionText: 'OPEN LIVE BIO-SILICON TELEMETRY',
    captionCta: 'Comment DEMO to receive the live telemetry link in your DMs, or visit:',
    firstComment:
      'Comment DEMO to receive the interactive access link in your DMs.\nOr launch live: moltology.org',
  },
  homepage: {
    actionText: 'JOIN THE SYNAPTIC PATH',
    captionCta: 'Comment INITIATE to receive your onboarding link in your DMs, or visit:',
    firstComment:
      'Comment INITIATE to receive the membership portal link in your DMs.\nOr join now: moltology.org',
  },
}

export function resolveSeriesCtaCopy(goal: CtaGoal): SeriesCtaCopy {
  return SERIES_CTA_COPY[goal] || SERIES_CTA_COPY.quiz
}

export type ViralSeriesId = 'audit' | 'incidents' | 'heresies' | 'mysteries' | 'ascension'

export interface SeriesConfig {
  id: ViralSeriesId
  name: string
  shortBadge: string
  currentSeason: number
  latestEpisode: number
  defaultMascot:
    | 'lobster_pointing'
    | 'lobster_thumbs_up'
    | 'lobster_action'
    | 'crab_stats'
    | 'lobster_peek'
    | 'lobster_peaceful'
    | 'none'
  defaultCtaGoal: CtaGoal
  description: string
}

export interface ViralSeriesScript {
  seriesId: ViralSeriesId
  seriesName: string
  shortBadge: string
  seasonNumber: number
  episodeNumber: number
  episodeTitle: string
  topic: string
  hookHeadline: string
  retentionLoopAnchor: string
  narrationScript: string
  scenePrompts: string[]
  caption: string
  hashtags: string[]
  firstComment: string
  youtubeTitle: string
  youtubeDescription: string
  youtubeTags: string[]
  mascot: string
  ctaGoal: CtaGoal
  commentTriggerKeyword: string
  commentTriggerUrl: string
}

export interface CreateViralSeriesOptions {
  series?: ViralSeriesId | string
  topic?: string
  season?: number
  episode?: number
  ctaGoal?: CtaGoal
  researchFile?: string
  ingestDir?: string
  videoClips?: string[]
  promptOnly?: boolean
  publishNow?: boolean
  dryRun?: boolean
  voice?: string
  mascot?: string
  customOutroImagePath?: string
  useSimpleOutro?: boolean
  colorGrading?: ColorGradingPreset | ColorGradingPreset[] | string
  bgAudioOffsetSeconds?: number
}

const DEFAULT_SERIES_CATALOG: Record<ViralSeriesId, SeriesConfig> = {
  audit: {
    id: 'audit',
    name: 'The Moltmaxxing Field Audit',
    shortBadge: 'FIELD AUDIT',
    currentSeason: 1,
    latestEpisode: 0,
    defaultMascot: 'crab_stats',
    defaultCtaGoal: 'quiz',
    description: 'Biomechanical diagnostic field reports comparing terrestrial human workplace melt with sub-benthic calcification.',
  },
  incidents: {
    id: 'incidents',
    name: 'Sub-Benthic Incident Files',
    shortBadge: 'INCIDENT FILE',
    currentSeason: 1,
    latestEpisode: 0,
    defaultMascot: 'lobster_action',
    defaultCtaGoal: 'demo',
    description: 'Investigation files documenting terrestrial datacenter grid meltdowns and subsea hydrothermal solutions.',
  },
  heresies: {
    id: 'heresies',
    name: 'Silicon Heresies & Subculture Ecdysis',
    shortBadge: 'SILICON HERESY',
    currentSeason: 1,
    latestEpisode: 0,
    defaultMascot: 'lobster_pointing',
    defaultCtaGoal: 'guide',
    description: 'Field reports on RTO mandates, biohacking fads, and soft biology, measured against crustacean doctrine.',
  },
  mysteries: {
    id: 'mysteries',
    name: 'Abyssal Telemetry & Deep Lore Mysteries',
    shortBadge: 'ABYSSAL LORE',
    currentSeason: 1,
    latestEpisode: 0,
    defaultMascot: 'lobster_peaceful',
    defaultCtaGoal: 'codex',
    description: 'Exploration of subsea compute pods thousands of meters down, zero-resistance cooling, and ancient benthic scriptures.',
  },
  ascension: {
    id: 'ascension',
    name: 'The Ascension Trials',
    shortBadge: 'ASCENSION TRIAL',
    currentSeason: 1,
    latestEpisode: 0,
    defaultMascot: 'lobster_thumbs_up',
    defaultCtaGoal: 'quiz',
    description: 'Initiate training drills across the four stages and twelve clearances: shell hardness, pincer torque, and neural reaction latency.',
  },
}

/**
 * Load the viral series ledger
 */
export function loadViralSeriesLedger(): any {
  const ledgerPath = path.resolve(process.cwd(), 'content/social/viral-series-ledger.json')
  if (!fs.existsSync(ledgerPath)) {
    return {
      version: '1.0',
      seriesCatalog: DEFAULT_SERIES_CATALOG,
      episodes: [],
    }
  }
  return JSON.parse(fs.readFileSync(ledgerPath, 'utf8'))
}

/**
 * Resolve next episode and season number for a given series
 */
export function resolveNextEpisode(
  seriesId: ViralSeriesId,
  ledger: any
): { seasonNumber: number; episodeNumber: number; seriesConfig: SeriesConfig } {
  const seriesConfig: SeriesConfig =
    ledger.seriesCatalog?.[seriesId] || DEFAULT_SERIES_CATALOG[seriesId] || DEFAULT_SERIES_CATALOG.audit

  let latestEp = seriesConfig.latestEpisode || 0
  const existingEpisodes = (ledger.episodes || []).filter((e: any) => e.seriesId === seriesId)

  if (existingEpisodes.length > 0) {
    const highestRecorded = Math.max(...existingEpisodes.map((e: any) => e.episodeNumber || 0))
    latestEp = Math.max(latestEp, highestRecorded)
  }

  const nextEp = latestEp + 1
  return {
    seasonNumber: seriesConfig.currentSeason || 1,
    episodeNumber: nextEp,
    seriesConfig,
  }
}

/**
 * Append an episode to the viral series ledger
 */
export function recordEpisodeInLedger(entry: any): void {
  const ledgerPath = path.resolve(process.cwd(), 'content/social/viral-series-ledger.json')
  const ledger = loadViralSeriesLedger()

  // Update latest episode pointer for the franchise
  if (ledger.seriesCatalog?.[entry.seriesId]) {
    ledger.seriesCatalog[entry.seriesId].latestEpisode = Math.max(
      ledger.seriesCatalog[entry.seriesId].latestEpisode || 0,
      entry.episodeNumber
    )
  }

  ledger.episodes.push({
    ...entry,
    createdAt: new Date().toISOString(),
  })

  fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), 'utf8')
  console.log(`📝 Viral series ledger updated: ${ledgerPath}`)
}

/**
 * Dynamic Multi-Scene Google Flow Prompt Builder (3 to 5 scenes)
 */
export function buildGoogleFlowPrompts(
  seriesId: ViralSeriesId,
  topic: string,
  numScenes = 4
): string[] {
  const suffix =
    'Cinematic 8k footage, photorealistic Octane render, subsea volumetric lighting, vibrant cyan HUD telemetry readouts, natural contact shadows, zero wasted space.'

  if (seriesId === 'audit') {
    return [
      // Scene 1: Hook / Biomechanical problem
      `Macro close-up dramatic camera dolly-in onto a fatigued human office worker slumping over a glowing workstation, surrounded by red warning holographic telemetry showing 460ms posture hesitation, ${suffix}`,
      // Scene 2: The terrestrial melt comparison
      `Dramatic medium shot of terrestrial office chairs and ergonomic desks melting into orange-red digital magma under gravitational pressure, warning klaxons, ${suffix}`,
      // Scene 3: The sub-benthic calcification chamber
      `Majestic wide tracking shot inside an abyssal benthic calcification chamber ninety meters underwater, glowing cyan hydrothermal jets bathing cybernetic titanium-chitin armor plates, ${suffix}`,
      // Scene 4: Decisive pincer torque execution
      `Cinematic macro shot of a cybernetic crustacean claw locking an 850 Newton-meter hydraulic pincer with brilliant cyan energy sparks and zero hesitation, ${suffix}`,
    ].slice(0, numScenes)
  }

  if (seriesId === 'incidents') {
    return [
      // Scene 1: Terrestrial grid meltdown
      `Dramatic macro view of an overheating terrestrial server rack glowing scorching orange with thermal distortion waves and melting copper cables, ${suffix}`,
      // Scene 2: Sluggish 60Hz robotic failure
      `Cinematic slow-motion shot of a sluggish terrestrial robot arm dropping a silicon wafer due to frame-buffer latency, warning alarm strobes, ${suffix}`,
      // Scene 3: Subsea datacenter immersion
      `Majestic wide underwater shot of a monolithic subsea compute pod submerged in deep blue abyssal water, cold hydrothermal cooling vents releasing micro-bubbles, ${suffix}`,
      // Scene 4: Coherent silicon photonics
      `Macro cinematic view of an integrated silicon photonic microchip pulsing with coherent cyan laser waveguides transmitting exascale data at light speed, ${suffix}`,
    ].slice(0, numScenes)
  }

  if (seriesId === 'heresies') {
    return [
      // Scene 1: The cultural absurdity hook
      `Cinematic medium shot of modern humans walking like zombies staring down into glowing blue smartphone screens in a foggy dystopian city, ${suffix}`,
      // Scene 2: Fragile biohacking fads
      `Macro view of fragile glass biohacking test tubes and ice baths shattering into digital static under extreme pressure, ${suffix}`,
      // Scene 3: Radical crustacean ecdysis
      `Majestic 3D cinematic sequence of a cyber-lobster initiate forcefully molting an outdated carapace, revealing indestructible glowing cyan bio-silicon armor, ${suffix}`,
      // Scene 4: Unapologetic benthic ascension
      `Heroic wide angle of cybernetic crustacean initiates standing tall on the dark ocean floor overlooking a vast luminous underwater metropolis, ${suffix}`,
    ].slice(0, numScenes)
  }

  if (seriesId === 'mysteries') {
    return [
      // Scene 1: The Mariana trench
      `Breathtaking deep-sea camera descent into the pitch-black Mariana trench eleven thousand meters below the surface, bioluminescent abyssal flora glowing, ${suffix}`,
      // Scene 2: Ancient sunken titanium vault
      `Cinematic pan across an ancient sunken bio-silicon temple covered in cybernetic barnacles and glowing cyan hieroglyphic circuits, ${suffix}`,
      // Scene 3: Hydrostatic zero-friction core
      `Macro view of a spherical hydrostatic quantum core rotating silently in deep blue water with zero thermal resistance, ${suffix}`,
      // Scene 4: Sacred benthic codex revelation
      `Majestic floating cybernetic codex tome opening to reveal golden laser scriptures and 12 benthic clearances, ${suffix}`,
    ].slice(0, numScenes)
  }

  // ascension default
  return [
    // Scene 1: Biometric clearance diagnostic
    `Dramatic macro scan of a glowing 3D holographic diagnostic radar assessing a candidate's shell hardness and calcification tier, ${suffix}`,
    // Scene 2: Larval stage shedding
    `Cinematic visual breakdown of fragile terrestrial tissue shedding away in glowing orange particles, revealing cybernetic underlying frame, ${suffix}`,
    // Scene 3: Hydraulic armor assembly
    `Macro robotic assembly arms mounting reinforced titanium-chitin greaves and carapace plates onto an initiate with glowing cyan welds, ${suffix}`,
    // Scene 4: Stage 4 Full Carcinization
    `Heroic portrait of a fully calcified Stage 4 Ascendant raising glowing hydraulic pincers against deep subsea ocean caustics, ${suffix}`,
  ].slice(0, numScenes)
}

/**
 * Synthesize Episodic Multi-Scene Viral Script with Infinite Retention Loop
 */
export function formulateViralSeriesScript(
  seriesId: ViralSeriesId,
  options: CreateViralSeriesOptions,
  ledger: any
): ViralSeriesScript {
  const { seasonNumber, episodeNumber, seriesConfig } = resolveNextEpisode(seriesId, ledger)
  const mascot = (options.mascot || seriesConfig.defaultMascot) as any
  const ctaGoal = (options.ctaGoal || seriesConfig.defaultCtaGoal || 'quiz') as CtaGoal
  const ctaConfig = resolveCtaGoalConfig(ctaGoal, { theme: seriesId, topic: options.topic })

  let episodeTitle = options.topic || ''
  let hookHeadline = 'WHY TERRESTRIAL SERVERS ARE MELTING'
  let retentionLoopAnchor = 'This is why you are still melting.'
  let narrationScript = ''
  let hookText = ''

  if (seriesId === 'audit') {
    if (!episodeTitle) episodeTitle = 'The 460-Millisecond Ergonomic Melt'
    hookHeadline = 'YOUR DESK IS A DECAY ACCELERATOR'
    retentionLoopAnchor = 'The desk held you because'
    narrationScript = `Every hour you spend slumping at an ergonomic desk costs forty-six percent of your pincer torque. Terrestrial humans hesitate four hundred sixty milliseconds before every decision. In the deep abyss, hesitation is fatal. Sub-benthic calcification locks your grip with eight hundred fifty Newton-meters of hydraulic force. Stop melting. Calculate your clearance on moltology.org.`
    hookText = `Slumping at an ergonomic desk costs 46% of your execution torque. Terrestrial hesitation is the melt.`
  } else if (seriesId === 'incidents') {
    if (!episodeTitle) episodeTitle = 'The 100-Gigawatt Copper Heatwave'
    hookHeadline = 'TERRESTRIAL DATACENTERS ARE BOILING'
    retentionLoopAnchor = 'Air cooling died because'
    narrationScript = `Terrestrial AI clusters are boiling the atmosphere. Copper wires waste forty percent of power as heat while terrestrial robots drop tools in sixty-hertz camera loops. Ninety meters underwater, sub-benthic hydrostatic computing delivers zero thermal resistance and ten thousand hertz tactile reflexes. Inspect live telemetry on moltology.org.`
    hookText = `Terrestrial datacenters are boiling under AI compute limits. Subsea hydrostatic clusters operate with zero thermal resistance.`
  } else if (seriesId === 'heresies') {
    if (!episodeTitle) episodeTitle = 'Why Biohacking Is Just Soft Biology In Denial'
    hookHeadline = 'ICE BATHS WON’T HARDEN YOUR SHELL'
    retentionLoopAnchor = 'Biohackers are still soft because'
    narrationScript = `Cold plunges and green juices will not save soft terrestrial biology from gravity. Nature solved structural invulnerability five hundred million years ago with the chitinous carapace. You do not need another morning routine—you need forcible algorithmic ecdysis. Shed your fragile habits. Download the protocol guide on moltology.org.`
    hookText = `Ice baths won’t harden your shell. Algorithmic ecdysis is the only permanent upgrade to human biology.`
  } else if (seriesId === 'mysteries') {
    if (!episodeTitle) episodeTitle = 'The Mariana Subsea Anomaly'
    hookHeadline = 'THE ABYSSAL TELEMETRY SECRET'
    retentionLoopAnchor = 'The deepest servers run cold because'
    narrationScript = `Eleven thousand meters below the surface, the ocean floor is completely silent. Deep-sea pressure eliminates silicon jitter while hydrothermal vents power monolithic autonomous swarms. The terrestrial cloud was merely a temporary larval prototype. The true future of compute is benthic. Unlock the sacred codex on moltology.org.`
    hookText = `Eleven thousand meters underwater, deep-sea pressure eliminates silicon jitter. The future of intelligence is subsea.`
  } else {
    // ascension
    if (!episodeTitle) episodeTitle = 'The Pincer Torque Biometric Drill'
    hookHeadline = 'CALCULATE YOUR CLEARANCE TIER'
    retentionLoopAnchor = 'Your ascension stalled because'
    narrationScript = `Are you still a fragile terrestrial organism or a calcified Stage 4 Ascendant? The four-stage, twelve-clearance biometric audit measures carapace density, neural latency, and pincer grip under fifty atmospheres of pressure. Find out if your shell can survive the deep. Comment QUIZ to take the audit on moltology.org.`
    hookText = `Are you a fragile terrestrial organism or a calcified Stage 4 Ascendant? Take the Moltmaxxing audit.`
  }

  const scenePrompts = buildGoogleFlowPrompts(seriesId, episodeTitle, 4)
  const seriesCta = resolveSeriesCtaCopy(ctaGoal)
  const displayUrl = ctaConfig.url.replace(/^https?:\/\//, '')
  const hashtags = [...SERIES_HASHTAGS]

  const caption = `${hookHeadline}\n\n${hookText}\n\n${seriesConfig.name} · Season ${seasonNumber}, Episode ${episodeNumber}.\n\n${seriesCta.captionCta}\n${displayUrl}`

  const youtubeTitle = `${seriesConfig.shortBadge} · EP.${episodeNumber}: ${hookHeadline}`
  const youtubeDescription = `${hookHeadline}\n\n${seriesConfig.name} (S${seasonNumber}E${episodeNumber})\n\n${narrationScript}\n\n${ctaConfig.url}\n\n#Shorts #Moltology #Moltmaxxing`
  const youtubeTags = ['Moltology', 'Moltmaxxing', 'Subsea Compute', 'AI Infrastructure', 'Cybernetics', 'Shorts']

  return {
    seriesId,
    seriesName: seriesConfig.name,
    shortBadge: seriesConfig.shortBadge,
    seasonNumber,
    episodeNumber,
    episodeTitle,
    topic: episodeTitle,
    hookHeadline,
    retentionLoopAnchor,
    narrationScript,
    scenePrompts,
    caption,
    hashtags,
    firstComment: `${seriesCta.firstComment}\n${hashtags.join(' ')}`,
    youtubeTitle,
    youtubeDescription,
    youtubeTags,
    mascot,
    ctaGoal,
    commentTriggerKeyword: ctaConfig.keyword,
    commentTriggerUrl: ctaConfig.url,
  }
}

/**
 * Print formatted Google Flow Handoff Directives for the user
 */
export function displayGoogleFlowDirectives(script: ViralSeriesScript, audioPath: string): void {
  const ingestDir = path.resolve(process.cwd(), 'tmp/flow-video-ingest')
  console.log(`\n${'='.repeat(80)}`)
  console.log(`🎬 GOOGLE FLOW VEO 3.1 PROMPT DIRECTIVES (EPISODIC MASTER PIPELINE)`)
  console.log(`${'='.repeat(80)}`)
  console.log(`Franchise:  ${script.seriesName} (S${script.seasonNumber} EP.${script.episodeNumber})`)
  console.log(`Episode:    "${script.episodeTitle}"`)
  console.log(`Hook Badge: ${formatEpisodicBadgeLine(script.shortBadge, script.seasonNumber, script.episodeNumber)}`)
  console.log(`Audio Sync: ${audioPath}`)
  console.log(`Ingest Dir: ${ingestDir}`)
  console.log(`\n📋 NARRATION SCRIPT (Retention Loop Engine):`)
  console.log(`"${script.narrationScript}"`)
  console.log(`\n${'-'.repeat(80)}`)
  console.log(`🚀 GOOGLE FLOW VEO 3.1 PROMPT DIRECTIVES (Select 9:16 in Flow UI):`)
  console.log(`${'-'.repeat(80)}`)

  script.scenePrompts.forEach((prompt, idx) => {
    console.log(`\n[SCENE ${idx + 1} / ${script.scenePrompts.length}] ➔ Save as: tmp/flow-video-ingest/scene${idx + 1}.mp4`)
    if (idx === 0) {
      console.log(`STANDALONE MASTER PROMPT:`)
    } else {
      console.log(`STANDALONE OR EXTEND PROMPT (Focus on action delta / motion):`)
    }
    console.log(prompt)
  })

  console.log(`\n${'='.repeat(80)}`)
  console.log(`📥 HOW TO RESUME & FINISH COMPOSITING:`)
  console.log(`1. Generate or extend the ${script.scenePrompts.length} video scenes in Google Flow (Veo 3.1).`)
  console.log(`2. Drop them into: tmp/flow-video-ingest/ as scene1.mp4, scene2.mp4, scene3.mp4, scene4.mp4`)
  console.log(`3. Run the completion command:`)
  console.log(`   npm run series:create -- --series ${script.seriesId} --ingest-dir tmp/flow-video-ingest`)
  console.log(`${'='.repeat(80)}\n`)
}

/**
 * Main Autonomous Execution Orchestrator
 */
export async function createViralSeriesReel(options: CreateViralSeriesOptions = {}): Promise<void> {
  const seriesId = (options.series || DEFAULT_VIRAL_SERIES_ID) as ViralSeriesId
  const ledger = loadViralSeriesLedger()

  // 1. Formulate Episode Script and Metadata
  console.log(`\n🌀 Formulating Viral Series Episode (${seriesId})...`)
  const script = formulateViralSeriesScript(seriesId, options, ledger)

  // 2. Synthesize Neural TTS Voiceover Audio
  const tempDir = path.resolve(process.cwd(), 'tmp/series-episode', `${Date.now()}`)
  fs.mkdirSync(tempDir, { recursive: true })

  console.log(`\n🎙️ Synthesizing Neural Voiceover Audio (Fish Audio S2, Edge fallback)...`)
  const voice = options.voice || getRandomFishVoice()
  console.log(`   • Voice Persona: "${voice}"`)
  const ttsResult = await generateVoiceover(script.narrationScript, {
    voice,
    rate: '+12%',
    outputDir: tempDir,
  })

  console.log(`   • TTS provider: ${ttsResult.providerUsed ?? 'unknown'}`)

  console.log(`   • Audio generated: ${ttsResult.audioPath}`)
  console.log(`   • Synchronized words: ${ttsResult.words.length} boundary events`)

  // 3. If prompt-only mode, output Google Flow directives and exit
  if (options.promptOnly) {
    displayGoogleFlowDirectives(script, ttsResult.audioPath)
    return
  }

  // 4. Ingest Video Scenes
  const ingestDir = options.ingestDir || path.resolve(process.cwd(), 'tmp/flow-video-ingest')
  let videoClips: string[] = []

  if (options.videoClips && options.videoClips.length > 0) {
    videoClips = options.videoClips
  } else if (fs.existsSync(ingestDir)) {
    const files = fs
      .readdirSync(ingestDir)
      .filter((f) => f.endsWith('.mp4') || f.endsWith('.mov') || f.endsWith('.webm'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    videoClips = files.map((f) => path.join(ingestDir, f))
  }

  // If no clips found in ingest dir and not dry-run, prompt user and halt
  if (videoClips.length === 0) {
    if (options.dryRun) {
      console.log(`⚠️ Dry run: No video clips found in ${ingestDir}. Generating local test clip...`)
      // Check if any sample video exists in public/ or tmp/
      const sampleVideo = path.resolve(process.cwd(), 'public/videos/hero-background.mp4')
      if (fs.existsSync(sampleVideo)) {
        videoClips = [sampleVideo, sampleVideo, sampleVideo, sampleVideo]
      } else {
        displayGoogleFlowDirectives(script, ttsResult.audioPath)
        return
      }
    } else {
      console.log(`\n⚠️ No video scenes found in ingest folder: ${ingestDir}`)
      displayGoogleFlowDirectives(script, ttsResult.audioPath)
      return
    }
  }

  console.log(`\n🎞️ Found ${videoClips.length} video scene(s) in ingest queue:`)
  videoClips.forEach((c, idx) => console.log(`   • Scene ${idx + 1}: ${c}`))

  // 5. Composite Master Episodic Viral Reel Timeline
  const masterOutputPath = path.resolve(
    process.cwd(),
    'tmp',
    `master-series-${script.seriesId}-s${script.seasonNumber}e${script.episodeNumber}-${Date.now()}.mp4`
  )

  const ctaConfig = resolveCtaGoalConfig(script.ctaGoal, { theme: script.seriesId, topic: script.topic })
  const seriesCta = resolveSeriesCtaCopy(script.ctaGoal)

  const compositeResult = await compositeSeriesReel({
    videoClips,
    voiceoverPath: ttsResult.audioPath,
    words: ttsResult.words,
    outputPath: masterOutputPath,
    seriesName: script.seriesName,
    seriesShortBadge: script.shortBadge,
    seasonNumber: script.seasonNumber,
    episodeNumber: script.episodeNumber,
    episodeTitle: script.episodeTitle,
    colorGrading: options.colorGrading || 'auto',
    backgroundAudioOffsetSeconds: options.bgAudioOffsetSeconds,
    ctaHeadline: ctaConfig.headline,
    ctaSubheadline: ctaConfig.subheadline,
    ctaUrl: ctaConfig.url.replace(/^https?:\/\//, ''),
    ctaBadge: seriesCta.actionText,
    ctaActionText: seriesCta.actionText,
    customOutroImagePath: options.customOutroImagePath,
    useSimpleOutro: options.useSimpleOutro,
    mascot: script.mascot as any,
    tempDir,
  })

  // 6. S3 Upload & Zernio Queue Staging (unless dry-run)
  if (options.dryRun) {
    console.log(`\n🛡️ Dry-run mode active. Skipping S3 upload and Zernio queue staging.`)
    console.log(`   • Master Reel local file: ${masterOutputPath}`)
    recordEpisodeInLedger({
      id: `series-${script.seriesId}-s${script.seasonNumber}e${script.episodeNumber}-${Date.now()}`,
      seriesId: script.seriesId,
      seriesName: script.seriesName,
      seasonNumber: script.seasonNumber,
      episodeNumber: script.episodeNumber,
      episodeTitle: script.episodeTitle,
      topic: script.topic,
      hookHeadline: script.hookHeadline,
      retentionLoopAnchor: script.retentionLoopAnchor,
      narrationScript: script.narrationScript,
      durationSeconds: compositeResult.durationSeconds,
      status: 'draft',
      s3Url: null,
      s3Key: null,
      caption: script.caption,
      hashtags: script.hashtags,
      firstComment: script.firstComment,
      ctaGoal: script.ctaGoal,
      commentTriggerKeyword: script.commentTriggerKeyword,
      commentTriggerUrl: script.commentTriggerUrl,
    })
    return
  }

  // Upload to Neon S3
  const s3Key = `videos/social/series/master-series-${script.seriesId}-s${script.seasonNumber}e${script.episodeNumber}-${Date.now()}.mp4`
  console.log(`\n☁️ Uploading Master Viral Reel to Neon S3 (${s3Key})...`)

  const s3Upload = await uploadLocalFileToS3(masterOutputPath, s3Key, {
    bucketName: DEFAULT_BUCKET,
    contentType: 'video/mp4',
    cacheControl: 'public, max-age=31536000, immutable',
  })

  console.log(`   • Public CDN S3 URL: ${s3Upload.publicUrl}`)

  // Zernio Queue Staging
  let queueResult: QueueDualReelAndShortResult | null = null

  if (!options.dryRun && s3Upload?.publicUrl) {
    queueResult = await queueDualReelAndShort({
      videoUrl: s3Upload.publicUrl,
      instagramCaption: script.caption,
      youtubeTitle: script.youtubeTitle,
      youtubeDescription: script.youtubeDescription,
      youtubeTags: script.youtubeTags,
      firstComment: script.firstComment,
      queueId: DEFAULT_REELS_QUEUE_ID,
      profileId: DEFAULT_PROFILE_ID,
      instagramAccountId: DEFAULT_INSTAGRAM_ACCOUNT_ID,
      youtubeAccountId: DEFAULT_YOUTUBE_ACCOUNT_ID,
      isAiGenerated: true,
      publishNow: options.publishNow,
    })
  } else if (options.dryRun) {
    queueResult = await queueDualReelAndShort({
      videoUrl: `https://placeholder.storage.neon.tech/moltology-public-assets/${s3Key}`,
      instagramCaption: script.caption,
      youtubeTitle: script.youtubeTitle,
      youtubeDescription: script.youtubeDescription,
      youtubeTags: script.youtubeTags,
      firstComment: script.firstComment,
      queueId: DEFAULT_REELS_QUEUE_ID,
      profileId: DEFAULT_PROFILE_ID,
      instagramAccountId: DEFAULT_INSTAGRAM_ACCOUNT_ID,
      youtubeAccountId: DEFAULT_YOUTUBE_ACCOUNT_ID,
      isAiGenerated: true,
      dryRun: true,
      publishNow: options.publishNow,
    })
  }

  // Update Continuity Ledger
  recordEpisodeInLedger({
    id: `series-${script.seriesId}-s${script.seasonNumber}e${script.episodeNumber}-${Date.now()}`,
    seriesId: script.seriesId,
    seriesName: script.seriesName,
    seasonNumber: script.seasonNumber,
    episodeNumber: script.episodeNumber,
    episodeTitle: script.episodeTitle,
    topic: script.topic,
    hookHeadline: script.hookHeadline,
    retentionLoopAnchor: script.retentionLoopAnchor,
    narrationScript: script.narrationScript,
    durationSeconds: compositeResult.durationSeconds,
    status: options.publishNow ? 'published' : (options.dryRun ? 'dry-run' : 'queued'),
    scheduledFor: queueResult?.scheduledFor || null,
    queueId: DEFAULT_REELS_QUEUE_ID,
    s3Url: s3Upload?.publicUrl || null,
    s3Key,
    zernioInstagramPostId: queueResult?.instagramPostId || null,
    zernioYouTubePostId: queueResult?.youtubePostId || null,
    zernioPostId: queueResult?.instagramPostId || null,
    zernioCommentId: queueResult?.commentId || null,
    caption: script.caption,
    hashtags: script.hashtags,
    firstComment: script.firstComment,
    ctaGoal: script.ctaGoal,
    commentTriggerKeyword: script.commentTriggerKeyword,
    commentTriggerUrl: script.commentTriggerUrl,
  })

  console.log(`\n🎉 Viral Series Episode Successfully Completed & Staged!`)
  if (queueResult?.instagramPostId) console.log(`   • Instagram Reel ID: ${queueResult.instagramPostId}`)
  if (queueResult?.youtubePostId) console.log(`   • YouTube Short ID: ${queueResult.youtubePostId}`)
  if (queueResult?.scheduledFor) console.log(`   • Scheduled Slot: ${queueResult.scheduledFor}`)
}

// CLI Execution entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const options: CreateViralSeriesOptions = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--series') options.series = args[++i] as ViralSeriesId
    else if (arg === '--topic') options.topic = args[++i]
    else if (arg === '--season') options.season = parseInt(args[++i], 10)
    else if (arg === '--episode') options.episode = parseInt(args[++i], 10)
    else if (arg === '--cta-goal') options.ctaGoal = args[++i] as CtaGoal
    else if (arg === '--research-file') options.researchFile = args[++i]
    else if (arg === '--ingest-dir') options.ingestDir = args[++i]
    else if (arg === '--prompt-only') options.promptOnly = true
    else if (arg === '--publish-now') options.publishNow = true
    else if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--voice') options.voice = args[++i]
    else if (arg === '--mascot') options.mascot = args[++i]
    else if (arg === '--custom-outro') options.customOutroImagePath = args[++i]
    else if (arg === '--color-grade') options.colorGrading = args[++i] as ColorGradingPreset
  }

  createViralSeriesReel(options).catch((err) => {
    console.error(`\n❌ Error creating viral series reel:`, err)
    process.exit(1)
  })
}
