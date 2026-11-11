/** Eye colours, shapes and expressions a character can have. */

export const AVATAR_EYE_COLORS = ['amber', 'sapphire', 'emerald', 'amethyst', 'ruby', 'topaz'] as const
export type AvatarEyeColor = (typeof AVATAR_EYE_COLORS)[number]

export const EYE_COLOR_SWATCH: Readonly<Record<AvatarEyeColor, { inner: string; mid: string; outer: string; ring: string }>> = {
  amber: { inner: '#ffd98a', mid: '#e07a12', outer: '#7a3305', ring: '#2a1003' },
  sapphire: { inner: '#c4ecff', mid: '#2b8af0', outer: '#123f8f', ring: '#05152e' },
  emerald: { inner: '#cbffd9', mid: '#19b26b', outer: '#0b5a36', ring: '#03200f' },
  amethyst: { inner: '#f1d6ff', mid: '#a259ef', outer: '#4b1a8c', ring: '#170530' },
  ruby: { inner: '#ffd3da', mid: '#e8364f', outer: '#7d0f22', ring: '#2a040b' },
  topaz: { inner: '#fff4b5', mid: '#e8b416', outer: '#7a5405', ring: '#2a1a02' },
}

export type EyeShape = 'round' | 'wide' | 'tall'
export type PupilStyle = 'standard' | 'big' | 'sparkle' | 'keen'
export type Expression = 'open' | 'relaxed' | 'cheerful_squint' | 'focused' | 'chill' | 'angry' | 'worried' | 'sad' | 'smug' | 'shocked' | 'wink'
export type Gaze = 'ahead' | 'left' | 'right' | 'up' | 'down'
