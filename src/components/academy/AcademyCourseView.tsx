import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CheckCircle2, Clock, Lock } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import {
  ACADEMY_COPY,
  formatCourseLength,
  formatLessonDuration,
  lessonKindLabel,
  type AcademyCourseDetail,
} from '@/lib/academy'
import { getAuthJWTToken } from '@/lib/jwt'
import { enrollAcademyCourseFn } from '@/lib/server/academy-api'
import { AcademyNav, AcademyProgress, LevelMark } from './AcademyChrome'

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

  const resume = detail.resumeLessonSlug
  return (
    <div className="space-y-3.5 sm:space-y-5">
      <HudTitlePanel
        eyebrow={<><LevelMark level={detail.level} /> · {detail.code}</>}
        title={detail.title}
        description={detail.subtitle}
        actions={<AcademyNav current="catalog" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-3">
        <div className="space-y-3">
          <section className="chitin-card p-4 sm:p-5 chamfer-corner space-y-3">
            <p className="text-sm text-[#dfe3e3] leading-relaxed">{detail.description}</p>
            <p className="text-xs text-[#839493]">
              {detail.instructorName}, {detail.instructorTitle}
              <span className="text-[#3a4a49]"> · </span>
              {detail.category}
              <span className="text-[#3a4a49]"> · </span>
              {formatCourseLength(detail.estimatedMinutes)}
            </p>
            {detail.tracks.length > 0 ? (
              <p className="text-xs text-[#b7c4c3]">
                Part of{' '}
                {detail.tracks.map((track, index) => (
                  <React.Fragment key={track.slug}>
                    {index > 0 ? ', ' : null}
                    <Link to="/lectures/tracks/$slug" params={{ slug: track.slug }} className="text-[#00ffff] hover:text-white">
                      {track.title}
                    </Link>
                  </React.Fragment>
                ))}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              {detail.enrolled && resume ? (
                <Link
                  to="/lectures/courses/$slug/lessons/$lessonSlug"
                  params={{ slug: detail.slug, lessonSlug: resume }}
                  className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold uppercase tracking-widest border border-[#00c3ff] text-white bg-[#05222b] chamfer-corner"
                >
                  {detail.completed ? 'Review course' : 'Continue'}
                </Link>
              ) : (
                <HudButton type="button" variant="cyan" size="md" disabled={busy || detail.enrolled} onClick={() => void enroll()}>
                  {detail.enrolled ? 'Enrolled' : busy ? 'Enrolling…' : 'Enroll'}
                </HudButton>
              )}
              <Link to="/lectures" className="self-center text-[11px] font-bold uppercase tracking-widest text-[#839493] hover:text-[#dfe3e3]">
                Back to Academy
              </Link>
            </div>
            {detail.enrolled ? <AcademyProgress percent={detail.progressPercent} /> : null}
          </section>

          <section className="chitin-card p-4 sm:p-5 chamfer-corner space-y-3">
            <h2 className="font-grotesk text-sm font-bold tracking-wider uppercase text-[#dfe3e3]">What you will practice</h2>
            <ul className="space-y-2">
              {detail.outcomes.map((outcome) => (
                <li key={outcome} className="text-sm text-[#dfe3e3] flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00ffff] shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3" aria-labelledby="syllabus-heading">
            <h2 id="syllabus-heading" className="font-grotesk text-sm font-bold tracking-wider uppercase text-[#dfe3e3]">
              Syllabus
            </h2>
            {detail.modules.map((module) => (
              <div key={module.id} className="chitin-card p-4 chamfer-corner space-y-2">
                <div>
                  <h3 className="font-grotesk font-bold text-[#dfe3e3]">{module.title}</h3>
                  {module.summary ? <p className="text-xs text-[#839493] mt-1">{module.summary}</p> : null}
                </div>
                <ol className="space-y-1.5">
                  {module.lessons.map((lesson) => {
                    const open = detail.enrolled || lesson.isPreview
                    const row = (
                      <span className="flex items-start justify-between gap-3 w-full">
                        <span className="space-y-0.5">
                          <span className="block text-sm text-[#dfe3e3]">{lesson.title}</span>
                          <span className="block text-[11px] text-[#839493]">
                            {lessonKindLabel(lesson.kind)}
                            <span className="text-[#3a4a49]"> · </span>
                            {formatLessonDuration(lesson.durationSeconds)}
                            {lesson.isPreview && !detail.enrolled ? ' · Preview' : ''}
                          </span>
                        </span>
                        {lesson.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#39ff14] shrink-0" aria-label="Complete" />
                        ) : open ? (
                          <Clock className="w-4 h-4 text-[#839493] shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-[#839493] shrink-0" aria-label="Enroll to open" />
                        )}
                      </span>
                    )
                    return (
                      <li key={lesson.slug} className="border border-[#3a4a49]/70 bg-[#070c0d] px-3 py-2">
                        {open ? (
                          <Link
                            to="/lectures/courses/$slug/lessons/$lessonSlug"
                            params={{ slug: detail.slug, lessonSlug: lesson.slug }}
                            className="block hover:text-white"
                          >
                            {row}
                          </Link>
                        ) : (
                          row
                        )}
                      </li>
                    )
                  })}
                </ol>
              </div>
            ))}
          </section>
        </div>

        <aside className="chitin-card p-4 chamfer-corner space-y-2 h-fit">
          <p className="text-[10px] uppercase tracking-widest text-[#00ffff] font-bold">Certification</p>
          {detail.certificate ? (
            <>
              <h2 className="font-grotesk font-bold text-[#dfe3e3]">{detail.certificate.title}</h2>
              <p className="text-xs text-[#b7c4c3] leading-relaxed">{detail.certificate.description}</p>
              <p className="text-xs text-[#839493]">
                {detail.certificate.earned ? 'Earned. It is on your certification record.' : 'Issued when every lesson in this course is complete.'}
              </p>
              {detail.certificate.earned && detail.certificate.credentialId ? (
                <Link
                  to="/lectures/certificates/$credentialId"
                  params={{ credentialId: detail.certificate.credentialId }}
                  className="inline-flex text-[11px] font-bold uppercase tracking-widest text-[#00ffff] hover:text-white"
                >
                  View credential
                </Link>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-[#839493]">This course does not issue a certification yet.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
