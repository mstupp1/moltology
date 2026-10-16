import { describe, expect, it } from 'vitest'
import { dedupeBatchTasks, isBatchPlan } from './simulation-batch-plan'
import type { SimulationPlanTask } from './simulation-engine'

const reply = (id: string, authorId: string, targetPostId: string | null, topicId = 'topic-1') =>
  ({ id, kind: 'forum_reply', authorId, targetPostId, topicId }) as unknown as SimulationPlanTask
const spawn = (id: string) => ({ id, kind: 'spawn_persona' }) as unknown as SimulationPlanTask
const topic = (id: string) => ({ id, kind: 'forum_topic' }) as unknown as SimulationPlanTask

describe('dedupeBatchTasks', () => {
  it('drops a repeat reply by the same member to the same post', () => {
    const out = dedupeBatchTasks(
      [[reply('r1', 'a', 'p1')], [reply('r1', 'a', 'p1'), reply('r2', 'b', 'p1')]],
      5
    )
    expect(out[0]).toHaveLength(1)
    expect(out[1].map((t) => t.id)).toEqual(['t2-r2'])
  })

  it('falls back to the topic when there is no target post', () => {
    const out = dedupeBatchTasks([[reply('r1', 'a', null)], [reply('r1', 'a', null)]], 5)
    expect(out[1]).toHaveLength(0)
  })

  it('caps spawns at the remaining population capacity', () => {
    const out = dedupeBatchTasks([[spawn('s')], [spawn('s')], [spawn('s')]], 2)
    expect(out.flat().filter((t) => t.kind === 'spawn_persona')).toHaveLength(2)
    expect(dedupeBatchTasks([[spawn('s')]], 0)[0]).toHaveLength(0)
  })

  it('prefixes ids with the tick number and keeps topics', () => {
    const out = dedupeBatchTasks([[topic('forum-topic-1')], [topic('forum-topic-1')]], 0)
    expect(out.map((tasks) => tasks[0].id)).toEqual(['t1-forum-topic-1', 't2-forum-topic-1'])
  })
})

describe('isBatchPlan', () => {
  it('recognises batch plans only', () => {
    expect(isBatchPlan({ kind: 'batch', ticks: [] })).toBe(true)
    expect(isBatchPlan({ version: 1, tasks: [] })).toBe(false)
    expect(isBatchPlan(null)).toBe(false)
  })
})
