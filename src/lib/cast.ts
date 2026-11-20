/**
 * The content cast: named 3D characters built in the character creator, used by every content
 * skill (reels, posts, carousels, Swipe Lab, blog art, animated lessons and the composite studio).
 * The list lives in content/characters/cast.json; stills come from `npm run cast:render`.
 */
import castFile from '../../content/characters/cast.json'
import { AVATAR_POSES, type AvatarPose } from './avatar/traits'

export interface CastMember {
  key: string
  name: string
  /** One line: the job this character does in a story. */
  role: string
  /** What the character is like and learning, for scripts and story beats. */
  storyRole: string
  /** What the character looks like, for prompts that sit beside a rendered reference. */
  description: string
  /** Fish voice (scripts/lib/tts-providers/fish-audio.ts catalog). */
  voice: string
  /** Signature pose for the default still. */
  pose: AvatarPose
  aliases: string[]
  /** A character-creator config (parseLobsterAvatarConfig), without `style` or `pose`. */
  config: Record<string, unknown>
}

interface CastFile {
  default: string
  cast: Record<string, Omit<CastMember, 'key'>>
}

const file = castFile as unknown as CastFile

export const CAST: CastMember[] = Object.entries(file.cast).map(([key, m]) => ({ key, ...m, pose: m.pose as AvatarPose }))

export const DEFAULT_CAST_KEY = file.default

const BY_KEY = new Map(CAST.map((m) => [m.key, m]))

export function castMember(key: string): CastMember | undefined {
  return BY_KEY.get(key)
}

export function isPose(value: string): value is AvatarPose {
  return (AVATAR_POSES as readonly string[]).includes(value)
}

/**
 * Splits `key:pose` (as composite specs and `--mascot` accept it) into the key and the pose.
 * A suffix that is not a pose stays part of the key.
 */
export function splitPose(raw: string): { key: string; pose?: AvatarPose } {
  const at = raw.lastIndexOf(':')
  if (at > 0) {
    const pose = raw.slice(at + 1).trim().toLowerCase()
    if (isPose(pose)) return { key: raw.slice(0, at), pose }
  }
  return { key: raw }
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${stable(o[k])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

/** Short stable hash (FNV-1a) of a cast member's look, so a changed look gets new still files. */
export function lookHash(member: Pick<CastMember, 'config'>): string {
  const text = stable(member.config)
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

/**
 * File name of a published full-figure still, under `images/characters/`. The look hash is in the
 * name, so changing a character's look never shows an old picture from the CDN.
 */
export function castStillFilename(member: CastMember, pose: AvatarPose = member.pose): string {
  const stem = member.key.replace(/^(lobster|crab)_/, '')
  return `char_${stem}_3d_${pose}_${lookHash(member)}.webp`
}
