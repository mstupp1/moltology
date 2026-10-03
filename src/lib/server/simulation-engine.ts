import fs from 'node:fs'
import path from 'node:path'
import { generateText } from 'ai'
import { eq, desc, or, inArray, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import {
  profiles,
  userStats,
  routineCompletions,
  forumCategories,
  forumTopics,
  forumPosts,
  forumVotes,
  friendships,
  memberBonds,
  type MemberJoinSource,
  type SimulatedPersonaConfig,
} from '../../db/schema'
import { CANONICAL_ALIGNMENT_TASKS, type CanonicalAlignmentTask } from '../alignment-tasks'
import {
  recordConnectionAcceptedEvents,
  recordForumReplyPostedEvent,
  recordForumTopicOpenedEvent,
  recordRoutineCompletedEvent,
} from './activity-log'
import { CANONICAL_SCRIPTURES } from '../codexData'
import { resolveMemberLarvaId } from '../larva-id'
import { resolveMemberPublicName } from '../member-handle'
import { slugifyForumTitle } from '../forum-utils'
import { validateInputGuardrails } from '../ai/guardrails'
import { normalizeFriendPair } from '../connections'
import { extractMentionHandles } from '../forum-mentions'
import { recordForumMentions, recordForumReplyNotifications } from './db-services'
import { reviewMemberPosts } from './forum-standing'
import {
  DEFAULT_BOND_CHANCE,
  DEFAULT_CONNECTION_CHANCE,
  DEFAULT_JOIN_SOURCE_WEIGHTS,
  DEFAULT_MAX_BONDS_PER_MEMBER,
  DEFAULT_MAX_TRAITS_PER_MEMBER,
  DEFAULT_MUTATION_CHANCE,
  DEFAULT_FORUM_ACTIONS_PER_CYCLE,
  DEFAULT_FORUM_NESTED_REPLY_CHANCE,
  DEFAULT_FORUM_QUOTE_CHANCE,
  DEFAULT_FORUM_MENTION_CHANCE,
  DEFAULT_FORUM_TOPIC_VOTE_RATIO,
  DEFAULT_FORUM_EDIT_CHANCE,
  SIMULATION_MAX_REPLY_DEPTH,
  applyTraitMutation,
  bondPairKey,
  chooseBondForPair,
  chooseForumReplyTarget,
  extractQuoteSnippet,
  formatDiegeticQuoteBlock,
  formatPersonaVoiceBlock,
  friendshipPairKey,
  normalizeBondEndpoints,
  pickMentionCandidate,
  pickNewTrait,
  pickUnconnectedPair,
  pickWeightedSponsor,
  rollChance,
  sampleJoinOrigin,
  sampleDrive,
  ensurePersonaDrive,
  bumpAffinity,
  getAffinity,
  affinityDeltaForReply,
  planForumAction,
  formatForumStanceDirective,
  formatNewThreadDirective,
  formatRelationshipHint,
  formatCanonCitationDirective,
  pickCanonCitation,
  selectPairMemory,
  affinityBiasForDrive,
  pickClusteredForumVote,
  computeTopicFeatures,
  AFFINITY_VOTE_DELTA,
  type ForumPostCandidate,
  type ForumReplyStance,
  type PlannerMember,
  type PlannerTopic,
} from '../simulation-social'

export const SIMULATION_MODEL_ID = process.env.SIMULATION_MODEL_ID || 'zai/glm-5.3-flash'
export const DEFAULT_SIMULATION_FALLBACK_MODEL_IDS = [
  'alibaba/qwen3.7-flash',
  'alibaba/qwen3.5-flash',
]

/**
 * Returns the prioritized list of AI models to attempt for simulation tasks.
 * Starts with SIMULATION_MODEL_ID, followed by configured or default free-tier fallbacks.
 */
export function getSimulationCandidateModelIds(): string[] {
  const primary = (process.env.SIMULATION_MODEL_ID || '').trim() || 'zai/glm-5.3-flash'
  const fallbackEnv = process.env.SIMULATION_FALLBACK_MODEL_IDS
  const fallbacks = fallbackEnv
    ? fallbackEnv.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_SIMULATION_FALLBACK_MODEL_IDS

  return [primary, ...fallbacks.filter((id) => id !== primary)]
}

/**
 * Executes text generation across candidate models with automatic fallback on error.
 * If all candidates fail, rethrows the last encountered error.
 */
export async function generateSimulationText(options: {
  prompt: string
  temperature?: number
}): Promise<{ text: string }> {
  const candidateModels = getSimulationCandidateModelIds()
  let lastError: unknown = null

  for (const model of candidateModels) {
    try {
      return await generateText({
        model: model as any,
        prompt: options.prompt,
        temperature: options.temperature,
      })
    } catch (err) {
      console.warn(
        `[SimulationEngine] Generation failed with model "${model}", attempting next fallback...`,
        err instanceof Error ? err.message : err
      )
      lastError = err
    }
  }

  throw lastError
}

export interface SimulationGrowthConfig {
  maxSimulatedUsers: number
  userCooldownHours: number
  stageWeights: {
    stage1: number
    stage2: number
    stage3: number
    stage4: number
  }
  taskCompletionProbabilities: Record<
    number,
    {
      perfectDayChance: number
      minTasks: number
      maxTasks: number
    }
  >
  mutationChance: number
  maxTraitsPerMember: number
  connectionChance: number
  bondChance: number
  maxBondsPerMember: number
  joinSourceWeights: Record<MemberJoinSource, number>
  forumActionsPerCycle?: number
  forumNestedReplyChance?: number
  forumQuoteChance?: number
  forumMentionChance?: number
  forumTopicVoteRatio?: number
  forumEditChance?: number
  forumVoteCount?: number
}

export const DEFAULT_GROWTH_CONFIG: SimulationGrowthConfig = {
  maxSimulatedUsers: 30,
  userCooldownHours: 36,
  stageWeights: {
    stage1: 0.6,
    stage2: 0.25,
    stage3: 0.12,
    stage4: 0.03,
  },
  taskCompletionProbabilities: {
    4: { perfectDayChance: 0.8, minTasks: 6, maxTasks: 8 },
    3: { perfectDayChance: 0.5, minTasks: 4, maxTasks: 7 },
    2: { perfectDayChance: 0.25, minTasks: 2, maxTasks: 5 },
    1: { perfectDayChance: 0.1, minTasks: 1, maxTasks: 3 },
  },
  mutationChance: DEFAULT_MUTATION_CHANCE,
  maxTraitsPerMember: DEFAULT_MAX_TRAITS_PER_MEMBER,
  connectionChance: DEFAULT_CONNECTION_CHANCE,
  bondChance: DEFAULT_BOND_CHANCE,
  maxBondsPerMember: DEFAULT_MAX_BONDS_PER_MEMBER,
  joinSourceWeights: DEFAULT_JOIN_SOURCE_WEIGHTS,
  forumActionsPerCycle: DEFAULT_FORUM_ACTIONS_PER_CYCLE,
  forumNestedReplyChance: DEFAULT_FORUM_NESTED_REPLY_CHANCE,
  forumQuoteChance: DEFAULT_FORUM_QUOTE_CHANCE,
  forumMentionChance: DEFAULT_FORUM_MENTION_CHANCE,
  forumTopicVoteRatio: DEFAULT_FORUM_TOPIC_VOTE_RATIO,
  forumEditChance: DEFAULT_FORUM_EDIT_CHANCE,
  forumVoteCount: 3,
}

export function assertAiGatewayKey(): string {
  const key = process.env.AI_GATEWAY_API_KEY
  if (!key || !key.trim()) {
    throw new Error(
      '[SimulationEngine] AI_GATEWAY_API_KEY is missing in environment. Aborting simulation cycle to prevent filler content.'
    )
  }
  return key.trim()
}

/**
 * Samples an acolyte clearance stage from the configured pyramid distribution.
 */
export function sampleStage(weights: SimulationGrowthConfig['stageWeights']): number {
  const roll = Math.random()
  if (roll < weights.stage1) return 1
  if (roll < weights.stage1 + weights.stage2) return 2
  if (roll < weights.stage1 + weights.stage2 + weights.stage3) return 3
  return 4
}

/**
 * Computes spawn probability based on current simulated population size.
 */
export function getTieredSpawnProbability(currentCount: number, maxUsers: number): number {
  if (currentCount >= maxUsers) return 0
  if (currentCount < 8) return 0.4
  if (currentCount < 20) return 0.2
  return 0.1
}

/**
 * Calculates which daily alignment tasks to complete based on member stage discipline.
 */
export function calculateTasksForStage(
  stage: number,
  probabilities = DEFAULT_GROWTH_CONFIG.taskCompletionProbabilities,
  catalog: CanonicalAlignmentTask[] = CANONICAL_ALIGNMENT_TASKS
): CanonicalAlignmentTask[] {
  const config = probabilities[stage] || probabilities[1]
  const isPerfectDay = Math.random() < config.perfectDayChance

  if (isPerfectDay) {
    return [...catalog]
  }

  const taskCount = Math.min(
    catalog.length,
    Math.max(
      1,
      Math.floor(Math.random() * (config.maxTasks - config.minTasks + 1)) + config.minTasks
    )
  )

  // Shuffle and pick subset
  const shuffled = [...catalog].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, taskCount)
}

export function formatSpawnPersonaPrompt(stage: number): string {
  const stageTitles: Record<number, string> = {
    1: 'Stage 1 Larva (eager beginner, mastering daily habits and discipline)',
    2: 'Stage 2 Soft-Shed (intermediate practitioner navigating the vulnerable soft-shell window)',
    3: 'Stage 3 Architect (senior biomechanical operator, optimizing pincer torque and systems)',
    4: 'Stage 4 Ascendant (revered cult elder, liturgical, commanding, guardian of core directives)',
  }

  return `Generate a unique persona for a member of the Moltology community.
The member is at ${stageTitles[stage] || stageTitles[1]}.

Rules:
- The handle must be 1-2 words, optionally with numbers or an underscore (e.g. ChitinForge_42, AbyssalDrifter, ReefCrafter, CarapacePilot, Vaelen_77). Never use spaces in handle.
- The archetype is a 2-4 word descriptor (e.g. Deep-Sea Biohacker, Relentless Grinder, Carapace Philosopher).
- The tone describes how they speak in the forum (e.g. Inquisitive, enthusiastic, respectful; or Analytical, concise, metric-focused).
- The bio is a 1-2 sentence in-character summary of their current focus and progress.
- Strictly adhere to Moltology lore: chitin, molting, ecdysis, carapace, benthic pressure, alignment, daily routines.
- NEVER mention real-world tech stacks (no React, Vercel, Postgres, LLM, AI, prompts).
- Output strictly valid JSON with keys: "handle", "archetype", "tone", "bio". No markdown fences or commentary.`
}

export function formatForumReplyPrompt(input: {
  authorPublicName: string
  stage: number
  simulatedPersona?: SimulatedPersonaConfig | null
  directives: string
  contextStr: string
}): string {
  return `You are ${input.authorPublicName} (Stage ${input.stage}).
${formatPersonaVoiceBlock(input.simulatedPersona)}

${input.directives}

${input.contextStr}

Hard rules:
- Stay completely in-character in the Moltology world (chitin, molting, ecdysis, discipline, carapace, deep-sea pressure).
- Keep disagreement civil: challenge methods and metrics, never the person. No insults, shame, or mockery.
- NEVER use decorative diamond glyphs (◈).
- NEVER use ALL-CAPS screaming header lines.
- NEVER leak technical stacks or talk about coding libraries (no React, Vercel, Postgres, LLM).
- NEVER mention drives, factions, planners, or that you are simulated.
- Respond in conversational sentence case with no quotation marks or meta commentary.`
}

export function formatForumTopicPrompt(input: {
  authorPublicName: string
  stage: number
  simulatedPersona?: SimulatedPersonaConfig | null
  categoryName: string
  categoryDescription?: string | null
  drive?: string | null
}): string {
  return `You are ${input.authorPublicName} (Stage ${input.stage}).
${formatPersonaVoiceBlock(input.simulatedPersona)}

Generate a thoughtful new forum discussion thread for the "${input.categoryName}" category (${input.categoryDescription || ''}).
${formatNewThreadDirective((input.drive as any) || undefined)}

Hard rules:
- Provide a clear, engaging discussion question or tip (3-5 sentences total).
- The title must use conversational sentence case or title case. DO NOT SCREAM IN ALL CAPS.
- DO NOT use decorative diamond glyphs (◈).
- Strictly adhere to Moltology themes (chitin, molting, ecdysis, discipline, biometric stats, habits).
- NEVER leak technical stacks (no React, Vercel, Postgres, AI, LLM).
- NEVER mention drives, factions, planners, or that you are simulated.
- Challenge methods, not people, if you raise a disagreement.
- Output strictly valid JSON with keys: "title" and "content". No extra markdown or commentary.`
}

