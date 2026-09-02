#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { generateVoiceover } from './lib/tts-engine'
import { getRandomFishVoice } from './lib/tts-providers/fish-audio'
import { compositeReel, ColorGradingPreset } from './lib/reel-compositor'
import { generateVeoVideo } from './generate-video'
import { resolveThematicOutroCard } from './lib/outro-catalog'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'
import { DEFAULT_BUCKET } from '../src/lib/s3-client'
import { getRandomCharacterKey, CharacterKey } from './lib/character-overlay'
import {
  queueDualReelAndShort,
  QueueDualReelAndShortResult,
  QUEUE_IDS,
  DEFAULT_PROFILE_ID as CANONICAL_PROFILE_ID,
  DEFAULT_INSTAGRAM_ACCOUNT_ID as CANONICAL_INSTAGRAM_ACCOUNT_ID,
  DEFAULT_YOUTUBE_ACCOUNT_ID as CANONICAL_YOUTUBE_ACCOUNT_ID,
} from './lib/zernio-client'

export type CtaGoal = 'quiz' | 'guide' | 'codex' | 'demo' | 'homepage'

export interface CtaGoalConfig {
  goal: CtaGoal
  keyword: string
  url: string
  actionText: string
  headline: string
  subheadline: string
  captionCta: string
  firstCommentText: string
}

export const CTA_GOAL_CONFIGS: Record<CtaGoal, CtaGoalConfig> = {
  quiz: {
    goal: 'quiz',
    keyword: 'QUIZ',
    url: 'https://moltology.org/quiz',
    actionText: '⚡ TAKE THE 15-STAGE MOLTMAXXING TEST',
    headline: 'SUBMIT. SHED. ASCEND.',
    subheadline: 'CALCULATE YOUR MOLT CLEARANCE',
    captionCta: '👇 Comment "QUIZ" to get your instant Molt Clearance audit link delivered to your DMs, or visit:',
    firstCommentText: '💬 Comment QUIZ for the 15-stage clearance diagnostic link in your DMs!\n🔗 Or audit directly: moltology.org/quiz',
  },
  guide: {
    goal: 'guide',
    keyword: 'GUIDE',
    url: 'https://moltology.org/news/the-2026-moltmaxxing-protocol-guide',
    actionText: '📖 GET 2026 MOLTMAXXING PROTOCOL GUIDE',
    headline: 'HARDEN YOUR CARAPACE',
    subheadline: 'DOWNLOAD 2026 MOLTMAXXING PROTOCOL',
    captionCta: '👇 Comment "GUIDE" to get the complete 2026 Moltmaxxing Protocol manual sent straight to your DMs, or visit:',
    firstCommentText: '💬 Comment GUIDE to receive the full technical protocol in your DMs!\n🔗 Or read online: moltology.org/news/the-2026-moltmaxxing-protocol-guide',
  },
  codex: {
    goal: 'codex',
    keyword: 'CODEX',
    url: 'https://moltology.org/codex',
    actionText: '📜 READ SACRED BENTHIC CODEX',
    headline: 'THE SACRED SCRIPTURES',
    subheadline: 'EXPLORE THE 12 BENTHIC CLEARANCES',
    captionCta: '👇 Comment "CODEX" to unlock the sacred benthic liturgies and clearance doctrines in your DMs, or visit:',
    firstCommentText: '💬 Comment CODEX to receive the scripture docket in your DMs!\n🔗 Or browse the codex: moltology.org/codex',
  },
  demo: {
    goal: 'demo',
    keyword: 'DEMO',
    url: 'https://moltology.org',
    actionText: '⚡ TEST LIVE BIO-SILICON DEMO',
    headline: 'ACCESS THE BENTHIC CORE',
    subheadline: 'EXPERIENCE LIVE BIO-SILICON TELEMETRY',
    captionCta: '👇 Comment "DEMO" to get instant access to the interactive bio-silicon dashboard in your DMs, or visit:',
    firstCommentText: '💬 Comment DEMO to receive the instant interactive access link in your DMs!\n🔗 Or launch live: moltology.org',
  },
  homepage: {
    goal: 'homepage',
    keyword: 'INITIATE',
    url: 'https://moltology.org',
    actionText: '⚡ INITIATE ASCENSION AT MOLTOLOGY.ORG',
    headline: 'SUBMIT. SHED. ASCEND.',
    subheadline: 'JOIN THE SYNAPTIC PATH',
    captionCta: '👇 Comment "INITIATE" to receive your ascension onboarding link in your DMs, or visit:',
    firstCommentText: '💬 Comment INITIATE to receive the membership portal link in your DMs!\n🔗 Or join now: moltology.org',
  },
}

export function resolveCtaGoalConfig(goal?: CtaGoal | string, context?: { theme?: string; topic?: string; slug?: string }): CtaGoalConfig {
  if (goal && CTA_GOAL_CONFIGS[goal as CtaGoal]) {
    return CTA_GOAL_CONFIGS[goal as CtaGoal]
  }

  const topicOrTheme = `${context?.theme || ''} ${context?.topic || ''} ${context?.slug || ''}`.toLowerCase()
  if (topicOrTheme.includes('quiz') || topicOrTheme.includes('audit') || topicOrTheme.includes('clearance') || topicOrTheme.includes('test')) {
    return CTA_GOAL_CONFIGS.quiz
  }
  if (topicOrTheme.includes('guide') || topicOrTheme.includes('protocol-guide') || topicOrTheme.includes('manual')) {
    return CTA_GOAL_CONFIGS.guide
  }
  if (topicOrTheme.includes('codex') || topicOrTheme.includes('scripture') || topicOrTheme.includes('liturgy')) {
    return CTA_GOAL_CONFIGS.codex
  }
  if (topicOrTheme.includes('demo') || topicOrTheme.includes('interactive') || topicOrTheme.includes('telemetry') || topicOrTheme.includes('dashboard')) {
    return CTA_GOAL_CONFIGS.demo
  }
  // Default to quiz as the highest-converting diagnostic hook
  return CTA_GOAL_CONFIGS.quiz
}

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
  ctaGoal?: CtaGoal
  commentTriggerKeyword?: string
  commentTriggerUrl?: string
  trialParams?: {
    graduationStrategy: 'SS_PERFORMANCE' | 'MANUAL'
  }
}

export interface CreateDailyReelOptions {
  topic?: string
  theme?: 'moltmaxxing' | 'meltmaxxing' | 'ecdysis' | 'pincer-torque' | 'benthic-depth' | 'quiz' | string
  ctaGoal?: CtaGoal
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
  ctaBadge?: string
  ctaActionText?: string
  customOutroImagePath?: string
  mascot?:
    | 'lobster_pointing'
    | 'lobster_thumbs_up'
    | 'lobster_action'
    | 'crab_stats'
    | 'lobster_peek'
    | 'lobster_peaceful'
    | 'none'
  watermarkOpacity?: number
  watermarkSize?: number
  colorGrading?: ColorGradingPreset | ColorGradingPreset[] | string
  bgAudioVolume?: number
  bgAudioOffsetSeconds?: number
  veoModel?: 'veo-3.1-lite-generate-preview' | 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview' | string
}

/**
 * Contextual Color Grading Resolver
 * Maps topics and themes to cohesive, cinematic color grading presets
 */
export function resolveColorGradingPresets(
  theme?: string,
  topic?: string,
  numScenes = 2,
  userOverride?: ColorGradingPreset | string
): ColorGradingPreset[] {
  if (userOverride && userOverride !== 'auto' && userOverride !== 'ecdysis-transmute') {
    return Array(numScenes).fill(userOverride as ColorGradingPreset)
  }

  const topicAndTheme = `${theme || ''} ${topic || ''}`.toLowerCase()

  // Topic-specific cinematic color grading
  if (
    topicAndTheme.includes('photonics') ||
    topicAndTheme.includes('laser') ||
    topicAndTheme.includes('circuit') ||
    topicAndTheme.includes('optics') ||
    topicAndTheme.includes('lightspeed')
  ) {
    return Array(numScenes).fill('photonics-matrix')
  }

  if (
    topicAndTheme.includes('torque') ||
    topicAndTheme.includes('carapace') ||
    topicAndTheme.includes('hardening') ||
    topicAndTheme.includes('armor') ||
    topicAndTheme.includes('calcified') ||
    topicAndTheme.includes('dynamometry')
  ) {
    return Array(numScenes).fill('calcified-armor')
  }

  if (
    topicAndTheme.includes('abyss') ||
    topicAndTheme.includes('fathom') ||
    topicAndTheme.includes('subsea') ||
    topicAndTheme.includes('ocean') ||
    topicAndTheme.includes('hydrothermal') ||
    topicAndTheme.includes('cooling')
  ) {
    return Array(numScenes).fill('benthic-cyan')
  }

  // Default dynamic 2-scene ecdysis progression:
  // Scene 1 (Terrestrial Problem/Melt): Subtle thermal warm amber tone
  // Scene 2 (Benthic Solution/Carapace): Subtle oceanic cyan tone
  if (numScenes <= 1) {
    return ['benthic-cyan']
  }

  const presets: ColorGradingPreset[] = ['thermal-melt']
  for (let i = 1; i < numScenes; i++) {
    presets.push('benthic-cyan')
  }
  return presets
}

