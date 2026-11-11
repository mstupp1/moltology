/**
 * The scene behind a 3D character, as page styling. It is the same simple backdrop the 2D
 * drawing paints: the chosen scene's gradient, a glow behind the head and a glow on the floor.
 */
import type { CSSProperties } from 'react'
import { LOBSTER_BACKGROUND_THEME_MAP, resolveAvatarTraits, type LobsterAvatarConfig } from './lobster-avatar'

const faded = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, transparent)`

export function sceneStyle3D(config: LobsterAvatarConfig): CSSProperties | undefined {
  if (config.transparentBackground) return undefined
  const theme = LOBSTER_BACKGROUND_THEME_MAP[resolveAvatarTraits(config).backgroundTheme]
  if (!theme) return undefined
  return {
    background: [
      `radial-gradient(60% 60% at 50% 34%, ${faded(theme.glowColor, 22)}, transparent)`,
      `radial-gradient(55% 55% at 50% 92%, ${faded(theme.glowSecondaryColor ?? theme.glowColor, 18)}, transparent)`,
      `linear-gradient(${theme.gradientAngle ?? 135}deg, ${theme.topColor}, ${theme.primaryColor} 50%, ${theme.bottomColor})`,
    ].join(', '),
  }
}
