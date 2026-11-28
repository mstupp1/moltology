import { HorizontalScroll } from '@/components/ui/HorizontalScroll'
import React, { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Award, BookOpen, Check, Clock, GraduationCap, Layers, Route as RouteIcon, Search, X } from 'lucide-react'
import {
  ACADEMY_COPY,
  ACADEMY_LEVELS,
  filterCourseCards,
  formatCourseLength,
  levelLabel,
  type AcademyCourseCard,
  type AcademyHomePayload,
  type AcademyTrackCard,
} from '@/lib/academy'
import type { AcademyLevel } from '@/lib/academy-types'
import { cn } from '@/lib/utils'
import { pillTabClass } from '@/components/ui/pillTab'
import {
  ACADEMY_CARD,
  ACADEMY_CARD_LINK,
  ACADEMY_FOCUS,
  ACADEMY_TEXT_ACTION,
  AcademyCover,
  AcademyEmpty,
  AcademyProgress,
  AcademySectionHeading,
  LevelMark,
} from './AcademyChrome'

/** Below this many courses the search and filter bar is noise, so it stays hidden. */
const FILTER_MIN_COURSES = 4

function courseHref(course: AcademyCourseCard) {
  if (course.enrolled && course.resumeLessonSlug) {
    return {
      to: '/academy/courses/$slug/lessons/$lessonSlug' as const,
      params: { slug: course.slug, lessonSlug: course.resumeLessonSlug },
    }
  }
  return { to: '/academy/courses/$slug' as const, params: { slug: course.slug } }
}

function courseAction(course: AcademyCourseCard) {
  return course.completed ? 'Review' : course.enrolled ? 'Continue' : 'View course'
}

