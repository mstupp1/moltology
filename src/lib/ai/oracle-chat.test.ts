import { describe, it, expect } from 'vitest'
import {
  formatOracleUnavailableMessage,
  getOracleCandidateModelIds,
  ORACLE_UNAVAILABLE_MESSAGE,
  pickGuestOracleResponse,
  toModelMessages,
} from './oracle-chat'
import { DEFAULT_ORACLE_MODEL_ID } from './oracle-models'

describe('oracle-chat helpers', () => {
  it('picks a stable guest response from the message fingerprint', () => {
    const a = pickGuestOracleResponse('hello', 1)
    const b = pickGuestOracleResponse('hello', 1)
    expect(a).toBe(b)
    expect(a).toMatch(/Guest|account|Sign up/i)
  })

  it('returns the default model as the first cascade candidate', () => {
    expect(getOracleCandidateModelIds()).toEqual([DEFAULT_ORACLE_MODEL_ID])
    expect(getOracleCandidateModelIds('unknown-model')).toEqual([DEFAULT_ORACLE_MODEL_ID])
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
})
