import { describe, expect, it } from 'vitest'
import { computeMoltmaxResult, MOLTMAX_QUESTIONS, type QuizAnswers } from './moltmax-quiz'

const answersFor = (highest: boolean): QuizAnswers => Object.fromEntries(
  MOLTMAX_QUESTIONS.map((question) => {
    const option = question.options.reduce((selected, current) => {
      if (highest) return current.score > selected.score ? current : selected
      return current.score < selected.score ? current : selected
    }, question.options[0])
    return [question.id, option.id]
  })
)

describe('moltmax quiz rubric', () => {
  it('contains fifteen questions with three prompts per dimension', () => {
    expect(MOLTMAX_QUESTIONS).toHaveLength(15)
    const counts = MOLTMAX_QUESTIONS.reduce<Record<string, number>>((result, question) => {
      result[question.dimension] = (result[question.dimension] || 0) + 1
      return result
    }, {})
    expect(Object.values(counts)).toEqual([3, 3, 3, 3, 3])
  })

  it('assigns the larval floor to low-signal answers', () => {
    const result = computeMoltmaxResult(answersFor(false))
    expect(result.score).toBeLessThan(50)
    expect(result.tierLevel).toContain('STAGE I')
    expect(result.clearance).toBe('L-1')
    expect(result.isMeltRisk).toBe(true)
  })

  it('assigns the transcendent stage and max biometrics to high-signal answers', () => {
    const result = computeMoltmaxResult(answersFor(true))
    expect(result.score).toBeGreaterThanOrEqual(88)
    expect(result.tierLevel).toContain('STAGE IV')
    expect(result.clearance).toBe('C-3')
    expect(result.biometrics.pincerTorque).toBe(1000)
    expect(result.biometrics.promptLatency).toBe(10)
  })

  it('detects a contradictory boundary signal without changing the score', () => {
    const answers = answersFor(true)
    answers.q6 = 'strongly-agree'
    answers.q11 = 'q11-b'
    const result = computeMoltmaxResult(answers)
    expect(result.varianceDetected).toBe(true)
  })

  it('guards incomplete answers with a deterministic low signal result', () => {
    const result = computeMoltmaxResult({})
    expect(result.score).toBe(12)
    expect(result.biometrics.submergenceDepth).toBe(1000)
  })
})
