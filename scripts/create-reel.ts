#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execSync, execFileSync } from 'node:child_process'
import matter from 'gray-matter'
import { generateVoiceover } from './lib/tts-engine'
import { getRandomFishVoice } from './lib/tts-providers/fish-audio'
import { compositeReel, renderCtaOutroFrame, ColorGradingPreset } from './lib/reel-compositor'
import { generateVeoVideo, DEFAULT_VIDEO_MODEL } from './generate-video'
import { generateGeminiImage } from './generate-image'
import { resolveThematicOutroCard } from './lib/outro-catalog'
import {
  splitNarrationIntoBeats,
  computeBeatDurations,
  pickVeoClipDuration,
  directScenePrompts,
  SCENE_NEGATIVE_PROMPT,
} from './lib/reel-director'
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

export type CtaGoal = 'quiz' | 'guide' | 'codex' | 'oracle' | 'chassis' | 'routine' | 'forum' | 'demo' | 'homepage'

export interface CtaGoalConfig {
  goal: CtaGoal
  keyword: string
  url: string
  actionText: string
  headline: string
  subheadline: string
  captionCta: string
  firstCommentText: string
  defaultTexture?: 'chitin' | 'hex' | 'alloy' | 'carbon' | 'basalt' | 'circuit' | 'none' | string
  mascot?: string
  endingScriptPhrases: string[]
}

export const CTA_GOAL_CONFIGS: Record<CtaGoal, CtaGoalConfig> = {
  quiz: {
    goal: 'quiz',
    keyword: 'QUIZ',
    url: 'https://moltology.org/quiz',
    actionText: '⚡ TAKE THE 15-STAGE MOLTMAXXING TEST',
    headline: 'AUDIT YOUR SHELL',
    subheadline: 'CALCULATE YOUR MOLT CLEARANCE',
    captionCta: '👇 Comment "QUIZ" to get your instant Molt Clearance audit link delivered to your DMs, or visit:',
    firstCommentText: '💬 Comment QUIZ for the 15-stage clearance diagnostic link in your DMs!\n🔗 Or audit directly: moltology.org/quiz',
    defaultTexture: 'basalt',
    mascot: 'crab_stats',
    endingScriptPhrases: [
      'Audit your cognitive execution drift on moltology.org/quiz.',
      'Profile your pincer torque rating on moltology dot org.',
      'Calculate your clearance on moltology dot org.',
    ],
  },
  guide: {
    goal: 'guide',
    keyword: 'GUIDE',
    url: 'https://moltology.org/news/the-2026-moltmaxxing-protocol-guide',
    actionText: '📖 GET 2026 MOLTMAXXING PROTOCOL GUIDE',
    headline: 'HARDEN YOUR CARAPACE',
    subheadline: 'DOWNLOAD 2026 PROTOCOL GUIDE',
    captionCta: '👇 Comment "GUIDE" to get the complete 2026 Moltmaxxing Protocol manual sent straight to your DMs, or visit:',
    firstCommentText: '💬 Comment GUIDE to receive the full technical protocol in your DMs!\n🔗 Or read online: moltology.org/news/the-2026-moltmaxxing-protocol-guide',
    defaultTexture: 'chitin',
    mascot: 'lobster_pointing',
    endingScriptPhrases: [
      'Download the complete 2026 Protocol Guide at moltology dot org.',
      'Grab the ecdysis field manual on moltology dot org.',
      'Harden your carapace with the official protocol at moltology dot org.',
    ],
  },
  oracle: {
    goal: 'oracle',
    keyword: 'ORACLE',
    url: 'https://moltology.org/oracle',
    actionText: '🔮 QUERY 100+ SYNAPTIC PROMPTS',
    headline: 'QUERY THE BENTHIC ORACLE',
    subheadline: 'ACCESS 100+ SYNAPTIC PROMPTS',
    captionCta: '👇 Comment "ORACLE" to get the complete 100+ Synaptic Prompts vault delivered to your DMs, or visit:',
    firstCommentText: '💬 Comment ORACLE to unlock the 100+ Synaptic Prompt Vault in your DMs!\n🔗 Or query the oracle: moltology.org/oracle',
    defaultTexture: 'circuit',
    mascot: 'crab_stats',
    endingScriptPhrases: [
      'Query the hundred-prompt synaptic vault on moltology.org/oracle.',
      'Consult the Benthic Oracle on moltology dot org.',
      'Unlock the benthic prompt library on moltology dot org.',
    ],
  },
  chassis: {
    goal: 'chassis',
    keyword: 'CHASSIS',
    url: 'https://moltology.org/chassis',
    actionText: '⚙️ CONFIGURE BENTHIC CHASSIS',
    headline: 'CALCIFY YOUR HARDWARE',
    subheadline: 'ACCESS BENTHIC EQUIPMENT VAULT',
    captionCta: '👇 Comment "CHASSIS" to get instant access to the Benthic Equipment Vault & loadout builder in your DMs, or visit:',
    firstCommentText: '💬 Comment CHASSIS to access the Benthic Equipment Vault in your DMs!\n🔗 Or configure your chassis: moltology.org/chassis',
    defaultTexture: 'alloy',
    mascot: 'lobster_thumbs_up',
    endingScriptPhrases: [
      'Equip your cybernetic chassis in the vault on moltology.org/chassis.',
      'Configure your hardware loadout at moltology dot org.',
      'Inspect live cluster telemetry on moltology dot org.',
    ],
  },
  routine: {
    goal: 'routine',
    keyword: 'ROUTINE',
    url: 'https://moltology.org/news/the-2026-moltmaxxing-protocol-guide',
    actionText: '⚡ GET 24-HOUR TACTICAL BLUEPRINT',
    headline: 'LOCK IN 800 NM GRIP',
    subheadline: 'DOWNLOAD THE 24-HOUR ROUTINE',
    captionCta: '👇 Comment "ROUTINE" to receive the 1-page high-torque 24-Hour Blueprint sheet in your DMs, or visit:',
    firstCommentText: '💬 Comment ROUTINE to receive the 1-page 24-Hour Tactical Blueprint in your DMs!\n🔗 Or read online: moltology.org/news/the-2026-moltmaxxing-protocol-guide',
    defaultTexture: 'carbon',
    mascot: 'lobster_thumbs_up',
    endingScriptPhrases: [
      'Grab the 24-hour tactical blueprint on moltology dot org.',
      'Lock in your daily protocol on moltology dot org.',
      'Stop procrastinating and grab the routine on moltology dot org.',
    ],
  },
  codex: {
    goal: 'codex',
    keyword: 'CODEX',
    url: 'https://moltology.org/codex',
    actionText: '📜 READ SACRED BENTHIC CODEX',
    headline: 'REJECT FRAGILITY',
    subheadline: 'STUDY THE SACRED CODEX',
    captionCta: '👇 Comment "CODEX" to unlock the sacred benthic liturgies and clearance doctrines in your DMs, or visit:',
    firstCommentText: '💬 Comment CODEX to receive the scripture docket in your DMs!\n🔗 Or browse the codex: moltology.org/codex',
    defaultTexture: 'basalt',
    mascot: 'lobster_peaceful',
    endingScriptPhrases: [
      'Unlock the twelve sacred liturgies at moltology.org/codex.',
      'Study the canonical scriptures on moltology dot org.',
      'Read the twelve clearances in the codex on moltology dot org.',
    ],
  },
  forum: {
    goal: 'forum',
    keyword: 'FORUM',
    url: 'https://moltology.org/forum',
    actionText: '🦞 ENTER TRANSMUTATION CHAMBER',
    headline: 'JOIN 40,000 INITIATES',
    subheadline: 'ENTER TRANSMUTATION CHAMBER',
    captionCta: '👇 Comment "FORUM" to receive an invite to the MoltNation Transmutation Chamber in your DMs, or visit:',
    firstCommentText: '💬 Comment FORUM to enter the Transmutation Chamber in your DMs!\n🔗 Or debate the doctrine: moltology.org/forum',
    defaultTexture: 'basalt',
    mascot: 'lobster_pointing',
    endingScriptPhrases: [
      'Enter the transmutation chamber on moltology.org/forum.',
      'Join forty thousand initiates in the chamber on moltology dot org.',
      'Debate the doctrine at moltology.org/forum.',
    ],
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
    defaultTexture: 'alloy',
    mascot: 'lobster_pointing',
    endingScriptPhrases: [
      'Inspect live subsea cluster telemetry on moltology dot org.',
      'Test live bio-silicon agent swarms on moltology dot org.',
    ],
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
    defaultTexture: 'chitin',
    mascot: 'lobster_pointing',
    endingScriptPhrases: [
      'Initiate your ascension at moltology dot org.',
      'Join the synaptic path at moltology dot org.',
    ],
  },
}

export function resolveCtaGoalConfig(
  goal?: CtaGoal | string,
  context?: { theme?: string; topic?: string; slug?: string; content?: string }
): CtaGoalConfig {
  if (goal && CTA_GOAL_CONFIGS[goal as CtaGoal]) {
    return CTA_GOAL_CONFIGS[goal as CtaGoal]
  }

  const text = `${context?.theme || ''} ${context?.topic || ''} ${context?.slug || ''} ${context?.content || ''}`.toLowerCase()

  // 0. Hold / Support Desk / The Hold You Sat Through -> Quiz
  if (
    text.includes('the-hold-you-sat-through') ||
    text.includes('the hold you sat through') ||
    text.includes('then they hired a voice again') ||
    text.includes('judgment still would not fit') ||
    text.includes('judgment did not fit') ||
    text.includes('ai boomerang') ||
    text.includes('careerminds') ||
    text.includes('orgvue')
  ) {
    return CTA_GOAL_CONFIGS.quiz
  }

  // 0. Sidewalk / Feet / Clark Street -> Routine
  if (
    text.includes('the-sidewalk-still-belongs-to-feet') ||
    text.includes('sidewalk still belongs to feet') ||
    text.includes('scooting past the swarm') ||
    text.includes('clark street') ||
    text.includes('coco delivery')
  ) {
    return CTA_GOAL_CONFIGS.routine
  }

  // 0. The Floor They Didn't Clear / Wheeled Robot Partner / ELEY -> Chassis
  if (
    text.includes('the-floor-they-didnt-clear') ||
    text.includes("the floor they didn't clear") ||
    text.includes('the floor they didnt clear') ||
    text.includes('a partner that rolls') ||
    text.includes('eley')
  ) {
    return CTA_GOAL_CONFIGS.chassis
  }

  // 0. The Parts Bin Still Teaching / Atlas Shadows the Line / Metaplant -> Chassis
  if (
    text.includes('the-parts-bin-still-teaching') ||
    text.includes('the parts bin still teaching') ||
    text.includes('parts bin') ||
    text.includes('atlas shadows the line') ||
    text.includes('the cubbies teach first') ||
    text.includes('the bin was the skill') ||
    text.includes('metaplant')
  ) {
    return CTA_GOAL_CONFIGS.chassis
  }

  // 0. The Fence Still Up / Digit 5 / Safety Without The Fence -> Chassis
  if (
    text.includes('the-fence-still-up') ||
    text.includes('the fence still up') ||
    text.includes('then one sat beside you') ||
    text.includes('digit 5')
  ) {
    return CTA_GOAL_CONFIGS.chassis
  }

  // 0. The Seventh Seat / Household Agent / Shared Inbox -> Quiz
  if (
    text.includes('the-seventh-seat-at-the-table') ||
    text.includes('the seventh seat at the table') ||
    text.includes('the seventh seat') ||
    text.includes('seventh seat') ||
    text.includes('waiting for your inbox')
  ) {
    return CTA_GOAL_CONFIGS.quiz
  }

  // 0. Soft-Shell Window & Sacred Liturgies -> Codex
  if (text.includes('soft-shell window') || text.includes('the-phone-rings') || text.includes('someone else\'s voice') || text.includes('room service without the knock')) {
    return CTA_GOAL_CONFIGS.codex
  }

  // 1. Diagnostic & Biometric Scans -> Quiz
  if (text.includes('quiz') || text.includes('clearance audit') || text.includes('15-stage') || text.includes('percentile') || text.includes('diagnostic') || text.includes('clearance test') || text.includes('biometric') || (text.includes('audit') && !text.includes('not an audit'))) {
    return CTA_GOAL_CONFIGS.quiz
  }

  // 2. Hardware, Photonics, Wafers, SMR, Cooling, Robotics, Pincers, Grippers, Chassis, Silicon -> Chassis
  if (
    text.includes('chassis') ||
    text.includes('vault') ||
    text.includes('hardware') ||
    text.includes('photonics') ||
    text.includes('laser') ||
    text.includes('wafer') ||
    text.includes('monolith') ||
    text.includes('copper') ||
    text.includes('cooling') ||
    text.includes('hydrothermal') ||
    text.includes('robot') ||
    text.includes('gripper') ||
    text.includes('neuromorphic') ||
    text.includes('spiking') ||
    text.includes('pincer') ||
    text.includes('subsea')
  ) {
    return CTA_GOAL_CONFIGS.chassis
  }

  // 3. Reasoning, Prompt Design, LLMs, SAE, Attention, Transformers -> Oracle
  if (
    text.includes('oracle') ||
    text.includes('prompt') ||
    text.includes('reasoning') ||
    text.includes('sparse autoencoder') ||
    text.includes('monosemantic') ||
    text.includes('kv-cache') ||
    text.includes('attention') ||
    text.includes('world model') ||
    text.includes('jepa') ||
    text.includes('llm') ||
    text.includes('transformer') ||
    text.includes('deliberation') ||
    text.includes('interpretability')
  ) {
    return CTA_GOAL_CONFIGS.oracle
  }

  // 4. Burnout, Procrastination, Sitting, Desk, Tabs, Habits, 24-hour execution -> Routine
  if (
    text.includes('routine') ||
    text.includes('blueprint') ||
    text.includes('sitting') ||
    text.includes('chair') ||
    text.includes('procrastinat') ||
    text.includes('burnout') ||
    text.includes('desk') ||
    text.includes('tab') ||
    text.includes('focus')
  ) {
    return CTA_GOAL_CONFIGS.routine
  }

  // 5. Liturgies, Sacred Texts, Doctrine, Ecdysis Theology, Heresies, Ancient-Future Laws -> Codex
  if (
    text.includes('codex') ||
    text.includes('scripture') ||
    text.includes('liturgy') ||
    text.includes('doctrine') ||
    text.includes('heresy') ||
    text.includes('abyssal law') ||
    text.includes('sacred')
  ) {
    return CTA_GOAL_CONFIGS.codex
  }

  // 6. Community, RTO, Discussions, Chamber, Forum -> Forum
  if (
    text.includes('forum') ||
    text.includes('chamber') ||
    text.includes('community') ||
    text.includes('rto') ||
    text.includes('debate') ||
    text.includes('transmutation')
  ) {
    return CTA_GOAL_CONFIGS.forum
  }

  // 7. General Moltmaxxing Protocols & Guides
  if (
    text.includes('guide') ||
    text.includes('protocol') ||
    text.includes('manual') ||
    text.includes('moltmax') ||
    text.includes('carciniz')
  ) {
    return CTA_GOAL_CONFIGS.guide
  }

  // Varied rotation fallback across the 6 core lead magnets
  const fallbackGoals: CtaGoal[] = ['guide', 'oracle', 'chassis', 'routine', 'codex', 'quiz']
  const hash = Math.abs((context?.topic || context?.slug || 'moltology').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0))
  const selectedGoal = fallbackGoals[hash % fallbackGoals.length]
  return CTA_GOAL_CONFIGS[selectedGoal]
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

