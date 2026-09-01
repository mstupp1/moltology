/**
 * Image fetch hints for first-paint LCP vs below-fold gallery work.
 * Keep a single high-priority candidate per route; everything else lazy.
 */
export const lcpImageProps = {
  loading: 'eager' as const,
  fetchPriority: 'high' as const,
  decoding: 'sync' as const,
}

export const eagerImageProps = {
  loading: 'eager' as const,
  fetchPriority: 'low' as const,
  decoding: 'async' as const,
}

export const lazyImageProps = {
  loading: 'lazy' as const,
  fetchPriority: 'low' as const,
  decoding: 'async' as const,
}
