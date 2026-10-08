#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import {
  REFERENCE_STATUSES,
  ensureLibrary,
  ingestInbox,
  loadReferences,
  resolveReferenceRoot,
  summarizeLibrary,
  writeIndex,
  type ReferenceRecord,
} from './lib/reference-library'
import { openCompositeSession } from './lib/composite-renderer'
import { composeComparison } from './lib/composite-image-tools'
import { lintLayoutSpec, parseLayoutSpec } from '../src/components/composite/layout-spec'

const HELP = `Reference library for designs and ads to recreate as composite layouts.

  npm run refs -- ingest [--dry-run]     Move new images from the inbox into the library
  npm run refs -- list [--status new]    One line per reference
  npm run refs -- summary                Counts by status, aspect, design device and tag
  npm run refs -- recreate <id> [--guides]
                                         Render the reference's layout spec and build a
                                         side-by-side comparison board
  npm run refs -- status <id> <status>   Set status: ${REFERENCE_STATUSES.join(', ')}

Library root: COMPOSITE_REFERENCE_ROOT, else /mnt/project-files/composite-references when it
exists, else tmp/composite-references. Workflow: .agents/skills/composite-reference-library.
`

function saveRecord(dir: string, record: ReferenceRecord) {
  fs.writeFileSync(path.join(dir, 'reference.json'), JSON.stringify(record, null, 2) + '\n')
}

async function main() {
  const [command = 'help', ...rest] = process.argv.slice(2)
  const getArg = (flag: string) => {
    const idx = rest.indexOf(flag)
    return idx !== -1 ? rest[idx + 1] : undefined
  }
  const root = resolveReferenceRoot()

  switch (command) {
    case 'ingest': {
      const report = await ingestInbox(root, { dryRun: rest.includes('--dry-run') })
      console.log(`📥 Library: ${root}`)
      for (const r of report.added) console.log(`  + ${r.id}  ${r.originalName}${r.nearestAspect ? `  (${r.width}×${r.height}, nearest ${r.nearestAspect})` : ''}`)
      for (const d of report.duplicates) console.log(`  = ${d.id}  ${d.file} (already in library, moved to inbox/_duplicates)`)
      for (const s of report.skipped) console.log(`  ! ${s.file}: ${s.reason}`)
      console.log(`\n${report.added.length} added, ${report.duplicates.length} duplicate, ${report.skipped.length} skipped.`)
      return
    }

    case 'list': {
      const status = getArg('--status')
      const refs = loadReferences(root).filter((r) => !status || r.record.status === status)
      for (const { record, errors } of refs) {
        const devices = record.analysis?.devices?.slice(0, 3).join(', ') || '-'
        console.log(
          `${record.id}  ${record.status.padEnd(9)} ${record.nearestAspect.padEnd(5)} ${record.title.slice(0, 40).padEnd(40)} ${devices}${errors.length ? '  [invalid]' : ''}`
        )
      }
      console.log(`\n${refs.length} reference(s) in ${root}`)
      return
    }

    case 'summary': {
      ensureLibrary(root)
      const summary = summarizeLibrary(loadReferences(root))
      writeIndex(root)
      console.log(JSON.stringify(summary, null, 2))
      return
    }

    case 'status': {
      const [id, status] = rest
      if (!REFERENCE_STATUSES.includes(status as any)) throw new Error(`Status must be one of: ${REFERENCE_STATUSES.join(', ')}`)
      const ref = loadReferences(root).find((r) => r.record.id === id)
      if (!ref) throw new Error(`No reference ${id} in ${root}`)
      saveRecord(ref.dir, { ...ref.record, status: status as ReferenceRecord['status'] })
      writeIndex(root)
      console.log(`${id} -> ${status}`)
      return
    }

    case 'recreate': {
      const id = rest[0]
      const ref = loadReferences(root).find((r) => r.record.id === id)
      if (!ref) throw new Error(`No reference ${id} in ${root}`)
      const layoutPath = ref.record.recreation?.layoutPath
      if (!layoutPath) {
        throw new Error(`${id} has no recreation.layoutPath yet. Write a layout spec and set it in reference.json first.`)
      }
      const resolvedLayout = path.resolve(layoutPath)
      const parsed = parseLayoutSpec(JSON.parse(fs.readFileSync(resolvedLayout, 'utf8')))
      if (!parsed.ok) throw new Error(`${layoutPath} is invalid:\n  ${parsed.errors.join('\n  ')}`)
      for (const issue of lintLayoutSpec(parsed.spec)) console.warn(`⚠️ ${issue.layer ? `${issue.layer} ` : ''}${issue.message}`)

      const specDir = path.dirname(resolvedLayout)
      const spec = JSON.parse(
        JSON.stringify(parsed.spec, (_k, v) => (typeof v === 'string' && /^\.\.?\//.test(v) ? path.resolve(specDir, v) : v))
      )
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      const renderPath = path.join(ref.dir, 'renders', `${stamp}.png`)
      const comparePath = path.join(ref.dir, 'compare.jpg')

      const session = await openCompositeSession()
      try {
        await session.capture({
          template: 'layout',
          aspectRatio: parsed.spec.aspect ?? (ref.record.nearestAspect as any),
          data: { spec, guides: rest.includes('--guides') },
          outputPath: renderPath,
        })
      } finally {
        await session.close()
      }
      await composeComparison(
        [
          { path: path.join(ref.dir, ref.record.previewFile), label: `Reference · ${ref.record.title}` },
          { path: renderPath, label: `Composite · ${path.basename(layoutPath)}` },
        ],
        comparePath
      )

      const renders = [...(ref.record.recreation?.renders ?? []), path.relative(ref.dir, renderPath)]
      saveRecord(ref.dir, {
        ...ref.record,
        status: ref.record.status === 'new' || ref.record.status === 'analyzed' ? 'recreated' : ref.record.status,
        recreation: { ...ref.record.recreation, layoutPath, renders, comparePath: path.relative(ref.dir, comparePath) },
      })
      writeIndex(root)
      console.log(`🪞 Comparison board -> ${comparePath}`)
      return
    }

    default:
      console.log(HELP)
  }
}

main().catch((err) => {
  console.error(`❌ ${(err as Error).message}`)
  process.exit(1)
})