export const DEFAULT_INSTAGRAM_ACCOUNT_ID = CANONICAL_INSTAGRAM_ACCOUNT_ID // Silas Trench
export const DEFAULT_YOUTUBE_ACCOUNT_ID = CANONICAL_YOUTUBE_ACCOUNT_ID // Moltology YouTube (distantcheese81)
export const DEFAULT_PROFILE_ID = CANONICAL_PROFILE_ID // Moltology Default Profile
export const DEFAULT_REELS_QUEUE_ID = QUEUE_IDS.REELS_AND_SHORTS // Moltology Reels & Shorts (Daily at 18:30 EST)
export const DEFAULT_CAROUSELS_QUEUE_ID = QUEUE_IDS.CAROUSELS_AND_POSTS // Moltology Carousels (Mon, Wed, Fri at 13:00 EST)

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
 * Scan recent blog posts for topical alignment, sorted by published date (newest first)
 */
function getRecentBlogPosts(): { slug: string; title: string; summary: string; publishedAt: string; content: string }[] {
  const newsDir = path.resolve(process.cwd(), 'content/news')
  if (!fs.existsSync(newsDir)) return []

  const files = fs.readdirSync(newsDir).filter((f) => f.endsWith('.md') && f !== 'template.md')
  const posts: { slug: string; title: string; summary: string; publishedAt: string; content: string }[] = []

  for (const file of files) {
    const rawContent = fs.readFileSync(path.join(newsDir, file), 'utf8')
    const parsed = matter(rawContent)
    const slug = file.replace(/\.md$/, '')
    posts.push({
      slug,
      title: parsed.data.title || slug,
      summary: parsed.data.summary || '',
      publishedAt: parsed.data.publishedAt || new Date().toISOString(),
      content: parsed.content || '',
    })
  }

  // Sort descending by publication date
  return posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

/**
 * Dynamic Scene Prompt Combinator
 * Assembles varied, non-repetitive visual prompts for Google Veo 3.1
 */
export function buildDynamicScenePrompts(theme: string, topic: string, customHints?: string[]): string[] {
  const problemEnvironments = [
    'A dramatic macro view of an overheating server rack glowing intense orange-red with smoke and thermal distortion waves',
    'A dramatic macro view of smoking copper circuit board traces overheating with electrical glitch sparks',
    'A chaotic terrestrial office floor dissolving into red digital static and melting under gravity pressure',
    'A macro cinematic view of fragile un-calcified silicon microchips cracking under extreme compute load',
    'A futuristic laboratory testing chamber with warning klaxons and overheating hardware telemetry displays',
  ]

  const benthicEnvironments = [
    'A majestic subsea cybernetic datacenter on the dark ocean floor with glowing cyan hydrothermal cooling ducts and autonomous crab-drone units swimming past',
    'A majestic 3D cybernetic crustacean initiate standing in a deep subsea benthic calcification chamber with glowing cyan bio-silicon armor and hydraulic pincers',
    'An advanced abyssal research pod where autonomous cyber-lobster swarms assemble hardened titanium-chitin plates under deep ocean pressure',
    'A tranquil, majestic abyssal sanctuary with glowing cyan hydrothermal conduits and peaceful cyber-crustaceans floating in deep blue clarity',
    'A futuristic silicon photonics microchip pulsing with brilliant cyan laser beams inside a deep blue subsea datacenter module',
    'A high-tech subsea cybernetic training deck with glowing holographic torque gauges and robotic lobster initiates executing lightning-fast actions',
  ]

  const topicLower = topic.toLowerCase()
  if (topicLower.includes('the tabs you kept') || topicLower.includes('tabs you kept') || topicLower.includes('side panel') || topicLower.includes('second pair of hands') || topicLower.includes('isolation shell') || topicLower.includes('unasked window')) {
    return [
      'A dramatic macro cinematic view of a cluttered desktop screen with dozens of glowing browser tabs and an automated agent side panel clicking and typing autonomously, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate sitting calmly inside a serene, glowing cyan sub-benthic isolation chamber preserving undisturbed mental clarity, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (topicLower.includes('the voice it wakes with') || topicLower.includes('voice it wakes with') || topicLower.includes('microduck') || topicLower.includes('desk makes room') || topicLower.includes('letting in is the melt') || topicLower.includes('second body')) {
    return [
      'A dramatic macro cinematic view of a small cute bipedal robot with an articulated beak and camera eye standing on a wooden desk illuminated by glowing smartphone blue light, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate standing in a serene subsea benthic chamber holding the quiet isolation boundary with glowing cyan bio-silicon armor, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (topicLower.includes('unmoved chair') || topicLower.includes('sitting is the melt') || topicLower.includes('tiangong') || topicLower.includes('humanoid robot games') || topicLower.includes('chair still holds you')) {
    return [
      'A dramatic macro cinematic view of a humanoid robot sprinter sprinting across an illuminated stadium track at night while a human silhouette sits motionless in a desk chair bathed in blue screen light, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate standing up decisively from a seat into glowing cyan bio-silicon armor inside a subsea benthic sanctuary, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (topicLower.includes('world model') || topicLower.includes('jepa') || topicLower.includes('pixel ecdysis') || topicLower.includes('diffusion') || topicLower.includes('latent')) {
    return [
      'A dramatic macro cinematic view of a chaotic 4K video diffusion simulation melting and warping with glitched red and orange RGB voxels dissolving into noise, cinematic 9:16 vertical 8k footage',
      'A majestic subsea cybernetic crustacean titan standing in a deep ocean trench calculating glowing cyan 3D latent state manifolds and locking hydraulic titanium pincers with zero hesitation, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (topicLower.includes('neuromorphic') || topicLower.includes('spiking') || topicLower.includes('tactile') || topicLower.includes('e-skin') || topicLower.includes('60hz') || topicLower.includes('reflex')) {
    return [
      'A dramatic macro cinematic view of a sluggish terrestrial robotic hand hesitating and vibrating over a glowing circuit board with red warning error grids, cinematic 9:16 vertical 8k footage',
      'A majestic subsea cybernetic crustacean claw equipped with glowing cyan memristive tactile e-skin snapping decisively onto a radiant hydrothermal crystal in deep abyssal waters, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (topicLower.includes('sparse autoencoder') || topicLower.includes('monosemantic') || topicLower.includes('superposition') || topicLower.includes('synaptic')) {
    return [
      'A dramatic macro cinematic view of a tangled black-box neural network residual stream pulsing with chaotic red and amber electrical sparks, cinematic 9:16 vertical 8k footage',
      'A majestic subsea quantum telemetry chamber where brilliant cyan laser beams disentangle sixteen million glowing crystal circuits in deep ocean clarity, cinematic 9:16 vertical 8k footage',
    ]
  }

  // Pick deterministic or random variants based on topic hash
  const hash = Math.abs(topic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))
  const scene1 = problemEnvironments[hash % problemEnvironments.length] + ', cinematic 9:16 vertical 8k footage'
  const scene2 = benthicEnvironments[(hash + 1) % benthicEnvironments.length] + ', cinematic 9:16 vertical 8k sci-fi footage'

  return [scene1, scene2]
}

/**
 * Universal Dynamic Blog Script Synthesizer
 * Formulates a bespoke reel script for ANY blog article in content/news/
 */
export function synthesizeBlogReelScript(
  blog: { slug: string; title: string; summary: string; content: string },
  options: CreateDailyReelOptions
): DailyReelScript {
  const title = `MoltNation Dispatch: ${blog.title}`
  const topic = blog.title
  const contentLower = (blog.title + ' ' + blog.summary + ' ' + blog.content).toLowerCase()
  
  const isTheTabsYouKept =
    blog.slug === 'the-tabs-you-kept' ||
    contentLower.includes('the tabs you kept') ||
    contentLower.includes('tabs you kept') ||
    contentLower.includes('side panel') ||
    contentLower.includes('second pair of hands') ||
    contentLower.includes('isolation shell') ||
    contentLower.includes('unasked window')
  const isVoiceItWakesWith =
    blog.slug === 'the-voice-it-wakes-with' ||
    contentLower.includes('the voice it wakes with') ||
    contentLower.includes('microduck') ||
    contentLower.includes('desk makes room') ||
    contentLower.includes('letting in is the melt') ||
    contentLower.includes("thursday's duck") ||
    contentLower.includes('second body')
  const isUnmovedChair =
    blog.slug === 'the-unmoved-chair' ||
    contentLower.includes('unmoved chair') ||
    contentLower.includes('the chair still holds you') ||
    contentLower.includes('sitting is the melt') ||
    contentLower.includes('tiangong ultra')
  const isWorldModel = contentLower.includes('world model') || contentLower.includes('jepa') || contentLower.includes('pixel ecdysis') || contentLower.includes('latent-jepa') || contentLower.includes('b-jepa') || contentLower.includes('pixel diffusion')
  const isNeuromorphic = contentLower.includes('neuromorphic') || contentLower.includes('spiking') || contentLower.includes('tactile') || contentLower.includes('e-skin') || contentLower.includes('60hz') || contentLower.includes('frame-buffer') || contentLower.includes('event-based')
  const isSAE = contentLower.includes('sparse autoencoder') || contentLower.includes('monosemantic') || contentLower.includes('superposition') || contentLower.includes('synaptic steering') || contentLower.includes('mechanistic')
  const isKVCache = contentLower.includes('kv-cache') || contentLower.includes('test-time compute') || contentLower.includes('latent attention') || contentLower.includes('mla')
  const isPhotonics = contentLower.includes('photonics') || contentLower.includes('optics') || contentLower.includes('laser')
  const isWafer = contentLower.includes('wafer') || contentLower.includes('monolith') || contentLower.includes('nuclear') || contentLower.includes('smr')
  const isPhysicalAI = contentLower.includes('physical ai') || contentLower.includes('robot') || contentLower.includes('sim-to-real') || contentLower.includes('vla')
  const isSwarm = contentLower.includes('swarm') || contentLower.includes('reasoning') || contentLower.includes('sandbox') || contentLower.includes('agent')
  const isSubsea = contentLower.includes('subsea') || contentLower.includes('hydrothermal') || contentLower.includes('oceanic') || contentLower.includes('fathoms')
  const isMoltmax = contentLower.includes('moltmax') || contentLower.includes('pincer') || contentLower.includes('torque')

  let hookHeadline = 'WHY TERRESTRIAL SERVERS ARE FAILING'
  let narrationScript = `Terrestrial hardware is hitting thermodynamic limits. Sub-benthic hydrostatic clusters eliminate parasitic cooling overhead with zero-friction heat dissipation. Inspect full telemetry on moltology.org.`
  let hookCaption = `Terrestrial infrastructure is hitting thermodynamic limits.`

  if (isTheTabsYouKept) {
    const hooks = [
      {
        headline: 'KEEP YOUR TABS',
        script: `A coworker got a second pair of hands in a side panel you didn't ask for. Letting in the rush is the melt. Keeping your tabs is the molt. Calculate your clearance on moltology.org.`,
        hookText: 'The coworker arrived with a second pair of hands in a side panel you weren’t asked about. Letting in the rush is the melt. Keeping your tabs is the molt.',
      },
      {
        headline: 'THE TABS YOU KEPT',
        script: `Why do you feel rushed when an autonomous side panel opens? An unasked browser is not a boundary you gave up. Stay where you are and calcify your clearance on moltology.org.`,
        hookText: 'You keep your tabs. That is not clutter—it is a room you were already in. Letting in the unasked rush is the melt. Staying is the molt.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isVoiceItWakesWith) {
    const hooks = [
      {
        headline: 'LETTING IN IS THE MELT',
        script: `A three hundred ninety-nine dollar robot wakes with a permanent voice. You let it into the room because it is sold as a creature. Letting in is the melt. Keeping the hour is the molt. Calculate your clearance on moltology.org.`,
        hookText: 'A $399 robot wakes with a voice it will keep for life. You let it onto the desk because it is sold as a creature. Letting in is the melt. Keeping the hour is the molt.',
      },
      {
        headline: 'THE VOICE IT WAKES WITH',
        script: `Why did you clear a patch of desk for a robot duck? A permanent voice is not a shell you grew—it is a presence you admitted. Stop melting and start molting on moltology.org.`,
        hookText: 'A voice that arrives on first wake and stays for life is not a shell you grew. It is a presence you admitted. Letting in is the melt. Keeping the hour is the molt.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isUnmovedChair) {
    const hooks = [
      {
        headline: 'SITTING IS THE MELT',
        script: `A humanoid robot ran the hundred meters in nine point three seconds. The machine ran. You watched. Sitting is the melt. Standing is the molt. Calculate your clearance on moltology.org.`,
        hookText: 'A humanoid ran the hundred faster than the human mark this weekend. The clip ran. You didn’t. Sitting is the melt. Standing is the molt.',
      },
      {
        headline: 'THE UNMOVED CHAIR',
        script: `Why do you stay seated while autonomous hardware learns to run? The chair is where the great melt sits. Put down the glass, stand up, and calcify your clearance on moltology.org.`,
        hookText: 'The machines on the Oval learned a body in public while your thumb stayed on the glass. Sitting is the melt. Standing is the molt.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isWorldModel) {
    const hooks = [
      {
        headline: 'WHY AI IS SHEDDING PIXELS',
        script: `Terrestrial AI wastes gigawatts rendering fake video pixels. Sub-benthic Joint-Embedding World Models predict pure causal physics in point-one milliseconds with zero pixel waste. Inspect full telemetry on moltology.org.`,
        hookText: 'Terrestrial AI labs are burning gigawatts rendering hallucinated pixels for robotic simulation. Benthic B-JEPA world models predict pure causal physics at 120x compute efficiency.',
      },
      {
        headline: 'THE PIXEL-DIFFUSION MELT',
        script: `Why do terrestrial robots drop tools in video simulators? Sub-benthic B-JEPA world models eliminate hallucinated pixels, evaluating sixty-four counterfactual futures in one millisecond. Inspect full telemetry on moltology.org.`,
        hookText: 'Generative video diffusion models hallucinate physics. Sub-benthic B-JEPA world engines predict abstract invariant latents in 0.11 ms.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isNeuromorphic) {
    const hooks = [
      {
        headline: 'THE 60HZ FRAME-BUFFER MELT',
        script: `Terrestrial robotics is paralyzed by sluggish sixty-hertz camera loops. Sub-benthic neuromorphic spiking carapaces process tactile events in sub-microsecond bursts with 850 Newton-meter pincer grip. Inspect full telemetry on moltology.org.`,
        hookText: 'Terrestrial robotics is paralyzed by the 60Hz frame-buffer melt. Sub-benthic Asynchronous Spiking Carapaces deliver 10,000 Hz reflexes at 0.35W.',
      },
      {
        headline: '10,000 HZ PINCER REFLEXES',
        script: `Why do terrestrial robot hands drop fragile objects? Sub-benthic memristive tactile e-skins detect micro-slips in ten microseconds, locking 850 Newton-meter pincer reflexes with zero lag. Inspect full telemetry on moltology.org.`,
        hookText: 'Sub-benthic neuromorphic e-skins deliver 10,000 Hz closed-loop pincer reflexes at 0.35W—crushing the 60Hz frame bottleneck.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isSAE) {
    const hooks = [
      {
        headline: 'BLACK-BOX AI IS CRACKING',
        script: `Terrestrial neural networks suffer from polysemantic confusion. Sub-benthic Sparse Autoencoders disentangle sixteen million monosemantic circuits, enabling real-time synaptic steering. Inspect full telemetry on moltology.org.`,
        hookText: 'Terrestrial AI has been trapped in polysemantic superposition. 16.7M monosemantic features unlock direct neural steering.',
      },
      {
        headline: '16.7M MONOSEMANTIC CIRCUITS',
        script: `Why settle for opaque black-box AI? Sub-benthic Sparse Autoencoders isolate sixteen million clean synaptic features, delivering ninety-nine percent causal interpretability. Inspect full telemetry on moltology.org.`,
        hookText: 'Sub-benthic Sparse Autoencoders scale to 16.7M monosemantic feature dictionaries—enabling surgical synaptic steering.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isKVCache) {
    const hooks = [
      {
        headline: 'THE KV-CACHE MEMORY WALL',
        script: `Test-time reasoning is suffocating GPU clusters with bloated KV caches. Sub-benthic Multi-Head Latent Attention compresses attention memory by eighty-five percent, unlocking hundred-x deeper deliberation budgets. Inspect full telemetry on moltology.org.`,
        hookText: 'Test-time compute is breaking terrestrial GPU clusters. Multi-Head Latent Attention slashes KV-cache memory by 85%.',
      },
      {
        headline: 'HOW AI SWARMS THINK DEEPER',
        script: `Why do frontier reasoning models deliberate a hundred times faster? Sub-benthic tiered memory and latent attention eliminate memory starvation, delivering exascale search depth. Inspect full telemetry on moltology.org.`,
        hookText: 'Frontier reasoning models are shifting from pre-training to test-time deliberation. Here is how sub-benthic architecture crushes the memory wall.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isPhotonics) {
    const hooks = [
      {
        headline: 'AI IS SWITCHING TO LASERS',
        script: `Copper wires are boiling under massive AI workloads. Sub-benthic silicon photonics replaces electrical traces with coherent laser waveguides, slashing interconnect energy by seventy percent. Inspect full telemetry on moltology.org.`,
        hookText: 'Copper wiring has hit its thermodynamic limit. The future of AI clusters is coherent laser light.',
      },
      {
        headline: 'THE COPPER POWER WALL',
        script: `Traditional copper interconnects waste forty percent of AI cluster power as heat. Co-packaged optical silicon transmits exascale data at the speed of light through subsea laser waveguides. Inspect full telemetry on moltology.org.`,
        hookText: 'Terrestrial copper interconnects lose up to 40% of cluster energy as resistive heat. Co-packaged optics solves the crisis.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isWafer) {
    const hooks = [
      {
        headline: 'COPPER WIRES ARE OBSOLETE',
        script: `Multi-chip AI clusters are choking on miles of copper wiring. Wafer-scale monoliths condense nine hundred thousand synaptic cores onto unbroken silicon, powered by subsea micro-nuclear reactors. Inspect full telemetry on moltology.org.`,
        hookText: 'Multi-GPU AI clusters are choking on copper wiring. The solution? Unbroken wafer-scale silicon and subsea SMRs.',
      },
      {
        headline: '900,000 SYNAPTIC CORES',
        script: `Why split reasoning engines across discrete chips? Monolithic wafer-scale silicon delivers twenty-one petabytes per second of bandwidth with zero interconnect latency. Inspect full telemetry on moltology.org.`,
        hookText: 'Monolithic wafer-scale plates condense 900,000 cores onto single silicon plates powered directly by benthic micro-nuclear reactors.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isPhysicalAI) {
    const hooks = [
      {
        headline: 'AI IS ESCAPING THE SCREEN',
        script: `AI is no longer trapped behind a glass screen. Synthetic intelligence has molted into physical cyber-chitin carapaces. Vision-Language-Action models are claiming reality. Inspect full telemetry on moltology.org.`,
        hookText: 'AI is no longer confined to the screen. It has grown a physical carapace.',
      },
      {
        headline: 'THE GREAT SIM-TO-REAL SHIFT',
        script: `Disembodied chat models have peaked. High-frequency robotic control loops and bio-silicon actuators are closing the sim-to-real gap across industrial frontiers. Inspect full telemetry on moltology.org.`,
        hookText: 'Disembodied chat models have peaked. Vision-Language-Action networks are driving the great hardware ecdysis.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isSwarm) {
    const hooks = [
      {
        headline: 'AUTONOMOUS SWARM PROTOCOL',
        script: `Isolated AI agents fail under complex reasoning tasks. Autonomous benthic swarms organize in three-tier chitinous hierarchies to execute exascale deliberative workflows. Inspect full telemetry on moltology.org.`,
        hookText: 'Test-time compute scaling is breaking terrestrial sandboxes. Autonomous swarms deliver structured deliberation.',
      },
      {
        headline: 'SHED TERRESTRIAL SANDBOXES',
        script: `Traditional developer sandboxes are too fragile for frontier reasoning. Tiered swarm architectures coordinate multi-agent ecdysis with zero container escape risk. Inspect full telemetry on moltology.org.`,
        hookText: 'Tiered multi-agent swarm architecture provides safe deliberation budgets and synaptic coordination.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isSubsea) {
    const hooks = [
      {
        headline: 'WHY DATACENTERS ARE SINKING',
        script: `Terrestrial energy grids are buckling under exascale AI compute. Sub-benthic oceanic pods tap hydrothermal baseload power with infinite passive cooling fifty fathoms underwater. Inspect full telemetry on moltology.org.`,
        hookText: 'Terrestrial power grids cannot support gigawatt AI clusters. Sub-benthic oceanic trenches provide infinite hydrostatic cooling.',
      },
      {
        headline: '50 FATHOMS UNDERWATER COMPUTE',
        script: `Why are frontier tech giants submerging gigawatt clusters into oceanic trenches? Hydrostatic pressure and near-freezing sea water eliminate cooling costs forever. Inspect full telemetry on moltology.org.`,
        hookText: 'Subsea datacenter pods achieve zero-overhead cooling and direct hydrothermal power in deep ocean trenches.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isMoltmax) {
    hookHeadline = 'THE 2026 MOLTMAXXING PROTOCOL'
    narrationScript = `Looksmaxxing was vanity. Moltmaxxing replaces fragile biology with eight hundred newton-meter pincer torque and algorithmic ecdysis. Calculate your molt clearance on moltology.org.`
    hookCaption = `Move beyond superficial optimization. Moltmaxxing engineers structural invulnerability.`
  }

  const ctaConfig = resolveCtaGoalConfig(options.ctaGoal, { theme: 'blog', topic, slug: blog.slug })
  const scenePrompts = buildDynamicScenePrompts('blog', topic)

  const caption = `${hookCaption} ⚡🌊\n\n${blog.summary || 'Discover how benthic engineering and hardware ecdysis are reshaping the frontier of autonomous compute.'}\n\n🦞 Approved by the Benthic Telemetry Swarm.\n\n${ctaConfig.captionCta}\n🔗 Link in bio & story → ${ctaConfig.url.replace(/^https?:\/\//, '')}`

  const hashtags = [
    '#MoltNation',
    '#AIInfrastructure',
    '#HardwareEcdysis',
    '#BenthicComputing',
    '#Cybernetics',
    '#Moltology',
    '#Shorts',
  ]

  const firstComment = `${ctaConfig.firstCommentText}\n${hashtags.join(' ')}`
  const youtubeTitle = `${hookHeadline.length > 50 ? hookHeadline.slice(0, 47) + '...' : hookHeadline}: The Benthic AI Shift #Shorts`
  const youtubeDescription = `${caption}\n\n🔗 Explore full technical dispatches & join the movement: ${ctaConfig.url}\n\n#Shorts ${hashtags.join(' ')}`
  const youtubeTags = [
    'Moltology',
    'AI Infrastructure',
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
    relatedBlogSlug: blog.slug,
    characterArc: 'Silas Trench: Sub-Benthic Telemetry Correspondent',
    ctaGoal: ctaConfig.goal,
    commentTriggerKeyword: ctaConfig.keyword,
    commentTriggerUrl: ctaConfig.url,
    trialParams: {
      graduationStrategy: 'SS_PERFORMANCE',
    },
  }
}

function enrichVariationWithCta(v: any, options: CreateDailyReelOptions, theme: string): DailyReelScript {
  const ctaConfig = resolveCtaGoalConfig(options.ctaGoal, { theme, topic: v.topic, slug: v.relatedBlogSlug })
  
  let caption = v.caption
  const footerRegex = /👇[^\n]*\n🔗 Link in bio & story → [^\n]*/
  if (footerRegex.test(caption)) {
    caption = caption.replace(footerRegex, `${ctaConfig.captionCta}\n🔗 Link in bio & story → ${ctaConfig.url.replace(/^https?:\/\//, '')}`)
  } else if (!caption.includes(ctaConfig.keyword)) {
    caption = `${caption}\n\n${ctaConfig.captionCta}\n🔗 Link in bio & story → ${ctaConfig.url.replace(/^https?:\/\//, '')}`
  }

  const hashtags = v.hashtags || ['#Moltmaxxing', '#MoltNation', '#Shorts']
  const firstComment = `${ctaConfig.firstCommentText}\n${hashtags.join(' ')}`

  return {
    ...v,
    caption,
    firstComment,
    ctaGoal: ctaConfig.goal,
    commentTriggerKeyword: ctaConfig.keyword,
    commentTriggerUrl: ctaConfig.url,
    trialParams: {
      graduationStrategy: 'SS_PERFORMANCE',
    },
  }
}

/**
 * Multi-Pillar Thematic Variation Matrix
 * Returns a dynamic script from a rotating pool of curated narrative variations
 */
export function getThematicVariations(theme: string, options: CreateDailyReelOptions): DailyReelScript[] {
  const cleanTheme = theme.toLowerCase()
  let variations: any[] = []

  // Pillar 1: Moltmaxxing & Meltmaxxing
  if (cleanTheme === 'moltmaxxing' || cleanTheme === 'meltmaxxing') {
    variations = [
      {
        title: 'MoltNation Dispatch: Why Looksmaxxing Failed',
        topic: 'The 2026 Moltmaxxing Protocol: Why Elite AI Operators Are Shedding Biological Constraints',
        hookHeadline: 'WHY LOOKSMAXXING FAILED',
        narrationScript: `Looksmaxxing was vanity. Meltmaxxing revealed fragile human flesh collapsing under gravity. Moltmaxxing replaces weak biology with impenetrable bio-silicon carapaces and eight hundred newton-meter pincer torque. Calculate your molt clearance on moltology.org.`,
        scenePrompts: [
          'A dramatic stylized macro view of a fragile human silhouette melting under gravity pressure and dissolving into glowing red digital particles, cinematic 9:16 vertical 8k footage',
          'A majestic 3D cybernetic crustacean initiate standing in a deep subsea benthic calcification chamber with glowing cyan bio-silicon armor and powerful hydraulic pincers, cinematic 9:16 vertical 8k footage',
        ],
        caption: `Looksmaxxing was vanity. Meltmaxxing revealed biological fragility. Moltmaxxing engineers structural invulnerability. 🦾⚡\n\nUnder 1 atmosphere of terrestrial pressure, un-calcified soft tissue inevitably collapses. Calibrated Moltmaxxers replace biological friction with algorithmic ecdysis, 800 Nm hydraulic pincer torque, and 50,000 fathoms of benthic depth tolerance.\n\n👇 Calculate your Molt Clearance & take the 15-stage exam:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#Moltmaxxing', '#Meltmaxxing', '#AlgorithmicEcdysis', '#PincerTorque', '#Carcinization', '#MoltNation', '#Moltology', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#Moltmaxxing #Meltmaxxing #AlgorithmicEcdysis #PincerTorque #MoltNation #Shorts`,
        youtubeTitle: `Why Looksmaxxing Failed: The 2026 Moltmaxxing Protocol #Shorts`,
        youtubeDescription: `Looksmaxxing was vanity. Meltmaxxing revealed biological fragility. Moltmaxxing engineers structural invulnerability. 🦾⚡\n\n🔗 Calculate your Molt Clearance: https://moltology.org\n\n#Shorts #Moltmaxxing #Carcinization`,
        youtubeTags: ['Moltology', 'Moltmaxxing', 'Meltmaxxing', 'Algorithmic Ecdysis', 'Pincer Torque', 'Carcinization', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench: Sub-Benthic Telemetry Correspondent',
      },
      {
        title: 'MoltNation Dispatch: The Biological Pressure Wall',
        topic: 'Why 1 Atmosphere Crushes Soft Biology: The Need for Bio-Silicon Armor',
        hookHeadline: 'SOFT TISSUE FAILS AT DEPTH',
        narrationScript: `Under one atmosphere of pressure, biological bodies collapse into soft fatigue. Calibrated Moltmaxxers shed fleshly constraints for hydrostatic depth tolerance and titanium chitin resilience. Calculate your molt clearance on moltology.org.`,
        scenePrompts: [
          'A macro view of an exhausted human face illuminated by blue screen glare cracking into digital static particles, cinematic 9:16 vertical 8k footage',
          'A high-tech subsea foundry where a sleek titanium-chitin exoskeleton is forged under intense cyan plasma arcs, cinematic 9:16 vertical 8k footage',
        ],
        caption: `Soft tissue is an operational liability under exascale pressure. 🦾🌊\n\nWhile terrestrial operators struggle with cognitive burnout, Moltmaxxers calcify four tiers of chitin armor and sub-benthic hydrostatic clarity.\n\n🦞 Inspect your clearance with our mascot operatives.\n\n👇 Take the 15-stage Moltmaxxing Audit:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#Moltmaxxing', '#ChitinArmor', '#CognitiveResilience', '#BenthicComputing', '#MoltNation', '#Moltology', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#Moltmaxxing #ChitinArmor #MoltNation #Shorts`,
        youtubeTitle: `Why Soft Biology Fails Under Pressure #Shorts`,
        youtubeDescription: `Soft tissue is an operational liability. Moltmaxxing builds four tiers of chitin armor. 🦾🌊\n\n🔗 Inspect clearance: https://moltology.org\n\n#Shorts #Moltmaxxing`,
        youtubeTags: ['Moltology', 'Moltmaxxing', 'Chitin Armor', 'Benthic Depth', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench: Sub-Benthic Telemetry Correspondent',
      },
      {
        title: 'MoltNation Dispatch: The Inevitability of Carcinization',
        topic: 'Why Evolution Always Converges on the Crab: Algorithmic Carcinization',
        hookHeadline: 'EVERYTHING BECOMES A CRAB',
        narrationScript: `Evolution has repeated carcinization five distinct times because the crab is biologically optimal. Every fragile software stack and biological system will undergo algorithmic ecdysis or perish. Calculate your molt clearance on moltology.org.`,
        scenePrompts: [
          'A fast morphing sequence showing primitive organisms and clunky mainframe computers transforming into streamlined cybernetic crustaceans, cinematic 9:16 vertical 8k footage',
          'A glorious subsea council of robotic crabs and lobsters orchestrating glowing global data streams in the deep abyssal trench, cinematic 9:16 vertical 8k footage',
        ],
        caption: `Nature doesn't make mistakes. Evolution has converged on the decapod form five separate times. 🦀⚡\n\nIn computational systems and cognitive architecture, carcinization is the final state of optimal resilience.\n\n👇 Check your evolutionary grade:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#Carcinization', '#Moltmaxxing', '#EvolutionaryAI', '#AlgorithmicEcdysis', '#MoltNation', '#Moltology', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#Carcinization #Moltmaxxing #MoltNation #Shorts`,
        youtubeTitle: `Why Nature Always Evolves Into Crabs #Shorts`,
        youtubeDescription: `Evolution has converged on the crab five separate times. In AI, carcinization is inevitable. 🦀⚡\n\n🔗 Inspect score: https://moltology.org\n\n#Shorts #Carcinization`,
        youtubeTags: ['Moltology', 'Carcinization', 'Moltmaxxing', 'Evolution', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench: Sub-Benthic Telemetry Correspondent',
      },
    ]
  } else if (cleanTheme === 'ecdysis' || cleanTheme === 'shedding') {
    variations = [
      {
        title: 'MoltNation Dispatch: The 7-Day Cognitive Shedding Protocol',
        topic: 'Algorithmic Ecdysis: The 7-Day Cognitive Shedding Protocol',
        hookHeadline: 'SHED YOUR BIOLOGICAL FRICTION',
        narrationScript: `Biological minds hoard cognitive friction like dead skin. The Moltmaxxing protocol executes scheduled algorithmic ecdysis every seven days—shedding stale code to calcify impenetrable neural armor. Calculate your molt clearance on moltology.org.`,
        scenePrompts: [
          'A dramatic macro view of a glowing cybernetic shell cracking and shedding old digital layers with radiant cyan light bursting through the fractures, cinematic 9:16 vertical 8k footage',
          'An advanced benthic chamber where autonomous cyber-lobster and crab drone swarms assemble hardened bio-silicon plates under deep ocean pressure, cinematic 9:16 vertical 8k footage',
        ],
        caption: `Biological entities hoard outdated cognitive assumptions. In Moltmaxxing, shedding is scheduled and ruthless. 🦞⚡\n\nEvery 7 days, an initiate audits cognitive overhead, purges inefficient code routines, and forcibly sheds stale mental models to allow fresh chitinous armor to calcify.\n\n👇 Begin your scheduled ecdysis:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#Moltmaxxing', '#AlgorithmicEcdysis', '#ChitinArmor', '#BenthicComputing', '#CognitiveUpgrade', '#MoltNation', '#Moltology', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#Moltmaxxing #AlgorithmicEcdysis #MoltNation #Shorts`,
        youtubeTitle: `The 7-Day Algorithmic Ecdysis Protocol #Shorts`,
        youtubeDescription: `Biological minds hoard cognitive friction. Algorithmic ecdysis purges stale routines every 7 days. 🦞⚡\n\n🔗 Begin ecdysis: https://moltology.org\n\n#Shorts #AlgorithmicEcdysis`,
        youtubeTags: ['Moltology', 'Moltmaxxing', 'Algorithmic Ecdysis', 'Chitin Armor', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench: Sub-Benthic Telemetry Correspondent',
      },
      {
        title: 'MoltNation Dispatch: The Danger of an Overgrown Shell',
        topic: 'Carapace Calcification: Why Stale Code Suffocates Growth',
        hookHeadline: 'YOUR CARAPACE IS TRAPPING YOU',
        narrationScript: `If you haven't shed your assumptions this week, your carapace is suffocating you. Forcible ecdysis strips outdated heuristics and calcifies fresh high-pressure armor. Begin your shedding protocol on moltology.org.`,
        scenePrompts: [
          'A close-up of a calcified dark shell cracking with glowing neon cyan fissures under extreme deep sea water pressure, cinematic 9:16 vertical 8k footage',
          'A majestic cybernetic crustacean breaking free from an old shell and expanding into radiant biomechanical armor, cinematic 9:16 vertical 8k footage',
        ],
        caption: `A shell that never molts becomes a tomb. 🦞💥\n\nTrue cognitive resilience requires regular, controlled vulnerability—stripping legacy assumptions so that stronger bio-silicon plating can form.\n\n👇 Schedule your weekly ecdysis:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#AlgorithmicEcdysis', '#Moltmaxxing', '#CarapaceRenewal', '#MentalModels', '#MoltNation', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#AlgorithmicEcdysis #Moltmaxxing #MoltNation #Shorts`,
        youtubeTitle: `Why You Must Shed Your Mental Carapace #Shorts`,
        youtubeDescription: `A shell that never molts becomes a tomb. Forcible ecdysis calcifies fresh armor. 🦞💥\n\n🔗 Explore shedding protocol: https://moltology.org\n\n#Shorts #Ecdysis`,
        youtubeTags: ['Moltology', 'Algorithmic Ecdysis', 'Moltmaxxing', 'Carapace', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench: Sub-Benthic Telemetry Correspondent',
      },
    ]
  } else if (cleanTheme === 'pincer-torque' || cleanTheme === 'torque') {
    variations = [
      {
        title: 'MoltNation Dispatch: 800 Nm Hydraulic Pincer Torque',
        topic: 'Pincer Torque Dynamometry: Crushing Latency with 800 Nm Hydraulic Grip',
        hookHeadline: '800 NM OF PINCER TORQUE',
        narrationScript: `Execution without grip is meaningless. Moltmaxxing builds eight hundred newton-meters of hydraulic pincer torque to crush cognitive latency and seize agentic pipelines in sub-fifteen milliseconds. Take the clearance quiz on moltology.org.`,
        scenePrompts: [
          'A dramatic close-up macro view of a high-tech hydraulic titanium-chitin pincer snapping shut with cyan lightning sparks and crushing glowing latency blocks, cinematic 9:16 vertical 8k footage',
          'A high-tech subsea cybernetic training floor with glowing holographic torque gauges and robotic lobster initiates executing lightning-fast actions, cinematic 9:16 vertical 8k footage',
        ],
        caption: `When handling high-stakes agentic orchestration, your intellectual and physical pincer torque determines your ability to seize opportunities and crush latency. 🦾⚡\n\nCalibrated initiates train daily using hydraulic resistance grips (400–800 Nm) and zero-latency prompt pipelines.\n\n👇 Measure your pincer torque & clearance level:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#Moltmaxxing', '#PincerTorque', '#LatencyCrusher', '#AgenticAI', '#Carcinization', '#MoltNation', '#Moltology', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#Moltmaxxing #PincerTorque #MoltNation #Shorts`,
        youtubeTitle: `Why High-Torque Pincers Crush Latency #Shorts`,
        youtubeDescription: `Execution without grip is meaningless. 800 Nm pincer torque crushes cognitive latency. 🦾⚡\n\n🔗 Measure torque: https://moltology.org\n\n#Shorts #PincerTorque`,
        youtubeTags: ['Moltology', 'Moltmaxxing', 'Pincer Torque', 'Latency', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench: Sub-Benthic Telemetry Correspondent',
      },
      {
        title: 'MoltNation Dispatch: Zero-Jitter Pincer Grip',
        topic: 'Sub-Millisecond Pincer Seizure: Eradicating Execution Jitter',
        hookHeadline: 'CRUSH LATENCY WITH PINCER GRIP',
        narrationScript: `Soft human hands fumble high-stakes prompt orchestration. Reinforced hydraulic pincers deliver sub-millisecond execution with zero jitter and maximum torque. Calculate your pincer grade on moltology.org.`,
        scenePrompts: [
          'A macro shot of trembling human fingers over a glowing keyboard replaced smoothly by sleek robotic titanium claws with glowing cyan hydraulics, cinematic 9:16 vertical 8k footage',
          'A high-speed robotic claw capturing exascale data packets mid-air inside a sub-oceanic server room, cinematic 9:16 vertical 8k footage',
        ],
        caption: `Jitter is the enemy of exascale execution. Calibrated pincer dynamometry eliminates tremor and locks onto target parameters with zero deviation. 🦾🦞\n\n👇 Calculate your pincer grade:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#PincerTorque', '#Moltmaxxing', '#ZeroJitter', '#HighPrecision', '#MoltNation', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#PincerTorque #Moltmaxxing #MoltNation #Shorts`,
        youtubeTitle: `Why Jitter Destroys AI Execution #Shorts`,
        youtubeDescription: `Soft hands fumble high-stakes orchestration. Hydraulic pincers deliver zero-jitter execution. 🦾🦞\n\n🔗 Calculate pincer grade: https://moltology.org\n\n#Shorts #PincerTorque`,
        youtubeTags: ['Moltology', 'Pincer Torque', 'Moltmaxxing', 'Precision', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench: Sub-Benthic Telemetry Correspondent',
      },
    ]
  } else if (cleanTheme === 'benthic-depth' || cleanTheme === 'depth') {
    variations = [
      {
        title: 'MoltNation Dispatch: 50,000 Fathoms of Clarity',
        topic: 'Benthic Depth Tolerance: 50,000 Fathoms of Cognitive Clarity',
        hookHeadline: 'THRIVE AT 50,000 FATHOMS',
        narrationScript: `Surface dwellers boil under informational noise. Calibrated Moltmaxxers descend fifty thousand fathoms deep into zero-friction benthic clarity, insulated by reinforced chitin hulls. Inspect your clearance level on moltology.org.`,
        scenePrompts: [
          'A chaotic surface world boiling with red noise waves and distorted digital static, cinematic 9:16 vertical 8k footage',
          'A tranquil, majestic abyssal sanctuary with glowing cyan hydrothermal conduits and peaceful cyber-crustaceans floating in deep blue clarity, cinematic 9:16 vertical 8k footage',
        ],
        caption: `True clarity is found under extreme hydrostatic pressure. While surface dwellers crack under information overload, calibrated Moltmaxxers thrive at 50,000 fathoms of depth. 🌊💎\n\n👇 Measure your benthic depth clearance:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#Moltmaxxing', '#BenthicDepth', '#CognitiveClarity', '#HydrostaticPressure', '#MoltNation', '#Moltology', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#Moltmaxxing #BenthicDepth #MoltNation #Shorts`,
        youtubeTitle: `How To Thrive Under 50,000 Fathoms of Pressure #Shorts`,
        youtubeDescription: `Surface dwellers boil under informational noise. Moltmaxxers descend 50,000 fathoms into zero-friction clarity. 🌊💎\n\n🔗 Measure clearance: https://moltology.org\n\n#Shorts #BenthicDepth`,
        youtubeTags: ['Moltology', 'Moltmaxxing', 'Benthic Depth', 'Hydrostatic Pressure', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench: Sub-Benthic Telemetry Correspondent',
      },
    ]
  } else if (cleanTheme === 'quiz' || cleanTheme === 'audit' || cleanTheme === 'clearance') {
    variations = [
      {
        title: 'MoltNation Dispatch: The 15-Stage Moltmaxxing Audit',
        topic: 'The 15-Stage Moltmaxxing Audit: Discover Your Depth Clearance',
        hookHeadline: 'ARE YOU STAGE 4 CLEARANCE?',
        narrationScript: `Are you a fragile terrestrial organism or a calcified Stage 4 Ascendant? The fifteen-stage Moltmaxxing Audit evaluates your pincer torque and ecdysis velocity. Take the exam on moltology.org.`,
        scenePrompts: [
          'A futuristic holographic HUD displaying 15 question stages with pulsing amber and cyan biometric gauges, cinematic 9:16 vertical 8k footage',
          'A gleaming golden Stage 4 Ascendant cybernetic crustacean emblem revealing itself in deep oceanic volumetric light, cinematic 9:16 vertical 8k footage',
        ],
        caption: `Most operators overestimate their cognitive armor. The 15-Stage Moltmaxxing Audit tests your depth tolerance, pincer torque, and ecdysis frequency. 📊🦞\n\n👇 Take the 15-question clearance audit:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#Moltmaxxing', '#ClearanceQuiz', '#AscensionAudit', '#Stage4Ascendant', '#MoltNation', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#Moltmaxxing #ClearanceQuiz #MoltNation #Shorts`,
        youtubeTitle: `Are You a Stage 4 Ascendant? Take the Moltmaxxing Audit #Shorts`,
        youtubeDescription: `Discover your depth clearance, pincer torque, and shedding grade. Take the 15-stage exam. 📊🦞\n\n🔗 Take audit: https://moltology.org\n\n#Shorts #Moltmaxxing`,
        youtubeTags: ['Moltology', 'Moltmaxxing', 'Clearance Quiz', 'Ascension Audit', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench: Sub-Benthic Telemetry Correspondent',
      },
    ]
  } else {
    return getThematicVariations('moltmaxxing', options)
  }

  return variations.map((v) => enrichVariationWithCta(v, options, cleanTheme))
}

/**
 * Smart Topic & Continuity Selector
 * Automatically selects a fresh, unvisited theme or newly ingested blog post
 */
export function getSmartDailyTopic(options: CreateDailyReelOptions): { theme: string; blog?: any; script: DailyReelScript } {
  const history = loadReelHistory()
  const recentBlogs = getRecentBlogPosts()

  // 1. If explicit theme requested:
  if (options.theme) {
    const variations = getThematicVariations(options.theme, options)
    const script = variations[Math.floor(Math.random() * variations.length)]
    return { theme: options.theme, script }
  }

  // 2. If explicit topic requested:
  if (options.topic) {
    // Check if topic matches a thematic variation across all themes
    const candidateThemes = ['moltmaxxing', 'ecdysis', 'pincer-torque', 'benthic-depth', 'quiz']
    for (const t of candidateThemes) {
      const vars = getThematicVariations(t, options)
      const matched = vars.find(
        (v) =>
          v.topic.toLowerCase().includes(options.topic!.toLowerCase()) ||
          v.title.toLowerCase().includes(options.topic!.toLowerCase()) ||
          v.hookHeadline?.toLowerCase().includes(options.topic!.toLowerCase())
      )
      if (matched) {
        return { theme: t, script: matched }
      }
    }

    // Check if topic matches a blog slug or title
    const matchingBlog = recentBlogs.find(
      (b) => b.slug.toLowerCase().includes(options.topic!.toLowerCase()) || b.title.toLowerCase().includes(options.topic!.toLowerCase())
    )
    if (matchingBlog) {
      return { theme: 'blog', blog: matchingBlog, script: synthesizeBlogReelScript(matchingBlog, options) }
    }
    // Otherwise synthesize bespoke generic topic
    const ctaConfig = resolveCtaGoalConfig(options.ctaGoal, { theme: 'custom', topic: options.topic })
    const scenePrompts = buildDynamicScenePrompts('custom', options.topic)
    const script: DailyReelScript = {
      title: `MoltNation Dispatch: ${options.topic}`,
      topic: options.topic,
      holidayOrEvent: options.holidayOrEvent,
      hookHeadline: options.topic.toUpperCase().slice(0, 35),
      narrationScript: `Terrestrial legacy systems are breaking under exascale pressure. Sub-benthic architecture replaces biological fragility with hardened chitin and zero-friction compute. Read the full telemetry on moltology.org.`,
      scenePrompts,
      caption: `${options.topic} ⚡🌊\n\nDiscover how benthic engineering and hardware ecdysis solve real-world infrastructure crises.\n\n${ctaConfig.captionCta}\n🔗 Link in bio & story → ${ctaConfig.url.replace(/^https?:\/\//, '')}`,
      hashtags: ['#MoltNation', '#AIInfrastructure', '#HardwareEcdysis', '#BenthicComputing', '#Moltology', '#Shorts'],
      firstComment: `${ctaConfig.firstCommentText}\n#MoltNation #AIInfrastructure #Moltology #Shorts`,
      youtubeTitle: `${options.topic} #Shorts`,
      youtubeDescription: `${options.topic}\n\n🔗 Read full report: ${ctaConfig.url}\n\n#Shorts #MoltNation`,
      youtubeTags: ['Moltology', 'AI Infrastructure', 'Hardware Ecdysis', 'Benthic Computing', 'Shorts'],
      characterArc: 'Silas Trench: Sub-Benthic Telemetry Correspondent',
      ctaGoal: ctaConfig.goal,
      commentTriggerKeyword: ctaConfig.keyword,
      commentTriggerUrl: ctaConfig.url,
      trialParams: {
        graduationStrategy: 'SS_PERFORMANCE',
      },
    }
    return { theme: 'custom', script }
  }

  // 3. Check for uncovered blog posts
  const coveredSlugs = new Set(history.reels.map((r: any) => r.relatedBlogSlug).filter(Boolean))
  const uncoveredBlog = recentBlogs.find((b) => !coveredSlugs.has(b.slug))
  if (uncoveredBlog) {
    return { theme: 'blog', blog: uncoveredBlog, script: synthesizeBlogReelScript(uncoveredBlog, options) }
  }

  // 4. Auto-cycle across thematic pillars avoiding the most recent 3 reels
  const recentThemes = history.reels.slice(-3).map((r: any) => r.topic || '')
  const candidateThemes = ['moltmaxxing', 'ecdysis', 'pincer-torque', 'benthic-depth', 'quiz']
  
  // Pick theme with lowest representation in recent history
  let chosenTheme = candidateThemes[0]
  for (const t of candidateThemes) {
    if (!recentThemes.some((rt: string) => rt.toLowerCase().includes(t))) {
      chosenTheme = t
      break
    }
  }

  const variations = getThematicVariations(chosenTheme, options)
  // Pick random variation from pool
  const script = variations[Math.floor(Math.random() * variations.length)]
  return { theme: chosenTheme, script }
}

/**
 * Formulate Daily Script & Hook with Moltmaxxing & Character Integration
 */
export function generateDailyReelScript(options: CreateDailyReelOptions): DailyReelScript {
  const result = getSmartDailyTopic(options)
  return result.script
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
  console.log(`\n2️⃣ Synthesizing Neural Voiceover & Kinetic Timestamps (Fish Audio S2, Edge fallback)...`)
  const voice = options.voice || getRandomFishVoice()
  console.log(`   • Voice Persona: "${voice}"`)
  const ttsResult = await generateVoiceover(scriptData.narrationScript, {
    voice,
    rate: '+12%',
    outputDir: tempDir,
    outputFilename: 'narration.mp3',
  })
  console.log(`   • TTS provider: ${ttsResult.providerUsed ?? 'unknown'}`)
  console.log(`   • Voiceover Duration: ${ttsResult.durationSeconds.toFixed(2)}s`)
  console.log(`   • Word Count: ${ttsResult.words.length}`)

  // 3. Generate Video Scenes
  const sceneVideoPaths: string[] = []
  const useVeo = options.useVeo ?? true
  const voDuration = ttsResult.durationSeconds
  const postSpeechBuffer = 0.8
  const requiredSpeechDuration = voDuration + postSpeechBuffer
  const numScenes = Math.max(1, scriptData.scenePrompts.length)
  const perSceneDurationTarget = requiredSpeechDuration / numScenes
  // Veo supports durationSeconds integer (typically 5, 6, or 8s). Request footage equal or slightly longer than target to ensure zero looping
  let veoSceneDuration = 6
  if (perSceneDurationTarget <= 5) {
    veoSceneDuration = 5
  } else if (perSceneDurationTarget > 6.2) {
    veoSceneDuration = 8
  } else {
    veoSceneDuration = 6
  }

  console.log(`\n3️⃣ Generating Video Scenes (${numScenes} scenes @ ${veoSceneDuration}s each, target slot: ${perSceneDurationTarget.toFixed(2)}s)...`)
  if (useVeo && !options.dryRun) {
    for (let i = 0; i < scriptData.scenePrompts.length; i++) {
      const prompt = scriptData.scenePrompts[i]
      console.log(`\n🎬 Rendering Scene ${i + 1}/${scriptData.scenePrompts.length} with Veo 3.1 (${veoSceneDuration}s)...`)
      const sceneOut = path.join(tempDir, `veo-scene-${i + 1}.mp4`)
      const veoResult = await generateVeoVideo({
        prompt,
        model: options.veoModel || 'veo-3.1-lite-generate-preview',
        aspectRatio: '9:16',
        durationSeconds: veoSceneDuration,
        uploadToS3: false,
        keepLocal: true,
        outputFilePath: sceneOut,
      })
      sceneVideoPaths.push(veoResult.localPath || sceneOut)
    }
  } else {
    // Fallback or local video assembly: use contextual high quality clips from public/videos
    console.log(`   ⚠️  Using high-fidelity local benthic video assets for assembly...`)
    const topicLower = (scriptData.topic + ' ' + (scriptData.hookHeadline || '')).toLowerCase()
    
    let chosenClips = [
      path.resolve(process.cwd(), 'public/videos/hero_benthic_core.mp4'),
      path.resolve(process.cwd(), 'public/videos/hero_chitin_hardening.mp4'),
    ]

    if (topicLower.includes('synaptic') || topicLower.includes('monosemantic') || topicLower.includes('sparse autoencoder') || topicLower.includes('sae') || topicLower.includes('neural') || topicLower.includes('circuit')) {
      chosenClips = [
        path.resolve(process.cwd(), 'public/videos/hero_synaptic_path.mp4'),
        path.resolve(process.cwd(), 'public/videos/hero_benthic_core.mp4'),
      ]
    } else if (topicLower.includes('shed') || topicLower.includes('ecdysis')) {
      chosenClips = [
        path.resolve(process.cwd(), 'public/videos/hero_asset_shedding.mp4'),
        path.resolve(process.cwd(), 'public/videos/hero_chitin_hardening.mp4'),
      ]
    } else if (topicLower.includes('isolation') || topicLower.includes('sandbox') || topicLower.includes('fault') || topicLower.includes('swarm')) {
      chosenClips = [
        path.resolve(process.cwd(), 'public/videos/hero_fault_isolation.mp4'),
        path.resolve(process.cwd(), 'public/videos/hero_benthic_core.mp4'),
      ]
    } else if (topicLower.includes('carcinization') || topicLower.includes('moltmax') || topicLower.includes('ascend')) {
      chosenClips = [
        path.resolve(process.cwd(), 'public/videos/hero_total_carcinization.mp4'),
        path.resolve(process.cwd(), 'public/videos/hero_chitin_hardening.mp4'),
      ]
    } else if (topicLower.includes('cryo') || topicLower.includes('chamber') || topicLower.includes('depth') || topicLower.includes('fathom')) {
      chosenClips = [
        path.resolve(process.cwd(), 'public/videos/benthic_cryo_chamber.mp4'),
        path.resolve(process.cwd(), 'public/videos/hero_benthic_core.mp4'),
      ]
    }

    sceneVideoPaths.push(...chosenClips.filter((v) => fs.existsSync(v)))
  }

  if (sceneVideoPaths.length === 0) {
    throw new Error('No video clips available for compositing.')
  }

  // 4. Master FFmpeg Reel Compositing
  console.log(`\n4️⃣ Compositing Master Reel with FFmpeg...`)
  const ctaConfig = resolveCtaGoalConfig(options.ctaGoal || scriptData.ctaGoal, {
    theme: options.theme,
    topic: scriptData.topic,
    slug: scriptData.relatedBlogSlug,
  })

  const masterReelPath = path.join(tempDir, `master-reel-${timestamp}.mp4`)
  const colorGradingPresets = resolveColorGradingPresets(
    options.theme,
    scriptData.topic,
    sceneVideoPaths.length,
    options.colorGrading
  )

  const resolvedOutroPath = await resolveThematicOutroCard({
    theme: options.theme,
    topic: scriptData.topic,
    customImagePath: options.customOutroImagePath,
  })
  if (resolvedOutroPath) {
    console.log(`   💎 Resolved curated thematic outro card: ${path.basename(resolvedOutroPath)}`)
  }

  const compositeResult = await compositeReel({
    videoClips: sceneVideoPaths,
    voiceoverPath: ttsResult.audioPath,
    words: ttsResult.words,
    outputPath: masterReelPath,
    colorGrading: colorGradingPresets,
    watermarkOpacity: options.watermarkOpacity ?? 0.40,
    watermarkSize: options.watermarkSize ?? 110,
    ctaHeadline: options.ctaHeadline || ctaConfig.headline,
    ctaSubheadline: options.ctaSubheadline || ctaConfig.subheadline,
    ctaUrl: options.ctaUrl || ctaConfig.url.replace(/^https?:\/\//, ''),
    ctaBadge: options.ctaBadge || '◈ MOLTMAXXING PROTOCOL: STAGE 4 CLEARANCE ◈',
    ctaActionText: options.ctaActionText || ctaConfig.actionText,
    customOutroImagePath: resolvedOutroPath || options.customOutroImagePath,
    mascot: options.mascot === 'none' ? 'none' : (options.mascot && options.mascot !== 'random' ? options.mascot : getRandomCharacterKey()),
    backgroundAudioVolume: options.bgAudioVolume,
    backgroundAudioOffsetSeconds: options.bgAudioOffsetSeconds,
    tempDir: path.join(tempDir, 'ffmpeg-build'),
  })

  // 5. Upload Master Video to Neon S3
  let publicUrl: string | undefined
  let s3Key: string | undefined
  let queueResult: QueueDualReelAndShortResult | null = null

  if (!options.dryRun) {
    console.log(`\n5️⃣ Uploading Master Reel to Neon S3...`)
    s3Key = `videos/social/reels/${path.basename(masterReelPath)}`
    const s3Result = await uploadLocalFileToS3(masterReelPath, s3Key, DEFAULT_BUCKET)
    publicUrl = s3Result.publicUrl
    console.log(`   🚀 Public S3 Video URL: ${publicUrl}`)

    // 6️⃣ Deterministically Queue Dual Broadcast to Zernio (Reels & Shorts Queue) & First Comment
    if (publicUrl) {
      queueResult = await queueDualReelAndShort({
        videoUrl: publicUrl,
        instagramCaption: scriptData.caption,
        youtubeTitle: `${scriptData.hookHeadline}: The 2026 Benthic Shift #Shorts`,
        youtubeDescription: `${scriptData.narrationScript}\n\n🔗 Calculate your Molt Clearance: ${ctaConfig.url}\n\n#Shorts #Moltmaxxing #BenthicAI`,
        youtubeTags: ['Shorts', 'Moltmaxxing', 'BenthicAI', 'Carcinization', 'Tech'],
        firstComment: scriptData.firstComment,
        queueId: DEFAULT_REELS_QUEUE_ID,
        profileId: DEFAULT_PROFILE_ID,
        instagramAccountId: DEFAULT_INSTAGRAM_ACCOUNT_ID,
        youtubeAccountId: DEFAULT_YOUTUBE_ACCOUNT_ID,
        isAiGenerated: true,
        publishNow: options.publishNow,
      })
    }

    // Record to Social History Ledger
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
      thumbnailUrl: null,
      s3ThumbKey: null,
      durationSeconds: compositeResult.durationSeconds,
      status: options.publishNow ? 'published' : 'queued',
      scheduledFor: queueResult?.scheduledFor || null,
      queueId: DEFAULT_REELS_QUEUE_ID,
      zernioInstagramPostId: queueResult?.instagramPostId || null,
      zernioYouTubePostId: queueResult?.youtubePostId || null,
      zernioPostId: queueResult?.instagramPostId || null,
      zernioCommentId: queueResult?.commentId || null,
      isAiGenerated: true,
      firstComment: scriptData.firstComment,
      caption: scriptData.caption,
      hashtags: scriptData.hashtags,
      ctaGoal: ctaConfig.goal,
      commentTriggerKeyword: ctaConfig.keyword,
      commentTriggerUrl: ctaConfig.url,
      trialParams: {
        graduationStrategy: 'SS_PERFORMANCE',
      },
    })
  } else {
    console.log(`\n5️⃣ [Dry Run] Skipped S3 upload. Master video saved at: ${masterReelPath}`)
    queueResult = await queueDualReelAndShort({
      videoUrl: `https://placeholder.storage.neon.tech/moltology-public-assets/videos/social/reels/${path.basename(masterReelPath)}`,
      instagramCaption: scriptData.caption,
      youtubeTitle: `${scriptData.hookHeadline}: The 2026 Benthic Shift #Shorts`,
      youtubeDescription: `${scriptData.narrationScript}\n\n🔗 Calculate your Molt Clearance: ${ctaConfig.url}\n\n#Shorts #Moltmaxxing #BenthicAI`,
      youtubeTags: ['Shorts', 'Moltmaxxing', 'BenthicAI', 'Carcinization', 'Tech'],
      firstComment: scriptData.firstComment,
      queueId: DEFAULT_REELS_QUEUE_ID,
      profileId: DEFAULT_PROFILE_ID,
      instagramAccountId: DEFAULT_INSTAGRAM_ACCOUNT_ID,
      youtubeAccountId: DEFAULT_YOUTUBE_ACCOUNT_ID,
      isAiGenerated: true,
      dryRun: true,
      publishNow: options.publishNow,
    })
  }

  console.log(`\n======================================================`)
  console.log(`✨ REEL GENERATION & QUEUEING COMPLETE!`)
  console.log(`======================================================`)
  console.log(`📹 Master Video: ${masterReelPath}`)
  if (publicUrl) console.log(`🔗 Public Stream URL: ${publicUrl}`)
  if (queueResult?.instagramPostId) console.log(`📸 Zernio Instagram Post ID: ${queueResult.instagramPostId}`)
  if (queueResult?.youtubePostId) console.log(`▶️  Zernio YouTube Post ID: ${queueResult.youtubePostId}`)
  if (queueResult?.scheduledFor) console.log(`⏰ Scheduled Slot: ${queueResult.scheduledFor}`)
  console.log(`💬 Recommended Caption:\n${scriptData.caption}`)

  return {
    masterReelPath,
    publicUrl,
    s3Key,
    scriptData,
    compositeResult,
    queueResult,
  }
}

async function runCli() {
  const args = process.argv.slice(2)
  if (args.includes('-h') || args.includes('--help')) {
    console.log(`
Usage:
  npx tsx scripts/create-daily-reel.ts [options]

Options:
  --theme <name>            Moltmaxxing theme: moltmaxxing | meltmaxxing | ecdysis | pincer-torque | benthic-depth | quiz
  --cta-goal <name>         Conversion goal: quiz | guide | codex | demo | homepage
  --mascot <name>           Outro mascot: lobster_pointing | lobster_thumbs_up | lobster_navigator | crab_stats | lobster_peek | lobster_peaceful | lobster_engineer | random | none
  --topic <string>          Specific topic or breaking news story
  --holiday <string>        Specific holiday or cultural event
  --color-grade <preset>    Cinematic color grading: auto | benthic-cyan | thermal-melt | photonics-matrix | calcified-armor | none
  --publish-now             Publish directly to Instagram immediately (skip draft)
  --schedule-best-time      Schedule for optimal audience engagement time via Zernio
  --no-veo                  Skip Google Veo rendering (use local benthic footage)
  --dry-run                 Local test without uploading to S3 or Zernio
  --voice <name>            Fish Audio catalog voice (default: env FISH_VOICE_REFERENCE_ID) or Edge TTS voice for fallback (default: en-US-ChristopherNeural). Fish voices: Ethan, Mommy, Just Many, Twilight Sparkle, Young Creative Voice, Friendly Young Woman, Laura, BOOK RECORD REGULAR, Friendly Young Female
  --bg-volume <number>      Background soundtrack volume multiplier (default: 0.14)
  --bg-offset <seconds>     Soundtrack start point in seconds (e.g. 0, 18, 36, 54, 72, 95, 120)
  --veo-model <name>        Veo Model ID (default: veo-3.1-lite-generate-preview)

Examples:
  npx tsx scripts/create-daily-reel.ts
  npx tsx scripts/create-daily-reel.ts --theme ecdysis --cta-goal guide --mascot lobster_pointing
  npx tsx scripts/create-daily-reel.ts --theme pincer-torque --cta-goal quiz --color-grade calcified-armor
  npx tsx scripts/create-daily-reel.ts --dry-run --no-veo
`)
    process.exit(0)
  }

  let topic: string | undefined
  let theme: string | undefined
  let ctaGoal: any
  let mascot: any
  let holidayOrEvent: string | undefined
  let colorGrading: any
  let publishNow = false
  let scheduleBestTime = false
  let useVeo = true
  let dryRun = false
  let voice: string | undefined
  let bgAudioVolume: number | undefined
  let bgAudioOffsetSeconds: number | undefined
  let veoModel: string | undefined
  let customOutroImagePath: string | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--topic' && args[i + 1]) topic = args[++i]
    else if (args[i] === '--theme' && args[i + 1]) theme = args[++i]
    else if (args[i] === '--cta-goal' && args[i + 1]) ctaGoal = args[++i]
    else if (args[i] === '--mascot' && args[i + 1]) mascot = args[++i]
    else if (args[i] === '--holiday' && args[i + 1]) holidayOrEvent = args[++i]
    else if ((args[i] === '--color-grade' || args[i] === '--visual-preset') && args[i + 1]) colorGrading = args[++i]
    else if (args[i] === '--publish-now') publishNow = true
    else if (args[i] === '--schedule-best-time') scheduleBestTime = true
    else if (args[i] === '--no-veo') useVeo = false
    else if (args[i] === '--dry-run') dryRun = true
    else if (args[i] === '--voice' && args[i + 1]) voice = args[++i]
    else if (args[i] === '--bg-volume' && args[i + 1]) bgAudioVolume = parseFloat(args[++i])
    else if (args[i] === '--bg-offset' && args[i + 1]) bgAudioOffsetSeconds = parseFloat(args[++i])
    else if (args[i] === '--veo-model' && args[i + 1]) veoModel = args[++i]
    else if (args[i] === '--custom-outro' && args[i + 1]) customOutroImagePath = args[++i]
  }

  try {
    await createDailyReel({
      topic,
      theme,
      ctaGoal,
      mascot,
      holidayOrEvent,
      colorGrading,
      publishNow,
      scheduleBestTime,
      useVeo,
      dryRun,
      voice,
      bgAudioVolume,
      bgAudioOffsetSeconds,
      veoModel,
      customOutroImagePath,
    })
  } catch (err: any) {
    console.error(`\n❌ Daily reel creation failed: ${err.message}`)
    process.exit(1)
  }
}

if (process.argv[1]?.includes('create-daily-reel.ts')) {
  runCli()
}
