import React from 'react'
import { BrandAwareImage } from '@/components/ui/BrandMark'
import { getAssetUrl } from '@/lib/assets'

/** Product photo from a bucket key, a site path, or a Printful URL. */
export function MerchImage({
  src,
  alt = '',
  className,
  loading = 'lazy',
}: {
  src: string | null | undefined
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
}) {
  if (!src) return <div className={`bg-surface-2 ${className ?? ''}`} aria-hidden="true" />
  return <BrandAwareImage src={getAssetUrl(src)} alt={alt} className={className} loading={loading} decoding="async" />
}
