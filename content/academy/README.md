# Molt Academy content

Courses and tracks for `/lectures` are written here as Markdown, then written to the database
with `npm run academy:ingest`. The database is what members see; these files are the source you
edit and review. The [`academy-course-creator`](../../.agents/skills/academy-course-creator/SKILL.md)
skill covers writing, updating and publishing a course end to end.

```
content/academy/
  courses/<course-slug>/
    course.md                  course facts, modules, lesson order, certificate; body = description
    lessons/<lesson-slug>.md   one per lesson; body = reading text or lecture notes
    media/                     optional local images and videos (git-ignored, uploaded on ingest)
  tracks/<track-slug>.md       a path of courses in order; body = description
  _examples/                   a complete worked course and track (never ingested)
```

Start by copying `_examples/courses/example-first-shed/` and `_examples/tracks/example-first-shell.md`.
Every field is shown and commented there.

## Rules the ingest checks

- **Slugs** are lowercase words joined by hyphens. The folder name is the course slug and the file
  name is the lesson or track slug. A slug is the address (`/lectures/courses/<slug>`) and the key
  that keeps member progress attached, so **never rename one after members have started**.
- **Course code** looks like `MOLT-101` and is unique.
- **Modules** are listed in `course.md` with their lessons in order. Every lesson file must be listed;
  every listed lesson needs a file. Module titles are unique within a course.
- **Lesson kind** is `video`, `reading` or `quiz`. If you leave it out it is worked out from the file:
  questions make a quiz, a `video` makes a video lesson, anything else is a reading.
- **Duration** is minutes (`8`), `mm:ss` (`"12:30"`) or `h:mm:ss`. The course length is the sum of
  its lessons unless you set `minutes` on the course.
- **Quiz answers** are the exact text of the right choice, or its position counting from 0.
  `passingScore` defaults to 80.
- **Video** takes a YouTube or Vimeo link, an `.mp4`/`.webm` URL, a bucket key (`videos/…`), or a local
  file such as `./media/lecture.mp4`. Local files, covers, posters and images in lesson text are
  uploaded to the asset bucket under a content-hash key, so re-running the ingest never uploads the
  same file twice. Members load them through the cached `/media` path.
- **Status** is `draft` (default) or `published`. A draft course is invisible to members. A track only
  shows published courses, so publish the courses before the track.
- **Removing a lesson** deletes member progress on it, so the ingest refuses unless you pass `--prune`.
  Editing a lesson's text, video, questions or position keeps everyone's progress.

## Commands

```bash
npm run academy:ingest -- --dry-run                 # check every file, change nothing
npm run academy:ingest -- --dev <course-slug>       # write one course to the dev database
npm run academy:ingest -- <course-slug> <track>     # write to production
npm run academy:ingest -- --help
```

Without `--dev` or `--db` the ingest writes to production, like the blog ingest.
