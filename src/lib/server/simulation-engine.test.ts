import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  assertAiGatewayKey,
  sampleStage,
  getTieredSpawnProbability,
  calculateTasksForStage,
  generateSimulatedPersona,
  spawnSimulatedUser,
  simulateDailyRoutines,
  simulateForumActivity,
  simulateForumReactions,
  mutateSimulatedPersona,
  simulateConnections,
  simulateRelationships,
  DEFAULT_GROWTH_CONFIG,
} from './simulation-engine'
import { CANONICAL_ALIGNMENT_TASKS } from '../alignment-tasks'
import { profiles, forumTopics, forumPosts } from '../../db/schema'

vi.mock('ai', () => ({
  generateText: vi.fn(),
}))

vi.mock('./activity-log', () => ({
  recordRoutineCompletedEvent: vi.fn().mockResolvedValue(undefined),
}))

describe('Simulation Engine', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('assertAiGatewayKey', () => {
    it('throws error immediately if AI_GATEWAY_API_KEY is missing or empty', () => {
      delete process.env.AI_GATEWAY_API_KEY
      expect(() => assertAiGatewayKey()).toThrowError(/AI_GATEWAY_API_KEY is missing/)

      process.env.AI_GATEWAY_API_KEY = '   '
      expect(() => assertAiGatewayKey()).toThrowError(/AI_GATEWAY_API_KEY is missing/)
    })

    it('returns trimmed key when present', () => {
      process.env.AI_GATEWAY_API_KEY = 'test-key-123  '
      expect(assertAiGatewayKey()).toBe('test-key-123')
    })
  })

  describe('sampleStage', () => {
    it('returns stage 1, 2, 3, or 4', () => {
      const weights = DEFAULT_GROWTH_CONFIG.stageWeights
      for (let i = 0; i < 100; i++) {
        const stage = sampleStage(weights)
        expect([1, 2, 3, 4]).toContain(stage)
      }
    })

    it('respects pyramid distribution weighting', () => {
      const mockMath = vi.spyOn(Math, 'random')
      const weights = { stage1: 0.6, stage2: 0.25, stage3: 0.12, stage4: 0.03 }

      mockMath.mockReturnValueOnce(0.1) // < 0.60
      expect(sampleStage(weights)).toBe(1)

      mockMath.mockReturnValueOnce(0.65) // 0.60 to 0.85
      expect(sampleStage(weights)).toBe(2)

      mockMath.mockReturnValueOnce(0.9) // 0.85 to 0.97
      expect(sampleStage(weights)).toBe(3)

      mockMath.mockReturnValueOnce(0.98) // >= 0.97
      expect(sampleStage(weights)).toBe(4)

      mockMath.mockRestore()
    })
  })

  describe('getTieredSpawnProbability', () => {
    it('returns 0.4 for population under 8', () => {
      expect(getTieredSpawnProbability(0, 30)).toBe(0.4)
      expect(getTieredSpawnProbability(7, 30)).toBe(0.4)
    })

    it('returns 0.2 for population between 8 and 19', () => {
      expect(getTieredSpawnProbability(8, 30)).toBe(0.2)
      expect(getTieredSpawnProbability(19, 30)).toBe(0.2)
    })

    it('returns 0.1 for population between 20 and 29', () => {
      expect(getTieredSpawnProbability(20, 30)).toBe(0.1)
      expect(getTieredSpawnProbability(29, 30)).toBe(0.1)
    })

    it('returns 0 when at or above max capacity', () => {
      expect(getTieredSpawnProbability(30, 30)).toBe(0)
      expect(getTieredSpawnProbability(35, 30)).toBe(0)
    })
  })

  describe('calculateTasksForStage', () => {
    it('returns all 8 tasks on a perfect day roll', () => {
      const mockMath = vi.spyOn(Math, 'random')
      // Perfect day roll < 0.80 for Stage 4
      mockMath.mockReturnValue(0.1)

      const tasks = calculateTasksForStage(4)
      expect(tasks).toHaveLength(CANONICAL_ALIGNMENT_TASKS.length)

      mockMath.mockRestore()
    })

    it('returns stage-bounded subset of tasks on normal days', () => {
      const mockMath = vi.spyOn(Math, 'random')
      // Fail perfect day roll (>= 0.10 for Stage 1)
      mockMath.mockReturnValueOnce(0.5).mockReturnValueOnce(0.0) // minTasks = 1

      const tasks = calculateTasksForStage(1)
      expect(tasks.length).toBeGreaterThanOrEqual(1)
      expect(tasks.length).toBeLessThanOrEqual(3)

      mockMath.mockRestore()
    })
  })

  describe('generateSimulatedPersona', () => {
    it('generates in-character persona JSON via AI Gateway', async () => {
      process.env.AI_GATEWAY_API_KEY = 'test-key'
      const { generateText } = await import('ai')
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify({
          handle: 'ChitinWeaver_42',
          archetype: 'Eager Larva Novice',
          tone: 'Inquisitive and disciplined',
          bio: 'Building early shell hardness through prompt construction.',
        }),
      } as any)

      const persona = await generateSimulatedPersona(1)
      expect(persona.handle).toBe('ChitinWeaver_42')
      expect(persona.archetype).toBe('Eager Larva Novice')
      expect(persona.tone).toBe('Inquisitive and disciplined')
      expect(persona.bio).toContain('Building early shell hardness')
    })

    it('throws error and aborts if AI Gateway returns invalid JSON', async () => {
      process.env.AI_GATEWAY_API_KEY = 'test-key'
      const { generateText } = await import('ai')
      vi.mocked(generateText).mockResolvedValueOnce({
        text: 'Sorry, I am an AI and cannot generate this.',
      } as any)

      await expect(generateSimulatedPersona(1)).rejects.toThrowError(
        /Failed to parse persona JSON/
      )
    })
  })

  describe('spawnSimulatedUser', () => {
    it('supports dry run mode without database writes', async () => {
      process.env.AI_GATEWAY_API_KEY = 'test-key'
      const { generateText } = await import('ai')
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify({
          handle: 'BenthicPilot_99',
          archetype: 'Deep-Benthic Mechanic',
          tone: 'Direct and analytical',
          bio: 'Optimizing high-torque pincer mechanics.',
        }),
      } as any)

      const mockDb: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            id: 'sponsor-1',
            handle: 'Architect Vaelen',
            larvaId: 'ARCHITECT UNIT #0402',
            stage: 3,
            simulatedPersona: { archetype: 'Architect', tone: 'Analytical' },
          },
        ]),
      }

      const res = await spawnSimulatedUser(mockDb, DEFAULT_GROWTH_CONFIG, {
        force: true,
        dryRun: true,
      })

      expect(res.spawned).toBe(true)
      expect(res.dryRun).toBe(true)
      expect(res.handle).toBe('BenthicPilot_99')
      expect(['organic', 'word_of_mouth', 'brought_in']).toContain(res.joinSource)
    })
  })

  describe('simulateDailyRoutines', () => {
    it('completes routines and updates gem count in database', async () => {
      const mockInsertValues = vi.fn().mockReturnThis()
      const mockInsertOnConflict = vi.fn().mockResolvedValue([])
      const mockUpdateSet = vi.fn().mockReturnThis()
      const mockUpdateWhere = vi.fn().mockResolvedValue([])

      const mockDb: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            id: 'sim-user-1',
            handle: 'Larva Unit #8971',
            stage: 1,
            isSimulated: true,
            simulatedPersona: { archetype: 'Larva', tone: 'Eager' },
          },
        ]),
        insert: vi.fn(() => ({
          values: mockInsertValues.mockReturnValue({
            onConflictDoNothing: mockInsertOnConflict,
          }),
        })),
        update: vi.fn(() => ({
          set: mockUpdateSet.mockReturnValue({
            where: mockUpdateWhere,
          }),
        })),
      }

      const res = await simulateDailyRoutines(mockDb, DEFAULT_GROWTH_CONFIG, {
        userCount: 1,
        dryRun: false,
      })

      expect(res.actions).toHaveLength(1)
      expect(res.completed).toBeGreaterThan(0)
      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockDb.update).toHaveBeenCalled()
    })
  })

  describe('simulateForumActivity', () => {
    it('creates in-character forum reply when low-reply topics exist', async () => {
      process.env.AI_GATEWAY_API_KEY = 'test-key'
      const { generateText } = await import('ai')
      vi.mocked(generateText).mockResolvedValueOnce({
        text: 'Mastering the 06:00 Priority Pincer Lock was the single biggest turning point for my shell hardness.',
      } as any)

      const mockMembers = [
        {
          id: 'author-1',
          handle: 'Architect Vaelen',
          stage: 3,
          isSimulated: true,
          simulatedPersona: { archetype: 'Architect', tone: 'Analytical' },
        },
      ]

      const mockTopics = [
        {
          id: 'topic-1',
          userId: 'other-user',
          title: 'How to increase shell hardness?',
          content: 'Looking for advice on daily routines.',
          repliesCount: 1,
          isLocked: false,
        },
      ]

      const mockDb: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn((table: any) => {
          // profiles query
          if (table === profiles || table?._?.name === 'profiles') {
            return {
              where: vi.fn().mockResolvedValue(mockMembers),
            }
          }
          // forumTopics query
          if (table === forumTopics || table?._?.name === 'forum_topics') {
            return {
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue(mockTopics),
                }),
              }),
            }
          }
          // forumPosts query
          return {
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }
        }),
      }

      const mockMath = vi.spyOn(Math, 'random').mockReturnValue(0.1)

      const res = await simulateForumActivity(mockDb, { dryRun: true })
      expect(res.action).toBe('reply')
      expect(res.content).toContain('Priority Pincer Lock')

      mockMath.mockRestore()
    })

    it('creates a new discussion topic when rolled', async () => {
      process.env.AI_GATEWAY_API_KEY = 'test-key'
      const { generateText } = await import('ai')
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify({
          title: 'Optimal Cold Plunge Protocols for Soft-Shed Window',
          content: 'What submergence temperatures yielded the highest baseline recovery for your chitin?',
        }),
      } as any)

      const mockMembers = [
        {
          id: 'author-2',
          handle: 'BenthicPilot_99',
          stage: 2,
          isSimulated: true,
          simulatedPersona: { archetype: 'Pilot', tone: 'Direct' },
        },
      ]

      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Moltmaxxing & Biometrics',
          slug: 'moltmaxxing-biometrics',
          description: 'Telemetry and metrics discussion.',
        },
      ]

      const mockDb: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn((table: any) => {
          if (table === profiles || table?._?.name === 'profiles') {
            return { where: vi.fn().mockResolvedValue(mockMembers) }
          }
          if (table === forumTopics || table?._?.name === 'forum_topics') {
            return {
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([]), // no existing topics -> forces new topic
                }),
              }),
            }
          }
          return {
            limit: vi.fn().mockResolvedValue(mockCategories),
          }
        }),
      }

      const res = await simulateForumActivity(mockDb, { dryRun: true })
      expect(res.action).toBe('topic')
      expect(res.title).toBe('Optimal Cold Plunge Protocols for Soft-Shed Window')
    })
  })

  describe('simulateForumReactions', () => {
    it('casts upvotes on candidate posts in dry run mode', async () => {
      const mockDb: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn(),
      }

      // simulatedMembers
      mockDb.where.mockResolvedValueOnce([{ id: 'voter-1' }])

      // recentPosts
      mockDb.limit.mockResolvedValueOnce([{ id: 'post-99', userId: 'author-2', topicId: 'top-1' }])

      const res = await simulateForumReactions(mockDb, { dryRun: true, voteCount: 1 })
      expect(res.votesCast).toBe(1)
      expect(res.actions[0]).toEqual({ voterId: 'voter-1', postId: 'post-99' })
    })
  })

  describe('mutateSimulatedPersona', () => {
    it('applies a unique trait in dry run mode when forced', async () => {
      const mockDb: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            id: 'sim-user-1',
            handle: 'ReefCrafter',
            larvaId: 'LARVA UNIT #22',
            stage: 2,
            simulatedPersona: { archetype: 'Pilot', tone: 'Direct', traits: [] },
          },
        ]),
        update: vi.fn(),
      }

      const res = await mutateSimulatedPersona(mockDb, DEFAULT_GROWTH_CONFIG, {
        force: true,
        dryRun: true,
      })

      expect(res.mutated).toBe(true)
      expect(res.trait?.label).toBeTruthy()
      expect(mockDb.update).not.toHaveBeenCalled()
    })
  })

  describe('simulateConnections', () => {
    it('pairs two unconnected simulated members in dry run mode', async () => {
      const mockDb: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn(),
        insert: vi.fn(),
      }
      mockDb.where
        .mockResolvedValueOnce([
          { id: 'a', handle: 'Acolyte_a', larvaId: 'L1', stage: 1, simulatedPersona: {} },
          { id: 'b', handle: 'Acolyte_b', larvaId: 'L2', stage: 2, simulatedPersona: {} },
        ])
        .mockResolvedValueOnce([])

      const res = await simulateConnections(mockDb, DEFAULT_GROWTH_CONFIG, {
        force: true,
        dryRun: true,
      })

      expect(res.connected).toBe(true)
      expect(res.handles).toEqual(['Acolyte_a', 'Acolyte_b'])
      expect(mockDb.insert).not.toHaveBeenCalled()
    })
  })

  describe('simulateRelationships', () => {
    it('deepens an existing friendship into a mentor bond in dry run mode', async () => {
      const mockDb: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn(),
        insert: vi.fn(),
      }
      mockDb.where
        .mockResolvedValueOnce([
          { id: 'a', handle: 'Elder', larvaId: 'L4', stage: 4, simulatedPersona: {} },
          { id: 'b', handle: 'Larva', larvaId: 'L1', stage: 1, simulatedPersona: {} },
        ])
        .mockResolvedValueOnce([{ userAId: 'a', userBId: 'b' }])
        .mockResolvedValueOnce([])

      const res = await simulateRelationships(mockDb, DEFAULT_GROWTH_CONFIG, {
        force: true,
        dryRun: true,
      })

      expect(res.bonded).toBe(true)
      expect(res.kind).toBe('mentor')
      expect(res.fromUserId).toBe('a')
      expect(res.toUserId).toBe('b')
      expect(mockDb.insert).not.toHaveBeenCalled()
    })
  })
})
