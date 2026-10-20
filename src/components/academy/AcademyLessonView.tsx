import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, ListOrdered, Lock } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { HudBottomSheet } from '@/components/ui/HudBottomSheet'
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
import { cn } from '@/lib/utils'
import {
  ACADEMY_CARD,
  ACADEMY_CRUMB_LINK,
  ACADEMY_FOCUS,
  AcademyCrumbs,
  AcademyProgress,
  academyButtonLink,
} from './AcademyChrome'
import { lessonKindIcon } from './AcademyCourseView'
import { AcademyVideo } from './AcademyVideo'

type NoteStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

const NOTE_STATUS_LABEL: Record<NoteStatus, string> = {
  idle: '',
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Not saved',
}

export function AcademyLessonView({ lesson }: { lesson: AcademyLessonDetail }) {
  const toast = useOptionalToast()?.toast
  const [detail, setDetail] = useState(lesson)
  const [busy, setBusy] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [grade, setGrade] = useState<QuizGradeResult | null>(null)
  const [note, setNote] = useState(lesson.note)
  const [noteStatus, setNoteStatus] = useState<NoteStatus>('idle')
  const [syllabusOpen, setSyllabusOpen] = useState(false)

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

  async function save(action: 'complete' | 'position', extra?: { lastPositionSeconds?: number }) {
    if (action === 'complete') setBusy(true)
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
      if (action === 'complete') setBusy(false)
    }
  }

  async function saveNote() {
    if (note === detail.note) {
      setNoteStatus((status) => (status === 'dirty' ? 'idle' : status))
      return
    }
    setNoteStatus('saving')
    try {
      const token = await getAuthJWTToken()
      const saved = await saveAcademyLessonFn({
        data: { courseSlug: detail.courseSlug, lessonSlug: detail.slug, action: 'note', note, token: token ?? undefined },
      })
      setDetail(saved.lesson)
      setNoteStatus('saved')
    } catch {
      setNoteStatus('error')
      toast?.error('Could not save your note. Please try again.', { id: 'academy-note' })
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

  function retryQuiz() {
    setGrade(null)
    setAnswers({})
  }

  const allAnswered = detail.questions.every((question) => Number.isInteger(answers[question.id]))
  const lessons = detail.modules.flatMap((module) => module.lessons)
  const position = lessons.findIndex((item) => item.slug === detail.slug)
  const completedCount = lessons.filter((item) => item.completed).length
  const currentModule = detail.modules.find((module) => module.lessons.some((item) => item.slug === detail.slug))
  const KindIcon = lessonKindIcon(detail.kind)

  const syllabus = (
    <LessonSyllabus
      lesson={detail}
      completedCount={completedCount}
      total={lessons.length}
      onNavigate={() => setSyllabusOpen(false)}
    />
  )

  return (
    <div className="space-y-4 sm:space-y-5">
      <AcademyCrumbs
        items={[
          {
            label: detail.courseTitle,
            link: (
              <Link to="/lectures/courses/$slug" params={{ slug: detail.courseSlug }} className={ACADEMY_CRUMB_LINK}>
                {detail.courseTitle}
              </Link>
            ),
          },
          { label: detail.title },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <header className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-[0.08em]">
              <span className="text-cyan-glow">{detail.courseCode}</span>
              {currentModule ? <span className="text-ink-muted">{currentModule.title}</span> : null}
              {position >= 0 ? (
                <span className="text-ink-muted tabular-nums">
                  Lesson {position + 1} of {lessons.length}
                </span>
              ) : null}
            </div>
            <h1 className="font-grotesk font-extrabold text-2xl sm:text-3xl text-ink leading-tight">{detail.title}</h1>
            <p className="text-sm text-ink-body leading-relaxed max-w-2xl">{detail.summary}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-chip border border-line-subtle px-2 min-h-[22px] text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                <KindIcon className="w-3.5 h-3.5" aria-hidden="true" />
                {lessonKindLabel(detail.kind)} · {formatLessonDuration(detail.durationSeconds)}
              </span>
              {detail.completed ? (
                <span className="inline-flex items-center gap-1 rounded-chip border border-emerald-500/40 px-2 min-h-[22px] text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-500">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  Complete
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setSyllabusOpen(true)}
                className={cn(
                  'lg:hidden ml-auto inline-flex items-center gap-1.5 min-h-8 px-3 rounded-control border border-line text-[11px] font-bold uppercase tracking-[0.08em] text-ink hover:bg-surface-2',
                  ACADEMY_FOCUS,
                )}
              >
                <ListOrdered className="w-3.5 h-3.5 text-cyan-glow" aria-hidden="true" />
                Syllabus
                <span className="text-ink-muted tabular-nums">
                  {completedCount}/{lessons.length}
                </span>
              </button>
            </div>
          </header>

          {detail.locked ? (
            <section className={cn(ACADEMY_CARD, 'p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4')}>
              <span className="flex w-10 h-10 shrink-0 items-center justify-center rounded-card bg-surface-2 text-cyan-glow">
                <Lock className="w-5 h-5" aria-hidden="true" />
              </span>
              <p className="text-sm text-ink flex-1">{ACADEMY_COPY.lessonLocked}</p>
              <HudButton type="button" variant="primary" disabled={busy} onClick={() => void enroll()}>
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
                <article className={cn(ACADEMY_CARD, 'p-5 sm:p-8')}>
                  <div className="max-w-[68ch] space-y-4">
                    {readingParagraphs(detail.body).map((paragraph) => (
                      <p key={paragraph.slice(0, 48)} className="text-[15px] text-ink-body leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </article>
              ) : null}

              {detail.kind === 'quiz' ? (
                <section className={cn(ACADEMY_CARD, 'p-4 sm:p-5 space-y-5')} aria-label="Quiz">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-ink-muted">
                      Pass mark {detail.passingScore}%. Answer every question, then submit.
                    </p>
                    {detail.quizPassed && !grade ? (
                      <p className="text-xs font-bold text-emerald-500">
                        Passed{detail.quizScore != null ? ` with ${detail.quizScore}%` : ''}
                      </p>
                    ) : null}
                  </div>
                  {detail.questions.map((question, questionIndex) => {
                    const review = grade?.results.find((result) => result.id === question.id)
                    return (
                      <fieldset key={question.id} className="space-y-2" disabled={Boolean(grade)}>
                        <legend className="text-sm text-ink font-bold mb-2">
                          <span className="text-ink-muted tabular-nums mr-1.5">{questionIndex + 1}.</span>
                          {question.prompt}
                        </legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {question.choices.map((choice, choiceIndex) => {
                            const selected = answers[question.id] === choiceIndex
                            const isCorrect = review ? review.correctIndex === choiceIndex : false
                            const isWrongPick = review ? selected && !review.correct : false
                            return (
                              <label
                                key={choice}
                                className={cn(
                                  'relative flex items-start gap-2.5 rounded-control border px-3 py-2.5 text-sm cursor-pointer transition-[background-color,border-color,box-shadow] duration-150',
                                  'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cyan-glow',
                                  review
                                    ? isCorrect
                                      ? 'border-emerald-500/60 text-ink'
                                      : isWrongPick
                                        ? 'border-crimson-aggro/60 text-ink'
                                        : 'border-line-subtle text-ink-muted'
                                    : selected
                                      ? 'border-transparent bg-surface-3 shadow-nav-current text-ink'
                                      : 'border-line-subtle text-ink-body hover:bg-surface-2 hover:border-line',
                                  grade && 'cursor-default',
                                )}
                              >
                                <input
                                  type="radio"
                                  name={question.id}
                                  className="sr-only"
                                  checked={selected}
                                  onChange={() => setAnswers((current) => ({ ...current, [question.id]: choiceIndex }))}
                                />
                                <span
                                  className={cn(
                                    'mt-0.5 flex w-4 h-4 shrink-0 items-center justify-center rounded-full border',
                                    selected ? 'border-cyan-glow' : 'border-line',
                                  )}
                                  aria-hidden="true"
                                >
                                  {selected ? <span className="w-2 h-2 rounded-full bg-cyan-glow" /> : null}
                                </span>
                                <span>{choice}</span>
                              </label>
                            )
                          })}
                        </div>
                        {review ? (
                          <p className={cn('text-xs leading-relaxed', review.correct ? 'text-emerald-500' : 'text-crimson-text')}>
                            {review.correct ? 'Correct.' : 'Not this one.'} <span className="text-ink-body">{review.explanation}</span>
                          </p>
                        ) : null}
                      </fieldset>
                    )
                  })}
                  <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-line-subtle">
                    {grade ? (
                      <>
                        <p className={cn('text-sm font-bold pt-3', grade.passed ? 'text-emerald-500' : 'text-ink')}>
                          Score: {grade.scorePercent}% ({grade.correctCount} of {grade.total}).
                        </p>
                        {!grade.passed ? (
                          <HudButton type="button" variant="secondary" className="mt-3" onClick={retryQuiz}>
                            Try again
                          </HudButton>
                        ) : null}
                      </>
                    ) : (
                      <HudButton
                        type="button"
                        variant="primary"
                        className="mt-3"
                        disabled={busy || !allAnswered || detail.questions.length === 0}
                        onClick={() => void submitQuiz()}
                      >
                        {busy ? 'Submitting…' : 'Submit quiz'}
                      </HudButton>
                    )}
                  </div>
                </section>
              ) : null}

              <nav
                className={cn(ACADEMY_CARD, 'p-2 flex items-center gap-2')}
                aria-label="Lesson navigation"
              >
                {detail.previousSlug ? (
                  <Link
                    to="/lectures/courses/$slug/lessons/$lessonSlug"
                    params={{ slug: detail.courseSlug, lessonSlug: detail.previousSlug }}
                    className={cn(academyButtonLink('secondary'), 'px-3 border-transparent bg-transparent')}
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sr-only sm:hidden">Previous lesson</span>
                  </Link>
                ) : null}
                <div className="flex-1 flex justify-center">
                  {detail.kind !== 'quiz' ? (
                    <HudButton
                      type="button"
                      variant={detail.completed ? 'ghost' : 'primary'}
                      disabled={busy || detail.completed}
                      onClick={() => void save('complete')}
                      icon={detail.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : undefined}
                    >
                      {detail.completed ? 'Lesson complete' : busy ? 'Saving…' : 'Mark complete'}
                    </HudButton>
                  ) : null}
                </div>
                {detail.nextSlug ? (
                  <Link
                    to="/lectures/courses/$slug/lessons/$lessonSlug"
                    params={{ slug: detail.courseSlug, lessonSlug: detail.nextSlug }}
                    className={academyButtonLink(detail.completed ? 'primary' : 'secondary')}
                  >
                    <span className="hidden sm:inline">Next lesson</span>
                    <span className="sm:hidden">Next</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <Link
                    to="/lectures/courses/$slug"
                    params={{ slug: detail.courseSlug }}
                    className={academyButtonLink('secondary')}
                  >
                    <span className="hidden sm:inline">Course overview</span>
                    <span className="sm:hidden">Overview</span>
                  </Link>
                )}
              </nav>

              <section className={cn(ACADEMY_CARD, 'p-4 space-y-2')}>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="lesson-note" className="text-[11px] uppercase tracking-[0.08em] text-ink-muted font-bold">
                    Your notes
                  </label>
                  <span
                    className={cn('text-[11px]', noteStatus === 'error' ? 'text-crimson-text' : noteStatus === 'saved' ? 'text-emerald-500' : 'text-ink-muted')}
                    aria-live="polite"
                  >
                    {NOTE_STATUS_LABEL[noteStatus]}
                  </span>
                </div>
                <textarea
                  id="lesson-note"
                  value={note}
                  onChange={(event) => {
                    setNote(event.target.value)
                    setNoteStatus('dirty')
                  }}
                  onBlur={() => void saveNote()}
                  rows={4}
                  className="w-full rounded-control bg-surface-2 border border-line text-sm text-ink p-3 outline-none placeholder:text-ink-muted hover:border-line-hover focus:border-cyan-glow focus:shadow-field-focus"
                  placeholder="Only you can see these. They save when you click away."
                />
              </section>
            </>
          )}
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-4">
          <div className={cn(ACADEMY_CARD, 'p-2 max-h-[calc(100dvh-8rem)] overflow-y-auto')}>{syllabus}</div>
        </aside>
      </div>

      <HudBottomSheet
        isOpen={syllabusOpen}
        onClose={() => setSyllabusOpen(false)}
        title="Syllabus"
        ariaLabel="Course syllabus"
        containerClassName="lg:hidden"
        className="p-2"
      >
        {syllabus}
      </HudBottomSheet>
    </div>
  )
}

function LessonSyllabus({
  lesson,
  completedCount,
  total,
  onNavigate,
}: {
  lesson: AcademyLessonDetail
  completedCount: number
  total: number
  onNavigate: () => void
}) {
  let number = 0
  return (
    <div className="space-y-3">
      <div className="px-2 pt-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-grotesk text-sm font-bold tracking-[0.08em] uppercase text-ink">Syllabus</h2>
          <span className="text-[11px] text-ink-muted tabular-nums">
            {completedCount} of {total} done
          </span>
        </div>
        {lesson.enrolled && total > 0 ? (
          <AcademyProgress percent={(completedCount / total) * 100} label="Course progress" compact />
        ) : null}
      </div>
      {lesson.modules.map((module) => (
        <div key={module.id} className="space-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted px-2 pt-1 pb-1">{module.title}</p>
          <ul className="space-y-0.5">
            {module.lessons.map((item) => {
              number += 1
              const active = item.slug === lesson.slug
              const open = lesson.enrolled || item.isPreview
              const status = item.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-label="Complete" />
              ) : open ? (
                <Circle className={cn('w-4 h-4 shrink-0', active ? 'text-cyan-glow' : 'text-line')} aria-hidden="true" />
              ) : (
                <Lock className="w-4 h-4 text-ink-muted shrink-0" aria-label="Enroll to open" />
              )
              return (
                <li key={item.slug}>
                  <Link
                    to="/lectures/courses/$slug/lessons/$lessonSlug"
                    params={{ slug: lesson.courseSlug, lessonSlug: item.slug }}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-start gap-2.5 rounded-control px-2 py-2 text-xs',
                      active ? 'bg-surface-3 shadow-nav-current text-ink font-bold' : 'text-ink-body hover:bg-surface-2 hover:text-ink',
                      ACADEMY_FOCUS,
                    )}
                  >
                    <span className="mt-0.5">{status}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block">{item.title}</span>
                      <span className="block text-[11px] font-normal text-ink-muted">
                        {number}. {lessonKindLabel(item.kind)} · {formatLessonDuration(item.durationSeconds)}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

