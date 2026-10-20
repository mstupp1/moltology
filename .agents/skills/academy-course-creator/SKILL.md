---
name: academy-course-creator
description: >-
  Write, update, upload and publish Molt Academy coursework (/lectures): courses, lessons
  (video lectures, readings, quizzes), tracks and certificates, as Markdown in content/academy/,
  written to the database with npm run academy:ingest. Use whenever the user asks to add or
  change a course, lesson, quiz, lecture video, track or certificate, or to publish or unpublish
  Academy content.
---

# Academy course creator

Read [content worktree hygiene](../../../docs/content-worktree-hygiene.md) first. Record the starting
Git state, preserve unrelated work, commit every intentional change this run makes, and check the
final status. Lecture videos and large images stay in git-ignored `media/` folders; never commit them.

The format is documented in [content/academy/README.md](../../../content/academy/README.md), with a
complete worked course and track in `content/academy/_examples/`. The parser is
`src/lib/academy-content.ts`; the database sync is `src/lib/ingest/academy-sync.ts`.

## How it fits together

- `content/academy/courses/<slug>/course.md` + `lessons/<lesson-slug>.md` is one course.
  `content/academy/tracks/<slug>.md` is one track. These files are the source you edit.
- `npm run academy:ingest` writes them to the database, which is what members see. It matches
  courses and tracks by slug and lessons by course + slug, so editing text, video, questions or
  order keeps every member's progress, notes and certificates.
- Status lives in the file: `draft` (default, invisible to members) or `published`.

## Before writing

1. Read [BRAND_BIBLE.md](../../../BRAND_BIBLE.md) and [STYLE_GUIDE.md](../../../STYLE_GUIDE.md). Read the
   [annual content calendar](../../../content/annual-content-calendar.md) when choosing a topic, but
   keep courses evergreen: no seasonal props in lesson text.
2. List existing courses (`ls content/academy/courses`) and check codes and slugs so nothing clashes.
   Ask the user for the course's goal, audience level and rough length if they did not say.
3. Agree the outline (modules and lesson titles) with the user before writing lesson bodies.

## Writing rules

- Course and lesson copy is narrative, so it stays in the world, but every idea needs its human
  analog nearby (STYLE_GUIDE §1.1). The lesson teaches a real practice; the lore is the frame.
- One idea per lesson. Readings run 400 to 1,200 words with short paragraphs and `##` headings when
  they help. Video lessons put the transcript or lecture notes in the body.
- Titles are plain sentences, not slash pairs or all caps (BAN 1, BAN 8). Subtitles say what the
  member will be able to do.
- `outcomes` are concrete actions ("Name one habit you can stop this week"), three or four per course.
- Quizzes check the practical point of the module, not trivia. Three to five questions, four choices,
  one clearly right answer, and an `explanation` that teaches why. Wrong choices are plausible, never
  jokes at the member's expense.
- Never claim stats, studies or results you cannot cite (BAN 7). Do not mention prices, Gems or
  Premium in course copy; certificates are earned by finishing the work.
- Functional strings (errors, toasts) are not written here; they live in `src/lib/academy.ts`.

## Media

- **Video:** prefer an unlisted YouTube or Vimeo link in `video:`. For a file, put it in the course's
  `media/` folder (`video: ./media/lecture-1.mp4`); the ingest uploads it to `videos/academy/<course>/`.
  Keep files web-ready (H.264 MP4, 720p or 1080p).
- **Cover and poster images:** `cover: ./media/cover.jpg` (16:9, at least 1280px wide) and
  `poster: ./media/poster.jpg`. The ingest uploads them with a `.webp` twin; pages load them through
  `/media`. A bucket key (`images/...`) or https URL also works.
- **Images in lesson text:** `![Alt text](./media/diagram.png)` is uploaded and rewritten on ingest.
- Uploads are keyed by a content hash, so re-running the ingest never re-uploads unchanged files.

## Steps

1. **New course:** copy `content/academy/_examples/courses/example-first-shed/` to
   `content/academy/courses/<slug>/`, then edit. Keep `status: draft`.
   **Change a course:** edit the existing files. Never rename a course, lesson or track slug once
   members may have started; change the `title` instead.
2. Check: `npm run academy:ingest -- --dry-run <slug>`. Fix every ✗. Read the ⚠ warnings and fix
   them unless they are intended (for example a video lesson still waiting for its video).
3. Write to dev: `npm run academy:ingest -- --dev <slug>`. If you can run the app, open
   `/lectures/courses/<slug>` and step through each lesson and the quiz.
4. Show the user the course (outline, a sample lesson, the quiz) and get their go-ahead to publish.
5. Publish: set `status: published` in `course.md`, then `npm run academy:ingest -- <slug>` (no `--dev`
   writes to production). For a track, publish its courses first, then the track.
6. Commit the content files (not `media/`) with a message naming the course, and push per the repo's
   branch rules.

## Removing things

- **Unpublish:** set `status: draft` and re-run the ingest. Progress is kept.
- **Delete a lesson:** remove it from `modules` and delete its file. The ingest refuses because member
  progress on that lesson would be deleted; confirm with the user, then run with `--prune`.
- Deleting a whole course or track from the database is not done by the ingest. Unpublish it instead,
  and ask the user before any manual delete.

## Placeholder catalog

The four sample courses seeded from `src/lib/academy-catalog.ts` are kept as draft. Do not publish
them; real coursework comes from `content/academy/`.
