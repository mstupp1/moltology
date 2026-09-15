import type {
  MemberBondKind,
  MemberJoinSource,
  SimulatedActivityCadence,
  SimulatedDrive,
  SimulatedPersonaConfig,
  SimulatedTrait,
} from '../db/schema'

export type Rng = () => number

export const DEFAULT_MUTATION_CHANCE = 0.12
export const DEFAULT_MAX_TRAITS_PER_MEMBER = 3
export const DEFAULT_CONNECTION_CHANCE = 0.22
export const DEFAULT_BOND_CHANCE = 0.1
export const DEFAULT_MAX_BONDS_PER_MEMBER = 4

export const DEFAULT_JOIN_SOURCE_WEIGHTS: Record<MemberJoinSource, number> = {
  organic: 0.45,
  word_of_mouth: 0.35,
  brought_in: 0.2,
}

/** Mild, unique personality mutations. Labels stay plain and human-readable. */
export const SIMULATED_TRAIT_CATALOG: SimulatedTrait[] = [
  {
    id: 'pre_dawn_lock',
    label: 'Pre-dawn locker',
    description: 'Shows up for first light before the rest of the trench stirs.',
  },
  {
    id: 'quiet_depth',
    label: 'Quiet-depth walker',
    description: 'Talks less in the forum, then drops one useful line.',
  },
  {
    id: 'metric_scribe',
    label: 'Metric scribe',
    description: 'Keeps a private ledger of shell hardness and pincer torque.',
  },
  {
    id: 'warm_hail',
    label: 'Warm hail',
    description: 'Greets new larvae by name and means it.',
  },
  {
    id: 'soft_shed_nurse',
    label: 'Soft-shed nurse',
    description: 'Checks on anyone in a vulnerable window.',
  },
  {
    id: 'cold_plunge',
    label: 'Cold-plunge regular',
    description: 'Treats the plunge as a standing appointment, not a mood.',
  },
  {
    id: 'night_watch',
    label: 'Night-watch shell',
    description: 'Most active after the surface goes quiet.',
  },
  {
    id: 'doctrine_cite',
    label: 'Doctrine citer',
    description: 'Answers with a short scripture line, then the practical step.',
  },
  {
    id: 'pincer_finisher',
    label: 'Pincer finisher',
    description: 'Closes the tab, then the task, then the day.',
  },
  {
    id: 'slow_molt',
    label: 'Slow molt',
    description: 'Takes ecdysis in small sheds and does not rush the new shell.',
  },
  {
    id: 'reef_tinkerer',
    label: 'Reef tinkerer',
    description: 'Always adjusting a small ritual until it fits.',
  },
  {
    id: 'dry_trench_wit',
    label: 'Dry-trench wit',
    description: 'Deadpan asides that land because everything else was serious.',
  },
  {
    id: 'streak_keeper',
    label: 'Streak keeper',
    description: 'Protects the daily alignment chain like a molted claw.',
  },
  {
    id: 'mentor_lean',
    label: 'Mentor lean',
    description: 'Would rather teach a larva than flex a number.',
  },
  {
    id: 'solo_trench',
    label: 'Solo trench',
    description: 'Works alone first, then reports back with findings.',
  },
  {
    id: 'chorus_voice',
    label: 'Chorus voice',
    description: 'Shows up in threads to keep the tone constructive.',
  },
  {
    id: 'pressure_calm',
    label: 'Pressure-calm',
    description: 'Stays even when the surface is noisy.',
  },
  {
    id: 'chassis_fuss',
    label: 'Chassis fuss',
    description: 'Cares a little too much about which hardpoint is showing.',
  },
  {
    id: 'early_questioner',
    label: 'Early questioner',
    description: 'Asks the obvious thing everyone else was circling.',
  },
  {
    id: 'last_reply_closer',
    label: 'Last-reply closer',
    description: 'Sums up a thread so it can actually end.',
  },
]

export function rollChance(probability: number, rng: Rng = Math.random): boolean {
  if (probability <= 0) return false
  if (probability >= 1) return true
  return rng() < probability
}

export function pickNewTrait(
  existingIds: Iterable<string>,
  catalog: SimulatedTrait[] = SIMULATED_TRAIT_CATALOG,
  rng: Rng = Math.random
): SimulatedTrait | null {
  const taken = new Set(existingIds)
  const available = catalog.filter((trait) => !taken.has(trait.id))
  if (available.length === 0) return null
  const index = Math.min(available.length - 1, Math.floor(rng() * available.length))
  return available[index] ?? null
}

export function applyTraitMutation(
  persona: SimulatedPersonaConfig | null | undefined,
  trait: SimulatedTrait,
  acquiredAt = new Date().toISOString()
): SimulatedPersonaConfig {
  const base: SimulatedPersonaConfig = persona || { archetype: 'Acolyte', tone: 'Steadfast' }
  const nextTrait: SimulatedTrait = {
    id: trait.id,
    label: trait.label,
    description: trait.description,
    acquiredAt,
  }
  return {
    ...base,
    traits: [...(base.traits || []).filter((row) => row.id !== trait.id), nextTrait],
  }
}