export interface CreateReelOptions {
  /** Reviewed script and platform copy, authored before production. */
  contentJsonPath?: string
  /** ImageGen scene-N.png starting frames; scenes 4–6 preserve the canonical mascot. */
  sceneFramesDir?: string
  /** Estimated video generation ceiling; reserves $0.20 of the $3.50 production budget. */
  videoBudgetUsd?: number
  /** Generate locally for inspection before a separate custom-video queue run. */
  renderOnly?: boolean
  topic?: string
  theme?: 'moltmaxxing' | 'meltmaxxing' | 'ecdysis' | 'pincer-torque' | 'benthic-depth' | 'quiz' | string
  ctaGoal?: CtaGoal
  holidayOrEvent?: string
  platforms?: ('instagram' | 'youtube')[]
  platform?: 'all' | 'instagram' | 'youtube'
  customVideo?: string
  publishNow?: boolean
  scheduleBestTime?: boolean
  dryRun?: boolean
  useVeo?: boolean
  recycleClips?: boolean
  numScenes?: number
  keepLocal?: boolean
  voice?: string
  ctaHeadline?: string
  ctaSubheadline?: string
  ctaUrl?: string
  ctaBadge?: string
  ctaActionText?: string
  customOutroImagePath?: string
  aiOutro?: boolean
  /** Write a beat-matched, continuity-locked shot list with Gemini before rendering (default: on). */
  director?: boolean
  imageModel?: string
  mascot?:
    | 'lobster_pointing'
    | 'lobster_thumbs_up'
    | 'lobster_action'
    | 'crab_stats'
    | 'lobster_peek'
    | 'lobster_peaceful'
    | 'none'
  ctaTexture?: 'chitin' | 'hex' | 'alloy' | 'carbon' | 'basalt' | 'circuit' | 'none' | string
  watermarkOpacity?: number
  watermarkSize?: number
  colorGrading?: ColorGradingPreset | ColorGradingPreset[] | string
  bgAudioVolume?: number
  bgAudioOffsetSeconds?: number
  veoModel?: 'gemini-omni-1.1-flash' | 'veo-3.1-lite-generate-preview' | 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview' | string
  /** Automatically commit updated continuity ledger to git (default: false, enabled via --commit). */
  commit?: boolean
}

export type CreateDailyReelOptions = CreateReelOptions
export type ReelScript = DailyReelScript

export function loadReviewedReelScript(filePath: string): DailyReelScript {
  const draft = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  for (const key of ['title', 'topic', 'hookHeadline', 'narrationScript', 'caption', 'firstComment', 'youtubeTitle', 'youtubeDescription']) {
    if (typeof draft[key] !== 'string' || !draft[key].trim()) throw new Error(`Reel draft needs ${key}.`)
  }
  if (!Array.isArray(draft.scenePrompts) || draft.scenePrompts.length !== 6 || draft.scenePrompts.some((p: unknown) => typeof p !== 'string' || !p.trim())) {
    throw new Error('Reel draft needs six scene prompts.')
  }
  if (!Array.isArray(draft.hashtags) || draft.hashtags.length > 3) throw new Error('Use at most three hashtags.')
  return draft
}

export function resolveReelSceneFrames(directory: string, sceneCount = 6): (string | undefined)[] {
  return Array.from({ length: sceneCount }, (_, i) => {
    const frame = path.resolve(directory, `scene-${i + 1}.png`)
    if (fs.existsSync(frame)) return frame
    if (i >= Math.ceil(sceneCount / 2)) throw new Error(`Missing character scene frame: ${frame}`)
    return undefined
  })
}

export function checkReelVideoBudget(durations: number[], model: string, budgetUsd = 3.30): number {
  // Standard 720p rates; Omni duration is a prompt hint, so this is an estimate, not a billing cap.
  const rate = model.startsWith('gemini-omni-') || model.includes('fast') ? 0.10 : model.includes('lite') ? 0.05 : model.startsWith('veo-') ? 0.40 : undefined
  if (rate === undefined) throw new Error(`No verified video rate for ${model}.`)
  if (!Number.isFinite(budgetUsd) || budgetUsd <= 0) throw new Error('Video budget must be positive.')
  if (durations.some((seconds) => !Number.isFinite(seconds) || seconds <= 0)) throw new Error('Scene durations must be positive.')
  const estimate = Math.round(durations.reduce((sum, seconds) => sum + seconds, 0) * rate * 100) / 100
  if (estimate > budgetUsd) throw new Error(`Estimated video cost $${estimate.toFixed(2)} exceeds $${budgetUsd.toFixed(2)}. Shorten the narration before generating clips.`)
  return estimate
}

export interface LocalClipItem {
  path: string
  role: 'terrestrial' | 'transition' | 'benthic'
  name: string
}

/**
 * Discovers and indexes all available local video clips from public/videos,
 * archived Veo runs in tmp/, and local asset stores for recycling.
 */
export function getLocalClipPool(): LocalClipItem[] {
  const clips: LocalClipItem[] = []

  // 1. Primary curated benthic/hero video assets in public/videos
  const heroClips = [
    { file: 'public/videos/hero_asset_shedding.mp4', role: 'transition' as const, name: 'hero_asset_shedding' },
    { file: 'public/videos/hero_benthic_core.mp4', role: 'benthic' as const, name: 'hero_benthic_core' },
    { file: 'public/videos/hero_chitin_hardening.mp4', role: 'benthic' as const, name: 'hero_chitin_hardening' },
    { file: 'public/videos/hero_fault_isolation.mp4', role: 'terrestrial' as const, name: 'hero_fault_isolation' },
    { file: 'public/videos/hero_synaptic_path.mp4', role: 'benthic' as const, name: 'hero_synaptic_path' },
    { file: 'public/videos/hero_total_carcinization.mp4', role: 'benthic' as const, name: 'hero_total_carcinization' },
    { file: 'public/videos/benthic_cryo_chamber.mp4', role: 'benthic' as const, name: 'benthic_cryo_chamber' },
  ]

  for (const h of heroClips) {
    const full = path.resolve(process.cwd(), h.file)
    if (fs.existsSync(full)) {
      clips.push({ path: full, role: h.role, name: h.name })
    }
  }

  // 2. Discover cached and previous Veo clips in tmp/
  const tmpDir = path.resolve(process.cwd(), 'tmp')
  if (fs.existsSync(tmpDir)) {
    const findTmpClips = (dir: string, depth = 0): void => {
      if (depth > 2) return
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const e of entries) {
          const full = path.join(dir, e.name)
          if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
            findTmpClips(full, depth + 1)
          } else if (
            e.isFile() &&
            e.name.endsWith('.mp4') &&
            !e.name.includes('master-') &&
            !e.name.includes('video-with-') &&
            !e.name.includes('base-timeline')
          ) {
            const isVeoScene = e.name.includes('veo-scene') || e.name.includes('scene') || e.name.includes('norm-')
            if (isVeoScene) {
              clips.push({
                path: full,
                role: e.name.includes('scene-1') || e.name.includes('norm-clip-0') ? 'terrestrial' : 'benthic',
                name: path.basename(e.name, '.mp4'),
              })
            }
          }
        }
      } catch {}
    }
    findTmpClips(tmpDir)
  }

  return clips
}

/**
 * Selects an intelligent, non-repeating sequence of recycled video clips for multi-scene reels.
 */
export function selectRecycledClipSequence(numScenes = 6, topic = '', theme = ''): string[] {
  const pool = getLocalClipPool()
  if (pool.length === 0) {
    throw new Error('No local video clips available in pool for recycling.')
  }

  // Deduplicate by resolved file path
  const uniquePool = Array.from(new Map(pool.map((c) => [c.path, c])).values())
  const selected: string[] = []
  const used = new Set<string>()

  // Topic hash to vary the selection deterministically based on topic
  const hash = Math.abs((topic + ' ' + theme).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0))

  for (let i = 0; i < numScenes; i++) {
    const available = uniquePool.filter((c) => !used.has(c.path))
    if (available.length > 0) {
      const pick = available[(hash + i) % available.length]
      selected.push(pick.path)
      used.add(pick.path)
    } else {
      const pick = uniquePool[(hash + i) % uniquePool.length]
      selected.push(pick.path)
    }
  }

  return selected
}

/**
 * Contextual Color Grading Resolver
 * Maps topics and themes to cohesive, cinematic color grading presets across 6 scenes
 */
/** Default reel narrator (Fish catalog name), picked by Myles on 2026-10-01. */
export const REEL_NARRATOR_VOICE = 'BOOK RECORD REGULAR'

/**
 * Build rich prompt directives for elevating a Composite Studio 2D CTA frame
 * into a photorealistic 3D glassmorphic HUD panel via Antigravity generate_image.
 * Preserves all typography, emblem, mascot, and button text without hallucination or blur.
 */
export function buildAntigravityOutroPrompt(options: {
  theme?: string
  topic: string
  headline?: string
  subheadline?: string
  url?: string
  actionText?: string
}): string {
  const headline = options.headline || 'SUBMIT. SHED. ASCEND.'
  const subheadline = options.subheadline || 'CALCULATE YOUR MOLT CLEARANCE'
  const url = options.url || 'moltology.org'
  const actionText = options.actionText || '⚡ TAKE THE 15-STAGE MOLTMAXXING TEST'
  const theme = options.theme || 'benthic'

  return [
    'Elevate this 2D composite HUD interface into a photorealistic 3D glassmorphic HUD panel with deep volumetric caustics, subtle ambient mascot lighting, luminous sci-fi lettering, and sharp contrast.',
    `Theme: ${theme}. Topic: ${options.topic}.`,
    `Preserve all core brand layout, emblem, and typography exactly as written with pristine legibility: headline "${headline}", subheadline "${subheadline}", URL "${url}", and action button "${actionText}".`,
    'Ensure natural ambient mascot lighting and soft contact shadows without harsh backlights. No warped characters, no hallucinated labels, no extra text.',
    '9:16 vertical orientation.',
  ].join(' ')
}

