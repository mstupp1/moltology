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
})
