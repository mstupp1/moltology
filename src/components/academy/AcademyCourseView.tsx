import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Award, BookOpen, CheckCircle2, Circle, Clock, FileText, HelpCircle, Layers, Lock, PlayCircle, User } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import {
  ACADEMY_COPY,
  formatCourseLength,
  formatLessonDuration,
  lessonKindLabel,
  type AcademyCourseDetail,
  type AcademyLessonKind,
} from '@/lib/academy'
import { getAuthJWTToken } from '@/lib/jwt'
import { enrollAcademyCourseFn } from '@/lib/server/academy-api'
import { cn } from '@/lib/utils'
import {
  ACADEMY_CARD,
  ACADEMY_FOCUS,
  ACADEMY_TEXT_ACTION,
  AcademyCover,
  AcademyCrumbs,
  AcademyProgress,
  LevelMark,
  academyButtonLink,
} from './AcademyChrome'

export function lessonKindIcon(kind: AcademyLessonKind) {
  if (kind === 'video') return PlayCircle
  if (kind === 'quiz') return HelpCircle
  return FileText
}

export function AcademyCourseView({ course }: { course: AcademyCourseDetail }) {
  const toast = useOptionalToast()?.toast
  const [detail, setDetail] = useState(course)
  const [busy, setBusy] = useState(false)

  async function enroll() {
    setBusy(true)
    try {
      const token = await getAuthJWTToken()
      const next = await enrollAcademyCourseFn({ data: { slug: detail.slug, token: token ?? undefined } })
      setDetail(next)
      toast?.success(ACADEMY_COPY.enrollSuccess)
    } catch {
      toast?.error(ACADEMY_COPY.enrollError)
    } finally {
      setBusy(false)
    }
  }

  const lessons = detail.modules.flatMap((module) => module.lessons)
  const completedCount = lessons.filter((lesson) => lesson.completed).length
  const resume = detail.resumeLessonSlug
  const nextSlug = detail.enrolled && !detail.completed ? resume : null
  const previewSlug = detail.enrolled ? null : lessons.find((lesson) => lesson.isPreview)?.slug ?? null
  let lessonNumber = 0

  return (
    <div className="space-y-4 sm:space-y-5">
      <AcademyCrumbs items={[{ label: detail.title }]} />

      <header className={cn(ACADEMY_CARD, 'overflow-hidden grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)]')}>
        <div className="p-5 sm:p-6 space-y-3 order-2 md:order-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-glow">{detail.code}</span>
            <LevelMark level={detail.level} />
            <span className="text-[11px] uppercase tracking-[0.08em] text-ink-muted">{detail.category}</span>
          </div>
          <h1 className="font-grotesk font-extrabold text-2xl sm:text-3xl text-ink leading-tight">{detail.title}</h1>
          <p className="text-sm text-ink-body leading-relaxed max-w-2xl">{detail.subtitle}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-muted pt-1">
            <li className="inline-flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              {detail.instructorName}, {detail.instructorTitle}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {formatCourseLength(detail.estimatedMinutes)}
            </li>
          </ul>
          {detail.tracks.length > 0 ? (
            <p className="text-xs text-ink-muted">
              Part of{' '}
              {detail.tracks.map((track, index) => (
                <React.Fragment key={track.slug}>
                  {index > 0 ? ', ' : null}
                  <Link
                    to="/lectures/tracks/$slug"
                    params={{ slug: track.slug }}
                    className={cn('text-cyan-glow hover:text-cyan-hover rounded-control', ACADEMY_FOCUS)}
                  >
                    {track.title}
                  </Link>
                </React.Fragment>
              ))}
            </p>
          ) : null}
        </div>
        <AcademyCover
          url={detail.coverImageUrl}
          label={detail.code}
          className="order-1 md:order-2 min-h-32 md:min-h-full border-b md:border-b-0 md:border-l border-line-subtle"
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
        <div className="space-y-4 order-2 lg:order-1">
          <section className={cn(ACADEMY_CARD, 'p-4 sm:p-5 space-y-4')} aria-labelledby="about-heading">
            <h2 id="about-heading" className="font-grotesk text-sm font-bold tracking-[0.08em] uppercase text-ink">
              About this course
            </h2>
            <p className="text-sm text-ink-body leading-relaxed">{detail.description}</p>
            {detail.outcomes.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">What you will practice</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detail.outcomes.map((outcome) => (
                    <li key={outcome} className="text-sm text-ink-body flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-glow shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className={cn(ACADEMY_CARD, 'p-2 sm:p-3')} aria-labelledby="syllabus-heading">
            <div className="flex items-center justify-between gap-3 px-2 pt-2 pb-3">
              <h2 id="syllabus-heading" className="font-grotesk text-sm font-bold tracking-[0.08em] uppercase text-ink">
                Syllabus
              </h2>
              {detail.enrolled ? (
                <span className="text-xs text-ink-muted tabular-nums">
                  {completedCount} of {lessons.length} done
                </span>
              ) : null}
            </div>
            <div className="space-y-3">
              {detail.modules.map((module, moduleIndex) => (
                <div key={module.id} className="space-y-1">
                  <div className="px-2 py-1.5 border-t border-line-subtle first:border-t-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                      Module {moduleIndex + 1}
                    </p>
                    <h3 className="font-grotesk font-bold text-ink">{module.title}</h3>
                    {module.summary ? <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{module.summary}</p> : null}
                  </div>
                  <ol className="space-y-0.5">
                    {module.lessons.map((lesson) => {
                      lessonNumber += 1
                      const open = detail.enrolled || lesson.isPreview
                      const lit = lesson.slug === nextSlug
                      const KindIcon = lessonKindIcon(lesson.kind)
                      const row = (
                        <>
                          <span className="w-6 shrink-0 text-right text-xs tabular-nums text-ink-muted">{lessonNumber}</span>
                          <KindIcon className={cn('w-4 h-4 shrink-0', lit ? 'text-cyan-glow' : 'text-ink-muted')} aria-hidden="true" />
                          <span className="min-w-0 flex-1">
                            <span className={cn('block text-sm', lit ? 'text-ink font-bold' : 'text-ink')}>{lesson.title}</span>
                            <span className="block text-[11px] text-ink-muted">
                              {lessonKindLabel(lesson.kind)} · {formatLessonDuration(lesson.durationSeconds)}
                              {lit ? <span className="text-cyan-glow font-bold"> · Up next</span> : null}
                            </span>
                          </span>
                          {lesson.isPreview && !detail.enrolled ? (
                            <span className="rounded-chip border border-cyan-glow/40 bg-cyan-soft px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-glow shrink-0">
                              Preview
                            </span>
                          ) : null}
                          {lesson.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-label="Complete" />
                          ) : open ? (
                            <Circle className="w-4 h-4 text-line shrink-0" aria-label="Not started" />
                          ) : (
                            <Lock className="w-4 h-4 text-ink-muted shrink-0" aria-label="Enroll to open" />
                          )}
                        </>
                      )
                      const rowClass = cn(
                        'flex items-center gap-3 rounded-control px-2 py-2.5',
                        lit && 'bg-surface-3 shadow-nav-current',
                      )
                      return (
                        <li key={lesson.slug}>
                          {open ? (
                            <Link
                              to="/lectures/courses/$slug/lessons/$lessonSlug"
                              params={{ slug: detail.slug, lessonSlug: lesson.slug }}
                              className={cn(rowClass, !lit && 'hover:bg-surface-2', ACADEMY_FOCUS)}
                            >
                              {row}
                            </Link>
                          ) : (
                            <div className={cn(rowClass, 'opacity-80')}>{row}</div>
                          )}
                        </li>
                      )
                    })}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-3 order-1 lg:order-2 lg:sticky lg:top-4">
          <section className={cn(ACADEMY_CARD, 'p-4 space-y-3')} aria-label="Your progress">
            {detail.enrolled ? (
              <>
                <AcademyProgress percent={detail.progressPercent} label={detail.completed ? 'Course complete' : 'Your progress'} />
                {resume ? (
                  <Link
                    to="/lectures/courses/$slug/lessons/$lessonSlug"
                    params={{ slug: detail.slug, lessonSlug: resume }}
                    className={cn(academyButtonLink('primary'), 'w-full')}
                  >
                    {detail.completed ? 'Review course' : completedCount === 0 ? 'Start first lesson' : 'Continue'}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-xs text-ink-body leading-relaxed">
                  Enroll to open every lesson and keep your place.
                </p>
                <HudButton type="button" variant="primary" size="md" fullWidth disabled={busy} onClick={() => void enroll()}>
                  {busy ? 'Enrolling…' : 'Enroll'}
                </HudButton>
                {previewSlug ? (
                  <Link
                    to="/lectures/courses/$slug/lessons/$lessonSlug"
                    params={{ slug: detail.slug, lessonSlug: previewSlug }}
                    className={cn(academyButtonLink('secondary'), 'w-full')}
                  >
                    <BookOpen className="w-4 h-4" aria-hidden="true" />
                    Try the preview lesson
                  </Link>
                ) : null}
              </>
            )}
          </section>

          <section className={cn(ACADEMY_CARD, 'p-4 space-y-2')} aria-labelledby="course-cert-heading">
            <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-ink-muted font-bold">
              <Award className="w-3.5 h-3.5 text-cyan-glow" aria-hidden="true" />
              Certification
            </p>
            {detail.certificate ? (
              <>
                <h2 id="course-cert-heading" className="font-grotesk font-bold text-ink">{detail.certificate.title}</h2>
                <p className="text-xs text-ink-body leading-relaxed">{detail.certificate.description}</p>
                <p className={cn('text-xs', detail.certificate.earned ? 'text-emerald-500' : 'text-ink-muted')}>
                  {detail.certificate.earned ? 'Earned. It is on your certification record.' : 'Issued when every lesson in this course is complete.'}
                </p>
                {detail.certificate.earned && detail.certificate.credentialId ? (
                  <Link
                    to="/lectures/certificates/$credentialId"
                    params={{ credentialId: detail.certificate.credentialId }}
                    className={ACADEMY_TEXT_ACTION}
                  >
                    View credential
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                ) : null}
              </>
            ) : (
              <p id="course-cert-heading" className="text-xs text-ink-muted">This course does not issue a certification yet.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}