export function sampleJoinOrigin(
  sponsorCount: number,
  weights: Record<MemberJoinSource, number> = DEFAULT_JOIN_SOURCE_WEIGHTS,
  rng: Rng = Math.random
): { source: MemberJoinSource; needsSponsor: boolean } {
  if (sponsorCount <= 0) {
    return { source: 'organic', needsSponsor: false }
  }

  const roll = rng()
  const organic = weights.organic
  const wordOfMouth = organic + weights.word_of_mouth
  if (roll < organic) return { source: 'organic', needsSponsor: false }
  if (roll < wordOfMouth) return { source: 'word_of_mouth', needsSponsor: true }
  return { source: 'brought_in', needsSponsor: true }
}

export function pickWeightedSponsor<T extends { id: string; stage: number }>(
  members: T[],
  rng: Rng = Math.random
): T | null {
  if (members.length === 0) return null
  const total = members.reduce((sum, member) => sum + Math.max(1, member.stage), 0)
  let cursor = rng() * total
  for (const member of members) {
    cursor -= Math.max(1, member.stage)
    if (cursor <= 0) return member
  }
  return members[members.length - 1] ?? null
}

export function friendshipPairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

export function pickUnconnectedPair<T extends { id: string }>(
  members: T[],
  existingPairKeys: Iterable<string>,
  rng: Rng = Math.random
): [T, T] | null {
  if (members.length < 2) return null
  const taken = new Set(existingPairKeys)
  const candidates: Array<[T, T]> = []
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const left = members[i]
      const right = members[j]
      if (taken.has(friendshipPairKey(left.id, right.id))) continue
      candidates.push([left, right])
    }
  }
  if (candidates.length === 0) return null
  const index = Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))
  return candidates[index] ?? null
}

export function normalizeBondEndpoints(
  kind: MemberBondKind,
  fromUserId: string,
  toUserId: string
): { fromUserId: string; toUserId: string } {
  if (fromUserId === toUserId) {
    throw new Error('Cannot form a bond with yourself.')
  }
  if (kind === 'nest_mate') {
    return fromUserId < toUserId
      ? { fromUserId, toUserId }
      : { fromUserId: toUserId, toUserId: fromUserId }
  }
  return { fromUserId, toUserId }
}

export function bondPairKey(kind: MemberBondKind, fromUserId: string, toUserId: string): string {
  const pair = normalizeBondEndpoints(kind, fromUserId, toUserId)
  return `${kind}:${pair.fromUserId}|${pair.toUserId}`
}

export function chooseBondForPair<T extends { id: string; stage: number }>(
  left: T,
  right: T
): { kind: Exclude<MemberBondKind, 'brought_in'>; from: T; to: T } {
  if (left.stage !== right.stage) {
    const mentor = left.stage > right.stage ? left : right
    const protege = mentor.id === left.id ? right : left
    return { kind: 'mentor', from: mentor, to: protege }
  }
  const [from, to] = left.id < right.id ? [left, right] : [right, left]
  return { kind: 'nest_mate', from, to }
}

export function presentJoinStory(
  source: MemberJoinSource | null | undefined,
  referrerName: string | null | undefined
): string | null {
  if (!source || source === 'organic') return null
  const name = referrerName?.trim()
  if (!name) return null
  if (source === 'brought_in') return `Brought in by ${name}`
  return `Heard about the Order from ${name}`
}

export function presentBondLabel(
  kind: MemberBondKind,
  otherName: string,
  viewerIsFrom: boolean
): string {
  if (kind === 'nest_mate') return `Nest-mate of ${otherName}`
  if (kind === 'mentor') {
    return viewerIsFrom ? `Mentoring ${otherName}` : `Learning from ${otherName}`
  }
  return viewerIsFrom ? `Brought ${otherName} in` : `Brought in by ${otherName}`
}

export function formatPersonaVoiceBlock(persona: SimulatedPersonaConfig | null | undefined): string {
  const archetype = persona?.archetype || 'Acolyte'
  const tone = persona?.tone || 'Constructive, respectful'
  const traitLabels = (persona?.traits || []).map((trait) => trait.label).filter(Boolean)
  const traitLine =
    traitLabels.length > 0
      ? `Distinct traits: ${traitLabels.join('; ')}. Let those traits flavor word choice without naming them.`
      : 'Distinct traits: none yet.'
  return `Persona Archetype: ${archetype}\nTone: ${tone}\n${traitLine}`
}

export const DEFAULT_FORUM_ACTIONS_PER_CYCLE = 2
export const DEFAULT_FORUM_NESTED_REPLY_CHANCE = 0.55
export const DEFAULT_FORUM_QUOTE_CHANCE = 0.22
export const DEFAULT_FORUM_MENTION_CHANCE = 0.25
export const DEFAULT_FORUM_TOPIC_VOTE_RATIO = 0.45
export const DEFAULT_FORUM_EDIT_CHANCE = 0.08
export const SIMULATION_MAX_REPLY_DEPTH = 4

