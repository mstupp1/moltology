/**
 * The merch catalog. One list feeds the DB seed, preview mode, the Printful sync, and the
 * mockup generator, so a new item is added here once.
 *
 * Image fields hold bucket keys (`images/merch/...`); pages render them through getAssetUrl.
 * `printfulSyncVariantId` starts as a placeholder. `npm run merch -- sync` creates the Printful
 * products and records the real ids in content/merch/printful-sync.json, which overrides the
 * placeholders below. See docs/merch-launch.md.
 */
import printfulSync from '../../content/merch/printful-sync.json'

export type MerchPrintPlacement = 'default' | 'front'

export interface MerchSeedVariant {
  id: string
  title: string
  size: string | null
  color: string | null
  colorHex: string | null
  priceCents: number
  imageUrl: string | null
  printfulSyncVariantId: number
  /** Print file design key, see scripts/merch/designs.ts. */
  design: string
}

export interface MerchSeedProduct {
  id: string
  title: string
  slug: string
  description: string
  category: string
  featuredImageUrl: string
  galleryImageUrls: string[]
  basePriceCents: number
  isPublished: boolean
  sortOrder: number
  printful: {
    /** Printful catalog product id (blank product). */
    catalogProductId: number
    placement: MerchPrintPlacement
  }
  variants: MerchSeedVariant[]
}

/** Older demo products. The seed unpublishes them. */
export const RETIRED_MERCH_SLUGS = ['benthic-shell-tee', 'pressure-mug', 'order-emblem-sticker']

export const MERCH_IMAGE_PREFIX = 'images/merch'
export const MERCH_PRINT_PREFIX = 'merch/print'

/** Printful catalog ids for the blanks. Verify with `npm run merch -- blanks`. */
export const PRINTFUL_BLANKS = {
  /** White glossy mug, 11 oz and 15 oz. */
  mug: 19,
  /** Bella + Canvas 3001 unisex tee. */
  tee: 71,
} as const

const MUG_SIZES = [
  { size: '11 oz', priceCents: 1800 },
  { size: '15 oz', priceCents: 2200 },
]

const TEE_SIZES = [
  { size: 'S', priceCents: 3000 },
  { size: 'M', priceCents: 3000 },
  { size: 'L', priceCents: 3000 },
  { size: 'XL', priceCents: 3000 },
  { size: '2XL', priceCents: 3300 },
]

export const TEE_COLORS = {
  Black: '#0c0c0e',
  White: '#f4f4f2',
} as const

type TeeColor = keyof typeof TEE_COLORS

const uuid = (product: number, variant: number) =>
  `22222222-2222-4222-8222-${String(product).padStart(4, '0')}${String(variant).padStart(8, '0')}`

const placeholderSyncId = (product: number, variant: number) => 920000 + product * 100 + variant

const image = (name: string) => `${MERCH_IMAGE_PREFIX}/${name}.jpg`

function mug(input: {
  n: number
  slug: string
  title: string
  description: string
  design: string
  /** Override the print canvas for sizes with a different Printful template. */
  sizeDesigns?: Record<string, string>
  /** Wrap color shown as the swatch. */
  wrap: { name: string; hex: string }
}): MerchSeedProduct {
  const featured = image(`${input.slug}-1`)
  return {
    id: uuid(input.n, 0),
    title: input.title,
    slug: input.slug,
    description: input.description,
    category: 'Mugs',
    featuredImageUrl: featured,
    galleryImageUrls: [featured, image(`${input.slug}-2`)],
    basePriceCents: MUG_SIZES[0].priceCents,
    isPublished: true,
    sortOrder: input.n,
    printful: { catalogProductId: PRINTFUL_BLANKS.mug, placement: 'default' },
    variants: MUG_SIZES.map((option, index) => ({
      id: uuid(input.n, index + 1),
      title: option.size,
      size: option.size,
      color: input.wrap.name,
      colorHex: input.wrap.hex,
      priceCents: option.priceCents,
      imageUrl: featured,
      printfulSyncVariantId: placeholderSyncId(input.n, index + 1),
      design: input.sizeDesigns?.[option.size] ?? input.design,
    })),
  }
}

function tee(input: {
  n: number
  slug: string
  title: string
  description: string
  /** Design per shirt color. */
  designs: Partial<Record<TeeColor, string>>
}): MerchSeedProduct {
  const colors = Object.keys(input.designs) as TeeColor[]
  const colorImage = (color: TeeColor) => image(`${input.slug}-${color.toLowerCase()}`)
  const variants: MerchSeedVariant[] = []
  colors.forEach((color, colorIndex) => {
    TEE_SIZES.forEach((option, sizeIndex) => {
      const index = colorIndex * 10 + sizeIndex + 1
      variants.push({
        id: uuid(input.n, index),
        title: `${color} / ${option.size}`,
        size: option.size,
        color,
        colorHex: TEE_COLORS[color],
        priceCents: option.priceCents,
        imageUrl: colorImage(color),
        printfulSyncVariantId: placeholderSyncId(input.n, index),
        design: input.designs[color]!,
      })
    })
  })
  return {
    id: uuid(input.n, 0),
    title: input.title,
    slug: input.slug,
    description: input.description,
    category: 'Tees',
    featuredImageUrl: colorImage(colors[0]),
    galleryImageUrls: colors.map(colorImage),
    basePriceCents: TEE_SIZES[0].priceCents,
    isPublished: true,
    sortOrder: input.n,
    printful: { catalogProductId: PRINTFUL_BLANKS.tee, placement: 'front' },
    variants,
  }
}

