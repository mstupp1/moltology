import type { NeonQueryFunction } from '@neondatabase/serverless'

const MAX_SERIALIZATION_ATTEMPTS = 3

export interface StoreCouponOrderClaimInput {
  orderId: string
  userId: string | null
  email: string
  shippingAddress: unknown
  subtotalCents: number
  shippingCents: number
  totalCents: number
  lineItems: unknown
  quoteSnapshot: unknown
  promotionCode: string
  promotionCodeId: string
  statusTokenHash: string
  fulfillmentMode: string
  livemode: boolean
}

/**
 * Atomically reserves a once-per-email promotion while creating the order.
 * Pending and consumed orders both retain the claim; only provider-final failed
 * orders release it. A retry of the same quote/order is idempotent.
 */
export async function createStoreCouponOrderClaim(
  client: NeonQueryFunction<false, false>,
  input: StoreCouponOrderClaimInput,
): Promise<'created' | 'existing' | 'conflict' | 'mismatch'> {
  for (let attempt = 1; attempt <= MAX_SERIALIZATION_ATTEMPTS; attempt += 1) {
    try {
      const query = client`
        WITH existing AS MATERIALIZED (
          SELECT id, "promotionCodeId"
          FROM merch_orders
          WHERE id = ${input.orderId}::uuid
        ), conflicting AS MATERIALIZED (
          SELECT id
          FROM merch_orders
          WHERE "promotionCodeId" = ${input.promotionCodeId}
            AND lower("customerEmail") = ${input.email.toLowerCase()}
            AND "paymentStatus" <> 'failed'
            AND id <> ${input.orderId}::uuid
          LIMIT 1
        ), inserted AS (
          INSERT INTO merch_orders (
            id, "userId", "customerEmail", "shippingAddress", "subtotalCents", "shippingCents",
            "totalCents", "lineItems", "quoteSnapshot", "promotionCode", "promotionCodeId",
            "statusTokenHash", "fulfillmentMode", "livemode"
          )
          SELECT ${input.orderId}::uuid, ${input.userId}, ${input.email}, ${JSON.stringify(input.shippingAddress)}::jsonb,
            ${input.subtotalCents}, ${input.shippingCents}, ${input.totalCents}, ${JSON.stringify(input.lineItems)}::jsonb,
            ${JSON.stringify(input.quoteSnapshot)}::jsonb, ${input.promotionCode}, ${input.promotionCodeId},
            ${input.statusTokenHash}, ${input.fulfillmentMode}, ${input.livemode}
          WHERE NOT EXISTS (SELECT 1 FROM existing)
            AND NOT EXISTS (SELECT 1 FROM conflicting)
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        )
        SELECT 'conflict'::text AS outcome FROM conflicting
        UNION ALL
        SELECT 'created'::text AS outcome FROM inserted
        UNION ALL
        SELECT CASE WHEN existing."promotionCodeId" = ${input.promotionCodeId} THEN 'existing' ELSE 'mismatch' END::text AS outcome
        FROM existing
        WHERE NOT EXISTS (SELECT 1 FROM conflicting)
        LIMIT 1
      `
      const [result] = await client.transaction([query], { isolationLevel: 'Serializable' })
      const outcome = (result[0] as { outcome?: string } | undefined)?.outcome
      if (outcome === 'created' || outcome === 'existing' || outcome === 'conflict' || outcome === 'mismatch') return outcome
      throw new Error('Could not reserve this promo code. Try again.')
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined
      if (code !== '40001' || attempt === MAX_SERIALIZATION_ATTEMPTS) throw error
    }
  }
  throw new Error('Serializable coupon claim retry exhausted.')
}
