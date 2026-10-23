#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { getAbsoluteAssetUrl } from '../src/lib/assets'
import { createHash } from 'node:crypto'
import { execSync, execFileSync } from 'node:child_process'
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
import { publishArchivedSocial } from './lib/social-archive'
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
    actionText: 'Try the Moltmaxxing Audit',
    headline: 'Submit. Shed. Ascend.',
    subheadline: 'Try the Moltmaxxing Audit',
    captionCta: 'Try the Moltmaxxing Audit.',
    firstCommentText: 'Try the Moltmaxxing Audit: https://moltology.org/quiz',
    defaultTexture: 'basalt',
    mascot: 'crab_stats',
    endingScriptPhrases: ['Try the audit at moltology.org.'],
  },
  guide: {
    goal: 'guide',
    keyword: 'GUIDE',
    url: 'https://moltology.org/news/the-2026-moltmaxxing-protocol-guide',
    actionText: 'Read the Moltmaxxing Protocol Guide',
    headline: 'Submit. Shed. Ascend.',
    subheadline: 'Read the Moltmaxxing Protocol Guide',
    captionCta: 'Read the Moltmaxxing Protocol Guide.',
    firstCommentText: 'Read the Moltmaxxing Protocol Guide: https://moltology.org/news/the-2026-moltmaxxing-protocol-guide',
    defaultTexture: 'chitin',
    mascot: 'lobster_pointing',
    endingScriptPhrases: ['Learn how to build your routine at moltology.org.'],
  },
  oracle: {
    goal: 'oracle',
    keyword: 'ORACLE',
    url: 'https://moltology.org/oracle',
    actionText: 'Ask the Oracle',
    headline: 'Submit. Shed. Ascend.',
    subheadline: 'Ask the Oracle',
    captionCta: 'Ask the Oracle.',
    firstCommentText: 'Ask the Oracle: https://moltology.org/oracle',
    defaultTexture: 'circuit',
    mascot: 'crab_stats',
    endingScriptPhrases: ['Try the Oracle at moltology.org.'],
  },
  chassis: {
    goal: 'chassis',
    keyword: 'CHASSIS',
    url: 'https://moltology.org/chassis',
    actionText: 'Explore the equipment vault',
    headline: 'Submit. Shed. Ascend.',
    subheadline: 'Explore the equipment vault',
    captionCta: 'Explore the equipment vault.',
    firstCommentText: 'Explore the equipment vault: https://moltology.org/chassis',
    defaultTexture: 'alloy',
    mascot: 'lobster_thumbs_up',
    endingScriptPhrases: ['Explore the equipment vault at moltology.org.'],
  },
  routine: {
    goal: 'routine',
    keyword: 'ROUTINE',
    url: 'https://moltology.org/news/the-2026-moltmaxxing-protocol-guide',
    actionText: 'Read the routine guide',
    headline: 'Submit. Shed. Ascend.',
    subheadline: 'Read the routine guide',
    captionCta: 'Read the routine guide.',
    firstCommentText: 'Read the routine guide: https://moltology.org/news/the-2026-moltmaxxing-protocol-guide',
    defaultTexture: 'carbon',
    mascot: 'lobster_thumbs_up',
    endingScriptPhrases: ['Find your next routine at moltology.org.'],
  },
  codex: {
    goal: 'codex',
    keyword: 'CODEX',
    url: 'https://moltology.org/codex',
    actionText: 'Read the Benthic Codex',
    headline: 'Submit. Shed. Ascend.',
    subheadline: 'Read the Benthic Codex',
    captionCta: 'Read the Benthic Codex.',
    firstCommentText: 'Read the Benthic Codex: https://moltology.org/codex',
    defaultTexture: 'basalt',
    mascot: 'lobster_peaceful',
    endingScriptPhrases: ['Read more in the Codex at moltology.org.'],
  },
  forum: {
    goal: 'forum',
    keyword: 'FORUM',
    url: 'https://moltology.org/forum',
    actionText: 'Join the community conversation',
    headline: 'Submit. Shed. Ascend.',
    subheadline: 'Join the community conversation',
    captionCta: 'Join the community conversation.',
    firstCommentText: 'Join the community conversation: https://moltology.org/forum',
    defaultTexture: 'basalt',
    mascot: 'lobster_pointing',
    endingScriptPhrases: ['Join the conversation at moltology.org.'],
  },
  demo: {
    goal: 'demo',
    keyword: 'DEMO',
    url: 'https://moltology.org',
    actionText: 'Explore Moltology',
    headline: 'Submit. Shed. Ascend.',
    subheadline: 'Explore Moltology',
    captionCta: 'Explore Moltology.',
    firstCommentText: 'Explore Moltology: https://moltology.org',
    defaultTexture: 'alloy',
    mascot: 'lobster_pointing',
    endingScriptPhrases: ['Learn more at moltology.org.'],
  },
  homepage: {
    goal: 'homepage',
    keyword: 'INITIATE',
    url: 'https://moltology.org',
    actionText: 'Find your first step',
    headline: 'Submit. Shed. Ascend.',
    subheadline: 'Find your first step',
    captionCta: 'Find your first step.',
    firstCommentText: 'Find your first step: https://moltology.org',
    defaultTexture: 'chitin',
    mascot: 'lobster_pointing',
    endingScriptPhrases: ['Find your first step at moltology.org.'],
  },
}

