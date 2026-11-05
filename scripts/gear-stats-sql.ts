/** Prints an UPDATE that sets primaryStat and affixes on every catalog row from the seed data. Paste it into a migration when gear numbers change. */
import { ALL_EQUIPMENT_CATALOG } from '../src/lib/equipment-seed-data'
const q = (v: string) => `'${v.replace(/'/g, "''")}'`
const rows = ALL_EQUIPMENT_CATALOG.filter((c) => c.kind !== 'cosmetic').map(
  (c) => `(${q(c.id)}::uuid,${c.primaryStat},${q(JSON.stringify(c.affixes))}::jsonb)`,
)
console.log(`UPDATE public.equipment_catalog AS c SET "primaryStat" = v.stat, "affixes" = v.affixes
FROM (VALUES
${rows.join(',\n')}
) AS v(id, stat, affixes)
WHERE c.id = v.id;`)
console.error(rows.length)