export interface ForumPostCandidate {
  id: string
  userId?: string | null
  parentId?: string | null
  authorName?: string | null
  authorHandle?: string | null
  content: string
  createdAt?: string | Date | null
}

export interface ForumTopicCandidate {
  id: string
  userId?: string | null
  authorName?: string | null
  authorHandle?: string | null
  title: string
  content: string
}

/**
 * Computes the nesting depth of a post within a topic.
 * 0 = top-level reply directly to topic.
 */
export function calculatePostDepth(postId: string, parentMap: Map<string, string | null>): number {
  let depth = 0
  let current = parentMap.get(postId)
  const seen = new Set<string>([postId])
  while (current) {
    if (seen.has(current)) break
    seen.add(current)
    depth += 1
    current = parentMap.get(current)
  }
  return depth
}

/**
 * Chooses whether a simulated reply targets the topic root (top-level) or an existing post (nested).
 * Emulates authentic Reddit behavior:
 * - Thread OP has an elevated tendency to follow up with commenters.
 * - Non-OP members balance top-level thoughts with replies to comments.
 * - Prevents exceeding maximum reply depth.
 */
export function chooseForumReplyTarget(
  topic: ForumTopicCandidate,
  posts: ForumPostCandidate[],
  authorUserId: string,
  options: {
    nestedChance?: number
    maxDepth?: number
    rng?: Rng
    affinityBias?: 'allies' | 'rivals' | 'none'
    affinities?: Record<string, number>
  } = {}
): {
  parentId: string | null
  targetPost: ForumPostCandidate | null
  isOpFollowUp: boolean
} {
  const rng = options.rng ?? Math.random
  const maxDepth = options.maxDepth ?? SIMULATION_MAX_REPLY_DEPTH
  const nestedChance = options.nestedChance ?? DEFAULT_FORUM_NESTED_REPLY_CHANCE
  const affinityBias = options.affinityBias ?? 'none'
  const affinities = options.affinities ?? {}

  if (posts.length === 0) {
    return { parentId: null, targetPost: null, isOpFollowUp: false }
  }

  const isAuthorOp = Boolean(topic.userId && topic.userId === authorUserId)
  const parentMap = new Map<string, string | null>()
  for (const p of posts) {
    parentMap.set(p.id, p.parentId ?? null)
  }

  // Eligible posts for nesting: depth < maxDepth and not authored by the reply author (unless OP has no others)
  const eligiblePosts = posts.filter((p) => {
    const depth = calculatePostDepth(p.id, parentMap)
    return depth < maxDepth
  })

  if (eligiblePosts.length === 0) {
    return { parentId: null, targetPost: null, isOpFollowUp: false }
  }

  // OP Follow-up: If OP is replying and other members have commented, OP replies to a commenter.
  if (isAuthorOp) {
    const commenterPosts = eligiblePosts.filter((p) => p.userId !== authorUserId)
    if (commenterPosts.length > 0) {
      // Pick the most recent commenter post or a random one
      const target = commenterPosts[Math.floor(rng() * commenterPosts.length)]
      return { parentId: target.id, targetPost: target, isOpFollowUp: true }
    }
  }

  // Non-OP member deciding between top-level and nested reply
  const wantsNested = rollChance(nestedChance, rng)
  if (!wantsNested) {
    return { parentId: null, targetPost: null, isOpFollowUp: false }
  }

  // Prefer posts authored by others
  const othersPosts = eligiblePosts.filter((p) => p.userId !== authorUserId)
  const candidates = othersPosts.length > 0 ? othersPosts : eligiblePosts
  const chosen = pickAffinityBiasedPost(candidates, affinities, affinityBias, rng)

  return { parentId: chosen.id, targetPost: chosen, isOpFollowUp: false }
}

/**
 * Extracts a concise, quote-worthy snippet from post content (1-2 sentences, max ~200 chars).
 * Strips out existing blockquote lines and clean markdown.
 */
export function extractQuoteSnippet(content: string, maxChars = 200): string | null {
  if (!content) return null

  // Remove existing blockquote lines
  const cleanLines = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !line.trim().startsWith('>'))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleanLines) return null

  // Extract first 1 or 2 sentences
  const sentenceMatch = cleanLines.match(/^(.*?[.!?])(?:\s+.*?[.!?])?/i)
  let snippet = (sentenceMatch ? sentenceMatch[0] : cleanLines).trim()

  if (snippet.length > maxChars) {
    snippet = snippet.slice(0, maxChars).replace(/\s+\S*$/, '…')
  }

  return snippet.length >= 10 ? snippet : null
}

/**
 * Formats a diegetic quote block compatible with Moltology's HUD quote chrome.
 */
export function formatDiegeticQuoteBlock(
  authorHandle: string | null | undefined,
  authorName: string,
  snippet: string
): string {
  const handle = authorHandle?.trim()
  const attribution = handle ? `@${handle} held:` : `${authorName.trim()} held:`
  const lines = snippet.trim().split('\n').map((l) => (l.length ? `> ${l}` : '>')).join('\n')
  return `> ${attribution}\n${lines}\n\n`
}