/** Replace a generated template's website invitation while retaining its useful narration.
 * Reviewed --content-json scripts bypass this helper and retain their authored copy.
 */
export function withReelWebsiteCta(narration: string, config: CtaGoalConfig): string {
  const sentences = narration.split(/(?<=[.!?])\s+/)
  const body = sentences.filter((sentence) =>
    !/moltology(?:\.org| dot org)|\bcomment\s+(?:QUIZ|GUIDE|ORACLE|CHASSIS|ROUTINE|CODEX|FORUM|DEMO|INITIATE)\b|\b(?:save|share|send) this\b/i.test(sentence)
  ).join(' ').trim()
  return `${body} ${config.endingScriptPhrases[0]}`.trim()
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
  const actionText = options.actionText || CTA_GOAL_CONFIGS.quiz.actionText
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
  if (entry.zernioPostId && history.reels.some((p: any) => p.zernioPostId === entry.zernioPostId)) return
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

  // 1. Reviewed script (written with the reels-and-shorts-creator skill)
  console.log(`\n1️⃣ Loading reviewed script...`)
  if (!options.contentJsonPath) {
    throw new Error('A reviewed script is required: pass --content-json <draft.json> (see the reels-and-shorts-creator skill).')
  }
  const scriptData = loadReviewedReelScript(options.contentJsonPath)
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
  let archivePath: string | undefined
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
        options.ctaUrl || 'moltology.org',
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
            url: options.ctaUrl || 'moltology.org',
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
      ctaUrl: options.ctaUrl || 'moltology.org',
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

  // 5. Archive final media in Drive and publish directly to Zernio
  let platformTarget: 'all' | 'instagram' | 'youtube' = options.platform || 'all'
  if (options.platforms && options.platforms.length === 1) {
    platformTarget = options.platforms[0]
  }

  if (!options.dryRun) {
    // URL-only inputs are downloaded once, then archived and uploaded locally.
    if (publicUrl) {
      const response = await fetch(getAbsoluteAssetUrl(publicUrl))
      if (!response.ok) throw new Error(`Could not download final reel (HTTP ${response.status}).`)
      masterReelPath = path.join(tempDir, 'master.mp4')
      await pipeline(Readable.fromWeb(response.body as any), fs.createWriteStream(masterReelPath))
    }
    const publication = {
      instagramCaption: scriptData.caption,
      youtubeTitle: scriptData.youtubeTitle || `${scriptData.hookHeadline} #Shorts`,
      youtubeDescription: scriptData.youtubeDescription || `${scriptData.narrationScript}\n\n${ctaConfig.captionCta} ${ctaConfig.url}`,
      youtubeTags: scriptData.youtubeTags || ['Shorts', 'Moltmaxxing', 'BenthicAI', 'Carcinization', 'Tech'],
      firstComment: scriptData.firstComment, queueId: DEFAULT_REELS_QUEUE_ID, profileId: DEFAULT_PROFILE_ID,
      instagramAccountId: DEFAULT_INSTAGRAM_ACCOUNT_ID, youtubeAccountId: DEFAULT_YOUTUBE_ACCOUNT_ID,
      isAiGenerated: true, validateMediaWindow: true, publishNow: !!options.publishNow, platform: platformTarget,
    }
    const archived = await publishArchivedSocial({
      kind: 'reel', files: [masterReelPath], metadata: { script: scriptData, durationSeconds, publication },
    }, ([videoPath]) => queueDualReelAndShort({ ...publication, videoPath }))
    archivePath = archived.archive.relativePath
    queueResult = archived.result
    publicUrl = queueResult.mediaUrls?.[0]

    // Record to Social History Ledger
    recordReelInHistory({
      id: `reel-${timestamp}`,
      topic: scriptData.topic,
      hookHeadline: scriptData.hookHeadline,
      holidayOrEvent: scriptData.holidayOrEvent || null,
      relatedBlogSlug: scriptData.relatedBlogSlug || null,
      characterArc: scriptData.characterArc,
      narrationScript: scriptData.narrationScript,
      archivePath,
      zernioMediaUrls: queueResult.mediaUrls || [],
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
    console.log(`\n5️⃣ [Dry Run] Skipped Drive archive and uploads. Master video saved at: ${masterReelPath}`)
    queueResult = await queueDualReelAndShort({
      videoUrl: publicUrl || `https://placeholder.storage.neon.tech/moltology-public-assets/videos/social/reels/${path.basename(masterReelPath)}`,
      instagramCaption: scriptData.caption,
      youtubeTitle: scriptData.youtubeTitle || `${scriptData.hookHeadline} #Shorts`,
      youtubeDescription: scriptData.youtubeDescription || `${scriptData.narrationScript}\n\n${ctaConfig.captionCta} ${ctaConfig.url}`,
      youtubeTags: scriptData.youtubeTags || ['Shorts', 'Moltmaxxing', 'BenthicAI', 'Carcinization', 'Tech'],
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
    archivePath,
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
  --content-json <path>     Required. Reviewed six-scene narration and platform copy
  --scene-frames <dir>      ImageGen scene-N.png inputs (character scenes 4–6 required)
  --video-budget <usd>     Estimated video budget (default 3.30; excludes other services)
  --render-only           Generate locally for inspection without upload or queueing
  --theme <name>            Optional hint for colour grading and recycled clips
  --cta-goal <name>         Conversion goal: quiz | guide | codex | demo | homepage
  --mascot <name>           Outro mascot: any key in src/lib/mascots.ts (e.g. lobster_pointing, crab_builder) | random | none
  --topic <string>          Topic hint for the base outro render
  --holiday <string>        Specific holiday or cultural event
  --color-grade <preset>    Cinematic color grading: auto | benthic-cyan | thermal-melt | photonics-matrix | calcified-armor | none
  --publish-now             Publish directly to Instagram immediately (skip draft)
  --schedule-best-time      Schedule for optimal audience engagement time via Zernio
  --no-veo                  Skip Google Veo rendering (use local benthic footage)
  --dry-run                 Local test without archiving to Drive or uploading to Zernio
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
  npx tsx scripts/create-reel.ts --content-json tmp/reel-next/draft.json --scene-frames tmp/reel-next/frames --custom-outro tmp/reel-next/outro.png --render-only
  npx tsx scripts/create-reel.ts --content-json tmp/reel-next/draft.json --custom-video tmp/reel-daily-123/master-reel-123.mp4 --commit
  npx tsx scripts/create-reel.ts --content-json .agents/skills/reels-and-shorts-creator/references/example-draft.json --recycle-clips --dry-run
  npx tsx scripts/create-reel.ts --render-base-outro
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
    const finalUrl = ctaUrl ? ctaUrl.replace(/^https?:\/\//, '') : 'moltology.org'
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
