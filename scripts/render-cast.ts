#!/usr/bin/env tsx
/**
 * Stills of the content cast (content/characters/cast.json) from the site's own 3D characters.
 *
 *   npm run cast:render                                   # every character's signature full-figure still
 *   npm run cast:render -- --who juno --pose point --mood happy
 *   npm run cast:render -- --who kit,otto --shot sheet     # reference sheets for image models
 *   npm run cast:render -- --who all --shot full,portrait --all-poses --publish
 *
 * Writes transparent PNGs under tmp/cast/<key>/ and prints their paths. Files are reused when the
 * look and options are unchanged (--force redraws). --publish uploads full stills as WebP to
 * images/characters/ under the names the composite studio reads (`key` and `key:pose`).
 */
import 'dotenv/config'
import path from 'node:path'
import { CAST, castStillFilename } from '../src/lib/cast'
import { AVATAR_POSES, type AvatarPose } from '../src/lib/avatar/traits'
import { MASCOT_S3_PREFIX } from '../src/lib/mascots'
import { MOODS, STILL_SHOTS, findCastMember, placeOnPlate, renderCastStills, toWebp, type Mood, type PlateOptions, type StillRequest, type StillShot } from './lib/cast-stills'

interface Args {
  who: string[]
  shots: StillShot[]
  poses?: AvatarPose[]
  allPoses: boolean
  mood?: Mood
  yaw?: number
  gaze?: StillRequest['gaze']
  scale: number
  force: boolean
  publish: boolean
  over?: string
  to?: string
  plate: PlateOptions
}

const HELP = `Usage: npm run cast:render -- [options]

  --who <ids>        Cast keys, aliases or names, comma separated, or "all" (default all)
                     ${CAST.map((m) => `${m.aliases[0] ?? m.key} (${m.name})`).join(', ')}
  --shot <shots>     ${STILL_SHOTS.join(', ')} (default full). sheet = front, three-quarter,
                     side, back and face on one image: the identity reference for image models
  --pose <poses>     ${AVATAR_POSES.join(', ')} (default: each character's own)
  --all-poses        Every pose (for --publish, so templates can ask for any "key:pose")
  --mood <mood>      ${Object.keys(MOODS).join(', ')}
  --yaw <radians>    Turn, 0 faces the viewer (full default 0.35, portrait 0.15)
  --gaze <dir>       ahead, left, right, up, down (default: at the camera)
  --scale <n>        Size multiplier (1 = 1200x1200 full before cropping, 800x800 portrait)
  --force            Redraw even if the still exists
  --publish          Upload full stills (WebP) to ${MASCOT_S3_PREFIX}/ for the composite studio

Stand the character on a painted background (one character, one full still):
  --over <plate>     Background image (ImageGen plate) to stand the character on
  --to <file>        Output image (.png or .jpg)
  --at <where>       left, center, right or 0..1 across (default center)
  --height <share>   Character height as a share of the image (default 0.55)
  --floor <share>    Gap under the feet as a share of the image (default 0.06)
  --flip             Mirror the character
`

function parseArgs(argv: string[]): Args {
  const args: Args = { who: ['all'], shots: ['full'], allPoses: false, scale: 1, force: false, publish: false, plate: {} }
  const list = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean)
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--who') args.who = list(argv[++i])
    else if (a === '--shot') args.shots = list(argv[++i]) as StillShot[]
    else if (a === '--pose') args.poses = list(argv[++i]) as AvatarPose[]
    else if (a === '--all-poses') args.allPoses = true
    else if (a === '--mood') args.mood = argv[++i] as Mood
    else if (a === '--yaw') args.yaw = Number(argv[++i])
    else if (a === '--gaze') args.gaze = argv[++i] as StillRequest['gaze']
    else if (a === '--scale') args.scale = Number(argv[++i])
    else if (a === '--force') args.force = true
    else if (a === '--publish') args.publish = true
    else if (a === '--over') args.over = argv[++i]
    else if (a === '--to') args.to = argv[++i]
    else if (a === '--at') {
      const v = argv[++i]
      args.plate.at = v === 'left' || v === 'center' || v === 'right' ? v : Number(v)
    } else if (a === '--height') args.plate.height = Number(argv[++i])
    else if (a === '--floor') args.plate.floor = Number(argv[++i])
    else if (a === '--flip') args.plate.flip = true
    else if (a === '--help' || a === '-h') {
      console.log(HELP)
      process.exit(0)
    } else throw new Error(`Unknown option ${a}\n\n${HELP}`)
  }
  for (const s of args.shots) if (!STILL_SHOTS.includes(s)) throw new Error(`Unknown shot "${s}" (${STILL_SHOTS.join(', ')})`)
  for (const p of args.poses ?? []) if (!AVATAR_POSES.includes(p)) throw new Error(`Unknown pose "${p}" (${AVATAR_POSES.join(', ')})`)
  if (args.mood && !(args.mood in MOODS)) throw new Error(`Unknown mood "${args.mood}" (${Object.keys(MOODS).join(', ')})`)
  if (args.publish && (args.mood || args.yaw !== undefined || args.gaze || args.scale !== 1)) {
    throw new Error('--publish uploads the standard stills only: leave out --mood, --yaw, --gaze and --scale')
  }
  if (args.over && !args.to) throw new Error('--over needs --to <output file>')
  return args
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const members = args.who.includes('all') ? CAST : args.who.map(findCastMember)
  const requests: StillRequest[] = []
  for (const member of members) {
    const poses = args.allPoses ? [...AVATAR_POSES] : (args.poses ?? [member.pose])
    for (const shot of args.shots) {
      for (const pose of poses) requests.push({ member, shot, pose, mood: args.mood, yaw: args.yaw, gaze: args.gaze, scale: args.scale })
    }
  }
  const files = await renderCastStills(requests, { force: args.force, log: (l) => console.log(l) })
  console.log('\nStills:')
  requests.forEach((r, i) => console.log(`  ${r.member.name} ${r.shot} ${r.pose}: ${path.relative(process.cwd(), files[i])}`))

  if (args.over && args.to) {
    const i = requests.findIndex((r) => r.shot === 'full')
    if (i < 0 || requests.length !== 1) throw new Error('--over takes exactly one character and one full still (leave out --shot, or --shot full)')
    await placeOnPlate(files[i], args.over, args.to, args.plate)
    console.log(`\nOn the plate: ${args.to}`)
  }

  if (args.publish) {
    const { uploadLocalFileToS3 } = await import('../src/lib/ingest/s3-upload')
    console.log('\nPublishing:')
    for (const [i, r] of requests.entries()) {
      if (r.shot !== 'full') continue
      const webp = await toWebp(files[i])
      const key = `${MASCOT_S3_PREFIX}/${castStillFilename(r.member, r.pose)}`
      const { publicUrl } = await uploadLocalFileToS3(webp, key)
      console.log(`  ${r.member.key}${r.pose === r.member.pose ? '' : `:${r.pose}`} -> ${publicUrl}`)
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
