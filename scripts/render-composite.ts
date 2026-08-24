#!/usr/bin/env node
import 'dotenv/config'
import path from 'node:path'
import { captureComposite } from './lib/composite-renderer'
import { CompositeTemplateType } from '../src/components/composite/CompositeStudioUI'
import { CompositeAspectRatio } from '../src/components/composite/CompositeContainer'
import { MascotKey } from '../src/components/composite/MascotOverlay'

async function main() {
  const args = process.argv.slice(2)
  const getArg = (flag: string) => {
    const idx = args.indexOf(flag)
    return idx !== -1 ? args[idx + 1] : undefined
  }

  const template = (getArg('--template') || 'hook') as CompositeTemplateType
  const theme = getArg('--theme') || 'moltmaxxing'
  const aspect = (getArg('--aspect') || '4:5') as CompositeAspectRatio
  const mascot = (getArg('--mascot') || 'lobster_thumbs_up') as MascotKey
  const scaleFactor = getArg('--scale') ? parseFloat(getArg('--scale')!) : 2
  const customDataRaw = getArg('--data')
  const ctaTexture = getArg('--cta-texture')

  let data: Record<string, any> | undefined
  if (customDataRaw) {
    try {
      data = JSON.parse(customDataRaw)
    } catch {
      console.warn('⚠️ Could not parse --data JSON string')
    }
  }

  if (ctaTexture) {
    data = { ...data, ctaTexture }
  }

  const timestamp = Date.now()
  const defaultOut = path.resolve(process.cwd(), 'tmp', `composite-${template}-${theme}-${timestamp}.png`)
  const outputPath = getArg('--out') ? path.resolve(getArg('--out')!) : defaultOut

  console.log(`\n======================================================`)
  console.log(`🦞 MOLTOLOGY COMPOSITE STUDIO RENDERER (Headless Chrome)`)
  console.log(`======================================================`)
  console.log(`🎨 Template: ${template}`)
  console.log(`🌐 Theme:    ${theme}`)
  console.log(`📐 Aspect:   ${aspect}`)
  console.log(`🎭 Mascot:   ${mascot}`)
  console.log(`🔍 Retina:   ${scaleFactor}x`)
  console.log(`📁 Output:   ${outputPath}`)
  console.log(`======================================================\n`)

  await captureComposite({
    template,
    theme,
    aspectRatio: aspect,
    mascot,
    data,
    scaleFactor,
    outputPath,
  })

  console.log(`\n🎉 Composite render complete: ${outputPath}\n`)
}

main().catch((err) => {
  console.error('❌ Composite render failed:', err)
  process.exit(1)
})
