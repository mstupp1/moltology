export type OracleProvider = 'alibaba'

export interface OracleModel {
  id: string
  label: string
  shortLabel: string
  provider: OracleProvider
}

export const ORACLE_MODELS: OracleModel[] = [
  { id: 'alibaba/qwen3.7-flash', label: 'Qwen 3.7 Flash', shortLabel: 'Flash', provider: 'alibaba' },
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
