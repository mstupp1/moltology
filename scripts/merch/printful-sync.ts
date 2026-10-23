import { isPlaceholderSyncId, type MerchSeedProduct } from '../../src/lib/merch-seed-data'

export interface PrintfulCatalogVariant {
  id: number
  size: string | null
  color: string | null
}

export interface SyncFile {
  storeId?: number
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
        ...(input.product.printful.options ? { options: input.product.printful.options } : {}),
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
    private storeId?: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async request<T>(method: string, path: string, body?: unknown, attempt = 0): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    }
    if (this.storeId) headers['X-PF-Store-Id'] = this.storeId
    const response = await this.fetchImpl(`${API}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    })
    const json = (await response.json().catch(() => null)) as { result?: T; error?: { message?: string } } | null
    if (response.status === 429 && attempt < 2) {
      const seconds = Number(response.headers.get('retry-after') ?? '60')
      const delay = Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, 60_000) : 60_000
      console.log(`Printful rate limit; retrying in ${Math.ceil(delay / 1000)} seconds.`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return this.request<T>(method, path, body, attempt + 1)
    }
    if (!response.ok || !json?.result) throw new PrintfulApiError(response.status, method, path)
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

  async stores(): Promise<Array<{ id: number; name: string; type: string }>> {
    return this.request('GET', '/stores')
  }

  async requireManualStore(): Promise<number> {
    const stores = await this.stores()
    const store = this.storeId ? stores.find(item => String(item.id) === this.storeId) : stores.length === 1 ? stores[0] : null
    if (!store || !['native', 'api', 'manual'].includes(store.type)) {
      throw new Error('Select a Printful Manual order platform/API store with PRINTFUL_STORE_ID. Etsy stores cannot be used for this pilot.')
    }
    // Account tokens require this header even if only one store is visible.
    this.storeId = String(store.id)
    return store.id
  }

  async findSyncProduct(externalId: string): Promise<SyncProductDetail | null> {
    try { return await this.request('GET', `/store/products/@${encodeURIComponent(externalId)}`) }
    catch (error) { if (error instanceof PrintfulApiError && error.status === 404) return null; throw error }
  }

  async printfiles(productId: number): Promise<PrintfileInfo> {
    return this.request('GET', `/mockup-generator/printfiles/${productId}`)
  }

  async createMockupTask(productId: number, body: unknown): Promise<{ task_key: string }> {
    return this.request('POST', `/mockup-generator/create-task/${productId}`, body)
  }

  async mockupTask(key: string): Promise<MockupTask> {
    return this.request('GET', `/mockup-generator/task?task_key=${encodeURIComponent(key)}`)
  }

  async createSyncProduct(payload: unknown): Promise<{ id: number }> {
    return this.request<{ id: number }>('POST', '/store/products', payload)
  }

  async syncProduct(id: number): Promise<SyncProductDetail> {
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

export class PrintfulApiError extends Error {
  constructor(readonly status: number, method: string, path: string) {
    super(`Printful ${method} ${path} failed (${status}).`)
  }
}

export interface SyncProductDetail {
  sync_product: { id: number; external_id: string }
  sync_variants: Array<{ id: number; external_id: string; variant_id: number }>
}
export interface PrintfileInfo {
  option_groups?: string[]
  options?: string[]
  printfiles: Array<{ printfile_id: number; width: number; height: number; dpi: number }>
  variant_printfiles: Array<{ variant_id: number; placements: Record<string, number> }>
}
export interface MockupTask {
  task_key: string
  status: 'pending' | 'completed' | 'failed'
  mockups?: Array<{ variant_ids: number[]; mockup_url: string; extra?: Array<{ url: string; title?: string; option?: string; option_group?: string }> }>
}

/** Recover remote creation before writing the ledger; never recreate with --force. */
export async function ensureSyncProduct(client: PrintfulClient, externalId: string, payload: unknown): Promise<SyncProductDetail> {
  const existing = await client.findSyncProduct(externalId)
  if (existing) return existing
  try {
    const created = await client.createSyncProduct(payload)
    return await client.syncProduct(created.id)
  } catch (error) {
    const recovered = await client.findSyncProduct(externalId)
    if (recovered) return recovered
    throw error
  }
}

/** Existing external IDs must still refer to the requested blank variants. */
export function validateSyncProduct(detail: SyncProductDetail, expected: Array<{ external_id: string; variant_id: number }>): void {
  for (const variant of expected) {
    const remote = detail.sync_variants.find(item => item.external_id === variant.external_id)
    if (!remote || remote.variant_id !== variant.variant_id || !Number.isSafeInteger(remote.id) || remote.id <= 0) {
      throw new Error('Remote Printful product is incomplete or uses different blanks. Review it before seeding.')
    }
  }
}
