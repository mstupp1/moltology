/**
 * Builds the Moltmaxxing Field Manual PDF (the free lead magnet).
 *
 *   npm run guide:pdf
 *
 * Copy lives in scripts/lib/field-manual/content.ts and layout in template.ts. All
 * artwork is read from the repo (output/guide and public/images), so the build needs
 * no bucket access. The PDF is written to output/guide/; upload it to
 * downloads/the-2026-moltmaxxing-protocol-guide.pdf with `npm run s3:upload` and bump
 * GUIDE_PDF_VERSION in src/lib/guide.ts so browsers fetch the new file.
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import qrcode from 'qrcode-generator'
import { chromium } from 'playwright-core'
import { resolveChromeExecutable } from './lib/composite-renderer'
import {
  buildFieldManualHtml,
  PAGE_COUNT,
  type FieldManualAssets,
  type FieldManualImageKey,
} from './lib/field-manual/template'

const OUTPUT_PDF = path.resolve('output/guide/the-2026-moltmaxxing-protocol-guide.pdf')
const TMP_HTML = path.resolve('tmp/the-2026-moltmaxxing-protocol-guide.html')

const SIGNUP_URL = 'https://moltology.org/sign-up?utm_source=field-manual&utm_medium=pdf&utm_campaign=moltmaxxing-field-manual'
const AUDIT_URL = 'https://moltology.org/moltmax?utm_source=field-manual&utm_medium=pdf&utm_campaign=moltmaxxing-field-manual'

interface ImageSpec {
  file: string
  width: number
  /** Optional crop as fractions of the source image. */
  crop?: { top: number; height: number }
  quality?: number
}

const IMAGES: Record<FieldManualImageKey, ImageSpec> = {
  // The cover art has lettering baked into its top and bottom; keep only the engraving.
  coverCrab: { file: 'output/guide/moltmaxxing-cover-v2.webp', width: 1024, crop: { top: 0.265, height: 0.665 }, quality: 86 },
  carapace: { file: 'public/images/chassis/carapace.webp', width: 640 },
  chamber: { file: 'output/guide/moltmaxxing-chamber-v2.webp', width: 1536 },
  pincer: { file: 'output/guide/moltmaxxing-pincer-v2.webp', width: 1000 },
  seafloor: { file: 'public/images/forum/forum_doctrine_bg.jpg', width: 1376 },
  city: { file: 'public/images/forum/forum_general_bg.jpg', width: 1376 },
  phoneMoltmax: { file: 'public/images/marketing/moltmax_mobile_preview.webp', width: 520 },
  phoneDashboard: { file: 'public/images/marketing/dashboard_mobile_preview.webp', width: 520 },
  phoneOracle: { file: 'public/images/marketing/oracle_mobile_preview.webp', width: 520 },
  phoneForum: { file: 'public/images/marketing/forum_mobile_preview.webp', width: 520 },
}

async function toDataUri(spec: ImageSpec): Promise<string> {
  const src = path.resolve(spec.file)
  if (!fs.existsSync(src)) throw new Error(`Missing field manual artwork: ${spec.file}`)
  let img = sharp(src)
  if (spec.crop) {
    const meta = await img.metadata()
    const h = meta.height ?? 0
    img = img.extract({
      left: 0,
      top: Math.round(h * spec.crop.top),
      width: meta.width ?? 0,
      height: Math.round(h * spec.crop.height),
    })
  }
  const buf = await img
    .resize({ width: spec.width, withoutEnlargement: true })
    .jpeg({ quality: spec.quality ?? 80, mozjpeg: true })
    .toBuffer()
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

/** Strip the XML prolog so an SVG file can be inlined in HTML. */
function inlineSvg(file: string): string {
  return fs.readFileSync(path.resolve(file), 'utf-8').replace(/<\?xml[^>]*\?>\s*/, '')
}

function qrSvg(url: string): string {
  const qr = qrcode(0, 'M')
  qr.addData(url)
  qr.make()
  return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true })
}

export async function loadAssets(): Promise<FieldManualAssets> {
  const entries = await Promise.all(
    (Object.entries(IMAGES) as [FieldManualImageKey, ImageSpec][]).map(async ([key, spec]) => [key, await toDataUri(spec)] as const),
  )
  return {
    images: Object.fromEntries(entries) as Record<FieldManualImageKey, string>,
    emblemSvg: inlineSvg('content/brand/synaptic-path/parts/icon.svg'),
    lockupSvg: inlineSvg('content/brand/synaptic-path/lockups/stacked-benthic-dark.svg'),
    qrSvg: qrSvg(SIGNUP_URL),
    signupUrl: SIGNUP_URL,
    auditUrl: AUDIT_URL,
  }
}

async function generatePdf() {
  console.log('Preparing Field Manual artwork...')
  const html = buildFieldManualHtml(await loadAssets())

  fs.mkdirSync(path.dirname(TMP_HTML), { recursive: true })
  fs.mkdirSync(path.dirname(OUTPUT_PDF), { recursive: true })
  fs.writeFileSync(TMP_HTML, html, 'utf-8')

  const executablePath = resolveChromeExecutable()
  if (!executablePath) throw new Error('No Chrome or Chromium found. Install Google Chrome or set COMPOSITE_CHROME_PATH.')

  console.log('Printing PDF...')
  const browser = await chromium.launch({ executablePath, headless: true })
  try {
    const page = await browser.newPage()
    await page.goto(`file://${TMP_HTML}`, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    const rendered = await page.locator('section.page').count()
    if (rendered !== PAGE_COUNT) throw new Error(`Expected ${PAGE_COUNT} pages, rendered ${rendered}.`)
    await page.pdf({ path: OUTPUT_PDF, width: '8.5in', height: '11in', printBackground: true, preferCSSPageSize: true })
  } finally {
    await browser.close()
  }

  const kb = fs.statSync(OUTPUT_PDF).size / 1024
  console.log(`Field Manual written: ${OUTPUT_PDF} (${PAGE_COUNT} pages, ${kb.toFixed(0)} KB)`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  generatePdf().catch((err) => {
    console.error('Error generating the Field Manual PDF:', err)
    process.exit(1)
  })
}
