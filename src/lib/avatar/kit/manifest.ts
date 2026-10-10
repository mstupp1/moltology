/**
 * Ingested kit art. `manifest.json` is written by `npm run avatar:kit -- ingest` and committed;
 * the images themselves live in the public bucket under `images/avatar-kit/`.
 */
import type { AvatarRace } from '../traits'
import rawManifest from './manifest.json'
import type { KitRacePivots } from './spec'

export interface KitAsset {
  /** Bucket key of a trimmed lossless WebP or facial SVG. */
  src: string
  /** Offset and size of the trimmed image on the 1024 canvas. */
  x: number
  y: number
  w: number
  h: number
}

export interface KitRaceOverrides {
  pivots?: Partial<KitRacePivots>
  /** Nudge the portrait crop up (negative) or down, in canvas px. */
  portraitOffsetY?: number
}

export interface KitManifest {
  version: number
  races: Partial<Record<AvatarRace, KitRaceOverrides>>
  assets: Record<string, KitAsset>
}

export const KIT_MANIFEST: KitManifest = rawManifest as KitManifest
