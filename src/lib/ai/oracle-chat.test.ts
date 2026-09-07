import { describe, it, expect } from 'vitest'
import {
  commitOracleTextStream,
  formatOracleUnavailableMessage,
  getOracleCandidateModelIds,
  ORACLE_EMPTY_RESPONSE_ERROR,
  ORACLE_MODEL_TIMEOUT_ERROR,
  ORACLE_UNAVAILABLE_MESSAGE,
  pickGuestOracleResponse,
  toModelMessages,
} from './oracle-chat'
import { ORACLE_MODELS } from './oracle-models'

describe('oracle-chat helpers', () => {
  it('picks a stable guest response from the message fingerprint', () => {
    const a = pickGuestOracleResponse('hello', 1)
    const b = pickGuestOracleResponse('hello', 1)
    expect(a).toBe(b)
    expect(a).toMatch(/Guest|account|Sign up/i)
  })

  it('returns the default model first in the cascade candidate list', () => {
    const expected = ORACLE_MODELS.map((m) => m.id)
    expect(getOracleCandidateModelIds()).toEqual(expected)
    expect(getOracleCandidateModelIds('unknown-model')).toEqual(expected)
    expect(getOracleCandidateModelIds('zai/glm-5.3-flash')[0]).toBe('zai/glm-5.3-flash')
  })

  it('formats plain unavailable messages with optional gateway detail', () => {
    expect(formatOracleUnavailableMessage()).toBe(ORACLE_UNAVAILABLE_MESSAGE)
    expect(formatOracleUnavailableMessage({ message: 'Model not found' })).toBe(
      `${ORACLE_UNAVAILABLE_MESSAGE} (Model not found)`
    )
  })

  it('maps chat input messages into model message payloads', () => {
    expect(
      toModelMessages([
        { role: 'user', content: 'hi' },
        { role: 'assistant', text: 'hello' },
      ])
    ).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ])
  })

  it('commits a stream after the first non-empty token', async () => {
    const source = new ReadableStream<string>({
      start(controller) {
        controller.enqueue('Hello ')
        controller.enqueue('initiate')
        controller.close()
      },
    })

    const committed = await commitOracleTextStream(source)
    const reader = committed.getReader()
    const chunks: string[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

    expect(chunks.join('')).toBe('Hello initiate')
  })

  it('rejects empty streams so the caller can fall through', async () => {
    const source = new ReadableStream<string>({
      start(controller) {
        controller.close()
      },
    })

    await expect(commitOracleTextStream(source)).rejects.toThrow(ORACLE_EMPTY_RESPONSE_ERROR)
  })

  it('rejects when the first token never arrives', async () => {
    const source = new ReadableStream<string>()

    await expect(commitOracleTextStream(source, 20)).rejects.toThrow(ORACLE_MODEL_TIMEOUT_ERROR)
  })
})
