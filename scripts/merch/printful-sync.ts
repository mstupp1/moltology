import { isPlaceholderSyncId, type MerchSeedProduct } from '../../src/lib/merch-seed-data'

export interface PrintfulCatalogVariant {
  id: number
  size: string | null
  color: string | null
}

export interface SyncFile {
  products: Record<string, { syncProductId: number; syncedAt: string }>
  variants: Record<string, { syncVariantId: number; catalogVariantId: number }>
}

const API = 'https://api.printful.com'

function normalize(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Finds the Printful blank for a catalog variant. Mugs match on size ("11 oz");
 * tees match on color and size.
 */
export function matchCatalogVariant(
  variants: PrintfulCatalogVariant[],
  wanted: { size: string | null; color: string | null },
  matchColor: boolean,
): PrintfulCatalogVariant | null {
  return (
    variants.find(
      (variant) =>
        normalize(variant.size) === normalize(wanted.size) &&
        (!matchColor || normalize(variant.color) === normalize(wanted.color)),
    ) ?? null
  )
}

export function formatRetailPrice(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function buildSyncProductPayload(input: {
  product: MerchSeedProduct
  catalogVariants: PrintfulCatalogVariant[]
  printFileUrl: (design: string) => string
  thumbnailUrl: string
}) {
  const matchColor = input.product.category !== 'Mugs'
  const missing: string[] = []
  const syncVariants = input.product.variants.flatMap((variant) => {
    const blank = matchCatalogVariant(input.catalogVariants, variant, matchColor)
    if (!blank) {
      missing.push(variant.title)
      return []
    }
    return [
      {
        external_id: variant.id,
        variant_id: blank.id,
        retail_price: formatRetailPrice(variant.priceCents),
        files: [{ type: input.product.printful.placement, url: input.printFileUrl(variant.design) }],
      },
    ]
  })
  return {
    missing,
    payload: {
      sync_product: {
        external_id: input.product.id,
        name: input.product.title,
        thumbnail: input.thumbnailUrl,
      },
      sync_variants: syncVariants,
    },
  }
}

export class PrintfulClient {
  constructor(
    private readonly token: string,
    private readonly storeId?: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    }
    if (this.storeId) headers['X-PF-Store-Id'] = this.storeId
    const response = await this.fetchImpl(`${API}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = (await response.json().catch(() => null)) as { result?: T; error?: { message?: string } } | null
    if (!response.ok || !json) {
      throw new Error(`Printful ${method} ${path} failed (${response.status}): ${json?.error?.message ?? 'no body'}`)
    }
    return json.result as T
  }

  async catalogProduct(productId: number): Promise<{ title: string; variants: PrintfulCatalogVariant[] }> {
    const result = await this.request<{
      product: { title: string }
      variants: Array<{ id: number; size: string | null; color: string | null }>
    }>('GET', `/products/${productId}`)
    return {
      title: result.product.title,
      variants: result.variants.map((variant) => ({ id: variant.id, size: variant.size, color: variant.color })),
    }
  }

  async createSyncProduct(payload: unknown): Promise<{ id: number }> {
    return this.request<{ id: number }>('POST', '/store/products', payload)
  }

  async syncProduct(id: number): Promise<{ sync_variants: Array<{ id: number; external_id: string; variant_id: number }> }> {
    return this.request('GET', `/store/products/${id}`)
  }

  async deleteSyncProduct(id: number): Promise<void> {
    await this.request('DELETE', `/store/products/${id}`)
  }
}

/** Variants that still need a Printful sync before they can be ordered. */
export function unsyncedVariants(catalog: MerchSeedProduct[]): string[] {
  return catalog.flatMap((product) =>
    product.variants
      .filter((variant) => isPlaceholderSyncId(variant.printfulSyncVariantId))
      .map((variant) => `${product.title} · ${variant.title}`),
  )
}
