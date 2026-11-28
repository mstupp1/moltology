#!/usr/bin/env tsx
/**
 * Upload a finished long-form video to YouTube through Zernio, private by default, with its
 * title, description, tags and custom thumbnail from the episode's youtube.md. Archives the
 * final files in Google Drive first, like every other publishing CLI.
 *
 *   npm run longform:publish -- --episode content/academy/videos/what-is-moltology/episode.json --dry-run
 *   npm run longform:publish -- --episode <file>                      # private upload
 *
 * Captions and the pinned comment are not in Zernio's API: add captions.srt and pin the comment
 * in YouTube Studio. Making the video public is a choice for the person, in Studio.
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_YOUTUBE_ACCOUNT_ID, createZernioPost, uploadZernioMedia } from './lib/zernio-client'
import { publishArchivedSocial } from './lib/social-archive'

interface Package {
  title: string
  description: string
  tags: string[]
}

/** The `## Title`, `## Description` and Tags line of youtube.md. */
export function readPackage(markdown: string): Package {
  const section = (name: string) => {
    const m = markdown.match(new RegExp(`(?:^|\\n)## ${name}\\n+([\\s\\S]*?)(?=\\n## |(?![\\s\\S]))`))
    if (!m) throw new Error(`youtube.md has no "## ${name}" section`)
    return m[1].trim()
  }
  const title = section('Title')
  if (title.length > 100) throw new Error('The YouTube title is over 100 characters')
  const description = section('Description')
  if (description.length > 5000) throw new Error('The description is over 5,000 characters')
  const tagLine = section('Settings').match(/^- Tags: (.+)$/m)?.[1] ?? ''
  const tags = tagLine.replace(/\.$/, '').split(',').map((t) => t.trim()).filter(Boolean)
  return { title, description, tags }
}

async function main() {
  const argv = process.argv.slice(2)
  const episodePath = path.resolve(argv[argv.indexOf('--episode') + 1] ?? '')
  if (!argv.includes('--episode') || !fs.existsSync(episodePath)) throw new Error('Pass --episode <episode.json>')
  const dryRun = argv.includes('--dry-run')
  const visibility = argv.includes('--unlisted') ? 'unlisted' : 'private'
  const ep = JSON.parse(fs.readFileSync(episodePath, 'utf8')) as { id: string; title: string }
  const pkg = readPackage(fs.readFileSync(path.join(path.dirname(episodePath), 'youtube.md'), 'utf8'))
  const out = path.resolve('tmp', 'longform', ep.id)
  const video = path.join(out, 'final.mp4')
  const thumbnail = path.join(out, 'thumbnail.jpg')
  const captions = path.join(out, 'captions.srt')
  for (const f of [video, thumbnail, captions]) if (!fs.existsSync(f)) throw new Error(`Missing ${path.relative(process.cwd(), f)}: render it with npm run longform:create`)

  console.log(`📺 ${pkg.title}`)
  console.log(`   ${visibility}, Education, not made for kids, synthetic media disclosed, ${pkg.tags.length} tags`)
  if (dryRun) {
    console.log(`\n${pkg.description}\n\nDry run: nothing archived or uploaded.`)
    return
  }
  const { archive, result } = await publishArchivedSocial(
    { kind: 'video', files: [video, thumbnail, captions], metadata: { episode: ep.id, ...pkg, visibility } },
    async ([videoFile, thumbFile]) => {
      const thumbUrl = await uploadZernioMedia({ type: 'image', url: 'https://local.social.invalid/thumbnail.jpg' }, thumbFile)
      const post = await createZernioPost(
        {
          content: pkg.description,
          title: pkg.title,
          tags: pkg.tags,
          mediaItems: [{ type: 'video', url: 'https://local.social.invalid/video', thumbnail: thumbUrl }],
          platforms: [
            {
              platform: 'youtube',
              accountId: DEFAULT_YOUTUBE_ACCOUNT_ID,
              customContent: pkg.description,
              platformSpecificData: { title: pkg.title, visibility, categoryId: '27', madeForKids: false, containsSyntheticMedia: true },
            },
          ],
          publishNow: true,
        },
        { 'https://local.social.invalid/video': videoFile },
      )
      return { postId: post._id, status: post.status, visibility, platforms: post.platforms }
    },
  )
  console.log(`✅ Zernio post ${result.postId} (${result.status}), archived at ${archive.relativePath}`)
  console.log('   Next in YouTube Studio: upload captions.srt, pin the comment from youtube.md, then make it public.')
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main().catch((err) => {
    console.error(`❌ ${err instanceof Error ? err.message : err}`)
    process.exit(1)
  })
}