export const MERCH_PILOT_SLUGS = ['synaptic-mark-mug', 'synaptic-mark-tee'] as const

const BASE_CATALOG: MerchSeedProduct[] = [
  mug({
    n: 8,
    slug: 'synaptic-mark-mug',
    title: 'Synaptic Mark Mug',
    description: 'White ceramic with the red Synaptic Path emblem on one face and the wordmark on the other.',
    design: 'mug-synaptic-mark',
    sizeDesigns: { '15 oz': 'mug-synaptic-mark-15oz' },
    wrap: { name: 'White', hex: '#ffffff' },
  }),
  tee({
    n: 9,
    slug: 'synaptic-mark-tee',
    title: 'Synaptic Mark Tee',
    description: 'A black cotton tee with a centered red emblem and white Synaptic Path wordmark.',
    designs: { Black: 'tee-synaptic-mark' },
  }),
  mug({
    n: 1,
    slug: 'synaptic-path-mug',
    title: 'Synaptic Path Mug',
    description: 'A black wrap with the red emblem and the full wordmark on both sides. Holds heat through the long watch.',
    design: 'mug-synaptic-path',
    wrap: { name: 'Abyss', hex: '#0b1114' },
  }),
  mug({
    n: 2,
    slug: 'circuit-claw-mug',
    title: 'Circuit Claw Mug',
    description: 'The circuit claw in cyan and red on a black wrap. One side faces you, one faces the room.',
    design: 'mug-circuit-claw',
    wrap: { name: 'Abyss', hex: '#0b1114' },
  }),
  mug({
    n: 3,
    slug: 'foundation-mug',
    title: 'Foundation Mug',
    description: 'Clean white ceramic with the Foundation lockup in red and ink. Dishwasher and microwave safe.',
    design: 'mug-foundation',
    wrap: { name: 'White', hex: '#f4f4f2' },
  }),
  mug({
    n: 4,
    slug: 'navigator-mug',
    title: 'Navigator Mug',
    description: 'The Navigator waves from one side; the emblem keeps watch from the other.',
    design: 'mug-navigator',
    wrap: { name: 'White', hex: '#f4f4f2' },
  }),
  tee({
    n: 5,
    slug: 'emblem-tee',
    title: 'Emblem Tee',
    description: 'A plain tee with one small red emblem on the chest. Soft cotton, regular fit, nothing to explain.',
    designs: { Black: 'tee-emblem-chest', White: 'tee-emblem-chest' },
  }),
  tee({
    n: 6,
    slug: 'synaptic-path-tee',
    title: 'Synaptic Path Tee',
    description: 'The stacked Synaptic Path lockup across the chest. Quiet from a distance, legible up close.',
    designs: { Black: 'tee-lockup-dark', White: 'tee-lockup-light' },
  }),
  tee({
    n: 7,
    slug: 'circuit-claw-tee',
    title: 'Circuit Claw Tee',
    description: 'The circuit claw printed large on black. For days when you intend to finish the thing.',
    designs: { Black: 'tee-circuit-claw' },
  }),
]

interface PrintfulSyncRecord {
  syncVariantId: number
  mockupUrl?: string
}

const SYNCED = (printfulSync as { variants?: Record<string, PrintfulSyncRecord> }).variants ?? {}

/** Applies recorded Printful sync ids over the placeholders. */
export function withPrintfulSync(
  catalog: MerchSeedProduct[],
  synced: Record<string, PrintfulSyncRecord> = SYNCED,
): MerchSeedProduct[] {
  return catalog.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => {
      const record = synced[variant.id]
      return record ? { ...variant, printfulSyncVariantId: record.syncVariantId } : variant
    }),
  }))
}

/** True when a variant still carries a placeholder id and cannot be ordered from Printful. */
export function isPlaceholderSyncId(id: number): boolean {
  return id >= 900000 && id < 1000000
}

export const INITIAL_MERCH_PRODUCTS: MerchSeedProduct[] = withPrintfulSync(BASE_CATALOG)

/** The catalog in the shape the store pages read. Used by preview mode. */
export function merchCatalogView(catalog: MerchSeedProduct[] = INITIAL_MERCH_PRODUCTS) {
  return catalog
    .filter((product) => product.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      category: product.category,
      featuredImageUrl: product.featuredImageUrl,
      galleryImageUrls: product.galleryImageUrls,
      basePriceCents: product.basePriceCents,
      sortOrder: product.sortOrder,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        title: variant.title,
        size: variant.size,
        color: variant.color,
        colorHex: variant.colorHex,
        priceCents: variant.priceCents,
        imageUrl: variant.imageUrl,
      })),
    }))
}
