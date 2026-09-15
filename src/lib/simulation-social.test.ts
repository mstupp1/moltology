import { describe, it, expect } from 'vitest'
import {
  SIMULATED_TRAIT_CATALOG,
  applyTraitMutation,
  bondPairKey,
  chooseBondForPair,
  formatPersonaVoiceBlock,
  friendshipPairKey,
  normalizeBondEndpoints,
  pickNewTrait,
  pickUnconnectedPair,
  pickWeightedSponsor,
  presentBondLabel,
  presentJoinStory,
  rollChance,
  sampleJoinOrigin,
  calculatePostDepth,
  chooseForumReplyTarget,
  extractQuoteSnippet,
  formatDiegeticQuoteBlock,
  pickMentionCandidate,
  balanceTopicAndPostVotes,
  sampleDrive,
  ensurePersonaDrive,
  clampAffinity,
  bumpAffinity,
  getAffinity,
  affinityDeltaForReply,
  cadenceWeight,
  ignoreChance,
  computeTopicFeatures,
  scoreTopicForDrive,
  actionWeightsForDrive,
  planForumAction,
  formatForumStanceDirective,
  formatNewThreadDirective,
  formatRelationshipHint,
  pickCanonCitation,
  formatCanonCitationDirective,
  pickClusteredForumVote,
  scoreForumVoteCandidate,
  detectCanonCitation,
  inferPostStance,
  selectPairMemory,
} from './simulation-social'

