export type OracleProvider = 'openai' | 'google' | 'deepseek' | 'qwen'

export interface OracleModel {
  id: string
  label: string
  shortLabel: string
  provider: OracleProvider
}

export const ORACLE_MODELS: OracleModel[] = [
  { id: 'qwen/qwen3.7-flash', label: 'Qwen 3.7 Flash', shortLabel: 'Flash', provider: 'qwen' },
  { id: 'deepseek/deepseek-v4-flash-0731', label: 'DeepSeek V4', shortLabel: 'V4', provider: 'deepseek' },
  { id: 'openai/gpt-5.6-luna', label: 'GPT-5.6 Luna', shortLabel: 'Luna', provider: 'openai' },
  {
    id: 'google/gemini-3.5-flash-lite',
    label: 'Gemini 3.5 Flash Lite',
    shortLabel: 'Flash Lite',
    provider: 'google',
  },
]

export const DEFAULT_ORACLE_MODEL_ID = ORACLE_MODELS[0].id

export function getOracleModel(id?: string): OracleModel {
  return ORACLE_MODELS.find((m) => m.id === id) || ORACLE_MODELS[0]
}
