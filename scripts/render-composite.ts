#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { openCompositeSession } from './lib/composite-renderer'
import { composeComparison } from './lib/composite-image-tools'
import { CompositeTemplateType } from '../src/components/composite/CompositeStudioUI'
import { CompositeAspectRatio } from '../src/components/composite/CompositeContainer'
import { MascotKey } from '../src/components/composite/MascotOverlay'
import { lintLayoutSpec, parseLayoutSpec } from '../src/components/composite/layout-spec'

const HELP = `Render a composite to PNG with headless Chrome.

  npm run composite:render -- --template hook --theme ecdysis --aspect 3:4
  npm run composite:render -- --spec content/composite-layouts/split-stat.json --out tmp/split.png
  npm run composite:render -- --spec my.json --compare path/to/reference.jpg --guides

Options
  --template <name>     Built-in template (default hook). --spec implies "layout".
  --spec <file.json>    Layout spec to render (see content/composite-layouts/README.md).
  --theme <name>        Template theme preset.
  --aspect <ratio>      3:4, 4:5, 1:1, 9:16, 16:9 or 16:10 (spec's own aspect wins).
  --mascot <key>        Mascot registry key, random, or none.
  --data <json>         Extra template data, merged over the spec.
  --scale <n>           Device scale factor (default 2).
  --native              Also write a downscaled copy at the platform size (<out>.native.png).
  --guides              Draw safe-area and layer box outlines (layout specs only).
  --compare <image>     Write <out>.compare.jpg with the reference beside the render.
  --out <file.png>      Output path (default tmp/composite-<template>-<time>.png).
`

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP)
    return
  }
  const getArg = (flag: string) => {
    const idx = args.indexOf(flag)
    return idx !== -1 ? args[idx + 1] : undefined
  }
  const hasFlag = (flag: string) => args.includes(flag)

  const specPath = getArg('--spec')
  let template = (getArg('--template') || (specPath ? 'layout' : 'hook')) as CompositeTemplateType
  const theme = getArg('--theme') || 'moltmaxxing'
  let aspect = (getArg('--aspect') || '4:5') as CompositeAspectRatio
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

  if (specPath) {
    const raw = JSON.parse(fs.readFileSync(specPath, 'utf8'))
    const parsed = parseLayoutSpec(raw)
    if (!parsed.ok) {
      console.error(`❌ ${specPath} is not a valid layout spec:\n  ${parsed.errors.join('\n  ')}`)
      process.exit(1)
    }
    for (const issue of lintLayoutSpec(parsed.spec)) {
      console.warn(`⚠️ ${issue.layer ? `${issue.layer} ` : ''}${issue.message}`)
    }
    template = 'layout'
    if (parsed.spec.aspect) aspect = parsed.spec.aspect
    // Resolve the spec's relative image paths against the spec file, not the shell's cwd.
    const specDir = path.dirname(path.resolve(specPath))
    const rebased = JSON.parse(
      JSON.stringify(parsed.spec, (_key, value) =>
        typeof value === 'string' && /^\.\.?\//.test(value) ? path.resolve(specDir, value) : value
      )
    )
    data = { ...data, spec: rebased, guides: hasFlag('--guides') }
  }

  if (ctaTexture) {
    data = { ...data, ctaTexture }
  }

  const timestamp = Date.now()
  const defaultOut = path.resolve(process.cwd(), 'tmp', `composite-${template}-${timestamp}.png`)
  const outputPath = getArg('--out') ? path.resolve(getArg('--out')!) : defaultOut
  const base = outputPath.replace(/\.[^.]+$/, '')

  console.log(`\n🦞 Composite render · ${template}${specPath ? ` (${specPath})` : ''} · ${aspect} · ${scaleFactor}x`)

  const session = await openCompositeSession()
  try {
    const result = await session.capture({
      template,
      theme,
      aspectRatio: aspect,
      mascot,
      data,
      scaleFactor,
      outputPath,
      nativeOutputPath: hasFlag('--native') ? `${base}.native.png` : undefined,
    })

    const reference = getArg('--compare')
    if (reference) {
      const comparePath = `${base}.compare.jpg`
      await composeComparison(
        [
          { path: path.resolve(reference), label: 'Reference' },
          { path: outputPath, label: 'Composite' },
        ],
        comparePath
      )
      console.log(`🪞 Comparison board -> ${comparePath}`)
    }

    if (result.nativeOutputPath) console.log(`📐 Native size copy -> ${result.nativeOutputPath}`)
    console.log(`\n🎉 Composite render complete: ${outputPath}\n`)
  } finally {
    await session.close()
  }
}

main().catch((err) => {
  console.error('❌ Composite render failed:', err)
  process.exit(1)
})
