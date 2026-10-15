import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as dotenv from 'dotenv'
import * as schema from './schema'
import { inArray, sql } from 'drizzle-orm'
import { INITIAL_MERCH_PRODUCTS, RETIRED_MERCH_SLUGS } from '../lib/merch-seed-data'

dotenv.config()

type MerchDb = ReturnType<typeof drizzle<typeof schema>>

export async function seedMerchCatalog(db: MerchDb) {
  for (const product of INITIAL_MERCH_PRODUCTS) {
    await db
      .insert(schema.merchProducts)
      .values({
        id: product.id,
        title: product.title,
        slug: product.slug,
        description: product.description,
        category: product.category,
        featuredImageUrl: product.featuredImageUrl,
        galleryImageUrls: product.galleryImageUrls,
        basePriceCents: product.basePriceCents,
        isPublished: product.isPublished,
        sortOrder: product.sortOrder,
      })
      .onConflictDoUpdate({
        target: schema.merchProducts.slug,
        set: {
          title: product.title,
          description: product.description,
          category: product.category,
          featuredImageUrl: product.featuredImageUrl,
          galleryImageUrls: product.galleryImageUrls,
          basePriceCents: product.basePriceCents,
          isPublished: product.isPublished,
          sortOrder: product.sortOrder,
          updatedAt: sql`now()`,
        },
      })
    for (const variant of product.variants) {
      await db
        .insert(schema.merchVariants)
        .values({
          id: variant.id,
          productId: product.id,
          title: variant.title,
          size: variant.size,
          color: variant.color,
          colorHex: variant.colorHex,
          priceCents: variant.priceCents,
          imageUrl: variant.imageUrl,
          printfulSyncVariantId: variant.printfulSyncVariantId,
          isAvailable: true,
        })
        .onConflictDoUpdate({
          target: schema.merchVariants.id,
          set: {
            title: variant.title,
            size: variant.size,
            color: variant.color,
            colorHex: variant.colorHex,
            priceCents: variant.priceCents,
            imageUrl: variant.imageUrl,
            printfulSyncVariantId: variant.printfulSyncVariantId,
            updatedAt: sql`now()`,
          },
        })
    }
  }
  await db
    .update(schema.merchProducts)
    .set({ isPublished: false, updatedAt: sql`now()` })
    .where(inArray(schema.merchProducts.slug, RETIRED_MERCH_SLUGS))
  return INITIAL_MERCH_PRODUCTS.length
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set.')
  const db = drizzle(neon(url), { schema })
  const count = await seedMerchCatalog(db)
  console.log(`✓ Seeded ${count} merch products`)
}

if (process.argv[1]?.includes('seed-merch.ts')) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[SEED] merch catalog failed:', error)
      process.exit(1)
    })
}
