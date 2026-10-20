import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Award, CheckCircle2, Clock, Layers } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { ACADEMY_COPY, formatCourseLength, type AcademyTrackDetail } from '@/lib/academy'
import { getAuthJWTToken } from '@/lib/jwt'
import { enrollAcademyTrackFn } from '@/lib/server/academy-api'
import { cn } from '@/lib/utils'
import {
  ACADEMY_CARD,
  ACADEMY_CARD_LINK,
  ACADEMY_TEXT_ACTION,
  AcademyCover,
  AcademyCrumbs,
  AcademyEmpty,
  AcademyProgress,
  LevelMark,
} from './AcademyChrome'

export function AcademyTrackView({ track }: { track: AcademyTrackDetail }) {
  const toast = useOptionalToast()?.toast
  const [detail, setDetail] = useState(track)
  const [busy, setBusy] = useState(false)
  const enrolledCount = detail.courses.filter((course) => course.enrolled).length
  const completedCount = detail.courses.filter((course) => course.completed).length
  const allEnrolled = detail.courses.length > 0 && enrolledCount === detail.courses.length
  const nextCourse = enrolledCount > 0 ? detail.courses.find((course) => !course.completed) ?? null : null

  async function enroll() {
    setBusy(true)
    try {
      const token = await getAuthJWTToken()
      const next = await enrollAcademyTrackFn({ data: { slug: detail.slug, token: token ?? undefined } })
      setDetail(next)
      toast?.success('You are enrolled in every course on this track.')
    } catch {
      toast?.error(ACADEMY_COPY.enrollError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <AcademyCrumbs items={[{ label: detail.title }]} />

      <header className={cn(ACADEMY_CARD, 'overflow-hidden grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)]')}>
        <div className="p-5 sm:p-6 space-y-3 order-2 md:order-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-glow">Track</span>
            <LevelMark level={detail.level} />
          </div>
          <h1 className="font-grotesk font-extrabold text-2xl sm:text-3xl text-ink leading-tight">{detail.title}</h1>
          <p className="text-sm text-ink-body leading-relaxed max-w-2xl">{detail.subtitle}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-muted">
            <li className="inline-flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              {detail.courses.length} {detail.courses.length === 1 ? 'course' : 'courses'}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              about {detail.estimatedHours} hr
            </li>
          </ul>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {allEnrolled ? null : (
              <HudButton type="button" variant="primary" size="md" disabled={busy || detail.courses.length === 0} onClick={() => void enroll()}>
                {busy ? 'Enrolling…' : 'Enroll in track'}
              </HudButton>
            )}
            {nextCourse ? (
              <Link to="/lectures/courses/$slug" params={{ slug: nextCourse.slug }} className={ACADEMY_TEXT_ACTION}>
                Next up: {nextCourse.title}
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
          {enrolledCount > 0 ? (
            <div className="max-w-sm pt-1">
              <AcademyProgress percent={detail.progressPercent} label={`${completedCount} of ${detail.courses.length} courses`} />
            </div>
          ) : null}
        </div>
        <AcademyCover
          url={detail.coverImageUrl}
          className="order-1 md:order-2 min-h-32 md:min-h-full border-b md:border-b-0 md:border-l border-line-subtle"
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
        <section className="space-y-3" aria-labelledby="track-courses-heading">
          <h2 id="track-courses-heading" className="font-grotesk text-sm font-bold tracking-[0.08em] uppercase text-ink">
            Courses in order
          </h2>
          {detail.courses.length === 0 ? (
            <AcademyEmpty>{ACADEMY_COPY.emptyCatalog}</AcademyEmpty>
          ) : (
            <ol className="space-y-2">
              {detail.courses.map((course, index) => {
                const lit = nextCourse?.slug === course.slug
                return (
                  <li key={course.slug}>
                    <Link
                      to="/lectures/courses/$slug"
                      params={{ slug: course.slug }}
                      className={cn(
                        ACADEMY_CARD_LINK,
                        'group p-4 flex items-start gap-4',
                        lit && 'bg-surface-3 shadow-nav-current border-transparent',
                      )}
                    >
                      <span
                        className={cn(
                          'flex w-8 h-8 shrink-0 items-center justify-center rounded-control font-grotesk font-bold text-sm tabular-nums',
                          course.completed ? 'bg-emerald-500/15 text-emerald-500' : lit ? 'bg-cyan-soft text-cyan-glow' : 'bg-surface-2 text-ink-muted',
                        )}
                      >
                        {course.completed ? <CheckCircle2 className="w-4 h-4" aria-label="Complete" /> : index + 1}
                      </span>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-ink-muted">
                          <span className="font-bold text-ink">{course.code}</span>
                          {course.required ? ' · Required' : ' · Optional'} · {formatCourseLength(course.estimatedMinutes)}
                          {lit ? <span className="font-bold text-cyan-glow"> · Up next</span> : null}
                        </p>
                        <h3 className="font-grotesk font-bold text-ink">{course.title}</h3>
                        <p className="text-xs text-ink-body leading-relaxed">{course.subtitle}</p>
                        {course.enrolled && !course.completed ? (
                          <div className="pt-1.5">
                            <AcademyProgress percent={course.progressPercent} />
                          </div>
                        ) : null}
                      </div>
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-cyan-glow shrink-0 self-center">
                        {course.completed ? 'Review' : course.enrolled ? 'Continue' : 'View course'}
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        <aside className="space-y-3 lg:sticky lg:top-4">
          <section className={cn(ACADEMY_CARD, 'p-4 space-y-3')} aria-labelledby="track-outcomes-heading">
              <h2 id="track-outcomes-heading" className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                About this track
              </h2>
              <p className="text-xs text-ink-body leading-relaxed">{detail.description}</p>
              {detail.outcomes.length > 0 ? (
                <ul className="space-y-2">
                  {detail.outcomes.map((outcome) => (
                    <li key={outcome} className="text-sm text-ink-body flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-glow shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          {detail.certificate ? (
            <section className={cn(ACADEMY_CARD, 'p-4 space-y-2')} aria-labelledby="track-cert-heading">
              <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-ink-muted font-bold">
                <Award className="w-3.5 h-3.5 text-cyan-glow" aria-hidden="true" />
                Path certification
              </p>
              <h2 id="track-cert-heading" className="font-grotesk font-bold text-ink">{detail.certificate.title}</h2>
              <p className="text-xs text-ink-body leading-relaxed">{detail.certificate.description}</p>
              {detail.certificate.earned && detail.certificate.credentialId ? (
                <Link
                  to="/lectures/certificates/$credentialId"
                  params={{ credentialId: detail.certificate.credentialId }}
                  className={ACADEMY_TEXT_ACTION}
                >
                  View credential
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              ) : (
                <p className="text-xs text-ink-muted">Issued when every required course on this track is complete.</p>
              )}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
