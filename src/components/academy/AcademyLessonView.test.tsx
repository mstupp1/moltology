import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { AcademyLessonDetail } from '@/lib/academy'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('token'),
}))

vi.mock('@/lib/server/academy-api', () => ({
  enrollAcademyCourseFn: vi.fn(),
  saveAcademyLessonFn: vi.fn(),
  submitAcademyQuizFn: vi.fn(),
}))

import { submitAcademyQuizFn } from '@/lib/server/academy-api'
import { AcademyLessonView } from './AcademyLessonView'

const lesson: AcademyLessonDetail = {
  courseSlug: 'introduction-to-ecdysis',
  courseTitle: 'Introduction to Ecdysis',
  courseCode: 'MOLT-101',
  enrolled: true,
  locked: false,
  slug: 'first-shed-check',
  title: 'First shed check',
  summary: 'Three questions.',
  kind: 'quiz',
  durationSeconds: 360,
  videoUrl: null,
  videoProvider: null,
  posterUrl: null,
  body: null,
  isPreview: false,
  passingScore: 67,
  completed: false,
  lastPositionSeconds: 0,
  quizScore: null,
  quizPassed: false,
  note: '',
  questions: [
    { id: 'q1', prompt: 'What counts as a useful first shed?', choices: ['A new name', 'One habit you can stop this week'] },
    { id: 'q2', prompt: 'Why leave the rest of the pile alone?', choices: ['So it can harden', 'So nobody notices'] },
  ],
  modules: [
    {
      id: 'mod',
      title: 'The first shed',
      summary: '',
      sortOrder: 1,
      lessons: [
        {
          slug: 'first-shed-check',
          title: 'First shed check',
          summary: '',
          kind: 'quiz',
          durationSeconds: 360,
          isPreview: false,
          completed: false,
          sortOrder: 1,
        },
      ],
    },
  ],
  previousSlug: 'what-to-put-down-this-week',
  nextSlug: null,
}

describe('AcademyLessonView quiz', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps submit disabled until every question has an answer, then shows the score', async () => {
    vi.mocked(submitAcademyQuizFn).mockResolvedValue({
      lesson: { ...lesson, completed: true, quizPassed: true, quizScore: 100 },
      grade: {
        scorePercent: 100,
        correctCount: 2,
        total: 2,
        passed: true,
        results: [
          { id: 'q1', selectedIndex: 1, correctIndex: 1, correct: true, explanation: 'The first shell is one concrete stop.' },
          { id: 'q2', selectedIndex: 0, correctIndex: 0, correct: true, explanation: 'A small shed needs room.' },
        ],
      },
      awardedCredentialIds: [],
    })

    render(<AcademyLessonView lesson={lesson} />)
    const submit = screen.getByRole('button', { name: 'Submit quiz' })
    expect(submit).toBeDisabled()

    fireEvent.click(screen.getByLabelText('One habit you can stop this week'))
    expect(submit).toBeDisabled()
    fireEvent.click(screen.getByLabelText('So it can harden'))
    expect(submit).toBeEnabled()
    fireEvent.click(submit)

    expect(await screen.findByText(/Score: 100%/)).toBeInTheDocument()
    expect(screen.getByText(/The first shell is one concrete stop/)).toBeInTheDocument()
    expect(submitAcademyQuizFn).toHaveBeenCalled()
  })

  it('asks a visitor to enroll before a locked lesson opens', () => {
    render(<AcademyLessonView lesson={{ ...lesson, locked: true, enrolled: false, questions: [] }} />)
    expect(screen.getByText('Enroll in this course to open the lesson.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enroll' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit quiz' })).not.toBeInTheDocument()
  })
})
