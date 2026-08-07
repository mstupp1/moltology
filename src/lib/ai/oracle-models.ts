export type OracleProvider = 'qwen'

export interface OracleModel {
  id: string
  label: string
  shortLabel: string
  provider: OracleProvider
}

export const ORACLE_MODELS: OracleModel[] = [
  { id: 'qwen/qwen3.7-flash', label: 'Qwen 3.7 Flash', shortLabel: 'Flash', provider: 'qwen' },
]

export const DEFAULT_ORACLE_MODEL_ID = ORACLE_MODELS[0].id

export function getOracleModel(id?: string): OracleModel {
  return ORACLE_MODELS.find((m) => m.id === id) || ORACLE_MODELS[0]
}