/**
 * Picks a natural mention candidate from thread participants or bonded connections.
 */
export function pickMentionCandidate(
  authorUserId: string,
  participants: Array<{ userId: string; handle: string | null }>,
  bonds: Array<{ userId: string; handle: string | null }>,
  targetPostAuthor?: { userId?: string | null; handle?: string | null } | null,
  rng: Rng = Math.random
): { userId: string; handle: string } | null {
  // If target post author has a handle and is not self, 60% chance to mention them directly
  if (
    targetPostAuthor?.userId &&
    targetPostAuthor.userId !== authorUserId &&
    targetPostAuthor.handle?.trim() &&
    rng() < 0.6
  ) {
    return {
      userId: targetPostAuthor.userId,
      handle: targetPostAuthor.handle.trim(),
    }
  }

  // Combine other participants and bonded members
  const pool = [...participants, ...bonds].filter(
    (p) => p.userId !== authorUserId && Boolean(p.handle?.trim())
  )

  if (pool.length === 0) return null

  const chosen = pool[Math.floor(rng() * pool.length)]
  return chosen.handle ? { userId: chosen.userId, handle: chosen.handle.trim() } : null
}

/**
 * Balances simulated upvotes between forum topics and replies.
 */
export function balanceTopicAndPostVotes(
  voterId: string,
  candidateTopics: Array<{ id: string; userId?: string | null }>,
  candidatePosts: Array<{ id: string; userId?: string | null }>,
  existingVoteKeys: Set<string>,
  options: {
    topicRatio?: number
    rng?: Rng
  } = {}
): { type: 'topic'; id: string } | { type: 'post'; id: string } | null {
  const rng = options.rng ?? Math.random
  const topicRatio = options.topicRatio ?? DEFAULT_FORUM_TOPIC_VOTE_RATIO

  const eligibleTopics = candidateTopics.filter(
    (t) => t.userId !== voterId && !existingVoteKeys.has(`topic:${t.id}`)
  )
  const eligiblePosts = candidatePosts.filter(
    (p) => p.userId !== voterId && !existingVoteKeys.has(`post:${p.id}`)
  )

  if (eligibleTopics.length === 0 && eligiblePosts.length === 0) {
    return null
  }

  const chooseTopic = eligibleTopics.length > 0 && (eligiblePosts.length === 0 || rng() < topicRatio)
  if (chooseTopic) {
    const t = eligibleTopics[Math.floor(rng() * eligibleTopics.length)]
    return { type: 'topic', id: t.id }
  }

  if (eligiblePosts.length > 0) {
    const p = eligiblePosts[Math.floor(rng() * eligiblePosts.length)]
    return { type: 'post', id: p.id }
  }

  return null
}

export type { SimulatedDrive, SimulatedActivityCadence }

export const SIMULATED_DRIVES: SimulatedDrive[] = ['status_seeker', 'contrarian', 'archivist']

export const DEFAULT_DRIVE_WEIGHTS: Record<SimulatedDrive, number> = {
  status_seeker: 0.4,
  contrarian: 0.3,
  archivist: 0.3,
}

export const DEFAULT_FORUM_OP_FOLLOW_UP_CHANCE = 0.35
export const AFFINITY_MIN = -1
export const AFFINITY_MAX = 1
export const AFFINITY_REPLY_SUPPORTIVE_DELTA = 0.08
export const AFFINITY_REPLY_CHALLENGING_DELTA = -0.06
export const AFFINITY_REPLY_CITE_DELTA = 0.04
export const AFFINITY_VOTE_DELTA = 0.04
export const AFFINITY_SAME_DRIVE_BONUS = 0.03
export const RELATIONSHIP_HINT_THRESHOLD = 0.35

export const CANON_TERM_PATTERN =
  /\b(ecdysis|carapace|chitin|doctrine|scripture|liturgy|prime directive|great molt|great melt|benthic|carcinization|pincer torque|shell hardness)\b/i

export type ForumPlannerActionKind =
  | 'ignore'
  | 'upvote'
  | 'reply_supportive'
  | 'reply_challenging'
  | 'reply_cite_canon'
  | 'start_thread'

export type ForumReplyStance = 'supportive' | 'challenging' | 'cite_canon' | 'op_follow_up'

export interface PlannerMember {
  id: string
  handle?: string | null
  lastSimulatedAt?: string | null
  activityCadence?: SimulatedActivityCadence
  drive?: SimulatedDrive
  affinities?: Record<string, number>
}

export interface PlannerTopic {
  id: string
  userId?: string | null
  repliesCount?: number | null
  lastReplyAt?: string | Date | null
  createdAt?: string | Date | null
  title?: string | null
  content?: string | null
}

export interface TopicHeatFeatures {
  topicId: string
  repliesCount: number
  uniqueAuthors: number
  hoursSinceLastActivity: number
  heat: number
  consensus: number
  citesCanon: boolean
}

