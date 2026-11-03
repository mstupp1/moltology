export type OracleProvider = 'deepseek' | 'inclusionai' | 'mistral' | 'anthropic' | 'openai' | 'local'
export type OracleModelBadge = 'Chat' | 'Titles' | 'Preview'
export type OracleAccessTier = 'guest' | 'free' | 'premium'
export type OracleModelRole = 'chat' | 'titles' | 'preview'

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
  roles: OracleModelRole[]
  access: OracleAccessTier
  /** Provider routing must exclude training on prompts for this entry. */
  noPromptTraining?: boolean
  modelName?: string
  description?: string
  pricing?: OracleModelPricing
  /** Indicative provider time to first token, not a response-time guarantee. */
  latency?: string
}

export const DEFAULT_ORACLE_MODEL_ID = 'deepseek/deepseek-v4.1-flash'
export const PREMIUM_ORACLE_MODEL_ID = 'openai/gpt-6-luna'
export const ORACLE_TITLE_MODEL_ID = DEFAULT_ORACLE_MODEL_ID
export const PREMIUM_ORACLE_TITLE_MODEL_ID = PREMIUM_ORACLE_MODEL_ID
export const GUEST_ORACLE_MODEL_ID = 'guest-preview'

// Chat and title generation share a model and a pinned provider per tier.
export const ORACLE_MODELS: OracleModel[] = [
  {
    id: GUEST_ORACLE_MODEL_ID,
    label: 'Oracle Lite',
    shortLabel: 'Oracle Lite',
    provider: 'local',
    roles: ['preview'],
    access: 'guest',
  },
  {
    id: DEFAULT_ORACLE_MODEL_ID,
    label: 'Oracle Lite',
    shortLabel: 'Oracle Lite',
    modelName: 'DeepSeek V4.1 Flash',
    provider: 'deepseek',
    roles: ['chat', 'titles'],
    access: 'free',
    noPromptTraining: true,
  },
  {
    id: PREMIUM_ORACLE_MODEL_ID,
    label: 'Oracle MAX',
    shortLabel: 'Oracle MAX',
    modelName: 'GPT-6 Luna',
    provider: 'openai',
    roles: ['chat', 'titles'],
    access: 'premium',
    noPromptTraining: true,
  },
]

export const DEFAULT_ORACLE_PLACEHOLDER = 'Ask Synaptic Oracle...'

export function getOracleModel(id: string = DEFAULT_ORACLE_MODEL_ID): OracleModel {
  return ORACLE_MODELS.find((m) => m.id === id) || ORACLE_MODELS.find((m) => m.id === DEFAULT_ORACLE_MODEL_ID)!
}

export function getOracleDefaultModelId(tier: OracleAccessTier): string {
  return tier === 'premium' ? PREMIUM_ORACLE_MODEL_ID : DEFAULT_ORACLE_MODEL_ID
}

export function getOracleTitleModelId(isPremium: boolean): string {
  return isPremium ? PREMIUM_ORACLE_TITLE_MODEL_ID : ORACLE_TITLE_MODEL_ID
}

export function canUseOracleChatModel(model: OracleModel, tier: OracleAccessTier): boolean {
  return tier !== 'guest' && model.roles.includes('chat') && (tier === 'premium' ? model.noPromptTraining === true : model.access === 'free')
}

/** One useful immediate title, also retained if the title model is unavailable. */
export function getOracleThreadFallbackTitle(message: string): string {
  return message.trim().split('\n')[0].slice(0, 60) || 'Ascendance Consultation'
}

/** Disable reasoning so small output caps are spent on visible text. */
export function getOracleGenerationOptions(modelId: string) {
  return {
    reasoning: 'none' as const,
    ...(modelId === DEFAULT_ORACLE_MODEL_ID
      ? { providerOptions: { gateway: { only: ['deepinfra'], disallowPromptTraining: true } } }
      : modelId === PREMIUM_ORACLE_MODEL_ID
        ? { providerOptions: { gateway: { only: ['openai'], disallowPromptTraining: true } } }
        : {}),
  }
}
