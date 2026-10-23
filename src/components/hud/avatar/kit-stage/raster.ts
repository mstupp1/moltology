/**
 * Turns scene runs into trimmed bitmaps for the stage. Each run is drawn as its own small SVG
 * (same viewBox and filters as the full avatar), so tints, mirroring and gear glow come out
 * exactly as the SVG avatar paints them. An SVG drawn as an image can't fetch anything, so the
 * kit art is inlined as data URIs first; those are cached across rebuilds.
 */
import { getAssetUrl } from '@/lib/assets'
import type { KitStageRun, KitStageScene } from './layers'

export interface RasterLayer {
  run: KitStageRun
  canvas: HTMLCanvasElement
  /** Painted bounds in viewBox units: x, y, width, height. */
  rect: [number, number, number, number]
}

export interface RasterScene {
  layers: RasterLayer[]
  backdrop: { canvas: HTMLCanvasElement; rect: [number, number, number, number] } | null
}

/** The backdrop group paints a 260-unit square around the frame (see renderBackdrop). */
const BACKDROP_RECT: [number, number, number, number] = [-80, -50, 260, 260]

const dataUrlCache = new Map<string, Promise<string>>()

function inlineHref(href: string): Promise<string> {
  if (href.startsWith('data:')) return Promise.resolve(href)
  let hit = dataUrlCache.get(href)
  if (!hit) {
    // Absolute bucket URLs (backdrop textures) go through the same-origin /media route.
    hit = fetch(/^https?:/.test(href) ? getAssetUrl(href) : href)
      .then((res) => {
        if (!res.ok) throw new Error(`kit art ${res.status}`)
        return res.blob()
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(blob)
          })
      )
    hit.catch(() => dataUrlCache.delete(href))
    dataUrlCache.set(href, hit)
  }
  return hit
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

async function inlineMarkup(markup: string, hrefs: string[]): Promise<string> {
  let out = markup
  for (const href of hrefs) {
    const data = await inlineHref(href)
    out = out.split(`href="${escapeAttr(href)}"`).join(`href="${data}"`)
  }
  return out
}

async function drawSvg(svg: string, width: number, height: number): Promise<HTMLCanvasElement> {
  const img = new Image()
  img.decoding = 'async'
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
  return canvas
}

/** Alpha bounds of a canvas in pixels, padded; null when nothing was painted. */
function alphaBounds(canvas: HTMLCanvasElement, pad: number): [number, number, number, number] | null {
  const { width: w, height: h } = canvas
  let data: Uint8ClampedArray
  try {
    data = canvas.getContext('2d')!.getImageData(0, 0, w, h).data
  } catch {
    // A browser that taints SVG-drawn canvases can't be read back; keep the full frame.
    return [0, 0, w, h]
  }
  let x0 = w
  let y0 = h
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < h; y++) {
    const row = y * w * 4
    for (let x = 0; x < w; x++) {
      if (data[row + x * 4 + 3] > 2) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        y1 = y
      }
    }
  }
  if (x1 < 0) return null
  x0 = Math.max(0, x0 - pad)
  y0 = Math.max(0, y0 - pad)
  x1 = Math.min(w - 1, x1 + pad)
  y1 = Math.min(h - 1, y1 + pad)
  return [x0, y0, x1 - x0 + 1, y1 - y0 + 1]
}

function crop(src: HTMLCanvasElement, [x, y, w, h]: [number, number, number, number]): HTMLCanvasElement {
  if (x === 0 && y === 0 && w === src.width && h === src.height) return src
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  out.getContext('2d')!.drawImage(src, x, y, w, h, 0, 0, w, h)
  return out
}

const SVG_OPEN = (vb: readonly number[], w: number, h: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${vb.join(' ')}" width="${w}" height="${h}" preserveAspectRatio="none">`

/**
 * Rasterizes every run at `px` pixels across the character frame. Padding leaves room for the
 * blurred-alpha lighting to fall off past the silhouette.
 */
export async function rasterizeScene(scene: KitStageScene, px: number): Promise<RasterScene> {
  const [vx, vy, vw, vh] = scene.viewBox
  const pxPerUnit = px / vw
  const height = Math.round(vh * pxPerUnit)
  const pad = Math.ceil(px / 48)
  const wrap = (body: string) =>
    `${SVG_OPEN(scene.viewBox, px, height)}<defs>${scene.defs}</defs>` +
    `<g${scene.rootFilter ? ` filter="${escapeAttr(scene.rootFilter)}"` : ''}>${body}</g></svg>`

  const layers = await Promise.all(
    scene.runs.map(async (run): Promise<RasterLayer | null> => {
      const canvas = await drawSvg(wrap(await inlineMarkup(run.markup, run.hrefs)), px, height)
      const bounds = alphaBounds(canvas, pad)
      if (!bounds) return null
      const [bx, by, bw, bh] = bounds
      return {
        run,
        canvas: crop(canvas, bounds),
        rect: [vx + bx / pxPerUnit, vy + by / pxPerUnit, bw / pxPerUnit, bh / pxPerUnit],
      }
    })
  )

  let backdrop: RasterScene['backdrop'] = null
  if (scene.backdrop) {
    const hrefs = Array.from(scene.backdrop.matchAll(/href="([^"]+)"/g), (m) => m[1].replace(/&amp;/g, '&'))
    const markup = await inlineMarkup(scene.backdrop, [...new Set(hrefs)]).catch(() => scene.backdrop!)
    const size = Math.min(1024, Math.round(px * 0.75))
    const svg =
      `${SVG_OPEN(BACKDROP_RECT, size, size)}<defs>${scene.defs}</defs>${markup}</svg>`
    backdrop = { canvas: await drawSvg(svg, size, size), rect: BACKDROP_RECT }
  }

  return { layers: layers.filter((l): l is RasterLayer => l !== null), backdrop }
}
