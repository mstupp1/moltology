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
import { recordRoutineCompletedEvent } from './activity-log'
import { resolveMemberLarvaId } from '../larva-id'
import { resolveMemberPublicName } from '../member-handle'
import { slugifyForumTitle } from '../forum-utils'
import { validateInputGuardrails } from '../ai/guardrails'
import { normalizeFriendPair } from '../connections'
import {
  DEFAULT_BOND_CHANCE,
  DEFAULT_CONNECTION_CHANCE,
  DEFAULT_JOIN_SOURCE_WEIGHTS,
  DEFAULT_MAX_BONDS_PER_MEMBER,
  DEFAULT_MAX_TRAITS_PER_MEMBER,
  DEFAULT_MUTATION_CHANCE,
  applyTraitMutation,
  bondPairKey,
  chooseBondForPair,
  formatPersonaVoiceBlock,
  friendshipPairKey,
  normalizeBondEndpoints,
  pickNewTrait,
  pickUnconnectedPair,
  pickWeightedSponsor,
  rollChance,
  sampleJoinOrigin,
} from '../simulation-social'

export const SIMULATION_MODEL_ID = process.env.SIMULATION_MODEL_ID || 'alibaba/qwen3.8-flash'

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

  const stageTitles: Record<number, string> = {
    1: 'Stage 1 Larva (eager beginner, mastering daily habits and discipline)',
    2: 'Stage 2 Soft-Shed (intermediate practitioner navigating the vulnerable soft-shell window)',
    3: 'Stage 3 Architect (senior biomechanical operator, optimizing pincer torque and systems)',
    4: 'Stage 4 Ascendant (revered cult elder, liturgical, commanding, guardian of core directives)',
  }

  const prompt = `Generate a unique persona for a member of the Moltology community.
The member is at ${stageTitles[stage] || stageTitles[1]}.

Rules:
- The handle must be 1-2 words, optionally with numbers or an underscore (e.g. ChitinForge_42, AbyssalDrifter, ReefCrafter, CarapacePilot, Vaelen_77). Never use spaces in handle.
- The archetype is a 2-4 word descriptor (e.g. Deep-Sea Biohacker, Relentless Grinder, Carapace Philosopher).
- The tone describes how they speak in the forum (e.g. Inquisitive, enthusiastic, respectful; or Analytical, concise, metric-focused).
- The bio is a 1-2 sentence in-character summary of their current focus and progress.
- Strictly adhere to Moltology lore: chitin, molting, ecdysis, carapace, benthic pressure, alignment, daily routines.
- NEVER mention real-world tech stacks (no React, Vercel, Postgres, LLM, AI, prompts).
- Output strictly valid JSON with keys: "handle", "archetype", "tone", "bio". No markdown fences or commentary.`

  const response = await generateText({
    model: SIMULATION_MODEL_ID as any,
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
 */
export async function simulateForumActivity(
  dbClient: ReturnType<typeof getDb>,
  options: { dryRun?: boolean } = {}
) {
  assertAiGatewayKey()

  const simulatedMembers = await dbClient
    .select()
    .from(profiles)
    .where(eq(profiles.isSimulated, true))

  if (simulatedMembers.length === 0) {
    return { action: 'none', reason: 'No simulated members exist.' }
  }

  // Check recent topics
  const recentTopics = await dbClient
    .select()
    .from(forumTopics)
    .where(eq(forumTopics.isLocked, false))
    .orderBy(desc(forumTopics.createdAt))
    .limit(8)

  const topicsNeedingReplies = recentTopics.filter((t) => t.repliesCount < 4)
  const shouldReply = topicsNeedingReplies.length > 0 && Math.random() < 0.75

  if (shouldReply) {
    // Reply to an existing topic
    const topic = topicsNeedingReplies[Math.floor(Math.random() * topicsNeedingReplies.length)]
    // Pick an author who is not the topic creator
    const availableMembers = simulatedMembers.filter((m) => m.id !== topic.userId)
    const author =
      availableMembers.length > 0
        ? availableMembers[Math.floor(Math.random() * availableMembers.length)]
        : simulatedMembers[0]

    // Fetch up to 2 latest comments for context
    const existingPosts = await dbClient
      .select({ authorName: forumPosts.authorName, content: forumPosts.content })
      .from(forumPosts)
      .where(eq(forumPosts.topicId, topic.id))
      .orderBy(desc(forumPosts.createdAt))
      .limit(2)

    const contextStr = existingPosts.map((p) => `${p.authorName}: ${p.content}`).join('\n')

    const prompt = `You are ${resolveMemberPublicName({ userId: author.id, handle: author.handle, larvaId: author.larvaId })} (Stage ${author.stage}).
${formatPersonaVoiceBlock(author.simulatedPersona)}

Write a concise forum reply (2 to 4 sentences) to this thread:
Thread Title: "${topic.title}"
Original Post: "${topic.content}"
${contextStr ? `Recent replies:\n${contextStr}` : ''}

Hard rules:
- Stay completely in-character in the Moltology world (chitin, molting, ecdysis, discipline, carapace, deep-sea pressure).
- Be supportive, insightful, and constructive. Never toxic or spammy.
- NEVER use decorative diamond glyphs (◈).
- NEVER use ALL-CAPS screaming header lines.
- NEVER leak technical stacks or talk about coding libraries (no React, Vercel, Postgres, LLM).
- Respond in conversational sentence case with no quotation marks or meta commentary.`

    const aiRes = await generateText({
      model: SIMULATION_MODEL_ID as any,
      prompt,
      temperature: 0.75,
    })

    const replyContent = aiRes.text.trim().replace(/^["'`]|["'`]$/g, '')
    const guardrail = validateInputGuardrails(replyContent)
    if (!guardrail.allowed) {
      throw new Error(`[SimulationEngine] AI generated unsafe forum reply: ${guardrail.reason}`)
    }

    if (!options.dryRun) {
      const authorName = resolveMemberPublicName({
        userId: author.id,
        handle: author.handle,
        larvaId: author.larvaId,
      })

      const [newPost] = await dbClient
        .insert(forumPosts)
        .values({
          topicId: topic.id,
          userId: author.id,
          authorName,
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

      return {
        action: 'reply',
        topicId: topic.id,
        topicTitle: topic.title,
        postId: newPost.id,
        authorName,
        content: replyContent,
        dryRun: false,
      }
    }

    return {
      action: 'reply',
      topicId: topic.id,
      topicTitle: topic.title,
      authorHandle: author.handle,
      content: replyContent,
      dryRun: true,
    }
  }

  // Otherwise, create a new discussion topic
  const categories = await dbClient.select().from(forumCategories).limit(6)
  if (categories.length === 0) {
    return { action: 'none', reason: 'No forum categories exist in database.' }
  }

  // Filter out read-only / announcements
  const openCategories = categories.filter((c) => c.slug !== 'rules-announcements')
  const targetCategory =
    openCategories.length > 0
      ? openCategories[Math.floor(Math.random() * openCategories.length)]
      : categories[0]

  const author = simulatedMembers[Math.floor(Math.random() * simulatedMembers.length)]

  const prompt = `You are ${resolveMemberPublicName({ userId: author.id, handle: author.handle, larvaId: author.larvaId })} (Stage ${author.stage}).
${formatPersonaVoiceBlock(author.simulatedPersona)}

Generate a thoughtful new forum discussion thread for the "${targetCategory.name}" category (${targetCategory.description}).

Hard rules:
- Provide a clear, engaging discussion question or tip (3-5 sentences total).
- The title must use conversational sentence case or title case. DO NOT SCREAM IN ALL CAPS.
- DO NOT use decorative diamond glyphs (◈).
- Strictly adhere to Moltology themes (chitin, molting, ecdysis, discipline, biometric stats, habits).
- NEVER leak technical stacks (no React, Vercel, Postgres, AI, LLM).
- Output strictly valid JSON with keys: "title" and "content". No extra markdown or commentary.`

  const aiRes = await generateText({
    model: SIMULATION_MODEL_ID as any,
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

  if (!options.dryRun) {
    const authorName = resolveMemberPublicName({
      userId: author.id,
      handle: author.handle,
      larvaId: author.larvaId,
    })
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
    dryRun: true,
  }
}

/**
 * Simulates community upvotes on recent forum posts or topics.
 */
export async function simulateForumReactions(
  dbClient: ReturnType<typeof getDb>,
  options: { dryRun?: boolean; voteCount?: number } = {}
) {
  const voteTargetCount = options.voteCount ?? 2

  const simulatedMembers = await dbClient
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.isSimulated, true))

  if (simulatedMembers.length === 0) {
    return { votesCast: 0, actions: [] }
  }

  // Fetch recent posts
  const recentPosts = await dbClient
    .select({ id: forumPosts.id, userId: forumPosts.userId, topicId: forumPosts.topicId })
    .from(forumPosts)
    .orderBy(desc(forumPosts.createdAt))
    .limit(10)

  if (recentPosts.length === 0) {
    return { votesCast: 0, actions: [] }
  }

  const actions: Array<{ voterId: string; postId: string }> = []

  for (let i = 0; i < voteTargetCount; i++) {
    const voter = simulatedMembers[Math.floor(Math.random() * simulatedMembers.length)]
    // Pick post not authored by voter
    const candidatePosts = recentPosts.filter((p) => p.userId !== voter.id)
    if (candidatePosts.length === 0) continue

    const post = candidatePosts[Math.floor(Math.random() * candidatePosts.length)]

    if (!options.dryRun) {
      try {
        const [inserted] = await dbClient
          .insert(forumVotes)
          .values({
            userId: voter.id,
            postId: post.id,
          })
          .onConflictDoNothing()
          .returning()

        if (inserted) {
          await dbClient
            .update(forumPosts)
            .set({ upvotes: sql`${forumPosts.upvotes} + 1` })
            .where(eq(forumPosts.id, post.id))

          actions.push({ voterId: voter.id, postId: post.id })
        }
      } catch (voteErr) {
        // Safe skip on constraint clash
      }
    } else {
      actions.push({ voterId: voter.id, postId: post.id })
    }
  }

  return {
    votesCast: actions.length,
    actions,
    dryRun: Boolean(options.dryRun),
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
  phase: 'spawn' | 'routines' | 'forum' | 'votes' | 'mutations' | 'social',
  options: {
    spawnOnly?: boolean
    routinesOnly?: boolean
    forumOnly?: boolean
    votesOnly?: boolean
    mutationsOnly?: boolean
    socialOnly?: boolean
  }
) {
  const anyOnly = Boolean(
    options.spawnOnly ||
      options.routinesOnly ||
      options.forumOnly ||
      options.votesOnly ||
      options.mutationsOnly ||
      options.socialOnly
  )
  if (!anyOnly) return true
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
} = {}) {
  // Fail fast immediately if AI Gateway key is missing
  assertAiGatewayKey()

  console.log('[SimulationCycle] Starting 12-hour activity simulation tick...')
  if (options.dryRun) {
    console.log('[SimulationCycle] Running in DRY-RUN mode (no database writes).')
  }

  const dbClient = getDb()
  const results: Record<string, unknown> = {}

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
    console.log('[SimulationCycle] Simulating forum discussions and replies...')
    const forumRes = await simulateForumActivity(dbClient, { dryRun: options.dryRun })
    results.forum = forumRes
    if (forumRes.action === 'reply') {
      console.log(`[SimulationCycle] ✓ Generated forum reply by ${forumRes.authorName || forumRes.authorHandle} on topic "${forumRes.topicTitle}"`)
    } else if (forumRes.action === 'topic') {
      console.log(`[SimulationCycle] ✓ Created new forum topic "${forumRes.title}" by ${forumRes.authorName || forumRes.authorHandle}`)
    } else {
      console.log(`[SimulationCycle] - Forum action skipped: ${forumRes.reason}`)
    }
  }

  // 4. Votes
  if (shouldRunPhase('votes', options)) {
    console.log('[SimulationCycle] Simulating community upvotes...')
    const voteRes = await simulateForumReactions(dbClient, { dryRun: options.dryRun })
    results.votes = voteRes
    console.log(`[SimulationCycle] ✓ Cast ${voteRes.votesCast} community upvotes.`)
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

  console.log('[SimulationCycle] ✓ Simulation tick completed successfully!')
  return results
}
