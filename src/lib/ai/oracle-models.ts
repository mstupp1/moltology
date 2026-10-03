export type OracleProvider = 'zai' | 'deepseek' | 'alibaba'
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

export const ORACLE_MODELS: OracleModel[] = [
  {
    id: 'zai/glm-5.3-flash',
    label: 'GLM 5.3 Flash',
    shortLabel: 'GLM',
    provider: 'zai',
    badge: 'Chat',
    pricing: { input: '$0.15', output: '$0.50' },
    latency: '0.4s',
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
export const ORACLE_TITLE_MODEL_ID = 'zai/glm-5.3-flash'

export function getOracleModel(id?: string): OracleModel {
  return ORACLE_MODELS.find((m) => m.id === id) || ORACLE_MODELS[0]
}