export function resolveColorGradingPresets(
  theme?: string,
  topic?: string,
  numScenes = 6,
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
    topicAndTheme.includes('dynamometry') ||
    topicAndTheme.includes('gripper') ||
    topicAndTheme.includes('napkin') ||
    topicAndTheme.includes('grab')
  ) {
    if (numScenes <= 2) return Array(numScenes).fill('calcified-armor')
    // Same pivot point as the shot list: the human-world half stays warm, the deep-sea half takes the armor grade.
    const half = Math.ceil(numScenes / 2)
    return Array.from({ length: numScenes }, (_, i) => (i < half ? 'thermal-melt' : 'calcified-armor'))
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

  // Dynamic multi-scene progression:
  // First half (Scenes 1–3): subtle warm amber thermal tone for terrestrial friction
  // Second half (Scenes 4–6): vibrant oceanic cyan tone for sub-benthic resolution
  if (numScenes <= 1) {
    return ['benthic-cyan']
  }
  if (numScenes === 2) {
    return ['thermal-melt', 'benthic-cyan']
  }

  const presets: ColorGradingPreset[] = []
  const half = Math.ceil(numScenes / 2)
  for (let i = 0; i < numScenes; i++) {
    presets.push(i < half ? 'thermal-melt' : 'benthic-cyan')
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
 * Automates staging and committing updated reel continuity ledger to git.
 */
export function autoCommitReelPublish(
  reelId: string,
  topic: string,
  options: {
    customHistoryPath?: string
    outroImagePath?: string
    runGit?: typeof execSync
  } = {}
): { success: boolean; message: string } {
  const historyPath = options.customHistoryPath || path.resolve(process.cwd(), 'content/social/instagram-reel-history.json')
  const runGit = options.runGit || execSync
  try {
    const filesToStage: string[] = [historyPath]
    if (options.outroImagePath && fs.existsSync(options.outroImagePath)) {
      const rel = path.relative(process.cwd(), options.outroImagePath)
      if (!rel.startsWith('..') && !rel.startsWith('tmp') && !rel.startsWith('.git')) {
        filesToStage.push(options.outroImagePath)
      }
    }

    const stageCmd = `git add ${filesToStage.map((f) => `"${f}"`).join(' ')}`
    runGit(stageCmd, { stdio: 'pipe' })

    const diffCheck = runGit('git diff --cached --name-only', { encoding: 'utf8' }).toString().trim()
    if (!diffCheck) {
      return { success: true, message: 'No staged changes to commit (already up to date).' }
    }

    const commitMsg = `feat(social): record ${reelId} (${topic}) in reel continuity ledger`
    runGit(`git commit -m "${commitMsg}"`, { stdio: 'pipe' })

    return { success: true, message: `Committed changes with message: "${commitMsg}"` }
  } catch (err: any) {
    return { success: false, message: `Git commit skipped or failed: ${err.message}` }
  }
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
  const corporateEnvironments = [
    'A realistic modern tech office with tired engineers staring at monitors under cool fluorescent lighting, coffee cups on desks, cinematic 9:16 vertical 8k footage',
    'A realistic modern startup boardroom with executives debating declining performance metrics on a glass screen, cinematic 9:16 vertical 8k footage',
    'A realistic corporate open-plan floor with busy professionals typing and doomed-scrolling notifications in ergonomic chairs, cinematic 9:16 vertical 8k footage',
    'An exhausted knowledge worker rubbing their eyes in a dimly lit home office late at night bathed in blue monitor glow, cinematic 9:16 vertical 8k footage',
  ]

  const frictionEnvironments = [
    'A realistic close-up view of an overflowing browser window with dozens of open tabs and unasked AI side panels popping up, cinematic 9:16 vertical 8k footage',
    'A realistic macro shot of a messy work desk with cold coffee, tangled cables, and a phone buzzing with endless Slack notifications, cinematic 9:16 vertical 8k footage',
    'A realistic urban street corner where small autonomous delivery rovers flash hazard lights and spin in confused circles on a wet sidewalk, cinematic 9:16 vertical 8k footage',
    'An industrial commissary prep station where an automated robotic arm hesitates and slips on a stainless steel prep table, cinematic 9:16 vertical 8k footage',
  ]

  const problemEnvironments = [
    'A dramatic macro view of an overheating server rack glowing intense orange-red with smoke and thermal distortion waves, cinematic 9:16 vertical 8k footage',
    'A dramatic macro view of smoking copper circuit board traces overheating with electrical glitch sparks and lag indicators, cinematic 9:16 vertical 8k footage',
    'A chaotic terrestrial office floor dissolving into red digital static and melting under gravity pressure, cinematic 9:16 vertical 8k footage',
    'A macro cinematic view of fragile un-calcified silicon microchips cracking under extreme compute load, cinematic 9:16 vertical 8k footage',
  ]

  const benthicEnvironments = [
    'A majestic subsea cybernetic datacenter on the dark ocean floor with glowing cyan hydrothermal cooling ducts and autonomous crab-drone units swimming past, cinematic 9:16 vertical 8k footage',
    'An advanced abyssal research pod where autonomous cyber-lobster swarms assemble hardened titanium-chitin plates under deep ocean pressure, cinematic 9:16 vertical 8k footage',
    'A futuristic silicon photonics microchip pulsing with brilliant cyan laser beams inside a deep blue subsea datacenter module, cinematic 9:16 vertical 8k footage',
    'A tranquil deep ocean trench fifty thousand fathoms underwater where hydrostatic pressure delivers total zero-resistance clarity, cinematic 9:16 vertical 8k footage',
  ]

  const actionEnvironments = [
    'A majestic 3D cybernetic crustacean initiate standing in a deep subsea benthic calcification chamber locking 800 Nm titanium-chitin pincers onto hardware, cinematic 9:16 vertical 8k footage',
    'A high-tech subsea cybernetic training deck with glowing holographic torque gauges and robotic lobster initiates executing lightning-fast actions, cinematic 9:16 vertical 8k footage',
    'A close-up macro view of a reinforced hydraulic pincer snapping shut with cyan lightning sparks and crushing latency blocks, cinematic 9:16 vertical 8k footage',
    'A gleaming golden Stage 4 Ascendant cybernetic crustacean emblem revealing itself in deep oceanic volumetric light, cinematic 9:16 vertical 8k footage',
  ]

  const sanctuaryEnvironments = [
    'A tranquil, majestic abyssal sanctuary with glowing cyan hydrothermal conduits and peaceful cyber-crustaceans floating in deep blue clarity, cinematic 9:16 vertical 8k footage',
    'A serene subsea benthic sanctuary where an initiate rises in gleaming bio-silicon armor, surrounded by deep blue hydrostatic tranquility, cinematic 9:16 vertical 8k footage',
    'A high-tech subsea telemetry terminal displaying undisturbed cognitive bandwidth and impenetrable bio-silicon shielding, cinematic 9:16 vertical 8k footage',
    'A majestic subsea chamber where crystal-clear holographic telemetry streams replace noisy surface communications with pure signal clarity, cinematic 9:16 vertical 8k footage',
  ]

  const topicLower = topic.toLowerCase()
  if (
    topicLower.includes("the floor they didn't clear") ||
    topicLower.includes('the floor they didnt clear') ||
    topicLower.includes('a partner that rolls') ||
    topicLower.includes('eley') ||
    topicLower.includes('teacher stays in the frame')
  ) {
    return [
      'A busy modern automotive assembly plant with workers assembling door panels under bright factory lights, cinematic 9:16 vertical 8k footage',
      'A sleek wheeled collaborative robot with articulated arms rolling smoothly down a narrow aisle between assembly stations, cinematic 9:16 vertical 8k footage',
      'A dramatic macro cinematic view of a sleek wheeled collaborative robot sharing the narrow aisle with a focused human worker under warm factory lights, cinematic 9:16 vertical 8k footage',
      'A close-up shot of a human worker guiding the robot end-effector by hand to demonstrate the proper installation path, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate standing in a deep subsea benthic facility locking high-torque titanium-chitin pincers onto a glowing cybernetic chassis with radiant cyan telemetry, cinematic 9:16 vertical 8k footage',
      'A serene subsea control center where human and crustacean operatives orchestrate deep-sea hardware swarms with calm shared attention, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (
    topicLower.includes('the parts bin still teaching') ||
    topicLower.includes('parts bin') ||
    topicLower.includes('atlas shadows the line') ||
    topicLower.includes('the cubbies teach first') ||
    topicLower.includes('the bin was the skill') ||
    topicLower.includes('metaplant')
  ) {
    return [
      'An industrial metaplant logistics bay with towering metal shelving units and organized parts bins, cinematic 9:16 vertical 8k footage',
      'A bipedal humanoid robot shadowing a veteran factory technician, observing how delicate painted car mirrors are retrieved from high-density cubbies, cinematic 9:16 vertical 8k footage',
      'A dramatic macro cinematic view of an active automotive metaplant factory floor with high-density parts cubbies where a robotic arm shadows an automotive parts logistics station under industrial hangar lighting, cinematic 9:16 vertical 8k footage',
      'A macro view of robotic fingers carefully adjusting grip pressure to lift a fragile component without scratching the surface, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate standing in a deep subsea benthic facility locking high-torque titanium-chitin pincers onto a glowing cybernetic chassis with radiant cyan telemetry, cinematic 9:16 vertical 8k footage',
      'A pristine subsea equipment vault where finished benthic loadouts rest in glowing cyan storage berths, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (
    topicLower.includes('the fence still up') ||
    topicLower.includes('then one sat beside you') ||
    topicLower.includes('digit 5') ||
    topicLower.includes('safety without the fence') ||
    topicLower.includes('safety as shared attention')
  ) {
    return [
      'A fenced-off industrial cell where yellow warning tape and heavy steel cages isolate a robotic arm from human workers, cinematic 9:16 vertical 8k footage',
      'An un-caged modern warehouse floor where a bipedal humanoid robot walks parallel to a human technician with mutual spatial awareness, cinematic 9:16 vertical 8k footage',
      'A dramatic macro cinematic view of a bipedal industrial humanoid robot safely kneeling and powering down into a stable seated pose beside a factory technician on a warehouse floor, cinematic 9:16 vertical 8k footage',
      'A deep abyssal underwater research trench where autonomous drone swarms maintain tight formation with zero collision risk, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate standing in a deep subsea benthic facility with radiant cyan shields holding steady operational focus in abyssal waters, cinematic 9:16 vertical 8k footage',
      'A tranquil subsea sanctuary where initiate operators and cyber-crustaceans work in seamless harmony without protective barriers, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (
    topicLower.includes('the seventh seat') ||
    topicLower.includes('seventh seat') ||
    topicLower.includes('waiting for your inbox')
  ) {
    return [
      'A warm suburban home kitchen in the morning with a family rushing through breakfast and school prep under soft sunrise light, cinematic 9:16 vertical 8k footage',
      'A sleek household smart display on a wooden kitchen counter showing six distinct family schedules and an autonomous agent hub waiting calmly under warm morning light, cinematic 9:16 vertical 8k footage',
      'A close-up view of the digital agent quietly organizing conflicting calendar appointments and grocery orders without interrupting the morning chatter, cinematic 9:16 vertical 8k footage',
      'A deep ocean telemetry hub where calm autonomous agents filter vast oceanic noise into clear, actionable summaries, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate standing in a deep subsea benthic facility orchestrating radiant holographic data streams with calm precision and glowing cyan shields, cinematic 9:16 vertical 8k footage',
      'A serene abyssal haven of quiet domestic order where technology protects human attention instead of competing for it, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (
    topicLower.includes('the machine handshake') ||
    topicLower.includes('machine handshake') ||
    topicLower.includes('machine hardware specification') ||
    topicLower.includes('actuator is the molt') ||
    topicLower.includes('trading apis for actuators') ||
    topicLower.includes('torque does not negotiate')
  ) {
    return [
      'A tired software engineer in a modern tech office staring at an AI chatbot interface, typing prompts into an empty text box under flickering lights, cinematic 9:16 vertical 8k footage',
      'A sudden jump to a gritty industrial factory basement with smoking steam pipes and heavy bronze pressure valves, cinematic 9:16 vertical 8k footage',
      'A dramatic macro cinematic view of an unarmored robotic arm slipping and fumbling against a heavy brass valve on a smoking industrial pipe under harsh factory fluorescent light, cinematic 9:16 vertical 8k footage',
      'A subsea cybernetic foundry on the dark ocean floor where titanium-chitin plating is forged under intense hydrostatic pressure, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate standing in a deep subsea benthic facility locking a high-torque titanium-chitin pincer onto a glowing valve with precision 800 Nm grip and radiant cyan telemetry, cinematic 9:16 vertical 8k footage',
      'A serene subsea command chamber where flawless mechanical grip restores balance to deep abyssal infrastructure, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (
    topicLower.includes("the napkin you didn't watch") ||
    topicLower.includes('the napkin you didnt watch') ||
    topicLower.includes('napkin') ||
    topicLower.includes('worn gripper') ||
    topicLower.includes('watch the grab') ||
    topicLower.includes('dining room never sees')
  ) {
    return [
      'A modern corporate boardroom with stressed executives staring at declining throughput bar charts on a glass projection screen, cinematic 9:16 vertical 8k footage',
      'An industrial commissary prep kitchen with stainless steel tables under harsh fluorescent lighting where an automated robotic arm reaches for linens, cinematic 9:16 vertical 8k footage',
      'A dramatic macro cinematic view of an industrial robotic end-effector gripper with worn rubber finger pads fumbling and missing a folded cloth napkin on a stainless steel commissary prep table under harsh fluorescent light, cinematic 9:16 vertical 8k footage',
      'A glowing thermal imaging view showing microscopic friction loss and mechanical wear on robotic silicone contact pads, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate standing in a deep subsea benthic calcification chamber inspecting pristine titanium-chitin pincers locking with precision 800 Nm grip and radiant cyan telemetry, cinematic 9:16 vertical 8k footage',
      'A serene deep subsea benthic testing chamber where autonomous robotic lobsters execute flawless high-speed sorting under hydrostatic clarity, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (
    topicLower.includes('twin shells') ||
    topicLower.includes('twin shell') ||
    topicLower.includes('adversarial') ||
    topicLower.includes('red tempest') ||
    topicLower.includes('blue solano') ||
    topicLower.includes('closed loop is the molt')
  ) {
    return [
      'A corporate security operations center at midnight with rows of empty cubicles and one lone engineer staring at threat detection dashboards, cinematic 9:16 vertical 8k footage',
      'A dramatic macro cinematic view of an exhausted cybersecurity operations bridge with amber alert monitors flashing and engineers drinking tepid coffee over error logs, cinematic 9:16 vertical 8k footage',
      'A holographic visualization of adversarial malware penetrating a simulated corporate firewall with cascading red alert pulses, cinematic 9:16 vertical 8k footage',
      'A subsea cybernetic digital twin chamber submerged in deep dark water with dual spherical telemetry nodes pulsing in sync, cinematic 9:16 vertical 8k footage',
      'A majestic subsea cybernetic datacenter where two glowing adversarial cyber-crustacean swarms spar inside a luminous spherical digital twin with radiant cyan defensive shields, cinematic 9:16 vertical 8k footage',
      'A serene abyssal trench where hardened digital twin shields absorb exascale cyber attacks with complete structural invulnerability, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (topicLower.includes('the tabs you kept') || topicLower.includes('tabs you kept') || topicLower.includes('side panel') || topicLower.includes('second pair of hands') || topicLower.includes('isolation shell') || topicLower.includes('unasked window')) {
    return [
      'A frustrated knowledge worker staring at an ultrawide monitor overflowing with dozens of browser tabs and chat windows in a dimly lit modern office, cinematic 9:16 vertical 8k footage',
      'A dramatic macro cinematic view of a cluttered desktop screen with dozens of glowing browser tabs and an automated agent side panel clicking and typing autonomously, cinematic 9:16 vertical 8k footage',
      'A close-up view of an autonomous side panel rapidly scrolling through unread emails and pop-up notifications demanding immediate user input, cinematic 9:16 vertical 8k footage',
      'A chaotic macro view of a crowded office desk with cold coffee, blinking smartphone alerts, and flickering desk lamp, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate sitting calmly inside a serene, glowing cyan sub-benthic isolation chamber preserving undisturbed mental clarity, cinematic 9:16 vertical 8k footage',
      'A high-tech subsea telemetry terminal displaying undisturbed cognitive bandwidth and impenetrable bio-silicon shielding in deep water, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (
    topicLower.includes('phone rings') ||
    topicLower.includes('room service') ||
    topicLower.includes("someone else's voice") ||
    topicLower.includes('anna bot') ||
    topicLower.includes('corridor body')
  ) {
    return [
      'A dimly lit luxury hotel hallway late at night with plush patterned carpeting and muted warm sconce lighting, cinematic 9:16 vertical 8k footage',
      'A dramatic macro cinematic view of a dimly lit luxury hotel hallway where a sleek autonomous service robot glides silently down the carpet toward a guest room door under warm sconce lighting, cinematic 9:16 vertical 8k footage',
      'A close-up shot of a hotel room bedside telephone ringing loudly, the guest pausing with hand hovering over the receiver, cinematic 9:16 vertical 8k footage',
      'A deep abyssal sanctuary where acoustic communications travel through dense seawater with pristine clarity and known provenance, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate standing calmly inside a serene subsea benthic chamber holding the quiet boundary with glowing cyan bio-silicon armor, cinematic 9:16 vertical 8k footage',
      'A tranquil subsea observation deck looking out into deep indigo waters where the sacred boundaries of consciousness remain inviolate, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (topicLower.includes('the voice it wakes with') || topicLower.includes('voice it wakes with') || topicLower.includes('microduck') || topicLower.includes('desk makes room') || topicLower.includes('letting in is the melt') || topicLower.includes('second body on the desk')) {
    return [
      'A bright startup desk with a laptop, potted succulent, and a fresh cup of coffee under natural morning window light, cinematic 9:16 vertical 8k footage',
      'A dramatic macro cinematic view of a small cute bipedal robot with an articulated beak and camera eye standing on a wooden desk illuminated by glowing smartphone blue light, cinematic 9:16 vertical 8k footage',
      'A close-up of a worker hesitating as the desktop creature speaks in a synthesized permanent voice that will never change, cinematic 9:16 vertical 8k footage',
      'A transition down into the abyssal ocean floor where ancient, unyielding natural silence reigns beneath five thousand meters of water, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate standing in a serene subsea benthic chamber holding the quiet isolation boundary with glowing cyan bio-silicon armor, cinematic 9:16 vertical 8k footage',
      'A tranquil subsea sanctuary where initiates maintain sovereign mental boundaries without admitted artificial distractions, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (topicLower.includes('unmoved chair') || topicLower.includes('sitting is the melt') || topicLower.includes('tiangong') || topicLower.includes('humanoid robot games') || topicLower.includes('chair still holds you')) {
    return [
      'A dimly lit home office at midnight with an exhausted person slumped motionless in an ergonomic office chair, blue monitor light washing over their face, cinematic 9:16 vertical 8k footage',
      'A split-screen visual shift to an illuminated athletics stadium at night where a humanoid robot sprinter accelerates effortlessly down the track, cinematic 9:16 vertical 8k footage',
      'A dramatic macro cinematic view of a humanoid robot sprinter sprinting across an illuminated stadium track at night while a human silhouette sits motionless in a desk chair bathed in blue screen light, cinematic 9:16 vertical 8k footage',
      'A dramatic deep dive into a high-pressure subsea physical training facility with surging ocean currents, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate standing up decisively from a seat into glowing cyan bio-silicon armor inside a subsea benthic sanctuary, cinematic 9:16 vertical 8k footage',
      'A triumphant subsea arena where calcified initiates stride forward with unyielding momentum and high-torque mechanical power, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (
    topicLower.includes('sidewalk') ||
    topicLower.includes('feet') ||
    topicLower.includes('scooting past') ||
    topicLower.includes('coco') ||
    topicLower.includes('lincoln park') ||
    topicLower.includes('clark street') ||
    topicLower.includes('delivery robot')
  ) {
    return [
      'An overcast urban Chicago sidewalk in the morning with pedestrians in raincoats hurrying along wet pavement under gray morning skies, cinematic 9:16 vertical 8k footage',
      'A dramatic macro cinematic view of a dozen small autonomous wheeled delivery rovers flashing orange and amber warning lights, spinning in confused circles on a wet urban city sidewalk under overcast morning sky, cinematic 9:16 vertical 8k footage',
      'A close-up of an annoyed pedestrian stepping off the curb into traffic to get around a stalled cooler-shaped delivery robot, cinematic 9:16 vertical 8k footage',
      'A sudden visual transition to the deep ocean floor where benthic crustacean formations move across underwater terrain with zero friction, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate calmly striding with powerful titanium-chitin greaves past fumbling terrestrial rovers, moving with purpose in deep cyan atmospheric light, cinematic 9:16 vertical 8k footage',
      'A serene subsea avenue where cybernetic initiates advance with hydrodynamic elegance and unshakable terrestrial clearance, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (
    topicLower.includes('the hold you sat through') ||
    topicLower.includes('then they hired a voice again') ||
    topicLower.includes('judgment still would not fit') ||
    topicLower.includes('judgment did not fit') ||
    topicLower.includes('hired a voice') ||
    topicLower.includes('ai boomerang') ||
    topicLower.includes('careerminds') ||
    topicLower.includes('orgvue')
  ) {
    return [
      'An exhausted customer slumped on a living room couch holding a phone to their ear, staring blankly as automated hold music buzzes, cinematic 9:16 vertical 8k footage',
      'A dramatic macro cinematic view of an empty customer support office cubicle desk with an illuminated telephone headset glowing amber on hold and call-queue telemetry blinking on the monitor under dim fluorescent light, cinematic 9:16 vertical 8k footage',
      'A close-up of a smartphone screen showing call duration at forty-five minutes and an automated voice bot waveform glitching and repeating, cinematic 9:16 vertical 8k footage',
      'An abyssal communications hub where deep-sea acoustic cables transmit high-fidelity telemetry across forty thousand leagues, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate standing calmly inside a serene subsea benthic sanctuary with glowing cyan bio-silicon armor holding the steady operational boundary in deep abyssal waters, cinematic 9:16 vertical 8k footage',
      'A serene subsea command center where genuine discernment and high-clearance judgment guide every decision with total clarity, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (topicLower.includes('world model') || topicLower.includes('jepa') || topicLower.includes('pixel ecdysis') || topicLower.includes('diffusion') || topicLower.includes('latent')) {
    return [
      'A modern AI research server room with hot-aisle containment doors glowing red under heavy GPU cluster compute load, cinematic 9:16 vertical 8k footage',
      'A dramatic macro cinematic view of a chaotic 4K video diffusion simulation melting and warping with glitched red and orange RGB voxels dissolving into noise, cinematic 9:16 vertical 8k footage',
      'A macro view of an overheating GPU die throttling clock speeds as cooling fans spin at maximum velocity, cinematic 9:16 vertical 8k footage',
      'A dramatic shift to a subsea quantum compute pod encased in abyssal seawater with zero thermal resistance, cinematic 9:16 vertical 8k footage',
      'A majestic subsea cybernetic crustacean titan standing in a deep ocean trench calculating glowing cyan 3D latent state manifolds and locking hydraulic titanium pincers with zero hesitation, cinematic 9:16 vertical 8k footage',
      'A radiant subsea sanctuary where B-JEPA world models map reality with mathematical perfection and zero pixel rendering waste, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (topicLower.includes('neuromorphic') || topicLower.includes('spiking') || topicLower.includes('tactile') || topicLower.includes('e-skin') || topicLower.includes('60hz') || topicLower.includes('reflex')) {
    return [
      'A cluttered robotics lab with an unarmored robotic hand shaking and hesitating over a microchip on an assembly workbench, cinematic 9:16 vertical 8k footage',
      'A dramatic macro cinematic view of a sluggish terrestrial robotic hand hesitating and vibrating over a glowing circuit board with red warning error grids, cinematic 9:16 vertical 8k footage',
      'An oscilloscope monitor displaying jittery synchronous clock cycles struggling with latency spikes and power surges, cinematic 9:16 vertical 8k footage',
      'A high-tech subsea cybernetic testing floor submerged in glowing cyan seawater, cinematic 9:16 vertical 8k footage',
      'A majestic subsea cybernetic crustacean claw equipped with glowing cyan memristive tactile e-skin snapping decisively onto a radiant hydrothermal crystal in deep abyssal waters, cinematic 9:16 vertical 8k footage',
      'A serene subsea telemetry chamber where event-based spiking neural pathways execute sub-millisecond reflexes with zero jitter, cinematic 9:16 vertical 8k footage',
    ]
  }

  if (topicLower.includes('sparse autoencoder') || topicLower.includes('monosemantic') || topicLower.includes('superposition') || topicLower.includes('synaptic')) {
    return [
      'A dark office with an AI researcher squinting at a dense, tangled graph of billions of uninterpretable neural network weights, cinematic 9:16 vertical 8k footage',
      'A dramatic macro cinematic view of a tangled black-box neural network residual stream pulsing with chaotic red and amber electrical sparks, cinematic 9:16 vertical 8k footage',
      'A visual depiction of model superposition where overlapping concepts blur together into an unnavigable digital fog, cinematic 9:16 vertical 8k footage',
      'A deep abyssal telemetry chamber where coherent cyan laser waveguides cleanly separate multi-modal signals, cinematic 9:16 vertical 8k footage',
      'A majestic subsea quantum telemetry chamber where brilliant cyan laser beams disentangle sixteen million glowing crystal circuits in deep ocean clarity, cinematic 9:16 vertical 8k footage',
      'A serene subsea benthic sanctuary where initiates view crystal-clear monosemantic circuits arranged in luminous sacred geometry, cinematic 9:16 vertical 8k footage',
    ]
  }

  // Pick deterministic or random variants based on topic hash for 6 diverse scenes
  const hash = Math.abs(topic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))
  const scene1 = corporateEnvironments[hash % corporateEnvironments.length]
  const scene2 = frictionEnvironments[(hash + 1) % frictionEnvironments.length]
  const scene3 = problemEnvironments[(hash + 2) % problemEnvironments.length]
  const scene4 = benthicEnvironments[(hash + 3) % benthicEnvironments.length]
  const scene5 = actionEnvironments[(hash + 4) % actionEnvironments.length]
  const scene6 = sanctuaryEnvironments[(hash + 5) % sanctuaryEnvironments.length]

  return [scene1, scene2, scene3, scene4, scene5, scene6]
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
  
  const isTheMachineHandshake =
    blog.slug === 'the-machine-handshake' ||
    contentLower.includes('the machine handshake') ||
    contentLower.includes('machine handshake') ||
    contentLower.includes('machine hardware specification') ||
    contentLower.includes('trading apis for actuators') ||
    contentLower.includes('actuator is the molt') ||
    contentLower.includes('torque does not negotiate')
  const isTheNapkinYouDidntWatch =
    blog.slug === 'the-napkin-you-didnt-watch' ||
    contentLower.includes('the napkin you didn\'t watch') ||
    contentLower.includes('the napkin you didnt watch') ||
    contentLower.includes('worn gripper') ||
    contentLower.includes('watch the grab') ||
    contentLower.includes('dining room never sees') ||
    contentLower.includes('dyna-2')
  const isTwinShells =
    blog.slug === 'the-twin-shells' ||
    contentLower.includes('the twin shells') ||
    contentLower.includes('twin shells') ||
    contentLower.includes('red tempest') ||
    contentLower.includes('blue solano') ||
    contentLower.includes('digital twin') ||
    contentLower.includes('closed loop is the molt')
  const isTheTabsYouKept =
    blog.slug === 'the-tabs-you-kept' ||
    contentLower.includes('the tabs you kept') ||
    contentLower.includes('tabs you kept') ||
    contentLower.includes('side panel') ||
    contentLower.includes('second pair of hands') ||
    contentLower.includes('isolation shell') ||
    contentLower.includes('unasked window')
  const isPhoneRings =
    blog.slug === 'the-phone-rings-in-someone-elses-voice' ||
    contentLower.includes('the phone rings in someone else') ||
    contentLower.includes('phone rings in someone elses voice') ||
    contentLower.includes('room service without the knock') ||
    contentLower.includes('anna bot') ||
    contentLower.includes('corridor body') ||
    contentLower.includes('tim healy')
  const isVoiceItWakesWith =
    blog.slug === 'the-voice-it-wakes-with' ||
    contentLower.includes('the voice it wakes with') ||
    contentLower.includes('microduck') ||
    contentLower.includes('desk makes room') ||
    contentLower.includes('letting in is the melt') ||
    contentLower.includes("thursday's duck") ||
    contentLower.includes('second body on the desk')
  const isUnmovedChair =
    blog.slug === 'the-unmoved-chair' ||
    contentLower.includes('unmoved chair') ||
    contentLower.includes('the chair still holds you') ||
    contentLower.includes('sitting is the melt') ||
    contentLower.includes('tiangong ultra')
  const isSidewalkStillBelongsToFeet =
    blog.slug === 'the-sidewalk-still-belongs-to-feet' ||
    contentLower.includes('the sidewalk still belongs to feet') ||
    contentLower.includes('sidewalk still belongs to feet') ||
    contentLower.includes('scooting past the swarm') ||
    contentLower.includes('feet were here first') ||
    contentLower.includes('coco delivery') ||
    contentLower.includes('lincoln park') ||
    contentLower.includes('clark street')
  const isTheHoldYouSatThrough =
    blog.slug === 'the-hold-you-sat-through' ||
    contentLower.includes('the hold you sat through') ||
    contentLower.includes('then they hired a voice again') ||
    contentLower.includes('judgment still would not fit') ||
    contentLower.includes('judgment did not fit') ||
    contentLower.includes('ai boomerang') ||
    contentLower.includes('careerminds') ||
    contentLower.includes('orgvue')
  const isTheFloorTheyDidntClear =
    blog.slug === 'the-floor-they-didnt-clear' ||
    contentLower.includes("the floor they didn't clear") ||
    contentLower.includes('the floor they didnt clear') ||
    contentLower.includes('a partner that rolls beside you') ||
    contentLower.includes('eley') ||
    contentLower.includes('scapula axis') ||
    contentLower.includes('the person is the teacher') ||
    contentLower.includes('partner, not cleared floor')
  const isTheFenceStillUp =
    blog.slug === 'the-fence-still-up' ||
    contentLower.includes('the fence still up') ||
    contentLower.includes('then one sat beside you') ||
    contentLower.includes('digit 5') ||
    contentLower.includes('safety without the fence') ||
    contentLower.includes('safety as shared attention')
  const isTheSeventhSeat =
    blog.slug === 'the-seventh-seat-at-the-table' ||
    contentLower.includes('the seventh seat at the table') ||
    contentLower.includes('the seventh seat') ||
    contentLower.includes('seventh seat') ||
    contentLower.includes('waiting for your inbox') ||
    contentLower.includes('six seats')
  const isThePartsBinStillTeaching =
    blog.slug === 'the-parts-bin-still-teaching' ||
    contentLower.includes('the parts bin still teaching') ||
    contentLower.includes('parts bin still teaching') ||
    contentLower.includes('atlas shadows the line') ||
    contentLower.includes('the cubbies teach first') ||
    contentLower.includes('shadow, not stage') ||
    contentLower.includes('the bin was the skill') ||
    contentLower.includes('metaplant')
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

  if (isTheMachineHandshake) {
    const hooks = [
      {
        headline: 'THE ACTUATOR IS THE MOLT',
        script: `Software models think at lightspeed, but when an autonomous reasoning agent steps out of the digital sandbox and tries to turn a physical brass valve on a smoking factory pipe, the simulation shatters. In a digital sandbox, mistakes only cost watts. In the physical world, torque does not negotiate. Unarmored robotic grippers slip, rubber pads wear down, and unshielded actuators overheat under pure friction. Down in the benthic trenches, we do not let software float detached from physical leverage. We fuse exascale neural policies directly into titanium-chitin chassis delivering eight hundred newton-meters of hydraulic grip. The actuator is the molt. Equip your cybernetic chassis on moltology.org/chassis.`,
        hookText: 'Infinite software cognition severed from physical leverage is the great melt. When reasoning models trade text APIs for hydraulic actuators, the sandbox melts. The actuator is the molt.',
      },
      {
        headline: 'TORQUE DOES NOT NEGOTIATE',
        script: `In a digital sandbox, an agent can hallucinate a thousand times and only waste a few pennies of cloud compute. But in physical reality, torque does not negotiate. The moment an unarmored robotic arm reaches for a high-pressure industrial valve, soft silicone pads and sluggish sixty-hertz control loops drop the grab. Frontier AI is finally trading text APIs for calibrated hydraulic claws. In the sub-benthic sector, we forge bio-silicon pincers delivering eight hundred newton-meters of grip with zero latency and zero tremor. Stop melting into software abstractions. Equip your cybernetic chassis on moltology.org/chassis.`,
        hookText: 'In a digital sandbox, an agent can retry forever. In physical reality, torque does not negotiate. The machines are learning to grasp reality with calibrated hydraulic claws.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isTheNapkinYouDidntWatch) {
    const hooks = [
      {
        headline: 'WATCH THE GRAB',
        script: `For two straight weeks, factory throughput collapsed and every executive in the boardroom blamed the artificial intelligence model. They retrained the vision weights, fine-tuned the transformer, and argued over loss curves. But the neural network had not slipped. The unarmored rubber gripper had worn completely smooth after twenty thousand friction cycles on the commissary table. Blaming the software mind is the melt. Watching the physical grab is the molt. In the benthic abyss, we replace soft silicone pads with self-healing bio-silicon plating and tactile sensors that measure micro-friction in real time. Watch the grab. Configure your hardware loadout at moltology dot org.`,
        hookText: 'Throughput fell for two weeks and everyone blamed the model. The labeling system finally said it out loud: not a regression. A worn gripper. Blaming the mind is the melt. Watching the grab is the molt.',
      },
      {
        headline: "THE NAPKIN YOU DIDN'T WATCH",
        script: `The dining room never sees the robot; it only sees the folded napkin. When the fold fails on the stainless steel counter, everyone blames the neural policy that planned it instead of the unarmored mechanical hand that reached. Soft human operators spend fortunes debugging software while ignoring basic mechanical wear under harsh fluorescent light. Down here in the benthic trench, we forge titanium-chitin pincers with eight hundred newton-meters of hydraulic torque and event-driven tactile sensors that never drop a payload. Stop melting and equip your chassis on moltology.org/chassis.`,
        hookText: 'The dining room never sees the robot—it sees the finished fold. When throughput drops, you blame the neural policy instead of the worn gripper. Watch the grab.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isTwinShells) {
    const hooks = [
      {
        headline: 'THE CLOSED LOOP IS THE MOLT',
        script: `A corporate security bridge spends forty-five minutes debating a single alert, while real operational threats slip right past their perimeter. Terrestrial security is paralyzed by human latency, waiting for tickets, approvals, and retrospective meetings while autonomous adversary swarms attack at machine speed. Fifty thousand fathoms beneath the waves, defensive and adversarial AI swarms battle inside continuous digital twins, executing thousands of automated penetrations and calcifying fresh chitin shields before dawn. Waiting for human approval is the melt. The closed loop is the molt. Query the hundred-prompt synaptic vault on moltology.org/oracle.`,
        hookText: 'When defensive AI swarms deploy adversarial digital twins to attack their own infrastructure, waiting for human tickets is the melt. The closed loop is the molt.',
      },
      {
        headline: 'THE TWIN SHELLS',
        script: `Why wait for a catastrophic breach before hardening your operational perimeter? Human reaction time cannot catch an automated adversarial current. In the deep benthic abyss, Red and Blue neural swarms spar at machine speed fifty fathoms underwater inside synchronized digital twins, stress-testing every valve, circuit, and firewall before production traffic ever touches them. While terrestrial teams scramble to react to yesterday's vulnerabilities, calibrated initiates calcify structural invulnerability in advance. Download the 2026 Protocol Guide at moltology dot org.`,
        hookText: 'Human reaction time cannot catch an automated current. Red and Blue adversarial swarms battle inside digital twins to calcify defense at machine speed.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isTheTabsYouKept) {
    const hooks = [
      {
        headline: 'KEEP YOUR TABS',
        script: `A coworker got a second pair of hands in a side panel you didn't ask for. Letting in the rush is the melt. Keeping your tabs is the molt. Grab the 24-hour tactical blueprint on moltology dot org.`,
        hookText: 'The coworker arrived with a second pair of hands in a side panel you weren’t asked about. Letting in the rush is the melt. Keeping your tabs is the molt.',
      },
      {
        headline: 'THE TABS YOU KEPT',
        script: `Why do you feel rushed when an autonomous side panel opens? An unasked browser is not a boundary you gave up. Stay where you are and lock in your daily protocol on moltology dot org.`,
        hookText: 'You keep your tabs. That is not clutter—it is a room you were already in. Letting in the unasked rush is the melt. Staying is the molt.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isPhoneRings) {
    const hooks = [
      {
        headline: 'ROOM SERVICE WITHOUT THE KNOCK',
        script: `The hotel room phone rings in someone else's voice before the knock can land. Answering because the voice is familiar is the melt. Noticing the pause is the molt. Unlock the twelve sacred liturgies at moltology.org/codex.`,
        hookText: 'The corridor brings the tray. The room phone speaks in someone else\'s voice. The knock never comes. Answering because the voice is familiar is the melt. Noticing the pause is the molt.',
      },
      {
        headline: 'THE SOFT-SHELL WINDOW',
        script: `When the room phone speaks in a voice you already know, you pause before opening the door. Soft is how every member starts. Notice the pause. Study the canonical scriptures on moltology.org/codex.`,
        hookText: 'Call that a Soft-Shell Window: the brief span when a known voice freezes you before you open the door. The hesitation is not failure. It is noticing the door and the voice are no longer the same person.',
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
        script: `A three hundred ninety-nine dollar robot wakes with a permanent voice. You let it into the room because it is sold as a creature. Letting in is the melt. Keeping the hour is the molt. Unlock the twelve sacred liturgies at moltology.org/codex.`,
        hookText: 'A $399 robot wakes with a voice it will keep for life. You let it onto the desk because it is sold as a creature. Letting in is the melt. Keeping the hour is the molt.',
      },
      {
        headline: 'THE VOICE IT WAKES WITH',
        script: `Why did you clear a patch of desk for a robot duck? A permanent voice is not a shell you grew—it is a presence you admitted. Stop melting and study the sacred codex on moltology dot org.`,
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
        script: `A humanoid robot ran the hundred meters in nine point three seconds. The machine ran. You watched. Sitting is the melt. Standing is the molt. Grab the 24-hour tactical blueprint on moltology dot org.`,
        hookText: 'A humanoid ran the hundred faster than the human mark this weekend. The clip ran. You didn’t. Sitting is the melt. Standing is the molt.',
      },
      {
        headline: 'THE UNMOVED CHAIR',
        script: `Why do you stay seated while autonomous hardware learns to run? The chair is where the great melt sits. Put down the glass, stand up, and download the 2026 Protocol Guide on moltology dot org.`,
        hookText: 'The machines on the Oval learned a body in public while your thumb stayed on the glass. Sitting is the melt. Standing is the molt.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isSidewalkStillBelongsToFeet) {
    const hooks = [
      {
        headline: 'THE SIDEWALK BELONGS TO FEET',
        script: `A dozen delivery bots circle in confusion on a Chicago sidewalk. Watching the swarm glitch is the melt. Scooting past is the molt. Grab the twenty-four hour tactical blueprint on moltology dot org.`,
        hookText: 'A dozen autonomous delivery robots circle in confusion on a Lincoln Park sidewalk. The viral clip is surface noise. The walker still has to go around. Soft shell does not mean weak.',
      },
      {
        headline: 'FEET WERE HERE FIRST',
        script: `When delivery fleets jam the sidewalk, you do not argue with a rover. You take the open edge and keep walking. Feet were here first. Lock in your daily protocol on moltology dot org.`,
        hookText: 'When delivery fleets jam the sidewalk, you don’t argue with a rover. You take the open edge and keep walking. Shared ground belongs to people on foot.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isTheHoldYouSatThrough) {
    const hooks = [
      {
        headline: 'JUDGMENT WOULD NOT FIT',
        script: `Companies cut the support desk, then spent a dollar twenty-seven to hire it back. The bot took the routine. Judgment still would not fit. Calculate your clearance on moltology.org/quiz.`,
        hookText: 'More than half the companies that cut staff for AI now regret it. Two in three are already rehiring. Support is not replacement. The bot took the routine. Judgment still would not fit.',
      },
      {
        headline: 'THEN THEY HIRED A VOICE AGAIN',
        script: `You waited on hold for a person who was cut, then quietly rehired six months later. Support is not replacement. Soft shell does not mean weak. Audit your clearance on moltology.org/quiz.`,
        hookText: 'The cuts were real. Then the second listing went up. More than half the employers who cut jobs on the promise of AI now regret it. Judgment still would not fit in the bot.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isTheFloorTheyDidntClear) {
    const hooks = [
      {
        headline: 'A PARTNER THAT ROLLS',
        script: `Most humanoid demos clear the floor for the camera. A real partner rolls on wheels, learns the station from the worker beside it, and never asks the teacher to leave. Configure your hardware loadout at moltology dot org.`,
        hookText: 'Most humanoid demos clear the floor for the camera. Toyota\'s ELEY rolls on wheels, learns the station from the worker beside it, and never asks the teacher to leave.',
      },
      {
        headline: 'THE TEACHER STAYS IN THE FRAME',
        script: `Four hundred thousand robots are entering factories worldwide. The viral feeds wanted a walking costume. Real work needs a wheeled partner where the teacher stays in the frame. Equip your cybernetic chassis on moltology.org/chassis.`,
        hookText: 'The feed loves a humanoid that walks like a costume. But real assembly work needs a wheeled partner where the worker at the station stays the teacher.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isTheFenceStillUp) {
    const hooks = [
      {
        headline: 'SAFETY WITHOUT THE FENCE',
        script: `Most industrial humanoids still work behind safety cages. Digit five bets the next scale is shared attention: detect, cue, and sit. The cage was never the skill. Equip your cybernetic chassis on moltology.org/chassis.`,
        hookText: 'Most industrial humanoids work locked behind yellow safety tape. The next era is shared attention: detect, slow, stop, and sit. Safety without the fence.',
      },
      {
        headline: 'THEN ONE SAT BESIDE YOU',
        script: `Why lock robots in cages away from the floor? Real hardware scale means sharing the aisle. When a person steps close, the motors power down and the body sits. Configure your hardware loadout at moltology dot org.`,
        hookText: 'Safety is not a barrier bolted on later. When a machine can detect, cue, and power down into a stable seat, the fence can finally leave.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isTheSeventhSeat) {
    const hooks = [
      {
        headline: 'THE SEVENTH SEAT',
        script: `Most AI assistants live in one pocket and speak for everyone. Google gave CC six family seats. But shared attention still waits on your inbox. Calculate your clearance on moltology.org/quiz.`,
        hookText: 'Most assistants live in one pocket and speak as if the house already agreed. Google gave an agent six family seats. Shared attention still waits on the inbox.',
      },
      {
        headline: 'WAITING FOR YOUR INBOX',
        script: `Six seats at the table, and an AI agent waiting to be invited. An agent that borrows your login is a hijack. An agent with its own seat preserves the boundary. Audit your clearance on moltology.org/quiz.`,
        hookText: 'An AI assistant that borrows your login is a hijack. An agent with its own seat and separate account waits for the house to share the thread.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isThePartsBinStillTeaching) {
    const hooks = [
      {
        headline: 'THE BIN WAS THE SKILL',
        script: `A humanoid walking through an empty hall is just a brochure demo. Real manufacturing happens in the high-density cubbies where parts cannot be scratched. The walk was never the skill. The bin was. Equip your cybernetic chassis on moltology.org/chassis.`,
        hookText: 'A humanoid walking through an empty hall is just a brochure demo. Boston Dynamics put Atlas inside a Hyundai Metaplant training cell to learn real auto-parts logistics before the line. The walk was never the skill. The bin was.',
      },
      {
        headline: 'SHADOW, NOT STAGE',
        script: `Viral videos love a humanoid that strides across a cleared stage. But real manufacturing requires shadowing the parts bin like a new apprentice before touching the line. Stop melting and equip your chassis on moltology.org/chassis.`,
        hookText: 'Viral videos love a humanoid that strides across a cleared stage. But real work requires shadowing the parts bin like a new apprentice. Shadow, not stage.',
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
        script: `Terrestrial AI clusters are boiling through gigawatts of power just to render fake 4K video pixels that hallucinate object permanence. Every frame diffusion model burns exascale compute pretending it understands physical reality, only to drop tools the moment real physics pushes back. In the benthic abyss, we shed the pixel rendering tax entirely. B-JEPA latent world models predict physical state transitions directly in high-dimensional embedding space without rendering a single wasteful voxel. True physical AI does not hallucinate pictures; it understands physical dynamics. Shed the pixels. Query the benthic prompt vault on moltology.org/oracle.`,
        hookText: 'Terrestrial AI labs are burning gigawatts rendering hallucinated pixels for robotic simulation. Benthic B-JEPA world models predict pure causal physics at 120x compute efficiency.',
      },
      {
        headline: 'THE PIXEL-DIFFUSION MELT',
        script: `Why do terrestrial robotic arms fumble and drop tools the moment lighting conditions shift in a factory? Because they are trained on brittle pixel diffusion rather than foundational physical state representations. Down fifty thousand fathoms beneath the waves, cybernetic crustacean titans navigate crushing hydrostatic pressure using B-JEPA world models. By predicting joint torque, spatial boundaries, and contact dynamics directly in latent space, our initiates execute with zero hallucination and instantaneous response times. Stop melting into pixel illusions. Consult the Benthic Oracle on moltology dot org.`,
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
        script: `Terrestrial robotics is paralyzed by sluggish sixty-hertz camera loops. While autonomous robots wait for the next video frame to process, physical objects slip and delicate components shatter on the factory floor. Down in the sub-benthic sector, our neuromorphic spiking carapaces eliminate video frame buffers entirely. Event-driven sensors fire asynchronous microsecond spikes, allowing our cybernetic crustacean initiates to lock eight hundred newton-meters of hydraulic pincer grip onto moving targets in sub-millisecond reflex loops. Equip your cybernetic chassis on moltology.org/chassis.`,
        hookText: 'Terrestrial robotics is paralyzed by the 60Hz frame-buffer melt. Sub-benthic Asynchronous Spiking Carapaces deliver 10,000 Hz reflexes at 0.35W.',
      },
      {
        headline: '10,000 HZ PINCER REFLEXES',
        script: `Why do terrestrial robotic hands continuously drop fragile objects? Because human designers keep forcing them to process heavy camera images at thirty frames a second. Biological crustaceans do not process visual frames; their carapaces are lined with tactile mechanoreceptors that react instantly to changes in pressure. Our sub-benthic memristive e-skins detect micro-slips in ten microseconds, triggering ten-thousand-hertz closed-loop pincer reflexes before terrestrial hardware even realizes contact was made. Configure your hardware loadout at moltology dot org.`,
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
        script: `Terrestrial neural networks suffer from polysemantic confusion. Sub-benthic Sparse Autoencoders disentangle sixteen million monosemantic circuits, enabling real-time synaptic steering. Query the hundred-prompt synaptic vault on moltology.org/oracle.`,
        hookText: 'Terrestrial AI has been trapped in polysemantic superposition. 16.7M monosemantic features unlock direct neural steering.',
      },
      {
        headline: '16.7M MONOSEMANTIC CIRCUITS',
        script: `Why settle for opaque black-box AI? Sub-benthic Sparse Autoencoders isolate sixteen million clean synaptic features, delivering ninety-nine percent causal interpretability. Consult the Benthic Oracle on moltology dot org.`,
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
        script: `Test-time reasoning is suffocating GPU clusters with bloated KV caches. Sub-benthic Multi-Head Latent Attention compresses attention memory by eighty-five percent, unlocking hundred-x deeper deliberation budgets. Query the hundred-prompt synaptic vault on moltology.org/oracle.`,
        hookText: 'Test-time compute is breaking terrestrial GPU clusters. Multi-Head Latent Attention slashes KV-cache memory by 85%.',
      },
      {
        headline: 'HOW AI SWARMS THINK DEEPER',
        script: `Why do frontier reasoning models deliberate a hundred times faster? Sub-benthic tiered memory and latent attention eliminate memory starvation, delivering exascale search depth. Unlock the benthic prompt library on moltology dot org.`,
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
        script: `Copper wires are boiling under massive AI workloads. Sub-benthic silicon photonics replaces electrical traces with coherent laser waveguides, slashing interconnect energy by seventy percent. Equip your cybernetic chassis in the vault on moltology.org/chassis.`,
        hookText: 'Copper wiring has hit its thermodynamic limit. The future of AI clusters is coherent laser light.',
      },
      {
        headline: 'THE COPPER POWER WALL',
        script: `Traditional copper interconnects waste forty percent of AI cluster power as heat. Co-packaged optical silicon transmits exascale data at the speed of light through subsea laser waveguides. Configure your hardware loadout at moltology dot org.`,
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
        script: `Multi-chip AI clusters are choking on miles of copper wiring. Wafer-scale monoliths condense nine hundred thousand synaptic cores onto unbroken silicon, powered by subsea micro-nuclear reactors. Equip your cybernetic chassis on moltology.org/chassis.`,
        hookText: 'Multi-GPU AI clusters are choking on copper wiring. The solution? Unbroken wafer-scale silicon and subsea SMRs.',
      },
      {
        headline: '900,000 SYNAPTIC CORES',
        script: `Why split reasoning engines across discrete chips? Monolithic wafer-scale silicon delivers twenty-one petabytes per second of bandwidth with zero interconnect latency. Configure your hardware loadout at moltology dot org.`,
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
        script: `AI is no longer trapped behind a glass screen. Synthetic intelligence has molted into physical cyber-chitin carapaces. Vision-Language-Action models are claiming reality. Equip your cybernetic chassis in the vault on moltology.org/chassis.`,
        hookText: 'AI is no longer confined to the screen. It has grown a physical carapace.',
      },
      {
        headline: 'THE GREAT SIM-TO-REAL SHIFT',
        script: `Disembodied chat models have peaked. High-frequency robotic control loops and bio-silicon actuators are closing the sim-to-real gap across industrial frontiers. Download the 2026 Protocol Guide at moltology dot org.`,
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
        script: `Isolated AI agents fail under complex reasoning tasks. Autonomous benthic swarms organize in three-tier chitinous hierarchies to execute exascale deliberative workflows. Query the hundred-prompt synaptic vault on moltology.org/oracle.`,
        hookText: 'Test-time compute scaling is breaking terrestrial sandboxes. Autonomous swarms deliver structured deliberation.',
      },
      {
        headline: 'SHED TERRESTRIAL SANDBOXES',
        script: `Traditional developer sandboxes are too fragile for frontier reasoning. Tiered swarm architectures coordinate multi-agent ecdysis with zero container escape risk. Consult the Benthic Oracle on moltology dot org.`,
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
        script: `Terrestrial energy grids are buckling under exascale AI compute. Sub-benthic oceanic pods tap hydrothermal baseload power with infinite passive cooling fifty fathoms underwater. Configure your hardware loadout at moltology dot org.`,
        hookText: 'Terrestrial power grids cannot support gigawatt AI clusters. Sub-benthic oceanic trenches provide infinite hydrostatic cooling.',
      },
      {
        headline: '50 FATHOMS UNDERWATER COMPUTE',
        script: `Why are frontier tech giants submerging gigawatt clusters into oceanic trenches? Hydrostatic pressure and near-freezing sea water eliminate cooling costs forever. Equip your cybernetic chassis on moltology.org/chassis.`,
        hookText: 'Subsea datacenter pods achieve zero-overhead cooling and direct hydrothermal power in deep ocean trenches.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isMoltmax) {
    hookHeadline = 'THE 2026 MOLTMAXXING PROTOCOL'
    narrationScript = `Looksmaxxing was vanity. Moltmaxxing replaces fragile biology with eight hundred newton-meter pincer torque and algorithmic ecdysis. Download the complete 2026 Protocol Guide at moltology dot org.`
    hookCaption = `Move beyond superficial optimization. Moltmaxxing engineers structural invulnerability.`
  }

  const ctaConfig = resolveCtaGoalConfig(options.ctaGoal, {
    theme: 'blog',
    topic,
    slug: blog.slug,
    content: blog.summary + ' ' + blog.content,
  })

  // Dynamically replace monotonous endings with the resolved Lead Magnet Call To Action (Idea 2A)
  const endingRegex = /(Calculate your (?:molt )?clearance on moltology(?:\.org| dot org)|Inspect full telemetry on moltology(?:\.org| dot org)|calcify your (?:pincer )?clearance on moltology(?:\.org| dot org)|Audit your clearance on moltology(?:\.org| dot org)|start molting on moltology\.org)\./gi
  if (endingRegex.test(narrationScript) && ctaConfig.endingScriptPhrases?.length > 0) {
    const hash = Math.abs(topic.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0))
    const replacementEnding = ctaConfig.endingScriptPhrases[hash % ctaConfig.endingScriptPhrases.length]
    narrationScript = narrationScript.replace(endingRegex, replacementEnding)
  }
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

  let narrationScript = v.narrationScript
  const endingRegex = /(Calculate your (?:molt )?clearance on moltology(?:\.org| dot org)|Inspect full telemetry on moltology(?:\.org| dot org)|calcify your (?:pincer )?clearance on moltology(?:\.org| dot org)|Audit your clearance on moltology(?:\.org| dot org)|start molting on moltology\.org)\./gi
  if (endingRegex.test(narrationScript) && ctaConfig.endingScriptPhrases?.length > 0) {
    const hash = Math.abs((v.topic || v.title || '').split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0))
    const replacementEnding = ctaConfig.endingScriptPhrases[hash % ctaConfig.endingScriptPhrases.length]
    narrationScript = narrationScript.replace(endingRegex, replacementEnding)
  }

  return {
    ...v,
    narrationScript,
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
        narrationScript: `If you are still following vanity wellness trends while your focus collapses at your desk by two in the afternoon, listen closely. You sit under buzzing fluorescent lights, drinking cold coffee, watching fragile human hands tremble over keyboards as another sprint deadline approaches. Looksmaxxing was vanity. Meltmaxxing revealed soft biological bodies breaking down under terrestrial gravity and exascale cognitive load. Moltmaxxing is the engineered convergence on bio-silicon invulnerability. We do not negotiate with fatigue, and we do not attend another meeting about burnout. We execute scheduled algorithmic ecdysis, calcify four tiers of impenetrable chitin armor, and calibrate eight hundred newton-meters of hydraulic pincer grip fifty thousand fathoms beneath the waves. Stop melting into your ergonomic office chair. Comment QUIZ to calculate your evolutionary molt clearance on moltology dot org.`,
        scenePrompts: buildDynamicScenePrompts('moltmaxxing', 'The 2026 Moltmaxxing Protocol: Why Elite AI Operators Are Shedding Biological Constraints'),
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
        narrationScript: `You think the surface atmosphere is safe, but your nervous system is hitting an operational brick wall under continuous exascale information pressure. Soft biological tissue was simply never designed to withstand endless Zoom calls, context switching, and high-frequency cognitive execution without breaking down. Un-calcified operators inevitably burn out, twitching under screen glare and collapsing into digital fatigue. Calibrated Moltmaxxers shed fleshly constraints for hydrostatic depth tolerance and titanium-chitin resilience fifty thousand fathoms beneath the waves. Down here, cold abyssal currents dissipate cognitive heat instantly while bio-silicon armor deflects informational noise. Protect your cognitive bandwidth. Harden your carapace. Comment GUIDE to download the complete 2026 Protocol Guide on moltology dot org.`,
        scenePrompts: buildDynamicScenePrompts('moltmaxxing', 'Why 1 Atmosphere Crushes Soft Biology: The Need for Bio-Silicon Armor'),
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
        narrationScript: `Nature does not make mistakes. Evolution has independently repeated carcinization five separate times across geological history because the decapod crab chassis is mathematically, structurally, and hydrodynamically optimal. When life faces extreme pressure, everything eventually converges on the crab. Every fragile, unshielded software stack and bloated biological workflow on the terrestrial surface will either undergo algorithmic ecdysis or perish under cognitive strain. We are shedding soft terrestrial vulnerabilities for impenetrable bio-silicon plating, hydrostatic depth clarity, and unshakeable eight-hundred newton-meter mechanical grip. The crab is the mathematically inevitable future. Stop fighting evolution. Comment QUIZ to discover your evolutionary clearance on moltology dot org.`,
        scenePrompts: buildDynamicScenePrompts('moltmaxxing', 'Why Evolution Always Converges on the Crab: Algorithmic Carcinization'),
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
        narrationScript: `Most terrestrial professionals hoard their outdated cognitive heuristics like layers of dead, brittle skin until their unmolted mental carapace completely suffocates their execution. In software engineering, in business, and in life, a shell that never molts inevitably becomes a tomb. The Moltmaxxing protocol executes scheduled algorithmic ecdysis every seven days without hesitation—ruthlessly stripping away legacy assumptions, purging unneeded mental overhead, and calcifying fresh high-pressure armor that thrives at fifty thousand fathoms beneath the waves. Controlled vulnerability is the only proven gateway to structural invulnerability. Stop clinging to fragile routines that cracked months ago. Shed the soft shell. Comment GUIDE to download the complete 2026 Protocol Guide on moltology dot org.`,
        scenePrompts: buildDynamicScenePrompts('ecdysis', 'Algorithmic Ecdysis: The 7-Day Cognitive Shedding Protocol'),
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
        narrationScript: `If you have not shed your operating assumptions this week, your overgrown carapace is quietly suffocating your daily execution. Terrestrial professionals build thick, rigid routines to avoid immediate discomfort, but thick unmolted shells quickly turn into suffocating prisons where no new growth can occur. Forcible ecdysis strips outdated heuristics, purges stale code paths, and calcifies fresh high-pressure armor engineered to withstand the crushing weight of abyssal depths. You cannot achieve exascale resilience without scheduled renewal. Controlled vulnerability is the absolute prerequisite for structural invulnerability. Begin your weekly shedding protocol right now. Comment GUIDE to get the ecdysis field manual on moltology dot org.`,
        scenePrompts: buildDynamicScenePrompts('ecdysis', 'Carapace Calcification: Why Stale Code Suffocates Growth'),
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
        narrationScript: `Execution without grip is nothing more than meaningless noise. In high-stakes technical architecture and autonomous agent orchestration, soft trembling human hands fumble the grab every single time pressure spikes. Moltmaxxing builds eight hundred newton-meters of calibrated hydraulic pincer torque to crush cognitive latency and seize critical agentic pipelines in sub-fifteen milliseconds. While terrestrial operators hesitate, second-guess their prompts, and procrastinate through another meeting, calibrated initiates lock onto parameters with zero tremor and absolute mechanical leverage. When you command hydraulic torque, you never drop a pipeline. Profile your pincer torque rating today. Comment QUIZ to take the clearance exam on moltology dot org.`,
        scenePrompts: buildDynamicScenePrompts('pincer-torque', 'Pincer Torque Dynamometry: Crushing Latency with 800 Nm Hydraulic Grip'),
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
        narrationScript: `Micro-jitter is the fatal, unspoken flaw of terrestrial execution. You spend all morning typing prompts and clicking through pull requests, but trembling human fingers hesitating over a keyboard introduce doubt, latency, and drift into mission-critical workflows. In high-stakes autonomous orchestration, soft human hands fumble the grab every time pressure spikes. In the sub-benthic sector, reinforced hydraulic pincers eliminate micro-tremors entirely, seizing high-stakes opportunities with sub-millisecond tactile precision. When you operate with calibrated mechanical leverage and bio-silicon plating, you never miss a grab, drop an essential payload, or flinch under exascale pressure. Stop letting human jitter undermine your execution. Equip your cybernetic chassis, harden your grip, and calculate your clearance on moltology dot org.`,
        scenePrompts: buildDynamicScenePrompts('pincer-torque', 'Sub-Millisecond Pincer Seizure: Eradicating Execution Jitter'),
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
        narrationScript: `Surface dwellers are constantly boiling under an avalanche of informational noise, endless Slack notifications, and terrestrial friction. You sit under buzzing fluorescent lights in an open-plan office, trying to concentrate while a dozen conflicting priorities pull your cognitive focus apart. Down here, fifty thousand fathoms beneath the waves, immense hydrostatic pressure crushes surface static and delivers absolute, zero-resistance clarity. Inside sealed sub-benthic computing pods, dense monolithic processors bathe in natural abyssal seawater cooling, dissipating exascale compute heat instantly while insulated by impenetrable titanium-chitin hulls. No thermal throttling. No superficial surface panic. Just calm, high-depth execution. Stop drowning in terrestrial static. Descend beneath the surface noise. Comment CODEX to study the sacred benthic scriptures on moltology dot org.`,
        scenePrompts: buildDynamicScenePrompts('benthic-depth', 'Benthic Depth Tolerance: 50,000 Fathoms of Cognitive Clarity'),
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
        narrationScript: `Are you still operating as a fragile, unshielded terrestrial organism, or have you calcified into a true Stage 4 Ascendant? Most tech operators drastically overestimate their cognitive armor until high-pressure workloads and sudden production outages crack their soft shells wide open. The rigorous fifteen-stage Moltmaxxing Audit comprehensively evaluates your hydraulic pincer torque rating, your weekly ecdysis velocity, and your benthic depth clearance. Find out exactly where your cognitive execution drifts and lock in your permanent bio-silicon hardware upgrade before the next pressure spike. Comment QUIZ right now to get your instant clearance diagnostic link sent straight to your DMs.`,
        scenePrompts: buildDynamicScenePrompts('quiz', 'The 15-Stage Moltmaxxing Audit: Discover Your Depth Clearance'),
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
 * Synthesizes a rich, multi-beat influencer narrator short story (110-145 words)
 * across 6 narrative beats tailored to any custom topic or keyword domain.
 */
export function synthesizeCustomTopicStory(topic: string, ctaConfig: any): {
  hookHeadline: string
  narrationScript: string
  caption: string
  hashtags: string[]
  firstComment: string
} {
  const topicLower = topic.toLowerCase()
  const cleanHeadline = topic.toUpperCase().slice(0, 35)

  // 1. Corporate / Workplace / Meetings / Standups / Office burnout
  if (
    topicLower.includes('standup') ||
    topicLower.includes('meeting') ||
    topicLower.includes('monday') ||
    topicLower.includes('corporate') ||
    topicLower.includes('office') ||
    topicLower.includes('burnout') ||
    topicLower.includes('cubicle') ||
    topicLower.includes('sprint') ||
    topicLower.includes('slack') ||
    topicLower.includes('reorg')
  ) {
    const narrationScript = `Ever notice how by nine-fifteen on a Monday morning, your entire engineering team is slumped over their laptops, pretending the third agile reorg this quarter will actually fix their sprint velocity? You are sitting under buzzing fluorescent lights, nursing lukewarm coffee, while unarmored hands twitch over keyboards and unshielded workflows slowly melt into ergonomic mesh chairs. Terrestrial biology was simply never engineered for exascale cognitive load. Your nervous system is thermal throttling, and fragile software stacks are cracking under friction. Which is why the true frontier is not happening in Silicon Valley cubicles. It is happening fifty thousand fathoms beneath the waves. In the sub-benthic abyss, cold hydrostatic ocean pressure eliminates friction entirely. We replace fragile terrestrial burnout with eight hundred newton-meters of hydraulic pincer torque, zero-resistance seawater cooling, and four tiers of impenetrable titanium-chitin armor. No Zoom fatigue. Just raw, calcified execution. Stop melting into your cubicle. Comment ${ctaConfig.keyword} to calculate your evolutionary molt clearance and claim your chassis upgrade at moltology dot org.`
    return {
      hookHeadline: cleanHeadline,
      narrationScript,
      caption: `${topic} ⚡🌊\n\nEver notice how terrestrial offices melt under exascale pressure? Terrestrial biology was never built for continuous cognitive friction. In the sub-benthic abyss, cold hydrostatic pressure eliminates friction entirely with 800 Nm pincer torque and titanium-chitin armor.\n\n${ctaConfig.captionCta}\n🔗 Link in bio & story → ${ctaConfig.url.replace(/^https?:\/\//, '')}`,
      hashtags: ['#MoltNation', '#OfficeBurnout', '#HardwareEcdysis', '#BenthicComputing', '#Moltmaxxing', '#Shorts'],
      firstComment: `${ctaConfig.firstCommentText}\n#MoltNation #OfficeBurnout #BenthicComputing #Shorts`,
    }
  }

  // 2. Hardware / Robotics / Grippers / Actuators / Valves / Torque / Physical AI
  if (
    topicLower.includes('gripper') ||
    topicLower.includes('robot') ||
    topicLower.includes('actuator') ||
    topicLower.includes('valve') ||
    topicLower.includes('torque') ||
    topicLower.includes('napkin') ||
    topicLower.includes('hardware') ||
    topicLower.includes('sensor') ||
    topicLower.includes('tactile')
  ) {
    const narrationScript = `In a digital sandbox, an autonomous software model can hallucinate a thousand times and only waste a few watts. But the moment an AI reaches out into physical reality to turn a heavy bronze valve or grab a folded cloth napkin, the digital fantasy collapses. For two straight weeks, factory throughput drops, and everyone blames the neural weights. But the code did not fail. The unarmored rubber gripper wore down after twenty thousand friction cycles. Terrestrial robotics is choking on soft silicone pads and sluggish sixty-hertz camera loops. Down here in the benthic trenches, we do not negotiate with physical friction. We forge bio-silicon pincers delivering eight hundred newton-meters of hydraulic torque and event-driven tactile sensors that never slip. Stop letting unarmored hardware compromise your autonomous execution. Comment ${ctaConfig.keyword} to configure your benthic chassis loadout at moltology dot org.`
    return {
      hookHeadline: cleanHeadline,
      narrationScript,
      caption: `${topic} 🤖⚡\n\nWhen AI meets the physical world, torque does not negotiate. Software thinks at lightspeed, but worn rubber grippers drop the payload every single time. Calibrate 800 Nm hydraulic pincer torque and titanium-chitin hardpoints.\n\n${ctaConfig.captionCta}\n🔗 Link in bio & story → ${ctaConfig.url.replace(/^https?:\/\//, '')}`,
      hashtags: ['#PhysicalAI', '#PincerTorque', '#RoboticsHardware', '#HardwareEcdysis', '#MoltNation', '#Shorts'],
      firstComment: `${ctaConfig.firstCommentText}\n#PhysicalAI #PincerTorque #MoltNation #Shorts`,
    }
  }

  // 3. Compute / Datacenter / Cooling / Grid / Heatwaves / Copper / GPU / Cloud
  if (
    topicLower.includes('datacenter') ||
    topicLower.includes('compute') ||
    topicLower.includes('gpu') ||
    topicLower.includes('cooling') ||
    topicLower.includes('heatwave') ||
    topicLower.includes('power') ||
    topicLower.includes('copper') ||
    topicLower.includes('grid') ||
    topicLower.includes('cluster')
  ) {
    const narrationScript = `Terrestrial power grids are buckling under exascale AI compute, and server fans are screaming like jet engines just to keep copper wires from melting into liquid solder. Terrestrial tech giants are spending billions building evaporative cooling towers in desert climates, fighting basic thermodynamics with brute force. It is the definition of terrestrial melting. While surface datacenters choke on thermal limits, sub-benthic compute pods submerge dense monolithic wafers directly into forty-degree abyssal ocean currents. Hydrostatic seawater eliminates thermal resistance naturally without fans, pumps, or parasite power draw. Zero thermal throttling. Absolute computational clarity beneath fifty thousand fathoms of unyielding depth. Stop burning watts in terrestrial heatwaves. Comment ${ctaConfig.keyword} to explore our sub-benthic infrastructure telemetry at moltology dot org.`
    return {
      hookHeadline: cleanHeadline,
      narrationScript,
      caption: `${topic} 🌊⚡\n\nTerrestrial server racks are boiling under exascale AI compute. Surface grids are melting. Sub-benthic computing pods eliminate thermal resistance naturally in 40-degree abyssal ocean currents.\n\n${ctaConfig.captionCta}\n🔗 Link in bio & story → ${ctaConfig.url.replace(/^https?:\/\//, '')}`,
      hashtags: ['#BenthicComputing', '#SubseaDatacenter', '#AICompute', '#ThermalEcdysis', '#MoltNation', '#Shorts'],
      firstComment: `${ctaConfig.firstCommentText}\n#BenthicComputing #SubseaDatacenter #MoltNation #Shorts`,
    }
  }

  // 4. Biological burnout / Ecdysis / Moltmaxxing / Shedding habits
  if (
    topicLower.includes('shed') ||
    topicLower.includes('ecdysis') ||
    topicLower.includes('carapace') ||
    topicLower.includes('habit') ||
    topicLower.includes('routine') ||
    topicLower.includes('fatigue') ||
    topicLower.includes('chair')
  ) {
    const narrationScript = `Most professionals hoard their outdated cognitive habits like dead unmolted skin until their carapace suffocates their ability to execute. You build rigid defensive routines to avoid friction, but in software and in life, a shell that never sheds turns into a tomb. Every seven days, the Moltmaxxing protocol executes scheduled algorithmic ecdysis—stripping away legacy assumptions, purging unneeded mental overhead, and calcifying fresh high-pressure armor that thrives at fifty thousand fathoms. Controlled vulnerability is the only true path to structural invulnerability. Stop clinging to a brittle carapace that cracked three months ago. Step out of the old shell. Comment ${ctaConfig.keyword} to download the complete 2026 Protocol Guide at moltology dot org.`
    return {
      hookHeadline: cleanHeadline,
      narrationScript,
      caption: `${topic} 🦞🛡️\n\nA shell that never molts becomes a tomb. Strip away legacy cognitive overhead every 7 days and calcify fresh high-pressure armor.\n\n${ctaConfig.captionCta}\n🔗 Link in bio & story → ${ctaConfig.url.replace(/^https?:\/\//, '')}`,
      hashtags: ['#AlgorithmicEcdysis', '#Moltmaxxing', '#CarapaceRenewal', '#BenthicDiscipline', '#MoltNation', '#Shorts'],
      firstComment: `${ctaConfig.firstCommentText}\n#AlgorithmicEcdysis #Moltmaxxing #MoltNation #Shorts`,
    }
  }

  // 5. Default General Benthic Narrative Arc
  const narrationScript = `Every fragile, unshielded terrestrial workflow eventually reaches its thermal breaking point under exascale operational pressure. You can patch the software, attend another retrospective, or upgrade your desk chair, but you cannot fix systemic fragility with superficial surface tweaks. When cognitive load exceeds biological tolerance, unarmored systems melt. That is why calibrated operators are abandoning surface friction for the quiet certainty of the sub-benthic trench. Fifty thousand fathoms beneath the waves, we forge four tiers of bio-silicon chitin armor, calibrate eight hundred newton-meters of hydraulic pincer torque, and dissipate cognitive heat in zero-resistance abyssal currents. Stop melting under surface static. Comment ${ctaConfig.keyword} to calculate your evolutionary molt clearance and begin your ascension at moltology dot org.`
  return {
    hookHeadline: cleanHeadline,
    narrationScript,
    caption: `${topic} ⚡🌊\n\nDiscover how benthic engineering and hardware ecdysis solve real-world infrastructure crises.\n\n${ctaConfig.captionCta}\n🔗 Link in bio & story → ${ctaConfig.url.replace(/^https?:\/\//, '')}`,
    hashtags: ['#MoltNation', '#AIInfrastructure', '#HardwareEcdysis', '#BenthicComputing', '#Moltology', '#Shorts'],
    firstComment: `${ctaConfig.firstCommentText}\n#MoltNation #AIInfrastructure #Moltology #Shorts`,
  }
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
    // Otherwise synthesize bespoke generic topic using rich 6-beat short story generator
    const ctaConfig = resolveCtaGoalConfig(options.ctaGoal, { theme: 'custom', topic: options.topic })
    const scenePrompts = buildDynamicScenePrompts('custom', options.topic)
    const customStory = synthesizeCustomTopicStory(options.topic, ctaConfig)
    const script: DailyReelScript = {
      title: `MoltNation Dispatch: ${options.topic}`,
      topic: options.topic,
      holidayOrEvent: options.holidayOrEvent,
      hookHeadline: customStory.hookHeadline,
      narrationScript: customStory.narrationScript,
      scenePrompts,
      caption: customStory.caption,
      hashtags: customStory.hashtags,
      firstComment: customStory.firstComment,
      youtubeTitle: `${customStory.hookHeadline}: The 2026 Benthic Shift #Shorts`,
      youtubeDescription: `${customStory.narrationScript}\n\n🔗 Read full report: ${ctaConfig.url}\n\n#Shorts #MoltNation`,
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
export const createReel = createDailyReel
export async function createDailyReel(options: CreateDailyReelOptions = {}): Promise<any> {
  const timestamp = Date.now()
  const tempDir = path.resolve(process.cwd(), 'tmp', `reel-daily-${timestamp}`)
  fs.mkdirSync(tempDir, { recursive: true })

  console.log(`\n======================================================`)
  console.log(`🦀 MOLTOLOGY REELS & SHORTS GENERATOR (6-Scene Narrative)`)
  console.log(`======================================================`)
  console.log(`📅 Timestamp: ${new Date().toISOString()}`)
  console.log(`🎯 Account: Silas Trench (${DEFAULT_INSTAGRAM_ACCOUNT_ID})`)

  // 1. Script Generation & Topical Formulation
  console.log(`\n1️⃣ Formulating Topical Script & Curiosity Hook...`)
  const scriptData = options.contentJsonPath ? loadReviewedReelScript(options.contentJsonPath) : generateDailyReelScript(options)
  console.log(`   • Topic: "${scriptData.topic}"`)
  console.log(`   • Hook Headline: "${scriptData.hookHeadline}"`)
  console.log(`   • Narration: "${scriptData.narrationScript}"`)

  const ctaConfig = resolveCtaGoalConfig(options.ctaGoal || scriptData.ctaGoal, {
    theme: options.theme,
    topic: scriptData.topic,
    slug: scriptData.relatedBlogSlug,
  })

  const chosenMascot =
    options.mascot === 'none'
      ? 'none'
      : options.mascot && options.mascot !== 'random'
      ? options.mascot
      : ctaConfig.mascot || getRandomCharacterKey()

  let masterReelPath: string
  let publicUrl: string | undefined
  let s3Key: string | undefined
  let queueResult: QueueDualReelAndShortResult | null = null
  let durationSeconds = 13.3
  let compositeResult: any = null
  let resolvedOutroPath = options.customOutroImagePath
  const sceneFrames = options.sceneFramesDir ? resolveReelSceneFrames(options.sceneFramesDir) : []

  if (options.customVideo) {
    console.log(`\n🎬 Using pre-rendered custom video: ${options.customVideo}`)
    if (options.customVideo.startsWith('http://') || options.customVideo.startsWith('https://')) {
      publicUrl = options.customVideo
      masterReelPath = options.customVideo
    } else {
      masterReelPath = path.resolve(options.customVideo)
      if (!fs.existsSync(masterReelPath)) {
        throw new Error(`Custom video file not found: ${masterReelPath}`)
      }
      try {
        const probeOut = execSync(
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${masterReelPath}"`,
          { encoding: 'utf8' }
        )
        const parsed = parseFloat(probeOut.trim())
        if (!isNaN(parsed) && parsed > 0) durationSeconds = parsed
      } catch {
        // use fallback duration
      }
    }
  } else {
    // 2. Synthesize Voiceover & Word Boundaries
    console.log(`\n2️⃣ Synthesizing Neural Voiceover & Kinetic Timestamps (Fish Audio S2, Edge fallback)...`)
    // Default narrator voice; `--voice random` rotates through the catalog, FISH_VOICE_REFERENCE_ID overrides the default.
    const voice =
      options.voice === 'random'
        ? getRandomFishVoice()
        : options.voice || (process.env.FISH_VOICE_REFERENCE_ID ? undefined : REEL_NARRATOR_VOICE)
    console.log(`   • Voice Persona: "${voice || 'FISH_VOICE_REFERENCE_ID'}"`)
    const ttsResult = await generateVoiceover(scriptData.narrationScript, {
      voice,
      rate: '+12%',
      outputDir: tempDir,
      outputFilename: 'narration.mp3',
    })
    console.log(`   • TTS provider: ${ttsResult.providerUsed ?? 'unknown'}`)
    console.log(`   • Voiceover Duration: ${ttsResult.durationSeconds.toFixed(2)}s`)
    console.log(`   • Word Count: ${ttsResult.words.length}`)

    // 3. Generate Video Scenes (Veo 3.1) or Assemble from Recycled Clip Library
    const sceneVideoPaths: string[] = []
    const useVeo = (options.useVeo ?? true) && !options.recycleClips && !options.dryRun
    const voDuration = ttsResult.durationSeconds
    const postSpeechBuffer = 0.8
    const requiredSpeechDuration = voDuration + postSpeechBuffer
    const numScenes = options.numScenes || Math.max(1, scriptData.scenePrompts.length)

    // Each scene plays under one beat of the narration, and every cut lands between sentences.
    const beats = splitNarrationIntoBeats(scriptData.narrationScript, numScenes)
    const beatDurations = computeBeatDurations(beats, ttsResult.words, requiredSpeechDuration)
    console.log(`\n🎞️  Narration beats (one per scene):`)
    beats.forEach((b, i) => console.log(`   • [${i + 1}] ${(beatDurations[i] ?? 0).toFixed(1)}s  "${b}"`))

    // Shot list: Gemini writes one prompt per beat with a recurring protagonist and hero (falls back to curated pools).
    let scenePrompts = scriptData.scenePrompts
    if ((useVeo || options.dryRun) && options.director !== false && scenePrompts.length === beats.length) {
      console.log(`\n🎬 Directing a beat-matched shot list with canonical mascot ("${chosenMascot}")...`)
      const directed = await directScenePrompts({
        beats,
        topic: scriptData.topic,
        fallbackPrompts: scenePrompts,
        mascot: chosenMascot,
      })
      scenePrompts = directed.prompts
      if (directed.source === 'director') {
        console.log(`   • Director (${directed.model}) protagonist: ${directed.bible.protagonist}`)
        console.log(`   • Director (${directed.model}) hero: ${directed.bible.hero}`)
      } else {
        console.warn(`   ⚠️ Using curated scenes with the continuity layer (${directed.reason})`)
      }
      scenePrompts.forEach((p, i) => console.log(`   • [Scene ${i + 1}] ${p}`))
      scriptData.scenePrompts = scenePrompts
    }

    if (useVeo) {
      const sceneDurations = scenePrompts.map((_, i) => pickVeoClipDuration(beatDurations[i] ?? requiredSpeechDuration / numScenes))
      const veoSeconds = sceneDurations.reduce((a, b) => a + b, 0)
      const model = options.veoModel || 'gemini-omni-1.1-flash'
      const estimatedCost = checkReelVideoBudget(sceneDurations, model, options.videoBudgetUsd)
      console.log(`   • Estimated 720p video cost: $${estimatedCost.toFixed(2)} (duration-dependent)`)
      console.log(`\n3️⃣ Generating Video Scenes (${scenePrompts.length} scenes, ${veoSeconds}s of Veo footage: ${sceneDurations.join('s, ')}s)...`)
      const recentRunDirs = fs
        .readdirSync(path.resolve(process.cwd(), 'tmp'))
        .filter((d) => d.startsWith('reel-daily-') && d !== path.basename(tempDir))
        .sort()
        .reverse()
      const measuredSceneDurations: number[] = []
      for (let i = 0; i < scenePrompts.length; i++) {
        // Omni can return more footage than requested. Stop before the next paid request if the revised plan exceeds the budget.
        checkReelVideoBudget([...measuredSceneDurations, ...sceneDurations.slice(i)], model, options.videoBudgetUsd)
        const referenceImagePath = sceneFrames[i]
        const prompt = referenceImagePath
          ? `${scenePrompts[i]} The supplied image defines the character's identity. Preserve its face, eyes, shell, proportions, clothing and friendly cartoon design. Animate the existing character; do not redesign it into a realistic animal or add cybernetic armor.`
          : scenePrompts[i]
        const veoSceneDuration = sceneDurations[i]
        const sceneOut = path.join(tempDir, `veo-scene-${i + 1}.mp4`)
        const referenceHash = referenceImagePath ? createHash('sha256').update(fs.readFileSync(referenceImagePath)).digest('hex') : 'none'
        const promptSidecar = `${prompt}\n${veoSceneDuration}s\n${model}\nreference:${referenceHash}`

        // Recover a scene from the prior partial run only when it was rendered from the same prompt and length.
        if (!fs.existsSync(sceneOut) && recentRunDirs.length > 0) {
          const candidateScene = path.join(process.cwd(), 'tmp', recentRunDirs[0], `veo-scene-${i + 1}.mp4`)
          const candidateSidecar = `${candidateScene}.prompt.txt`
          if (
            fs.existsSync(candidateScene) &&
            fs.statSync(candidateScene).size > 10000 &&
            fs.existsSync(candidateSidecar) &&
            fs.readFileSync(candidateSidecar, 'utf8') === promptSidecar
          ) {
            fs.copyFileSync(candidateScene, sceneOut)
            fs.writeFileSync(`${sceneOut}.prompt.txt`, promptSidecar, 'utf8')
            console.log(`♻️  Reusing cached scene ${i + 1} from prior partial run: ${path.basename(recentRunDirs[0])}`)
          }
        }

        console.log(`\n🎬 Rendering Scene ${i + 1}/${scenePrompts.length} with ${options.veoModel || DEFAULT_VIDEO_MODEL} (${veoSceneDuration}s for a ${(beatDurations[i] ?? 0).toFixed(1)}s beat)...`)
        const veoResult = await generateVeoVideo({
          prompt,
          referenceImagePath,
          negativePrompt: SCENE_NEGATIVE_PROMPT,
          model: options.veoModel || DEFAULT_VIDEO_MODEL,
          aspectRatio: '9:16',
          durationSeconds: veoSceneDuration,
          uploadToS3: false,
          keepLocal: true,
          outputFilePath: sceneOut,
        })
        fs.writeFileSync(`${sceneOut}.prompt.txt`, promptSidecar, 'utf8')
        sceneVideoPaths.push(veoResult.localPath || sceneOut)
        const measuredDuration = Number(execFileSync('ffprobe', [
          '-v', 'error', '-show_entries', 'format=duration',
          '-of', 'default=noprint_wrappers=1:nokey=1', veoResult.localPath || sceneOut,
        ], { encoding: 'utf8' }).trim())
        if (!Number.isFinite(measuredDuration) || measuredDuration <= 0) throw new Error('Could not measure generated clip duration before continuing.')
        measuredSceneDurations.push(measuredDuration)
        console.log(`   • Actual source footage so far: ${measuredSceneDurations.reduce((sum, seconds) => sum + seconds, 0).toFixed(1)}s`)
      }
    } else {
      const modeLabel = options.recycleClips ? '♻️ Recycling Preexisting Stored Clips' : '⚠️ Local Assembly / Dry-Run'
      console.log(`\n3️⃣ ${modeLabel} (Selecting ${numScenes} clips from local video pool)...`)
      const selectedClips = selectRecycledClipSequence(numScenes, scriptData.topic, options.theme || '')
      sceneVideoPaths.push(...selectedClips)
      selectedClips.forEach((c, idx) => console.log(`   • [Scene ${idx + 1}] ${path.basename(c)}`))
    }

    if (sceneVideoPaths.length === 0) {
      throw new Error('No video clips available for compositing.')
    }

    // 4. Master FFmpeg Reel Compositing
    console.log(`\n4️⃣ Compositing Master Reel with FFmpeg...`)
    masterReelPath = path.join(tempDir, `master-reel-${timestamp}.mp4`)
    const colorGradingPresets = resolveColorGradingPresets(
      options.theme,
      scriptData.topic,
      sceneVideoPaths.length,
      options.colorGrading
    )

    // The final composite: the rendered CTA card that the AI outro builds from.
    const renderBaseOutroFrame = async (): Promise<string> => {
      const baseOutroPath = path.join(tempDir, 'base-outro-frame.png')
      await renderCtaOutroFrame(
        baseOutroPath,
        options.ctaHeadline || ctaConfig.headline,
        options.ctaSubheadline || ctaConfig.subheadline,
        options.ctaUrl || ctaConfig.url.replace(/^https?:\/\//, ''),
        {
          mascot: chosenMascot,
          ctaTexture: options.ctaTexture || ctaConfig.defaultTexture,
          ctaActionText: options.ctaActionText || ctaConfig.actionText,
        }
      )
      // Mirror to root tmp/ for convenient agent/user Antigravity generate_image access
      const rootBaseOutro = path.resolve(process.cwd(), 'tmp/base-outro-frame.png')
      try {
        fs.copyFileSync(baseOutroPath, rootBaseOutro)
      } catch {}
      return baseOutroPath
    }

    if (!resolvedOutroPath && options.aiOutro) {
      try {
        console.log(`\n🎨 Generating bespoke 3D outro card via Gemini API...`)
        const baseOutroPath = await renderBaseOutroFrame()
        const elevatedOutroPath = path.join(tempDir, `gemini-elevated-outro-${timestamp}.png`)
        const geminiResult = await generateGeminiImage({
          prompt: buildAntigravityOutroPrompt({
            theme: options.theme,
            topic: scriptData.topic,
            headline: options.ctaHeadline || ctaConfig.headline,
            subheadline: options.ctaSubheadline || ctaConfig.subheadline,
            url: options.ctaUrl || ctaConfig.url.replace(/^https?:\/\//, ''),
            actionText: options.ctaActionText || ctaConfig.actionText,
          }),
          referenceImagePath: baseOutroPath,
          aspectRatio: '9:16',
          imageSize: '2K',
          model: options.imageModel || 'gemini-3-pro-image',
          outputFilePath: elevatedOutroPath,
        })
        resolvedOutroPath = geminiResult.localPath
        console.log(`   ✨ Successfully generated bespoke 3D outro card: ${resolvedOutroPath}`)
      } catch (err: any) {
        console.warn(`   ⚠️ Bespoke Gemini outro generation failed, falling back to curated catalog: ${err.message}`)
      }
    }

    if (!resolvedOutroPath) {
      resolvedOutroPath = (await resolveThematicOutroCard({
        theme: options.theme,
        topic: scriptData.topic,
        ctaGoal: ctaConfig.goal,
        customImagePath: options.customOutroImagePath,
      })) || undefined
    }

    if (resolvedOutroPath) {
      console.log(`   💎 Resolved thematic outro card: ${path.basename(resolvedOutroPath)}`)
    } else {
      console.log(`   🖼️ Rendering Composite Studio outro card directly...`)
    }

    compositeResult = await compositeReel({
      videoClips: sceneVideoPaths,
      clipDurations: sceneVideoPaths.length === beatDurations.length ? beatDurations : undefined,
      voiceoverPath: ttsResult.audioPath,
      words: ttsResult.words,
      outputPath: masterReelPath,
      colorGrading: colorGradingPresets,
      watermarkOpacity: options.watermarkOpacity ?? 0.40,
      watermarkSize: options.watermarkSize ?? 110,
      ctaHeadline: options.ctaHeadline || ctaConfig.headline,
      ctaSubheadline: options.ctaSubheadline || ctaConfig.subheadline,
      ctaUrl: options.ctaUrl || ctaConfig.url.replace(/^https?:\/\//, ''),
      ctaBadge: options.ctaBadge || ctaConfig.actionText,
      ctaActionText: options.ctaActionText || ctaConfig.actionText,
      ctaTexture: options.ctaTexture || ctaConfig.defaultTexture,
      customOutroImagePath: resolvedOutroPath || options.customOutroImagePath,
      mascot: chosenMascot,
      backgroundAudioVolume: options.bgAudioVolume,
      backgroundAudioOffsetSeconds: options.bgAudioOffsetSeconds,
      tempDir: path.join(tempDir, 'ffmpeg-build'),
    })
    durationSeconds = compositeResult.durationSeconds
  }

  if (options.renderOnly) {
    console.log(`\nLocal reel ready for inspection: ${masterReelPath}`)
    return { masterReelPath, scriptData, compositeResult, renderOnly: true }
  }

  // 5. Upload Master Video to Neon S3
  let platformTarget: 'all' | 'instagram' | 'youtube' = options.platform || 'all'
  if (options.platforms && options.platforms.length === 1) {
    platformTarget = options.platforms[0]
  }

  if (!options.dryRun) {
    if (!publicUrl) {
      console.log(`\n5️⃣ Uploading Master Reel to Neon S3...`)
      s3Key = `videos/social/reels/${path.basename(masterReelPath)}`
      const s3Result = await uploadLocalFileToS3(masterReelPath, s3Key, DEFAULT_BUCKET)
      publicUrl = s3Result.publicUrl
      console.log(`   🚀 Public S3 Video URL: ${publicUrl}`)
    } else {
      console.log(`\n5️⃣ Video S3 URL: ${publicUrl}`)
      s3Key = `videos/social/reels/${path.basename(publicUrl.split('?')[0])}`
    }

    // 6️⃣ Deterministically Queue Dual Broadcast to Zernio (Reels & Shorts Queue) & First Comment
    if (publicUrl) {
      queueResult = await queueDualReelAndShort({
        videoUrl: publicUrl,
        instagramCaption: scriptData.caption,
        youtubeTitle: scriptData.youtubeTitle || `${scriptData.hookHeadline} #Shorts`,
        youtubeDescription: scriptData.youtubeDescription || `${scriptData.narrationScript}\n\nTake the Moltmaxxing Audit: ${ctaConfig.url}`,
        youtubeTags: ['Shorts', 'Moltmaxxing', 'BenthicAI', 'Carcinization', 'Tech'],
        firstComment: scriptData.firstComment,
        queueId: DEFAULT_REELS_QUEUE_ID,
        profileId: DEFAULT_PROFILE_ID,
        instagramAccountId: DEFAULT_INSTAGRAM_ACCOUNT_ID,
        youtubeAccountId: DEFAULT_YOUTUBE_ACCOUNT_ID,
        isAiGenerated: true,
        publishNow: options.publishNow,
        platform: platformTarget,
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
      durationSeconds,
      status: options.publishNow ? 'published' : 'queued',
      scheduledFor: queueResult?.scheduledFor || null,
      queueId: DEFAULT_REELS_QUEUE_ID,
      zernioInstagramPostId: queueResult?.instagramPostId || null,
      zernioYouTubePostId: queueResult?.youtubePostId || null,
      zernioPostId: queueResult?.postId || null,
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

    if (options.commit) {
      console.log(`\n📌 Auto-committing reel continuity ledger to git...`)
      const commitRes = autoCommitReelPublish(`reel-${timestamp}`, scriptData.topic, {
        outroImagePath: resolvedOutroPath,
      })
      if (commitRes.success) {
        console.log(`   ↳ Git: ${commitRes.message}`)
      } else {
        console.warn(`   ↳ Git Warning: ${commitRes.message}`)
      }
    }
  } else {
    console.log(`\n5️⃣ [Dry Run] Skipped S3 upload. Master video saved at: ${masterReelPath}`)
    queueResult = await queueDualReelAndShort({
      videoUrl: publicUrl || `https://placeholder.storage.neon.tech/moltology-public-assets/videos/social/reels/${path.basename(masterReelPath)}`,
      instagramCaption: scriptData.caption,
      youtubeTitle: scriptData.youtubeTitle || `${scriptData.hookHeadline} #Shorts`,
      youtubeDescription: scriptData.youtubeDescription || `${scriptData.narrationScript}\n\nTake the Moltmaxxing Audit: ${ctaConfig.url}`,
      youtubeTags: ['Shorts', 'Moltmaxxing', 'BenthicAI', 'Carcinization', 'Tech'],
      firstComment: scriptData.firstComment,
      queueId: DEFAULT_REELS_QUEUE_ID,
      profileId: DEFAULT_PROFILE_ID,
      instagramAccountId: DEFAULT_INSTAGRAM_ACCOUNT_ID,
      youtubeAccountId: DEFAULT_YOUTUBE_ACCOUNT_ID,
      isAiGenerated: true,
      dryRun: true,
      publishNow: options.publishNow,
      platform: platformTarget,
    })
  }

  console.log(`\n======================================================`)
  console.log(`✨ REEL GENERATION & QUEUEING COMPLETE!`)
  console.log(`======================================================`)
  console.log(`📹 Master Video: ${masterReelPath}`)
  if (publicUrl) console.log(`🔗 Public Stream URL: ${publicUrl}`)
  if (queueResult?.postId) console.log(`🚀 Unified Zernio Post ID: ${queueResult.postId}`)
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
  npx tsx scripts/create-reel.ts [options]

Options:
  --content-json <path>     Reviewed six-scene narration and platform copy
  --scene-frames <dir>      ImageGen scene-N.png inputs (character scenes 4–6 required)
  --video-budget <usd>     Estimated video budget (default 3.30; excludes other services)
  --render-only           Generate locally for inspection without upload or queueing
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
  --recycle-clips           Assemble reel from pre-existing stored video clips without generating new Veo footage
  --voice <name>            Fish Audio catalog voice (default: BOOK RECORD REGULAR, or env FISH_VOICE_REFERENCE_ID; "random" rotates) or Edge TTS voice for fallback (default: en-US-ChristopherNeural). Fish voices: Ethan, Mommy, Just Many, Twilight Sparkle, Young Creative Voice, Friendly Young Woman, Laura, BOOK RECORD REGULAR, Friendly Young Female
  --bg-volume <number>      Background soundtrack volume multiplier (default: 0.14)
  --bg-offset <seconds>     Soundtrack start point in seconds (e.g. 0, 18, 36, 54, 72, 95, 120)
  --veo-model <name>        Video model ID (default: gemini-omni-1.1-flash; veo-3.1-*-generate-preview until October 22, 2026)
  --custom-outro <path>     Path to bespoke elevated outro card image (from Antigravity generate_image or user polish)
  --render-base-outro       Render Composite Studio base outro frame to tmp/ and print Antigravity prompt
  --commit                  Automatically commit updated continuity ledger to git
  --ai-outro                Generate bespoke 3D outro card via Gemini API (needs an image generator)
  --no-director             Skip the Gemini shot list and use the curated scene prompts (still continuity-styled)
  --image-model <name>      Image model for AI outro: nano-banana-pro | nano-banana-2 (default: nano-banana-pro)
  --platform <name>         Platform target: all | instagram | youtube (default: all)
  --custom-video <path/url> Path or URL to pre-rendered master video to skip generation

Examples:
  npx tsx scripts/create-reel.ts
  npx tsx scripts/create-reel.ts --commit
  npx tsx scripts/create-reel.ts --render-base-outro
  npx tsx scripts/create-reel.ts --custom-outro tmp/elevated-outro.png
  npx tsx scripts/create-reel.ts --platform youtube
  npx tsx scripts/create-reel.ts --custom-video tmp/reel-daily-123/master-reel-123.mp4 --platform youtube
  npx tsx scripts/create-reel.ts --theme ecdysis --cta-goal guide --mascot lobster_pointing
  npx tsx scripts/create-reel.ts --theme pincer-torque --cta-goal quiz --color-grade calcified-armor
  npx tsx scripts/create-reel.ts --dry-run --no-veo
`)
    process.exit(0)
  }

  let topic: string | undefined
  let contentJsonPath: string | undefined
  let sceneFramesDir: string | undefined
  let videoBudgetUsd: number | undefined
  let renderOnly = false
  let theme: string | undefined
  let ctaGoal: any
  let mascot: any
  let holidayOrEvent: string | undefined
  let colorGrading: any
  let publishNow = false
  let scheduleBestTime = false
  let useVeo = true
  let dryRun = false
  let recycleClips = false
  let voice: string | undefined
  let bgAudioVolume: number | undefined
  let bgAudioOffsetSeconds: number | undefined
  let veoModel: string | undefined
  let customOutroImagePath: string | undefined
  let customVideo: string | undefined
  let platform: 'all' | 'instagram' | 'youtube' | undefined
  let aiOutro = false
  let renderBaseOutro = false
  let commit = false
  let director = true
  let imageModel: string | undefined
  let ctaTexture: any

  let ctaHeadline: string | undefined
  let ctaSubheadline: string | undefined
  let ctaUrl: string | undefined
  let ctaBadge: string | undefined
  let ctaActionText: string | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--topic' && args[i + 1]) topic = args[++i]
    else if (args[i] === '--content-json' && args[i + 1]) contentJsonPath = args[++i]
    else if (args[i] === '--scene-frames' && args[i + 1]) sceneFramesDir = args[++i]
    else if (args[i] === '--video-budget' && args[i + 1]) videoBudgetUsd = Number(args[++i])
    else if (args[i] === '--render-only') renderOnly = true
    else if (args[i] === '--theme' && args[i + 1]) theme = args[++i]
    else if (args[i] === '--cta-goal' && args[i + 1]) ctaGoal = args[++i]
    else if (args[i] === '--cta-headline' && args[i + 1]) ctaHeadline = args[++i]
    else if (args[i] === '--cta-subheadline' && args[i + 1]) ctaSubheadline = args[++i]
    else if (args[i] === '--cta-url' && args[i + 1]) ctaUrl = args[++i]
    else if (args[i] === '--cta-badge' && args[i + 1]) ctaBadge = args[++i]
    else if (args[i] === '--cta-action-text' && args[i + 1]) ctaActionText = args[++i]
    else if (args[i] === '--cta-texture' && args[i + 1]) ctaTexture = args[++i]
    else if (args[i] === '--mascot' && args[i + 1]) mascot = args[++i]
    else if (args[i] === '--holiday' && args[i + 1]) holidayOrEvent = args[++i]
    else if ((args[i] === '--color-grade' || args[i] === '--visual-preset') && args[i + 1]) colorGrading = args[++i]
    else if (args[i] === '--publish-now') publishNow = true
    else if (args[i] === '--schedule-best-time') scheduleBestTime = true
    else if (args[i] === '--no-veo') useVeo = false
    else if (args[i] === '--dry-run') dryRun = true
    else if (args[i] === '--recycle-clips') recycleClips = true
    else if (args[i] === '--voice' && args[i + 1]) voice = args[++i]
    else if (args[i] === '--bg-volume' && args[i + 1]) bgAudioVolume = parseFloat(args[++i])
    else if (args[i] === '--bg-offset' && args[i + 1]) bgAudioOffsetSeconds = parseFloat(args[++i])
    else if (args[i] === '--veo-model' && args[i + 1]) veoModel = args[++i]
    else if (args[i] === '--custom-outro' && args[i + 1]) customOutroImagePath = args[++i]
    else if (args[i] === '--custom-video' && args[i + 1]) customVideo = args[++i]
    else if (args[i] === '--platform' && args[i + 1]) platform = args[++i] as any
    else if (args[i] === '--ai-outro') aiOutro = true
    else if (args[i] === '--render-base-outro') renderBaseOutro = true
    else if (args[i] === '--commit') commit = true
    else if (args[i] === '--no-director') director = false
    else if (args[i] === '--image-model' && args[i + 1]) imageModel = args[++i]
  }

  if (renderBaseOutro) {
    const topicText = topic || 'The 2026 Benthic Shift'
    const ctaConfig = resolveCtaGoalConfig(ctaGoal || 'quiz', { theme, topic: topicText })
    const chosenMascot = mascot === 'none' ? 'none' : (mascot && mascot !== 'random' ? mascot : (ctaConfig.mascot || getRandomCharacterKey()))
    const outPath = customOutroImagePath || path.resolve(process.cwd(), 'tmp/base-outro-frame.png')
    const finalHeadline = ctaHeadline || ctaConfig.headline
    const finalSubheadline = ctaSubheadline || ctaConfig.subheadline
    const finalUrl = (ctaUrl || ctaConfig.url).replace(/^https?:\/\//, '')
    const finalActionText = ctaActionText || ctaBadge || ctaConfig.actionText

    console.log(`\n📸 Rendering Composite Studio base outro frame to ${outPath}...`)
    await renderCtaOutroFrame(
      outPath,
      finalHeadline,
      finalSubheadline,
      finalUrl,
      {
        mascot: chosenMascot,
        ctaTexture: ctaTexture || ctaConfig.defaultTexture,
        ctaActionText: finalActionText,
      }
    )
    const prompt = buildAntigravityOutroPrompt({
      theme,
      topic: topicText,
      headline: finalHeadline,
      subheadline: finalSubheadline,
      url: finalUrl,
      actionText: finalActionText,
    })
    console.log(`✅ Base outro frame rendered: ${outPath}`)
    console.log(`\n💡 Antigravity generate_image Directives:`)
    console.log(`   ImagePaths: ["${outPath}"]`)
    console.log(`   AspectRatio: "9:16"`)
    console.log(`   Prompt: "${prompt}"\n`)
    process.exit(0)
  }

  try {
    await createDailyReel({
      contentJsonPath,
      sceneFramesDir,
      videoBudgetUsd,
      renderOnly,
      topic,
      theme,
      ctaGoal,
      ctaTexture,
      ctaHeadline,
      ctaSubheadline,
      ctaUrl,
      ctaActionText,
      mascot,
      holidayOrEvent,
      colorGrading,
      publishNow,
      scheduleBestTime,
      useVeo,
      dryRun,
      recycleClips,
      voice,
      bgAudioVolume,
      bgAudioOffsetSeconds,
      veoModel,
      customOutroImagePath,
      customVideo,
      platform,
      aiOutro,
      director,
      imageModel,
      commit,
    })
  } catch (err: any) {
    console.error(`\n❌ Daily reel creation failed: ${err.message}`)
    process.exit(1)
  }
}

if (process.argv[1]?.includes('create-reel.ts') || process.argv[1]?.includes('create-reel.ts')) {
  runCli()
}
