import { describe, expect, it } from 'vitest'
import { AUDIT_READINGS, MOLTMAXXING_DAY, MOLTMAXXING_FAQ } from './moltmaxxing-content'
import { moltmaxLabelsForScore } from './moltmax-quiz'
import { CANONICAL_ALIGNMENT_TASKS } from './alignment-tasks'
import { buildMoltmaxxingJsonLd } from './seo'

describe('moltmaxxing content', () => {
  it('audit bands line up with the quiz stage boundaries', () => {
    const stages = AUDIT_READINGS.map((reading) => moltmaxLabelsForScore(reading.min).stage)
    expect(new Set(stages).size).toBe(AUDIT_READINGS.length)
    AUDIT_READINGS.forEach((reading) => {
      expect(moltmaxLabelsForScore(reading.max).stage).toBe(moltmaxLabelsForScore(reading.min).stage)
    })
    AUDIT_READINGS.slice(1).forEach((reading, index) => {
      expect(reading.min).toBe(AUDIT_READINGS[index].max + 1)
    })
  })

  it('has a written note for every daily Liturgy', () => {
    expect(MOLTMAXXING_DAY).toHaveLength(CANONICAL_ALIGNMENT_TASKS.length)
    MOLTMAXXING_DAY.forEach((task, index) => {
      expect(task.note).not.toBe(CANONICAL_ALIGNMENT_TASKS[index].description)
    })
  })

  it('feeds the page FAQ into the search snippet', () => {
    const graph = buildMoltmaxxingJsonLd()['@graph'] as any[]
    const faq = graph.find((node) => node['@type'] === 'FAQPage')
    expect(faq.mainEntity.map((q: any) => q.name)).toEqual(MOLTMAXXING_FAQ.map((item) => item.question))
  })
})
