export type OracleProvider = 'alibaba' | 'minimax' | 'zai'

export interface OracleModel {
  id: string
  label: string
  shortLabel: string
  provider: OracleProvider
}

export const ORACLE_MODELS: OracleModel[] = [
  {
    id: 'minimax/minimax-m3-free',
    label: 'MiniMax M3',
    shortLabel: 'M3',
    provider: 'minimax',
  },
  {
    id: 'zai/glm-5.3-flash',
    label: 'GLM 5.3 Flash',
    shortLabel: 'GLM',
    provider: 'zai',
  },
  {
    id: 'alibaba/qwen3.8-flash',
    label: 'Qwen 3.8 Flash',
    shortLabel: 'Qwen',
    provider: 'alibaba',
  },
]

export const DEFAULT_ORACLE_MODEL_ID = ORACLE_MODELS[0].id

/**
 * Dedicated model used for summarizing conversation titles on first message dispatch.
 * Configured separately from interactive chat models.
 */
export const ORACLE_TITLE_MODEL_ID = 'alibaba/qwen3.7-flash'

export function getOracleModel(id?: string): OracleModel {
  return ORACLE_MODELS.find((m) => m.id === id) || ORACLE_MODELS[0]
}
