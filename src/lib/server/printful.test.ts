import { describe, expect, it, vi } from 'vitest'
import { createPrintfulOrder } from './printful'

describe('createPrintfulOrder', () => {
  it('posts the payload and returns the Printful order id', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ result: { id: 42 } }), { status: 200 }))
    const result = await createPrintfulOrder(
      'token',
      {
        external_id: 'order-1',
        shipping: 'STANDARD',
        draft: true,
        recipient: {
          name: 'Ops',
          address1: '1 Trench',
          city: 'Seattle',
          state_code: 'WA',
          country_code: 'US',
          zip: '98101',
          email: 'ops@example.com',
        },
        items: [{ sync_variant_id: 910002, quantity: 1 }],
      },
      fetchImpl,
    )
    expect(result).toEqual({ id: '42' })
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.printful.com/orders',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    )
  })

  it('surfaces a Printful error message', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: { message: 'Variant was not found.' } }), { status: 400 }),
    )
    await expect(
      createPrintfulOrder(
        'token',
        {
          external_id: 'order-1',
          shipping: 'STANDARD',
          draft: true,
          recipient: {
            name: 'Ops',
            address1: '1 Trench',
            city: 'Seattle',
            country_code: 'US',
            zip: '98101',
            email: 'ops@example.com',
          },
          items: [],
        },
        fetchImpl,
      ),
    ).rejects.toThrow('Variant was not found.')
  })
})
