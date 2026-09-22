import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CheckCircle2 } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import {
  ACADEMY_COPY,
  formatLessonDuration,
  lessonKindLabel,
  readingParagraphs,
  type AcademyLessonDetail,
  type QuizGradeResult,
} from '@/lib/academy'
import { getAuthJWTToken } from '@/lib/jwt'
import { enrollAcademyCourseFn, saveAcademyLessonFn, submitAcademyQuizFn } from '@/lib/server/academy-api'
import { AcademyProgress } from './AcademyChrome'
import { AcademyVideo } from './AcademyVideo'

export function AcademyLessonView({ lesson }: { lesson: AcademyLessonDetail }) {
  const toast = useOptionalToast()?.toast
  const [detail, setDetail] = useState(lesson)
  const [busy, setBusy] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [grade, setGrade] = useState<QuizGradeResult | null>(null)
  const [note, setNote] = useState(lesson.note)

  async function enroll() {
    setBusy(true)
    try {
      const token = await getAuthJWTToken()
      await enrollAcademyCourseFn({ data: { slug: detail.courseSlug, token: token ?? undefined } })
      const saved = await saveAcademyLessonFn({
        data: {
          courseSlug: detail.courseSlug,
          lessonSlug: detail.slug,
          action: 'position',
          lastPositionSeconds: 0,
          token: token ?? undefined,
        },
      })
      setDetail({ ...saved.lesson, locked: false, enrolled: true })
      toast?.success(ACADEMY_COPY.enrollSuccess)
    } catch {
      toast?.error(ACADEMY_COPY.enrollError)
    } finally {
      setBusy(false)
    }
  }

  async function save(action: 'complete' | 'position' | 'note', extra?: { lastPositionSeconds?: number; note?: string }) {
    setBusy(true)
    try {
      const token = await getAuthJWTToken()
      const saved = await saveAcademyLessonFn({
        data: {
          courseSlug: detail.courseSlug,
          lessonSlug: detail.slug,
          action,
          token: token ?? undefined,
          ...extra,
        },
      })
      setDetail(saved.lesson)
      if (action === 'complete') toast?.success(saved.awardedCredentialIds.length ? 'Lesson complete. A certification was issued.' : 'Lesson complete.')
      if (saved.awardedCredentialIds[0]) {
        toast?.info('Open Certifications to see the credential.', { id: 'academy-cert' })
      }
    } catch (error) {
      const message = error instanceof Error && error.message.includes('Pass the quiz')
        ? 'Pass the quiz to complete this lesson.'
        : ACADEMY_COPY.progressError
      toast?.error(message)
    } finally {
      setBusy(false)
    }
  }

  async function submitQuiz() {
    setBusy(true)
    try {
      const token = await getAuthJWTToken()
      const result = await submitAcademyQuizFn({
        data: {
          courseSlug: detail.courseSlug,
          lessonSlug: detail.slug,
          answers,
          token: token ?? undefined,
        },
      })
      setDetail(result.lesson)
      setGrade(result.grade)
      toast?.[result.grade.passed ? 'success' : 'warning'](result.grade.passed ? ACADEMY_COPY.quizPass : ACADEMY_COPY.quizFail)
    } catch {
      toast?.error(ACADEMY_COPY.progressError)
    } finally {
      setBusy(false)
    }
  }

  const allAnswered = detail.questions.every((question) => Number.isInteger(answers[question.id]))

  return (
    <div className="space-y-3.5 sm:space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest text-[#839493]">
        <Link to="/lectures" className="hover:text-[#00ffff]">Academy</Link>
        <span aria-hidden="true">·</span>
        <Link to="/lectures/courses/$slug" params={{ slug: detail.courseSlug }} className="hover:text-[#00ffff]">
          {detail.courseTitle}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-3">
        <div className="space-y-3">
          <header className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-[#00ffff] font-bold">
              {detail.courseCode}
              <span className="text-[#3a4a49]"> · </span>
              {lessonKindLabel(detail.kind)}
              <span className="text-[#3a4a49]"> · </span>
              {formatLessonDuration(detail.durationSeconds)}
            </p>
            <h1 className="font-grotesk font-extrabold text-xl sm:text-2xl text-[#dfe3e3] tracking-wide">{detail.title}</h1>
            <p className="text-sm text-[#b7c4c3]">{detail.summary}</p>
          </header>

          {detail.locked ? (
            <section className="chitin-card p-5 chamfer-corner space-y-3">
              <p className="text-sm text-[#dfe3e3]">{ACADEMY_COPY.lessonLocked}</p>
              <HudButton type="button" variant="cyan" disabled={busy} onClick={() => void enroll()}>
                {busy ? 'Enrolling…' : 'Enroll'}
              </HudButton>
            </section>
          ) : (
            <>
              {detail.kind === 'video' ? (
                <AcademyVideo
                  title={detail.title}
                  url={detail.videoUrl}
                  provider={detail.videoProvider}
                  posterUrl={detail.posterUrl}
                  startAt={detail.lastPositionSeconds}
                  onPause={(seconds) => {
                    void save('position', { lastPositionSeconds: Math.floor(seconds) })
                  }}
                  onEnded={() => {
                    if (!detail.completed) void save('complete')
                  }}
                />
              ) : null}

              {detail.kind === 'reading' ? (
                <article className="chitin-card p-4 sm:p-5 chamfer-corner space-y-3">
                  {readingParagraphs(detail.body).map((paragraph) => (
                    <p key={paragraph.slice(0, 48)} className="text-sm text-[#dfe3e3] leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </article>
              ) : null}

              {detail.kind === 'quiz' ? (
                <section className="chitin-card p-4 sm:p-5 chamfer-corner space-y-4">
                  <p className="text-xs text-[#839493]">Pass mark: {detail.passingScore}%. Answer every question, then submit.</p>
                  {detail.quizPassed && !grade ? (
                    <p className="text-sm text-[#39ff14]">You already passed this quiz{detail.quizScore != null ? ` with ${detail.quizScore}%` : ''}.</p>
                  ) : null}
                  {detail.questions.map((question, questionIndex) => {
                    const review = grade?.results.find((result) => result.id === question.id)
                    return (
                      <fieldset key={question.id} className="space-y-2">
                        <legend className="text-sm text-[#dfe3e3] font-medium">
                          {questionIndex + 1}. {question.prompt}
                        </legend>
                        {question.choices.map((choice, choiceIndex) => {
                          const selected = answers[question.id] === choiceIndex
                          return (
                            <label key={choice} className="flex items-start gap-2 text-sm text-[#dfe3e3] cursor-pointer">
                              <input
                                type="radio"
                                name={question.id}
                                className="mt-1"
                                checked={selected}
                                onChange={() => setAnswers((current) => ({ ...current, [question.id]: choiceIndex }))}
                              />
                              <span>{choice}</span>
                            </label>
                          )
                        })}
                        {review ? (
                          <p className={`text-xs ${review.correct ? 'text-[#39ff14]' : 'text-[#ffb4a8]'}`}>
                            {review.correct ? 'Correct.' : 'Not this one.'} {review.explanation}
                          </p>
                        ) : null}
                      </fieldset>
                    )
                  })}
                  <HudButton type="button" variant="cyan" disabled={busy || !allAnswered || detail.questions.length === 0} onClick={() => void submitQuiz()}>
                    {busy ? 'Submitting…' : 'Submit quiz'}
                  </HudButton>
                  {grade ? (
                    <p className="text-sm text-[#dfe3e3]">
                      Score: {grade.scorePercent}% ({grade.correctCount} of {grade.total}).
                    </p>
                  ) : null}
                </section>
              ) : (
                <HudButton type="button" variant="cyan" disabled={busy || detail.completed} onClick={() => void save('complete')}>
                  {detail.completed ? 'Lesson complete' : busy ? 'Saving…' : 'Mark complete'}
                </HudButton>
              )}

              <section className="chitin-card p-4 chamfer-corner space-y-2">
                <label htmlFor="lesson-note" className="text-[10px] uppercase tracking-widest text-[#839493] font-bold">
                  Your notes
                </label>
                <textarea
                  id="lesson-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  onBlur={() => {
                    if (note !== detail.note) void save('note', { note })
                  }}
                  rows={4}
                  className="w-full bg-[#070c0d] border border-[#3a4a49] text-sm text-[#dfe3e3] p-3 outline-none focus:border-[#00c3ff]"
                  placeholder="Keep a return point for this lesson."
                />
              </section>

              <div className="flex justify-between gap-3">
                {detail.previousSlug ? (
                  <Link
                    to="/lectures/courses/$slug/lessons/$lessonSlug"
                    params={{ slug: detail.courseSlug, lessonSlug: detail.previousSlug }}
                    className="text-[11px] font-bold uppercase tracking-widest text-[#839493] hover:text-[#dfe3e3]"
                  >
                    Previous
                  </Link>
                ) : <span />}
                {detail.nextSlug ? (
                  <Link
                    to="/lectures/courses/$slug/lessons/$lessonSlug"
                    params={{ slug: detail.courseSlug, lessonSlug: detail.nextSlug }}
                    className="text-[11px] font-bold uppercase tracking-widest text-[#00ffff] hover:text-white"
                  >
                    Next lesson
                  </Link>
                ) : null}
              </div>
            </>
          )}
        </div>

        <aside className="chitin-card p-3 chamfer-corner space-y-3 h-fit">
          <h2 className="font-grotesk text-sm font-bold tracking-wider uppercase text-[#dfe3e3] px-1">Syllabus</h2>
          {detail.modules.map((module) => (
            <div key={module.id} className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-[#839493] px-1">{module.title}</p>
              <ul className="space-y-1">
                {module.lessons.map((item) => {
                  const active = item.slug === detail.slug
                  return (
                    <li key={item.slug}>
                      <Link
                        to="/lectures/courses/$slug/lessons/$lessonSlug"
                        params={{ slug: detail.courseSlug, lessonSlug: item.slug }}
                        className={`flex items-start gap-2 px-2 py-1.5 text-xs ${active ? 'bg-[#00ffff]/10 text-[#00ffff]' : 'text-[#dfe3e3] hover:bg-[#0b1212]'}`}
                      >
                        {item.completed ? <CheckCircle2 className="w-3.5 h-3.5 text-[#39ff14] shrink-0 mt-0.5" /> : <span className="w-3.5" />}
                        <span>{item.title}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {detail.enrolled ? (
            <AcademyProgress
              percent={(() => {
                const items = detail.modules.flatMap((module) => module.lessons)
                if (items.length === 0) return 0
                return Math.round((items.filter((item) => item.completed).length / items.length) * 100)
              })()}
            />
          ) : null}
        </aside>
      </div>
    </div>
  )
}
