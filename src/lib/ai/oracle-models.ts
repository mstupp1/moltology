export type OracleProvider = 'deepseek' | 'inclusionai' | 'mistral' | 'anthropic' | 'local'
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
  description?: string
  pricing?: OracleModelPricing
  /** Indicative provider time to first token, not a response-time guarantee. */
  latency?: string
}

export const DEFAULT_ORACLE_MODEL_ID = 'inclusionai/ling-3.1-flash-1019'
export const PREMIUM_ORACLE_MODEL_ID = 'anthropic/claude-sonnet-4.6'
export const PREMIUM_DEEPSEEK_MODEL_ID = 'deepseek/deepseek-v4.1-flash'
export const ORACLE_TITLE_MODEL_ID = DEFAULT_ORACLE_MODEL_ID
export const PREMIUM_ORACLE_TITLE_MODEL_ID = 'mistral/mistral-nemo'
export const GUEST_ORACLE_MODEL_ID = 'guest-preview'

// Verified 2026-10-31 against vercel.com/ai-gateway/models and its public catalog.
// Free offers/discounts can change. Prices are USD per 1M tokens for the pinned provider.
// Premium policy: https://docs.deepinfra.com/account/data-privacy
export const ORACLE_MODELS: OracleModel[] = [
  {
    id: GUEST_ORACLE_MODEL_ID,
    label: 'Guest preview',
    shortLabel: 'Preview',
    provider: 'local',
    badge: 'Preview',
    roles: ['preview'],
    access: 'guest',
    description: 'Preset replies for signed-out visitors. Sign in to start a saved chat.',
    pricing: { input: 'Free', output: 'Free' },
    latency: 'Instant',
  },
  {
    id: DEFAULT_ORACLE_MODEL_ID,
    label: 'Oracle Current',
    shortLabel: 'Current',
    provider: 'inclusionai',
    badge: 'Chat',
    roles: ['chat', 'titles'],
    access: 'free',
    description: 'Ling 3.1 Flash 1019 for free chat and automatic titles. Currently free through Novita.',
    pricing: { input: 'Free', output: 'Free' },
    latency: '~4 s',
  },
  {
    id: PREMIUM_DEEPSEEK_MODEL_ID,
    label: 'DeepSeek V4.1 Flash',
    shortLabel: 'DeepSeek',
    provider: 'deepseek',
    badge: 'Chat',
    roles: ['chat'],
    access: 'premium',
    noPromptTraining: true,
    description: 'Oracle MAX chat through DeepInfra. Provider does not train on prompts or replies.',
    pricing: { input: '$0.14', output: '$0.42' },
    latency: '~1 s',
  },
  {
    id: PREMIUM_ORACLE_MODEL_ID,
    label: 'Oracle Abyss',
    shortLabel: 'Abyss',
    provider: 'anthropic',
    badge: 'Chat',
    roles: ['chat'],
    access: 'premium',
    noPromptTraining: true,
    description: 'Claude Sonnet 4.6 for deeper reasoning. Oracle MAX default; provider training is disabled.',
    pricing: { input: '$3', output: '$15' },
    latency: '~1.6 s',
  },
  {
    id: PREMIUM_ORACLE_TITLE_MODEL_ID,
    label: 'Mistral Nemo 12B',
    shortLabel: 'Nemo Titles',
    provider: 'mistral',
    badge: 'Titles',
    roles: ['titles'],
    access: 'premium',
    noPromptTraining: true,
    description: 'Automatic Oracle MAX titles through DeepInfra. Provider does not train on prompts or replies.',
    pricing: { input: '$0.029', output: '$0.03' },
    latency: '~0.3 s',
  },
]

export const DEFAULT_ORACLE_PLACEHOLDER = 'Ask Synaptic Oracle...'

export function getOracleModel(id: string = DEFAULT_ORACLE_MODEL_ID): OracleModel {
  return ORACLE_MODELS.find((m) => m.id === id) || ORACLE_MODELS.find((m) => m.id === DEFAULT_ORACLE_MODEL_ID)!
}

export function getOracleDefaultModelId(tier: OracleAccessTier): string {
  return tier === 'guest' ? GUEST_ORACLE_MODEL_ID : tier === 'premium' ? PREMIUM_ORACLE_MODEL_ID : DEFAULT_ORACLE_MODEL_ID
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
    ...(modelId === PREMIUM_DEEPSEEK_MODEL_ID || modelId === PREMIUM_ORACLE_TITLE_MODEL_ID
      ? { providerOptions: { gateway: { only: ['deepinfra'], disallowPromptTraining: true } } }
      : modelId === PREMIUM_ORACLE_MODEL_ID ? { providerOptions: { gateway: { only: ['anthropic'], disallowPromptTraining: true } } }
      : modelId.startsWith('inclusionai/') ? { providerOptions: { gateway: { only: ['novita'] } } } : {}),
  }
}
