import { describe, expect, it } from 'vitest'
import { avatarConfigShape } from './avatar/config-schema'
import { z } from 'zod'
import { parseLobsterAvatarConfig, SHELL_PALETTES } from './lobster-avatar'
import { rollSimulatedAvatarConfig, rollSimulatedCast } from './simulated-avatar'

const schema = z.object(avatarConfigShape)

describe('simulated avatars', () => {
  it('rolls a valid, fully pinned character with no gear-owned fields', () => {
    const look = rollSimulatedAvatarConfig('seed-a')
    expect(schema.safeParse(look).success).toBe(true)
    expect(parseLobsterAvatarConfig(look)).toMatchObject({ race: look.race, shellColor: look.shellColor, headShape: look.headShape })
    expect(look).not.toHaveProperty('claws')
    expect(look).not.toHaveProperty('accessory')
    expect(look.style).toBe('critters')
  })

  it('is stable for a seed and differs across seeds', () => {
    expect(rollSimulatedAvatarConfig('seed-a')).toEqual(rollSimulatedAvatarConfig('seed-a'))
    expect(rollSimulatedAvatarConfig('seed-a')).not.toEqual(rollSimulatedAvatarConfig('seed-b'))
  })

  it('spreads a cast across races and every shell colour', () => {
    const cast = rollSimulatedCast(SHELL_PALETTES.length + 4, 'batch')
    const races = cast.map((c) => c.race)
    expect(races.filter((r) => r === 'crab')).toHaveLength(Math.floor(cast.length / 2))
    expect(new Set(cast.slice(0, SHELL_PALETTES.length).map((c) => c.shellColor)).size).toBe(SHELL_PALETTES.length)
    expect(new Set(cast.map((c) => `${c.headShape}/${c.build}`)).size).toBeGreaterThan(6)
  })
})
