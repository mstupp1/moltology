/**
 * Demo merch catalog. `printfulSyncVariantId` values are placeholders.
 * Replace them with real Printful sync variant ids before a live order.
 */
export interface MerchSeedVariant {
  id: string
  title: string
  size: string | null
  color: string | null
  colorHex: string | null
  priceCents: number
  imageUrl: string | null
  printfulSyncVariantId: number
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
  variants: MerchSeedVariant[]
}

const EMBLEM = '/images/order_emblem.png'

export const INITIAL_MERCH_PRODUCTS: MerchSeedProduct[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    title: 'Benthic Shell Tee',
    slug: 'benthic-shell-tee',
    description: 'A heavyweight tee for the walk between the surface and the shell.',
    category: 'Apparel',
    featuredImageUrl: EMBLEM,
    galleryImageUrls: [EMBLEM],
    basePriceCents: 2800,
    isPublished: true,
    sortOrder: 1,
    variants: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Abyss / S',
        size: 'S',
        color: 'Abyss',
        colorHex: '#12181c',
        priceCents: 2800,
        imageUrl: EMBLEM,
        printfulSyncVariantId: 910001,
      },
      {
        id: '11111111-1111-4111-8111-111111111112',
        title: 'Abyss / M',
        size: 'M',
        color: 'Abyss',
        colorHex: '#12181c',
        priceCents: 2800,
        imageUrl: EMBLEM,
        printfulSyncVariantId: 910002,
      },
      {
        id: '11111111-1111-4111-8111-111111111113',
        title: 'Abyss / L',
        size: 'L',
        color: 'Abyss',
        colorHex: '#12181c',
        priceCents: 2800,
        imageUrl: EMBLEM,
        printfulSyncVariantId: 910003,
      },
      {
        id: '11111111-1111-4111-8111-111111111114',
        title: 'Pressure / S',
        size: 'S',
        color: 'Pressure',
        colorHex: '#1aa6c4',
        priceCents: 2800,
        imageUrl: EMBLEM,
        printfulSyncVariantId: 910011,
      },
      {
        id: '11111111-1111-4111-8111-111111111115',
        title: 'Pressure / M',
        size: 'M',
        color: 'Pressure',
        colorHex: '#1aa6c4',
        priceCents: 2800,
        imageUrl: EMBLEM,
        printfulSyncVariantId: 910012,
      },
      {
        id: '11111111-1111-4111-8111-111111111116',
        title: 'Pressure / L',
        size: 'L',
        color: 'Pressure',
        colorHex: '#1aa6c4',
        priceCents: 2800,
        imageUrl: EMBLEM,
        printfulSyncVariantId: 910013,
      },
    ],
  },
  {
    id: '11111111-1111-4111-8111-111111111201',
    title: 'Pressure Mug',
    slug: 'pressure-mug',
    description: 'A ceramic mug for the long watch. Holds heat. Holds still.',
    category: 'Drinkware',
    featuredImageUrl: EMBLEM,
    galleryImageUrls: [EMBLEM],
    basePriceCents: 1600,
    isPublished: true,
    sortOrder: 2,
    variants: [
      {
        id: '11111111-1111-4111-8111-111111111211',
        title: 'Abyss',
        size: null,
        color: 'Abyss',
        colorHex: '#12181c',
        priceCents: 1600,
        imageUrl: EMBLEM,
        printfulSyncVariantId: 910101,
      },
    ],
  },
  {
    id: '11111111-1111-4111-8111-111111111301',
    title: 'Order Emblem Sticker',
    slug: 'order-emblem-sticker',
    description: 'A small vinyl mark for a laptop, a case, or a field notebook.',
    category: 'Stickers',
    featuredImageUrl: EMBLEM,
    galleryImageUrls: [EMBLEM],
    basePriceCents: 500,
    isPublished: true,
    sortOrder: 3,
    variants: [
      {
        id: '11111111-1111-4111-8111-111111111311',
        title: 'Emblem',
        size: null,
        color: 'Emblem',
        colorHex: '#d7a23a',
        priceCents: 500,
        imageUrl: EMBLEM,
        printfulSyncVariantId: 910201,
      },
    ],
  },
]
