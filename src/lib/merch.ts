/**
 * Pure merch catalog, cart, Stripe Checkout, and Printful payload helpers.
 * Prices always come from the database. Client-supplied prices are ignored.
 */

export const ETSY_STORE_HREF = 'https://www.etsy.com/shop/SaasTrash'
export const NATIVE_STORE_PATH = '/store'
export const MERCH_ORDER_TYPE = 'merch'
export const MERCH_CART_STORAGE_KEY = 'moltology.merch.cart'
export const MERCH_MAX_QUANTITY = 10
export const MERCH_MAX_LINES = 20
export const DEFAULT_MERCH_SHIPPING_CENTS = 695
export const MERCH_CURRENCY = 'usd'

export const MERCH_SHIPPING_COUNTRIES = [
  'US',
  'CA',
  'GB',
  'AU',
  'DE',
  'FR',
  'NL',
  'IE',
  'NZ',
  'SE',
  'NO',
  'DK',
  'FI',
  'AT',
  'BE',
  'CH',
  'IT',
  'ES',
  'PT',
  'JP',
  'MX',
] as const

export type MerchFulfillmentStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'payment_failed'
  | 'paid'
  | 'processing'
  | 'printful_draft'
  | 'submitted_to_printful'
  | 'fulfillment_failed'

export interface MerchShippingAddress {
  name: string
  line1: string
  line2: string | null
  city: string
  state: string | null
  postalCode: string
  country: string
  phone: string | null
}

export interface MerchLineItemSnapshot {
  variantId: string
  productId: string
  productTitle: string
  productSlug: string
  variantTitle: string
  size: string | null
  color: string | null
  printfulSyncVariantId: number
  quantity: number
  unitPriceCents: number
}

export interface MerchVariantView {
  id: string
  title: string
  size: string | null
  color: string | null
  colorHex: string | null
  priceCents: number
  imageUrl: string | null
}

export interface MerchProductView {
  id: string
  title: string
  slug: string
  description: string
  category: string
  featuredImageUrl: string | null
  galleryImageUrls: string[]
  basePriceCents: number
  sortOrder: number
  variants: MerchVariantView[]
}

export interface MerchCartLine {
  variantId: string
  productSlug: string
  productTitle: string
  variantTitle: string
  size: string | null
  color: string | null
  colorHex: string | null
  imageUrl: string | null
  unitPriceCents: number
  quantity: number
}

export interface PricedVariant {
  variantId: string
  productId: string
  productTitle: string
  productSlug: string
  productPublished: boolean
  variantTitle: string
  size: string | null
  color: string | null
  printfulSyncVariantId: number
  priceCents: number
  isAvailable: boolean
}

export interface CheckoutLineRequest {
  variantId: string
  quantity: number
}

export type PricedCheckoutResult =
  | { ok: true; lines: MerchLineItemSnapshot[] }
  | { ok: false; message: string }

export function resolveStoreHref(canViewNativeStore: boolean): string {
  return canViewNativeStore ? NATIVE_STORE_PATH : ETSY_STORE_HREF
}

export function formatMerchPrice(cents: number): string {
  const amount = Number.isFinite(cents) ? cents : 0
  return `$${(amount / 100).toFixed(2)}`
}

export function readMerchShippingCents(raw: string | undefined | null): number {
  if (raw == null || raw.trim() === '') return DEFAULT_MERCH_SHIPPING_CENTS
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_MERCH_SHIPPING_CENTS
  return Math.round(parsed)
}

export function readAutomaticTaxEnabled(raw: string | undefined | null): boolean {
  return raw?.trim().toLowerCase() === 'true'
}

/** Fulfillment is opt-in. Test payments and preview deployments can never print. */
export function shouldDraftPrintfulOrder(env: {
  NODE_ENV?: string | null
  VERCEL_ENV?: string | null
  PRINTFUL_DRAFT?: string | null
  STRIPE_SECRET_KEY?: string | null
}, livemode = false): boolean {
  return !livemode || env.NODE_ENV !== 'production' ||
    (Boolean(env.VERCEL_ENV) && env.VERCEL_ENV !== 'production') ||
    env.PRINTFUL_DRAFT?.trim().toLowerCase() !== 'false' ||
    !/^(sk|rk)_live_/.test(env.STRIPE_SECRET_KEY ?? '')
}

