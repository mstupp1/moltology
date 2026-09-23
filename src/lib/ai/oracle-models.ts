export type OracleProvider = 'openai' | 'deepseek' | 'zai' | 'alibaba'
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
    id: 'openai/gpt-6-luna',
    label: 'GPT-6 Luna',
    shortLabel: 'Luna',
    provider: 'openai',
    badge: 'Chat',
    pricing: { input: '$0.10', output: '$0.50' },
    latency: '2.3s',
  },
  {
    id: 'deepseek/deepseek-v4.1-flash',
    label: 'DeepSeek 4.1',
    shortLabel: 'DS 4.1',
    provider: 'deepseek',
    pricing: { input: '$0.13', output: '$0.52' },
    latency: '0.4s',
  },
  {
    id: 'zai/glm-5.3-flash',
    label: 'GLM 5.3 Flash',
    shortLabel: 'GLM',
    provider: 'zai',
    pricing: { input: '$0.075', output: '$0.25' },
    latency: '0.4s',
  },
  {
    id: 'alibaba/qwen3.7-flash',
    label: 'Qwen 3.7',
    shortLabel: 'Qwen',
    provider: 'alibaba',
    badge: 'Titles',
    pricing: { input: '$0.03', output: '$0.13' },
    latency: '1.9s',
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
export const ORACLE_TITLE_MODEL_ID = 'alibaba/qwen3.7-flash'

export function getOracleModel(id?: string): OracleModel {
  return ORACLE_MODELS.find((m) => m.id === id) || ORACLE_MODELS[0]
}
