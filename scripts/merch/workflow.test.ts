import { describe, expect, it, vi } from 'vitest'
import { selectMerchProducts, productAssetKeys } from './selection'
import { requireMerchDevDatabase } from './database'
import { buildSyncProductPayload, ensureSyncProduct, validateSyncProduct, PrintfulClient, type SyncProductDetail } from './printful-sync'
import { requireCompletedMockups } from './mockups'
import { variantTemplate, variantTemplates } from './templates'

const remote: SyncProductDetail = { sync_product: { id: 1, external_id: 'p' }, sync_variants: [] }

describe('private merch workflow', () => {
  it('carries both hoodie placements through template validation, upload selection, and sync', () => {
    const product = selectMerchProducts('moltology-hoodie')[0]
    const blanks = product.variants.map((v, index) => ({ id: 100 + index, size: v.size, color: 'Black' }))
    const info = { printfiles: [
      { printfile_id: 134, width: 1800, height: 1800, dpi: 150 },
      { printfile_id: 1, width: 1800, height: 2400, dpi: 150 },
    ], variant_printfiles: blanks.map(v => ({ variant_id: v.id, placements: { front: 134, back: 1 } })) }
    expect(variantTemplates(product, product.variants[0], blanks, info).map(t => t.placement)).toEqual(['front', 'back'])
    expect(productAssetKeys([product]).print).toEqual(['merch/print/hoodie-moltology-front-v1.png', 'merch/print/hoodie-moltology-back-v1.png'])
    const { payload, missing } = buildSyncProductPayload({ product, catalogVariants: blanks, printFileUrl: key => `https://example.com/${key}.png`, thumbnailUrl: 'https://example.com/photo.jpg' })
    expect(missing).toEqual([])
    expect(payload.sync_variants[0].files.map(file => file.type)).toEqual(['front', 'back'])
    expect(payload.sync_variants[0].files[1].url).toContain('hoodie-moltology-back-v1.png')
    expect(() => variantTemplates(product, product.variants[0], blanks, { ...info, printfiles: info.printfiles.slice(0, 1) })).toThrow('Missing Printful template')
    expect(() => variantTemplates(product, { ...product.variants[0], additionalPrints: [{ placement: 'back', design: 'hoodie-moltology-front-v1' }] }, blanks, info)).toThrow('dimensions')
    expect(() => variantTemplates(product, { ...product.variants[0], additionalPrints: [{ placement: 'front', design: product.variants[0].design }] }, blanks, info)).toThrow('Duplicate')
  })
  it('selects only the pilot and refuses unknown or conflicting selections', () => {
    const products = selectMerchProducts(undefined, true)
    expect(products.map(product => product.slug)).toEqual(['moltology-mug', 'moltology-tee'])
    expect(products.flatMap(product => product.variants)).toHaveLength(7)
    expect(selectMerchProducts('synaptic-mark-tee')).toHaveLength(1)
    expect(() => selectMerchProducts('typo')).toThrow('Unknown product')
    expect(() => selectMerchProducts('synaptic-mark-tee', true)).toThrow('not both')
    expect(productAssetKeys(products).print).toEqual([
      'merch/print/mug-moltology-v2.png', 'merch/print/mug-moltology-v2-15oz.png', 'merch/print/tee-moltology-v2.png',
    ])
    expect(productAssetKeys(products).mockups.every(key => key.includes('moltology'))).toBe(true)
  })
  it('requires a verified dev endpoint and rejects production/other databases', () => {
    const env = { DATABASE_URL: 'postgres://owner:secret@ep-dev-pooler.us-east-2.aws.neon.tech/db', NEON_DEV_ENDPOINT_ID: 'ep-dev' }
    expect(requireMerchDevDatabase(env)).toBe(env.DATABASE_URL)
    expect(() => requireMerchDevDatabase({ DATABASE_URL: env.DATABASE_URL })).toThrow('verifying')
    expect(() => requireMerchDevDatabase({ ...env, NEON_DEV_ENDPOINT_ID: 'ep-other' })).toThrow('does not match')
    expect(() => requireMerchDevDatabase({ ...env, PROD_DATABASE_URL: env.DATABASE_URL.replace('-pooler', '') })).toThrow('production')
  })
  it('rejects recovered products with missing or mismatched blank variants', () => {
    expect(() => validateSyncProduct(remote, [{ external_id: 'v', variant_id: 1320 }])).toThrow('incomplete')
    const detail = { ...remote, sync_variants: [{ id: 4123456789, external_id: 'v', variant_id: 1320 }] }
    expect(() => validateSyncProduct(detail, [{ external_id: 'v', variant_id: 1320 }])).not.toThrow()
    expect(() => validateSyncProduct(detail, [{ external_id: 'v', variant_id: 4830 }])).toThrow('different blanks')
  })

  it('recovers a product created before the sync ledger was written', async () => {
    const client = { findSyncProduct: vi.fn().mockResolvedValue(remote), createSyncProduct: vi.fn(), syncProduct: vi.fn() }
    expect(await ensureSyncProduct(client as unknown as PrintfulClient, 'p', {})).toEqual(remote)
    expect(client.createSyncProduct).not.toHaveBeenCalled()
    client.findSyncProduct.mockResolvedValueOnce(null).mockResolvedValueOnce(remote)
    client.createSyncProduct.mockRejectedValueOnce(new Error('response lost'))
    expect(await ensureSyncProduct(client as unknown as PrintfulClient, 'p', {})).toEqual(remote)
    expect(client.createSyncProduct).toHaveBeenCalledTimes(1)
  })
  it('rejects an Etsy store and sends the store header for a manual store', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ result: [{ id: 1, type: 'etsy' }] })))
    await expect(new PrintfulClient('token', undefined, fetchImpl).requireManualStore()).rejects.toThrow('Etsy')
    fetchImpl.mockResolvedValueOnce(new Response(JSON.stringify({ result: [{ id: 2, type: 'native' }] })))
    const client = new PrintfulClient('token', undefined, fetchImpl)
    expect(await client.requireManualStore()).toBe(2)
    fetchImpl.mockResolvedValueOnce(new Response(JSON.stringify({ result: remote })))
    await client.syncProduct(1)
    expect(fetchImpl).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ headers: expect.objectContaining({ 'X-PF-Store-Id': '2' }) }))
  })
  it('never accepts failed, pending or empty mockup output as completed', () => {
    for (const status of ['pending', 'failed', 'completed'] as const) expect(() => requireCompletedMockups({ task_key: 'task', status })).toThrow('preserved')
    expect(requireCompletedMockups({ task_key: 'task', status: 'completed', mockups: [{ variant_ids: [1], mockup_url: 'https://example.test/photo.jpg' }] })).toHaveLength(1)
  })
  it('validates the taller mug template separately from 11oz', () => {
    const product = selectMerchProducts('synaptic-mark-mug')[0]
    const blanks = [{ id: 1320, color: 'White', size: '11 oz' }, { id: 4830, color: 'White', size: '15 oz' }]
    const info = { printfiles: [{ printfile_id: 43, width: 2700, height: 1050, dpi: 300 }, { printfile_id: 44, width: 2700, height: 1140, dpi: 300 }], variant_printfiles: [{ variant_id: 1320, placements: { default: 43 } }, { variant_id: 4830, placements: { default: 44 } }] }
    expect(variantTemplate(product, product.variants[1], blanks, info).design.height).toBe(1140)
    expect(() => variantTemplate(product, { ...product.variants[1], design: product.variants[0].design }, blanks, info)).toThrow('dimensions')
  })
})