/** Shared by catalog seeding and checkout; placeholder IDs must never be sold. */
export function isOrderablePrintfulId(id: number): boolean {
  return Number.isSafeInteger(id) && id > 0 && !(id >= 900000 && id < 1000000)
}

export function cartSubtotalCents(lines: MerchCartLine[]): number {
  return lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
}

export function cartItemCount(lines: MerchCartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0)
}

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1
  return Math.min(MERCH_MAX_QUANTITY, Math.max(1, Math.round(quantity)))
}

export function upsertCartLine(lines: MerchCartLine[], next: MerchCartLine): MerchCartLine[] {
  const quantity = clampQuantity(next.quantity)
  const existing = lines.find((line) => line.variantId === next.variantId)
  if (!existing) {
    return [...lines, { ...next, quantity }].slice(0, MERCH_MAX_LINES)
  }
  return lines.map((line) =>
    line.variantId === next.variantId
      ? { ...line, ...next, quantity: clampQuantity(line.quantity + quantity) }
      : line,
  )
}

export function setCartLineQuantity(lines: MerchCartLine[], variantId: string, quantity: number): MerchCartLine[] {
  if (quantity <= 0) return lines.filter((line) => line.variantId !== variantId)
  return lines.map((line) =>
    line.variantId === variantId ? { ...line, quantity: clampQuantity(quantity) } : line,
  )
}

export function readStoredCart(raw: string | null): MerchCartLine[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return []
      const line = entry as Partial<MerchCartLine>
      if (typeof line.variantId !== 'string' || typeof line.productTitle !== 'string') return []
      if (typeof line.unitPriceCents !== 'number' || typeof line.quantity !== 'number') return []
      return [
        {
          variantId: line.variantId,
          productSlug: typeof line.productSlug === 'string' ? line.productSlug : '',
          productTitle: line.productTitle,
          variantTitle: typeof line.variantTitle === 'string' ? line.variantTitle : line.productTitle,
          size: typeof line.size === 'string' ? line.size : null,
          color: typeof line.color === 'string' ? line.color : null,
          colorHex: typeof line.colorHex === 'string' ? line.colorHex : null,
          imageUrl: typeof line.imageUrl === 'string' ? line.imageUrl : null,
          unitPriceCents: line.unitPriceCents,
          quantity: clampQuantity(line.quantity),
        },
      ]
    })
  } catch {
    return []
  }
}

export function buildPricedCheckoutLines(
  variants: PricedVariant[],
  requested: CheckoutLineRequest[],
): PricedCheckoutResult {
  if (!Array.isArray(requested) || requested.length === 0) {
    return { ok: false, message: 'Add at least one piece before checkout.' }
  }
  if (requested.length > MERCH_MAX_LINES) {
    return { ok: false, message: `Checkout can include up to ${MERCH_MAX_LINES} pieces.` }
  }

  const merged = new Map<string, number>()
  for (const item of requested) {
    if (!item || typeof item.variantId !== 'string' || !item.variantId.trim()) {
      return { ok: false, message: 'One of those pieces is no longer available.' }
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MERCH_MAX_QUANTITY) {
      return { ok: false, message: `Choose a quantity from 1 to ${MERCH_MAX_QUANTITY}.` }
    }
    const id = item.variantId.trim()
    merged.set(id, (merged.get(id) ?? 0) + item.quantity)
  }

  const byId = new Map(variants.map((variant) => [variant.variantId, variant]))
  const lines: MerchLineItemSnapshot[] = []
  for (const [variantId, quantity] of merged) {
    if (quantity > MERCH_MAX_QUANTITY) {
      return { ok: false, message: `Choose a quantity from 1 to ${MERCH_MAX_QUANTITY}.` }
    }
    const variant = byId.get(variantId)
    if (!variant || !variant.productPublished || !variant.isAvailable || !isOrderablePrintfulId(variant.printfulSyncVariantId)) {
      return { ok: false, message: 'One of those pieces is no longer available.' }
    }
    lines.push({
      variantId: variant.variantId,
      productId: variant.productId,
      productTitle: variant.productTitle,
      productSlug: variant.productSlug,
      variantTitle: variant.variantTitle,
      size: variant.size,
      color: variant.color,
      printfulSyncVariantId: variant.printfulSyncVariantId,
      quantity,
      unitPriceCents: variant.priceCents,
    })
  }

  return { ok: true, lines }
}

