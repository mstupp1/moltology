import { isAdmin } from './permissions'

export type FeatureFlagAudience = 'admin-only' | 'public' | 'disabled'

export interface FeatureFlagDefinition {
  id: string
  label: string
  description?: string
  audience: FeatureFlagAudience
}

export const FEATURE_FLAGS = {
  premium: {
    id: 'premium',
    label: 'Go Premium',
    description: 'Monthly premium subscription badge and access',
    audience: 'admin-only',
  },
} as const satisfies Record<string, FeatureFlagDefinition>

export type FeatureFlagId = keyof typeof FEATURE_FLAGS

export interface FeatureFlagUserContext {
  role?: string | null
  email?: string | null
  emailVerified?: boolean | null
}

/**
 * Checks whether a feature flag is enabled for the current viewer.
 */
export function isFeatureFlagEnabled(
  flagId: FeatureFlagId | string,
  user?: FeatureFlagUserContext | null,
  profileRole?: string | null,
): boolean {
  const flag = (FEATURE_FLAGS as Record<string, FeatureFlagDefinition>)[flagId]
  if (!flag) return false
  if (flag.audience === 'public') return true
  if (flag.audience === 'disabled') return false
  if (flag.audience === 'admin-only') {
    return isAdmin(user, profileRole)
  }
  return false
}

/**
 * Checks whether a feature flag is in an elevated/restricted preview state
 * (e.g. 'admin-only'). When a tab is gated by a flag in this state, it should
 * be displayed with the 'hidden' / preview style (faded opacity, EyeOff icon).
 * If the flag is 'public', this returns false so tabs render normally.
 */
export function isFeatureFlagPreview(
  flagId: FeatureFlagId | string,
  user?: FeatureFlagUserContext | null,
  profileRole?: string | null,
): boolean {
  const flag = (FEATURE_FLAGS as Record<string, FeatureFlagDefinition>)[flagId]
  if (!flag) return false
  if (flag.audience === 'admin-only') {
    return isAdmin(user, profileRole)
  }
  return false
}
