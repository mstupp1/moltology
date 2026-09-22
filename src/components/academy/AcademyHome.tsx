import React, { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Clock, Layers, Search } from 'lucide-react'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import {
  ACADEMY_COPY,
  ACADEMY_LEVELS,
  filterCourseCards,
  formatCourseLength,
  type AcademyCourseCard,
  type AcademyHomePayload,
} from '@/lib/academy'
import type { AcademyLevel } from '@/lib/academy-types'
import { cn } from '@/lib/utils'
import { AcademyEmpty, AcademyNav, AcademyProgress, LevelMark, coverSrc } from './AcademyChrome'

function courseHref(course: AcademyCourseCard) {
  if (course.enrolled && course.resumeLessonSlug) {
    return {
      to: '/lectures/courses/$slug/lessons/$lessonSlug' as const,
      params: { slug: course.slug, lessonSlug: course.resumeLessonSlug },
    }
  }
  return { to: '/lectures/courses/$slug' as const, params: { slug: course.slug } }
}

function CourseCard({ course }: { course: AcademyCourseCard }) {
  const href = courseHref(course)
  const action = course.completed ? 'Review' : course.enrolled ? 'Continue' : 'View course'
  return (
    <article className="chitin-card p-4 chamfer-corner shadow-2xl flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold tracking-widest text-[#dfe3e3]">{course.code}</span>
        <LevelMark level={course.level} />
      </div>
      <div className="space-y-1">
        <h3 className="font-grotesk font-bold text-base text-[#dfe3e3] leading-snug">{course.title}</h3>
        <p className="text-xs text-[#b7c4c3] leading-relaxed">{course.subtitle}</p>
      </div>
      <p className="text-[11px] text-[#839493]">
        {course.instructorName}
        <span className="text-[#3a4a49]"> · </span>
        {course.category}
      </p>
      <p className="text-[11px] text-[#839493] flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
          {course.lessonCount} {course.lessonCount === 1 ? 'lesson' : 'lessons'}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatCourseLength(course.estimatedMinutes)}
        </span>
      </p>
      {course.enrolled ? <AcademyProgress percent={course.progressPercent} /> : null}
      <Link
        to={href.to}
        params={href.params}
        className="mt-auto inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#00ffff] hover:text-white"
      >
        {action}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </article>
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

  return (
    <div className="space-y-3.5 sm:space-y-5">
      <HudTitlePanel
        eyebrow={<><GraduationCapIcon /> Molt Academy</>}
        title="Learn the molt in order"
        description="Tracks group courses. Courses are video lectures, readings, and quizzes. Finish the work and a certification is issued in your name."
        actions={<AcademyNav current="catalog" />}
      />

      {data.continueLearning.length > 0 ? (
        <section className="space-y-3" aria-labelledby="continue-heading">
          <SectionHeading id="continue-heading" title="Continue learning" subtitle="Pick up the course you already started." />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {data.continueLearning.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3" id="tracks" aria-labelledby="tracks-heading">
        <SectionHeading
          id="tracks-heading"
          title="Tracks"
          subtitle="A track is a path. Take the courses in order, then earn the path certification."
        />
        {data.tracks.length === 0 ? (
          <AcademyEmpty>{ACADEMY_COPY.emptyTracks}</AcademyEmpty>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {data.tracks.map((track) => {
              const image = coverSrc(track.coverImageUrl)
              return (
                <article key={track.slug} className="chitin-card chamfer-corner shadow-2xl overflow-hidden flex flex-col sm:flex-row">
                  <div
                    className="sm:w-36 min-h-24 bg-[#071012] bg-cover bg-center border-b sm:border-b-0 sm:border-r border-[#3a4a49]"
                    style={image ? { backgroundImage: `url(${image})` } : undefined}
                  />
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <LevelMark level={track.level} />
                      <span className="text-[10px] uppercase tracking-widest text-[#839493]">
                        {track.courseCount} courses · {track.estimatedHours} hr
                      </span>
                    </div>
                    <h3 className="font-grotesk font-bold text-lg text-[#dfe3e3]">{track.title}</h3>
                    <p className="text-xs text-[#b7c4c3] leading-relaxed">{track.description}</p>
                    {track.progressPercent > 0 ? <AcademyProgress percent={track.progressPercent} /> : null}
                    <Link
                      to="/lectures/tracks/$slug"
                      params={{ slug: track.slug }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#00ffff] hover:text-white"
                    >
                      View track
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-3" id="courses" aria-labelledby="courses-heading">
        <SectionHeading id="courses-heading" title="Courses" subtitle="Browse every published course. Enroll when you are ready to keep progress." />
        <div className="chitin-card p-3 sm:p-4 chamfer-corner space-y-3">
          <label className="flex items-center gap-2 border border-[#3a4a49] bg-[#070c0d] px-3 py-2">
            <Search className="w-4 h-4 text-[#839493]" />
            <span className="sr-only">Search courses</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, code, or instructor"
              className="w-full bg-transparent text-sm text-[#dfe3e3] placeholder:text-[#5d6e6d] outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={level === 'all'} onClick={() => setLevel('all')}>All levels</FilterChip>
            {ACADEMY_LEVELS.map((item) => (
              <FilterChip key={item} active={level === item} onClick={() => setLevel(item)}>
                {item === 'beginner' ? 'Beginner' : item === 'intermediate' ? 'Intermediate' : 'Advanced'}
              </FilterChip>
            ))}
          </div>
          {data.categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <FilterChip active={category === 'all'} onClick={() => setCategory('all')}>All subjects</FilterChip>
              {data.categories.map((item) => (
                <FilterChip key={item} active={category === item} onClick={() => setCategory(item)}>
                  {item}
                </FilterChip>
              ))}
            </div>
          ) : null}
        </div>
        {data.courses.length === 0 ? (
          <AcademyEmpty>{ACADEMY_COPY.emptyCatalog}</AcademyEmpty>
        ) : filtered.length === 0 ? (
          <AcademyEmpty>No courses match that search. Clear a filter and look again.</AcademyEmpty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3" id="certifications" aria-labelledby="certs-heading">
        <SectionHeading
          id="certs-heading"
          title="Certifications"
          subtitle="Finish a course for its certificate. Finish every required course in a track for the path certificate."
        />
        {data.certificates.length === 0 ? (
          <AcademyEmpty>{ACADEMY_COPY.emptyCertificates}</AcademyEmpty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.certificates.map((certificate) => (
              <article key={certificate.slug} className="chitin-card-inset p-4 chamfer-corner space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-[#00ffff] font-bold">
                  {certificate.scope === 'track' ? 'Track certification' : 'Course certification'}
                  {certificate.earned ? ' · Earned' : ''}
                </p>
                <h3 className="font-grotesk font-bold text-[#dfe3e3]">{certificate.title}</h3>
                <p className="text-xs text-[#b7c4c3] leading-relaxed">{certificate.description}</p>
                {certificate.earned && certificate.credentialId ? (
                  <Link
                    to="/lectures/certificates/$credentialId"
                    params={{ credentialId: certificate.credentialId }}
                    className="inline-flex text-[11px] font-bold uppercase tracking-widest text-[#00ffff] hover:text-white"
                  >
                    View credential
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        )}
        <Link to="/lectures/certificates" className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#00ffff] hover:text-white">
          Open certification record
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>
    </div>
  )
}

function GraduationCapIcon() {
  return <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ffff]" aria-hidden="true" />
}

function SectionHeading({ id, title, subtitle }: { id: string; title: string; subtitle: string }) {
  return (
    <div className="space-y-1">
      <h2 id={id} className="font-grotesk text-sm font-bold tracking-wider uppercase text-[#dfe3e3]">
        {title}
      </h2>
      <p className="text-xs text-[#839493]">{subtitle}</p>
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border chamfer-corner cursor-pointer',
        active
          ? 'border-[#00ffff]/70 text-[#00ffff] bg-[#00ffff]/10'
          : 'border-[#3a4a49] text-[#839493] hover:text-[#dfe3e3]',
      )}
    >
      {children}
    </button>
  )
}