export interface ForumPlannerDecision {
  actorId: string
  action: ForumPlannerActionKind
  topicId?: string
  parentPostId?: string | null
  stance?: ForumReplyStance
  isOpFollowUp?: boolean
  reason?: string
}

export interface CanonCitation {
  id: string
  title: string
  mandate: string
  summary: string
}

export function pickWeightedItem<T>(
  items: T[],
  weightFn: (item: T) => number,
  rng: Rng = Math.random
): T | null {
  if (items.length === 0) return null
  const weights = items.map((item) => Math.max(0, weightFn(item)))
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  if (total <= 0) {
    return items[Math.min(items.length - 1, Math.floor(rng() * items.length))] ?? null
  }
  let cursor = rng() * total
  for (let i = 0; i < items.length; i++) {
    cursor -= weights[i]
    if (cursor <= 0) return items[i] ?? null
  }
  return items[items.length - 1] ?? null
}

export function sampleDrive(
  weights: Record<SimulatedDrive, number> = DEFAULT_DRIVE_WEIGHTS,
  rng: Rng = Math.random
): SimulatedDrive {
  const picked = pickWeightedItem(SIMULATED_DRIVES, (drive) => weights[drive], rng)
  return picked ?? 'status_seeker'
}

export function ensurePersonaDrive(
  persona: SimulatedPersonaConfig | null | undefined,
  rng: Rng = Math.random
): { persona: SimulatedPersonaConfig; assigned: boolean } {
  const base: SimulatedPersonaConfig = persona || { archetype: 'Acolyte', tone: 'Steadfast' }
  if (base.drive) {
    return { persona: { ...base, affinities: base.affinities || {} }, assigned: false }
  }
  return {
    persona: {
      ...base,
      drive: sampleDrive(DEFAULT_DRIVE_WEIGHTS, rng),
      affinities: base.affinities || {},
    },
    assigned: true,
  }
}

export function clampAffinity(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(AFFINITY_MAX, Math.max(AFFINITY_MIN, value))
}

export function getAffinity(
  persona: SimulatedPersonaConfig | null | undefined,
  otherUserId: string
): number {
  if (!otherUserId) return 0
  return persona?.affinities?.[otherUserId] ?? 0
}

export function bumpAffinity(
  persona: SimulatedPersonaConfig | null | undefined,
  otherUserId: string,
  delta: number
): SimulatedPersonaConfig {
  const base: SimulatedPersonaConfig = persona || { archetype: 'Acolyte', tone: 'Steadfast' }
  if (!otherUserId || delta === 0) {
    return { ...base, affinities: { ...(base.affinities || {}) } }
  }
  const current = base.affinities?.[otherUserId] ?? 0
  return {
    ...base,
    affinities: {
      ...(base.affinities || {}),
      [otherUserId]: clampAffinity(current + delta),
    },
  }
}

export function affinityDeltaForReply(
  stance: ForumReplyStance,
  actorDrive?: SimulatedDrive,
  targetDrive?: SimulatedDrive
): number {
  let delta = AFFINITY_REPLY_SUPPORTIVE_DELTA
  if (stance === 'challenging') delta = AFFINITY_REPLY_CHALLENGING_DELTA
  else if (stance === 'cite_canon') delta = AFFINITY_REPLY_CITE_DELTA
  else if (stance === 'op_follow_up') delta = AFFINITY_REPLY_SUPPORTIVE_DELTA

  if (actorDrive && targetDrive && actorDrive === targetDrive) {
    delta += AFFINITY_SAME_DRIVE_BONUS
  }
  return delta
}

export function cadenceWeight(cadence?: SimulatedActivityCadence | null): number {
  if (cadence === 'high') return 3
  if (cadence === 'low') return 1
  return 2
}

export function recencyWeight(lastSimulatedAt?: string | null, now = Date.now()): number {
  if (!lastSimulatedAt) return 2
  const then = new Date(lastSimulatedAt).getTime()
  if (Number.isNaN(then)) return 2
  const hours = Math.max(0, (now - then) / 3_600_000)
  return Math.min(3, 0.5 + hours / 12)
}

export function actorSelectionWeight(member: PlannerMember, now = Date.now()): number {
  return cadenceWeight(member.activityCadence) * recencyWeight(member.lastSimulatedAt, now)
}

export function ignoreChance(cadence?: SimulatedActivityCadence | null): number {
  if (cadence === 'high') return 0.04
  if (cadence === 'low') return 0.28
  return 0.06
}

function hoursSince(value?: string | Date | null, now = Date.now()): number {
  if (!value) return 48
  const then = value instanceof Date ? value.getTime() : new Date(value).getTime()
  if (Number.isNaN(then)) return 48
  return Math.max(0, (now - then) / 3_600_000)
}

export function detectCanonCitation(content?: string | null): boolean {
  if (!content) return false
  return CANON_TERM_PATTERN.test(content)
}