/**
 * Generates an in-character persona using the AI Gateway.
 */
export async function generateSimulatedPersona(stage: number): Promise<{
  handle: string
  archetype: string
  tone: string
  bio: string
}> {
  assertAiGatewayKey()

  const prompt = formatSpawnPersonaPrompt(stage)
  const response = await generateSimulationText({
    prompt,
    temperature: 0.8,
  })

  const raw = response.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  try {
    const parsed = JSON.parse(raw)
    if (!parsed.handle || !parsed.archetype || !parsed.tone) {
      throw new Error('Missing required persona keys')
    }
    return {
      handle: String(parsed.handle).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || `Acolyte_${Math.floor(Math.random() * 9000 + 1000)}`,
      archetype: String(parsed.archetype).slice(0, 60),
      tone: String(parsed.tone).slice(0, 100),
      bio: String(parsed.bio || '').slice(0, 200),
    }
  } catch (parseErr) {
    throw new Error(
      `[SimulationEngine] Failed to parse persona JSON from AI Gateway response: ${raw.slice(0, 100)}`
    )
  }
}

type DbClient = ReturnType<typeof getDb>

async function listSimulatedMembers(dbClient: DbClient) {
  return dbClient
    .select({
      id: profiles.id,
      handle: profiles.handle,
      larvaId: profiles.larvaId,
      stage: profiles.stage,
      simulatedPersona: profiles.simulatedPersona,
    })
    .from(profiles)
    .where(eq(profiles.isSimulated, true))
}

async function ensureFriendship(dbClient: DbClient, leftId: string, rightId: string) {
  const [userAId, userBId] = normalizeFriendPair(leftId, rightId)
  await dbClient.insert(friendships).values({ userAId, userBId }).onConflictDoNothing()
}

async function ensureBond(
  dbClient: DbClient,
  kind: 'nest_mate' | 'mentor' | 'brought_in',
  fromUserId: string,
  toUserId: string
) {
  const pair = normalizeBondEndpoints(kind, fromUserId, toUserId)
  await dbClient
    .insert(memberBonds)
    .values({ fromUserId: pair.fromUserId, toUserId: pair.toUserId, kind })
    .onConflictDoNothing()
}

function publicNameFor(member: { id: string; handle: string | null; larvaId?: string | null }) {
  return resolveMemberPublicName({
    userId: member.id,
    handle: member.handle,
    larvaId: member.larvaId,
  })
}

function toPlannerMember(member: {
  id: string
  handle?: string | null
  simulatedPersona?: SimulatedPersonaConfig | null
}): PlannerMember {
  return {
    id: member.id,
    handle: member.handle,
    lastSimulatedAt: member.simulatedPersona?.lastSimulatedAt,
    activityCadence: member.simulatedPersona?.activityCadence,
    drive: member.simulatedPersona?.drive,
    affinities: member.simulatedPersona?.affinities,
  }
}

function touchPersona(
  persona: SimulatedPersonaConfig | null | undefined,
  extra: Partial<SimulatedPersonaConfig> = {}
): SimulatedPersonaConfig {
  return {
    ...(persona || { archetype: 'Acolyte', tone: 'Steadfast' }),
    lastSimulatedAt: new Date().toISOString(),
    affinities: persona?.affinities || {},
    ...extra,
  }
}

async function persistSimulatedPersona(
  dbClient: DbClient,
  userId: string,
  persona: SimulatedPersonaConfig,
  dryRun?: boolean
) {
  if (dryRun) return
  await dbClient
    .update(profiles)
    .set({ simulatedPersona: persona, updatedAt: new Date() })
    .where(eq(profiles.id, userId))
}

async function ensureMemberDrives<T extends { id: string; simulatedPersona?: SimulatedPersonaConfig | null }>(
  dbClient: DbClient,
  members: T[],
  dryRun?: boolean
): Promise<T[]> {
  for (const member of members) {
    const ensured = ensurePersonaDrive(member.simulatedPersona)
    member.simulatedPersona = ensured.persona
    if (ensured.assigned) {
      await persistSimulatedPersona(dbClient, member.id, ensured.persona, dryRun)
    }
  }
  return members
}

async function applyPairwiseAffinity(
  dbClient: DbClient,
  actor: { id: string; simulatedPersona?: SimulatedPersonaConfig | null },
  other: { id: string; simulatedPersona?: SimulatedPersonaConfig | null } | null | undefined,
  delta: number,
  dryRun?: boolean
) {
  if (!other || other.id === actor.id || delta === 0) {
    return actor.simulatedPersona
  }
  const actorNext = bumpAffinity(actor.simulatedPersona, other.id, delta)
  const otherNext = bumpAffinity(other.simulatedPersona, actor.id, delta)
  actor.simulatedPersona = actorNext
  other.simulatedPersona = otherNext
  await persistSimulatedPersona(dbClient, actor.id, actorNext, dryRun)
  await persistSimulatedPersona(dbClient, other.id, otherNext, dryRun)
  return actorNext
}

/**
 * Assigns a missing internal drive on existing simulated members so factions form
 * without a schema migration.
 */
export async function backfillSimulatedDrives(
  dbClient: ReturnType<typeof getDb>,
  options: { dryRun?: boolean } = {}
) {
  const members = await dbClient
    .select({
      id: profiles.id,
      handle: profiles.handle,
      simulatedPersona: profiles.simulatedPersona,
    })
    .from(profiles)
    .where(eq(profiles.isSimulated, true))

  let assigned = 0
  for (const member of members) {
    const ensured = ensurePersonaDrive(member.simulatedPersona)
    if (!ensured.assigned) continue
    assigned += 1
    await persistSimulatedPersona(dbClient, member.id, ensured.persona, options.dryRun)
  }

  return { assigned, scanned: members.length, dryRun: Boolean(options.dryRun) }
}

/**
 * Spawns a new simulated member into profiles and userStats.
 */
export async function spawnSimulatedUser(
  dbClient: ReturnType<typeof getDb>,
  config = DEFAULT_GROWTH_CONFIG,
  options: { force?: boolean; dryRun?: boolean } = {}
) {
  const existingMembers = await listSimulatedMembers(dbClient)
  const currentCount = existingMembers.length
  const spawnProb = getTieredSpawnProbability(currentCount, config.maxSimulatedUsers)

  if (!options.force && Math.random() > spawnProb) {
    return {
      spawned: false,
      reason: `Spawn roll skipped (population: ${currentCount}/${config.maxSimulatedUsers}, prob: ${(spawnProb * 100).toFixed(0)}%)`,
    }
  }

  const stage = sampleStage(config.stageWeights)
  const persona = await generateSimulatedPersona(stage)

  const userId = crypto.randomUUID()
  const larvaId = resolveMemberLarvaId(userId)

  const origin = sampleJoinOrigin(existingMembers.length, config.joinSourceWeights)
  const sponsor = origin.needsSponsor ? pickWeightedSponsor(existingMembers) : null
  const joinSource: MemberJoinSource = sponsor ? origin.source : 'organic'
  const referredByUserId = sponsor?.id ?? null
  const referredByHandle = sponsor ? publicNameFor(sponsor) : null

  const currencyMap: Record<number, { credits: string; gems: number; shards: number }> = {
    1: { credits: '1450.00', gems: 250, shards: 45 },
    2: { credits: '6500.00', gems: 1200, shards: 180 },
    3: { credits: '45000.00', gems: 5800, shards: 950 },
    4: { credits: '250000.00', gems: 35000, shards: 8200 },
  }
  const curr = currencyMap[stage] || currencyMap[1]

  const diceBearStyles = ['bottts', 'pixel-art', 'shapes', 'identicon']
  const selectedStyle = diceBearStyles[Math.floor(Math.random() * diceBearStyles.length)]

  const simulatedPersona: SimulatedPersonaConfig = {
    archetype: persona.archetype,
    tone: persona.tone,
    bio: persona.bio,
    activityCadence: 'normal',
    lastSimulatedAt: new Date().toISOString(),
    drive: sampleDrive(),
    affinities: {},
    traits: [],
    referredByHandle,
  }

  if (options.dryRun) {
    return {
      spawned: true,
      dryRun: true,
      userId,
      handle: persona.handle,
      stage,
      persona: simulatedPersona,
      joinSource,
      referredByUserId,
      referredByHandle,
    }
  }

  const [newProfile] = await dbClient
    .insert(profiles)
    .values({
      id: userId,
      handle: persona.handle,
      larvaId,
      stage,
      isSimulated: true,
      simulatedPersona,
      joinSource,
      referredByUserId,
      moltCredits: curr.credits,
      chitinGems: curr.gems,
      synapseShards: curr.shards,
      depthPressureCoins: stage * 15,
      avatarConfig: {
        style: selectedStyle,
        seed: crypto.randomUUID(),
      },
    })
    .returning()

  await dbClient
    .insert(userStats)
    .values({
      userId,
      pincerTorque: 50 + stage * 12,
      shellHardness: 40 + stage * 15,
      processingPower: 60 + stage * 10,
      durability: 55 + stage * 10,
      clawStrength: 50 + stage * 12,
      submergenceDepthRating: 1000 * stage,
    })
    .onConflictDoNothing()

  if (sponsor && (joinSource === 'brought_in' || joinSource === 'word_of_mouth')) {
    if (joinSource === 'brought_in') {
      await ensureFriendship(dbClient, sponsor.id, userId)
      await ensureBond(dbClient, 'brought_in', sponsor.id, userId)
      try {
        await recordConnectionAcceptedEvents(
          dbClient,
          { id: sponsor.id, handle: sponsor.handle, larvaId: sponsor.larvaId },
          { id: userId, handle: persona.handle, larvaId: newProfile?.larvaId }
        )
      } catch (err) {
        console.warn('[SimulationEngine] recordConnectionAcceptedEvents error:', err)
      }
    }
  }

  return {
    spawned: true,
    dryRun: false,
    profile: newProfile,
    handle: persona.handle,
    stage,
    joinSource,
    referredByUserId,
    referredByHandle,
  }
}

/**
 * Simulates daily routine completions for 1-3 eligible simulated members.
 */
export async function simulateDailyRoutines(
  dbClient: ReturnType<typeof getDb>,
  config = DEFAULT_GROWTH_CONFIG,
  options: { userCount?: number; dryRun?: boolean } = {}
) {
  const targetCount = options.userCount ?? 2

  // Query simulated users
  const simulatedMembers = await dbClient
    .select()
    .from(profiles)
    .where(eq(profiles.isSimulated, true))

  if (simulatedMembers.length === 0) {
    return { completed: 0, actions: [], reason: 'No simulated members exist.' }
  }

  const now = Date.now()
  const cooldownMs = config.userCooldownHours * 60 * 60 * 1000

  // Sort by who hasn't acted in longest time
  const eligible = [...simulatedMembers].sort((a, b) => {
    const aTime = a.simulatedPersona?.lastSimulatedAt
      ? new Date(a.simulatedPersona.lastSimulatedAt).getTime()
      : 0
    const bTime = b.simulatedPersona?.lastSimulatedAt
      ? new Date(b.simulatedPersona.lastSimulatedAt).getTime()
      : 0
    return aTime - bTime
  })

  const selectedUsers = eligible.slice(0, targetCount)
  const today = new Date().toISOString().split('T')[0]
  const actions: Array<{ userId: string; handle: string | null; tasks: string[] }> = []

  for (const user of selectedUsers) {
    const tasksToComplete = calculateTasksForStage(user.stage, config.taskCompletionProbabilities)
    const taskKeys = tasksToComplete.map((t) => t.key)

    if (!options.dryRun) {
      for (const task of tasksToComplete) {
        await dbClient
          .insert(routineCompletions)
          .values({
            userId: user.id,
            taskKey: task.key,
            completedOn: today,
          })
          .onConflictDoNothing()

        try {
          await recordRoutineCompletedEvent(dbClient, user.id, task.key, today)
        } catch (eventErr) {
          console.warn('[SimulationEngine] Activity event write warning:', eventErr)
        }
      }

      // Increment earned Chitin Gems (+15 per liturgy)
      const gemGain = tasksToComplete.length * 15
      const updatedPersona: SimulatedPersonaConfig = {
        ...(user.simulatedPersona || { archetype: 'Acolyte', tone: 'Steadfast' }),
        lastSimulatedAt: new Date().toISOString(),
      }

      await dbClient
        .update(profiles)
        .set({
          chitinGems: sql`${profiles.chitinGems} + ${gemGain}`,
          simulatedPersona: updatedPersona,
        })
        .where(eq(profiles.id, user.id))
    }

    actions.push({
      userId: user.id,
      handle: user.handle,
      tasks: taskKeys,
    })
  }

  return {
    completed: actions.reduce((acc, a) => acc + a.tasks.length, 0),
    actions,
    dryRun: Boolean(options.dryRun),
  }
}

