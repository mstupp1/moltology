/**
 * Shared auth and model mapping for Gemini REST vs Vercel AI Gateway media generation.
 * Cloud Agent environments often have AI_GATEWAY_API_KEY but not GEMINI_API_KEY.
 */

export function getGeminiApiKey(): string | undefined {
  const key =
    process.env.GEMINI_API_KEY || process.env.VERTEX_API_KEY || process.env.GOOGLE_API_KEY
  return key && key.trim().length > 0 ? key.trim() : undefined
}

export function getAiGatewayApiKey(): string | undefined {
  const key = process.env.AI_GATEWAY_API_KEY
  return key && key.trim().length > 0 ? key.trim() : undefined
}

export type MediaGenerationBackend = 'gemini' | 'gateway'

export function resolveMediaGenerationBackend(): MediaGenerationBackend {
  if (getGeminiApiKey()) return 'gemini'
  if (getAiGatewayApiKey()) return 'gateway'
  throw new Error(
    'Missing API key in environment variables (GEMINI_API_KEY, VERTEX_API_KEY, GOOGLE_API_KEY, or AI_GATEWAY_API_KEY).'
  )
}

const VEO_GATEWAY_MODELS: Record<string, string> = {
  'veo-3.1-lite-generate-preview': 'google/veo-3.1-lite-generate-001',
  'veo-3.1-fast-generate-preview': 'google/veo-3.1-fast-generate-001',
  'veo-3.1-generate-preview': 'google/veo-3.1-generate-001',
  'veo-3.1-lite-generate-001': 'google/veo-3.1-lite-generate-001',
  'veo-3.1-fast-generate-001': 'google/veo-3.1-fast-generate-001',
  'veo-3.1-generate-001': 'google/veo-3.1-generate-001',
}

export function toGatewayVeoModel(model: string): string {
  if (VEO_GATEWAY_MODELS[model]) return VEO_GATEWAY_MODELS[model]
  if (model.startsWith('google/')) return model
  if (model.includes('lite')) return 'google/veo-3.1-lite-generate-001'
  if (model.includes('fast')) return 'google/veo-3.1-fast-generate-001'
  return 'google/veo-3.1-generate-001'
}

export function toGatewayImageModel(resolvedGeminiModel: string): string {
  if (resolvedGeminiModel.startsWith('google/')) return resolvedGeminiModel
  return `google/${resolvedGeminiModel}`
}