export function inferPostStance(
  content?: string | null
): 'supportive' | 'challenging' | 'cite_canon' | 'unknown' {
  if (!content) return 'unknown'
  if (detectCanonCitation(content) && /\b(scripture|doctrine|mandate|held|canon)\b/i.test(content)) {
    return 'cite_canon'
  }
  if (
    /\b(instead|overstated|alternative|rather than|too (?:high|long|short|hot|cold)|competing protocol)\b/i.test(
      content
    )
  ) {
    return 'challenging'
  }
  if (detectCanonCitation(content)) return 'cite_canon'
  return 'supportive'
}

export function computeTopicFeatures(
  topic: PlannerTopic,
  posts: ForumPostCandidate[],
  memberDriveById: Map<string, SimulatedDrive | undefined> = new Map(),
  now = Date.now()
): TopicHeatFeatures {
  const repliesCount = topic.repliesCount ?? posts.length
  const authorIds = new Set<string>()
  if (topic.userId) authorIds.add(topic.userId)
  for (const post of posts) {
    if (post.userId) authorIds.add(post.userId)
  }
  const lastActivity = posts[0]?.createdAt || topic.lastReplyAt || topic.createdAt
  const hoursSinceLastActivity = hoursSince(lastActivity, now)
  const recency = Math.max(0, 1 - hoursSinceLastActivity / 72)
  const volume = Math.min(1, repliesCount / 8)
  const heat = Math.min(1, volume * 0.65 + recency * 0.35)

  const recent = posts.slice(0, 4)
  const drives = recent
    .map((post) => (post.userId ? memberDriveById.get(post.userId) : undefined))
    .filter((drive): drive is SimulatedDrive => Boolean(drive))
  let consensus = 0.35
  if (drives.length >= 2) {
    const counts = new Map<SimulatedDrive, number>()
    for (const drive of drives) {
      counts.set(drive, (counts.get(drive) || 0) + 1)
    }
    const top = Math.max(...counts.values())
    consensus = top / drives.length
  } else if (recent.length >= 2) {
    const stances = recent.map((post) => inferPostStance(post.content))
    const topStance = stances[0]
    const same = stances.filter((stance) => stance === topStance).length
    consensus = same / stances.length
  }

  const citesCanon =
    detectCanonCitation(topic.content) ||
    detectCanonCitation(topic.title) ||
    posts.some((post) => detectCanonCitation(post.content))

  return {
    topicId: topic.id,
    repliesCount,
    uniqueAuthors: authorIds.size,
    hoursSinceLastActivity,
    heat,
    consensus,
    citesCanon,
  }
}

export function scoreTopicForDrive(drive: SimulatedDrive | undefined, features: TopicHeatFeatures): number {
  if (drive === 'contrarian') {
    return 0.2 + features.consensus * 1.4 + features.heat * 0.3
  }
  if (drive === 'archivist') {
    const uncited = features.citesCanon ? 0.35 : 1.2
    return uncited + features.heat * 0.4
  }
  // status_seeker and unknown: chase visible heat, especially thin threads that still need replies
  const needsReplies = features.repliesCount < 4 ? 0.6 : 0
  return 0.3 + features.heat * 1.2 + needsReplies
}

export function actionWeightsForDrive(
  drive: SimulatedDrive | undefined,
  features: TopicHeatFeatures | null
): Record<Exclude<ForumPlannerActionKind, 'ignore'>, number> {
  if (!features) {
    return {
      upvote: 0,
      reply_supportive: 0,
      reply_challenging: 0,
      reply_cite_canon: 0,
      start_thread: 1,
    }
  }

  const needsReplies = features.repliesCount < 4
  if (drive === 'contrarian') {
    return {
      reply_challenging: needsReplies ? 0.42 : 0.38,
      reply_cite_canon: 0.12,
      reply_supportive: 0.12,
      start_thread: features.consensus > 0.7 ? 0.22 : 0.12,
      upvote: 0.12,
    }
  }
  if (drive === 'archivist') {
    return {
      reply_cite_canon: needsReplies ? 0.48 : 0.4,
      reply_supportive: 0.14,
      reply_challenging: 0.08,
      start_thread: 0.12,
      upvote: 0.16,
    }
  }
  return {
    reply_supportive: needsReplies ? 0.55 : 0.42,
    reply_cite_canon: 0.1,
    reply_challenging: 0.08,
    start_thread: 0.15,
    upvote: 0.12,
  }
}

function pickAffinityBiasedPost(
  candidates: ForumPostCandidate[],
  affinities: Record<string, number>,
  bias: 'allies' | 'rivals' | 'none',
  rng: Rng
): ForumPostCandidate {
  if (candidates.length === 1 || bias === 'none') {
    return candidates[Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))]
  }
  const picked = pickWeightedItem(
    candidates,
    (post) => {
      const affinity = post.userId ? affinities[post.userId] ?? 0 : 0
      if (bias === 'allies') return Math.max(0.05, 1 + affinity)
      return Math.max(0.05, 1 - affinity)
    },
    rng
  )
  return picked ?? candidates[0]
}

