import { describe, it, expect } from 'vitest'
import {
  commitOracleTextStream,
  formatOracleUnavailableMessage,
  getOracleCandidateModelIds,
  orderOracleModels,
  ORACLE_EMPTY_RESPONSE_ERROR,
  ORACLE_MODEL_TIMEOUT_ERROR,
  ORACLE_UNAVAILABLE_MESSAGE,
  pickGuestOracleResponse,
  toModelMessages,
} from './oracle-chat'
import { ORACLE_MODELS, DEFAULT_ORACLE_MODEL_ID, getOracleModel, ORACLE_TITLE_MODEL_ID } from './oracle-models'

describe('oracle-chat helpers', () => {
  it('configures GPT-6 Luna as the default and first candidate model with Chat badge and pricing metrics', () => {
    expect(ORACLE_MODELS[0]).toEqual({
      id: 'openai/gpt-6-luna',
      label: 'GPT-6 Luna',
      shortLabel: 'Luna',
      provider: 'openai',
      badge: 'Chat',
      pricing: { input: '$0.10', output: '$0.50' },
      latency: '2.3s',
    })
    expect(DEFAULT_ORACLE_MODEL_ID).toBe('openai/gpt-6-luna')
    expect(getOracleModel().id).toBe('openai/gpt-6-luna')
  })

  it('configures Qwen 3.7 at the bottom of the list for titles with Titles badge and pricing metrics', () => {
    const lastModel = ORACLE_MODELS[ORACLE_MODELS.length - 1]
    expect(lastModel).toEqual({
      id: 'alibaba/qwen3.7-flash',
      label: 'Qwen 3.7',
      shortLabel: 'Qwen',
      provider: 'alibaba',
      badge: 'Titles',
      pricing: { input: '$0.03', output: '$0.13' },
      latency: '1.9s',
    })
    expect(ORACLE_TITLE_MODEL_ID).toBe('alibaba/qwen3.7-flash')
  })

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

  it('lets an explicit model pick beat a Jev preference', () => {
    const deep = ORACLE_MODELS[0].id
    const fast = ORACLE_MODELS[1].id
    expect(orderOracleModels(undefined, fast)[0]).toBe(fast)
    expect(orderOracleModels(deep, fast)[0]).toBe(deep)
    expect(orderOracleModels()[0]).toBe(deep)
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

  it('commits a byte stream after the first non-empty token', async () => {
    const encoder = new TextEncoder()
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('Hello '))
        controller.enqueue(encoder.encode('initiate'))
        controller.close()
      },
    })

    const committed = await commitOracleTextStream(source)
    const reader = committed.getReader()
    const chunks: string[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(new TextDecoder().decode(value))
    }

    expect(chunks.join('')).toBe('Hello initiate')
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
