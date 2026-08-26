/**
 * Moltology Avatar Pixelation Engine
 * Converts high-resolution SVG or raster avatar images into authentic,
 * crisp retro pixel art via downsampling and nearest-neighbor interpolation.
 */

export interface PixelateOptions {
  /**
   * Target pixel grid resolution across the largest dimension (default: 64).
   * 56–72 produces classic 16-bit arcade / Neo Geo crustacean sprite fidelity.
   */
  pixelResolution?: number
  /**
   * Output raster dimensions (default: 256).
   * Upscaled with nearest-neighbor interpolation to guarantee razor-sharp pixel blocks.
   */
  outputSize?: number
}

const DEFAULT_PIXEL_RESOLUTION = 64
const DEFAULT_OUTPUT_SIZE = 256

/** In-memory cache for pixelated avatar data URIs */
const pixelateCache = new Map<string, string>()

function getCacheKey(src: string, resolution: number, outputSize: number): string {
  return `${src}::${resolution}::${outputSize}`
}

/**
 * Synchronously retrieves a cached pixelated avatar PNG data URI if previously computed.
 */
export function getCachedPixelatedImage(
  src: string,
  options: PixelateOptions = {}
): string | null {
  if (!src) return null
  const resolution = options.pixelResolution ?? DEFAULT_PIXEL_RESOLUTION
  const outputSize = options.outputSize ?? DEFAULT_OUTPUT_SIZE
  return pixelateCache.get(getCacheKey(src, resolution, outputSize)) ?? null
}

/**
 * Clears the pixelation cache (useful in test teardowns or memory management).
 */
export function clearPixelateCache(): void {
  pixelateCache.clear()
}

/**
 * Converts an SVG string or image data URI into a crisp, pixelated PNG data URI.
 * In SSR / Node environments, safely falls back to the original source URI.
 */
export function pixelateImage(
  src: string,
  options: PixelateOptions = {}
): Promise<string> {
  const resolution = options.pixelResolution ?? DEFAULT_PIXEL_RESOLUTION
  const outputSize = options.outputSize ?? DEFAULT_OUTPUT_SIZE

  if (!src) {
    return Promise.resolve('')
  }

  const cacheKey = getCacheKey(src, resolution, outputSize)
  const cached = pixelateCache.get(cacheKey)
  if (cached) {
    return Promise.resolve(cached)
  }

  // SSR Safe: Return original src if running in Node/Nitro without DOM Image
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(src)
  }

  return new Promise((resolve) => {
    let settled = false
    const finish = (val: string) => {
      if (!settled) {
        settled = true
        resolve(val)
      }
    }

    // Safety timeout in case of JSDOM or slow network loading
    const timer = setTimeout(() => {
      finish(src)
    }, 1200)

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      clearTimeout(timer)
      try {
        const aspect = img.width > 0 && img.height > 0 ? img.width / img.height : 1

        let gridW = resolution
        let gridH = resolution
        if (aspect > 1) {
          gridH = Math.max(1, Math.round(resolution / aspect))
        } else {
          gridW = Math.max(1, Math.round(resolution * aspect))
        }

        // 1. Downscale onto low-resolution grid canvas
        const smallCanvas = document.createElement('canvas')
        smallCanvas.width = gridW
        smallCanvas.height = gridH
        const smallCtx = smallCanvas.getContext('2d', { willReadFrequently: true })

        if (!smallCtx) {
          finish(src)
          return
        }

        smallCtx.imageSmoothingEnabled = true
        smallCtx.drawImage(img, 0, 0, gridW, gridH)

        // 2. Upscale onto output canvas with nearest-neighbor (crisp square pixel blocks)
        let outW = outputSize
        let outH = outputSize
        if (aspect > 1) {
          outH = Math.max(1, Math.round(outputSize / aspect))
        } else {
          outW = Math.max(1, Math.round(outputSize * aspect))
        }

        const outCanvas = document.createElement('canvas')
        outCanvas.width = outW
        outCanvas.height = outH
        const outCtx = outCanvas.getContext('2d')

        if (!outCtx) {
          const fallbackDataUri = smallCanvas.toDataURL('image/png')
          pixelateCache.set(cacheKey, fallbackDataUri)
          finish(fallbackDataUri)
          return
        }

        // Disable smoothing across all browser variants for crisp nearest-neighbor pixels
        outCtx.imageSmoothingEnabled = false
        // @ts-expect-error moz vendor prefix
        outCtx.mozImageSmoothingEnabled = false
        // @ts-expect-error webkit vendor prefix
        outCtx.webkitImageSmoothingEnabled = false
        // @ts-expect-error ms vendor prefix
        outCtx.msImageSmoothingEnabled = false

        outCtx.drawImage(smallCanvas, 0, 0, gridW, gridH, 0, 0, outW, outH)

        const resultDataUri = outCanvas.toDataURL('image/png')
        pixelateCache.set(cacheKey, resultDataUri)
        finish(resultDataUri)
      } catch {
        // Fallback gracefully to original src on any canvas security/taint issue
        finish(src)
      }
    }

    img.onerror = () => {
      clearTimeout(timer)
      finish(src)
    }

    img.src = src
  })
}
