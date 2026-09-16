import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getGeminiApiKey,
  getAiGatewayApiKey,
  resolveMediaGenerationBackend,
  toGatewayVeoModel,
  toGatewayImageModel,
} from './ai-gateway-media'

describe('ai-gateway-media', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.GEMINI_API_KEY
    delete process.env.VERTEX_API_KEY
    delete process.env.GOOGLE_API_KEY
    delete process.env.AI_GATEWAY_API_KEY
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('prefers Gemini REST when a Gemini key is present', () => {
    process.env.GEMINI_API_KEY = 'AIza-test'
    process.env.AI_GATEWAY_API_KEY = 'vck_test'
    expect(getGeminiApiKey()).toBe('AIza-test')
    expect(resolveMediaGenerationBackend()).toBe('gemini')
  })

  it('falls back to AI Gateway when only the gateway key is present', () => {
    process.env.AI_GATEWAY_API_KEY = 'vck_test'
    expect(getAiGatewayApiKey()).toBe('vck_test')
    expect(resolveMediaGenerationBackend()).toBe('gateway')
  })

  it('throws when no media generation key is present', () => {
    expect(() => resolveMediaGenerationBackend()).toThrow(/Missing API key/)
  })

  it('maps Veo preview model ids to AI Gateway slugs', () => {
    expect(toGatewayVeoModel('veo-3.1-lite-generate-preview')).toBe(
      'google/veo-3.1-lite-generate-001'
    )
    expect(toGatewayVeoModel('veo-3.1-fast-generate-preview')).toBe(
      'google/veo-3.1-fast-generate-001'
    )
    expect(toGatewayVeoModel('veo-3.1-generate-preview')).toBe('google/veo-3.1-generate-001')
    expect(toGatewayVeoModel('google/veo-3.1-lite-generate-001')).toBe(
      'google/veo-3.1-lite-generate-001'
    )
  })

  it('maps resolved Gemini image model ids to AI Gateway slugs', () => {
    expect(toGatewayImageModel('gemini-3-pro-image')).toBe('google/gemini-3-pro-image')
    expect(toGatewayImageModel('gemini-3.1-flash-image')).toBe('google/gemini-3.1-flash-image')
    expect(toGatewayImageModel('google/gemini-3-pro-image')).toBe('google/gemini-3-pro-image')
  })
})
