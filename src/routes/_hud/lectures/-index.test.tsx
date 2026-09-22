import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ACADEMY_COPY, assembleAcademyHome, type AcademyHomePayload } from '@/lib/academy'
import { ACADEMY_COURSES, ACADEMY_TRACKS } from '@/lib/academy-catalog'
import { clearCachedUser } from '@/lib/auth-session'

const mockUseLoaderData = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    options: config,
    useLoaderData: () => mockUseLoaderData(),
  }),
  Link: ({ children, to, params, ...props }: any) => (
    <a href={typeof params?.slug === 'string' ? `${to}/${params.slug}` : to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

vi.mock('@/lib/server/academy-api', () => ({
  getAcademyHomeFn: vi.fn(),
  enrollAcademyCourseFn: vi.fn(),
}))

import { authClient } from '@/lib/auth-client'
import { Route } from './index'

function homeFixture(): AcademyHomePayload {
  return assembleAcademyHome({
    tracks: ACADEMY_TRACKS.map((track) => ({
      id: track.id,
      slug: track.slug,
      title: track.title,
      subtitle: track.subtitle,
      description: track.description,
      level: track.level,
      estimatedHours: track.estimatedHours,
      outcomes: track.outcomes,
      coverImageUrl: track.coverImageUrl,
      sortOrder: track.sortOrder,
    })),
    courses: ACADEMY_COURSES.map((course) => ({
      id: course.id,
      slug: course.slug,
      code: course.code,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      category: course.category,
      level: course.level,
      instructorName: course.instructorName,
      instructorTitle: course.instructorTitle,
      estimatedMinutes: course.estimatedMinutes,
      outcomes: course.outcomes,
      coverImageUrl: course.coverImageUrl,
      sortOrder: course.sortOrder,
    })),
    links: ACADEMY_TRACKS.flatMap((track) =>
      track.courseIds.map((courseId, index) => ({
        trackId: track.id,
        courseId,
        sortOrder: index + 1,
        required: true,
      })),
    ),
    modules: [],
    lessons: ACADEMY_COURSES.flatMap((course) =>
      course.modules.flatMap((module) =>
        module.lessons.map((lesson, index) => ({
          id: lesson.id,
          courseId: course.id,
          moduleId: module.id,
          slug: lesson.slug,
          title: lesson.title,
          summary: lesson.summary,
          kind: lesson.kind,
          durationSeconds: lesson.durationSeconds,
          videoUrl: null,
          videoProvider: null,
          posterUrl: null,
          body: null,
          isPreview: Boolean(lesson.isPreview),
          passingScore: 80,
          sortOrder: index + 1,
        })),
      ),
    ),
    certificates: ACADEMY_COURSES.map((course) => ({
      id: course.certificate.id,
      slug: course.certificate.slug,
      scope: 'course' as const,
      courseId: course.id,
      trackId: null,
      title: course.certificate.title,
      description: course.certificate.description,
    })),
    enrollments: [],
    progress: [],
    awards: [],
  })
}

describe('Molt Academy home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearCachedUser()
    mockUseLoaderData.mockReturnValue({ home: homeFixture() })
  })

  it('locks the academy for a guest', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
    const Page = Route.options.component!
    render(<Page />)
    expect(screen.getByText('MOLT ACADEMY LOCKED')).toBeInTheDocument()
    expect(screen.getByText(ACADEMY_COPY.guestLock)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SIGN UP TO UNLOCK/i })).toBeInTheDocument()
  })

  it('lets a member explore tracks, filter courses, and open certifications', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
      isPending: false,
    } as any)
    const Page = Route.options.component!
    render(<Page />)

    expect(screen.queryByText('MOLT ACADEMY LOCKED')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /learn the molt in order/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'First Shell' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Abyssal Systems' })).toBeInTheDocument()
    expect(screen.getByText('Introduction to Ecdysis')).toBeInTheDocument()
    expect(screen.getByText('Deep Benthic Systems')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Advanced' }))
    expect(screen.getByText('Deep Benthic Systems')).toBeInTheDocument()
    expect(screen.queryByText('Introduction to Ecdysis')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'All levels' }))
    fireEvent.change(screen.getByPlaceholderText('Search by title, code, or instructor'), {
      target: { value: 'MOLT-104' },
    })
    expect(screen.getByText('The Chitinous Mind')).toBeInTheDocument()
    expect(screen.queryByText('Biomechanical Armor')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open certification record/i })).toHaveAttribute('href', '/lectures/certificates')
  })
})
