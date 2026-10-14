#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { neon } from '@neondatabase/serverless'
import { createS3Client, DEFAULT_BUCKET } from '../src/lib/s3-client'
import { getSocialArchiveRoot, requireArchiveRoot, atomicJson } from './lib/social-archive'
import { fetchZernio, DEFAULT_PROFILE_ID } from './lib/zernio-client'
import {
  inventorySocial, copyEntry, verifyEntry, pruneEntry, pruneReason, sourceReferences,
  updateMigratedLedgers, writeMigrationMetadata,
  verifiedDatabaseEvidence,
  type MigrationManifest, type DependencyCheck, type CloudEvidence,
} from './lib/social-archive-migration'

export async function checkZernioDependencies(allowPublishedReferences = false): Promise<DependencyCheck> {
  const references: string[] = []
  try {
    let total: number | undefined
    let seen = 0
    for (let page = 1; page <= 1000; page++) {
      const result = await fetchZernio<any>(`/posts?profileId=${DEFAULT_PROFILE_ID}&limit=100&page=${page}`)
      if (!Array.isArray(result.posts) || !Number.isInteger(result.pagination?.pages) || result.pagination.page !== page) throw new Error('Unrecognized Zernio pagination.')
      if (total !== undefined && total !== result.pagination.total) throw new Error('Zernio inventory changed during inspection.')
      total = result.pagination.total
      seen += result.posts.length
      // Published historical references may be discarded only when explicitly requested.
      const dependencyPosts = result.posts.filter((post: any) => !(allowPublishedReferences && post.status === 'published' && !post.recycling?.enabled && post.platforms?.every((platform: any) => platform.status === 'published')))
      references.push(...dependencyPosts.flatMap((post: any) => JSON.stringify(post).match(/(?:images|videos)\/social\/[^"'\s<>\\]+/g) || []))
      if (page >= result.pagination.pages) {
        if (seen !== total) throw new Error('Incomplete Zernio post inventory.')
        return { complete: true, references }
      }
    }
    throw new Error('Zernio pagination limit reached.')
  } catch (error) { return { complete: false, references, reason: `Zernio dependency check failed: ${String(error)}` } }
}

/** Explicit production credentials only; never silently check the dev database. */
export async function checkDatabaseDependencies(): Promise<DependencyCheck> {
  const references: string[] = []
  try {
    const url = process.env.PROD_DATABASE_URL
    if (!url) throw new Error('PROD_DATABASE_URL is required for cleanup.')
    const sql = neon(url)
    const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    if (!tables.length) throw new Error('No production tables were visible.')
    for (const table of tables) {
      const identifier = String(table.tablename).replace(/"/g, '""')
      // Return only asset references, not row contents or personal information.
      const rows = await sql(`SELECT regexp_matches(to_jsonb(t)::text, '(?:images|videos)/social/[^"[:space:]<>\\\\]+', 'g') AS matches FROM public."${identifier}" AS t WHERE to_jsonb(t)::text LIKE '%/social/%'`)
      for (const row of rows) references.push(...row.matches)
    }
    return { complete: true, references }
  } catch (error) { return { complete: false, references, reason: `Production dependency check failed: ${String(error)}` } }
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  const mode = args[0]
  if (!['inventory', 'copy', 'verify', 'prune'].includes(mode)) throw new Error('Usage: npm run social:archive -- inventory|copy|verify|prune [--manifest path] [--root path] [--limit N] [--cloud-evidence path] [--database-evidence path] [--allow-published-references] [--allow-unmatched] [--apply]')
  const flag = (name: string) => {
    const index = args.indexOf(name)
    if (index < 0) return undefined
    if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`${name} requires a value.`)
    return args[index + 1]
  }
  const repo = process.cwd()
  const manifestPath = path.resolve(flag('--manifest') || 'tmp/social-archive-migration.json')
  const client = createS3Client()
  if (mode === 'inventory') {
    const manifest = await inventorySocial(client, DEFAULT_BUCKET, repo)
    if (fs.existsSync(manifestPath)) throw new Error('Manifest already exists. Use a new --manifest path to preserve migration progress.')
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
    atomicJson(manifestPath, manifest)
    console.log(JSON.stringify({ manifest: manifestPath, objects: manifest.entries.length, archiveObjects: manifest.entries.filter(e => e.archive).length, bytes: manifest.entries.filter(e => e.archive).reduce((sum, e) => sum + e.bytes, 0), retained: manifest.entries.filter(e => e.retainReason).length }, null, 2))
    return
  }
  const root = requireArchiveRoot(flag('--root') || getSocialArchiveRoot())
  const manifest: MigrationManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  if (manifest.version !== 1 || manifest.bucket !== DEFAULT_BUCKET || !Array.isArray(manifest.entries)) throw new Error('Manifest version/bucket does not match this environment.')
  const limit = flag('--limit') ? Number(flag('--limit')) : Infinity
  if (limit !== Infinity && (!Number.isInteger(limit) || limit < 1)) throw new Error('--limit must be a positive integer.')
  const entries = manifest.entries.filter(e => e.archive && !e.deletedAt).slice(0, limit)
  const report: Record<string, number> = { copied: 0, verified: 0, retained: 0, deleted: 0, failed: 0 }
  let cloud: CloudEvidence | undefined
  let zernio: DependencyCheck = { complete: false, references: [] }
  let database: DependencyCheck = { complete: false, references: [] }
  const references = sourceReferences(repo)
  if (mode === 'prune') {
    const evidencePath = flag('--cloud-evidence')
    if (evidencePath) cloud = JSON.parse(fs.readFileSync(evidencePath, 'utf8'))
    const databaseEvidencePath = flag('--database-evidence')
    const savedDatabaseCheck = databaseEvidencePath
      ? verifiedDatabaseEvidence(JSON.parse(fs.readFileSync(databaseEvidencePath, 'utf8')), process.env.PROD_DATABASE_URL || '') : undefined
    ;[zernio, database] = await Promise.all([checkZernioDependencies(args.includes('--allow-published-references')), savedDatabaseCheck || checkDatabaseDependencies()])
    if (databaseEvidencePath) console.log(`Using verified production dependency evidence: ${databaseEvidencePath}`)
    if (!zernio.complete) console.warn(zernio.reason)
    if (!database.complete) console.warn(database.reason)
  }
  for (const entry of entries) {
    try {
      if (mode === 'copy') { await copyEntry(client, manifest.bucket, entry, root); report.copied++ }
      if (mode === 'verify') {
        if (!await verifyEntry(entry, root)) throw new Error('Local archive verification failed.')
        entry.verifiedAt = new Date().toISOString(); delete entry.error; report.verified++
      }
      if (mode === 'prune') {
        const candidate = args.includes('--allow-unmatched') && entry.retainReason === 'Unmatched object; dependencies uncertain'
          ? { ...entry, retainReason: undefined } : entry
        const reason = pruneReason(candidate, manifest, cloud, zernio, database, references)
        if (reason) { console.log(`Retained ${entry.key}: ${reason}`); report.retained++ }
        else if (!args.includes('--apply')) { console.log(`Eligible for deletion: ${entry.key}`); report.retained++ }
        else { await pruneEntry(client, manifest, entry, root); report.deleted++ }
      }
    } catch (error) { entry.error = String(error); report.failed++; console.warn(`${entry.key}: ${entry.error}`) }
    // Persist after every object so interrupted copies and deletion batches can resume.
    atomicJson(manifestPath, manifest)
  }
  writeMigrationMetadata(repo, manifest, root)
  updateMigratedLedgers(repo, manifest)
  console.log(JSON.stringify({ mode, root, report, remainingNeonObjects: manifest.entries.filter(e => !e.deletedAt).length }, null, 2))
  if (report.failed) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(String(error)); process.exitCode = 1 })
}