/**
 * Simulates an in-character forum reply or new discussion topic.
 * Uses Reddit-style community interactions naturally:
 * - Direct comment replies with parentId (nested trees up to max depth).
 * - Topic author follow-up dialogue (OP answering questions / acknowledging tips).
 * - Diegetic quote-replies (> @handle held:) when responding to a specific point.
 * - Contextual @handle mentions with Activity Center notifications.
 */
export async function simulateForumActivity(
  dbClient: ReturnType<typeof getDb>,
  optionsOrConfig?: { dryRun?: boolean; config?: SimulationGrowthConfig } | SimulationGrowthConfig,
  maybeOptions?: { dryRun?: boolean }
) {
  assertAiGatewayKey()

  let config = DEFAULT_GROWTH_CONFIG
  let options: { dryRun?: boolean } = {}
  if (optionsOrConfig && 'maxSimulatedUsers' in optionsOrConfig) {
    config = optionsOrConfig as SimulationGrowthConfig
    options = maybeOptions || {}
  } else if (optionsOrConfig) {
    options = optionsOrConfig as { dryRun?: boolean }
    if ((optionsOrConfig as any).config) {
      config = (optionsOrConfig as any).config
    }
  }

  const simulatedMembers = await ensureMemberDrives(
    dbClient,
    await dbClient.select().from(profiles).where(eq(profiles.isSimulated, true)),
    options.dryRun
  )

  if (simulatedMembers.length === 0) {
    return { action: 'none', reason: 'No simulated members exist.' }
  }

  const memberById = new Map(simulatedMembers.map((m) => [m.id, m]))

  // Check recent topics
  const recentTopics = await dbClient
    .select()
    .from(forumTopics)
    .where(eq(forumTopics.isLocked, false))
    .orderBy(desc(forumTopics.createdAt))
    .limit(10)

  let existingPosts: Array<{
    id: string
    userId?: string | null
    parentId?: string | null
    authorName?: string | null
    content: string
    createdAt?: string | Date | null
    topicId?: string | null
    qualityScore?: number | null
    sunk?: boolean | null
  }> = []

  if (recentTopics.length > 0) {
    try {
      const topicIds = recentTopics.map((topic) => topic.id)
      const postsQuery = await dbClient
        .select({
          id: forumPosts.id,
          userId: forumPosts.userId,
          parentId: forumPosts.parentId,
          authorName: forumPosts.authorName,
          content: forumPosts.content,
          createdAt: forumPosts.createdAt,
          topicId: forumPosts.topicId,
          qualityScore: forumPosts.qualityScore,
          sunk: forumPosts.sunk,
        })
        .from(forumPosts)
        .where(
          topicIds.length === 1 ? eq(forumPosts.topicId, topicIds[0]) : inArray(forumPosts.topicId, topicIds)
        )
        .orderBy(desc(forumPosts.createdAt))
        .limit(80)
      if (Array.isArray(postsQuery)) {
        existingPosts = postsQuery
      }
    } catch {
      existingPosts = []
    }
  }

  const postsByTopic = new Map<string, ForumPostCandidate[]>()
  for (const topic of recentTopics) {
    postsByTopic.set(topic.id, [])
  }
  for (const post of existingPosts) {
    const candidate: ForumPostCandidate = {
      id: post.id,
      userId: post.userId,
      parentId: post.parentId,
      authorName: post.authorName,
      authorHandle: memberById.get(post.userId || '')?.handle || null,
      content: post.content,
      createdAt: post.createdAt,
      qualityScore: post.qualityScore,
      sunk: post.sunk,
    }
    if (post.topicId && postsByTopic.has(post.topicId)) {
      postsByTopic.get(post.topicId)!.push(candidate)
    } else if (recentTopics.length === 1) {
      postsByTopic.get(recentTopics[0].id)!.push(candidate)
    }
  }

  const decision = planForumAction({
    members: simulatedMembers.map(toPlannerMember),
    topics: recentTopics,
    postsByTopic,
  })

  if (decision.action === 'none') {
    return { action: 'none', reason: decision.reason }
  }

  if (decision.action === 'ignore') {
    return {
      action: 'ignore',
      reason: decision.reason || 'Planner chose ignore (lurker cadence).',
      authorHandle: memberById.get(decision.actorId)?.handle,
      dryRun: Boolean(options.dryRun),
    }
  }

  const plannedAuthor = memberById.get(decision.actorId) || simulatedMembers[0]
  const replyActions = new Set(['reply_supportive', 'reply_challenging', 'reply_cite_canon'])
  const shouldReply =
    Boolean(decision.topicId) &&
    recentTopics.length > 0 &&
    (replyActions.has(decision.action) || decision.isOpFollowUp)

  if (decision.action === 'upvote' && decision.topicId) {
    const voteTopic = recentTopics.find((topic) => topic.id === decision.topicId)
    const votePosts = (postsByTopic.get(decision.topicId) || []).map((post) => ({
      id: post.id,
      userId: post.userId,
      content: post.content,
      topicId: decision.topicId,
      qualityScore: post.qualityScore,
      sunk: post.sunk,
    }))
    const voteTarget = pickClusteredForumVote(
      toPlannerMember(plannedAuthor),
      voteTopic
        ? [{ id: voteTopic.id, userId: voteTopic.userId, content: voteTopic.content, title: voteTopic.title, repliesCount: voteTopic.repliesCount, qualityScore: voteTopic.qualityScore }]
        : [],
      votePosts,
      new Set()
    )
    if (voteTarget) {
      const targetAuthorId =
        voteTarget.type === 'topic'
          ? voteTopic?.userId
          : votePosts.find((post) => post.id === voteTarget.id)?.userId
      const targetAuthor = targetAuthorId ? memberById.get(targetAuthorId) : null
      const touched = touchPersona(plannedAuthor.simulatedPersona)
      plannedAuthor.simulatedPersona = touched
      await persistSimulatedPersona(dbClient, plannedAuthor.id, touched, options.dryRun)
      await applyPairwiseAffinity(
        dbClient,
        plannedAuthor,
        targetAuthor,
        AFFINITY_VOTE_DELTA,
        options.dryRun
      )

      if (!options.dryRun) {
        try {
          if (voteTarget.type === 'topic') {
            await dbClient.insert(forumVotes).values({ userId: plannedAuthor.id, topicId: voteTarget.id }).onConflictDoNothing()
            await dbClient
              .update(forumTopics)
              .set({ upvotes: sql`${forumTopics.upvotes} + 1` })
              .where(eq(forumTopics.id, voteTarget.id))
          } else {
            await dbClient.insert(forumVotes).values({ userId: plannedAuthor.id, postId: voteTarget.id }).onConflictDoNothing()
            await dbClient
              .update(forumPosts)
              .set({ upvotes: sql`${forumPosts.upvotes} + 1` })
              .where(eq(forumPosts.id, voteTarget.id))
          }
        } catch {
          // Safe skip on constraint clash
        }
      }

      return {
        action: 'upvote',
        topicId: decision.topicId,
        postId: voteTarget.type === 'post' ? voteTarget.id : undefined,
        authorHandle: plannedAuthor.handle,
        dryRun: Boolean(options.dryRun),
      }
    }
  }

  if (shouldReply) {
    const topic =
      recentTopics.find((row) => row.id === decision.topicId) || recentTopics[0]
    const postCandidates = postsByTopic.get(topic.id) || []
    const author = plannedAuthor
    const plannedStance: ForumReplyStance =
      decision.stance || (decision.isOpFollowUp ? 'op_follow_up' : 'supportive')

    // Determine target (top-level vs nested reply)
    const { parentId, targetPost, isOpFollowUp } = chooseForumReplyTarget(
      {
        id: topic.id,
        userId: topic.userId,
        authorName: topic.authorName,
        title: topic.title,
        content: topic.content,
      },
      postCandidates,
      author.id,
      {
        nestedChance: config.forumNestedReplyChance ?? DEFAULT_FORUM_NESTED_REPLY_CHANCE,
        maxDepth: SIMULATION_MAX_REPLY_DEPTH,
        affinityBias: affinityBiasForDrive(author.simulatedPersona?.drive),
        affinities: author.simulatedPersona?.affinities,
      }
    )
    const replyStance: ForumReplyStance = decision.isOpFollowUp || isOpFollowUp ? 'op_follow_up' : plannedStance

    // Check if we should quote a snippet from target
    const shouldQuote = Boolean(
      targetPost &&
      rollChance(config.forumQuoteChance ?? DEFAULT_FORUM_QUOTE_CHANCE)
    )
    let quoteSnippet: string | null = null
    let quoteBlock: string | null = null
    if (shouldQuote && targetPost) {
      quoteSnippet = extractQuoteSnippet(targetPost.content, 180)
      if (quoteSnippet) {
        quoteBlock = formatDiegeticQuoteBlock(
          targetPost.authorHandle,
          targetPost.authorName || 'Initiate',
          quoteSnippet
        )
      }
    }

    // Check if we should mention a member
    const shouldMention = rollChance(config.forumMentionChance ?? DEFAULT_FORUM_MENTION_CHANCE)
    let mentionCandidate: { userId: string; handle: string } | null = null
    if (shouldMention) {
      const participants = postCandidates
        .map((p) => ({ userId: p.userId || '', handle: p.authorHandle || null }))
        .filter((p) => p.userId && p.handle)
      if (topic.userId && memberById.get(topic.userId)?.handle) {
        participants.push({ userId: topic.userId, handle: memberById.get(topic.userId)!.handle })
      }
      mentionCandidate = pickMentionCandidate(
        author.id,
        participants,
        [],
        targetPost ? { userId: targetPost.userId, handle: targetPost.authorHandle } : null
      )
    }

    const pairMemory = targetPost?.userId
      ? selectPairMemory(postCandidates, author.id, targetPost.userId, 2)
      : []
    const relationshipHint = targetPost?.userId
      ? formatRelationshipHint(
          getAffinity(author.simulatedPersona, targetPost.userId),
          targetPost.authorHandle || memberById.get(targetPost.userId)?.handle
        )
      : null
    const canonCitation =
      replyStance === 'cite_canon'
        ? pickCanonCitation(
            CANONICAL_SCRIPTURES.map((row) => ({
              id: row.id,
              title: row.title,
              mandate: row.mandate,
              summary: row.summary,
            }))
          )
        : null

    const authorPublicName = resolveMemberPublicName({
      userId: author.id,
      handle: author.handle,
      larvaId: author.larvaId,
    })

    // Construct contextual prompt
    let contextStr = `Thread Title: "${topic.title}"\nOriginal Post: "${topic.content}"`
    if (isOpFollowUp && targetPost) {
      contextStr += `\n\nYou are the Original Poster (OP). You are following up on this comment by ${targetPost.authorHandle ? `@${targetPost.authorHandle}` : targetPost.authorName}:\n"${targetPost.content}"`
    } else if (targetPost) {
      contextStr += `\n\nYou are replying directly to this comment by ${targetPost.authorHandle ? `@${targetPost.authorHandle}` : targetPost.authorName}:\n"${targetPost.content}"`
    } else if (postCandidates.length > 0) {
      const recent = postCandidates.slice(0, 2).map((p) => `${p.authorName}: ${p.content}`).join('\n')
      contextStr += `\n\nRecent replies in thread:\n${recent}`
    }
    if (pairMemory.length > 0 && targetPost) {
      const memoryLines = pairMemory
        .map((post) => `${post.authorHandle || post.authorName}: ${post.content}`)
        .join('\n')
      contextStr += `\n\nRecent exchange with this member:\n${memoryLines}`
    }

    let directives = `Write a concise forum reply (2 to 4 sentences) to this thread. ${formatForumStanceDirective(replyStance)}`
    if (targetPost && replyStance !== 'op_follow_up') {
      directives += ` Engage directly with the specific point made in their comment.`
    }
    if (relationshipHint) {
      directives += ` ${relationshipHint}`
    }
    if (canonCitation) {
      directives += ` ${formatCanonCitationDirective(canonCitation)}`
    }
    if (quoteSnippet) {
      directives += ` Address this quoted statement: "${quoteSnippet}". Do not write blockquote lines yourself; the quote header is formatted automatically.`
    }
    if (mentionCandidate) {
      directives += ` You may naturally address or mention @${mentionCandidate.handle} in conversational flow.`
    }

    const prompt = formatForumReplyPrompt({
      authorPublicName,
      stage: author.stage,
      simulatedPersona: author.simulatedPersona,
      directives,
      contextStr,
    })

    const aiRes = await generateSimulationText({
      prompt,
      temperature: 0.75,
    })

    let replyContent = aiRes.text.trim().replace(/^["'`]|["'`]$/g, '')
    if (quoteBlock && !replyContent.startsWith('>')) {
      replyContent = `${quoteBlock}${replyContent}`
    }

    const guardrail = validateInputGuardrails(replyContent)
    if (!guardrail.allowed) {
      throw new Error(`[SimulationEngine] AI generated unsafe forum reply: ${guardrail.reason}`)
    }

    const parentAuthor = targetPost?.userId ? memberById.get(targetPost.userId) : null
    const affinityDelta = affinityDeltaForReply(
      replyStance,
      author.simulatedPersona?.drive,
      parentAuthor?.simulatedPersona?.drive
    )
    author.simulatedPersona = touchPersona(author.simulatedPersona)
    await persistSimulatedPersona(dbClient, author.id, author.simulatedPersona, options.dryRun)
    await applyPairwiseAffinity(
      dbClient,
      author,
      parentAuthor,
      affinityDelta,
      options.dryRun
    )

    if (!options.dryRun) {
      const [newPost] = await dbClient
        .insert(forumPosts)
        .values({
          topicId: topic.id,
          parentId: parentId ?? null,
          userId: author.id,
          authorName: authorPublicName,
          authorAvatar: '/images/stage1_larva.png',
          authorStage: author.stage,
          content: replyContent,
        })
        .returning()

      await dbClient
        .update(forumTopics)
        .set({
          repliesCount: sql`${forumTopics.repliesCount} + 1`,
          lastReplyAt: new Date(),
        })
        .where(eq(forumTopics.id, topic.id))

      // Lookup category slug for notifications
      let categorySlug: string | undefined
      let categoryName: string | undefined
      if (topic.categoryId) {
        try {
          const [cat] = await dbClient
            .select({ slug: forumCategories.slug, name: forumCategories.name })
            .from(forumCategories)
            .where(eq(forumCategories.id, topic.categoryId))
            .limit(1)
          categorySlug = cat?.slug
          categoryName = cat?.name
        } catch {
          // ignore
        }
      }

      // Record Activity Center notifications
      let mentionedUserIds: string[] = []
      try {
        mentionedUserIds = await recordForumMentions(dbClient, {
          actorUserId: author.id,
          actorPublicName: authorPublicName,
          content: replyContent,
          sourceType: 'post',
          sourceId: newPost.id,
          topicId: topic.id,
          topicSlug: topic.slug,
          categorySlug,
        })
      } catch (mErr) {
        console.warn('[SimulationEngine] recordForumMentions error:', mErr)
      }

      try {
        await recordForumReplyNotifications(dbClient, {
          actorUserId: author.id,
          actorPublicName: authorPublicName,
          replyPostId: newPost.id,
          topicId: topic.id,
          topicAuthorUserId: topic.userId,
          parentAuthorUserId: targetPost?.userId ?? null,
          skipUserIds: mentionedUserIds,
          topicSlug: topic.slug,
          categorySlug,
        })
      } catch (rErr) {
        console.warn('[SimulationEngine] recordForumReplyNotifications error:', rErr)
      }

      try {
        await recordForumReplyPostedEvent(dbClient, author.id, {
          postId: newPost.id,
          topicId: topic.id,
          topicTitle: topic.title,
          topicSlug: topic.slug,
          categorySlug: categorySlug || 'general-discussion',
          categoryName: categoryName || 'Community',
          mentionedHandles: extractMentionHandles(replyContent),
        })
      } catch (aErr) {
        console.warn('[SimulationEngine] recordForumReplyPostedEvent error:', aErr)
      }

      return {
        action: 'reply',
        topicId: topic.id,
        topicTitle: topic.title,
        postId: newPost.id,
        parentId: newPost.parentId,
        isOpFollowUp,
        quoted: Boolean(quoteBlock),
        mentioned: Boolean(mentionCandidate),
        authorName: authorPublicName,
        stance: replyStance,
        content: replyContent,
        dryRun: false,
      }
    }

    return {
      action: 'reply',
      topicId: topic.id,
      topicTitle: topic.title,
      parentId: parentId ?? null,
      isOpFollowUp,
      quoted: Boolean(quoteBlock),
      mentioned: Boolean(mentionCandidate),
      authorHandle: author.handle,
      authorName: authorPublicName,
      stance: replyStance,
      content: replyContent,
      dryRun: true,
    }
  }

  // Otherwise, create a new discussion topic
  const categories = await dbClient.select().from(forumCategories).limit(6)
  if (categories.length === 0) {
    return { action: 'none', reason: 'No forum categories exist in database.' }
  }

  const openCategories = categories.filter((c) => c.slug !== 'rules-announcements')
  const targetCategory =
    openCategories.length > 0
      ? openCategories[Math.floor(Math.random() * openCategories.length)]
      : categories[0]

  const author = plannedAuthor || simulatedMembers[Math.floor(Math.random() * simulatedMembers.length)]
  const authorName = resolveMemberPublicName({
    userId: author.id,
    handle: author.handle,
    larvaId: author.larvaId,
  })

  const prompt = formatForumTopicPrompt({
    authorPublicName: authorName,
    stage: author.stage,
    simulatedPersona: author.simulatedPersona,
    categoryName: targetCategory.name,
    categoryDescription: targetCategory.description,
    drive: author.simulatedPersona?.drive,
  })

  const aiRes = await generateSimulationText({
    prompt,
    temperature: 0.8,
  })

  const raw = aiRes.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  let topicData: { title: string; content: string }
  try {
    topicData = JSON.parse(raw)
  } catch {
    throw new Error(
      `[SimulationEngine] Failed to parse forum topic JSON from AI Gateway: ${raw.slice(0, 100)}`
    )
  }

  const guardrailTitle = validateInputGuardrails(topicData.title)
  const guardrailContent = validateInputGuardrails(topicData.content)
  if (!guardrailTitle.allowed || !guardrailContent.allowed) {
    throw new Error('[SimulationEngine] AI generated unsafe forum topic content.')
  }

  author.simulatedPersona = touchPersona(author.simulatedPersona)
  await persistSimulatedPersona(dbClient, author.id, author.simulatedPersona, options.dryRun)

  if (!options.dryRun) {
    const slug = slugifyForumTitle(topicData.title)

    const [newTopic] = await dbClient
      .insert(forumTopics)
      .values({
        categoryId: targetCategory.id,
        userId: author.id,
        authorName,
        authorAvatar: '/images/stage1_larva.png',
        authorStage: author.stage,
        title: topicData.title.trim().slice(0, 120),
        slug,
        content: topicData.content.trim(),
        lastReplyAt: new Date(),
      })
      .returning()

    try {
      await recordForumMentions(dbClient, {
        actorUserId: author.id,
        actorPublicName: authorName,
        content: newTopic.content,
        sourceType: 'topic',
        sourceId: newTopic.id,
        topicId: newTopic.id,
        topicSlug: newTopic.slug,
        categorySlug: targetCategory.slug,
      })
    } catch (mErr) {
      console.warn('[SimulationEngine] topic recordForumMentions error:', mErr)
    }

    try {
      await recordForumTopicOpenedEvent(dbClient, author.id, {
        id: newTopic.id,
        title: newTopic.title,
        slug: newTopic.slug,
        categorySlug: targetCategory.slug,
        categoryName: targetCategory.name,
        mentionedHandles: extractMentionHandles(newTopic.content),
      })
    } catch (aErr) {
      console.warn('[SimulationEngine] recordForumTopicOpenedEvent error:', aErr)
    }

    return {
      action: 'topic',
      topicId: newTopic.id,
      categorySlug: targetCategory.slug,
      title: newTopic.title,
      authorName,
      dryRun: false,
    }
  }

  return {
    action: 'topic',
    categorySlug: targetCategory.slug,
    title: topicData.title,
    authorHandle: author.handle,
    authorName,
    dryRun: true,
  }
}

/**
 * Simulates community upvotes on recent forum posts and topics.
 */
export async function simulateForumReactions(
  dbClient: ReturnType<typeof getDb>,
  options: { dryRun?: boolean; voteCount?: number; config?: SimulationGrowthConfig } = {}
) {
  const config = options.config || DEFAULT_GROWTH_CONFIG
  const voteTargetCount = options.voteCount ?? config.forumVoteCount ?? 3

  const simulatedMembers = await ensureMemberDrives(
    dbClient,
    await dbClient
      .select({
        id: profiles.id,
        handle: profiles.handle,
        simulatedPersona: profiles.simulatedPersona,
      })
      .from(profiles)
      .where(eq(profiles.isSimulated, true)),
    options.dryRun
  )

  if (simulatedMembers.length === 0) {
    return { votesCast: 0, actions: [] }
  }

  const memberById = new Map(simulatedMembers.map((member) => [member.id, member]))

  // Fetch recent posts first (keeps backward compatibility with test mocks)
  const recentPosts = await dbClient
    .select({
      id: forumPosts.id,
      userId: forumPosts.userId,
      topicId: forumPosts.topicId,
      content: forumPosts.content,
      qualityScore: forumPosts.qualityScore,
      sunk: forumPosts.sunk,
    })
    .from(forumPosts)
    .orderBy(desc(forumPosts.createdAt))
    .limit(15)

  // Fetch recent topics
  let recentTopics: Array<{
    id: string
    userId?: string | null
    title?: string | null
    content?: string | null
    repliesCount?: number | null
    qualityScore?: number | null
  }> = []
  try {
    const fetchedTopics = await dbClient
      .select({
        id: forumTopics.id,
        userId: forumTopics.userId,
        title: forumTopics.title,
        content: forumTopics.content,
        repliesCount: forumTopics.repliesCount,
        qualityScore: forumTopics.qualityScore,
      })
      .from(forumTopics)
      .orderBy(desc(forumTopics.createdAt))
      .limit(10)
    if (Array.isArray(fetchedTopics)) {
      recentTopics = fetchedTopics
    }
  } catch {
    recentTopics = []
  }

  if ((!recentPosts || recentPosts.length === 0) && recentTopics.length === 0) {
    return { votesCast: 0, actions: [] }
  }

  // Fetch existing votes for simulated members if available
  const existingVoteKeys = new Set<string>()
  try {
    const simIds = simulatedMembers.map((m) => m.id)
    const existingRows = await dbClient
      .select({ userId: forumVotes.userId, topicId: forumVotes.topicId, postId: forumVotes.postId })
      .from(forumVotes)
      .where(inArray(forumVotes.userId, simIds))

    if (Array.isArray(existingRows)) {
      for (const row of existingRows) {
        if (row.topicId) existingVoteKeys.add(`${row.userId}:topic:${row.topicId}`)
        if (row.postId) existingVoteKeys.add(`${row.userId}:post:${row.postId}`)
      }
    }
  } catch {
    // Ignore in tests with minimal mocks
  }

  const actions: Array<{ voterId: string; postId?: string; topicId?: string; targetType?: 'post' | 'topic' }> = []
  const postsForFeatures = Array.isArray(recentPosts) ? recentPosts : []
  const postsByTopic = new Map<string, ForumPostCandidate[]>()
  for (const post of postsForFeatures) {
    if (!post.topicId) continue
    const list = postsByTopic.get(post.topicId) || []
    list.push({ id: post.id, userId: post.userId, content: post.content || '', createdAt: null })
    postsByTopic.set(post.topicId, list)
  }
  const driveById = new Map(
    simulatedMembers.map((member) => [member.id, member.simulatedPersona?.drive])
  )
  const topicFeatures = new Map(
    recentTopics.map((topic) => [
      topic.id,
      computeTopicFeatures(topic, postsByTopic.get(topic.id) || [], driveById),
    ])
  )

  for (let i = 0; i < voteTargetCount; i++) {
    const voter = simulatedMembers[Math.floor(Math.random() * simulatedMembers.length)]

    // Build voter-specific existing keys
    const voterExistingKeys = new Set<string>()
    for (const key of existingVoteKeys) {
      if (key.startsWith(`${voter.id}:`)) {
        voterExistingKeys.add(key.slice(`${voter.id}:`.length))
      }
    }

    const voteTarget = pickClusteredForumVote(
      toPlannerMember(voter),
      recentTopics,
      postsForFeatures,
      voterExistingKeys,
      {
        topicRatio: config.forumTopicVoteRatio ?? DEFAULT_FORUM_TOPIC_VOTE_RATIO,
        topicFeatures,
      }
    )

    if (!voteTarget) continue

    if (voteTarget.type === 'topic') {
      if (!options.dryRun) {
        try {
          const [inserted] = await dbClient
            .insert(forumVotes)
            .values({
              userId: voter.id,
              topicId: voteTarget.id,
            })
            .onConflictDoNothing()
            .returning()

          if (inserted) {
            await dbClient
              .update(forumTopics)
              .set({ upvotes: sql`${forumTopics.upvotes} + 1` })
              .where(eq(forumTopics.id, voteTarget.id))

            actions.push({ voterId: voter.id, topicId: voteTarget.id, targetType: 'topic' })
            existingVoteKeys.add(`${voter.id}:topic:${voteTarget.id}`)
          }
        } catch {
          // Safe skip on constraint clash
        }
      } else {
        actions.push({ voterId: voter.id, topicId: voteTarget.id, targetType: 'topic' })
        existingVoteKeys.add(`${voter.id}:topic:${voteTarget.id}`)
      }
    } else {
      if (!options.dryRun) {
        try {
          const [inserted] = await dbClient
            .insert(forumVotes)
            .values({
              userId: voter.id,
              postId: voteTarget.id,
            })
            .onConflictDoNothing()
            .returning()

          if (inserted) {
            await dbClient
              .update(forumPosts)
              .set({ upvotes: sql`${forumPosts.upvotes} + 1` })
              .where(eq(forumPosts.id, voteTarget.id))

            actions.push({ voterId: voter.id, postId: voteTarget.id })
            existingVoteKeys.add(`${voter.id}:post:${voteTarget.id}`)
          }
        } catch {
          // Safe skip on constraint clash
        }
      } else {
        actions.push({ voterId: voter.id, postId: voteTarget.id })
        existingVoteKeys.add(`${voter.id}:post:${voteTarget.id}`)
      }
    }

    const lastAction = actions[actions.length - 1]
    if (lastAction && (lastAction.postId === voteTarget.id || lastAction.topicId === voteTarget.id)) {
      const targetUserId =
        voteTarget.type === 'topic'
          ? recentTopics.find((topic) => topic.id === voteTarget.id)?.userId
          : postsForFeatures.find((post) => post.id === voteTarget.id)?.userId
      const other = targetUserId ? memberById.get(targetUserId) : null
      await applyPairwiseAffinity(dbClient, voter, other, AFFINITY_VOTE_DELTA, options.dryRun)
    }
  }

  return {
    votesCast: actions.length,
    actions,
    dryRun: Boolean(options.dryRun),
  }
}

/**
 * Mild chance a simulated member revises their recent forum reply with an update note.
 */
export async function simulateForumRevision(
  dbClient: ReturnType<typeof getDb>,
  config = DEFAULT_GROWTH_CONFIG,
  options: { force?: boolean; dryRun?: boolean } = {}
) {
  if (!options.force && !rollChance(config.forumEditChance ?? DEFAULT_FORUM_EDIT_CHANCE)) {
    return { revised: false, reason: 'Revision roll skipped.' }
  }

  const simulatedMembers = await listSimulatedMembers(dbClient)
  if (simulatedMembers.length === 0) {
    return { revised: false, reason: 'No simulated members exist.' }
  }

  const simIds = simulatedMembers.map((m) => m.id)

  let recentPosts: Array<{
    id: string
    userId: string | null
    authorName: string
    content: string
    updatedAt?: Date | null
  }> = []

  try {
    const fetched = await dbClient
      .select({
        id: forumPosts.id,
        userId: forumPosts.userId,
        authorName: forumPosts.authorName,
        content: forumPosts.content,
        updatedAt: forumPosts.updatedAt,
      })
      .from(forumPosts)
      .where(inArray(forumPosts.userId, simIds))
      .orderBy(desc(forumPosts.createdAt))
      .limit(8)
    if (Array.isArray(fetched)) {
      recentPosts = fetched
    }
  } catch {
    recentPosts = []
  }

  const eligiblePosts = recentPosts.filter(
    (p) => p.content && !p.content.includes('Edit:') && !p.content.includes('Update:')
  )

  if (eligiblePosts.length === 0) {
    return { revised: false, reason: 'No eligible posts for revision.' }
  }

  const target = eligiblePosts[Math.floor(Math.random() * eligiblePosts.length)]
  const revisionNotes = [
    'Edit: Recalibrated telemetry logs — the shell density gain held steady at +14% after the second cold window.',
    'Edit: Clarification: make sure the morning liturgy is logged before initiation; otherwise the streak bonus is forfeited.',
    'Edit: Confirmed with the elders — carapace thickness rating increases linearly with daily discipline.',
    'Edit: Update: The soft-shed window stabilized at 48 hours after adhering strictly to the evening salt bath.',
  ]
  const note = revisionNotes[Math.floor(Math.random() * revisionNotes.length)]
  const updatedContent = `${target.content.trim()}\n\n${note}`

  if (!options.dryRun) {
    await dbClient
      .update(forumPosts)
      .set({
        content: updatedContent,
        updatedAt: new Date(),
      })
      .where(eq(forumPosts.id, target.id))
  }

  return {
    revised: true,
    dryRun: Boolean(options.dryRun),
    postId: target.id,
    authorName: target.authorName,
    note,
  }
}

/**
 * Mild chance a simulated member gains a unique personality trait.
 */
export async function mutateSimulatedPersona(
  dbClient: ReturnType<typeof getDb>,
  config = DEFAULT_GROWTH_CONFIG,
  options: { force?: boolean; dryRun?: boolean } = {}
) {
  if (!options.force && !rollChance(config.mutationChance)) {
    return { mutated: false, reason: 'Mutation roll skipped.' }
  }

  const members = await listSimulatedMembers(dbClient)
  const eligible = members.filter(
    (member) => (member.simulatedPersona?.traits?.length || 0) < config.maxTraitsPerMember
  )
  if (eligible.length === 0) {
    return { mutated: false, reason: 'No simulated members have room for another trait.' }
  }

  const target = eligible[Math.floor(Math.random() * eligible.length)]
  const trait = pickNewTrait((target.simulatedPersona?.traits || []).map((row) => row.id))
  if (!trait) {
    return { mutated: false, reason: 'Trait catalog exhausted for the chosen member.' }
  }

  const updatedPersona = applyTraitMutation(target.simulatedPersona, trait)

  if (!options.dryRun) {
    await dbClient
      .update(profiles)
      .set({ simulatedPersona: updatedPersona, updatedAt: new Date() })
      .where(eq(profiles.id, target.id))
  }

  return {
    mutated: true,
    dryRun: Boolean(options.dryRun),
    userId: target.id,
    handle: target.handle,
    trait,
  }
}

/**
 * Mild chance two simulated members become platform friends.
 * Sim-to-sim only — never sends requests to real members.
 */
export async function simulateConnections(
  dbClient: ReturnType<typeof getDb>,
  config = DEFAULT_GROWTH_CONFIG,
  options: { force?: boolean; dryRun?: boolean } = {}
) {
  if (!options.force && !rollChance(config.connectionChance)) {
    return { connected: false, reason: 'Connection roll skipped.' }
  }

  const members = await listSimulatedMembers(dbClient)
  if (members.length < 2) {
    return { connected: false, reason: 'Need at least two simulated members to connect.' }
  }

  const simIds = members.map((member) => member.id)
  const existingRows = await dbClient
    .select({ userAId: friendships.userAId, userBId: friendships.userBId })
    .from(friendships)
    .where(or(inArray(friendships.userAId, simIds), inArray(friendships.userBId, simIds)))

  const existingKeys = existingRows
    .filter((row) => simIds.includes(row.userAId) && simIds.includes(row.userBId))
    .map((row) => friendshipPairKey(row.userAId, row.userBId))

  const pair = pickUnconnectedPair(members, existingKeys)
  if (!pair) {
    return { connected: false, reason: 'Simulated members are already fully connected.' }
  }

  const [left, right] = pair
  if (!options.dryRun) {
    await ensureFriendship(dbClient, left.id, right.id)
    try {
      await recordConnectionAcceptedEvents(
        dbClient,
        { id: left.id, handle: left.handle, larvaId: left.larvaId },
        { id: right.id, handle: right.handle, larvaId: right.larvaId }
      )
    } catch (err) {
      console.warn('[SimulationEngine] recordConnectionAcceptedEvents error:', err)
    }
  }

  return {
    connected: true,
    dryRun: Boolean(options.dryRun),
    userAId: left.id,
    userBId: right.id,
    handles: [left.handle, right.handle],
  }
}

/**
 * Mild chance two already-connected simulated members deepen into a typed bond.
 */
export async function simulateRelationships(
  dbClient: ReturnType<typeof getDb>,
  config = DEFAULT_GROWTH_CONFIG,
  options: { force?: boolean; dryRun?: boolean } = {}
) {
  if (!options.force && !rollChance(config.bondChance)) {
    return { bonded: false, reason: 'Relationship roll skipped.' }
  }

  const members = await listSimulatedMembers(dbClient)
  if (members.length < 2) {
    return { bonded: false, reason: 'Need at least two simulated members to form a bond.' }
  }

  const memberById = new Map(members.map((member) => [member.id, member]))
  const simIds = members.map((member) => member.id)

  const friendRows = await dbClient
    .select({ userAId: friendships.userAId, userBId: friendships.userBId })
    .from(friendships)
    .where(or(inArray(friendships.userAId, simIds), inArray(friendships.userBId, simIds)))

  const friendPairs = friendRows.filter(
    (row) => memberById.has(row.userAId) && memberById.has(row.userBId)
  )
  if (friendPairs.length === 0) {
    return { bonded: false, reason: 'No simulated friendships exist to deepen.' }
  }

  const bondRows = await dbClient
    .select({
      fromUserId: memberBonds.fromUserId,
      toUserId: memberBonds.toUserId,
      kind: memberBonds.kind,
    })
    .from(memberBonds)
    .where(or(inArray(memberBonds.fromUserId, simIds), inArray(memberBonds.toUserId, simIds)))

  const bondCounts = new Map<string, number>()
  const existingBondKeys = new Set<string>()
  for (const row of bondRows) {
    existingBondKeys.add(bondPairKey(row.kind, row.fromUserId, row.toUserId))
    bondCounts.set(row.fromUserId, (bondCounts.get(row.fromUserId) || 0) + 1)
    bondCounts.set(row.toUserId, (bondCounts.get(row.toUserId) || 0) + 1)
  }

  const candidates = friendPairs.filter((row) => {
    const left = memberById.get(row.userAId)
    const right = memberById.get(row.userBId)
    if (!left || !right) return false
    if ((bondCounts.get(left.id) || 0) >= config.maxBondsPerMember) return false
    if ((bondCounts.get(right.id) || 0) >= config.maxBondsPerMember) return false
    const planned = chooseBondForPair(left, right)
    return !existingBondKeys.has(bondPairKey(planned.kind, planned.from.id, planned.to.id))
  })

  if (candidates.length === 0) {
    return { bonded: false, reason: 'No friendship is eligible for a new bond.' }
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)]
  const left = memberById.get(chosen.userAId)!
  const right = memberById.get(chosen.userBId)!
  const planned = chooseBondForPair(left, right)

  if (!options.dryRun) {
    await ensureBond(dbClient, planned.kind, planned.from.id, planned.to.id)
  }

  return {
    bonded: true,
    dryRun: Boolean(options.dryRun),
    kind: planned.kind,
    fromUserId: planned.from.id,
    toUserId: planned.to.id,
    handles: [planned.from.handle, planned.to.handle],
  }
}

function shouldRunPhase(
  phase: 'spawn' | 'routines' | 'forum' | 'votes' | 'mutations' | 'social' | 'review',
  options: {
    spawnOnly?: boolean
    routinesOnly?: boolean
    forumOnly?: boolean
    votesOnly?: boolean
    mutationsOnly?: boolean
    socialOnly?: boolean
    reviewOnly?: boolean
  }
) {
  const anyOnly = Boolean(
    options.spawnOnly ||
      options.routinesOnly ||
      options.forumOnly ||
      options.votesOnly ||
      options.mutationsOnly ||
      options.socialOnly ||
      options.reviewOnly
  )
  if (!anyOnly) return true
  if (phase === 'review') return Boolean(options.reviewOnly)
  if (phase === 'spawn') return Boolean(options.spawnOnly)
  if (phase === 'routines') return Boolean(options.routinesOnly)
  if (phase === 'forum') return Boolean(options.forumOnly)
  if (phase === 'votes') return Boolean(options.votesOnly)
  if (phase === 'mutations') return Boolean(options.mutationsOnly)
  return Boolean(options.socialOnly)
}

/**
 * Primary simulation orchestrator. Runs every 12 hours via GitHub Actions.
 */
export async function runSimulationCycle(options: {
  dryRun?: boolean
  forceSpawn?: boolean
  spawnOnly?: boolean
  routinesOnly?: boolean
  forumOnly?: boolean
  votesOnly?: boolean
  mutationsOnly?: boolean
  socialOnly?: boolean
  reviewOnly?: boolean
} = {}) {
  if (process.env.SIMULATION_ENABLED === 'false') {
    console.log('[SimulationCycle] ⏸ Simulation cycle skipped: SIMULATION_ENABLED is explicitly set to false.')
    return { skipped: true, reason: 'SIMULATION_ENABLED is false' }
  }

  // Fail fast immediately if AI Gateway key is missing
  assertAiGatewayKey()

  console.log('[SimulationCycle] Starting 12-hour activity simulation tick...')
  if (options.dryRun) {
    console.log('[SimulationCycle] Running in DRY-RUN mode (no database writes).')
  }

  const dbClient = getDb()
  const results: Record<string, unknown> = {}

  console.log('[SimulationCycle] Backfilling missing simulated drives...')
  results.driveBackfill = await backfillSimulatedDrives(dbClient, { dryRun: options.dryRun })

  // 1. Spawner
  if (shouldRunPhase('spawn', options)) {
    console.log('[SimulationCycle] Checking acolyte spawn conditions...')
    const spawnRes = await spawnSimulatedUser(dbClient, DEFAULT_GROWTH_CONFIG, {
      force: options.forceSpawn,
      dryRun: options.dryRun,
    })
    results.spawn = spawnRes
    if (spawnRes.spawned) {
      console.log(
        `[SimulationCycle] ✓ Spawned new acolyte: ${spawnRes.handle || spawnRes.profile?.handle} (Stage ${spawnRes.stage || spawnRes.profile?.stage})${spawnRes.joinSource ? ` via ${spawnRes.joinSource}` : ''}`
      )
    } else {
      console.log(`[SimulationCycle] - Spawner skipped: ${spawnRes.reason}`)
    }
  }

  // 2. Routines
  if (shouldRunPhase('routines', options)) {
    console.log('[SimulationCycle] Simulating daily routine alignment completions...')
    const routineRes = await simulateDailyRoutines(dbClient, DEFAULT_GROWTH_CONFIG, {
      dryRun: options.dryRun,
    })
    results.routines = routineRes
    console.log(`[SimulationCycle] ✓ Completed ${routineRes.completed} daily alignment liturgies across ${routineRes.actions.length} members.`)
  }

  // 3. Forum
  if (shouldRunPhase('forum', options)) {
    console.log('[SimulationCycle] Simulating forum discussions, replies, and threads...')
    const forumActions: any[] = []
    const actionCount = DEFAULT_GROWTH_CONFIG.forumActionsPerCycle || 2
    for (let i = 0; i < actionCount; i++) {
      const forumRes = await simulateForumActivity(dbClient, DEFAULT_GROWTH_CONFIG, { dryRun: options.dryRun })
      forumActions.push(forumRes)
      if (forumRes.action === 'reply') {
        console.log(
          `[SimulationCycle] ✓ Generated forum reply by ${forumRes.authorName || forumRes.authorHandle} on topic "${forumRes.topicTitle}"${forumRes.parentId ? ` (nested reply)` : ''}${forumRes.quoted ? ` (quoted)` : ''}${forumRes.isOpFollowUp ? ` (OP follow-up)` : ''}${forumRes.stance ? ` [${forumRes.stance}]` : ''}`
        )
      } else if (forumRes.action === 'topic') {
        console.log(`[SimulationCycle] ✓ Created new forum topic "${forumRes.title}" by ${forumRes.authorName || forumRes.authorHandle}`)
      } else if (forumRes.action === 'upvote') {
        console.log(`[SimulationCycle] ✓ Planner upvote by ${forumRes.authorHandle || 'member'} on ${forumRes.postId || forumRes.topicId}`)
      } else {
        console.log(`[SimulationCycle] - Forum action skipped: ${forumRes.reason}`)
      }
    }
    results.forum = forumActions.length === 1 ? forumActions[0] : forumActions

    // Revision check
    const revisionRes = await simulateForumRevision(dbClient, DEFAULT_GROWTH_CONFIG, { dryRun: options.dryRun })
    results.revision = revisionRes
    if (revisionRes.revised) {
      console.log(`[SimulationCycle] ✓ Revised post ${revisionRes.postId} by ${revisionRes.authorName}`)
    }
  }

  // 4. Votes
  if (shouldRunPhase('votes', options)) {
    console.log('[SimulationCycle] Simulating community upvotes on topics and replies...')
    const voteRes = await simulateForumReactions(dbClient, {
      dryRun: options.dryRun,
      voteCount: DEFAULT_GROWTH_CONFIG.forumVoteCount,
      config: DEFAULT_GROWTH_CONFIG,
    })
    results.votes = voteRes
    console.log(`[SimulationCycle] ✓ Cast ${voteRes.votesCast} community upvotes across topics and replies.`)
  }

  // 5. Personality mutations
  if (shouldRunPhase('mutations', options)) {
    console.log('[SimulationCycle] Checking for mild persona mutations...')
    const mutationRes = await mutateSimulatedPersona(dbClient, DEFAULT_GROWTH_CONFIG, {
      dryRun: options.dryRun,
    })
    results.mutation = mutationRes
    if (mutationRes.mutated) {
      console.log(
        `[SimulationCycle] ✓ ${mutationRes.handle || mutationRes.userId} gained trait "${mutationRes.trait?.label}"`
      )
    } else {
      console.log(`[SimulationCycle] - Mutation skipped: ${mutationRes.reason}`)
    }
  }

  // 6. Connections + typed relationships
  if (shouldRunPhase('social', options)) {
    console.log('[SimulationCycle] Simulating member connections and bonds...')
    const connectionRes = await simulateConnections(dbClient, DEFAULT_GROWTH_CONFIG, {
      dryRun: options.dryRun,
    })
    results.connection = connectionRes
    if (connectionRes.connected) {
      console.log(
        `[SimulationCycle] ✓ Connected ${connectionRes.handles?.[0] || connectionRes.userAId} with ${connectionRes.handles?.[1] || connectionRes.userBId}`
      )
    } else {
      console.log(`[SimulationCycle] - Connection skipped: ${connectionRes.reason}`)
    }

    const bondRes = await simulateRelationships(dbClient, DEFAULT_GROWTH_CONFIG, {
      dryRun: options.dryRun,
    })
    results.relationship = bondRes
    if (bondRes.bonded) {
      console.log(
        `[SimulationCycle] ✓ Formed ${bondRes.kind} bond between ${bondRes.handles?.[0] || bondRes.fromUserId} and ${bondRes.handles?.[1] || bondRes.toUserId}`
      )
    } else {
      console.log(`[SimulationCycle] - Relationship skipped: ${bondRes.reason}`)
    }
  }

  // 7. Member post review: scores real members' new posts and adjusts Standing.
  if (shouldRunPhase('review', options)) {
    console.log('[SimulationCycle] Reviewing new posts from members...')
    try {
      const reviewRes = await reviewMemberPosts(dbClient, { dryRun: options.dryRun })
      results.review = reviewRes
      for (const item of reviewRes.reviewed) {
        console.log(
          `[SimulationCycle]   ${item.kind} ${item.id}: ${item.verdict} (score ${item.qualityScore ?? 'n/a'}, Standing ${item.standingDelta >= 0 ? '+' : ''}${item.standingDelta}${item.sunk ? ', sunk' : ''})`
        )
      }
      console.log(
        `[SimulationCycle] ✓ Reviewed ${reviewRes.reviewed.length} member posts, ${reviewRes.deferred} deferred, ${reviewRes.standingChanges.length} Standing changes.`
      )
    } catch (err) {
      // Review must never sink the rest of the tick.
      console.warn('[SimulationCycle] - Member review failed:', err)
      results.review = { error: err instanceof Error ? err.message : String(err) }
    }
  }

  console.log('[SimulationCycle] ✓ Simulation tick completed successfully!')
  return results
}

export interface SimulationPlanSpawnTask {
  id: string
  kind: 'spawn_persona'
  stage: number
  origin: {
    source: MemberJoinSource
    needsSponsor: boolean
    sponsorId: string | null
    sponsorHandle: string | null
  }
  prompt: string
  outputSchema: {
    handle: string
    archetype: string
    tone: string
    bio: string
  }
  generated?: {
    handle: string
    archetype: string
    tone: string
    bio: string
  } | string | null
}

export interface SimulationPlanForumReplyTask {
  id: string
  kind: 'forum_reply'
  topicId: string
  topicTitle: string
  targetPostId?: string | null
  parentId?: string | null
  isOpFollowUp?: boolean
  quoteBlock?: string | null
  authorId: string
  authorName: string
  authorStage: number
  parentAuthorId?: string | null
  replyStance: ForumReplyStance
  affinityDelta: number
  prompt: string
  outputSchema: {
    content: string
  }
  generated?: {
    content: string
  } | string | null
}

export interface SimulationPlanForumTopicTask {
  id: string
  kind: 'forum_topic'
  category: {
    id: string
    slug: string
    name: string
  }
  authorId: string
  authorName: string
  authorStage: number
  prompt: string
  outputSchema: {
    title: string
    content: string
  }
  generated?: {
    title: string
    content: string
  } | string | null
}

export type SimulationPlanTask =
  | SimulationPlanSpawnTask
  | SimulationPlanForumReplyTask
  | SimulationPlanForumTopicTask

export interface SimulationPlan {
  version: 1
  createdAt: string
  options: {
    dryRun?: boolean
    forceSpawn?: boolean
    spawnOnly?: boolean
    routinesOnly?: boolean
    forumOnly?: boolean
    votesOnly?: boolean
    mutationsOnly?: boolean
    socialOnly?: boolean
    reviewOnly?: boolean
  }
  tasks: SimulationPlanTask[]
  meta: {
    simulatedMemberCount: number
    tasksCount: number
  }
}

export interface PrepareSimulationPlanOptions {
  dryRun?: boolean
  forceSpawn?: boolean
  spawnOnly?: boolean
  routinesOnly?: boolean
  forumOnly?: boolean
  votesOnly?: boolean
  mutationsOnly?: boolean
  socialOnly?: boolean
  reviewOnly?: boolean
  config?: SimulationGrowthConfig
  outPath?: string
  dbClient?: DbClient
}

/**
 * Deterministically prepares the 12-hour simulation cycle plan and extracts all
 * text generation prompts (for acolyte spawning and forum topics/replies) without calling an LLM.
 */
export async function prepareSimulationPlan(
  options: PrepareSimulationPlanOptions = {}
): Promise<SimulationPlan> {
  const dbClient = options.dbClient || getDb()
  const config = options.config || DEFAULT_GROWTH_CONFIG

  const existingMembers = await ensureMemberDrives(
    dbClient,
    await listSimulatedMembers(dbClient),
    options.dryRun
  )
  const memberById = new Map(existingMembers.map((m) => [m.id, m]))

  const tasks: SimulationPlanTask[] = []

  // 1. Spawner check
  if (shouldRunPhase('spawn', options)) {
    const currentCount = existingMembers.length
    const spawnProb = getTieredSpawnProbability(currentCount, config.maxSimulatedUsers)
    if (options.forceSpawn || Math.random() <= spawnProb) {
      const stage = sampleStage(config.stageWeights)
      const origin = sampleJoinOrigin(existingMembers.length, config.joinSourceWeights)
      const sponsor = origin.needsSponsor ? pickWeightedSponsor(existingMembers) : null
      const joinSource: MemberJoinSource = sponsor ? origin.source : 'organic'
      const prompt = formatSpawnPersonaPrompt(stage)

      tasks.push({
        id: 'spawn-acolyte',
        kind: 'spawn_persona',
        stage,
        origin: {
          source: joinSource,
          needsSponsor: origin.needsSponsor,
          sponsorId: sponsor?.id ?? null,
          sponsorHandle: sponsor ? publicNameFor(sponsor) : null,
        },
        prompt,
        outputSchema: {
          handle: 'string (1-2 words, optionally numbers/underscore, e.g. ChitinForge_42. No spaces)',
          archetype: 'string (2-4 words, e.g. Deep-Sea Biohacker)',
          tone: 'string (e.g. Analytical, concise, metric-focused)',
          bio: 'string (1-2 sentences in-character summary adhering to Moltology lore)',
        },
        generated: null,
      })
    }
  }

  // 2. Forum discussion check
  if (shouldRunPhase('forum', options) && existingMembers.length > 0) {
    const actionCount = config.forumActionsPerCycle || 2
    const categories = await dbClient
      .select({
        id: forumCategories.id,
        slug: forumCategories.slug,
        name: forumCategories.name,
        description: forumCategories.description,
      })
      .from(forumCategories)

    const recentTopics = await dbClient
      .select({
        id: forumTopics.id,
        userId: forumTopics.userId,
        title: forumTopics.title,
        content: forumTopics.content,
        repliesCount: forumTopics.repliesCount,
      })
      .from(forumTopics)
      .where(eq(forumTopics.isLocked, false))
      .orderBy(desc(forumTopics.createdAt))
      .limit(10)

    let existingPosts: Array<{
      id: string
      userId: string | null
      parentId: string | null
      authorName: string | null
      content: string
      createdAt: string | Date | null
      topicId: string | null
    }> = []

    if (recentTopics.length > 0) {
      try {
        const topicIds = recentTopics.map((topic) => topic.id)
        const postsQuery = await dbClient
          .select({
            id: forumPosts.id,
            userId: forumPosts.userId,
            parentId: forumPosts.parentId,
            authorName: forumPosts.authorName,
            content: forumPosts.content,
            createdAt: forumPosts.createdAt,
            topicId: forumPosts.topicId,
          })
          .from(forumPosts)
          .where(topicIds.length === 1 ? eq(forumPosts.topicId, topicIds[0]) : inArray(forumPosts.topicId, topicIds))
          .orderBy(desc(forumPosts.createdAt))
          .limit(80)
        if (Array.isArray(postsQuery)) {
          existingPosts = postsQuery
        }
      } catch {
        existingPosts = []
      }
    }

    const postsByTopic = new Map<string, ForumPostCandidate[]>()
    for (const topic of recentTopics) {
      postsByTopic.set(topic.id, [])
    }
    for (const post of existingPosts) {
      const candidate: ForumPostCandidate = {
        id: post.id,
        userId: post.userId,
        parentId: post.parentId,
        authorName: post.authorName,
        authorHandle: memberById.get(post.userId || '')?.handle || null,
        content: post.content,
        createdAt: post.createdAt,
      }
      if (post.topicId && postsByTopic.has(post.topicId)) {
        postsByTopic.get(post.topicId)!.push(candidate)
      } else if (recentTopics.length === 1) {
        postsByTopic.get(recentTopics[0].id)!.push(candidate)
      }
    }

    const plannerTopics: PlannerTopic[] = recentTopics.map((topic) => ({
      id: topic.id,
      userId: topic.userId,
      authorName: memberById.get(topic.userId || '')?.handle || 'Initiate',
      title: topic.title,
      content: topic.content,
      repliesCount: topic.repliesCount ?? 0,
    }))

    for (let i = 0; i < actionCount; i++) {
      const decision = planForumAction({
        members: existingMembers.map(toPlannerMember),
        topics: plannerTopics,
        postsByTopic,
      })

      if (decision.action === 'none' || decision.action === 'ignore' || decision.action === 'upvote') {
        continue
      }

      const plannedAuthor = memberById.get(decision.actorId) || existingMembers[0]
      const replyActions = new Set(['reply_supportive', 'reply_challenging', 'reply_cite_canon'])
      const shouldReply =
        Boolean(decision.topicId) &&
        recentTopics.length > 0 &&
        (replyActions.has(decision.action) || decision.isOpFollowUp)

      if (shouldReply) {
        const topic = recentTopics.find((row) => row.id === decision.topicId) || recentTopics[0]
        const postCandidates = postsByTopic.get(topic.id) || []
        const author = plannedAuthor
        const plannedStance: ForumReplyStance =
          decision.stance || (decision.isOpFollowUp ? 'op_follow_up' : 'supportive')

        const { parentId, targetPost, isOpFollowUp } = chooseForumReplyTarget(
          {
            id: topic.id,
            userId: topic.userId,
            authorName: memberById.get(topic.userId || '')?.handle || 'Initiate',
            title: topic.title,
            content: topic.content,
          },
          postCandidates,
          author.id,
          {
            nestedChance: config.forumNestedReplyChance ?? DEFAULT_FORUM_NESTED_REPLY_CHANCE,
            maxDepth: SIMULATION_MAX_REPLY_DEPTH,
            affinityBias: affinityBiasForDrive(author.simulatedPersona?.drive),
            affinities: author.simulatedPersona?.affinities,
          }
        )
        const replyStance: ForumReplyStance = decision.isOpFollowUp || isOpFollowUp ? 'op_follow_up' : plannedStance

        const shouldQuote = Boolean(
          targetPost && rollChance(config.forumQuoteChance ?? DEFAULT_FORUM_QUOTE_CHANCE)
        )
        let quoteSnippet: string | null = null
        let quoteBlock: string | null = null
        if (shouldQuote && targetPost) {
          quoteSnippet = extractQuoteSnippet(targetPost.content, 180)
          if (quoteSnippet) {
            quoteBlock = formatDiegeticQuoteBlock(
              targetPost.authorHandle,
              targetPost.authorName || 'Initiate',
              quoteSnippet
            )
          }
        }

        const shouldMention = rollChance(config.forumMentionChance ?? DEFAULT_FORUM_MENTION_CHANCE)
        let mentionCandidate: { userId: string; handle: string } | null = null
        if (shouldMention) {
          const participants = postCandidates
            .map((p) => ({ userId: p.userId || '', handle: p.authorHandle || null }))
            .filter((p) => p.userId && p.handle)
          if (topic.userId && memberById.get(topic.userId)?.handle) {
            participants.push({ userId: topic.userId, handle: memberById.get(topic.userId)!.handle })
          }
          mentionCandidate = pickMentionCandidate(
            author.id,
            participants,
            [],
            targetPost ? { userId: targetPost.userId, handle: targetPost.authorHandle } : null
          )
        }

        const pairMemory = targetPost?.userId
          ? selectPairMemory(postCandidates, author.id, targetPost.userId, 2)
          : []
        const relationshipHint = targetPost?.userId
          ? formatRelationshipHint(
              getAffinity(author.simulatedPersona, targetPost.userId),
              targetPost.authorHandle || memberById.get(targetPost.userId)?.handle
            )
          : null
        const canonCitation =
          replyStance === 'cite_canon'
            ? pickCanonCitation(
                CANONICAL_SCRIPTURES.map((row) => ({
                  id: row.id,
                  title: row.title,
                  mandate: row.mandate,
                  summary: row.summary,
                }))
              )
            : null

        const authorPublicName = resolveMemberPublicName({
          userId: author.id,
          handle: author.handle,
          larvaId: author.larvaId,
        })

        let contextStr = `Thread Title: "${topic.title}"\nOriginal Post: "${topic.content}"`
        if (isOpFollowUp && targetPost) {
          contextStr += `\n\nYou are the Original Poster (OP). You are following up on this comment by ${targetPost.authorHandle ? `@${targetPost.authorHandle}` : targetPost.authorName}:\n"${targetPost.content}"`
        } else if (targetPost) {
          contextStr += `\n\nYou are replying directly to this comment by ${targetPost.authorHandle ? `@${targetPost.authorHandle}` : targetPost.authorName}:\n"${targetPost.content}"`
        } else if (postCandidates.length > 0) {
          const recent = postCandidates.slice(0, 2).map((p) => `${p.authorName}: ${p.content}`).join('\n')
          contextStr += `\n\nRecent replies in thread:\n${recent}`
        }
        if (pairMemory.length > 0 && targetPost) {
          const memoryLines = pairMemory
            .map((post) => `${post.authorHandle || post.authorName}: ${post.content}`)
            .join('\n')
          contextStr += `\n\nRecent exchange with this member:\n${memoryLines}`
        }

        let directives = `Write a concise forum reply (2 to 4 sentences) to this thread. ${formatForumStanceDirective(replyStance)}`
        if (targetPost && replyStance !== 'op_follow_up') {
          directives += ` Engage directly with the specific point made in their comment.`
        }
        if (relationshipHint) {
          directives += ` ${relationshipHint}`
        }
        if (canonCitation) {
          directives += ` ${formatCanonCitationDirective(canonCitation)}`
        }
        if (quoteSnippet) {
          directives += ` Address this quoted statement: "${quoteSnippet}". Do not write blockquote lines yourself; the quote header is formatted automatically.`
        }
        if (mentionCandidate) {
          directives += ` You may naturally address or mention @${mentionCandidate.handle} in conversational flow.`
        }

        const prompt = formatForumReplyPrompt({
          authorPublicName,
          stage: author.stage,
          simulatedPersona: author.simulatedPersona,
          directives,
          contextStr,
        })

        const parentAuthor = targetPost?.userId ? memberById.get(targetPost.userId) : null
        const affinityDelta = affinityDeltaForReply(
          replyStance,
          author.simulatedPersona?.drive,
          parentAuthor?.simulatedPersona?.drive
        )

        tasks.push({
          id: `forum-reply-${i + 1}`,
          kind: 'forum_reply',
          topicId: topic.id,
          topicTitle: topic.title,
          targetPostId: targetPost?.id ?? null,
          parentId,
          isOpFollowUp: Boolean(isOpFollowUp),
          quoteBlock,
          authorId: author.id,
          authorName: authorPublicName,
          authorStage: author.stage,
          parentAuthorId: parentAuthor?.id ?? null,
          replyStance,
          affinityDelta,
          prompt,
          outputSchema: {
            content: 'string (2 to 4 sentence in-character forum reply adhering to Moltology lore)',
          },
          generated: null,
        })
      } else {
        // Start thread
        const openCategories = categories.filter((c) => c.slug !== 'rules-announcements')
        const targetCategory =
          openCategories.length > 0
            ? openCategories[Math.floor(Math.random() * openCategories.length)]
            : categories[0]
        if (!targetCategory) continue

        const author = plannedAuthor
        const authorName = resolveMemberPublicName({
          userId: author.id,
          handle: author.handle,
          larvaId: author.larvaId,
        })

        const prompt = formatForumTopicPrompt({
          authorPublicName: authorName,
          stage: author.stage,
          simulatedPersona: author.simulatedPersona,
          categoryName: targetCategory.name,
          categoryDescription: targetCategory.description,
          drive: author.simulatedPersona?.drive,
        })

        tasks.push({
          id: `forum-topic-${i + 1}`,
          kind: 'forum_topic',
          category: {
            id: targetCategory.id,
            slug: targetCategory.slug,
            name: targetCategory.name,
          },
          authorId: author.id,
          authorName,
          authorStage: author.stage,
          prompt,
          outputSchema: {
            title: 'string (engaging title in sentence/title case, NO ALL CAPS, no decorative diamond glyphs)',
            content: 'string (3 to 5 sentence engaging discussion question or tip adhering to Moltology themes)',
          },
          generated: null,
        })
      }
    }
  }

  const plan: SimulationPlan = {
    version: 1,
    createdAt: new Date().toISOString(),
    options: {
      dryRun: Boolean(options.dryRun),
      forceSpawn: Boolean(options.forceSpawn),
      spawnOnly: Boolean(options.spawnOnly),
      routinesOnly: Boolean(options.routinesOnly),
      forumOnly: Boolean(options.forumOnly),
      votesOnly: Boolean(options.votesOnly),
      mutationsOnly: Boolean(options.mutationsOnly),
      socialOnly: Boolean(options.socialOnly),
      reviewOnly: Boolean(options.reviewOnly),
    },
    tasks,
    meta: {
      simulatedMemberCount: existingMembers.length,
      tasksCount: tasks.length,
    },
  }

  if (options.outPath) {
    const dir = path.dirname(options.outPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(options.outPath, JSON.stringify(plan, null, 2), 'utf8')
  }

  return plan
}

/**
 * Applies a pre-populated simulation plan to the database (or dry-run validates it)
 * and executes all remaining deterministic routines, votes, mutations, bonds, and reviews.
 */
export async function applySimulationPlan(
  planOrPath: SimulationPlan | string,
  options: { dryRun?: boolean; dbClient?: DbClient; config?: SimulationGrowthConfig } = {}
): Promise<Record<string, unknown>> {
  let plan: SimulationPlan
  if (typeof planOrPath === 'string') {
    if (!fs.existsSync(planOrPath)) {
      throw new Error(`[SimulationEngine] Plan file not found at: ${planOrPath}`)
    }
    const raw = fs.readFileSync(planOrPath, 'utf8')
    plan = JSON.parse(raw)
  } else {
    plan = planOrPath
  }

  const dryRun = options.dryRun !== undefined ? options.dryRun : Boolean(plan.options?.dryRun)
  const dbClient = options.dbClient || getDb()
  const config = options.config || DEFAULT_GROWTH_CONFIG
  const results: Record<string, unknown> = {}

  // 1. Validate that all tasks have been generated
  for (const task of plan.tasks) {
    if (!task.generated) {
      throw new Error(
        `[SimulationEngine] Cannot apply simulation plan: Task "${task.id}" (${task.kind}) has not been populated with generated text.`
      )
    }
  }

  // 2. Drive backfill
  results.driveBackfill = await backfillSimulatedDrives(dbClient, { dryRun })

  // 3. Process spawn task if present
  const spawnTask = plan.tasks.find((t) => t.kind === 'spawn_persona') as SimulationPlanSpawnTask | undefined
  if (spawnTask) {
    let rawGen: any = spawnTask.generated
    if (typeof rawGen === 'string') {
      try {
        rawGen = JSON.parse(rawGen.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, ''))
      } catch {
        throw new Error(`[SimulationEngine] Failed to parse generated persona JSON: ${rawGen}`)
      }
    }
    const personaObj = rawGen as { handle: string; archetype: string; tone: string; bio: string }
    const cleanHandle = String(personaObj.handle || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || `Acolyte_${Math.floor(Math.random() * 9000 + 1000)}`
    const bio = String(personaObj.bio || '').slice(0, 200)
    const archetype = String(personaObj.archetype || '').slice(0, 60)
    const tone = String(personaObj.tone || '').slice(0, 100)

    const guardBio = validateInputGuardrails(bio)
    const guardHandle = validateInputGuardrails(cleanHandle)
    if (!guardBio.allowed || !guardHandle.allowed) {
      throw new Error(`[SimulationEngine] Generated persona content failed guardrails: ${guardBio.reason || guardHandle.reason}`)
    }

    const userId = crypto.randomUUID()
    const larvaId = resolveMemberLarvaId(userId)
    const stage = spawnTask.stage
    const origin = spawnTask.origin
    const referredByUserId = origin.sponsorId
    const referredByHandle = origin.sponsorHandle

    const currencyMap: Record<number, { credits: string; gems: number; shards: number }> = {
      1: { credits: '1450.00', gems: 250, shards: 45 },
      2: { credits: '6500.00', gems: 1200, shards: 180 },
      3: { credits: '45000.00', gems: 5800, shards: 950 },
      4: { credits: '250000.00', gems: 35000, shards: 8200 },
    }
    const curr = currencyMap[stage] || currencyMap[1]
    const diceBearStyles = ['bottts', 'pixel-art', 'shapes', 'identicon']
    const selectedStyle = diceBearStyles[Math.floor(Math.random() * diceBearStyles.length)]

    const simulatedPersona: SimulatedPersonaConfig = {
      archetype,
      tone,
      bio,
      activityCadence: 'normal',
      lastSimulatedAt: new Date().toISOString(),
      drive: sampleDrive(),
      affinities: {},
      traits: [],
      referredByHandle,
    }

    if (dryRun) {
      results.spawn = {
        spawned: true,
        dryRun: true,
        userId,
        handle: cleanHandle,
        stage,
        persona: simulatedPersona,
        joinSource: origin.source,
        referredByUserId,
        referredByHandle,
      }
    } else {
      await dbClient.insert(profiles).values({
        id: userId,
        handle: cleanHandle,
        larvaId,
        stage,
        isSimulated: true,
        simulatedPersona,
        joinSource: origin.source,
        referredByUserId,
        moltCredits: curr.credits,
        chitinGems: curr.gems,
        synapseShards: curr.shards,
        depthPressureCoins: stage * 15,
        avatarConfig: {
          style: selectedStyle,
          seed: crypto.randomUUID(),
        },
      })
      await dbClient.insert(userStats).values({
        userId,
        pincerTorque: 50 + stage * 12,
        shellHardness: 40 + stage * 15,
        processingPower: 60 + stage * 10,
        durability: 55 + stage * 10,
        clawStrength: 50 + stage * 12,
        submergenceDepthRating: 1000 * stage,
      }).onConflictDoNothing()

      if (origin.sponsorId && (origin.source === 'brought_in' || origin.source === 'word_of_mouth')) {
        if (origin.source === 'brought_in') {
          await ensureFriendship(dbClient, origin.sponsorId, userId)
          await ensureBond(dbClient, 'brought_in', origin.sponsorId, userId)
          try {
            await recordConnectionAcceptedEvents(
              dbClient,
              { id: origin.sponsorId, handle: origin.sponsorHandle, larvaId: null },
              { id: userId, handle: cleanHandle, larvaId }
            )
          } catch {
            // Non-fatal
          }
        }
      }

      results.spawn = {
        spawned: true,
        dryRun: false,
        userId,
        handle: cleanHandle,
        stage,
        persona: simulatedPersona,
        joinSource: origin.source,
        referredByUserId,
        referredByHandle,
      }
    }
  } else if (shouldRunPhase('spawn', plan.options)) {
    results.spawn = { spawned: false, reason: 'No acolyte spawn task in plan.' }
  }

  // 4. Forum tasks
  const forumTasks = plan.tasks.filter((t) => t.kind === 'forum_reply' || t.kind === 'forum_topic')
  const forumResults: any[] = []
  const existingMembers = await listSimulatedMembers(dbClient)
  const memberById = new Map(existingMembers.map((m) => [m.id, m]))

  for (const task of forumTasks) {
    if (task.kind === 'forum_reply') {
      const replyTask = task as SimulationPlanForumReplyTask
      let replyContent = typeof replyTask.generated === 'string'
        ? replyTask.generated
        : (replyTask.generated as any)?.content || ''
      replyContent = replyContent.trim().replace(/^["'`]|["'`]$/g, '')
      if (replyTask.quoteBlock && !replyContent.startsWith('>')) {
        replyContent = `${replyTask.quoteBlock}${replyContent}`
      }
      const guardrail = validateInputGuardrails(replyContent)
      if (!guardrail.allowed) {
        throw new Error(`[SimulationEngine] AI generated unsafe forum reply: ${guardrail.reason}`)
      }

      const author = memberById.get(replyTask.authorId)
      const parentAuthor = replyTask.parentAuthorId ? memberById.get(replyTask.parentAuthorId) : null

      if (author) {
        author.simulatedPersona = touchPersona(author.simulatedPersona)
        await persistSimulatedPersona(dbClient, author.id, author.simulatedPersona, dryRun)
        await applyPairwiseAffinity(
          dbClient,
          author,
          parentAuthor,
          replyTask.affinityDelta,
          dryRun
        )
      }

      if (!dryRun) {
        const [newPost] = await dbClient
          .insert(forumPosts)
          .values({
            topicId: replyTask.topicId,
            userId: replyTask.authorId,
            parentId: replyTask.parentId || null,
            authorName: replyTask.authorName,
            content: replyContent,
          })
          .returning()

        await dbClient
          .update(forumTopics)
          .set({
            repliesCount: sql`${forumTopics.repliesCount} + 1`,
            lastReplyAt: new Date(),
          })
          .where(eq(forumTopics.id, replyTask.topicId))

        const mentionedHandles = extractMentionHandles(replyContent)
        let mentionedUserIds: string[] = []
        if (mentionedHandles.length > 0) {
          try {
            mentionedUserIds = await recordForumMentions(dbClient, {
              actorUserId: replyTask.authorId,
              actorPublicName: replyTask.authorName,
              content: replyContent,
              sourceType: 'post',
              sourceId: newPost.id,
              topicId: replyTask.topicId,
              topicSlug: replyTask.topicTitle ? slugifyForumTitle(replyTask.topicTitle) : undefined,
            })
          } catch {
            // Non-fatal
          }
        }

        try {
          await recordForumReplyNotifications(dbClient, {
            actorUserId: replyTask.authorId,
            actorPublicName: replyTask.authorName,
            replyPostId: newPost.id,
            topicId: replyTask.topicId,
            parentAuthorUserId: replyTask.parentAuthorId || null,
            skipUserIds: mentionedUserIds,
            topicSlug: replyTask.topicTitle ? slugifyForumTitle(replyTask.topicTitle) : undefined,
          })
        } catch {
          // Non-fatal
        }

        try {
          await recordForumReplyPostedEvent(dbClient, replyTask.authorId, {
            postId: newPost.id,
            topicId: replyTask.topicId,
            topicTitle: replyTask.topicTitle,
            topicSlug: slugifyForumTitle(replyTask.topicTitle),
            categorySlug: 'general-discussion',
            categoryName: 'Community',
            mentionedHandles,
          })
        } catch {
          // Non-fatal
        }

        forumResults.push({
          action: 'reply',
          topicId: replyTask.topicId,
          topicTitle: replyTask.topicTitle,
          parentId: replyTask.parentId,
          isOpFollowUp: replyTask.isOpFollowUp,
          quoted: Boolean(replyTask.quoteBlock),
          authorHandle: author?.handle,
          authorName: replyTask.authorName,
          stance: replyTask.replyStance,
          content: replyContent,
          dryRun: false,
        })
      } else {
        forumResults.push({
          action: 'reply',
          topicId: replyTask.topicId,
          topicTitle: replyTask.topicTitle,
          parentId: replyTask.parentId,
          isOpFollowUp: replyTask.isOpFollowUp,
          quoted: Boolean(replyTask.quoteBlock),
          authorHandle: author?.handle,
          authorName: replyTask.authorName,
          stance: replyTask.replyStance,
          content: replyContent,
          dryRun: true,
        })
      }
    } else if (task.kind === 'forum_topic') {
      const topicTask = task as SimulationPlanForumTopicTask
      let topicData: any = topicTask.generated
      if (typeof topicData === 'string') {
        try {
          topicData = JSON.parse(topicData.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, ''))
        } catch {
          throw new Error(`[SimulationEngine] Failed to parse generated forum topic JSON: ${topicData}`)
        }
      }
      const topicObj = topicData as { title: string; content: string }
      const guardrailTitle = validateInputGuardrails(topicObj.title)
      const guardrailContent = validateInputGuardrails(topicObj.content)
      if (!guardrailTitle.allowed || !guardrailContent.allowed) {
        throw new Error('[SimulationEngine] AI generated unsafe forum topic content.')
      }

      const author = memberById.get(topicTask.authorId)
      if (author) {
        author.simulatedPersona = touchPersona(author.simulatedPersona)
        await persistSimulatedPersona(dbClient, author.id, author.simulatedPersona, dryRun)
      }

      if (!dryRun) {
        const slug = slugifyForumTitle(topicObj.title)
        const [newTopic] = await dbClient
          .insert(forumTopics)
          .values({
            categoryId: topicTask.category.id,
            userId: topicTask.authorId,
            authorName: topicTask.authorName,
            authorAvatar: '/images/stage1_larva.png',
            authorStage: topicTask.authorStage,
            title: topicObj.title.trim().slice(0, 120),
            slug,
            content: topicObj.content.trim(),
            lastReplyAt: new Date(),
          })
          .returning()

        try {
          await recordForumMentions(dbClient, {
            actorUserId: topicTask.authorId,
            actorPublicName: topicTask.authorName,
            content: newTopic.content,
            sourceType: 'topic',
            sourceId: newTopic.id,
            topicId: newTopic.id,
            topicSlug: newTopic.slug,
            categorySlug: topicTask.category.slug,
          })
        } catch {
          // Non-fatal
        }

        try {
          await recordForumTopicOpenedEvent(dbClient, topicTask.authorId, {
            id: newTopic.id,
            title: newTopic.title,
            slug: newTopic.slug,
            categorySlug: topicTask.category.slug,
            categoryName: topicTask.category.name,
            mentionedHandles: extractMentionHandles(newTopic.content),
          })
        } catch {
          // Non-fatal
        }

        forumResults.push({
          action: 'topic',
          topicId: newTopic.id,
          categorySlug: topicTask.category.slug,
          title: newTopic.title,
          authorName: topicTask.authorName,
          dryRun: false,
        })
      } else {
        forumResults.push({
          action: 'topic',
          categorySlug: topicTask.category.slug,
          title: topicObj.title,
          authorHandle: author?.handle,
          authorName: topicTask.authorName,
          dryRun: true,
        })
      }
    }
  }

  if (shouldRunPhase('forum', plan.options)) {
    results.forum = forumResults.length === 1 ? forumResults[0] : forumResults
    results.revision = await simulateForumRevision(dbClient, config, { dryRun })
  }

  // 5. Daily routines
  if (shouldRunPhase('routines', plan.options)) {
    results.routines = await simulateDailyRoutines(dbClient, config, { dryRun })
  }

  // 6. Upvotes
  if (shouldRunPhase('votes', plan.options)) {
    results.votes = await simulateForumReactions(dbClient, {
      dryRun,
      voteCount: config.forumVoteCount,
      config,
    })
  }

  // 7. Mutations
  if (shouldRunPhase('mutations', plan.options)) {
    results.mutation = await mutateSimulatedPersona(dbClient, config, { dryRun })
  }

  // 8. Social
  if (shouldRunPhase('social', plan.options)) {
    results.connection = await simulateConnections(dbClient, config, { dryRun })
    results.relationship = await simulateRelationships(dbClient, config, { dryRun })
  }

  // 9. Standing review
  if (shouldRunPhase('review', plan.options)) {
    try {
      results.review = await reviewMemberPosts(dbClient, { dryRun })
    } catch (err) {
      results.review = { error: err instanceof Error ? err.message : String(err) }
    }
  }

  return results
}

