export type OracleProvider = 'deepseek'
export type OracleModelBadge = 'Chat' | 'Titles'

export interface OracleModelPricing {
  input: string
  output: string
}

export interface OracleModel {
  id: string
  label: string
  shortLabel: string
  provider: OracleProvider
  badge?: OracleModelBadge
  pricing?: OracleModelPricing
  latency?: string
}

// Gateway prices from, per 1M tokens; provider routing can change the billed rate.
// Verified 2026-10-31: https://vercel.com/ai-gateway/models/deepseek-v4.1-flash
export const ORACLE_MODELS: OracleModel[] = [
  {
    id: 'deepseek/deepseek-v4.1-flash',
    label: 'DeepSeek V4.1 Flash',
    shortLabel: 'DeepSeek',
    provider: 'deepseek',
    badge: 'Chat',
    pricing: { input: '$0.02', output: '$0.19' },
  },
]

export const DEFAULT_ORACLE_MODEL_ID = ORACLE_MODELS[0].id

/**
 * Shared standard placeholder text for Oracle AI prompt inputs across all surfaces
 * (mobile bottom tray, popout window, sidebar drawer, dedicated /oracle page).
 */
export const DEFAULT_ORACLE_PLACEHOLDER = 'Ask Synaptic Oracle...'

/**
 * Dedicated model used for summarizing conversation titles on first message dispatch.
 * Configured separately from interactive chat models.
 */
export const ORACLE_TITLE_MODEL_ID = 'deepseek/deepseek-v4.1-flash'

export function getOracleModel(id?: string): OracleModel {
  return ORACLE_MODELS.find((m) => m.id === id) || ORACLE_MODELS[0]
}
