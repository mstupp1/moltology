import { neon, neonConfig } from '@neondatabase/serverless'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { profiles, userGearItems } from '../../db/schema'
import { resolveIntegrationDatabaseUrl } from '../../../scripts/lib/integration-database'
import { getChassisLoadoutHandler, saveCharacterHandler, moveGearItemHandler } from './db-services'
neonConfig.disableWarningInBrowsers = true
const db = getDb(),
  member = `character-test-${randomUUID()}`,
  other = `character-test-${randomUUID()}`
const suite = describe.skipIf(process.env.RUN_CHARACTER_INTEGRATION !== '1')
suite(
  'atomic character persistence on explicit Neon dev',
  () => {
    beforeAll(async () => {
      if (resolveIntegrationDatabaseUrl(process.env) !== process.env.DATABASE_URL)
        throw new Error('Expected explicit dev target.')
      await db.insert(profiles).values([
        {
          id: member,
          avatarConfig: {
            style: 'critters',
            seed: 'existing',
            race: 'crab',
            shellColor: 'orchid',
            accessory: 'crown',
            claws: 'crusher',
          },
        },
        { id: other },
      ])
      // A pre-reset legacy item must disappear without touching unrelated members.
      await db.insert(userGearItems).values({
        userId: member,
        catalogItemId: 'a1000000-0000-4000-8000-000000000006',
        equippedSlot: 'claws',
        vaultIndex: null,
      })
    })
    afterAll(async () => {
      await db.delete(profiles).where(sql`${profiles.id} IN (${member},${other})`)
    })
    const context = { user: { sub: member }, db }
    const load = () => getChassisLoadoutHandler({ data: {}, context })
    it('resets once under concurrent initialization and preserves biological traits', async () => {
      const results = await Promise.all([load(), load()])
      for (const p of results) {
        expect(p.items).toHaveLength(19)
        expect(p.items.filter((i) => i.equippedSlot)).toHaveLength(7)
        expect(p.config?.race).toBe('crab')
        expect(p.config?.shellColor).toBe('orchid')
        expect(p.appearanceRevision).toBe(1)
      }
      expect((await load()).items.map((i) => i.id).sort()).toEqual(
        results[0].items.map((i) => i.id).sort(),
      )
      expect(
        await db.select().from(userGearItems).where(eq(userGearItems.userId, other)),
      ).toHaveLength(0)
    })
    it('commits body and equipment together; snapshots use only equipped visuals', async () => {
      const p = await load(),
        placements = p.items.map((i) => ({
          id: i.id,
          equippedSlot: i.equippedSlot,
          vaultIndex: i.vaultIndex,
        }))
      const head = placements.find((i) => i.equippedSlot === 'head')!,
        bow = p.items.find(
          (i) => p.catalog.find((c) => c.id === i.catalogItemId)?.slug === 'creator-bow',
        )!,
        b = placements.find((i) => i.id === bow.id)!
      const index = b.vaultIndex
      b.equippedSlot = 'head'
      b.vaultIndex = null
      head.equippedSlot = null
      head.vaultIndex = index
      const result = await saveCharacterHandler({
        context,
        data: {
          expectedRevision: p.appearanceRevision!,
          config: { style: 'critters', seed: 'saved', race: 'lobster', shellColor: 'jade' },
          placements,
        },
      })
      expect(result.config?.race).toBe('lobster')
      expect(result.config?.equipment?.head?.visualKey).toBe('creator-bow')
      expect(result.appearanceRevision).toBe(p.appearanceRevision! + 1)
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, member))
      expect(profile.avatarConfig).not.toHaveProperty('equipment')
      expect(JSON.stringify(profile.equippedAppearance)).not.toContain(bow.id)
    })
    it('allows exactly one simultaneous save at the same revision', async () => {
      const p = await load(),
        data = {
          expectedRevision: p.appearanceRevision!,
          config: p.config!,
          placements: p.items.map((i) => ({
            id: i.id,
            equippedSlot: i.equippedSlot,
            vaultIndex: i.vaultIndex,
          })),
        }
      const result = await Promise.allSettled([
        saveCharacterHandler({ context, data }),
        saveCharacterHandler({ context, data }),
      ])
      expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
      const rejected = result.find((r) => r.status === 'rejected') as PromiseRejectedResult
      expect(rejected.reason.message).toContain('another session')
    })
    it('rejects forged ownership and invalid SQL placements without partial changes', async () => {
      const p = await load(),
        placements = p.items.map((i) => ({
          id: i.id,
          equippedSlot: i.equippedSlot,
          vaultIndex: i.vaultIndex,
        }))
      const invalid = placements.map((i, n) => (n ? i : { ...i, id: randomUUID() }))
      await expect(
        saveCharacterHandler({
          context,
          data: { expectedRevision: p.appearanceRevision!, config: p.config!, placements: invalid },
        }),
      ).rejects.toThrow('unowned')
      // Exercise the DB contract directly too, rather than only checking JS validation.
      for (const candidate of [
        invalid,
        placements.map((i, n) => (n ? i : { ...i, equippedSlot: 'head' })),
        placements.map((i, n) => ({ ...i, equippedSlot: null, vaultIndex: n === 0 ? 20 : n })),
      ]) {
        await expect(
          db.execute(
            sql`SELECT public.commit_character(${member},${p.appearanceRevision},${JSON.stringify({ ...p.config, shellColor: 'gold' })}::jsonb,${JSON.stringify(candidate)}::jsonb)`,
          ),
        ).rejects.toThrow()
        const after = await load()
        expect(after.appearanceRevision).toBe(p.appearanceRevision)
        expect(after.items).toEqual(p.items)
        expect(after.config).toEqual(p.config)
      }
    })
    it('rolls back completed inventory writes if the surrounding transaction fails', async () => {
      const p = await load()
      const placements = p.items.map((i, n) => ({ id: i.id, equippedSlot: null, vaultIndex: n }))
      const client = neon(resolveIntegrationDatabaseUrl(process.env))
      await expect(
        client.transaction([
          client`SELECT public.commit_character(${member},${p.appearanceRevision},${JSON.stringify({ ...p.config, shellColor: 'gold' })}::jsonb,${JSON.stringify(placements)}::jsonb)`,
          client`SELECT 1/0`,
        ]),
      ).rejects.toThrow()
      const after = await load()
      expect(after.config).toEqual(p.config)
      expect(after.items).toEqual(p.items)
      expect(after.appearanceRevision).toBe(p.appearanceRevision)
    })
    it('legacy gear moves use the same revision and appearance contract', async () => {
      const p = await load(),
        head = p.items.find((i) => i.equippedSlot === 'head')!
      const result = await moveGearItemHandler({
        context,
        data: { itemId: head.id, target: { type: 'vault', index: 19 } },
      })
      expect(result.config?.equipment?.head).toBeUndefined()
      expect(result.appearanceRevision).toBe(p.appearanceRevision! + 1)
    })
  },
  30000,
)