export function checkoutLineName(line: Pick<MerchLineItemSnapshot, 'productTitle' | 'variantTitle'>): string {
  if (!line.variantTitle || line.variantTitle === line.productTitle) return line.productTitle
  return `${line.productTitle} — ${line.variantTitle}`
}

export interface MerchCheckoutSessionParams {
  mode: 'payment'
  managed_payments: { enabled: false }
  success_url: string
  cancel_url: string
  customer?: string
  customer_email?: string
  client_reference_id: string
  metadata: { orderType: string; orderId: string }
  shipping_address_collection: { allowed_countries: string[] }
  phone_number_collection: { enabled: true }
  automatic_tax?: { enabled: true }
  shipping_options: Array<{
    shipping_rate_data: {
      type: 'fixed_amount'
      display_name: string
      fixed_amount: { amount: number; currency: string }
      delivery_estimate: {
        minimum: { unit: 'business_day'; value: number }
        maximum: { unit: 'business_day'; value: number }
      }
    }
  }>
  line_items: Array<{
    quantity: number
    price_data: {
      currency: string
      unit_amount: number
      product_data: {
        name: string
        metadata: { variantId: string; printfulSyncVariantId: string }
      }
    }
  }>
}

export function buildMerchCheckoutSessionParams(input: {
  orderId: string
  lines: MerchLineItemSnapshot[]
  origin: string
  shippingCents: number
  customerId: string | null
  customerEmail: string | null
  automaticTax: boolean
}): MerchCheckoutSessionParams {
  const params: MerchCheckoutSessionParams = {
    mode: 'payment',
    // This is a physical-goods checkout; account-level Managed Payments defaults reject shipping.
    managed_payments: { enabled: false },
    success_url: `${input.origin}${NATIVE_STORE_PATH}?checkout=success`,
    cancel_url: `${input.origin}${NATIVE_STORE_PATH}?checkout=cancel`,
    client_reference_id: input.orderId,
    metadata: { orderType: MERCH_ORDER_TYPE, orderId: input.orderId },
    shipping_address_collection: { allowed_countries: [...MERCH_SHIPPING_COUNTRIES] },
    phone_number_collection: { enabled: true },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: 'Standard shipping',
          fixed_amount: { amount: input.shippingCents, currency: MERCH_CURRENCY },
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 5 },
            maximum: { unit: 'business_day', value: 12 },
          },
        },
      },
    ],
    line_items: input.lines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: MERCH_CURRENCY,
        unit_amount: line.unitPriceCents,
        product_data: {
          name: checkoutLineName(line).slice(0, 250),
          metadata: {
            variantId: line.variantId,
            printfulSyncVariantId: String(line.printfulSyncVariantId),
          },
        },
      },
    })),
  }
  if (input.customerId) params.customer = input.customerId
  else if (input.customerEmail) params.customer_email = input.customerEmail
  if (input.automaticTax) params.automatic_tax = { enabled: true }
  return params
}

export interface PrintfulOrderPayload {
  external_id: string
  shipping: 'STANDARD'
  draft: boolean
  recipient: {
    name: string
    address1: string
    address2?: string
    city: string
    state_code?: string
    country_code: string
    zip: string
    email: string
    phone?: string
  }
  items: Array<{ sync_variant_id: number; quantity: number }>
}

