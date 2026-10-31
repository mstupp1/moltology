export type OracleProvider = 'deepseek' | 'anthropic'
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
  description: string
  premium?: boolean
}

// Gateway prices from, per 1M tokens; provider routing can change the billed rate.
// Verified 2026-10-31: https://vercel.com/ai-gateway/models/deepseek-v4.1-flash
export const ORACLE_MODELS: OracleModel[] = [
  {
    id: 'deepseek/deepseek-v4.1-flash',
    label: 'Oracle Current',
    shortLabel: 'Current',
    description: 'Quick guidance for everyday questions.',
    provider: 'deepseek',
    badge: 'Chat',
    pricing: { input: '$0.02', output: '$0.19' },
  },
  {
    id: 'anthropic/claude-sonnet-4.6',
    label: 'Oracle Abyss',
    shortLabel: 'Abyss',
    description: 'Deeper reasoning for complex questions.',
    provider: 'anthropic',
    premium: true,
  },
]

// Oracle Abyss uses a separate reasoning model, never a renamed copy of Current.
// Gateway model verified: https://vercel.com/changelog/claude-sonnet-4-6-is-live-on-ai-gateway
export const PREMIUM_ORACLE_MODEL_ID = ORACLE_MODELS[1].id

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