describe('simulation social helpers', () => {
  describe('rollChance', () => {
    it('returns false at 0 and true at 1', () => {
      expect(rollChance(0, () => 0)).toBe(false)
      expect(rollChance(1, () => 0.99)).toBe(true)
    })

    it('treats the roll as a mild probability gate', () => {
      expect(rollChance(0.12, () => 0.11)).toBe(true)
      expect(rollChance(0.12, () => 0.12)).toBe(false)
    })
  })

  describe('pickNewTrait', () => {
    it('skips traits the member already has', () => {
      const taken = SIMULATED_TRAIT_CATALOG.slice(0, -1).map((trait) => trait.id)
      const last = SIMULATED_TRAIT_CATALOG[SIMULATED_TRAIT_CATALOG.length - 1]
      expect(pickNewTrait(taken, SIMULATED_TRAIT_CATALOG, () => 0)).toEqual(last)
    })

    it('returns null when the catalog is exhausted', () => {
      const taken = SIMULATED_TRAIT_CATALOG.map((trait) => trait.id)
      expect(pickNewTrait(taken)).toBeNull()
    })
  })

  describe('applyTraitMutation', () => {
    it('appends a unique trait onto the persona', () => {
      const next = applyTraitMutation(
        { archetype: 'Pilot', tone: 'Direct' },
        SIMULATED_TRAIT_CATALOG[0],
        '2026-09-06T00:00:00.000Z'
      )
      expect(next.traits).toHaveLength(1)
      expect(next.traits?.[0]?.id).toBe(SIMULATED_TRAIT_CATALOG[0].id)
      expect(next.archetype).toBe('Pilot')
    })
  })

  describe('sampleJoinOrigin', () => {
    it('forces organic when nobody can sponsor a newcomer', () => {
      expect(sampleJoinOrigin(0, undefined, () => 0.99)).toEqual({
        source: 'organic',
        needsSponsor: false,
      })
    })

    it('rolls word of mouth and brought-in when sponsors exist', () => {
      expect(sampleJoinOrigin(3, undefined, () => 0.1)).toEqual({
        source: 'organic',
        needsSponsor: false,
      })
      expect(sampleJoinOrigin(3, undefined, () => 0.5)).toEqual({
        source: 'word_of_mouth',
        needsSponsor: true,
      })
      expect(sampleJoinOrigin(3, undefined, () => 0.95)).toEqual({
        source: 'brought_in',
        needsSponsor: true,
      })
    })
  })

  describe('pickWeightedSponsor', () => {
    it('prefers higher-stage members', () => {
      const members = [
        { id: 'larva', stage: 1 },
        { id: 'elder', stage: 4 },
      ]
      // total weight 5; roll 0.8 * 5 = 4 → skip larva (1) then land on elder
      expect(pickWeightedSponsor(members, () => 0.8)?.id).toBe('elder')
    })
  })

  describe('pairs and bonds', () => {
    it('normalizes friendship keys', () => {
      expect(friendshipPairKey('b', 'a')).toBe('a|b')
    })

    it('picks an unconnected pair and skips existing friendships', () => {
      const members = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
      const pair = pickUnconnectedPair(members, ['a|b'], () => 0)
      expect(pair?.map((row) => row.id)).toEqual(['a', 'c'])
    })

    it('returns null when everyone is already connected', () => {
      const members = [{ id: 'a' }, { id: 'b' }]
      expect(pickUnconnectedPair(members, ['a|b'])).toBeNull()
    })

    it('stores nest-mates in lex order and keeps mentor direction', () => {
      expect(normalizeBondEndpoints('nest_mate', 'b', 'a')).toEqual({
        fromUserId: 'a',
        toUserId: 'b',
      })
      expect(normalizeBondEndpoints('mentor', 'elder', 'larva')).toEqual({
        fromUserId: 'elder',
        toUserId: 'larva',
      })
      expect(bondPairKey('nest_mate', 'b', 'a')).toBe('nest_mate:a|b')
    })

    it('chooses mentor when stages differ and nest-mate when they match', () => {
      const mentor = chooseBondForPair({ id: 'a', stage: 3 }, { id: 'b', stage: 1 })
      expect(mentor).toEqual({
        kind: 'mentor',
        from: { id: 'a', stage: 3 },
        to: { id: 'b', stage: 1 },
      })
      const nest = chooseBondForPair({ id: 'c', stage: 2 }, { id: 'b', stage: 2 })
      expect(nest.kind).toBe('nest_mate')
      expect(nest.from.id).toBe('b')
      expect(nest.to.id).toBe('c')
    })
  })

  describe('copy', () => {
    it('renders join stories without an organic line', () => {
      expect(presentJoinStory('organic', 'Vaelen')).toBeNull()
      expect(presentJoinStory('word_of_mouth', 'Architect Vaelen')).toBe(
        'Heard about the Order from Architect Vaelen'
      )
      expect(presentJoinStory('brought_in', 'High Ascendant Kaelith')).toBe(
        'Brought in by High Ascendant Kaelith'
      )
    })

    it('renders bond labels from each side', () => {
      expect(presentBondLabel('nest_mate', 'ReefCrafter', true)).toBe('Nest-mate of ReefCrafter')
      expect(presentBondLabel('mentor', 'Larva Unit #8971', true)).toBe('Mentoring Larva Unit #8971')
      expect(presentBondLabel('mentor', 'Architect Vaelen', false)).toBe('Learning from Architect Vaelen')
      expect(presentBondLabel('brought_in', 'ChitinForge_42', true)).toBe('Brought ChitinForge_42 in')
    })

    it('includes traits in the forum voice block', () => {
      const block = formatPersonaVoiceBlock({
        archetype: 'Pilot',
        tone: 'Direct',
        traits: [{ id: 'dry_trench_wit', label: 'Dry-trench wit', description: 'Deadpan.' }],
      })
      expect(block).toContain('Persona Archetype: Pilot')
      expect(block).toContain('Distinct traits: Dry-trench wit')
    })
  })

  describe('forum simulation helpers', () => {
    const sampleTopic = {
      id: 'topic-1',
      userId: 'op-user',
      authorName: 'Op Author',
      authorHandle: 'OpHandle',
      title: 'Optimal Cold Plunge Protocols',
      content: 'What submergence temperatures yield the highest baseline recovery?',
    }

    it('calculatePostDepth measures tree depth correctly', () => {
      const parentMap = new Map<string, string | null>([
        ['post-1', null],
        ['post-2', 'post-1'],
        ['post-3', 'post-2'],
      ])
      expect(calculatePostDepth('post-1', parentMap)).toBe(0)
      expect(calculatePostDepth('post-2', parentMap)).toBe(1)
      expect(calculatePostDepth('post-3', parentMap)).toBe(2)
    })

    it('chooseForumReplyTarget returns top-level when no posts exist', () => {
      const target = chooseForumReplyTarget(sampleTopic, [], 'other-user')
      expect(target.parentId).toBeNull()
      expect(target.targetPost).toBeNull()
      expect(target.isOpFollowUp).toBe(false)
    })

    it('chooseForumReplyTarget triggers OP follow-up to commenter', () => {
      const posts = [
        {
          id: 'post-1',
          userId: 'commenter-user',
          authorName: 'Commenter',
          authorHandle: 'CommenterHandle',
          content: 'I run 48F for 3 minutes.',
        },
      ]
      // When OP replies, they target the commenter
      const target = chooseForumReplyTarget(sampleTopic, posts, 'op-user')
      expect(target.isOpFollowUp).toBe(true)
      expect(target.parentId).toBe('post-1')
      expect(target.targetPost?.id).toBe('post-1')
    })

    it('chooseForumReplyTarget respects maxDepth boundary', () => {
      // Chain of depth 4: p1 (0) -> p2 (1) -> p3 (2) -> p4 (3) -> p5 (4)
      const posts = [
        { id: 'p1', userId: 'u1', parentId: null, content: 'Root' },
        { id: 'p2', userId: 'u2', parentId: 'p1', content: 'Depth 1' },
        { id: 'p3', userId: 'u3', parentId: 'p2', content: 'Depth 2' },
        { id: 'p4', userId: 'u4', parentId: 'p3', content: 'Depth 3' },
        { id: 'p5', userId: 'u5', parentId: 'p4', content: 'Depth 4' },
      ]
      // maxDepth = 4. A reply to p5 would have depth 5 (too deep).
      // So chooseForumReplyTarget should NEVER pick p5.
      for (let i = 0; i < 20; i++) {
        const target = chooseForumReplyTarget(sampleTopic, posts, 'u-new', {
          maxDepth: 4,
          nestedChance: 1.0,
        })
        expect(target.parentId).not.toBe('p5')
      }
    })

    it('extractQuoteSnippet extracts clean 1-2 sentence excerpts without blockquotes', () => {
      const raw = `> @Someone held:
> Old quote line here.

Mastering the 06:00 Priority Pincer Lock was the turning point. It stabilized my torque by 18% in three days. After that, cold plunges felt natural.`

      const snippet = extractQuoteSnippet(raw, 160)
      expect(snippet).not.toBeNull()
      expect(snippet).not.toContain('Old quote line')
      expect(snippet).toContain('Mastering the 06:00 Priority Pincer Lock')
    })

    it('formatDiegeticQuoteBlock formats with author handle attribution', () => {
      const block = formatDiegeticQuoteBlock(
        'Vaelen',
        'Architect Vaelen',
        'Priority Pincer Lock was the turning point.'
      )
      expect(block).toBe(
        '> @Vaelen held:\n> Priority Pincer Lock was the turning point.\n\n'
      )
    })

    it('pickMentionCandidate selects target post author or participant', () => {
      const mention = pickMentionCandidate(
        'user-a',
        [{ userId: 'user-b', handle: 'UserB' }],
        [{ userId: 'user-c', handle: 'UserC' }],
        { userId: 'user-b', handle: 'UserB' },
        () => 0.1 // < 0.6 triggers target author
      )
      expect(mention).toEqual({ userId: 'user-b', handle: 'UserB' })
    })

    it('balanceTopicAndPostVotes balances between topics and posts', () => {
      const topics = [{ id: 't1', userId: 'other-1' }]
      const posts = [{ id: 'p1', userId: 'other-2' }]
      const existing = new Set<string>()

      // Low roll chooses topic
      const topicVote = balanceTopicAndPostVotes('voter-1', topics, posts, existing, {
        topicRatio: 0.5,
        rng: () => 0.2,
      })
      expect(topicVote).toEqual({ type: 'topic', id: 't1' })

      // High roll chooses post
      const postVote = balanceTopicAndPostVotes('voter-1', topics, posts, existing, {
        topicRatio: 0.5,
        rng: () => 0.8,
      })
      expect(postVote).toEqual({ type: 'post', id: 'p1' })
    })
  })

  describe('drives, affinities, and planner', () => {
    it('samples drives from the configured weights', () => {
      expect(sampleDrive(undefined, () => 0.1)).toBe('status_seeker')
      expect(sampleDrive(undefined, () => 0.5)).toBe('contrarian')
      expect(sampleDrive(undefined, () => 0.95)).toBe('archivist')
    })

    it('assigns a drive only when missing', () => {
      const assigned = ensurePersonaDrive({ archetype: 'Pilot', tone: 'Direct' }, () => 0.1)
      expect(assigned.assigned).toBe(true)
      expect(assigned.persona.drive).toBe('status_seeker')
      expect(assigned.persona.affinities).toEqual({})

      const kept = ensurePersonaDrive(
        { archetype: 'Pilot', tone: 'Direct', drive: 'contrarian', affinities: { x: 0.2 } },
        () => 0.1
      )
      expect(kept.assigned).toBe(false)
      expect(kept.persona.drive).toBe('contrarian')
      expect(kept.persona.affinities).toEqual({ x: 0.2 })
    })

    it('clamps affinity updates', () => {
      expect(clampAffinity(2)).toBe(1)
      expect(clampAffinity(-4)).toBe(-1)
      const next = bumpAffinity({ archetype: 'Pilot', tone: 'Direct' }, 'rival', -0.6)
      expect(getAffinity(next, 'rival')).toBe(-0.6)
      const clamped = bumpAffinity(next, 'rival', -0.8)
      expect(getAffinity(clamped, 'rival')).toBe(-1)
    })

    it('uses a negative delta for challenging replies and a same-drive bonus', () => {
      expect(affinityDeltaForReply('challenging')).toBe(-0.06)
      expect(affinityDeltaForReply('supportive', 'archivist', 'archivist')).toBeCloseTo(0.11)
    })

    it('gives low-cadence members a higher ignore chance', () => {
      expect(cadenceWeight('high')).toBe(3)
      expect(ignoreChance('low')).toBeGreaterThan(ignoreChance('normal'))
      expect(ignoreChance('normal')).toBeLessThan(0.1)
    })

    it('scores heat for status seekers and consensus for contrarians', () => {
      const hot = computeTopicFeatures(
        { id: 't1', repliesCount: 6, lastReplyAt: new Date() },
        [
          { id: 'p1', userId: 'a', content: 'Cold plunge at 48F held my torque.' },
          { id: 'p2', userId: 'b', content: 'Same protocol, same result.' },
        ],
        new Map([
          ['a', 'status_seeker'],
          ['b', 'status_seeker'],
        ])
      )
      expect(hot.heat).toBeGreaterThan(0.3)
      expect(hot.consensus).toBeGreaterThan(0.5)
      expect(scoreTopicForDrive('contrarian', hot)).toBeGreaterThan(scoreTopicForDrive('status_seeker', hot))
    })

    it('weights challenging replies highest for contrarians on consensus threads', () => {
      const weights = actionWeightsForDrive('contrarian', {
        topicId: 't1',
        repliesCount: 3,
        uniqueAuthors: 3,
        hoursSinceLastActivity: 2,
        heat: 0.6,
        consensus: 0.9,
        citesCanon: false,
      })
      expect(weights.reply_challenging).toBeGreaterThan(weights.reply_supportive)
      expect(weights.reply_challenging).toBeGreaterThan(weights.upvote)
    })

    it('plans a supportive reply for a status seeker when a thin thread is open', () => {
      const decision = planForumAction({
        members: [
          {
            id: 'seeker',
            drive: 'status_seeker',
            activityCadence: 'high',
            affinities: {},
          },
        ],
        topics: [{ id: 'topic-1', userId: 'other', repliesCount: 1, lastReplyAt: new Date() }],
        postsByTopic: new Map([
          ['topic-1', [{ id: 'p1', userId: 'other', content: 'Any tips on first light liturgy?' }]],
        ]),
        rng: () => 0.1,
      })
      expect(decision.action).toBe('reply_supportive')
      if (decision.action !== 'none') {
        expect(decision.actorId).toBe('seeker')
        expect(decision.topicId).toBe('topic-1')
      }
    })

    it('lets low-cadence lurkers ignore an existing thread', () => {
      const decision = planForumAction({
        members: [
          {
            id: 'lurker',
            drive: 'archivist',
            activityCadence: 'low',
            affinities: {},
          },
        ],
        topics: [{ id: 'topic-1', userId: 'other', repliesCount: 5, lastReplyAt: new Date() }],
        rng: () => 0.2,
      })
      expect(decision.action).toBe('ignore')
    })

    it('starts a thread when the board is empty', () => {
      const decision = planForumAction({
        members: [{ id: 'seeker', drive: 'status_seeker', activityCadence: 'normal' }],
        topics: [],
        rng: () => 0.99,
      })
      expect(decision.action).toBe('start_thread')
    })

    it('builds civil stance and relationship prompt fragments without naming drives', () => {
      const challenging = formatForumStanceDirective('challenging')
      expect(challenging).toContain('Contest a specific claim')
      expect(challenging).toContain('never the molt')
      expect(challenging).not.toContain('status_seeker')
      expect(formatNewThreadDirective('contrarian')).toContain('overstated')
      expect(formatRelationshipHint(-0.5, 'Vaelen')).toContain('@Vaelen')
      expect(formatRelationshipHint(-0.5, 'Vaelen')).toContain('protocol, not the person')
      expect(formatRelationshipHint(0.1, 'Vaelen')).toBeNull()
    })

    it('formats a short canon citation directive', () => {
      const citation = pickCanonCitation(
        [
          {
            id: 'SCR-001',
            title: 'The Prime Directive',
            mandate: 'Flesh melts. The shell endures.',
            summary: 'The founding proclamation.',
          },
        ],
        () => 0
      )
      expect(citation?.title).toBe('The Prime Directive')
      const directive = formatCanonCitationDirective(citation!)
      expect(directive).toContain('The Prime Directive')
      expect(directive).not.toContain('status_seeker')
    })

    it('detects canon terms and infers challenging stance from method disagreement', () => {
      expect(detectCanonCitation('The carapace held after ecdysis.')).toBe(true)
      expect(inferPostStance('Try 3 minutes instead of 8; that protocol is overstated.')).toBe(
        'challenging'
      )
    })

    it('clusters votes toward same-drive challenging posts for contrarians', () => {
      const vote = pickClusteredForumVote(
        { id: 'voter', drive: 'contrarian', affinities: { rival: -0.2 } },
        [{ id: 't1', userId: 'other', content: 'Everyone agrees 8 minutes is the only way.' }],
        [
          {
            id: 'p-challenge',
            userId: 'rival',
            content: 'That duration is overstated; try 3 minutes instead.',
            topicId: 't1',
          },
          {
            id: 'p-support',
            userId: 'ally',
            content: 'Yes, 8 minutes worked for me too.',
            topicId: 't1',
          },
        ],
        new Set(),
        { topicRatio: 0, rng: () => 0.1 }
      )
      expect(vote).toEqual({ type: 'post', id: 'p-challenge' })
    })

    it('scores canon-citing posts higher for archivists', () => {
      const canonScore = scoreForumVoteCandidate({
        voterDrive: 'archivist',
        candidateType: 'post',
        topicRatio: 0.45,
        citesCanon: true,
        inferredStance: 'cite_canon',
      })
      const genericScore = scoreForumVoteCandidate({
        voterDrive: 'archivist',
        candidateType: 'post',
        topicRatio: 0.45,
        citesCanon: false,
        inferredStance: 'supportive',
      })
      expect(canonScore).toBeGreaterThan(genericScore)
    })

    it('retrieves the recent exchange between two members', () => {
      const memory = selectPairMemory(
        [
          { id: 'p1', userId: 'a', content: 'I run 48F.' },
          { id: 'p2', userId: 'c', content: 'Unrelated.' },
          { id: 'p3', userId: 'b', content: 'I would go colder.' },
        ],
        'a',
        'b',
        2
      )
      expect(memory.map((row) => row.id)).toEqual(['p1', 'p3'])
    })

    it('biases nested replies toward rivals for contrarians', () => {
      const posts = [
        { id: 'ally-post', userId: 'ally', content: 'Keep the long plunge.' },
        { id: 'rival-post', userId: 'rival', content: 'Short plunge only.' },
      ]
      const target = chooseForumReplyTarget(
        {
          id: 'topic-1',
          userId: 'op',
          authorName: 'Op',
          title: 'Plunge length',
          content: 'How long?',
        },
        posts,
        'contrarian',
        {
          nestedChance: 1,
          affinityBias: 'rivals',
          affinities: { ally: 0.8, rival: -0.7 },
          rng: () => 0.5,
        }
      )
      expect(target.parentId).toBe('rival-post')
    })
  })
})