/** Printful order external IDs allow at most 32 characters; compact UUIDs are collision-free. */
export function printfulOrderExternalId(orderId: string): string {
  const compact = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
    ? orderId.replaceAll('-', '').toLowerCase() : orderId
  if (!/^[a-zA-Z0-9_-]{1,32}$/.test(compact)) throw new Error('Order ID is not valid for Printful.')
  return compact
}

export function buildPrintfulOrderPayload(input: {
  externalId: string
  email: string
  shipping: MerchShippingAddress
  items: Array<{ printfulSyncVariantId: number; quantity: number }>
  draft: boolean
}): PrintfulOrderPayload {
  return {
    external_id: printfulOrderExternalId(input.externalId),
    shipping: 'STANDARD',
    draft: input.draft,
    recipient: {
      name: input.shipping.name,
      address1: input.shipping.line1,
      ...(input.shipping.line2 ? { address2: input.shipping.line2 } : {}),
      city: input.shipping.city,
      ...(input.shipping.state ? { state_code: input.shipping.state } : {}),
      country_code: input.shipping.country,
      zip: input.shipping.postalCode,
      email: input.email,
      ...(input.shipping.phone ? { phone: input.shipping.phone } : {}),
    },
    items: input.items.map((item) => ({
      sync_variant_id: item.printfulSyncVariantId,
      quantity: item.quantity,
    })),
  }
}

interface LooseAddress {
  line1?: string | null
  line2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
}

interface LooseShippingDetails {
  name?: string | null
  address?: LooseAddress | null
}

export interface LooseCheckoutSession {
  id?: string | null
  livemode?: boolean
  mode?: string | null
  metadata?: Record<string, string> | null
  payment_status?: string | null
  customer?: string | { id?: string | null } | null
  customer_email?: string | null
  customer_details?: { email?: string | null; phone?: string | null } | null
  collected_information?: { shipping_details?: LooseShippingDetails | null } | null
  amount_subtotal?: number | null
  amount_total?: number | null
  currency?: string | null
  shipping_cost?: { amount_total?: number | null } | null
  total_details?: { amount_tax?: number | null; amount_shipping?: number | null; amount_discount?: number | null } | null
}

export interface MerchCheckoutCompletion {
  orderId: string | null
  sessionId: string | null
  customerId: string | null
  email: string | null
  shipping: MerchShippingAddress | null
  subtotalCents: number | null
  shippingCents: number | null
  taxCents: number | null
  discountCents: number
  totalCents: number | null
  currency: string
  /** True only once Stripe reports the money as collected. Delayed methods complete unpaid. */
  paid: boolean
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

/** Checkout events that move a merch order. Delayed payment methods finish with an async event. */
export const MERCH_CHECKOUT_EVENT_TYPES = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
] as const

export function isMerchCheckoutEvent(event: { type: string; data?: { object?: unknown } | null }): boolean {
  if (!(MERCH_CHECKOUT_EVENT_TYPES as readonly string[]).includes(event.type)) return false
  const object = asRecord(event.data?.object)
  const metadata = asRecord(object?.metadata)
  return metadata?.orderType === MERCH_ORDER_TYPE
}

function readShipping(details: LooseShippingDetails | null | undefined, phone: string | null): MerchShippingAddress | null {
  const address = details?.address
  const name = details?.name?.trim()
  const line1 = address?.line1?.trim()
  const city = address?.city?.trim()
  const country = address?.country?.trim()
  const postalCode = address?.postal_code?.trim()
  if (!name || !line1 || !city || !country || !postalCode) return null
  return {
    name,
    line1,
    line2: address?.line2?.trim() || null,
    city,
    state: address?.state?.trim() || null,
    postalCode,
    country,
    phone,
  }
}