function CourseCard({ course }: { course: AcademyCourseCard }) {
  const href = courseHref(course)
  return (
    <Link to={href.to} params={href.params} className={cn(ACADEMY_CARD_LINK, 'group overflow-hidden flex flex-col h-full')}>
      {course.coverImageUrl ? (
        <AcademyCover url={course.coverImageUrl} className="aspect-[16/7] border-b border-line-subtle">
          <div className="flex h-full items-start justify-between gap-2 p-3">
            <span className="rounded-chip bg-abyss/70 px-1.5 py-0.5 text-2xs font-semibold text-ink">{course.code}</span>
            {course.completed ? <DoneChip /> : null}
          </div>
        </AcademyCover>
      ) : null}
      <div className="p-3 sm:p-4 flex flex-col gap-2.5 flex-1">
        {course.coverImageUrl ? null : (
          // No artwork: the code sits on the card itself instead of over an empty cover.
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-chip bg-surface-2 px-1.5 py-0.5 text-2xs font-semibold text-ink-muted">{course.code}</span>
            {course.completed ? <DoneChip /> : null}
          </div>
        )}
        <div className="space-y-1">
          <h3 className="font-grotesk font-semibold text-base text-ink leading-snug">{course.title}</h3>
          <p className="text-xs text-ink-body leading-relaxed">{course.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-muted">
          <LevelMark level={course.level} />
          <span className="inline-flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            {course.lessonCount} {course.lessonCount === 1 ? 'lesson' : 'lessons'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            {formatCourseLength(course.estimatedMinutes)}
          </span>
        </div>
        <div className="mt-auto pt-1 space-y-2.5">
          {course.enrolled ? <AcademyProgress percent={course.progressPercent} /> : null}
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-glow">
            {courseAction(course)}
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function DoneChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-chip bg-abyss/70 px-1.5 py-0.5 text-2xs font-semibold text-emerald-500">
      <Check className="w-3 h-3" aria-hidden="true" /> Done
    </span>
  )
}

function ContinueRow({ course }: { course: AcademyCourseCard }) {
  const href = courseHref(course)
  return (
    <Link to={href.to} params={href.params} className={cn(ACADEMY_CARD_LINK, 'group flex items-stretch overflow-hidden')}>
      <AcademyCover url={course.coverImageUrl} className="w-20 sm:w-28 shrink-0 border-r border-line-subtle" />
      <div className="flex-1 min-w-0 p-3 sm:p-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">{course.code}</p>
            <h3 className="font-grotesk font-semibold text-sm text-ink truncate">{course.title}</h3>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-glow shrink-0">
            {courseAction(course)}
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
        <AcademyProgress percent={course.progressPercent} />
      </div>
    </Link>
  )
}

function TrackCard({ track }: { track: AcademyTrackCard }) {
  return (
    <Link
      to="/academy/tracks/$slug"
      params={{ slug: track.slug }}
      className={cn(ACADEMY_CARD_LINK, 'group overflow-hidden flex flex-col sm:flex-row')}
    >
      <AcademyCover url={track.coverImageUrl} className="h-24 sm:h-auto sm:w-40 shrink-0 border-b sm:border-b-0 sm:border-r border-line-subtle">
        <div className="flex h-full items-end p-3">
          <span className="inline-flex items-center gap-1.5 rounded-chip bg-abyss/70 px-1.5 py-0.5 text-2xs font-semibold text-ink">
            <RouteIcon className="w-3 h-3 text-cyan-glow" aria-hidden="true" />
            Track
          </span>
        </div>
      </AcademyCover>
      <div className="p-3 sm:p-4 flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <LevelMark level={track.level} />
          <span className="text-2xs text-ink-muted">
            {track.courseCount} {track.courseCount === 1 ? 'course' : 'courses'} · about {track.estimatedHours} hr
          </span>
        </div>
        <h3 className="font-grotesk font-semibold text-lg text-ink leading-snug">{track.title}</h3>
        <p className="text-xs text-ink-body leading-relaxed">{track.description}</p>
        {track.progressPercent > 0 ? (
          <AcademyProgress percent={track.progressPercent} label={`${track.completedCourseCount} of ${track.courseCount} courses`} />
        ) : null}
        <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-cyan-glow">
          {track.progressPercent > 0 ? 'Continue track' : 'View track'}
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

const COMING_SOON_STEPS = [
  {
    icon: RouteIcon,
    title: 'Tracks',
    body: 'Courses taken in order.',
  },
  {
    icon: BookOpen,
    title: 'Courses',
    body: 'Short lectures and readings, then a quiz.',
  },
  {
    icon: Award,
    title: 'Certificates',
    body: 'Issued when you finish a course or track.',
  },
]

/** The whole home page when nothing is published yet: what the Academy is, and what is coming. */
function AcademyComingSoon() {
  return (
    // Runs edge to edge under the page band, flush with the panel's sides (hud-band-hero).
    <section
      className={cn(ACADEMY_CARD, 'hud-band-hero hud-band-hero-joined overflow-hidden')}
      aria-labelledby="academy-coming-soon"
    >
      <div className="p-4 sm:p-5 lg:p-6 border-b border-line-subtle">
        <div className="flex items-start gap-4">
          <span className="hidden sm:flex w-12 h-12 shrink-0 items-center justify-center rounded-card border border-line-subtle bg-surface-2 text-cyan-glow">
            <GraduationCap className="w-6 h-6" aria-hidden="true" />
          </span>
          <div className="space-y-2 max-w-2xl">
            <h2 id="academy-coming-soon" className="font-grotesk font-semibold text-xl sm:text-2xl text-ink leading-tight">
              {ACADEMY_COPY.comingSoonTitle}
            </h2>
            <p className="text-sm text-ink-body leading-relaxed">{ACADEMY_COPY.comingSoonBody}</p>
          </div>
        </div>
      </div>
      <ol className="grid grid-cols-1 md:grid-cols-3">
        {COMING_SOON_STEPS.map(({ icon: Icon, title, body }, index) => (
          <li
            key={title}
            className={cn(
              'p-3 sm:p-4 lg:p-5 space-y-2',
              index > 0 && 'border-t md:border-t-0 md:border-l border-line-subtle',
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex w-7 h-7 items-center justify-center rounded-control bg-surface-2 text-cyan-glow">
                <Icon className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="text-2xs font-semibold text-ink-muted tabular-nums">0{index + 1}</span>
              <h3 className="font-grotesk text-sm font-semibold text-ink">{title}</h3>
            </div>
            <p className="text-xs text-ink-body leading-relaxed">{body}</p>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle bg-abyss/30 px-4 sm:px-5 py-3">
        <p className="text-xs text-ink-muted">Until then, read the Codex.</p>
        <Link to="/codex" className={ACADEMY_TEXT_ACTION}>
          Read the Codex
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

export function AcademyHome({ data }: { data: AcademyHomePayload }) {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<AcademyLevel | 'all'>('all')
  const [category, setCategory] = useState('all')
  const filtered = useMemo(
    () => filterCourseCards(data.courses, { q: query, level, category }),
    [data.courses, query, level, category],
  )
  const nothingPublished = data.courses.length === 0 && data.tracks.length === 0
  const showFilters = data.courses.length >= FILTER_MIN_COURSES
  const filtering = query.trim() !== '' || level !== 'all' || category !== 'all'

  return (
    <div className="space-y-2 sm:space-y-4 lg:space-y-5">
      {/* The Academy band (title, tabs) is drawn by the academy/_sections layout route. */}
      {nothingPublished ? (
        <AcademyComingSoon />
      ) : (
        <>
          {data.continueLearning.length > 0 ? (
            <section className="space-y-3" aria-labelledby="continue-heading">
              <AcademySectionHeading id="continue-heading" title="Continue learning" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 lg:gap-5">
                {data.continueLearning.map((course) => (
                  <ContinueRow key={course.slug} course={course} />
                ))}
              </div>
            </section>
          ) : null}

          {data.tracks.length > 0 ? (
            <section className="space-y-3" id="tracks" aria-labelledby="tracks-heading">
              <AcademySectionHeading id="tracks-heading" title="Tracks" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 lg:gap-5">
                {data.tracks.map((track) => (
                  <TrackCard key={track.slug} track={track} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-3" id="courses" aria-labelledby="courses-heading">
            <AcademySectionHeading
              id="courses-heading"
              title="Courses"
              action={
                filtering ? (
                  <span className="text-xs text-ink-muted">
                    {filtered.length} of {data.courses.length}
                  </span>
                ) : null
              }
            />
            {showFilters ? (
              <div className={cn(ACADEMY_CARD, 'p-3 space-y-3')}>
                <label className="flex items-center gap-2 min-h-10 rounded-control border border-line bg-surface-2 px-3 focus-within:border-cyan-glow focus-within:shadow-field-focus">
                  <Search className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
                  <span className="sr-only">Search courses</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by title, code, or instructor"
                    className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted outline-hidden"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      className={cn('p-1 rounded-control text-ink-muted hover:text-ink', ACADEMY_FOCUS)}
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  ) : null}
                </label>
                <HorizontalScroll className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-0.5" role="group" aria-label="Level">
                  <FilterChip active={level === 'all'} onClick={() => setLevel('all')}>All levels</FilterChip>
                  {ACADEMY_LEVELS.map((item) => (
                    <FilterChip key={item} active={level === item} onClick={() => setLevel(item)}>
                      {levelLabel(item)}
                    </FilterChip>
                  ))}
                </HorizontalScroll>
                {data.categories.length > 1 ? (
                  <HorizontalScroll className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-0.5" role="group" aria-label="Subject">
                    <FilterChip active={category === 'all'} onClick={() => setCategory('all')}>All subjects</FilterChip>
                    {data.categories.map((item) => (
                      <FilterChip key={item} active={category === item} onClick={() => setCategory(item)}>
                        {item}
                      </FilterChip>
                    ))}
                  </HorizontalScroll>
                ) : null}
              </div>
            ) : null}
            {data.courses.length === 0 ? (
              <AcademyEmpty>{ACADEMY_COPY.emptyCatalog}</AcademyEmpty>
            ) : filtered.length === 0 ? (
              <AcademyEmpty>{ACADEMY_COPY.emptyFilter}</AcademyEmpty>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-2 sm:gap-4 lg:gap-5">
                {filtered.map((course) => (
                  <CourseCard key={course.slug} course={course} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={pillTabClass(active, 'shrink-0 whitespace-nowrap cursor-pointer')}>
      {children}
    </button>
  )
}
