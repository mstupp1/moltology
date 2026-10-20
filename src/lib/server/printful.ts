import { printfulOrderExternalId, type PrintfulOrderPayload } from '../merch'

export interface PrintfulOrderResult {
  id: string
  status: string
}

export class PrintfulRequestError extends Error {
  constructor(readonly status: number) {
    // Provider messages can include customer addresses. Keep logs and stored errors safe.
    super(`Printful request failed (${status}).`)
  }
}

function headers(token: string, storeId?: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(storeId ? { 'X-PF-Store-Id': storeId } : {}),
  }
}

async function readOrder(response: Response): Promise<PrintfulOrderResult> {
  if (!response.ok) throw new PrintfulRequestError(response.status)
  const body = await response.json() as { result?: { id?: number | string; status?: string } }
  if (body.result?.id == null || !body.result.status) throw new Error('Printful did not return an order id and status.')
  return { id: String(body.result.id), status: body.result.status }
}

/** External IDs are unique per Printful store. Never treat a failed lookup as a missing order. */
export async function findPrintfulOrder(
  token: string,
  externalId: string,
  fetchImpl: typeof fetch = fetch,
  storeId = process.env.PRINTFUL_STORE_ID?.trim(),
): Promise<PrintfulOrderResult | null> {
  const response = await fetchImpl(`https://api.printful.com/orders/@${encodeURIComponent(printfulOrderExternalId(externalId))}`, {
    headers: headers(token, storeId),
    signal: AbortSignal.timeout(20_000),
  })
  if (response.status === 404) return null
  return readOrder(response)
}

/** `draft` is an internal instruction, never a Printful JSON field. */
export async function createPrintfulOrder(
  token: string,
  payload: PrintfulOrderPayload,
  fetchImpl: typeof fetch = fetch,
  storeId = process.env.PRINTFUL_STORE_ID?.trim(),
): Promise<PrintfulOrderResult> {
  const { draft, ...body } = payload
  const response = await fetchImpl(`https://api.printful.com/orders?confirm=${draft ? 'false' : 'true'}`, {
    method: 'POST',
    headers: headers(token, storeId),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  })
  return readOrder(response)
}

/** Recover a successful POST whose response was lost, without changing the existing order. */
export async function ensurePrintfulOrder(token: string, payload: PrintfulOrderPayload): Promise<PrintfulOrderResult> {
  const existing = await findPrintfulOrder(token, payload.external_id)
  if (existing) return existing
  try {
    return await createPrintfulOrder(token, payload)
  } catch (error) {
    const recovered = await findPrintfulOrder(token, payload.external_id)
    if (recovered) return recovered
    throw error
  }
}