export function readMerchCheckoutCompletion(session: LooseCheckoutSession): MerchCheckoutCompletion | null {
  if (session.metadata?.orderType !== MERCH_ORDER_TYPE) return null
  const phone = session.customer_details?.phone?.trim() || null
  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer && typeof session.customer.id === 'string'
        ? session.customer.id
        : null
  return {
    orderId: session.metadata.orderId?.trim() || null,
    sessionId: session.id?.trim() || null,
    customerId,
    email: session.customer_details?.email?.trim() || session.customer_email?.trim() || null,
    shipping: readShipping(session.collected_information?.shipping_details, phone),
    subtotalCents: typeof session.amount_subtotal === 'number' ? session.amount_subtotal : null,
    shippingCents:
      typeof session.shipping_cost?.amount_total === 'number'
        ? session.shipping_cost.amount_total
        : typeof session.total_details?.amount_shipping === 'number'
          ? session.total_details.amount_shipping
          : null,
    taxCents: typeof session.total_details?.amount_tax === 'number' ? session.total_details.amount_tax : null,
    discountCents: typeof session.total_details?.amount_discount === 'number' ? session.total_details.amount_discount : 0,
    totalCents: typeof session.amount_total === 'number' ? session.amount_total : null,
    currency: (session.currency || MERCH_CURRENCY).toLowerCase(),
    paid: session.payment_status === 'paid' || session.payment_status === 'no_payment_required',
  }
}

export function shortFulfillmentError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Printful could not accept the order.'
  const cleaned = message.replace(/\s+/g, ' ').trim() || 'Printful could not accept the order.'
  return cleaned.slice(0, 240)
}

export function uniqueVariantLabels(variants: MerchVariantView[], key: 'size' | 'color'): string[] {
  const seen = new Set<string>()
  const labels: string[] = []
  for (const variant of variants) {
    const value = variant[key]
    if (!value || seen.has(value)) continue
    seen.add(value)
    labels.push(value)
  }
  return labels
}

/** Store price label: "$30.00", or "From $18.00" when variants differ. */
export function merchPriceLabel(product: Pick<MerchProductView, 'basePriceCents' | 'variants'>): string {
  const prices = product.variants.map((variant) => variant.priceCents)
  if (prices.length === 0) return formatMerchPrice(product.basePriceCents)
  const low = Math.min(...prices)
  return Math.max(...prices) > low ? `From ${formatMerchPrice(low)}` : formatMerchPrice(low)
}

export interface MerchCategoryInfo {
  details: string[]
  care: string[]
  /** Tee size chart rows: size, chest width, body length (inches). */
  sizeChart?: Array<[string, string, string]>
}

/** Product facts by category. Shown on product pages; the blanks are fixed per category. */
export const MERCH_CATEGORY_INFO: Record<string, MerchCategoryInfo> = {
  Hats: {
    details: ['100% chino cotton twill', 'Unstructured, six-panel, low-profile fit with a curved visor', 'Adjustable strap with an antique buckle', 'Red flat embroidery on the front'],
    care: ['Spot clean gently with mild soap and cool water', 'Air dry; do not machine wash or tumble dry'],
  },
  'Desk mats': {
    details: ['16″ × 32″', '100% polyester top with an anti-slip natural rubber base', '3 mm thick with hemmed edges'],
    care: ['Wipe gently with a damp cloth', 'Allow to air dry before use'],
  },
  Mugs: {
    details: ['Glossy white ceramic, printed edge to edge', '11 oz or 15 oz', 'Lead and BPA free'],
    care: ['Dishwasher and microwave safe', 'Not for the oven or stovetop'],
  },
  Tees: {
    details: ['100% combed and ring-spun cotton, 4.2 oz', 'Unisex regular fit, true to size', 'Printed direct to garment, soft to the touch'],
    care: ['Machine wash cold, inside out', 'Tumble dry low or hang dry', 'Do not iron the print'],
    sizeChart: [
      ['S', '18', '28'],
      ['M', '20', '29'],
      ['L', '22', '30'],
      ['XL', '24', '31'],
      ['2XL', '26', '32'],
    ],
  },
}

export const MERCH_SHIPPING_NOTE =
  'Shipping is quoted for your delivery address before payment. Production and delivery updates appear on your order status page.'
