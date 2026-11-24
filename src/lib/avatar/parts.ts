/** Eye colours, shapes and expressions a character can have. */

export const AVATAR_EYE_COLORS = ['amber', 'sapphire', 'emerald', 'amethyst', 'ruby', 'topaz', 'hazel', 'teal', 'rose', 'ice', 'onyx', 'lime'] as const
/** Seeded characters roll from the original six, so adding colours never changes an existing member's look. */
export const SEEDED_EYE_COLORS = AVATAR_EYE_COLORS.slice(0, 6)
export type AvatarEyeColor = (typeof AVATAR_EYE_COLORS)[number]

export const EYE_COLOR_SWATCH: Readonly<Record<AvatarEyeColor, { inner: string; mid: string; outer: string; ring: string }>> = {
  amber: { inner: '#ffd98a', mid: '#e07a12', outer: '#7a3305', ring: '#2a1003' },
  sapphire: { inner: '#c4ecff', mid: '#2b8af0', outer: '#123f8f', ring: '#05152e' },
  emerald: { inner: '#cbffd9', mid: '#19b26b', outer: '#0b5a36', ring: '#03200f' },
  amethyst: { inner: '#f1d6ff', mid: '#a259ef', outer: '#4b1a8c', ring: '#170530' },
  ruby: { inner: '#ffd3da', mid: '#e8364f', outer: '#7d0f22', ring: '#2a040b' },
  topaz: { inner: '#fff4b5', mid: '#e8b416', outer: '#7a5405', ring: '#2a1a02' },
  hazel: { inner: '#e9d79a', mid: '#8a6a2c', outer: '#4a3312', ring: '#1c1205' },
  teal: { inner: '#c6fff6', mid: '#14a8a0', outer: '#075450', ring: '#021e1d' },
  rose: { inner: '#ffe0ef', mid: '#f06aa6', outer: '#8c1f55', ring: '#2e061a' },
  ice: { inner: '#ffffff', mid: '#a9cbe6', outer: '#4f6f8c', ring: '#16222e' },
  onyx: { inner: '#7a7f8c', mid: '#2e313a', outer: '#16181e', ring: '#050608' },
  lime: { inner: '#f4ffc4', mid: '#9ee21e', outer: '#4a7a06', ring: '#182a02' },
}

export type EyeShape = 'round' | 'wide' | 'tall' | 'almond' | 'button'
export type PupilStyle = 'standard' | 'big' | 'sparkle' | 'keen'
export type Expression = 'open' | 'relaxed' | 'cheerful_squint' | 'focused' | 'chill' | 'angry' | 'worried' | 'sad' | 'smug' | 'shocked' | 'wink'
export type Gaze = 'ahead' | 'left' | 'right' | 'up' | 'down'
