import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPrintfulOrder, ensurePrintfulOrder, findPrintfulOrder } from './printful'
import type { PrintfulOrderPayload } from '../merch'

const payload: PrintfulOrderPayload = {
  external_id: 'order-1', shipping: 'STANDARD', draft: true,
  recipient: { name: 'Ops', address1: '1 Test', city: 'Seattle', country_code: 'US', zip: '98101', email: 'ops@example.com' },
  items: [{ sync_variant_id: 4123456789, quantity: 1 }],
}
const response = (status = 200, orderStatus = 'draft') => new Response(JSON.stringify({ result: { id: 42, status: orderStatus } }), { status })
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

describe('Printful orders', () => {
  it.each([true, false])('sets the confirmation query and strips internal draft=%s', async draft => {
    const fetchImpl = vi.fn(async () => response())
    expect(await createPrintfulOrder('token', { ...payload, draft }, fetchImpl, '123')).toEqual({ id: '42', status: 'draft' })
    expect(fetchImpl).toHaveBeenCalledWith(`https://api.printful.com/orders?confirm=${!draft}`, expect.objectContaining({
      method: 'POST', headers: expect.objectContaining({ 'X-PF-Store-Id': '123' }),
    }))
    const request = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(request[1].body as string)).not.toHaveProperty('draft')
  })
  it('does not interpret authorization or network failures as missing orders', async () => {
    await expect(findPrintfulOrder('token', 'order-1', vi.fn(async () => response(403)))).rejects.toThrow('(403)')
    expect(await findPrintfulOrder('token', 'order-1', vi.fn(async () => response(404)))).toBeNull()
  })
  it('reuses an existing order without posting again', async () => {
    const fetchImpl = vi.fn(async () => response())
    vi.stubGlobal('fetch', fetchImpl)
    expect(await ensurePrintfulOrder('token', payload)).toEqual({ id: '42', status: 'draft' })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
  it('reconciles a POST response lost after Printful accepted the order', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(response(404)).mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce(response())
    vi.stubGlobal('fetch', fetchImpl)
    expect(await ensurePrintfulOrder('token', payload)).toEqual({ id: '42', status: 'draft' })
    expect(fetchImpl.mock.calls.filter(call => call[1]?.method === 'POST')).toHaveLength(1)
  })
  it('fails closed when lookup fails and never stores provider PII', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: { message: 'Private street address' } }), { status: 400 }))
    vi.stubGlobal('fetch', fetchImpl)
    await expect(ensurePrintfulOrder('token', payload)).rejects.toThrow('Printful request failed (400).')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
