/**
 * Merch preview mode: the store reads the catalog file instead of the database and checkout
 * is off. For working on the store locally while the database is unavailable.
 *
 * It only turns on in a dev server with VITE_MERCH_PREVIEW=1. Production builds compile
 * `import.meta.env.DEV` to false, so it can never run there. Retire it at launch
 * (docs/merch-launch.md).
 */
export function readMerchPreview(env: { dev: boolean; flag?: string | null; nodeEnv?: string | null }): boolean {
  if (!env.dev || env.nodeEnv === 'production') return false
  return env.flag === '1' || env.flag === 'true'
}

export const MERCH_PREVIEW = readMerchPreview({
  dev: Boolean(import.meta.env?.DEV),
  flag: import.meta.env?.VITE_MERCH_PREVIEW,
  nodeEnv: typeof process !== 'undefined' ? process.env?.NODE_ENV : undefined,
})

export const MERCH_PREVIEW_CHECKOUT_ERROR = 'Checkout is off in preview mode.'
