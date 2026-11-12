import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ACADEMY_COPY, type AcademyCourseDetail } from '@/lib/academy'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params: _params, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))
vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: vi.fn().mockResolvedValue('token') }))
vi.mock('@/lib/server/academy-api', () => ({ enrollAcademyCourseFn: vi.fn() }))
let session: { userId: string | null; isPending: boolean } = { userId: null, isPending: false }
vi.mock('@/hooks/useAuthSession', () => ({ useAuthSession: () => session }))
vi.mock('@/components/AuthModal', () => ({
  AuthModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div role="dialog" aria-label="Sign up" /> : null),
}))

import { enrollAcademyCourseFn } from '@/lib/server/academy-api'
import { AcademyCourseView } from './AcademyCourseView'

const course: AcademyCourseDetail = {
  slug: 'introduction-to-ecdysis',
  code: 'MOLT-101',
  title: 'Introduction to Ecdysis',
  subtitle: 'The first shed',
  description: 'Start here.',
  category: 'Foundations',
  level: 'beginner',
  instructorName: 'Laya',
  instructorTitle: 'Instructor',
  estimatedMinutes: 40,
  outcomes: ['Name one habit to drop'],
  coverImageUrl: null,
  enrolled: false,
  completed: false,
  progressPercent: 0,
  resumeLessonSlug: null,
  modules: [
    {
      id: 'mod',
      title: 'The first shed',
      summary: '',
      sortOrder: 1,
      lessons: [
        { slug: 'what-to-put-down', title: 'What to put down', summary: '', kind: 'reading', durationSeconds: 300, isPreview: true, completed: false, sortOrder: 1 },
      ],
    },
  ],
  tracks: [],
  certificate: null,
}

describe('AcademyCourseView enroll', () => {
  beforeEach(() => vi.mocked(enrollAcademyCourseFn).mockReset())

  it('sends a guest to sign up instead of enrolling', () => {
    session = { userId: null, isPending: false }
    render(<AcademyCourseView course={course} />)
    expect(screen.getByText(ACADEMY_COPY.guestEnrollNote)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: ACADEMY_COPY.guestEnroll }))
    expect(screen.getByRole('dialog', { name: 'Sign up' })).toBeInTheDocument()
    expect(enrollAcademyCourseFn).not.toHaveBeenCalled()
  })

  it('enrolls a member', async () => {
    session = { userId: 'user-1', isPending: false }
    vi.mocked(enrollAcademyCourseFn).mockResolvedValue({ ...course, enrolled: true })
    render(<AcademyCourseView course={course} />)
    fireEvent.click(screen.getByRole('button', { name: 'Enroll' }))
    await waitFor(() => expect(enrollAcademyCourseFn).toHaveBeenCalled())
  })
})