describe('Stripe local configuration', () => {
  it('replaces only the signing secret and preserves other local settings', async () => {
    const { withStripeWebhookSecret } = await import('./stripe-listener')
    const result = withStripeWebhookSecret('OTHER_KEY="unchanged"\nSTRIPE_WEBHOOK_SECRET="old"\n', 'whsec_localtest')
    expect(result).toBe('OTHER_KEY="unchanged"\nSTRIPE_WEBHOOK_SECRET="whsec_localtest"\n')
    expect(() => withStripeWebhookSecret('', 'invalid\nINJECTED=true')).toThrow('Invalid')
  })
})

describe('mockup task recovery', () => {
  it('requests both hoodie files and saves front/back responses by placement, regardless of response order', async () => {
    const fs = await import('node:fs')
    const os = await import('node:os')
    const path = await import('node:path')
    const sharp = (await import('sharp')).default
    const { generatePrintfulMockups } = await import('./mockups')
    const product = selectMerchProducts('moltology-hoodie')[0]
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'merch-hoodie-'))
    const variants = product.variants.map((v, index) => ({ id: 100 + index, size: v.size, color: 'Black' }))
    const ids = variants.map(v => v.id)
    const client = {
      requireManualStore: vi.fn().mockResolvedValue(2),
      catalogProduct: vi.fn().mockResolvedValue({ variants }),
      printfiles: vi.fn().mockResolvedValue({ printfiles: [
        { printfile_id: 134, width: 1800, height: 1800, dpi: 150 }, { printfile_id: 1, width: 1800, height: 2400, dpi: 150 },
      ], variant_printfiles: variants.map(v => ({ variant_id: v.id, placements: { front: 134, back: 1 } })) }),
      createMockupTask: vi.fn().mockResolvedValue({ task_key: 'hoodie' }),
      mockupTask: vi.fn().mockResolvedValue({ task_key: 'hoodie', status: 'completed', mockups: [
        { placement: 'back', variant_ids: ids, mockup_url: 'https://example.test/back.jpg' },
        { placement: 'front', variant_ids: ids, mockup_url: 'https://example.test/front.jpg' },
      ] }),
    }
    const photo = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000000' } }).jpeg().toBuffer()
    const fetchMock = vi.fn().mockImplementation(async () => new Response(new Uint8Array(photo)))
    vi.stubGlobal('fetch', fetchMock)
    try {
      await generatePrintfulMockups(client as unknown as PrintfulClient, [product], out)
      expect(client.createMockupTask.mock.calls[0][1].files.map((f: { placement: string }) => f.placement)).toEqual(['front', 'back'])
      expect(fetchMock.mock.calls.map(call => call[0])).toEqual(['https://example.test/front.jpg', 'https://example.test/back.jpg'])
      expect(fs.existsSync(path.join(out, 'mockups/moltology-hoodie-v1-black-back.jpg'))).toBe(true)
    } finally { vi.unstubAllGlobals(); fs.rmSync(out, { recursive: true, force: true }) }
  })
  it('preserves failed task metadata and previous photos without creating another task on rerun', async () => {
    const fs = await import('node:fs')
    const os = await import('node:os')
    const path = await import('node:path')
    const { generatePrintfulMockups } = await import('./mockups')
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'merch-mockup-'))
    const client = {
      requireManualStore: vi.fn().mockResolvedValue(2),
      catalogProduct: vi.fn().mockResolvedValue({ variants: [{ id: 1320, color: 'White', size: '11 oz' }, { id: 4830, color: 'White', size: '15 oz' }] }),
      printfiles: vi.fn().mockResolvedValue({ printfiles: [{ printfile_id: 43, width: 2700, height: 1050, dpi: 300 }], variant_printfiles: [{ variant_id: 1320, placements: { default: 43 } }] }),
      createMockupTask: vi.fn().mockResolvedValue({ task_key: 'failed-task' }),
      mockupTask: vi.fn().mockResolvedValue({ task_key: 'failed-task', status: 'failed' }),
    }
    try {
      fs.mkdirSync(path.join(out, 'mockups'))
      const photo = path.join(out, 'mockups/synaptic-mark-mug-1.jpg')
      fs.writeFileSync(photo, 'previous-final-photo')
      for (let attempt = 0; attempt < 2; attempt++) {
        await expect(generatePrintfulMockups(client as unknown as PrintfulClient, selectMerchProducts('synaptic-mark-mug'), out)).rejects.toThrow('preserved')
      }
      expect(client.createMockupTask).toHaveBeenCalledTimes(1)
      expect(JSON.parse(fs.readFileSync(path.join(out, 'tasks/2/synaptic-mark-mug-mug-synaptic-mark.json'), 'utf8'))).toMatchObject({ task_key: 'failed-task', status: 'failed' })
      expect(fs.readFileSync(photo, 'utf8')).toBe('previous-final-photo')
    } finally { fs.rmSync(out, { recursive: true, force: true }) }
  })
})

describe('Printful rate limits', () => {
  it('honors Retry-After for an explicitly rate-limited request', async () => {
    vi.useFakeTimers()
    try {
      const fetchImpl = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'rate limited' } }), { status: 429, headers: { 'retry-after': '1' } }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ result: { task_key: 'retry-task' } })))
      const promise = new PrintfulClient('token', '2', fetchImpl).createMockupTask(71, {})
      await vi.advanceTimersByTimeAsync(1000)
      expect(await promise).toEqual({ task_key: 'retry-task' })
      expect(fetchImpl).toHaveBeenCalledTimes(2)
    } finally { vi.useRealTimers() }
  })
})
