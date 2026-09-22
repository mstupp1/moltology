import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CheckCircle2 } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { ACADEMY_COPY, formatCourseLength, type AcademyTrackDetail } from '@/lib/academy'
import { getAuthJWTToken } from '@/lib/jwt'
import { enrollAcademyTrackFn } from '@/lib/server/academy-api'
import { AcademyNav, AcademyProgress, LevelMark } from './AcademyChrome'

export function AcademyTrackView({ track }: { track: AcademyTrackDetail }) {
  const toast = useOptionalToast()?.toast
  const [detail, setDetail] = useState(track)
  const [busy, setBusy] = useState(false)
  const enrolledCount = detail.courses.filter((course) => course.enrolled).length

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
    <div className="space-y-3.5 sm:space-y-5">
      <HudTitlePanel
        eyebrow={<LevelMark level={detail.level} />}
        title={detail.title}
        description={detail.subtitle}
        actions={<AcademyNav current="catalog" />}
      />
      <section className="chitin-card p-4 sm:p-5 chamfer-corner space-y-3">
        <p className="text-sm text-[#dfe3e3] leading-relaxed">{detail.description}</p>
        <p className="text-xs text-[#839493]">
          {detail.courses.length} courses
          <span className="text-[#3a4a49]"> · </span>
          about {detail.estimatedHours} hr
        </p>
        <ul className="space-y-1.5">
          {detail.outcomes.map((outcome) => (
            <li key={outcome} className="text-sm text-[#dfe3e3] flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00ffff] shrink-0 mt-0.5" />
              <span>{outcome}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <HudButton type="button" variant="cyan" size="md" disabled={busy || enrolledCount === detail.courses.length} onClick={() => void enroll()}>
            {enrolledCount === detail.courses.length && detail.courses.length > 0
              ? 'Enrolled'
              : busy
                ? 'Enrolling…'
                : 'Enroll in track'}
          </HudButton>
          <Link to="/lectures" className="self-center text-[11px] font-bold uppercase tracking-widest text-[#839493] hover:text-[#dfe3e3]">
            Back to Academy
          </Link>
        </div>
        {enrolledCount > 0 ? <AcademyProgress percent={detail.progressPercent} /> : null}
      </section>

      <section className="space-y-3" aria-labelledby="track-courses-heading">
        <h2 id="track-courses-heading" className="font-grotesk text-sm font-bold tracking-wider uppercase text-[#dfe3e3]">
          Courses in this track
        </h2>
        <ol className="space-y-2">
          {detail.courses.map((course, index) => (
            <li key={course.slug} className="chitin-card p-4 chamfer-corner flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="font-grotesk text-lg text-[#00ffff] w-8">{index + 1}</span>
              <div className="flex-1 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-[#839493]">
                  {course.code}
                  {course.required ? ' · Required' : ' · Optional'}
                  <span className="text-[#3a4a49]"> · </span>
                  {formatCourseLength(course.estimatedMinutes)}
                </p>
                <h3 className="font-grotesk font-bold text-[#dfe3e3]">{course.title}</h3>
                <p className="text-xs text-[#b7c4c3]">{course.subtitle}</p>
                {course.enrolled ? <AcademyProgress percent={course.progressPercent} /> : null}
              </div>
              <Link
                to="/lectures/courses/$slug"
                params={{ slug: course.slug }}
                className="text-[11px] font-bold uppercase tracking-widest text-[#00ffff] hover:text-white"
              >
                {course.completed ? 'Review' : course.enrolled ? 'Continue' : 'View course'}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {detail.certificate ? (
        <aside className="chitin-card p-4 chamfer-corner space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-[#00ffff] font-bold">Path certification</p>
          <h2 className="font-grotesk font-bold text-[#dfe3e3]">{detail.certificate.title}</h2>
          <p className="text-xs text-[#b7c4c3] leading-relaxed">{detail.certificate.description}</p>
          {detail.certificate.earned && detail.certificate.credentialId ? (
            <Link
              to="/lectures/certificates/$credentialId"
              params={{ credentialId: detail.certificate.credentialId }}
              className="inline-flex text-[11px] font-bold uppercase tracking-widest text-[#00ffff] hover:text-white"
            >
              View credential
            </Link>
          ) : (
            <p className="text-xs text-[#839493]">Issued when every required course on this track is complete.</p>
          )}
        </aside>
      ) : null}
    </div>
  )
}
