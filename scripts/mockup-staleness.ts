/**
 * Which marketing screenshots may be out of date: for each homepage sector, the commits that
 * touched its page code (or the shared app chrome) since its shots were last captured.
 *
 *   npm run mockups:stale
 *
 * Read-only. Needs full git history; a shallow clone can't date the shots.
 */
import { execFileSync } from 'node:child_process'
import { DEVICE_PREVIEW_LIBRARY, devicePreviewPath } from '../src/components/home/device-preview-library'
import { MOCKUP_SOURCES } from './lib/mockup-targets'

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trimEnd()
}

if (git(['rev-parse', '--is-shallow-repository']).trim() === 'true') {
  console.error('This clone is shallow, so shot dates are unknown. Run `git fetch --unshallow` first.')
  process.exit(1)
}

let stale = 0
for (const sector of DEVICE_PREVIEW_LIBRARY) {
  const shots = (['desktop', 'mobile'] as const).map((device) => `public${devicePreviewPath(sector.id, device)}`)
  // The older of the pair decides: a sector is only fresh when both devices are.
  const captured = shots
    .map((shot) => git(['log', '-1', '--format=%H %cs %ct', '--', shot]))
    .filter(Boolean)
    .map((line) => { const [sha, date, time] = line.split(' '); return { sha, date, time: Number(time) } })
  if (captured.length < shots.length) {
    console.log(`\n${sector.label}: never captured`)
    stale++
    continue
  }
  const oldest = captured.reduce((a, b) => (a.time <= b.time ? a : b))
  const sources = MOCKUP_SOURCES[sector.id] ?? []
  const commits = git(['log', '--format=  %h %cs %s', `${oldest.sha}..HEAD`, '--', ...sources])
  if (!commits) {
    console.log(`\n${sector.label}: fresh (captured ${oldest.date})`)
    continue
  }
  stale++
  console.log(`\n${sector.label}: ${commits.split('\n').length} change(s) since capture on ${oldest.date}`)
  console.log(commits)
}
console.log(stale ? `\n${stale} sector(s) may need a recapture: npm run mockups:capture -- --target=<id>` : '\nAll shots are newer than their page code.')
