/**
 * Node-only image optimizer for bucket uploads. See src/lib/asset-formats.ts for which keys
 * get a `.webp` twin.
 */

/** Longest edge for page images. Covers the widest hero at 2x on a typical laptop. */
export const WEB_IMAGE_MAX_EDGE = 1920
export const WEB_IMAGE_QUALITY = 78

export async function toOptimizedWebp(input: Buffer): Promise<Buffer> {
  const { default: sharp } = await import('sharp')
  return sharp(input)
    .rotate()
    .resize({
      width: WEB_IMAGE_MAX_EDGE,
      height: WEB_IMAGE_MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEB_IMAGE_QUALITY, alphaQuality: 90, effort: 6, smartSubsample: true })
    .toBuffer()
}