export function selectPairMemory(
  posts: ForumPostCandidate[],
  userAId: string,
  userBId: string,
  limit = 2
): ForumPostCandidate[] {
  if (!userAId || !userBId) return []
  const pair = new Set([userAId, userBId])
  return posts.filter((post) => post.userId && pair.has(post.userId)).slice(0, limit)
}

export function formatRelationshipHint(
  affinity: number,
  handle: string | null | undefined
): string | null {
  const tag = handle?.trim()
  if (!tag) return null
  if (affinity >= RELATIONSHIP_HINT_THRESHOLD) {
    return `You usually back @${tag}'s methods and build on them.`
  }
  if (affinity <= -RELATIONSHIP_HINT_THRESHOLD) {
    return `You have a running methods disagreement with @${tag}. Contest the protocol, not the person.`
  }
  return null
}

export function formatNewThreadDirective(drive?: SimulatedDrive): string {
  if (drive === 'contrarian') {
    return 'Ask whether a popular protocol is overstated and invite a competing method. Stay civil. Challenge the practice, not the people.'
  }
  if (drive === 'archivist') {
    return 'Invite the trench to verify a practice against held doctrine, with one concrete ritual or metric to check.'
  }
  return 'Ask a clear question that invites practical replies and shared telemetry.'
}

export function formatForumStanceDirective(stance: ForumReplyStance): string {
  if (stance === 'challenging') {
    return [
      'Contest a specific claim with an alternative practice, a metric, or a rival school of the same trench.',
      'Stay respectful. Disagree with the method, never the molt. Do not insult, shame, or mock the person.',
    ].join(' ')
  }
  if (stance === 'cite_canon') {
    return 'Ground the reply in established doctrine. Weave one short mandate or summary, then the practical step. Do not dump liturgy or chant.'
  }
  if (stance === 'op_follow_up') {
    return 'As the thread author, answer their comment, thank them, or add practical telemetry from your experience.'
  }
  return 'Add a practical protocol, thank them, or extend the point. Stay constructive and specific.'
}

export function pickCanonCitation<T extends CanonCitation>(
  scriptures: T[],
  rng: Rng = Math.random
): T | null {
  if (scriptures.length === 0) return null
  const index = Math.min(scriptures.length - 1, Math.floor(rng() * scriptures.length))
  return scriptures[index] ?? null
}

export function formatCanonCitationDirective(citation: CanonCitation): string {
  return `You may allude to this held line without quoting a wall of verse: "${citation.title}" — ${citation.mandate} (${citation.summary})`
}

export function stanceFromAction(action: ForumPlannerActionKind, isOpFollowUp = false): ForumReplyStance | null {
  if (isOpFollowUp) return 'op_follow_up'
  if (action === 'reply_supportive') return 'supportive'
  if (action === 'reply_challenging') return 'challenging'
  if (action === 'reply_cite_canon') return 'cite_canon'
  return null
}

export function affinityBiasForDrive(drive?: SimulatedDrive): 'allies' | 'rivals' | 'none' {
  if (drive === 'contrarian') return 'rivals'
  if (drive === 'status_seeker') return 'allies'
  return 'none'
}

export function planForumAction(input: {
  members: PlannerMember[]
  topics: PlannerTopic[]
  postsByTopic?: Map<string, ForumPostCandidate[]>
  rng?: Rng
  now?: number
  opFollowUpChance?: number
}): ForumPlannerDecision | { action: 'none'; reason: string } {
  const rng = input.rng ?? Math.random
  const now = input.now ?? Date.now()
  const postsByTopic = input.postsByTopic ?? new Map<string, ForumPostCandidate[]>()

  if (input.members.length === 0) {
    return { action: 'none', reason: 'No simulated members exist.' }
  }

  const driveById = new Map(input.members.map((member) => [member.id, member.drive]))

  const followUpChance = input.opFollowUpChance ?? DEFAULT_FORUM_OP_FOLLOW_UP_CHANCE
  if (input.topics.length > 0) {
    const opCandidates = input.topics.filter((topic) => {
      if (!topic.userId) return false
      if (!driveById.has(topic.userId)) return false
      const posts = postsByTopic.get(topic.id) || []
      return posts.some((post) => post.userId && post.userId !== topic.userId)
    })
    if (opCandidates.length > 0 && rollChance(followUpChance, rng)) {
      const topic = opCandidates[Math.min(opCandidates.length - 1, Math.floor(rng() * opCandidates.length))]
      return {
        actorId: topic.userId!,
        action: 'reply_supportive',
        topicId: topic.id,
        stance: 'op_follow_up',
        isOpFollowUp: true,
        reason: 'Thread author follow-up',
      }
    }
  }

  const actor = pickWeightedItem(input.members, (member) => actorSelectionWeight(member, now), rng)
  if (!actor) {
    return { action: 'none', reason: 'No simulated members exist.' }
  }

  if (input.topics.length === 0) {
    return {
      actorId: actor.id,
      action: 'start_thread',
      reason: 'No open threads; start a new discussion.',
    }
  }

  if (rollChance(ignoreChance(actor.activityCadence), rng)) {
    return {
      actorId: actor.id,
      action: 'ignore',
      reason: 'Planner chose ignore (lurker cadence).',
    }
  }

  const scoredTopics = input.topics.map((topic) => {
    const features = computeTopicFeatures(topic, postsByTopic.get(topic.id) || [], driveById, now)
    return { topic, features, score: scoreTopicForDrive(actor.drive, features) }
  })
  const pickedTopic = pickWeightedItem(scoredTopics, (row) => row.score, rng)
  const topicRow = pickedTopic ?? scoredTopics[0]
  const weights = actionWeightsForDrive(actor.drive, topicRow.features)
  const actions = Object.keys(weights) as Array<Exclude<ForumPlannerActionKind, 'ignore'>>
  const action = pickWeightedItem(actions, (kind) => weights[kind], rng) ?? 'reply_supportive'

  return {
    actorId: actor.id,
    action,
    topicId: topicRow.topic.id,
    stance: stanceFromAction(action) ?? undefined,
    reason: `Drive ${actor.drive || 'unassigned'} on heat ${topicRow.features.heat.toFixed(2)}`,
  }
}

