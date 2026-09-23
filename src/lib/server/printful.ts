import type { PrintfulOrderPayload } from '../merch'

export interface PrintfulOrderResult {
  id: string
}

/**
 * Creates a Printful order. `draft: true` on the payload keeps it from charging
 * the Printful wallet immediately.
 */
export async function createPrintfulOrder(
  token: string,
  payload: PrintfulOrderPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<PrintfulOrderResult> {
  const response = await fetchImpl('https://api.printful.com/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const body = (await response.json().catch(() => null)) as {
    result?: { id?: number | string }
    error?: { message?: string }
  } | null

  if (!response.ok) {
    const message = body?.error?.message?.trim() || 'Printful could not accept the order.'
    throw new Error(message)
  }

  const id = body?.result?.id
  if (id == null || String(id).trim() === '') {
    throw new Error('Printful did not return an order id.')
  }
  return { id: String(id) }
}
