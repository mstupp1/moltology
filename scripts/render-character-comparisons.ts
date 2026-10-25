/** Headless visual QA. Run: node --import tsx scripts/render-character-comparisons.ts [output-directory] */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { generateLobsterAvatarSvg } from '../src/lib/lobster-avatar'
import { STARTER_CHARACTER_EQUIPMENT } from '../src/lib/avatar/starter-equipment'
import { EQUIPMENT_VISUALS, equipmentThumbnail } from '../src/lib/avatar/equipment'
const output = path.resolve(process.argv[2] || 'scratch/character-comparisons')
await fs.mkdir(output, { recursive: true })
const samples = []
for (const race of ['lobster', 'crab'] as const)
  for (const pose of ['rest', 'wave', 'cheer', 'flex'] as const) {
    const index = (samples.length / 2) % 4
    const config = {
      style: 'critters' as const,
      seed: 'comparison',
      race,
      pose,
      shellColor: race === 'lobster' ? 'coral' : 'cobalt',
      marking: 'none' as const,
      antennae: 'whip' as const,
      shellFinish: 'satin' as const,
      mouth: 'smile' as const,
      eyelidStyle: 'open' as const,
      eyeColor: 'emerald' as const,
      headShape: index === 2 ? ('wide' as const) : ('bean' as const),
      build:
        index === 2 ? ('chunky' as const) : index === 3 ? ('slim' as const) : ('classic' as const),
      height:
        index === 1
          ? ('towering' as const)
          : index === 3
            ? ('short' as const)
            : ('regular' as const),
      armScale: index === 1 ? 1.3 : 1,
      backgroundTexture: 'none',
      transparentBackground: true,
      equipment:
        index === 0
          ? {}
          : index === 3
            ? {
                ...STARTER_CHARACTER_EQUIPMENT,
                head: { visualKey: 'creator-beanie', rarity: 'common' as const },
              }
            : {
                ...STARTER_CHARACTER_EQUIPMENT,
                head: { visualKey: 'oracle-dome-lattice', rarity: 'legendary' as const },
                carapace: { visualKey: 'hydrostatic-seal-plate', rarity: 'legendary' as const },
                'claws-1': { visualKey: 'tideforge-hammer', rarity: 'rare' as const },
                'claws-2': { visualKey: 'synapse-shear-claws', rarity: 'legendary' as const },
              },
    }
    const svg = generateLobsterAvatarSvg(config, 500, { staticMotion: true })!
    const png = await sharp(Buffer.from(svg)).png().toBuffer()
    await fs.writeFile(path.join(output, `${race}-${pose}.png`), png)
    const label = Buffer.from(
      `<svg width="500" height="42"><text x="22" y="28" font-family="sans-serif" font-size="18" fill="#c6d6d7">${race} · ${pose} · ${config.height}</text></svg>`,
    )
    samples.push(
      { input: png, left: index * 500, top: Math.floor(samples.length / 4) * 550 + 42 },
      { input: label, left: index * 500, top: Math.floor(samples.length / 4) * 550 },
    )
  }
// Each sample contributes two composites; normalize rows independently of composite count.
for (let i = 0; i < samples.length; i += 2) {
  const n = i / 2
  samples[i].left = (n % 4) * 500
  samples[i].top = Math.floor(n / 4) * 550 + 42
  samples[i + 1].left = (n % 4) * 500
  samples[i + 1].top = Math.floor(n / 4) * 550
}
await sharp({ create: { width: 2000, height: 1100, channels: 4, background: '#10212a' } })
  .composite(samples)
  .png()
  .toFile(path.join(output, 'characters.png'))
const visuals = Object.values(EQUIPMENT_VISUALS),
  cells = []
for (let i = 0; i < visuals.length; i++) {
  const v = visuals[i],
    svg = decodeURIComponent(equipmentThumbnail(v.key)!.split(',')[1])
  cells.push({
    input: await sharp(Buffer.from(svg))
      .resize(210, 240, { fit: 'contain', background: '#00000000' })
      .png()
      .toBuffer(),
    left: (i % 6) * 260 + 25,
    top: Math.floor(i / 6) * 285,
  })
  const name = v.key.replace(/^creator-/, '').replace(/-/g, ' ')
  const label = Buffer.from(
    `<svg width="260" height="40"><text x="10" y="20" font-family="sans-serif" font-size="12" fill="#c6d6d7">${name}</text></svg>`,
  )
  cells.push({ input: label, left: (i % 6) * 260, top: Math.floor(i / 6) * 285 + 240 })
}
await sharp({
  create: {
    width: 1560,
    height: Math.ceil(visuals.length / 6) * 285,
    channels: 4,
    background: '#10212a',
  },
})
  .composite(cells)
  .png()
  .toFile(path.join(output, 'equipment.png'))
console.log(`Character and equipment comparison sheets: ${output}`)