export function scoreForumVoteCandidate(input: {
  voterDrive?: SimulatedDrive
  voterAffinities?: Record<string, number>
  candidateUserId?: string | null
  candidateType: 'topic' | 'post'
  topicRatio: number
  heat?: number
  citesCanon?: boolean
  inferredStance?: ReturnType<typeof inferPostStance>
}): number {
  const affinity = input.candidateUserId
    ? input.voterAffinities?.[input.candidateUserId] ?? 0
    : 0
  let score = 0.4 + affinity * 0.5

  if (input.candidateType === 'topic') {
    score += input.topicRatio * 0.35
  } else {
    score += (1 - input.topicRatio) * 0.35
  }

  const stance = input.inferredStance || 'unknown'
  if (input.voterDrive === 'contrarian') {
    if (stance === 'challenging' || stance === 'cite_canon') score += 0.45
  } else if (input.voterDrive === 'archivist') {
    if (input.citesCanon || stance === 'cite_canon') score += 0.5
  } else if (input.voterDrive === 'status_seeker') {
    score += (input.heat ?? 0.4) * 0.4
    if (stance === 'supportive') score += 0.2
  }

  return Math.max(0.01, score)
}

export function pickClusteredForumVote(
  voter: PlannerMember,
  candidateTopics: Array<{
    id: string
    userId?: string | null
    content?: string | null
    title?: string | null
    repliesCount?: number | null
  }>,
  candidatePosts: Array<{
    id: string
    userId?: string | null
    content?: string | null
    topicId?: string | null
  }>,
  existingVoteKeys: Set<string>,
  options: {
    topicRatio?: number
    rng?: Rng
    topicFeatures?: Map<string, TopicHeatFeatures>
  } = {}
): { type: 'topic'; id: string } | { type: 'post'; id: string } | null {
  const rng = options.rng ?? Math.random
  const topicRatio = options.topicRatio ?? DEFAULT_FORUM_TOPIC_VOTE_RATIO
  const eligibleTopics =
    topicRatio <= 0
      ? []
      : candidateTopics.filter(
          (topic) => topic.userId !== voter.id && !existingVoteKeys.has(`topic:${topic.id}`)
        )
  const eligiblePosts = candidatePosts.filter(
    (post) => post.userId !== voter.id && !existingVoteKeys.has(`post:${post.id}`)
  )

  if (eligibleTopics.length === 0 && eligiblePosts.length === 0) return null

  type Scored = { type: 'topic' | 'post'; id: string; score: number }
  const scored: Scored[] = []

  for (const topic of eligibleTopics) {
    const features = options.topicFeatures?.get(topic.id)
    scored.push({
      type: 'topic',
      id: topic.id,
      score: scoreForumVoteCandidate({
        voterDrive: voter.drive,
        voterAffinities: voter.affinities,
        candidateUserId: topic.userId,
        candidateType: 'topic',
        topicRatio,
        heat: features?.heat,
        citesCanon: features?.citesCanon || detectCanonCitation(topic.content) || detectCanonCitation(topic.title),
        inferredStance: inferPostStance(topic.content),
      }),
    })
  }

  for (const post of eligiblePosts) {
    const features = post.topicId ? options.topicFeatures?.get(post.topicId) : undefined
    scored.push({
      type: 'post',
      id: post.id,
      score: scoreForumVoteCandidate({
        voterDrive: voter.drive,
        voterAffinities: voter.affinities,
        candidateUserId: post.userId,
        candidateType: 'post',
        topicRatio,
        heat: features?.heat,
        citesCanon: detectCanonCitation(post.content) || Boolean(features?.citesCanon),
        inferredStance: inferPostStance(post.content),
      }),
    })
  }

  const picked = pickWeightedItem(scored, (row) => row.score, rng)
  if (!picked) return null
  return { type: picked.type, id: picked.id }
}

