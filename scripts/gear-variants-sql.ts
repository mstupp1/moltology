/** Prints the catalog INSERT for every rarer variant. Paste it into a migration when base pieces change. */
import { VARIANT_EQUIPMENT_CATALOG, catalogSeedInsertValues } from '../src/lib/equipment-seed-data'
const q = (v: unknown) => v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${(typeof v === 'string' ? v : JSON.stringify(v)).replace(/'/g, "''")}'`
const cols = ['id','slug','name','flavorText','category','rarity','visualType','primaryStat','affixes','uniquePower','imageUrl','sortOrder','kind','artKey','appearanceKey'] as const
const rows = VARIANT_EQUIPMENT_CATALOG.map((c) => { const v = catalogSeedInsertValues(c) as any; return `(${cols.map((k) => { const x = v[k]; if (k==='affixes') return `${q(x)}::jsonb`; if (k==='uniquePower') return x ? `${q(x)}::jsonb` : 'NULL'; if (k==='id') return `${q(x)}::uuid`; return q(x) }).join(',')})` })
console.log(`INSERT INTO public.equipment_catalog (${cols.map((c) => `"${c}"`).join(',')}) VALUES\n${rows.join(',\n')}\nON CONFLICT (id) DO UPDATE SET ${cols.filter((c) => c !== 'id').map((c) => `"${c}"=EXCLUDED."${c}"`).join(',')};`)
console.error(rows.length)
